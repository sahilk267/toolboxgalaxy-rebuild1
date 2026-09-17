import { PDFDocument, PDFImage } from "pdf-lib";

export interface RedactionNotice {
  title: string;
  summary: string;
  riskDescription: string;
  permanentRedactionAdvice: string;
}

export const REDACTION_DISCLAIMER: RedactionNotice = {
  title: "Visual Whiteout vs. Permanent Redaction",
  summary: "Standard PDF whiteout/black boxes are opaque vector overlays that visually cover content on screen and paper, but do NOT remove underlying text streams from the electronic PDF file.",
  riskDescription: "Sharing an electronically covered PDF without page flattening allows recipients to copy-paste, pdftotext, or unmask sensitive data (such as SSNs, Aadhaar, account numbers).",
  permanentRedactionAdvice: "Enable 'True Permanent Redaction (Flatten to Pixels)' on export. This rasterizes pages containing redactions into solid bitmap images, permanently destroying all underlying text layers and objects.",
};

/**
 * Replaces page at index `pageIndex` in `doc` with a clean, text-free page
 * containing only the flattened raster image.
 * This permanently destroys the original page's text streams, fonts, and object tree.
 */
export function replacePageWithRasterImage(
  doc: PDFDocument,
  pageIndex: number,
  width: number,
  height: number,
  image: PDFImage
) {
  const newPage = doc.insertPage(pageIndex, [width, height]);
  // The old page shifts to pageIndex + 1
  doc.removePage(pageIndex + 1);
  newPage.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  });
  return newPage;
}

export interface PageRasterizeOptions {
  scale?: number;
  quality?: number;
  rotation?: number;
}

/**
 * Renders a PDF page via pdf.js to an offscreen canvas, burns whiteout/redaction
 * overlays permanently into the 2D bitmap pixels, and returns pure image bytes.
 */
export async function rasterizePageWithAnnotations(
  pdfJsPage: any,
  whiteoutAnnotations: Array<{ x: number; y: number; width: number; height: number; color?: string }>,
  options: PageRasterizeOptions = {}
): Promise<{ imageBytes: Uint8Array; ptWidth: number; ptHeight: number }> {
  const scale = options.scale || 2.0;
  const rotation = options.rotation || 0;
  const viewport = pdfJsPage.getViewport({ scale, rotation });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to initialize canvas 2D rendering context");
  }

  await (pdfJsPage.render as any)({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Permanently draw whiteout / redaction overlays into the 2D pixel bitmap
  for (const ann of whiteoutAnnotations) {
    const bx = (ann.x / 100) * canvas.width;
    const by = (ann.y / 100) * canvas.height;
    const bw = (ann.width / 100) * canvas.width;
    const bh = (ann.height / 100) * canvas.height;
    ctx.fillStyle = ann.color || "#ffffff";
    ctx.fillRect(bx, by, bw, bh);
  }

  const dataUrl = canvas.toDataURL("image/jpeg", options.quality || 0.93);
  const base64 = dataUrl.split(",")[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return {
    imageBytes: bytes,
    ptWidth: viewport.width / scale,
    ptHeight: viewport.height / scale,
  };
}
