import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import {
  Download,
  FileText,
  RotateCw,
  Trash2,
  Type,
  Square,
  PenTool,
  Check,
  Plus,
  ArrowLeft,
  ArrowRight,
  Stamp,
  Upload,
  Eye,
  FileCheck,
  Move,
  Edit3,
  Sparkles,
  Calendar,
  Layers,
  ZoomIn,
  ZoomOut,
  Palette,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info
} from "lucide-react";
import { REDACTION_DISCLAIMER, rasterizePageWithAnnotations } from "../lib/pdfRedaction";

// Configure pdfjs worker safely with local, same-origin bundled worker
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("/pdf.worker.min.mjs", window.location.origin).href;
  } catch {
    // fallback if worker setup fails
  }
}

export interface TextAnnotation {
  id: string;
  pageIndex: number;
  type: "text";
  text: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  fontSize: number;
  color: string;
  isBold?: boolean;
  bgColor?: string; // "transparent" | "#ffffff" | "#fef08a" | "#000000"
}

export interface WhiteoutAnnotation {
  id: string;
  pageIndex: number;
  type: "whiteout";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface DrawingPath {
  id: string;
  pageIndex: number;
  type: "draw";
  points: { x: number; y: number }[]; // percentages
  color: string;
  strokeWidth: number;
}

export interface StampAnnotation {
  id: string;
  pageIndex: number;
  type: "stamp";
  text: string;
  x: number;
  y: number;
  color: string;
}

export type Annotation = TextAnnotation | WhiteoutAnnotation | DrawingPath | StampAnnotation;

export default function PdfEditorTool() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("document.pdf");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageRotations, setPageRotations] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "whiteout" | "draw" | "stamp">("text");
  
  // Active text tool configuration & draft text
  const [inputText, setInputText] = useState<string>("Sample Note");
  const [textColor, setTextColor] = useState<string>("#1e293b");
  const [fontSize, setFontSize] = useState<number>(14);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [textBgColor, setTextBgColor] = useState<string>("transparent");

  // Selected annotation for on-canvas editing / dragging
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDraggingSelected, setIsDraggingSelected] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Other tools options
  const [whiteoutColor, setWhiteoutColor] = useState<string>("#ffffff");
  const [drawColor, setDrawColor] = useState<string>("#ef4444");
  const [drawWidth, setDrawWidth] = useState<number>(3);
  const [stampText, setStampText] = useState<string>("CONFIDENTIAL");
  const [stampColor, setStampColor] = useState<string>("#ef4444");
  
  // Watermark & Page Numbering
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(false);

  // Security & Permanent Redaction options
  const [flattenRedactions, setFlattenRedactions] = useState<boolean>(true);
  const [showRedactionInfo, setShowRedactionInfo] = useState<boolean>(false);

  // Zoom scale for canvas viewport
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [whiteoutStart, setWhiteoutStart] = useState<{ x: number; y: number } | null>(null);
  const [tempWhiteout, setTempWhiteout] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Load sample PDF for instant testing
  const loadSamplePdf = async () => {
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]); // A4
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);
      
      page.drawText("Toolbox Galaxy — Verified PDF Document", {
        x: 50,
        y: 780,
        size: 20,
        font,
        color: rgb(0.1, 0.15, 0.3),
      });

      page.drawText("This is a local in-browser document ready for visual editing and text annotation.", {
        x: 50,
        y: 740,
        size: 12,
        font: regularFont,
        color: rgb(0.3, 0.35, 0.45),
      });

      page.drawText("Sample Form Fields & Notes:", {
        x: 50,
        y: 690,
        size: 14,
        font,
        color: rgb(0.1, 0.15, 0.3),
      });

      page.drawText("Name: _________________________________", {
        x: 50,
        y: 650,
        size: 12,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText("Date: __________________________________", {
        x: 50,
        y: 610,
        size: 12,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText("Status: [ Pending Verification ]", {
        x: 50,
        y: 570,
        size: 12,
        font: regularFont,
        color: rgb(0.8, 0.2, 0.2),
      });

      const page2 = doc.addPage([595, 842]);
      page2.drawText("Page 2: Terms & Confidential Details", {
        x: 50,
        y: 780,
        size: 18,
        font,
        color: rgb(0.1, 0.15, 0.3),
      });

      page2.drawText("Sensitive reference ID: TG-98442-SECRET-KEY", {
        x: 50,
        y: 740,
        size: 12,
        font: regularFont,
        color: rgb(0.5, 0.1, 0.1),
      });

      const bytes = await doc.save();
      setPdfBytes(bytes);
      setFileName("sample_document.pdf");
      setNumPages(2);
      setCurrentPage(0);
      setPageRotations([0, 0]);
      setAnnotations([]);
      setSelectedId(null);
      showToast("Interactive sample PDF loaded!");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate sample PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setPdfBytes(bytes);
      setFileName(file.name);
      setNumPages(count);
      setCurrentPage(0);
      setPageRotations(new Array(count).fill(0));
      setAnnotations([]);
      setSelectedId(null);
      showToast(`Loaded ${file.name} (${count} pages)`);
    } catch (err) {
      showToast("Could not load PDF. Please ensure it is unencrypted.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render current page to canvas using pdfjs-dist
  useEffect(() => {
    if (!pdfBytes || numPages === 0) return;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdf = await loadingTask.promise;
        if (isCancelled) return;
        
        const page = await pdf.getPage(currentPage + 1);
        const rotation = pageRotations[currentPage] || 0;
        const viewport = page.getViewport({ scale: 1.5 * zoomScale, rotation });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };
        await (page.render as any)(renderContext).promise;
      } catch (e) {
        console.warn("Canvas render notice:", e);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, currentPage, pageRotations, zoomScale]);

  // Handle overlay click to add Text, Whiteout, Stamp
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeTool === "text") {
      // Create new text annotation immediately using the current input text or default
      const textToAdd = inputText.trim() || "Type here...";
      const newAnnotation: TextAnnotation = {
        id: `text-${Date.now()}`,
        pageIndex: currentPage,
        type: "text",
        text: textToAdd,
        x,
        y,
        fontSize,
        color: textColor,
        isBold,
        bgColor: textBgColor,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedId(newAnnotation.id);
      showToast("Text placed! Click on it or use sidebar to edit");
    } else if (activeTool === "stamp") {
      const newStamp: StampAnnotation = {
        id: `stamp-${Date.now()}`,
        pageIndex: currentPage,
        type: "stamp",
        text: stampText,
        x,
        y,
        color: stampColor,
      };
      setAnnotations((prev) => [...prev, newStamp]);
      setSelectedId(newStamp.id);
      showToast(`Placed "${stampText}" stamp`);
    } else if (activeTool === "whiteout") {
      setWhiteoutStart({ x, y });
      setTempWhiteout({ x, y, w: 0, h: 0 });
    } else if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    } else if (activeTool === "select") {
      // Clicked on empty space
      setSelectedId(null);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (isDraggingSelected && selectedId) {
      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id === selectedId) {
            return {
              ...ann,
              x: Math.max(0, Math.min(95, x - dragOffset.x)),
              y: Math.max(0, Math.min(95, y - dragOffset.y)),
            };
          }
          return ann;
        })
      );
    } else if (activeTool === "draw" && isDrawing) {
      setCurrentPath((prev) => [...prev, { x, y }]);
    } else if (activeTool === "whiteout" && whiteoutStart) {
      const startX = Math.min(whiteoutStart.x, x);
      const startY = Math.min(whiteoutStart.y, y);
      const width = Math.abs(x - whiteoutStart.x);
      const height = Math.abs(y - whiteoutStart.y);
      setTempWhiteout({ x: startX, y: startY, w: width, h: height });
    }
  };

  const handleOverlayMouseUp = () => {
    if (isDraggingSelected) {
      setIsDraggingSelected(false);
    }
    if (activeTool === "draw" && isDrawing) {
      if (currentPath.length > 1) {
        const newDraw: DrawingPath = {
          id: `draw-${Date.now()}`,
          pageIndex: currentPage,
          type: "draw",
          points: currentPath,
          color: drawColor,
          strokeWidth: drawWidth,
        };
        setAnnotations((prev) => [...prev, newDraw]);
      }
      setIsDrawing(false);
      setCurrentPath([]);
    } else if (activeTool === "whiteout" && whiteoutStart && tempWhiteout) {
      if (tempWhiteout.w > 1 && tempWhiteout.h > 1) {
        const newWhiteout: WhiteoutAnnotation = {
          id: `whiteout-${Date.now()}`,
          pageIndex: currentPage,
          type: "whiteout",
          x: tempWhiteout.x,
          y: tempWhiteout.y,
          width: tempWhiteout.w,
          height: tempWhiteout.h,
          color: whiteoutColor,
        };
        setAnnotations((prev) => [...prev, newWhiteout]);
        setSelectedId(newWhiteout.id);
      }
      setWhiteoutStart(null);
      setTempWhiteout(null);
    }
  };

  // Rotate current page
  const rotateCurrentPage = () => {
    setPageRotations((prev) => {
      const updated = [...prev];
      updated[currentPage] = (updated[currentPage] + 90) % 360;
      return updated;
    });
    showToast(`Rotated page ${currentPage + 1}`);
  };

  // Delete an annotation
  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Delete current page
  const deleteCurrentPage = async () => {
    if (numPages <= 1) {
      showToast("Document must have at least one page.");
      return;
    }

    try {
      const doc = await PDFDocument.load(pdfBytes!);
      doc.removePage(currentPage);
      const updatedBytes = await doc.save();
      
      const newPageRotations = pageRotations.filter((_, idx) => idx !== currentPage);
      const newAnnotations = annotations
        .filter((a) => a.pageIndex !== currentPage)
        .map((a) => (a.pageIndex > currentPage ? { ...a, pageIndex: a.pageIndex - 1 } : a));

      setPdfBytes(updatedBytes);
      setNumPages(numPages - 1);
      setPageRotations(newPageRotations);
      setAnnotations(newAnnotations);
      setCurrentPage(Math.max(0, currentPage - 1));
      setSelectedId(null);
      showToast(`Deleted page ${currentPage + 1}`);
    } catch (e) {
      console.error(e);
      showToast("Failed to delete page");
    }
  };

  // Update text of selected annotation
  const updateSelectedAnnotationText = (newText: string) => {
    if (!selectedId) return;
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === selectedId && ann.type === "text" ? { ...ann, text: newText } : ann))
    );
  };

  // Update styling of selected annotation
  const updateSelectedAnnotationStyle = (updates: Partial<TextAnnotation>) => {
    if (!selectedId) return;
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === selectedId && ann.type === "text" ? { ...ann, ...updates } : ann))
    );
  };

  // Helper to parse hex color safely
  const parseHexColor = (hex: string, defaultVal = { r: 0, g: 0, b: 0 }) => {
    if (!hex || hex === "transparent" || !hex.startsWith("#") || hex.length < 7) {
      return defaultVal;
    }
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return {
      r: isNaN(r) ? defaultVal.r : r,
      g: isNaN(g) ? defaultVal.g : g,
      b: isNaN(b) ? defaultVal.b : b,
    };
  };

  // Export & Download Modified PDF
  const exportModifiedPdf = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const helvetica = await doc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const pageCount = doc.getPageCount();

      // Check which pages contain whiteout annotations
      const pagesWithWhiteout = new Set<number>();
      for (const ann of annotations) {
        if (ann.type === "whiteout") {
          pagesWithWhiteout.add(ann.pageIndex);
        }
      }

      // If true permanent redaction is enabled and whiteout boxes exist, load pdfjs for raster flattening
      let pdfJsDoc: any = null;
      if (flattenRedactions && pagesWithWhiteout.size > 0) {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        pdfJsDoc = await loadingTask.promise;
      }

      // Apply rotations for pages that will NOT be raster-flattened
      for (let i = 0; i < pageCount; i++) {
        if (!pagesWithWhiteout.has(i) || !flattenRedactions) {
          const page = doc.getPage(i);
          const addedRot = pageRotations[i] || 0;
          if (addedRot > 0) {
            page.setRotation(degrees((page.getRotation().angle + addedRot) % 360));
          }
        }
      }

      // Apply annotations per page
      for (let p = 0; p < pageCount; p++) {
        let page = doc.getPage(p);
        const pageAnns = annotations.filter((a) => a.pageIndex === p);
        const hasWhiteout = pageAnns.some((a) => a.type === "whiteout");

        // TRUE PERMANENT REDACTION:
        // Render page with pdfjs to high-resolution canvas, burn whiteout directly into 2D bitmap pixels,
        // and replace the original page with a clean page containing only the flattened image.
        // This permanently destroys underlying text streams, fonts, and object tree from the file.
        if (flattenRedactions && hasWhiteout && pdfJsDoc) {
          const pdfJsPage = await pdfJsDoc.getPage(p + 1);
          const addedRot = pageRotations[p] || 0;
          const baseRotation = pdfJsPage.rotate || 0;
          const totalRotation = (baseRotation + addedRot) % 360;

          const whiteoutAnns = pageAnns.filter((a) => a.type === "whiteout");
          const { imageBytes, ptWidth, ptHeight } = await rasterizePageWithAnnotations(
            pdfJsPage,
            whiteoutAnns,
            { scale: 2.0, rotation: totalRotation, quality: 0.94 }
          );

          const embeddedJpg = await doc.embedJpg(imageBytes);

          // Replace page at index p with clean raster page
          page = doc.insertPage(p, [ptWidth, ptHeight]);
          doc.removePage(p + 1);

          page.drawImage(embeddedJpg, {
            x: 0,
            y: 0,
            width: ptWidth,
            height: ptHeight,
          });
        }

        const { width, height } = page.getSize();

        for (const ann of pageAnns) {
          if (ann.type === "text") {
            const font = ann.isBold ? helveticaBold : helvetica;
            const pdfX = (ann.x / 100) * width;
            const pdfY = height - (ann.y / 100) * height - ann.fontSize;
            
            // Draw background rectangle if requested (e.g. Whiteout background or yellow highlight)
            if (ann.bgColor && ann.bgColor !== "transparent") {
              const bgRgb = parseHexColor(ann.bgColor, { r: 1, g: 1, b: 1 });
              const textWidth = font.widthOfTextAtSize(ann.text, ann.fontSize);
              const padding = 3;
              page.drawRectangle({
                x: pdfX - padding,
                y: pdfY - padding,
                width: textWidth + padding * 2,
                height: ann.fontSize + padding * 2,
                color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
              });
            }

            // Draw Text
            const textRgb = parseHexColor(ann.color, { r: 0.1, g: 0.1, b: 0.1 });
            page.drawText(ann.text, {
              x: pdfX,
              y: pdfY,
              size: ann.fontSize,
              font,
              color: rgb(textRgb.r, textRgb.g, textRgb.b),
            });
          } else if (ann.type === "whiteout") {
            // Only draw vector rectangle if page was NOT raster-flattened
            if (!flattenRedactions) {
              const pdfX = (ann.x / 100) * width;
              const pdfW = (ann.width / 100) * width;
              const pdfH = (ann.height / 100) * height;
              const pdfY = height - (ann.y / 100) * height - pdfH;
              const rectRgb = parseHexColor(ann.color, { r: 1, g: 1, b: 1 });

              page.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
                color: rgb(rectRgb.r, rectRgb.g, rectRgb.b),
              });
            }
          } else if (ann.type === "stamp") {
            const pdfX = (ann.x / 100) * width;
            const pdfY = height - (ann.y / 100) * height;
            const stampRgb = parseHexColor(ann.color, { r: 0.9, g: 0.2, b: 0.2 });

            page.drawText(ann.text, {
              x: pdfX,
              y: pdfY,
              size: 20,
              font: helveticaBold,
              color: rgb(stampRgb.r, stampRgb.g, stampRgb.b),
              rotate: degrees(-12),
            });
          } else if (ann.type === "draw" && ann.points.length > 1) {
            const lineRgb = parseHexColor(ann.color, { r: 0.9, g: 0.2, b: 0.2 });

            for (let i = 0; i < ann.points.length - 1; i++) {
              const p1 = ann.points[i];
              const p2 = ann.points[i + 1];
              page.drawLine({
                start: { x: (p1.x / 100) * width, y: height - (p1.y / 100) * height },
                end: { x: (p2.x / 100) * width, y: height - (p2.y / 100) * height },
                thickness: ann.strokeWidth,
                color: rgb(lineRgb.r, lineRgb.g, lineRgb.b),
              });
            }
          }
        }

        // Apply page numbers if enabled
        if (includePageNumbers) {
          const numText = `Page ${p + 1} of ${pageCount}`;
          page.drawText(numText, {
            x: width / 2 - 35,
            y: 20,
            size: 10,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }

        // Apply watermark if specified
        if (watermarkText.trim()) {
          page.drawText(watermarkText.trim(), {
            x: width * 0.18,
            y: height * 0.45,
            size: 40,
            font: helveticaBold,
            color: rgb(0.82, 0.82, 0.82),
            rotate: degrees(35),
          });
        }
      }

      const modifiedBytes = await doc.save();
      const blob = new Blob([modifiedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/\.pdf$/i, "") + "_edited.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      if (flattenRedactions && pagesWithWhiteout.size > 0) {
        showToast("PDF exported! Redacted pages permanently flattened (underlying text destroyed).");
      } else if (pagesWithWhiteout.size > 0) {
        showToast("PDF exported with visual vector overlays (underlying text preserved).");
      } else {
        showToast("PDF exported and downloaded successfully!");
      }
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (e) {
      showToast("Error compiling edited PDF: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAnnotations = annotations.filter((a) => a.pageIndex === currentPage);
  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  return (
    <div className="runner-stack space-y-5" id="pdf-visual-editor-container">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#0e1628] border border-[#c7f36b]/40 px-4 py-2.5 text-xs text-white shadow-2xl animate-fade-in">
          <Sparkles size={14} className="text-[#c7f36b]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Upload Header / Quick Start */}
      {!pdfBytes ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#c7f36b]" />
          <h3 className="mt-4 text-xl font-semibold text-white">Visual PDF Studio & Annotator</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Add text, apply visual whiteouts or permanent raster redactions, draw signatures, rotate pages, and stamp documents. 100% in-browser, zero server uploads.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label className="signal-button inline-flex cursor-pointer items-center gap-2">
              <Upload size={16} />
              Choose PDF File
              <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={loadSamplePdf} className="reset-button inline-flex items-center gap-2">
              <Eye size={16} />
              Load Interactive Sample PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {/* Top Main Command Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 shadow-lg">
            {/* Left: File Info & Zoom */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                <FileCheck className="text-[#c7f36b]" size={18} />
                <span className="font-mono text-xs sm:text-sm font-medium text-white truncate max-w-[180px] sm:max-w-[240px]">
                  {fileName}
                </span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/70 font-mono">
                  {numPages} {numPages === 1 ? "page" : "pages"}
                </span>
              </div>

              {/* Page Navigator */}
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => { setCurrentPage((p) => Math.max(0, p - 1)); setSelectedId(null); }}
                  className="p-1 text-white/80 hover:text-white disabled:opacity-30 transition-colors"
                  title="Previous Page"
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="text-xs font-mono text-white/90 px-1">
                  {currentPage + 1} / {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages - 1}
                  onClick={() => { setCurrentPage((p) => Math.min(numPages - 1, p + 1)); setSelectedId(null); }}
                  className="p-1 text-white/80 hover:text-white disabled:opacity-30 transition-colors"
                  title="Next Page"
                >
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
                <button
                  onClick={() => setZoomScale((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                  className="p-1 hover:text-[#c7f36b] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="px-2 font-mono text-[11px] text-white/70">{Math.round(zoomScale * 100)}%</span>
                <button
                  onClick={() => setZoomScale((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                  className="p-1 hover:text-[#c7f36b] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>

            {/* Right: Page Actions & Export Button */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={rotateCurrentPage}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                title="Rotate current page 90 degrees"
              >
                <RotateCw size={13} /> Rotate
              </button>
              <button
                type="button"
                onClick={deleteCurrentPage}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
                title="Delete current page"
              >
                <Trash2 size={13} /> Delete Page
              </button>
              <label className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors">
                Change PDF
                <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={exportModifiedPdf}
                disabled={isProcessing}
                className="signal-button flex items-center gap-1.5 bg-[#c7f36b] text-[#0b1020] font-semibold hover:bg-[#b8eb55] shadow-lg shadow-[#c7f36b]/10 py-1.5 px-4 text-xs"
              >
                {exportSuccess ? <Check size={15} /> : <Download size={15} />}
                {exportSuccess ? "Exported!" : "Export & Download PDF"}
              </button>
            </div>
          </div>

          {/* Main 2-Column Editor Layout: Left Sticky Controls + Right Canvas */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
            {/* Left Column: Sticky Control Panel */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-16 space-y-4 rounded-xl border border-white/10 bg-[#0e1628]/95 p-4 shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div>
                <p className="mono-label text-xs text-[#c7f36b]">01 · SELECT ACTIVE TOOL</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveTool("text"); setSelectedId(null); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "text"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Type size={14} /> Add Text
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("select"); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "select"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Move size={14} /> Select & Move
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("whiteout"); setSelectedId(null); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "whiteout"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Square size={14} /> Whiteout / Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("draw"); setSelectedId(null); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "draw"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <PenTool size={14} /> Signature / Pen
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("stamp"); setSelectedId(null); }}
                    className={`col-span-2 flex items-center justify-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "stamp"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Stamp size={14} /> Stamp Badge
                  </button>
                </div>
              </div>

              {/* Active Tool Config: Text Settings */}
              {activeTool === "text" && (
                <div className="space-y-3 rounded-lg border border-[#c7f36b]/30 bg-[#0b1322] p-3.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#c7f36b] flex items-center gap-1.5">
                      <Type size={14} /> Text Input & Format
                    </span>
                    <span className="text-[10px] font-mono text-[#c7f36b] bg-[#c7f36b]/10 px-1.5 py-0.5 rounded">READY</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-white/80 block mb-1">Text Content to Place:</label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        if (selectedAnnotation && selectedAnnotation.type === "text") {
                          updateSelectedAnnotationText(e.target.value);
                        }
                      }}
                      placeholder="Enter text (e.g. John Doe, Approved, Notes)"
                      className="w-full rounded border border-white/20 bg-black/60 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#c7f36b] focus:outline-none"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[10px] font-mono text-white/60 block mb-1">QUICK PRESETS:</span>
                    <div className="flex flex-wrap gap-1">
                      {["Approved", "Verified", new Date().toISOString().slice(0, 10), "Confidential"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setInputText(preset);
                            if (selectedAnnotation && selectedAnnotation.type === "text") {
                              updateSelectedAnnotationText(preset);
                            }
                          }}
                          className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/80 hover:border-[#c7f36b]/40 hover:bg-[#c7f36b]/10 hover:text-[#c7f36b] transition-colors"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size & Weight */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    <div>
                      <div className="flex justify-between text-[11px] text-white/70 mb-1">
                        <span>Font Size</span>
                        <span className="font-mono text-[#c7f36b]">{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={9}
                        max={36}
                        value={fontSize}
                        onChange={(e) => {
                          const size = Number(e.target.value);
                          setFontSize(size);
                          if (selectedAnnotation && selectedAnnotation.type === "text") {
                            updateSelectedAnnotationStyle({ fontSize: size });
                          }
                        }}
                        className="w-full h-1 bg-white/20 rounded-lg cursor-pointer accent-[#c7f36b]"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-1.5 text-xs text-white/80 cursor-pointer p-1 rounded hover:bg-white/5 w-full">
                        <input
                          type="checkbox"
                          checked={isBold}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsBold(val);
                            if (selectedAnnotation && selectedAnnotation.type === "text") {
                              updateSelectedAnnotationStyle({ isBold: val });
                            }
                          }}
                          className="accent-[#c7f36b]"
                        />
                        <span className="font-bold">Bold Text</span>
                      </label>
                    </div>
                  </div>

                  {/* Text Color Picker */}
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <span className="text-[11px] text-white/70 block">Text Color:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { color: "#1e293b", name: "Dark" },
                        { color: "#ffffff", name: "White" },
                        { color: "#ef4444", name: "Red" },
                        { color: "#2563eb", name: "Blue" },
                        { color: "#16a34a", name: "Green" },
                        { color: "#ff9b54", name: "Orange" },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          title={c.name}
                          onClick={() => {
                            setTextColor(c.color);
                            if (selectedAnnotation && selectedAnnotation.type === "text") {
                              updateSelectedAnnotationStyle({ color: c.color });
                            }
                          }}
                          className={`h-6 w-6 rounded-md border flex items-center justify-center transition-all ${
                            textColor === c.color ? "border-[#c7f36b] ring-2 ring-[#c7f36b]/40 scale-110" : "border-white/30"
                          }`}
                          style={{ backgroundColor: c.color }}
                        >
                          {textColor === c.color && (
                            <span className={c.color === "#ffffff" ? "text-black text-[10px]" : "text-white text-[10px]"}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Highlight */}
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <span className="text-[11px] text-white/70 block">Text Background Pill:</span>
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                      {[
                        { id: "transparent", label: "None" },
                        { id: "#ffffff", label: "White" },
                        { id: "#fef08a", label: "Yellow" },
                        { id: "#000000", label: "Black" },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            setTextBgColor(bg.id);
                            if (selectedAnnotation && selectedAnnotation.type === "text") {
                              updateSelectedAnnotationStyle({ bgColor: bg.id });
                            }
                          }}
                          className={`rounded border py-1 text-center transition-colors ${
                            textBgColor === bg.id
                              ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                              : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#c7f36b] bg-[#c7f36b]/10 p-2 rounded border border-[#c7f36b]/20">
                    💡 <b>Click anywhere on the document</b> to place this text directly.
                  </p>
                </div>
              )}

              {/* Whiteout Settings */}
              {activeTool === "whiteout" && (
                <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90">Visual Cover & Whiteout</span>
                    <button
                      type="button"
                      onClick={() => setShowRedactionInfo(true)}
                      className="text-[11px] text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
                    >
                      <ShieldAlert size={12} /> Security Notice
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWhiteoutColor("#ffffff")}
                      className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                        whiteoutColor === "#ffffff"
                          ? "border-[#c7f36b] bg-white text-black font-bold"
                          : "border-white/20 bg-white/5 text-white/70"
                      }`}
                    >
                      White Box
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhiteoutColor("#000000")}
                      className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                        whiteoutColor === "#000000"
                          ? "border-[#c7f36b] bg-black text-white font-bold"
                          : "border-white/20 bg-white/5 text-white/70"
                      }`}
                    >
                      Black Box
                    </button>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Click and drag directly on the page to place an opaque cover box.
                  </p>

                  <div className="rounded border border-amber-500/30 bg-amber-950/40 p-2.5 text-[11px] text-amber-200/90 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <ShieldAlert size={13} /> Visual Overlay Notice
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-amber-200/80">
                      Drawing a box places an opaque visual cover. To guarantee that underlying text cannot be extracted with copy-paste or pdftotext, keep <b>True Permanent Redaction (Raster Flattening)</b> enabled below.
                    </p>
                  </div>
                </div>
              )}

              {/* Draw Settings */}
              {activeTool === "draw" && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <span className="text-xs font-semibold text-white/90">Signature & Pen Settings</span>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span>Stroke: {drawWidth}px</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={drawWidth}
                      onChange={(e) => setDrawWidth(Number(e.target.value))}
                      className="w-24 accent-[#c7f36b]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span>Ink Color</span>
                    <div className="flex gap-1.5">
                      {["#ef4444", "#2563eb", "#10b981", "#000000", "#c7f36b"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDrawColor(c)}
                          className={`h-5 w-5 rounded-full border border-white/40 ${drawColor === c ? "ring-2 ring-[#c7f36b]" : ""}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50">Click and drag directly on the page to sign or sketch.</p>
                </div>
              )}

              {/* Stamp Settings */}
              {activeTool === "stamp" && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <span className="text-xs font-semibold text-white/90">Stamp Content</span>
                  <select
                    value={stampText}
                    onChange={(e) => setStampText(e.target.value)}
                    className="w-full rounded border border-white/10 bg-black/40 p-1.5 text-xs text-white"
                  >
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PAID">PAID</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="FINAL COPY">FINAL COPY</option>
                  </select>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span>Color</span>
                    <div className="flex gap-1.5">
                      {["#ef4444", "#16a34a", "#2563eb", "#d97706"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setStampColor(c)}
                          className={`h-5 w-5 rounded-full border border-white/40 ${stampColor === c ? "ring-2 ring-[#c7f36b]" : ""}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50">Click on the document page to place this stamp badge.</p>
                </div>
              )}

              {/* Select Tool Config */}
              {activeTool === "select" && (
                <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <span className="text-xs font-semibold text-white/90">Select & Move Tool</span>
                  <p className="text-xs text-white/70">
                    {selectedAnnotation
                      ? `Selected: ${selectedAnnotation.type.toUpperCase()}`
                      : "Click any annotation on the page to drag and reposition it."}
                  </p>
                  {selectedId && (
                    <button
                      type="button"
                      onClick={() => deleteAnnotation(selectedId)}
                      className="w-full flex items-center justify-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30 border border-red-500/40"
                    >
                      <Trash2 size={12} /> Delete Selected Item
                    </button>
                  )}
                </div>
              )}

              {/* Security & Permanent Redaction */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="mono-label text-xs text-[#c7f36b] flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={13} /> REDACTION & PRIVACY
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRedactionInfo(true)}
                    className="text-[10px] text-white/50 hover:text-white/80 underline cursor-pointer"
                  >
                    What is this?
                  </button>
                </div>
                <label className="flex items-start gap-2.5 text-xs text-white/90 cursor-pointer p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={flattenRedactions}
                    onChange={(e) => setFlattenRedactions(e.target.checked)}
                    className="mt-0.5 accent-[#c7f36b]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">True Permanent Redaction</span>
                      <span className="text-[9px] font-mono uppercase bg-[#c7f36b]/20 text-[#c7f36b] px-1 py-0.2 rounded font-bold">Destroy Text</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Rasterizes pages containing cover boxes into flat pixels on export. Permanently destroys underlying text streams, fonts, and metadata so sensitive data cannot be copied or extracted.
                    </p>
                  </div>
                </label>
              </div>

              {/* Document Additions */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="mono-label text-xs text-white/60">WATERMARK & NUMBERING</p>
                <div>
                  <label className="text-[11px] text-white/70">Diagonal Watermark</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. DRAFT or CONFIDENTIAL"
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-xs text-white placeholder-white/30"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={includePageNumbers}
                    onChange={(e) => setIncludePageNumbers(e.target.checked)}
                    className="accent-[#c7f36b]"
                  />
                  <span>Add Page Numbers (Page X of Y)</span>
                </label>
              </div>

              {/* Page Annotations List */}
              {currentAnnotations.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <p className="mono-label text-xs text-white/60">PAGE {currentPage + 1} EDITS ({currentAnnotations.length})</p>
                  <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                    {currentAnnotations.map((ann) => {
                      const isSelected = ann.id === selectedId;
                      return (
                        <div
                          key={ann.id}
                          onClick={() => {
                            setSelectedId(ann.id);
                            if (ann.type === "text") {
                              setInputText(ann.text);
                              setTextColor(ann.color);
                              setFontSize(ann.fontSize);
                              setIsBold(!!ann.isBold);
                              if (ann.bgColor) setTextBgColor(ann.bgColor);
                            }
                          }}
                          className={`flex items-center justify-between rounded px-2 py-1 text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? "border border-[#c7f36b] bg-[#c7f36b]/10 text-white font-medium"
                              : "border border-white/5 bg-white/5 text-white/80 hover:bg-white/10"
                          }`}
                        >
                          <span className="truncate max-w-[150px]">
                            {ann.type === "text" ? `Text: "${ann.text}"` : ann.type === "stamp" ? `Stamp: ${ann.text}` : ann.type === "whiteout" ? "Whiteout / Cover Box" : "Pen Stroke"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnnotation(ann.id);
                            }}
                            className="text-red-400 hover:text-red-300 ml-2 p-0.5"
                            title="Delete edit"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: PDF Canvas Workspace */}
            <div className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-white/15 bg-[#141a29] p-4 sm:p-6 flex flex-col items-center shadow-2xl min-h-[650px] overflow-auto">
            {/* Floating Top Status Bar */}
            <div className="mb-4 flex items-center justify-between w-full max-w-4xl px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/70">
                  Page {currentPage + 1} of {numPages}
                </span>
                {pageRotations[currentPage] ? (
                  <span className="rounded bg-[#c7f36b]/15 px-2 py-0.5 text-[10px] font-mono text-[#c7f36b] border border-[#c7f36b]/30">
                    {pageRotations[currentPage]}° Rotated
                  </span>
                ) : null}
              </div>

              {currentAnnotations.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white/80 border border-white/10 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#c7f36b]" />
                  <span>{currentAnnotations.length} annotations on Page {currentPage + 1}</span>
                </div>
              )}
            </div>

            {/* Rendered Document Page */}
            <div className="relative inline-block select-none shadow-2xl transition-all">
              {/* PDF Canvas */}
              <canvas ref={canvasRef} className="block rounded bg-white shadow-2xl" />

              {/* Interactive Drawing & Annotation Layer */}
              <div
                ref={overlayRef}
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                className={`absolute inset-0 ${
                  activeTool === "text"
                    ? "cursor-crosshair"
                    : activeTool === "draw" || activeTool === "whiteout"
                    ? "cursor-crosshair"
                    : activeTool === "stamp"
                    ? "cursor-cell"
                    : "cursor-default"
                }`}
              >
                    {/* Render active page annotations */}
                    {currentAnnotations.map((ann) => {
                      const isSelected = ann.id === selectedId;

                      if (ann.type === "text") {
                        const isWhiteText = ann.color.toLowerCase() === "#ffffff";
                        return (
                          <div
                            key={ann.id}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedId(ann.id);
                              setInputText(ann.text);
                              setTextColor(ann.color);
                              setFontSize(ann.fontSize);
                              setIsBold(!!ann.isBold);
                              if (ann.bgColor) setTextBgColor(ann.bgColor);
                              
                              // Start dragging
                              if (overlayRef.current) {
                                const rect = overlayRef.current.getBoundingClientRect();
                                const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
                                const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
                                setDragOffset({ x: mouseX - ann.x, y: mouseY - ann.y });
                                setIsDraggingSelected(true);
                              }
                            }}
                            style={{
                              position: "absolute",
                              left: `${ann.x}%`,
                              top: `${ann.y}%`,
                              color: ann.color,
                              fontSize: `${ann.fontSize * 1.5 * zoomScale}px`,
                              fontWeight: ann.isBold ? "bold" : "normal",
                              backgroundColor: ann.bgColor && ann.bgColor !== "transparent" ? ann.bgColor : "transparent",
                              padding: "1px 4px",
                              borderRadius: "2px",
                              cursor: "move",
                              userSelect: "none",
                              textShadow: isWhiteText ? "0 0 3px rgba(0,0,0,0.8), 0 0 1px #000000" : "0 0 2px rgba(255,255,255,0.8)",
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b, 0 0 8px rgba(199,243,107,0.5)" : "none",
                            }}
                            className="group transition-shadow inline-block max-w-[90%]"
                          >
                            {isSelected ? (
                              <input
                                type="text"
                                value={ann.text}
                                autoFocus
                                onChange={(e) => updateSelectedAnnotationText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  color: ann.color,
                                  fontSize: "inherit",
                                  fontWeight: "inherit",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  outline: "none",
                                  minWidth: "60px",
                                }}
                              />
                            ) : (
                              <span>{ann.text}</span>
                            )}
                          </div>
                        );
                      }
                      if (ann.type === "whiteout") {
                        return (
                          <div
                            key={ann.id}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedId(ann.id);
                              if (overlayRef.current) {
                                const rect = overlayRef.current.getBoundingClientRect();
                                const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
                                const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
                                setDragOffset({ x: mouseX - ann.x, y: mouseY - ann.y });
                                setIsDraggingSelected(true);
                              }
                            }}
                            style={{
                              position: "absolute",
                              left: `${ann.x}%`,
                              top: `${ann.y}%`,
                              width: `${ann.width}%`,
                              height: `${ann.height}%`,
                              backgroundColor: ann.color,
                              border: isSelected ? "2px solid #c7f36b" : "1px dashed rgba(0,0,0,0.25)",
                              cursor: "move",
                            }}
                          />
                        );
                      }
                      if (ann.type === "stamp") {
                        return (
                          <div
                            key={ann.id}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedId(ann.id);
                              if (overlayRef.current) {
                                const rect = overlayRef.current.getBoundingClientRect();
                                const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
                                const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
                                setDragOffset({ x: mouseX - ann.x, y: mouseY - ann.y });
                                setIsDraggingSelected(true);
                              }
                            }}
                            style={{
                              position: "absolute",
                              left: `${ann.x}%`,
                              top: `${ann.y}%`,
                              color: ann.color,
                              border: `2px solid ${ann.color}`,
                              padding: "2px 8px",
                              fontSize: `${16 * zoomScale}px`,
                              fontWeight: "bold",
                              borderRadius: "4px",
                              transform: "rotate(-12deg)",
                              cursor: "move",
                              backgroundColor: "rgba(255,255,255,0.85)",
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b" : "none",
                            }}
                          >
                            {ann.text}
                          </div>
                        );
                      }
                      if (ann.type === "draw") {
                        const pathD = ann.points.reduce(
                          (acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
                          ""
                        );
                        return (
                          <svg
                            key={ann.id}
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <path
                              d={pathD}
                              stroke={ann.color}
                              strokeWidth={ann.strokeWidth * 0.4}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        );
                      }
                      return null;
                    })}

                    {/* Temporary drawing stroke */}
                    {activeTool === "draw" && isDrawing && currentPath.length > 1 && (
                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <path
                          d={currentPath.reduce(
                            (acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
                            ""
                          )}
                          stroke={drawColor}
                          strokeWidth={drawWidth * 0.4}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    {/* Temporary whiteout drag box */}
                    {activeTool === "whiteout" && tempWhiteout && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${tempWhiteout.x}%`,
                          top: `${tempWhiteout.y}%`,
                          width: `${tempWhiteout.w}%`,
                          height: `${tempWhiteout.h}%`,
                          backgroundColor: whiteoutColor,
                          border: "1px dashed #ef4444",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Redaction Security Info Modal */}
        {showRedactionInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-lg w-full rounded-xl border border-white/20 bg-[#0e1628] p-6 shadow-2xl space-y-4 text-white animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
                  <ShieldAlert size={20} />
                  <span>{REDACTION_DISCLAIMER.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRedactionInfo(false)}
                  className="text-white/50 hover:text-white text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-white/80">
                <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-red-200">
                  <p className="font-semibold text-red-400 mb-1">The Critical Security Vulnerability:</p>
                  <p>{REDACTION_DISCLAIMER.riskDescription}</p>
                </div>

                <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 space-y-2">
                  <p className="font-semibold text-white">How This Studio Protects Your Privacy:</p>
                  <p>{REDACTION_DISCLAIMER.permanentRedactionAdvice}</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                    <li><b>Selective Flattening:</b> Pages with cover boxes are flattened into high-resolution bitmap images (scale 2.0x, ~150 DPI).</li>
                    <li><b>Text Stream Purging:</b> All underlying font definitions, text operators (<code className="text-amber-300">Tj/TJ</code>), and metadata on those pages are permanently deleted.</li>
                    <li><b>Original Pages Preserved:</b> Pages without cover edits retain crisp vector text and smaller file size.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRedactionInfo(false)}
                  className="signal-button text-xs px-4 py-2 cursor-pointer"
                >
                  Understood & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
