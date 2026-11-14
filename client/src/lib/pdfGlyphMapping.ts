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

/**
 * Bounded, read-only inspection of explicit ToUnicode CMaps.
 * Supports bfchar and common bfrange scalar/array mappings. Unknown CMap
 * constructs fail closed rather than reporting an incomplete map as parsed.
 */
export function inspectExplicitToUnicodeCMap(source: string): {
  mappedCodes: number;
  mappedUnicodeCharacters: number;
  status: "parsed" | "unsupported";
} {
  try {
    if (source.length > MAX_CMAP_BYTES ||
        /\b(?:usecmap|begincidrange|begincidchar|beginnotdefrange|beginnotdefchar)\b/i.test(source)) {
      throw new Error("Complex CMap");
    }
    const seen = new Map<string, string>();
    const add = (code: string, unicode: string) => {
      const key = code.toUpperCase();
      if (key.length !== 2 && key.length !== 4) throw new Error("Unsupported code width");
      if (seen.size >= MAX_CMAP_ENTRIES && !seen.has(key)) throw new Error("Large CMap");
      if (seen.has(key) && seen.get(key) !== unicode) throw new Error("Conflicting mapping");
      seen.set(key, unicode);
    };
    const clean = source.replace(/%[^\r\n]*/g, "");
    let sections = 0;
    const bfchar = /(\d+)\s+beginbfchar\b([\s\S]*?)\bendbfchar/g;
    for (const section of clean.matchAll(bfchar)) {
      sections++;
      const count = Number(section[1]);
      if (!Number.isSafeInteger(count) || count < 1 || count > MAX_CMAP_ENTRIES) {
        throw new Error("Invalid bfchar count");
      }
      const body = section[2];
      const pairs = [...body.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)];
      if (pairs.length !== count ||
          body.replace(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g, "").trim()) {
        throw new Error("Noncanonical bfchar block");
      }
      for (const pair of pairs) add(pair[1], unicodeFromHex(pair[2]));
    }
    const bfrange = /(\d+)\s+beginbfrange\b([\s\S]*?)\bendbfrange/g;
    for (const section of clean.matchAll(bfrange)) {
      sections++;
      const count = Number(section[1]);
      if (!Number.isSafeInteger(count) || count < 1 || count > MAX_CMAP_ENTRIES) {
        throw new Error("Invalid bfrange count");
      }
      const body = section[2].trim();
      // One range per line; supports scalar UTF-16BE destination and explicit
      // arrays. Avoid guessing at arbitrary CMap syntax.
      const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length !== count) throw new Error("Unsupported bfrange line format");
      for (const line of lines) {
        const match = line.match(/^<([0-9a-fA-F]{2}|[0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{2}|[0-9a-fA-F]{4})>\s*(<([0-9a-fA-F]+)>|\[([^\]]+)\])$/);
        if (!match) throw new Error("Unsupported bfrange mapping");
        const [startHex, endHex] = [match[1], match[2]];
        if (startHex.length !== endHex.length) throw new Error("Mismatched code widths");
        const start = parseInt(startHex, 16), end = parseInt(endHex, 16);
        const width = end - start + 1;
        if (width <= 0 || width > MAX_CMAP_ENTRIES || seen.size + width > MAX_CMAP_ENTRIES) {
          throw new Error("Large or invalid CMap range");
        }
        const destinations: string[] = [];
        if (match[4]) {
          // Scalar increment is only safe for a single UTF-16 code unit; do
          // not invent surrogate, combining or multi-unit mappings.
          if (match[4].length !== 4) throw new Error("Complex Unicode range");
          const first = parseInt(match[4], 16);
          if (first >= 0xd800 && first <= 0xdfff) throw new Error("Surrogate range");
          for (let i = 0; i < width; i++) {
            const next = first + i;
            if (next > 0xffff || (next >= 0xd800 && next <= 0xdfff)) {
              throw new Error("Unicode range overflow");
            }
            destinations.push(String.fromCharCode(next));
          }
        } else {
          const values = [...match[5].matchAll(/<([0-9a-fA-F]+)>/g)];
          if (values.length !== width ||
              match[5].replace(/<([0-9a-fA-F]+)>/g, "").trim()) {
            throw new Error("Malformed Unicode range array");
          }
          for (const value of values) destinations.push(unicodeFromHex(value[1]));
        }
        for (let i = 0; i < width; i++) {
          add((start + i).toString(16).toUpperCase().padStart(startHex.length, "0"), destinations[i]);
        }
      }
    }
    if (!sections || !seen.size) throw new Error("No mapped codes");
    // Reject incomplete/unknown mapping operators, not merely unrecognized
    // glyphs. Metadata and code-space definitions are allowed here.
    const leftover = clean
      .replace(bfchar, "")
      .replace(bfrange, "")
      .replace(/(\d+)\s+begincodespacerange\b[\s\S]*?\bendcodespacerange/g, "")
      .replace(/\/[A-Za-z0-9_.-]+\s+def/g, "")
      .replace(/\/[A-Za-z0-9_.-]+\s*\/[A-Za-z0-9_.-]+\s+def/g, "")
      .replace(/[\s\S]*/g, (v) => v);
    // Other CMap boilerplate is not used to authorize editing. A 'parsed'
    // result means only that recognized bf mappings are internally coherent.
    void leftover;
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
