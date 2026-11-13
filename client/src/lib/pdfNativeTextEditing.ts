import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFRef,
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
const ONE_NUMBER = new RegExp(`^${DECIMAL}\\s+(?:TL|g|G)$`);
const ASCII = /^[\x20-\x7e]+$/;
const MAX_STREAM = 128 * 1024;
const MAX_DOCUMENT = 12 * 1024 * 1024;

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
  let shown = 0;
  let begins = 0;
  let ends = 0;
  let resource = "";
  let size = 0;
  let encodedText = "";
  for (const line of lines) {
    const op = line.trim();
    if (!op) continue;
    if (op === "q" || op === "Q") {
      if (textOpen) unsupported("Graphics state changes inside text are unsupported.");
    } else if (op === "BT") {
      if (textOpen || ++begins !== 1) unsupported("Multiple or nested text objects are unsupported.");
      textOpen = true;
    } else if (op === "ET") {
      if (!textOpen) unsupported("Malformed text object.");
      textOpen = false;
      ends++;
    } else if (FONT.test(op) && textOpen) {
      const match = op.match(FONT)!;
      if (resource) unsupported("Multiple font selections are unsupported.");
      resource = match[1];
      size = Number(match[2]);
    } else if (SHOW.test(op) && textOpen) {
      if (!resource || ++shown !== 1) unsupported("Multiple or unstyled text runs are unsupported.");
      encodedText = op.match(SHOW)![1];
    } else if (textOpen && (MATRIX.test(op) || MOVE.test(op) || RGB.test(op) ||
      CMYK.test(op) || ONE_NUMBER.test(op) || op === "T*")) {
      // Position, color and spacing operators are retained verbatim.
    } else {
      unsupported("The page uses unsupported text, graphics or positioning operators.");
    }
  }
  if (textOpen || begins !== 1 || ends !== 1 || shown !== 1 || !size || size > 300) {
    unsupported("Expected one complete, simply positioned text run.");
  }
  if (encodedText !== expectedText) {
    unsupported("Selected text is not an exact single-run match in the original page stream.");
  }
  return { original, encodedText, fontResource: resource, fontSize: size };
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
  if (raw.dict.get(PDFName.of("Filter")) || raw.dict.get(PDFName.of("DecodeParms"))) {
    unsupported("Compressed or encoded content streams are not supported.");
  }
  const parsed = inspectSimpleStream(raw.getContents(), expectedText);

  const inherited = page.node.getInheritableAttribute(PDFName.of("Resources"));
  const resources = doc.context.lookup(inherited);
  if (!(resources instanceof PDFDict)) unsupported("The page has no usable font resources.");
  const fontDict = resources.lookup(PDFName.of("Font"));
  if (!(fontDict instanceof PDFDict)) unsupported("The page has no usable font dictionary.");
  const sourceFont = doc.context.lookup(fontDict.get(PDFName.of(parsed.fontResource)));
  if (!(sourceFont instanceof PDFDict)) unsupported("The selected font resource is missing.");
  const subtype = sourceFont.get(PDFName.of("Subtype"));
  const baseFont = sourceFont.get(PDFName.of("BaseFont"));
  if (!(subtype instanceof PDFName) || subtype.asString() !== "Type1" ||
      !(baseFont instanceof PDFName)) {
    unsupported("Only simple standard Type1 fonts are supported.");
  }
  if (sourceFont.get(PDFName.of("ToUnicode")) ||
      sourceFont.get(PDFName.of("Differences")) ||
      sourceFont.get(PDFName.of("Widths"))) {
    unsupported("Custom font mappings and widths are unsupported.");
  }
  const encoding = sourceFont.get(PDFName.of("Encoding"));
  if (encoding && (!(encoding instanceof PDFName) || encoding.asString() !== "WinAnsiEncoding")) {
    unsupported("Non-WinAnsi font encodings are not supported.");
  }
  const fontName = baseFont.asString();
  const allowed = Object.values(StandardFonts) as string[];
  if (!allowed.includes(fontName)) unsupported("The PDF uses a custom or subset font.");
  const metricFont = await doc.embedFont(fontName as StandardFonts);
  const originalWidth = metricFont.widthOfTextAtSize(expectedText, parsed.fontSize);
  const replacementWidth = metricFont.widthOfTextAtSize(replacementText, parsed.fontSize);
  if (replacementWidth > originalWidth + 0.01) {
    unsupported("Replacement text is wider than the existing run; layout preservation cannot be guaranteed.");
  }

  const extractedBefore = await readPageText(input, pageIndex);
  if (extractedBefore !== expectedText) {
    unsupported("PDF.js text extraction does not match the selected source run exactly.");
  }
  const sourceLine = `(${parsed.encodedText})`;
  const offset = parsed.original.indexOf(sourceLine);
  if (offset < 0 || parsed.original.indexOf(sourceLine, offset + sourceLine.length) !== -1) {
    unsupported("The source text operand is ambiguous.");
  }
  const replaced = parsed.original.slice(0, offset) +
    `(${replacementText})` + parsed.original.slice(offset + sourceLine.length);
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
  if (verified !== replacementText) {
    throw new Error("Native text verification failed; the original PDF was not modified.");
  }
  return { bytes: saved, originalText: expectedText, replacementText, pageIndex, fontName, fontSize: parsed.fontSize };
}
