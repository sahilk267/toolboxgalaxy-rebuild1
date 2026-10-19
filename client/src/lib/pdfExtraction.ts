import * as pdfjsLib from "pdfjs-dist";
import { ensurePdfWorkerConfigured } from "./pdfWorkerSetup";
import * as XLSX from "xlsx";
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

  // Fallback HTML-based doc representation
  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${filename}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; margin: 40px; }
        h1 { font-size: 18pt; color: #1e3a8a; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 4pt; margin-top: 24pt; }
        p { margin-bottom: 10pt; text-align: justify; }
        .page-break { page-break-before: always; mso-break-type: page-break; }
      </style>
    </head>
    <body>
      ${pages
        .map(
          (p, idx) => `
          <div class="${idx > 0 ? "page-break" : ""}">
            <h1>Section: Page ${p.pageNumber}</h1>
            ${p.text
              .split("\n\n")
              .filter((para) => para.trim())
              .map((para) => `<p>${escapeHtml(para)}</p>`)
              .join("")}
          </div>`
        )
        .join("")}
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/msword;charset=utf-8",
  });

  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_converted.doc`);
}

/**
 * Converts PDF extracted pages into a structured presentation slide deck outline (.ppt).
 */
export async function exportPdfToPresentationPpt(bytes: Uint8Array, filename: string): Promise<void> {
  const { pages } = await extractPdfText(bytes);
  if (pages.length === 0) {
    throw new Error("No readable text found in document.");
  }

  const slidesHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:p='urn:schemas-microsoft-com:office:powerpoint' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${filename}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; margin: 40px; background-color: #f8fafc; color: #1e293b; }
        .slide { background: #ffffff; border: 1.5pt solid #cbd5e1; border-radius: 8px; padding: 32px; margin-bottom: 24px; page-break-after: always; min-height: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .slide-header { font-size: 22pt; font-weight: bold; color: #1e3a8a; border-bottom: 2pt solid #3b82f6; padding-bottom: 8pt; margin-bottom: 16pt; }
        .bullet-point { font-size: 14pt; margin-bottom: 8pt; line-height: 1.5; }
      </style>
    </head>
    <body>
      ${pages
        .map(
          (p) => `
        <div class="slide">
          <div class="slide-header">Slide ${p.pageNumber}: ${escapeHtml(filename.replace(/\.pdf$/i, ""))}</div>
          <ul>
            ${p.text
              .split("\n")
              .filter((line) => line.trim())
              .map((line) => `<li class="bullet-point">${escapeHtml(line.trim())}</li>`)
              .join("")}
          </ul>
        </div>`
        )
        .join("")}
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + slidesHtml], {
    type: "application/vnd.ms-powerpoint;charset=utf-8",
  });

  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_presentation.ppt`);
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
