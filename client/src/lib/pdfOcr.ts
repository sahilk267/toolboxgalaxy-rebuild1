import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, StandardFonts } from "pdf-lib";

export interface OcrPageProgress {
  currentPage: number;
  totalPages: number;
  status: string;
  progressPercent: number;
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
export async function runClientSidePdfOcr(
  pdfBytes: Uint8Array,
  onProgress?: (progress: OcrPageProgress) => void
): Promise<{
  fullText: string;
  pages: OcrPageResult[];
  averageConfidence: number;
}> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  onProgress?.({
    currentPage: 0,
    totalPages,
    status: "Initializing OCR Engine...",
    progressPercent: 5,
  });

  const worker = await createWorker("eng");
  const pageResults: OcrPageResult[] = [];
  let fullText = "";
  let totalConfidence = 0;

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      currentPage: i,
      totalPages,
      status: `Rendering Page ${i} for OCR...`,
      progressPercent: Math.round(((i - 1) / totalPages) * 100),
    });

    const page = await pdf.getPage(i);
    // Render at 2.0 scale for sharp optical character recognition
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

    onProgress?.({
      currentPage: i,
      totalPages,
      status: `Extracting text from Page ${i}...`,
      progressPercent: Math.round(((i - 0.5) / totalPages) * 100),
    });

    const ocrResult = await worker.recognize(canvas);
    const text = ocrResult.data.text.trim();
    const confidence = ocrResult.data.confidence;

    totalConfidence += confidence;
    pageResults.push({
      pageNumber: i,
      text,
      confidence,
    });

    fullText += `--- OCR PAGE ${i} (Confidence: ${Math.round(confidence)}%) ---\n\n${text}\n\n`;
  }

  await worker.terminate();

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    status: "OCR Processing Complete!",
    progressPercent: 100,
  });

  return {
    fullText: fullText.trim(),
    pages: pageResults,
    averageConfidence: totalPages > 0 ? Math.round(totalConfidence / totalPages) : 0,
  };
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
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  onProgress?.({
    currentPage: 0,
    totalPages,
    status: "Initializing OCR Engine for Searchable PDF...",
    progressPercent: 5,
  });

  const pdfDoc = await PDFDocument.load(pdfBytes.slice());
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const worker = await createWorker("eng");

  try {
    for (let i = 1; i <= totalPages; i++) {
      onProgress?.({
        currentPage: i,
        totalPages,
        status: `Generating Searchable Layer for Page ${i} of ${totalPages}...`,
        progressPercent: Math.round(((i - 0.5) / totalPages) * 100),
      });

      const page = await pdf.getPage(i);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

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
      const pdfPage = pdfDoc.getPage(i - 1);
      const { height: pageHeight } = pdfPage.getSize();

      const lines: any[] = (ocrResult.data as any).lines || [];
      for (const line of lines) {
        const cleanLineText = line.text.replace(/[\r\n]+/g, " ").trim();
        if (!cleanLineText) continue;

        const pdfX = line.bbox.x0 / scale;
        const boxHeight = (line.bbox.y1 - line.bbox.y0) / scale;
        const pdfY = pageHeight - (line.bbox.y1 / scale);
        const fontSize = Math.max(6, Math.min(22, boxHeight * 0.82));

        try {
          // Clean WinAnsi incompatible characters to prevent font rendering errors
          const safeText = cleanLineText.replace(/[^\x20-\x7E]/g, " ");
          pdfPage.drawText(safeText, {
            x: Math.max(0, pdfX),
            y: Math.max(0, pdfY),
            size: fontSize,
            font: helvetica,
            opacity: 0, // Searchable, selectable invisible text
          });
        } catch {
          // Skip any non-standard glyph errors
        }
      }
    }

    await worker.terminate();

    onProgress?.({
      currentPage: totalPages,
      totalPages,
      status: "Finalizing Searchable PDF...",
      progressPercent: 98,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, "") + "_searchable.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    onProgress?.({
      currentPage: totalPages,
      totalPages,
      status: "Download initiated successfully!",
      progressPercent: 100,
    });
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}
