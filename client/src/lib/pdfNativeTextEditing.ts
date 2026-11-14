import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFStream,
  StandardFonts,
} from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { ensurePdfWorkerConfigured } from "./pdfWorkerSetup";

export class NativeTextUnsupportedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "NativeTextUnsupportedError";
  }
}

export interface NativeTextResult {
  bytes: Uint8Array;
  originalText: string;
  replacementText: string;
  pageIndex: number;
  fontName: string;
  fontSize: number;
}

type SimpleStream = {
  original: string;
  encodedText: string;
  operand: string;
  textOperator: "Tj" | "TJ";
  fontResource: string;
  fontSize: number;
};

const unsupported = (reason: string): never => {
  throw new NativeTextUnsupportedError(reason);
};
const DECIMAL = "-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
const RGB = new RegExp(`^${DECIMAL}\\s+${DECIMAL}\\s+${DECIMAL}\\s+(?:rg|RG)$`);
const CMYK = new RegExp(`^${DECIMAL}\\s+${DECIMAL}\\s+${DECIMAL}\\s+${DECIMAL}\\s+(?:k|K)$`);
const MATRIX = new RegExp(`^1\\s+0\\s+0\\s+1\\s+${DECIMAL}\\s+${DECIMAL}\\s+Tm$`);
const MOVE = new RegExp(`^${DECIMAL}\\s+${DECIMAL}\\s+Td$`);
const FONT = /^\/([A-Za-z0-9_.-]+)\s+(\d+(?:\.\d+)?)\s+Tf$/;
const SHOW = /^\(([A-Za-z0-9 .,!?'\/-]+)\)\s+Tj$/;
const HEX_SHOW = /^<([0-9a-fA-F]+)>\s+Tj$/;
const ARRAY_SHOW = /^(\[[^\[\]\\\r\n]*\])\s+TJ$/;
const pdfName = (name: PDFName): string => name.asString().replace(/^\//, "");
const encodeHex = (value: string): string =>
  Array.from(value).map((character) => character.charCodeAt(0).toString(16).padStart(2, "0")).join("").toUpperCase();
const decodeHex = (value: string): string =>
  value.match(/.{2}/g)?.map((byte) => String.fromCharCode(parseInt(byte, 16))).join("") ?? "";
const ONE_NUMBER = new RegExp(`^${DECIMAL}\\s+(?:TL|g|G)$`);
const ZERO_ADJUSTMENT = /^[+-]?(?:0+(?:\.0*)?|\.0+)$/;

/** Segmented TJ arrays are safe to combine only when spacing adjustments are zero. */
function parseZeroKerningTj(operand: string): string {
  if (!operand.startsWith("[") || !operand.endsWith("]")) {
    unsupported("Invalid text array.");
  }
  const body = operand.slice(1, -1);
  const tokenPattern = /\([A-Za-z0-9 .,!?'\/-]+\)|<[0-9a-fA-F]+>|[+-]?(?:\d+(?:\.\d+)?|\.\d+)/g;
  let end = 0;
  let text = "";
  let segments = 0;
  for (const match of body.matchAll(tokenPattern)) {
    if (body.slice(end, match.index).trim()) unsupported("Unsupported TJ array token or PDF escape.");
    const token = match[0];
    if (token.startsWith("(")) {
      text += token.slice(1, -1);
      segments++;
    } else if (token.startsWith("<")) {
      const hex = token.slice(1, -1);
      if (hex.length % 2) unsupported("Invalid odd-length hex glyph sequence.");
      text += decodeHex(hex);
      segments++;
    } else if (!ZERO_ADJUSTMENT.test(token)) {
      unsupported("Nonzero TJ kerning adjustments are unsupported.");
    }
    end = match.index + token.length;
  }
  if (body.slice(end).trim() || segments === 0 || segments > 32 || text.length > 2000) {
    unsupported("Invalid or oversized TJ array.");
  }
  return text;
}

const ASCII = /^[\x20-\x7e]+$/;
const MAX_STREAM = 128 * 1024;
const MAX_DOCUMENT = 12 * 1024 * 1024;

async function decodeSimplePageStream(raw: PDFRawStream): Promise<Uint8Array> {
  if (raw.dict.get(PDFName.of("DecodeParms"))) {
    unsupported("Streams with custom decompression parameters are unsupported.");
  }
  const filter = raw.dict.get(PDFName.of("Filter"));
  if (!filter) return raw.getContents();
  if (!(filter instanceof PDFName) || pdfName(filter) !== "FlateDecode") {
    unsupported("Only plain or single FlateDecode content streams are supported.");
  }
  if (typeof DecompressionStream === "undefined") {
    unsupported("This browser does not support local FlateDecode decompression.");
  }
  // A 128 KiB decompressed stream is the maximum allowed. Abort reading
  // immediately when expansion crosses that limit (zip-bomb protection).
  const response = new Response(new Blob([raw.getContents()]).stream().pipeThrough(new DecompressionStream("deflate")));
  const reader = response.body?.getReader();
  if (!reader) unsupported("Cannot decode this PDF stream locally.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_STREAM) unsupported("Decompressed page stream exceeds the safe edit limit.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

/**
 * A deliberately narrow, **real page-content edit**. We replace a literal
 * Tj operand in an uncompressed, single-stream, single-text-run page.
 * Content is not covered by a white rectangle and the old text operand
 * is not copied into the new stream. Everything outside that one operand
 * must remain byte-for-byte identical within the stream.
 *
 * Unsupported PDFs fail closed; there is no visual overlay fallback.
 */
function inspectSimpleStream(streamBytes: Uint8Array, expectedText: string): SimpleStream {
  if (streamBytes.length > MAX_STREAM) unsupported("Page text content exceeds native edit limits.");
  if (streamBytes.some((byte) => byte > 127 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13))) {
    unsupported("The page content stream is not plain ASCII.");
  }
  const original = new TextDecoder("utf-8", { fatal: true }).decode(streamBytes);
  const lines = original.split(/\r?\n/);
  let textOpen = false;
  let begins = 0;
  let ends = 0;
  let selected: SimpleStream | null = null;
  let selectedCount = 0;
  let currentResource = "";
  let currentSize = 0;
  let currentTextCount = 0;
  let hasAbsolutePosition = false;
  let graphicsDepth = 0;

  for (const line of lines) {
    const op = line.trim();
    if (!op) continue;
    if (op === "q") {
      if (textOpen) unsupported("Graphics state changes inside text are unsupported.");
      graphicsDepth++;
    } else if (op === "Q") {
      if (textOpen || graphicsDepth === 0) unsupported("Unbalanced graphics state changes.");
      graphicsDepth--;
    } else if (op === "BT") {
      if (textOpen || ++begins > 20) unsupported("Too many or nested text objects.");
      textOpen = true;
      currentResource = "";
      currentSize = 0;
      currentTextCount = 0;
      hasAbsolutePosition = false;
    } else if (op === "ET") {
      if (!textOpen || currentTextCount !== 1 || !hasAbsolutePosition) {
        unsupported("Each text object must have exactly one run and an absolute position.");
      }
      textOpen = false;
      ends++;
    } else if (FONT.test(op) && textOpen) {
      const match = op.match(FONT)!;
      if (currentResource) unsupported("Multiple font selections in one text object.");
      currentResource = match[1];
      currentSize = Number(match[2]);
      if (!Number.isFinite(currentSize) || currentSize <= 0 || currentSize > 300) {
        unsupported("Invalid font size.");
      }
    } else if (MATRIX.test(op) && textOpen) {
      if (hasAbsolutePosition || currentTextCount) unsupported("Multiple text positions in one run.");
      hasAbsolutePosition = true;
    } else if ((SHOW.test(op) || HEX_SHOW.test(op) || ARRAY_SHOW.test(op)) && textOpen) {
      if (!currentResource || !hasAbsolutePosition || ++currentTextCount !== 1) {
        unsupported("Text must be one run with an explicit font and absolute position.");
      }
      const literal = op.match(SHOW);
      const hex = op.match(HEX_SHOW);
      const array = op.match(ARRAY_SHOW);
      const arrayOperand = array?.[1];
      const hexValue = hex?.[1];
      if (hexValue && hexValue.length % 2 !== 0) unsupported("Odd-length hexadecimal text operand.");
      const text = literal?.[1] ??
        (hexValue !== undefined ? decodeHex(hexValue) :
          arrayOperand !== undefined ? parseZeroKerningTj(arrayOperand) : "");
      if (text === expectedText) {
        selectedCount++;
        selected = {
          original,
          encodedText: text,
          operand: arrayOperand ??
            (literal ? `(${literal[1]})` : `<${hexValue}>`),
          textOperator: array ? "TJ" : "Tj",
          fontResource: currentResource,
          fontSize: currentSize,
        };
      }
    } else if (textOpen && (RGB.test(op) || CMYK.test(op) || ONE_NUMBER.test(op))) {
      // Only harmless formatting instructions are retained verbatim.
    } else {
      unsupported("The page uses unsupported operators, positions, or embedded graphics.");
    }
  }
  if (textOpen || graphicsDepth !== 0 || begins === 0 || begins !== ends ||
      selectedCount !== 1 || !selected) {
    unsupported("Expected one unambiguous source run among independently positioned text objects.");
  }
  return selected;
}

async function readPageText(bytes: Uint8Array, pageIndex: number): Promise<string> {
  ensurePdfWorkerConfigured();
  const task = pdfjsLib.getDocument({ data: bytes.slice() });
  try {
    const doc = await task.promise;
    const page = await doc.getPage(pageIndex + 1);
    const text = await page.getTextContent();
    return text.items.filter((item) => "str" in item).map((item) => "str" in item ? item.str : "").join("");
  } finally {
    await task.destroy();
  }
}

export async function replaceSimpleNativePdfText(
  input: Uint8Array,
  pageIndex: number,
  expectedText: string,
  replacementText: string,
): Promise<NativeTextResult> {
  if (input.length > MAX_DOCUMENT) unsupported("Native text editing is limited to PDFs up to 12 MB.");
  if (!Number.isInteger(pageIndex) || pageIndex < 0) unsupported("Invalid page index.");
  if (!expectedText || expectedText.length > 2000 || !ASCII.test(expectedText)) {
    unsupported("Original text must be a short, printable ASCII run.");
  }
  if (!replacementText || replacementText.length > 2000 || !ASCII.test(replacementText) ||
      /[()\\]/.test(replacementText)) {
    unsupported("Replacement must use simple ASCII without PDF escape characters.");
  }

  const doc = await PDFDocument.load(input.slice());
  if (pageIndex >= doc.getPageCount()) unsupported("Page no longer exists.");
  if (doc.getForm().getFields().length) unsupported("PDFs containing interactive form fields are not supported in this mode.");
  if (doc.catalog.get(PDFName.of("Perms"))) {
    unsupported("PDFs with document permissions/signature restrictions are not supported.");
  }
  const page = doc.getPage(pageIndex);
  if (page.getRotation().angle !== 0) unsupported("Rotated pages are not supported.");
  const crop = page.getCropBox();
  const media = page.getMediaBox();
  if ([crop.x, crop.y, crop.width, crop.height].some((v, i) =>
    v !== [media.x, media.y, media.width, media.height][i])) {
    unsupported("Cropped pages are not supported.");
  }
  if (page.node.Annots()?.size()) unsupported("Pages with annotations are not supported.");

  const contentsRef = page.node.get(PDFName.of("Contents"));
  const contents = doc.context.lookup(contentsRef);
  let raw: PDFRawStream | undefined;
  let originalRef: PDFRef | undefined;
  if (contents instanceof PDFRawStream) {
    raw = contents;
    if (contentsRef instanceof PDFRef) originalRef = contentsRef;
  } else if (contents instanceof PDFArray && contents.size() === 1) {
    const ref = contents.get(0);
    const item = doc.context.lookup(ref);
    if (item instanceof PDFRawStream) {
      raw = item;
      if (ref instanceof PDFRef) originalRef = ref;
    }
  }
  if (!raw) unsupported("Page must contain exactly one raw content stream.");
  const decoded = await decodeSimplePageStream(raw);
  const parsed = inspectSimpleStream(decoded, expectedText);

  const inherited = page.node.getInheritableAttribute(PDFName.of("Resources"));
  const resources = doc.context.lookup(inherited);
  if (!(resources instanceof PDFDict)) unsupported("The page has no usable font resources.");
  const fontDict = resources.lookup(PDFName.of("Font"));
  if (!(fontDict instanceof PDFDict)) unsupported("The page has no usable font dictionary.");
  const sourceFont = doc.context.lookup(fontDict.get(PDFName.of(parsed.fontResource)));
  if (!(sourceFont instanceof PDFDict)) unsupported("The selected font resource is missing.");
  const subtype = sourceFont.get(PDFName.of("Subtype"));
  const baseFont = sourceFont.get(PDFName.of("BaseFont"));
  if (!(subtype instanceof PDFName) || pdfName(subtype) !== "Type1" ||
      !(baseFont instanceof PDFName)) {
    unsupported("Only simple standard Type1 fonts are supported.");
  }
  if (sourceFont.get(PDFName.of("ToUnicode")) ||
      sourceFont.get(PDFName.of("Differences")) ||
      sourceFont.get(PDFName.of("Widths"))) {
    unsupported("Custom font mappings and widths are unsupported.");
  }
  const encoding = sourceFont.get(PDFName.of("Encoding"));
  if (encoding && (!(encoding instanceof PDFName) || pdfName(encoding) !== "WinAnsiEncoding")) {
    unsupported("Non-WinAnsi font encodings are not supported.");
  }
  const fontName = pdfName(baseFont);
  const allowed = Object.values(StandardFonts) as string[];
  if (!allowed.includes(fontName)) unsupported("The PDF uses a custom or subset font.");
  const metricFont = await doc.embedFont(fontName as StandardFonts);
  const originalWidth = metricFont.widthOfTextAtSize(expectedText, parsed.fontSize);
  const replacementWidth = metricFont.widthOfTextAtSize(replacementText, parsed.fontSize);
  if (replacementWidth > originalWidth + 0.01) {
    unsupported("Replacement text is wider than the existing run; layout preservation cannot be guaranteed.");
  }

  const extractedBefore = await readPageText(input, pageIndex);
  const at = extractedBefore.indexOf(expectedText);
  if (at < 0 || extractedBefore.indexOf(expectedText, at + expectedText.length) !== -1) {
    unsupported("PDF.js cannot identify the original text uniquely on this page.");
  }
  const expectedAfter = extractedBefore.slice(0, at) +
    replacementText + extractedBefore.slice(at + expectedText.length);
  const sourceLine = parsed.operand;
  const hexEncoded = sourceLine.startsWith("<") ||
    (sourceLine.startsWith("[") && sourceLine.includes("<"));
  const inner = hexEncoded ? `<${encodeHex(replacementText)}>` : `(${replacementText})`;
  const newOperand = parsed.textOperator === "TJ" ? `[${inner}]` : inner;
  // Select an entire Tj instruction, never a matching string in unrelated
  // resource content. The parser only accepts one matching source Tj.
  const escaped = sourceLine.replace(/[.*+?^\u0024{}()|[\]\\]/g, "\\$&");
  const instruction = new RegExp(`(^|\\r?\\n)([ \\t]*)${escaped}([ \\t]+${parsed.textOperator})(?=\\r?\\n|$)`, "g");
  const matches = Array.from(parsed.original.matchAll(instruction));
  if (matches.length !== 1) unsupported("The source text operation is ambiguous.");
  const replaced = parsed.original.replace(instruction,
    (_full, prefix: string, indent: string, suffix: string) =>
      prefix + indent + newOperand + suffix);
  const bytes = new TextEncoder().encode(replaced);
  if (originalRef) {
    for (let i = 0; i < doc.getPageCount(); i++) {
      if (i === pageIndex) continue;
      const otherRef = doc.getPage(i).node.get(PDFName.of("Contents"));
      if (otherRef === originalRef) unsupported("The content stream is shared by multiple pages.");
      const other = doc.context.lookup(otherRef);
      if (other instanceof PDFArray) {
        for (let j = 0; j < other.size(); j++) {
          if (other.get(j) === originalRef) unsupported("The content stream is shared by multiple pages.");
        }
      }
    }
  }
  const newRef = doc.context.register(doc.context.stream(bytes));
  page.node.set(PDFName.of("Contents"), newRef);
  if (originalRef) doc.context.delete(originalRef);
  const saved = await doc.save();
  const verified = await readPageText(saved, pageIndex);
  if (verified !== expectedAfter) {
    throw new Error("Native text verification failed or unrelated page text changed; the original PDF was preserved.");
  }
  return { bytes: saved, originalText: expectedText, replacementText, pageIndex, fontName, fontSize: parsed.fontSize };
}
