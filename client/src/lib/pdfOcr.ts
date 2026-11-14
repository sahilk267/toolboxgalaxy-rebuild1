import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { ensurePdfWorkerConfigured } from "./pdfWorkerSetup";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { sanitizeWinAnsiText, detectUnsupportedWinAnsi } from "./pdfTextSanitizer";

ensurePdfWorkerConfigured();

export interface OcrPageProgress {
  currentPage: number;
  totalPages: number;
  status: string;
  progressPercent: number;
}

export interface SearchablePdfResult {
  unsupportedDetected: boolean;
  unsupportedCharacters: string[];
  totalPages: number;
  pdfBytes: Uint8Array;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

/**
 * Performs client-side OCR on a PDF file using Tesseract.js WebWorker.
 * Renders each page to off-screen canvas and extracts recognized characters without server upload.
 */
const MAX_OCR_INPUT_BYTES = 40 * 1024 * 1024;
const MAX_OCR_CANVAS_PIXELS = 15_800_000;
const MAX_OCR_CANVAS_EDGE = 8_192;

/** Choose the sharpest OCR raster size within a conservative canvas budget. */
function safeOcrRenderScale(page: { getViewport: (options: { scale: number }) => { width: number; height: number } }): number {
  const requested = page.getViewport({ scale: 2 });
  if (!Number.isFinite(requested.width) || !Number.isFinite(requested.height) ||
      requested.width <= 0 || requested.height <= 0) {
    throw new Error("PDF page has invalid dimensions.");
  }
  const factor = Math.min(
    1,
    MAX_OCR_CANVAS_EDGE / Math.max(requested.width, requested.height),
    Math.sqrt(MAX_OCR_CANVAS_PIXELS / (requested.width * requested.height)),
  );
  return 2 * factor;
}

function validateOcrSource(pdfBytes: Uint8Array): void {
  if (!pdfBytes.length || pdfBytes.length > MAX_OCR_INPUT_BYTES)
    throw new Error("Choose a nonempty PDF under 40 MB for browser-side OCR.");
}

/** Extract text with bounded page rasters and always release workers. */
export async function runClientSidePdfOcr(
  pdfBytes: Uint8Array,
  onProgress?: (progress: OcrPageProgress) => void
): Promise<{
  fullText: string;
  pages: OcrPageResult[];
  averageConfidence: number;
}> {
  validateOcrSource(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const pdf = await loadingTask.promise;
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    const totalPages = pdf.numPages;
    onProgress?.({
      currentPage: 0,
      totalPages,
      status: "Initializing OCR Engine...",
      progressPercent: 5,
    });
    worker = await createWorker("eng");
    const pageResults: OcrPageResult[] = [];
    let fullText = "";
    let totalConfidence = 0;

    for (let i = 1; i <= totalPages; i++) {
      onProgress?.({
        currentPage: i, totalPages,
        status: `Rendering Page ${i} for OCR...`,
        progressPercent: Math.round(((i - 1) / totalPages) * 100),
      });
      const page = await pdf.getPage(i);
      let canvas: HTMLCanvasElement | null = null;
      try {
        const scale = safeOcrRenderScale(page);
        const viewport = page.getViewport({ scale });
        canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Unable to initialize OCR canvas in this browser.");
        await (page.render as any)({ canvasContext: ctx, viewport }).promise;

        onProgress?.({
          currentPage: i, totalPages,
          status: `Extracting text from Page ${i}...`,
          progressPercent: Math.round(((i - 0.5) / totalPages) * 100),
        });
        const ocrResult = await worker.recognize(canvas);
        const text = ocrResult.data.text.trim();
        const confidence = ocrResult.data.confidence;
        totalConfidence += confidence;
        pageResults.push({ pageNumber: i, text, confidence });
        fullText += `--- OCR PAGE ${i} (Confidence: ${Math.round(confidence)}%) ---\n\n${text}\n\n`;
      } finally {
        if (canvas) { canvas.width = 0; canvas.height = 0; }
        page.cleanup();
      }
    }
    onProgress?.({
      currentPage: totalPages, totalPages,
      status: "OCR Processing Complete!", progressPercent: 100,
    });
    return {
      fullText: fullText.trim(),
      pages: pageResults,
      averageConfidence: pageResults.length
        ? Math.round(totalConfidence / pageResults.length) : 0,
    };
  } finally {
    try { await worker?.terminate(); }
    finally { await pdf.destroy(); }
  }
}

/**
 * Creates a searchable PDF by rendering each page, recognizing text and positions via Tesseract,
 * and overlaying an invisible text layer (opacity: 0) directly positioned over the image.
 * This makes scanned PDFs fully selectable and searchable (Ctrl+F) while preserving visual fidelity.
 */
export async function exportSearchablePdf(
  pdfBytes: Uint8Array,
  filename: string = "document.pdf",
  onProgress?: (progress: OcrPageProgress) => void
): Promise<SearchablePdfResult> {
  validateOcrSource(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const pdf = await loadingTask.promise;
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    const totalPages = pdf.numPages;
    onProgress?.({
      currentPage: 0, totalPages,
      status: "Initializing English OCR Engine for Searchable PDF...",
      progressPercent: 5,
    });
    const pdfDoc = await PDFDocument.load(pdfBytes.slice());
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    worker = await createWorker("eng");
    const allUnsupportedChars = new Set<string>();

    for (let i = 1; i <= totalPages; i++) {
      onProgress?.({
        currentPage: i, totalPages,
        status: `Generating Searchable Layer for Page ${i} of ${totalPages}...`,
        progressPercent: Math.round(((i - 0.5) / totalPages) * 100),
      });
      const page = await pdf.getPage(i);
      let canvas: HTMLCanvasElement | null = null;
      try {
        // Keep the recognition bitmap under 16MP; text coordinates use the
        // ACTUAL scale, including large pages rendered below nominal 2x.
        const scale = safeOcrRenderScale(page);
        const viewport = page.getViewport({ scale });
        canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Unable to initialize searchable-PDF canvas.");
        await (page.render as any)({ canvasContext: ctx, viewport }).promise;

        const result = await worker.recognize(canvas);
        const pdfPage = pdfDoc.getPage(i - 1);
        const { height: pageHeight } = pdfPage.getSize();
        const lines: any[] = (result.data as any).lines || [];
        for (const line of lines) {
          const cleanLineText = line.text.replace(/[\r\n]+/g, " ").trim();
          if (!cleanLineText) continue;
          for (const ch of detectUnsupportedWinAnsi(cleanLineText)) allUnsupportedChars.add(ch);

          const pdfX = line.bbox.x0 / scale;
          const boxHeight = (line.bbox.y1 - line.bbox.y0) / scale;
          const pdfY = pageHeight - line.bbox.y1 / scale;
          const fontSize = Math.max(6, Math.min(22, boxHeight * 0.82));
          try {
            const safeText = sanitizeWinAnsiText(cleanLineText);
            if (!safeText.trim()) continue;
            pdfPage.drawText(safeText, {
              x: Math.max(0, pdfX),
              y: Math.max(0, pdfY),
              size: fontSize,
              font: helvetica,
              opacity: 0,
            });
          } catch {
            // Ignore unrepresentable OCR glyphs; retain the original page.
          }
        }
      } finally {
        if (canvas) { canvas.width = 0; canvas.height = 0; }
        page.cleanup();
      }

      if (allUnsupportedChars.size) {
        const sampleChars = Array.from(allUnsupportedChars).slice(0, 4).join(" ");
        onProgress?.({
          currentPage: i, totalPages,
          status: `Notice: Unsupported characters detected (${sampleChars}). English text layer preserved.`,
          progressPercent: Math.round((i / totalPages) * 100),
        });
      }
    }
    onProgress?.({
      currentPage: totalPages, totalPages,
      status: "Finalizing Searchable PDF...", progressPercent: 98,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    if (typeof document !== "undefined" && document.createElement) {
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(/\.pdf$/i, "") + "_searchable.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    onProgress?.({
      currentPage: totalPages, totalPages,
      status: allUnsupportedChars.size
        ? `Download complete. Notice: ${allUnsupportedChars.size} non-WinAnsi character(s) could not be embedded into the invisible layer.`
        : "Download initiated successfully!",
      progressPercent: 100,
    });
    return {
      unsupportedDetected: allUnsupportedChars.size > 0,
      unsupportedCharacters: Array.from(allUnsupportedChars),
      totalPages,
      pdfBytes: modifiedPdfBytes,
    };
  } finally {
    try { await worker?.terminate(); }
    finally { await pdf.destroy(); }
  }
}
