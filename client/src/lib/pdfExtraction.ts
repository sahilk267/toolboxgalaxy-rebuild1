import * as pdfjsLib from "pdfjs-dist";
import { ensurePdfWorkerConfigured } from "./pdfWorkerSetup";
import * as XLSX from "xlsx";
import pptxgen from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { parseDigitalPdfStructure, exportStructureToDocx } from "./pdfLayoutEngine";

ensurePdfWorkerConfigured();

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  wordCount: number;
}

export interface ExtractedTableRow {
  cells: string[];
}

export interface TableExtractionResult {
  pageNumber: number;
  rows: string[][];
}

/**
 * Extracts plain text from all pages in a PDF document with preserved line breaks.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<{
  fullText: string;
  pages: ExtractedPageText[];
  totalWords: number;
}> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: ExtractedPageText[] = [];
  let fullText = "";
  let totalWords = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Sort items by vertical position (top to bottom) then horizontal (left to right)
    items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 4) {
        return yB - yA; // top to bottom
      }
      return a.transform[4] - b.transform[4]; // left to right
    });

    let pageText = "";
    let lastY: number | null = null;

    for (const item of items) {
      if (typeof item.str !== "string") continue;
      const currentY = item.transform[5];

      if (lastY !== null && Math.abs(currentY - lastY) > 6) {
        pageText += "\n";
      } else if (lastY !== null && !pageText.endsWith(" ") && !item.str.startsWith(" ")) {
        pageText += " ";
      }

      pageText += item.str;
      lastY = currentY;
    }

    const words = pageText.trim() ? pageText.trim().split(/\s+/).length : 0;
    totalWords += words;

    pages.push({
      pageNumber: i,
      text: pageText.trim(),
      wordCount: words,
    });

    fullText += `--- PAGE ${i} ---\n\n${pageText.trim()}\n\n`;
  }

  return { fullText: fullText.trim(), pages, totalWords };
}

/**
 * Clusters text coordinates into a tabular 2D array matrix for spreadsheet export.
 */
export async function extractPdfTables(bytes: Uint8Array): Promise<TableExtractionResult[]> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const results: TableExtractionResult[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) continue;

    // Group text items by row threshold (~8px delta in vertical Y)
    const rowsMap: { y: number; items: any[] }[] = [];

    for (const item of items) {
      if (!item.str || item.str.trim() === "") continue;
      const y = item.transform[5];
      let row = rowsMap.find((r) => Math.abs(r.y - y) <= 6);
      if (!row) {
        row = { y, items: [] };
        rowsMap.push(row);
      }
      row.items.push(item);
    }

    // Sort rows top-to-bottom
    rowsMap.sort((a, b) => b.y - a.y);

    // Form 2D array: sort items within row by X coordinate
    const tableRows: string[][] = rowsMap.map((r) => {
      r.items.sort((a, b) => a.transform[4] - b.transform[4]);
      return r.items.map((it) => String(it.str).trim());
    });

    if (tableRows.length > 0) {
      results.push({
        pageNumber: i,
        rows: tableRows,
      });
    }
  }

  return results;
}

/**
 * Exports extracted PDF text directly as a downloaded .txt file.
 */
export async function exportPdfToTextFile(bytes: Uint8Array, filename: string): Promise<void> {
  const { fullText } = await extractPdfText(bytes);
  const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_extracted.txt`);
}

/**
 * Exports tabular PDF text into a multi-sheet Microsoft Excel (.xlsx) workbook.
 */
export async function exportPdfToExcelWorkbook(bytes: Uint8Array, filename: string): Promise<{ sheetCount: number; rowCount: number }> {
  const tables = await extractPdfTables(bytes);
  if (tables.length === 0) {
    throw new Error("No readable text found to structure into a spreadsheet.");
  }

  const wb = XLSX.utils.book_new();
  let totalRows = 0;

  tables.forEach((t) => {
    // Pad rows so all rows have equal column length
    const maxCols = Math.max(...t.rows.map((r) => r.length), 1);
    const normalizedRows = t.rows.map((row) => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push("");
      return padded;
    });

    const ws = XLSX.utils.aoa_to_sheet(normalizedRows);
    XLSX.utils.book_append_sheet(wb, ws, `Page ${t.pageNumber}`);
    totalRows += normalizedRows.length;
  });

  const outBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([outBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_data.xlsx`);

  return { sheetCount: tables.length, rowCount: totalRows };
}

/**
 * Converts PDF extracted content into a downloadable formatted native OpenXML Word (.docx) file.
 * Preserves headings, typographic scale, detected tables, and paragraphs.
 */
export async function exportPdfToWordDocx(bytes: Uint8Array, filename: string): Promise<void> {
  try {
    const structure = await parseDigitalPdfStructure(bytes);
    if (structure.blocks.length > 0) {
      await exportStructureToDocx(structure, filename);
      return;
    }
  } catch {
    // fallback to text parser if layout parser encounters unusual stream
  }

  const { pages } = await extractPdfText(bytes);
  if (pages.length === 0) {
    throw new Error("No readable text found in document.");
  }

  // Structured DOCX generation fallback using docx library
  const children: Paragraph[] = [];
  pages.forEach((p, idx) => {
    children.push(
      new Paragraph({
        text: `Page ${p.pageNumber}`,
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: idx > 0,
      })
    );

    const paragraphs = p.text.split("\n\n").filter((para) => para.trim());
    paragraphs.forEach((para) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 160 },
        })
      );
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_converted.docx`);
}

/**
 * Converts PDF extracted pages into a genuine PowerPoint presentation (.pptx).
/**
 * Estimates visual line count for a line of text based on character length and wrapping in standard slide width.
 */
export function estimateVisualLines(text: string, charsPerLine: number = 70): number {
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

/**
 * Chunks lines into slides ensuring long lines that wrap do not overflow the 4.8" slide text box.
 * Instead of rigid 12 source lines, calculates total visual weight per slide (default max 10 visual lines).
 */
export function chunkLinesForSlides(lines: string[], maxVisualLines: number = 10): string[][] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentWeight = 0;

  for (const line of lines) {
    const weight = estimateVisualLines(line, 70);
    // If adding this line exceeds capacity and we already have lines, flush to a new slide
    if (currentWeight + weight > maxVisualLines && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentWeight = 0;
    }
    currentChunk.push(line);
    currentWeight += weight;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Builds a genuine PowerPoint presentation (.pptx) binary from pages and lines,
 * splitting content across continuation slides based on estimated visual line wrapping.
 */
export async function buildPresentationPptx(
  pages: { pageNumber: number; text: string }[],
  title: string = "Presentation"
): Promise<{ bytes: Uint8Array; slideCount: number }> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Toolbox Galaxy";
  pptx.title = title;

  let slideCount = 0;

  for (const page of pages) {
    const lines = page.text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      const slide = pptx.addSlide();
      slideCount++;
      slide.addText(`Slide ${page.pageNumber}: ${title}`, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.6,
        fontSize: 18,
        bold: true,
        color: "0f172a",
      });
      slide.addText("(Empty or graphical page)", {
        x: 0.8,
        y: 2.0,
        w: 8.4,
        h: 1.0,
        fontSize: 14,
        italic: true,
        color: "94a3b8",
      });
    } else {
      // Chunk lines safely according to visual line estimation
      const slideChunks = chunkLinesForSlides(lines, 10);
      const totalParts = slideChunks.length;

      for (let partIdx = 0; partIdx < totalParts; partIdx++) {
        const slide = pptx.addSlide();
        slideCount++;
        const partLabel = totalParts > 1 ? ` (Part ${partIdx + 1} of ${totalParts})` : "";

        // Slide Header
        slide.addText(`Slide ${page.pageNumber}${partLabel}: ${title}`, {
          x: 0.8,
          y: 0.5,
          w: 8.4,
          h: 0.6,
          fontSize: 18,
          bold: true,
          color: "0f172a",
        });

        const chunk = slideChunks[partIdx];
        const bullets = chunk.map((line) => ({
          text: line,
          options: { fontSize: 13, color: "334155", bullet: true, breakLine: true },
        }));

        slide.addText(bullets, {
          x: 0.8,
          y: 1.3,
          w: 8.4,
          h: 4.8,
          align: "left",
          valign: "top",
          wrap: true,
        });
      }
    }
  }

  const out = await pptx.write({ outputType: "uint8array" });
  return { bytes: out as Uint8Array, slideCount };
}

/**
 * Converts PDF extracted pages into a genuine PowerPoint presentation (.pptx) download.
 */
export async function exportPdfToPresentationPpt(bytes: Uint8Array, filename: string): Promise<{ slideCount: number }> {
  const { pages } = await extractPdfText(bytes);
  if (pages.length === 0) {
    throw new Error("No readable text found in document.");
  }

  const title = filename.replace(/\.pdf$/i, "");
  const { bytes: pptxBytes, slideCount } = await buildPresentationPptx(pages, title);

  const blob = new Blob([pptxBytes], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  triggerBrowserDownload(blob, `${title}_presentation.pptx`);

  return { slideCount };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function triggerBrowserDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
