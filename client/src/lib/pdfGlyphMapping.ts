import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

/**
 * Read-only, bounded font inspection for a future glyph-aware editing engine.
 * ToUnicode is an extraction map, NOT proof that a glyph is available for writing.
 */
export interface PdfGlyphFontReport {
  resource: string;
  baseFont: string;
  subtype: string;
  encoding: string;
  subset: boolean;
  embedded: boolean;
  hasToUnicode: boolean;
  mappedCodes: number;
  mappedUnicodeCharacters: number;
  mappingStatus: "parsed" | "absent" | "unsupported";
  editStatus: "standard-font-candidate" | "glyph-aware-engine-required";
  reason: string;
}

const MAX_PDF_BYTES = 24 * 1024 * 1024;
const MAX_CMAP_BYTES = 128 * 1024;
const MAX_CMAP_ENTRIES = 8192;
const MAX_FONTS = 64;
const name = (value: unknown): string =>
  value instanceof PDFName ? value.asString().replace(/^\//, "") : "";
const hexToBytes = (hex: string): Uint8Array => {
  if (!hex || hex.length % 2 || /[^0-9a-f]/i.test(hex)) throw new Error("Invalid CMap hex sequence");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return bytes;
};
const unicodeFromHex = (hex: string): string => {
  const bytes = hexToBytes(hex);
  if (bytes.length % 2) throw new Error("ToUnicode must contain UTF-16BE pairs");
  const decoded = new TextDecoder("utf-16be", { fatal: true }).decode(bytes);
  if (!decoded || decoded.includes("\uFFFD")) throw new Error("Invalid Unicode mapping");
  return decoded;
};

/** CMap parsing deliberately supports only canonical explicit bfchar pairs.
 * Anything involving ranges, usecmap, nonstandard codespaces or token mixing
 * is reported unsupported, not guessed.
 */
export function inspectExplicitToUnicodeCMap(source: string): {
  mappedCodes: number;
  mappedUnicodeCharacters: number;
  status: "parsed" | "unsupported";
} {
  try {
    if (source.length > MAX_CMAP_BYTES ||
        /\b(?:usecmap|beginbfrange|begincidrange|begincidchar|beginnotdefrange)\b/i.test(source)) {
      throw new Error("Complex CMap");
    }
    const sections = [...source.matchAll(/(\d+)\s+beginbfchar\b([\s\S]*?)\bendbfchar/g)];
    if (!sections.length) throw new Error("No explicit bfchar mappings");
    const seen = new Map<string, string>();
    for (const section of sections) {
      const count = Number(section[1]);
      if (!Number.isSafeInteger(count) || count > MAX_CMAP_ENTRIES) throw new Error("Large CMap");
      const body = section[2].replace(/%[^\r\n]*/g, "");
      const pairs = [...body.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)];
      const leftover = body.replace(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g, "").trim();
      if (leftover || pairs.length !== count || seen.size + pairs.length > MAX_CMAP_ENTRIES) {
        throw new Error("Ambiguous bfchar data");
      }
      for (const pair of pairs) {
        const code = pair[1].toUpperCase();
        if (code.length !== 2 && code.length !== 4) throw new Error("Unsupported code width");
        const mapped = unicodeFromHex(pair[2]);
        if (seen.has(code) && seen.get(code) !== mapped) throw new Error("Duplicate code mapping");
        seen.set(code, mapped);
      }
    }
    return {
      mappedCodes: seen.size,
      mappedUnicodeCharacters: Array.from(seen.values()).reduce(
        (total, value) => total + [...value].length, 0),
      status: "parsed",
    };
  } catch {
    return { mappedCodes: 0, mappedUnicodeCharacters: 0, status: "unsupported" };
  }
}

async function decodedCMapBytes(stream: PDFRawStream): Promise<Uint8Array> {
  const contents = stream.getContents();
  const filter = stream.dict.get(PDFName.of("Filter"));
  if (stream.dict.get(PDFName.of("DecodeParms")) ||
      (filter && name(filter) !== "FlateDecode")) {
    throw new Error("Unsupported CMap filter");
  }
  if (!filter) {
    if (contents.length > MAX_CMAP_BYTES) throw new Error("Large CMap");
    return contents;
  }
  if (typeof DecompressionStream === "undefined") throw new Error("No decompressor");
  const reader = new Blob([contents]).stream()
    .pipeThrough(new DecompressionStream("deflate")).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_CMAP_BYTES) throw new Error("Expanded CMap too large");
      chunks.push(next.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function embeddedFont(doc: PDFDocument, font: PDFDict): boolean {
  const descendants = font.lookup(PDFName.of("DescendantFonts"));
  const descendant = descendants instanceof PDFArray && descendants.size() > 0
    ? doc.context.lookup(descendants.get(0))
    : undefined;
  const actual = descendant instanceof PDFDict ? descendant : font;
  const descriptor = actual.lookup(PDFName.of("FontDescriptor"));
  if (!(descriptor instanceof PDFDict)) return false;
  return ["FontFile", "FontFile2", "FontFile3"].some(
    (key) => Boolean(descriptor.get(PDFName.of(key))));
}

export async function inspectPdfGlyphFonts(
  source: Uint8Array,
  pageIndex: number,
): Promise<PdfGlyphFontReport[]> {
  if (source.byteLength > MAX_PDF_BYTES) throw new Error("PDF too large for font inspection.");
  const document = await PDFDocument.load(source.slice());
  if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= document.getPageCount()) {
    throw new Error("Invalid PDF page.");
  }
  const page = document.getPage(pageIndex);
  const resources = document.context.lookup(
    page.node.getInheritableAttribute(PDFName.of("Resources")));
  if (!(resources instanceof PDFDict)) return [];
  const fonts = resources.lookup(PDFName.of("Font"));
  if (!(fonts instanceof PDFDict)) return [];
  const entries = fonts.entries();
  if (entries.length > MAX_FONTS) throw new Error("Too many font resources to inspect.");
  const report: PdfGlyphFontReport[] = [];
  for (const [resource, fontRef] of entries) {
    const font = document.context.lookup(fontRef);
    if (!(font instanceof PDFDict)) continue;
    const baseFont = name(font.get(PDFName.of("BaseFont")));
    const subtype = name(font.get(PDFName.of("Subtype")));
    const encoding = name(font.get(PDFName.of("Encoding"))) || "implicit/custom";
    const subset = /^[A-Z]{6}\+/.test(baseFont);
    const embedded = embeddedFont(document, font);
    const cmapObject = document.context.lookup(font.get(PDFName.of("ToUnicode")));
    const hasToUnicode = Boolean(font.get(PDFName.of("ToUnicode")));
    let mappingStatus: PdfGlyphFontReport["mappingStatus"] = hasToUnicode ? "unsupported" : "absent";
    let mappedCodes = 0;
    let mappedUnicodeCharacters = 0;
    if (cmapObject instanceof PDFRawStream) {
      try {
        const decoded = await decodedCMapBytes(cmapObject);
        const mapping = inspectExplicitToUnicodeCMap(
          new TextDecoder("latin1").decode(decoded));
        mappingStatus = mapping.status;
        mappedCodes = mapping.mappedCodes;
        mappedUnicodeCharacters = mapping.mappedUnicodeCharacters;
      } catch {
        mappingStatus = "unsupported";
      }
    }
    const standardFont = [
      "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique",
      "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic",
      "Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique",
      "Symbol", "ZapfDingbats",
    ].includes(baseFont);
    const candidate = subtype === "Type1" && standardFont && !subset &&
      !embedded && !hasToUnicode && (!font.get(PDFName.of("Encoding")) ||
      encoding === "WinAnsiEncoding");
    report.push({
      resource: name(resource), baseFont, subtype, encoding, subset, embedded,
      hasToUnicode, mappedCodes, mappedUnicodeCharacters, mappingStatus,
      editStatus: candidate ? "standard-font-candidate" : "glyph-aware-engine-required",
      reason: candidate
        ? "Standard font: may qualify for the restricted text-stream editor after operator/layout checks."
        : hasToUnicode
          ? "ToUnicode only explains extraction; replacement additionally requires verified glyph outlines, code widths and layout."
          : "No verified write-side glyph mapping. Native replacement is disabled for this resource.",
    });
  }
  return report;
}
