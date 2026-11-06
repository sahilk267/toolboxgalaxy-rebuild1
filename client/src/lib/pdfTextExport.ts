import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { sanitizeWinAnsiText } from "./pdfTextSanitizer";

/** Wrap even long unbroken words within a measured PDF text width. */
export function wrapPdfTextLine(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!(fontSize > 0) || !(maxWidth > 0) || !Number.isFinite(maxWidth)) {
    throw new Error("PDF text layout width and font size must be positive.");
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const fits = (value: string) => font.widthOfTextAtSize(value, fontSize) <= maxWidth + 0.01;
  const flush = () => {
    if (current) { lines.push(current); current = ""; }
  };

  for (const word of words) {
    const combined = current ? current + " " + word : word;
    if (fits(combined)) { current = combined; continue; }

    flush();
    if (fits(word)) { current = word; continue; }

    // Binary-search each fitting segment rather than clipping oversized tokens.
    const chars = Array.from(word);
    let index = 0;
    while (index < chars.length) {
      let low = 1;
      let high = chars.length - index;
      let best = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const part = chars.slice(index, index + mid).join("");
        if (fits(part)) { best = mid; low = mid + 1; }
        else high = mid - 1;
      }
      if (!best) throw new Error("PDF text column is too narrow for the selected font.");
      const segment = chars.slice(index, index + best).join("");
      index += best;
      if (index < chars.length) lines.push(segment);
      else current = segment;
    }
  }
  flush();
  return lines;
}

/** Fit spreadsheet cell text to its true column width; never paint over another cell. */
export function fitPdfCellText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string {
  if (maxWidth <= 0 || !Number.isFinite(maxWidth)) return "";
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
  const suffix = "...";
  if (font.widthOfTextAtSize(suffix, fontSize) > maxWidth) return "";

  const chars = Array.from(text);
  let low = 0;
  let high = chars.length;
  let best = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = chars.slice(0, middle).join("") + suffix;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      best = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  return chars.slice(0, best).join("") + suffix;
}

/** Genuine PDF export of a Word/document text stream with safe pagination and wrapping. */
export async function buildTextPdf(text: string, title: string): Promise<Uint8Array> {
  if (!text.trim()) throw new Error("Enter document text to export.");
  const content = sanitizeWinAnsiText(text);
  const safeTitle = sanitizeWinAnsiText(title || "Converted Document");
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const available = pageWidth - margin * 2;
  const normalLineHeight = 16;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => { page = doc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; };
  const addLine = (value: string, font: PDFFont, size: number, heading: boolean) => {
    if (y - size < margin) newPage();
    page.drawText(value, {
      x: margin, y, size, font,
      color: heading ? rgb(0.12, 0.22, 0.54) : rgb(0.15, 0.15, 0.15),
    });
    y -= normalLineHeight;
  };

  for (const line of wrapPdfTextLine(safeTitle, bold, 15, available)) {
    addLine(line, bold, 15, true);
  }
  y -= 12;

  for (const paragraph of content.split("\n")) {
    if (!paragraph.trim()) {
      y -= 8;
      if (y < margin) newPage();
      continue;
    }
    const heading = /^#+\s/.test(paragraph);
    const clean = paragraph.replace(/^#+\s*/, "");
    const font = heading ? bold : regular;
    const size = heading ? 12 : 9.5;
    for (const line of wrapPdfTextLine(clean, font, size, available)) {
      addLine(line, font, size, heading);
    }
    y -= heading ? 6 : 4;
  }
  return doc.save();
}
