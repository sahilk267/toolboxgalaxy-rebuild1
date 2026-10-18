import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx";
import { exportSearchablePdf } from "./pdfOcr";

export interface SemanticRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number; // in pt
}

export interface SemanticBlock {
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "table" | "bullet_list";
  runs?: SemanticRun[];
  text?: string;
  tableRows?: string[][];
  listItems?: string[];
  pageNumber: number;
}

export interface DocumentStructure {
  totalPages: number;
  isScanned: boolean;
  totalWords: number;
  blocks: SemanticBlock[];
  previewHtml: string;
  markdown: string;
}

export interface ConvertProgressCallback {
  (progress: {
    status: string;
    progressPercent: number;
    currentPage?: number;
    totalPages?: number;
    stage: "inspecting" | "ocr" | "parsing" | "formatting" | "packaging" | "done";
  }): void;
}

/**
 * Inspects a PDF to determine whether it contains native vector text or requires OCR.
 */
export async function inspectPdfNature(bytes: Uint8Array): Promise<{
  isScanned: boolean;
  totalChars: number;
  numPages: number;
}> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, 5); // sample first 5 pages
  let totalChars = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items as any[]) {
      if (typeof item.str === "string") {
        totalChars += item.str.trim().length;
      }
    }
  }

  const avgCharsPerPage = totalChars / Math.max(numPages, 1);
  // If fewer than 25 characters per page, it's virtually a scanned document or full bitmap
  const isScanned = avgCharsPerPage < 25;

  return {
    isScanned,
    totalChars,
    numPages: pdf.numPages,
  };
}

/**
 * Parses a native digital PDF into semantic structured blocks (preserving headings, tables, paragraphs).
 */
export async function parseDigitalPdfStructure(
  bytes: Uint8Array,
  onProgress?: ConvertProgressCallback
): Promise<DocumentStructure> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const allBlocks: SemanticBlock[] = [];
  let totalWords = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({
      status: `Analyzing typography and geometry on Page ${pageNum} of ${totalPages}...`,
      progressPercent: Math.round(((pageNum - 0.5) / totalPages) * 70),
      currentPage: pageNum,
      totalPages,
      stage: "parsing",
    });

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = (textContent.items as any[]).filter(
      (it) => typeof it.str === "string" && it.str.trim().length > 0
    );

    if (items.length === 0) continue;

    // Compute median font size for this page
    const fontSizes: number[] = [];
    for (const item of items) {
      const fs = Math.round(Math.abs(item.transform[0] || 12));
      if (fs > 0) fontSizes.push(fs);
    }
    fontSizes.sort((a, b) => a - b);
    const medianFs = fontSizes[Math.floor(fontSizes.length / 2)] || 12;

    // Cluster items into lines by Y position (threshold ~5 units)
    const linesMap: { y: number; items: any[] }[] = [];
    for (const item of items) {
      const y = item.transform[5];
      let row = linesMap.find((r) => Math.abs(r.y - y) <= 4.5);
      if (!row) {
        row = { y, items: [] };
        linesMap.push(row);
      }
      row.items.push(item);
    }

    // Sort lines top to bottom (descending Y in PDF coordinates)
    linesMap.sort((a, b) => b.y - a.y);

    // Sort items within each line left to right (ascending X)
    for (const line of linesMap) {
      line.items.sort((a, b) => a.transform[4] - b.transform[4]);
    }

    // Detect tabular regions (consecutive lines that share >= 2 aligned column coordinates)
    let idx = 0;
    while (idx < linesMap.length) {
      const currentLine = linesMap[idx];
      const isMultiCol = currentLine.items.length >= 2;

      // Check if subsequent lines have similar columnar pattern
      let tableCandidateRows: any[][] = [];
      if (isMultiCol) {
        let lookahead = idx;
        while (lookahead < linesMap.length && linesMap[lookahead].items.length >= 2) {
          tableCandidateRows.push(linesMap[lookahead].items);
          lookahead++;
          if (tableCandidateRows.length >= 20) break; // cap reasonable table chunk
        }
      }

      // If at least 3 consecutive lines with multiple aligned columns, treat as a table
      if (tableCandidateRows.length >= 3) {
        const tableMatrix: string[][] = tableCandidateRows.map((rowItems) =>
          rowItems.map((it) => it.str.trim()).filter((s) => s.length > 0)
        );

        // Normalize matrix column count
        const maxCols = Math.max(...tableMatrix.map((r) => r.length), 1);
        const normalizedTable = tableMatrix.map((row) => {
          const cells = [...row];
          while (cells.length < maxCols) cells.push("");
          return cells;
        });

        allBlocks.push({
          type: "table",
          tableRows: normalizedTable,
          pageNumber: pageNum,
        });

        idx += tableCandidateRows.length;
        continue;
      }

      // Not a table: assemble into paragraph or heading
      const lineText = currentLine.items.map((it) => it.str).join(" ").trim();
      const firstItem = currentLine.items[0];
      const lineFontSize = Math.round(Math.abs(firstItem.transform[0] || 12));
      const fontName = String(firstItem.fontName || "").toLowerCase();
      const isBold = fontName.includes("bold") || fontName.includes("black") || fontName.includes("heavy");

      totalWords += lineText.split(/\s+/).filter(Boolean).length;

      // Classify typographic hierarchy
      if (lineFontSize >= medianFs * 1.38 && lineText.length < 120) {
        allBlocks.push({
          type: "heading1",
          text: lineText,
          runs: [{ text: lineText, bold: true, fontSize: Math.min(lineFontSize, 24) }],
          pageNumber: pageNum,
        });
      } else if (lineFontSize >= medianFs * 1.16 && lineText.length < 150) {
        allBlocks.push({
          type: "heading2",
          text: lineText,
          runs: [{ text: lineText, bold: true, fontSize: Math.min(lineFontSize, 18) }],
          pageNumber: pageNum,
        });
      } else if (/^([•\-\*]|\d+[\.\)])\s+/.test(lineText)) {
        // Bullet or numbered list
        allBlocks.push({
          type: "bullet_list",
          listItems: [lineText.replace(/^([•\-\*]|\d+[\.\)])\s+/, "")],
          pageNumber: pageNum,
        });
      } else {
        // Standard body paragraph
        // Check if previous block was also a paragraph on same page to concatenate smoothly if gap is small
        const prevBlock = allBlocks[allBlocks.length - 1];
        if (
          prevBlock &&
          prevBlock.type === "paragraph" &&
          prevBlock.pageNumber === pageNum &&
          prevBlock.runs &&
          prevBlock.runs.length > 0
        ) {
          // Append to existing paragraph with space
          prevBlock.runs.push({ text: " " + lineText, bold: isBold, fontSize: lineFontSize });
          prevBlock.text = (prevBlock.text || "") + " " + lineText;
        } else {
          allBlocks.push({
            type: "paragraph",
            text: lineText,
            runs: [{ text: lineText, bold: isBold, fontSize: lineFontSize }],
            pageNumber: pageNum,
          });
        }
      }

      idx++;
    }
  }

  const { previewHtml, markdown } = generateHtmlAndMarkdown(allBlocks);

  return {
    totalPages,
    isScanned: false,
    totalWords,
    blocks: allBlocks,
    previewHtml,
    markdown,
  };
}

/**
 * Runs layout-aware OCR on scanned PDFs, grouping recognized bounding boxes into structured blocks.
 */
export async function parseScannedPdfWithLayoutOcr(
  bytes: Uint8Array,
  onProgress?: ConvertProgressCallback
): Promise<DocumentStructure> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const allBlocks: SemanticBlock[] = [];
  let totalWords = 0;

  onProgress?.({
    status: "Initializing Tesseract WASM layout analysis engine...",
    progressPercent: 5,
    totalPages,
    stage: "ocr",
  });

  const worker = await createWorker("eng");

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.({
        status: `Running Optical Layout Analysis on Page ${pageNum} of ${totalPages}...`,
        progressPercent: Math.round(((pageNum - 0.7) / totalPages) * 75),
        currentPage: pageNum,
        totalPages,
        stage: "ocr",
      });

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      await (page.render as any)({
        canvasContext: ctx,
        viewport,
      }).promise;

      const ocrResult = await worker.recognize(canvas);
      const data: any = ocrResult.data;
      const lines: any[] = data.lines || [];

      if (lines.length === 0) continue;

      // Calculate median line height
      const heights: number[] = lines.map((l) => Math.abs(l.bbox.y1 - l.bbox.y0)).filter((h) => h > 4);
      heights.sort((a, b) => a - b);
      const medianH = heights[Math.floor(heights.length / 2)] || 24;

      for (const line of lines) {
        const text = String(line.text || "").trim();
        if (!text) continue;

        const lineH = Math.abs(line.bbox.y1 - line.bbox.y0);
        totalWords += text.split(/\s+/).filter(Boolean).length;

        // Heading classification based on bounding box height
        if (lineH >= medianH * 1.45 && text.length < 120) {
          allBlocks.push({
            type: "heading1",
            text,
            runs: [{ text, bold: true, fontSize: 18 }],
            pageNumber: pageNum,
          });
        } else if (lineH >= medianH * 1.2 && text.length < 150) {
          allBlocks.push({
            type: "heading2",
            text,
            runs: [{ text, bold: true, fontSize: 14 }],
            pageNumber: pageNum,
          });
        } else if (/^([•\-\*]|\d+[\.\)])\s+/.test(text)) {
          allBlocks.push({
            type: "bullet_list",
            listItems: [text.replace(/^([•\-\*]|\d+[\.\)])\s+/, "")],
            pageNumber: pageNum,
          });
        } else {
          allBlocks.push({
            type: "paragraph",
            text,
            runs: [{ text, fontSize: 11 }],
            pageNumber: pageNum,
          });
        }
      }
    }
  } finally {
    await worker.terminate();
  }

  const { previewHtml, markdown } = generateHtmlAndMarkdown(allBlocks);

  return {
    totalPages,
    isScanned: true,
    totalWords,
    blocks: allBlocks,
    previewHtml,
    markdown,
  };
}

/**
 * Builds HTML preview and Markdown text representation from semantic blocks.
 */
function generateHtmlAndMarkdown(blocks: SemanticBlock[]): {
  previewHtml: string;
  markdown: string;
} {
  let html = "";
  let md = "";
  let lastPage = 0;

  for (const block of blocks) {
    if (block.pageNumber !== lastPage) {
      lastPage = block.pageNumber;
      if (lastPage > 1) {
        html += `<hr class="my-6 border-slate-300 dark:border-slate-700" /><div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Page ${lastPage}</div>`;
        md += `\n\n---\n*Page ${lastPage}*\n\n`;
      }
    }

    if (block.type === "heading1") {
      html += `<h1 class="text-2xl font-bold text-slate-900 dark:text-white mt-5 mb-2">${escapeHtml(
        block.text || ""
      )}</h1>`;
      md += `# ${block.text}\n\n`;
    } else if (block.type === "heading2") {
      html += `<h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-2">${escapeHtml(
        block.text || ""
      )}</h2>`;
      md += `## ${block.text}\n\n`;
    } else if (block.type === "heading3") {
      html += `<h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mt-3 mb-1">${escapeHtml(
        block.text || ""
      )}</h3>`;
      md += `### ${block.text}\n\n`;
    } else if (block.type === "bullet_list") {
      html += `<ul class="list-disc pl-5 mb-2 text-slate-700 dark:text-slate-300">${(block.listItems || [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`;
      md += (block.listItems || []).map((i) => `- ${i}`).join("\n") + "\n\n";
    } else if (block.type === "table" && block.tableRows) {
      html += `<div class="overflow-x-auto my-4 rounded border border-slate-200 dark:border-slate-700"><table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">`;
      block.tableRows.forEach((row, rIdx) => {
        const isHeader = rIdx === 0;
        html += `<tr class="${isHeader ? "bg-slate-100 dark:bg-slate-800 font-semibold" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}">`;
        row.forEach((cell) => {
          html += `<td class="px-3 py-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">${escapeHtml(
            cell
          )}</td>`;
        });
        html += `</tr>`;
      });
      html += `</table></div>`;

      // Markdown table
      if (block.tableRows.length > 0) {
        const header = block.tableRows[0];
        md += `| ${header.join(" | ")} |\n`;
        md += `| ${header.map(() => "---").join(" | ")} |\n`;
        for (let r = 1; r < block.tableRows.length; r++) {
          md += `| ${block.tableRows[r].join(" | ")} |\n`;
        }
        md += "\n";
      }
    } else {
      // Paragraph
      const content = block.runs ? block.runs.map((r) => (r.bold ? `<strong>${escapeHtml(r.text)}</strong>` : escapeHtml(r.text))).join("") : escapeHtml(block.text || "");
      html += `<p class="mb-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">${content}</p>`;
      md += `${block.text}\n\n`;
    }
  }

  return { previewHtml: html, markdown: md.trim() };
}

/**
 * Creates and downloads a real, native OpenXML Word Document (.docx)
 * with preserved typographic hierarchy, headings, tables, and paragraphs.
 */
export async function exportStructureToDocx(
  structure: DocumentStructure,
  filename: string,
  onProgress?: ConvertProgressCallback
): Promise<void> {
  onProgress?.({
    status: "Generating OpenXML DOCX Document with styles...",
    progressPercent: 85,
    stage: "formatting",
  });

  const docChildren: (Paragraph | Table)[] = [];

  // Title / Document Header
  docChildren.push(
    new Paragraph({
      text: filename.replace(/\.pdf$/i, ""),
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    })
  );

  let lastPage = 0;

  for (const block of structure.blocks) {
    if (block.pageNumber !== lastPage) {
      lastPage = block.pageNumber;
      if (lastPage > 1) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `— Page ${lastPage} —`,
                italics: true,
                color: "64748B",
                size: 18, // 9pt
              }),
            ],
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.CENTER,
          })
        );
      }
    }

    if (block.type === "heading1") {
      docChildren.push(
        new Paragraph({
          text: block.text || "",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (block.type === "heading2") {
      docChildren.push(
        new Paragraph({
          text: block.text || "",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
        })
      );
    } else if (block.type === "heading3") {
      docChildren.push(
        new Paragraph({
          text: block.text || "",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 60 },
        })
      );
    } else if (block.type === "bullet_list") {
      for (const item of block.listItems || []) {
        docChildren.push(
          new Paragraph({
            text: item,
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      }
    } else if (block.type === "table" && block.tableRows && block.tableRows.length > 0) {
      const rows = block.tableRows.map((rowCells, rIdx) => {
        const isHeader = rIdx === 0;
        return new TableRow({
          children: rowCells.map(
            (cellText) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: isHeader,
                        size: isHeader ? 22 : 20, // 11pt header, 10pt body
                      }),
                    ],
                  }),
                ],
                shading: isHeader ? { fill: "F1F5F9" } : undefined,
              })
          ),
        });
      });

      docChildren.push(
        new Table({
          rows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        })
      );

      // Spacing after table
      docChildren.push(new Paragraph({ text: "", spacing: { after: 140 } }));
    } else {
      // Paragraph
      const runs = (block.runs || [{ text: block.text || "" }]).map(
        (r) =>
          new TextRun({
            text: r.text,
            bold: r.bold,
            italics: r.italic,
            size: r.fontSize ? r.fontSize * 2 : 22, // half-points in docx
          })
      );

      docChildren.push(
        new Paragraph({
          children: runs,
          spacing: { after: 120, line: 276 }, // 1.15 line spacing
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  onProgress?.({
    status: "Packaging WordprocessingML Archive (.docx)...",
    progressPercent: 95,
    stage: "packaging",
  });

  const blob = await Packer.toBlob(doc);
  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_formatted.docx`);

  onProgress?.({
    status: "Formatted Word (.docx) export completed!",
    progressPercent: 100,
    stage: "done",
  });
}

/**
 * Downloads document as clean semantic HTML.
 */
export function exportStructureToHtml(structure: DocumentStructure, filename: string): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(filename)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24pt; color: #0f172a; margin-top: 24pt; margin-bottom: 8pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 6pt; }
    h2 { font-size: 18pt; color: #1e293b; margin-top: 18pt; margin-bottom: 6pt; }
    p { margin-bottom: 12pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 18pt 0; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 8pt 10pt; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) td { background-color: #f8fafc; }
    hr { border: none; border-top: 1px dashed #cbd5e1; margin: 30px 0; }
  </style>
</head>
<body>
  ${structure.previewHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_structured.html`);
}

/**
 * Downloads document as clean semantic Markdown.
 */
export function exportStructureToMarkdown(structure: DocumentStructure, filename: string): void {
  const blob = new Blob([structure.markdown], { type: "text/markdown;charset=utf-8" });
  triggerBrowserDownload(blob, `${filename.replace(/\.pdf$/i, "")}_formatted.md`);
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
