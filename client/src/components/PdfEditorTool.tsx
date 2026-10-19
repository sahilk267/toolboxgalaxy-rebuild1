import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees, PDFString } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { trackPageView } from "../lib/analytics";
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
  Info,
  QrCode,
  Tag,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  Link as LinkIcon,
  Highlighter,
  Image as ImageIcon,
  Copy,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  ScanText,
  FileDown,
  FileCode,
  Undo2,
  Redo2,
  Circle,
  Shapes,
  Maximize2,
  Minimize2,
  Pipette,
  Search,
  Pin,
  PinOff,
} from "lucide-react";
import { REDACTION_DISCLAIMER, rasterizePageWithAnnotations } from "../lib/pdfRedaction";
import {
  calculateSha256,
  inspectPdfMetadata,
  sanitizePdfDocument,
  applyBatesStamping,
  appendAuditCertificate,
  PdfMetadataReport,
  BatesStampingOptions,
} from "../lib/enterprisePdf";
import {
  exportPdfToTextFile,
  exportPdfToExcelWorkbook,
  exportPdfToWordDocx,
  exportPdfToPresentationPpt,
} from "../lib/pdfExtraction";
import {
  runClientSidePdfOcr,
  exportSearchablePdf,
  OcrPageProgress,
} from "../lib/pdfOcr";
import {
  inspectPdfNature,
  parseDigitalPdfStructure,
  parseScannedPdfWithLayoutOcr,
  exportStructureToDocx,
  exportStructureToHtml,
  exportStructureToMarkdown,
  DocumentStructure,
} from "../lib/pdfLayoutEngine";
import { sanitizeWinAnsiText } from "../lib/pdfTextSanitizer";
import {
  extractInteractiveTextBlocks,
  DetectedTextBlock,
  DetectedFontProfile,
} from "../lib/pdfFontDetector";

import { ensurePdfWorkerConfigured } from "../lib/pdfWorkerSetup";

// Configure pdfjs worker safely with local same-origin Blob, .js, and CDN fallbacks
ensurePdfWorkerConfigured();

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
  isItalic?: boolean;
  fontFamily?: "Helvetica" | "Times-Roman" | "Courier";
  cleanFontName?: string;
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

export interface ImageAnnotation {
  id: string;
  pageIndex: number;
  type: "image";
  imageDataUrl: string;
  bytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LinkAnnotation {
  id: string;
  pageIndex: number;
  type: "link";
  url: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HighlightAnnotation {
  id: string;
  pageIndex: number;
  type: "highlight";
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShapeAnnotation {
  id: string;
  pageIndex: number;
  type: "shape";
  shapeType: "rectangle" | "circle" | "arrow" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
}

export interface InPlaceEditAnnotation {
  id: string;
  pageIndex: number;
  type: "inplace-edit";
  originalText: string;
  newText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  bgColor: string;
  fontSize: number;
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  cleanFontName: string;
  isBold: boolean;
  isItalic: boolean;
}

export type Annotation =
  | TextAnnotation
  | WhiteoutAnnotation
  | DrawingPath
  | StampAnnotation
  | ImageAnnotation
  | LinkAnnotation
  | HighlightAnnotation
  | ShapeAnnotation
  | InPlaceEditAnnotation;

interface PdfPageThumbnailProps {
  pageIndex: number;
  pdfBytes: Uint8Array;
  isActive: boolean;
  rotation: number;
  annotationCount: number;
  onClick: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
  onMoveLeft: () => void;
  canMoveLeft: boolean;
  onMoveRight: () => void;
  canMoveRight: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function PdfPageThumbnail({
  pageIndex,
  pdfBytes,
  isActive,
  rotation,
  annotationCount,
  onClick,
  onRotate,
  onDuplicate,
  onDelete,
  canDelete,
  onMoveLeft,
  canMoveLeft,
  onMoveRight,
  canMoveRight,
  onDragStart,
  onDragOver,
  onDrop,
}: PdfPageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const renderThumb = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdf = await loadingTask.promise;
        if (isCancelled) return;
        const page = await pdf.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: 0.22, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await (page.render as any)({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;
      } catch {
        // ignore cancelled renders
      }
    };
    renderThumb();
    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, pageIndex, rotation]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group relative flex flex-col items-center rounded-lg border p-1.5 transition-all select-none cursor-pointer flex-shrink-0 ${
        isActive
          ? "border-[#c7f36b] bg-[#c7f36b]/15 ring-2 ring-[#c7f36b]/40 shadow-lg"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded shadow-sm bg-white min-h-[85px] min-w-[60px] flex items-center justify-center">
        <canvas ref={canvasRef} className="block max-w-[80px] max-h-[110px]" />
        {rotation ? (
          <span className="absolute top-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 text-[9px] font-mono text-[#c7f36b]">
            {rotation}°
          </span>
        ) : null}
        {annotationCount > 0 && (
          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/80 px-1 py-0.2 text-[9px] font-mono text-white/90">
            {annotationCount} edit{annotationCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between w-full px-1 text-[11px] font-mono text-white/70">
        <span className={isActive ? "text-[#c7f36b] font-bold" : ""}>{pageIndex + 1}</span>
        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {canMoveLeft && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveLeft();
              }}
              className="p-0.5 hover:text-[#c7f36b]"
              title="Move left"
            >
              <ChevronLeft size={11} />
            </button>
          )}
          {canMoveRight && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveRight();
              }}
              className="p-0.5 hover:text-[#c7f36b]"
              title="Move right"
            >
              <ChevronRight size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
            className="p-0.5 hover:text-[#c7f36b]"
            title="Rotate 90°"
          >
            <RotateCw size={11} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-0.5 hover:text-[#c7f36b]"
            title="Duplicate"
          >
            <Copy size={11} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-0.5 text-red-400 hover:text-red-300"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface PdfEditorToolProps {
  initialPdfBytes?: Uint8Array | null;
  initialFileName?: string;
  onPdfLoaded?: (bytes: Uint8Array, name: string) => void;
}

export default function PdfEditorTool({
  initialPdfBytes = null,
  initialFileName = "",
  onPdfLoaded,
}: PdfEditorToolProps = {}) {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(initialPdfBytes);
  const [fileName, setFileName] = useState<string>(initialFileName || "document.pdf");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageRotations, setPageRotations] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<
    "select" | "smart-edit" | "text" | "whiteout" | "draw" | "stamp" | "image" | "link" | "highlight" | "shape"
  >("smart-edit");
  
  // History Undo / Redo Stack Engine (GAP-01)
  const undoStackRef = useRef<{ annotations: Annotation[]; pageRotations: number[] }[]>([]);
  const redoStackRef = useRef<{ annotations: Annotation[]; pageRotations: number[] }[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Active text tool configuration & draft text
  const [inputText, setInputText] = useState<string>("Sample Note");
  const [textColor, setTextColor] = useState<string>("#1e293b");
  const [fontSize, setFontSize] = useState<number>(14);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "Times-Roman" | "Courier">("Helvetica");
  const [textBgColor, setTextBgColor] = useState<string>("transparent");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Selected annotation for on-canvas editing / dragging & Resizing (GAP-03)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDraggingSelected, setIsDraggingSelected] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<"nw" | "ne" | "se" | "sw" | null>(null);
  const [resizeInitialBox, setResizeInitialBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [resizeStartMouse, setResizeStartMouse] = useState<{ x: number; y: number } | null>(null);

  // Geometric Vector Shape Tool State (GAP-05)
  const [shapeType, setShapeType] = useState<"rectangle" | "circle" | "arrow" | "line">("rectangle");
  const [shapeStrokeColor, setShapeStrokeColor] = useState<string>("#2563eb");
  const [shapeFillColor, setShapeFillColor] = useState<string>("transparent");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(3);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [tempShape, setTempShape] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Other tools options
  const [whiteoutColor, setWhiteoutColor] = useState<string>("#ffffff");
  const [drawColor, setDrawColor] = useState<string>("#ef4444");
  const [drawWidth, setDrawWidth] = useState<number>(3);
  const [stampText, setStampText] = useState<string>("CONFIDENTIAL");
  const [stampColor, setStampColor] = useState<string>("#ef4444");
  
  // Watermark & Page Numbering & Header/Footer
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(false);
  const [headerText, setHeaderText] = useState<string>("");
  const [footerText, setFooterText] = useState<string>("");

  // Security & Permanent Redaction options
  const [flattenRedactions, setFlattenRedactions] = useState<boolean>(true);
  const [showRedactionInfo, setShowRedactionInfo] = useState<boolean>(false);

  // Zoom scale for canvas viewport & container ref for Fit to Width (GAP-07)
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Custom export filename (GAP-08)
  const [customExportName, setCustomExportName] = useState<string>("");

  // Enterprise Legal, Bates & Audit Suite State
  const [enableBates, setEnableBates] = useState<boolean>(false);
  const [batesPrefix, setBatesPrefix] = useState<string>("CASE-2026-");
  const [batesStart, setBatesStart] = useState<number>(1);
  const [batesDigits, setBatesDigits] = useState<number>(6);
  const [batesSuffix, setBatesSuffix] = useState<string>("");
  const [batesPosition, setBatesPosition] = useState<BatesStampingOptions["position"]>("bottom-right");
  const [batesFontSize, setBatesFontSize] = useState<number>(9);
  const [batesColor, setBatesColor] = useState<string>("#1f2937");
  const [sanitizeMetadata, setSanitizeMetadata] = useState<boolean>(false);
  const [includeAuditCertificate, setIncludeAuditCertificate] = useState<boolean>(false);
  const [originalSha256, setOriginalSha256] = useState<string>("");
  const [metadataReport, setMetadataReport] = useState<PdfMetadataReport | null>(null);

  // Rich Annotations State (Images, Links, Highlights)
  const [linkUrl, setLinkUrl] = useState<string>("https://");
  const [highlightColor, setHighlightColor] = useState<string>("rgba(250, 204, 21, 0.45)");
  const [highlightStart, setHighlightStart] = useState<{ x: number; y: number } | null>(null);
  const [tempHighlight, setTempHighlight] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Document Management & Thumbnails
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  // OCR & Export Engine State
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(0);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);
  const [ocrResultText, setOcrResultText] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [detectedPdfNature, setDetectedPdfNature] = useState<{ isScanned: boolean; totalChars: number; numPages: number } | null>(null);
  const [documentStructure, setDocumentStructure] = useState<DocumentStructure | null>(null);
  const [ocrActiveTab, setOcrActiveTab] = useState<"formatted" | "raw">("formatted");

  // Intelligent Auto-Font & In-Place Text Editing State (Editing Mode)
  const [detectedBlocks, setDetectedBlocks] = useState<DetectedTextBlock[]>([]);
  const [isExtractingBlocks, setIsExtractingBlocks] = useState<boolean>(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [activeInlineBlock, setActiveInlineBlock] = useState<DetectedTextBlock | null>(null);
  const [inlineDraftText, setInlineDraftText] = useState<string>("");
  const [smartEditSearchQuery, setSmartEditSearchQuery] = useState<string>("");

  // Sync initialPdfBytes or sessionStorage load on mount
  useEffect(() => {
    if (initialPdfBytes && initialPdfBytes.length > 0) {
      PDFDocument.load(initialPdfBytes.slice(), { ignoreEncryption: true })
        .then(async (doc) => {
          const count = doc.getPageCount();
          const sha = await calculateSha256(initialPdfBytes);
          const meta = inspectPdfMetadata(doc);
          setOriginalSha256(sha);
          setMetadataReport(meta);
          setPdfBytes(initialPdfBytes);
          if (initialFileName) setFileName(initialFileName);
          setNumPages(count);
          setCurrentPage(0);
          setPageRotations(new Array(count).fill(0));
          setAnnotations([]);
          setSelectedId(null);
        })
        .catch(() => {});
    } else {
      try {
        const storedBase64 = sessionStorage.getItem("tg_studio_load_pdf");
        const storedName = sessionStorage.getItem("tg_studio_load_name");
        if (storedBase64) {
          sessionStorage.removeItem("tg_studio_load_pdf");
          sessionStorage.removeItem("tg_studio_load_name");
          const binaryStr = atob(storedBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          PDFDocument.load(bytes.slice(), { ignoreEncryption: true })
            .then(async (doc) => {
              const count = doc.getPageCount();
              const sha = await calculateSha256(bytes);
              const meta = inspectPdfMetadata(doc);
              setOriginalSha256(sha);
              setMetadataReport(meta);
              setPdfBytes(bytes);
              if (storedName) setFileName(storedName);
              setNumPages(count);
              setCurrentPage(0);
              setPageRotations(new Array(count).fill(0));
              setAnnotations([]);
              setSelectedId(null);
            })
            .catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [initialPdfBytes, initialFileName]);

  // Auto-scan PDF typography and layout when smart-edit mode is active
  useEffect(() => {
    if (pdfBytes && activeTool === "smart-edit") {
      setIsExtractingBlocks(true);
      extractInteractiveTextBlocks(pdfBytes, currentPage)
        .then((blocks) => {
          setDetectedBlocks(blocks);
          setIsExtractingBlocks(false);
        })
        .catch(() => {
          setIsExtractingBlocks(false);
        });
    } else if (activeTool !== "smart-edit") {
      setActiveInlineBlock(null);
    }
  }, [pdfBytes, currentPage, activeTool]);

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
  // Panel freeze / sticky status & Studio Viewport mode
  const [isPanelFrozen, setIsPanelFrozen] = useState<boolean>(true);
  const [studioViewMode, setStudioViewMode] = useState<"page-scroll" | "viewport">("page-scroll");

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Push current state into undo stack before mutating (GAP-01)
  const pushHistorySnapshot = () => {
    undoStackRef.current.push({
      annotations: JSON.parse(JSON.stringify(annotations)),
      pageRotations: [...pageRotations],
    });
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push({
      annotations: JSON.parse(JSON.stringify(annotations)),
      pageRotations: [...pageRotations],
    });
    setAnnotations(prev.annotations);
    setPageRotations(prev.pageRotations);
    setSelectedId(null);
    setEditingTextId(null);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    showToast("Reverted change (Undo)");
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push({
      annotations: JSON.parse(JSON.stringify(annotations)),
      pageRotations: [...pageRotations],
    });
    setAnnotations(next.annotations);
    setPageRotations(next.pageRotations);
    setSelectedId(null);
    setEditingTextId(null);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    showToast("Restored change (Redo)");
  };

  // Viewport Presets: Fit to Width & Standard (GAP-07)
  const fitToWidth = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const containerW = containerRef.current.clientWidth - 48;
    const canvasNaturalW = canvasRef.current.width / (zoomScale * 1.5) || 595;
    if (canvasNaturalW > 0) {
      const calculatedScale = Math.max(0.4, Math.min(2.0, Number((containerW / (canvasNaturalW * 1.5)).toFixed(2))));
      setZoomScale(calculatedScale);
      showToast(`Fit to Width: ${Math.round(calculatedScale * 100)}%`);
    }
  };

  const fitToPage = () => {
    setZoomScale(1.0);
    showToast("Reset to Standard View (100%)");
  };

  // Global Keyboard Shortcuts (GAP-02)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (!isTyping) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (!isTyping) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      // Delete / Backspace: delete selected annotation
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !isTyping) {
        e.preventDefault();
        pushHistorySnapshot();
        deleteAnnotation(selectedId);
        showToast("Annotation deleted");
        return;
      }

      // Escape: deselect annotation or tool
      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingTextId(null);
        return;
      }

      // Page Navigation: ArrowLeft / ArrowRight
      if (!isTyping) {
        if (e.key === "ArrowLeft") {
          setCurrentPage((p) => Math.max(0, p - 1));
        } else if (e.key === "ArrowRight") {
          setCurrentPage((p) => Math.min(numPages - 1, p + 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, annotations, pageRotations, numPages]);

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
      const sha = await calculateSha256(bytes);
      const meta = inspectPdfMetadata(doc);
      setOriginalSha256(sha);
      setMetadataReport(meta);
      setPdfBytes(bytes);
      setFileName("sample_document.pdf");
      setNumPages(2);
      setCurrentPage(0);
      setPageRotations([0, 0]);
      setAnnotations([]);
      setSelectedId(null);
      setActiveTool("smart-edit");
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
      const sha = await calculateSha256(bytes);
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const meta = inspectPdfMetadata(pdfDoc);
      const count = pdfDoc.getPageCount();
      setOriginalSha256(sha);
      setMetadataReport(meta);
      setPdfBytes(bytes);
      setFileName(file.name);
      if (onPdfLoaded) onPdfLoaded(bytes, file.name);
      setNumPages(count);
      setCurrentPage(0);
      setPageRotations(new Array(count).fill(0));
      setAnnotations([]);
      setSelectedId(null);
      setActiveTool("smart-edit");
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

  // Handle overlay click to add Text, Whiteout, Stamp, Shape
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeTool === "text") {
      pushHistorySnapshot();
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
        isItalic,
        fontFamily,
        bgColor: textBgColor,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedId(newAnnotation.id);
      showToast("Text placed! Double-click to edit directly on canvas");
    } else if (activeTool === "stamp") {
      pushHistorySnapshot();
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
    } else if (activeTool === "shape") {
      setShapeStart({ x, y });
      setTempShape({ x, y, w: 0, h: 0 });
    } else if (activeTool === "whiteout") {
      setWhiteoutStart({ x, y });
      setTempWhiteout({ x, y, w: 0, h: 0 });
    } else if (activeTool === "highlight") {
      setHighlightStart({ x, y });
      setTempHighlight({ x, y, w: 0, h: 0 });
    } else if (activeTool === "link") {
      pushHistorySnapshot();
      const newLink: LinkAnnotation = {
        id: `link-${Date.now()}`,
        pageIndex: currentPage,
        type: "link",
        url: linkUrl || "https://",
        x,
        y,
        width: 24,
        height: 4.5,
      };
      setAnnotations((prev) => [...prev, newLink]);
      setSelectedId(newLink.id);
      showToast("Link annotation box placed! Drag or resize corners.");
    } else if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    } else if (activeTool === "select") {
      // Clicked on empty space
      setSelectedId(null);
      setEditingTextId(null);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    // Handle corner resizing of selected annotation (GAP-03)
    if (resizeHandle && resizeInitialBox && resizeStartMouse && selectedId) {
      const dx = x - resizeStartMouse.x;
      const dy = y - resizeStartMouse.y;
      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id !== selectedId || !("width" in ann) || !("height" in ann)) return ann;
          let newX = resizeInitialBox.x;
          let newY = resizeInitialBox.y;
          let newW = resizeInitialBox.w;
          let newH = resizeInitialBox.h;

          if (resizeHandle === "se") {
            newW = Math.max(2, resizeInitialBox.w + dx);
            newH = Math.max(2, resizeInitialBox.h + dy);
          } else if (resizeHandle === "sw") {
            newX = Math.min(resizeInitialBox.x + resizeInitialBox.w - 2, resizeInitialBox.x + dx);
            newW = Math.max(2, resizeInitialBox.w - dx);
            newH = Math.max(2, resizeInitialBox.h + dy);
          } else if (resizeHandle === "ne") {
            newY = Math.min(resizeInitialBox.y + resizeInitialBox.h - 2, resizeInitialBox.y + dy);
            newW = Math.max(2, resizeInitialBox.w + dx);
            newH = Math.max(2, resizeInitialBox.h - dy);
          } else if (resizeHandle === "nw") {
            newX = Math.min(resizeInitialBox.x + resizeInitialBox.w - 2, resizeInitialBox.x + dx);
            newY = Math.min(resizeInitialBox.y + resizeInitialBox.h - 2, resizeInitialBox.y + dy);
            newW = Math.max(2, resizeInitialBox.w - dx);
            newH = Math.max(2, resizeInitialBox.h - dy);
          }

          return {
            ...ann,
            x: Math.max(0, Math.min(98, newX)),
            y: Math.max(0, Math.min(98, newY)),
            width: Math.min(100 - newX, newW),
            height: Math.min(100 - newY, newH),
          };
        })
      );
      return;
    }

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
    } else if (activeTool === "shape" && shapeStart) {
      const startX = Math.min(shapeStart.x, x);
      const startY = Math.min(shapeStart.y, y);
      const width = Math.abs(x - shapeStart.x);
      const height = Math.abs(y - shapeStart.y);
      setTempShape({ x: startX, y: startY, w: width, h: height });
    } else if (activeTool === "whiteout" && whiteoutStart) {
      const startX = Math.min(whiteoutStart.x, x);
      const startY = Math.min(whiteoutStart.y, y);
      const width = Math.abs(x - whiteoutStart.x);
      const height = Math.abs(y - whiteoutStart.y);
      setTempWhiteout({ x: startX, y: startY, w: width, h: height });
    } else if (activeTool === "highlight" && highlightStart) {
      const startX = Math.min(highlightStart.x, x);
      const startY = Math.min(highlightStart.y, y);
      const width = Math.abs(x - highlightStart.x);
      const height = Math.abs(y - highlightStart.y);
      setTempHighlight({ x: startX, y: startY, w: width, h: height });
    }
  };

  const handleOverlayMouseUp = () => {
    if (resizeHandle) {
      setResizeHandle(null);
      setResizeInitialBox(null);
      setResizeStartMouse(null);
      pushHistorySnapshot();
    }
    if (isDraggingSelected) {
      setIsDraggingSelected(false);
      pushHistorySnapshot();
    }
    if (activeTool === "draw" && isDrawing) {
      if (currentPath.length > 1) {
        pushHistorySnapshot();
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
    } else if (activeTool === "shape" && shapeStart && tempShape) {
      if (tempShape.w > 1 && tempShape.h > 1) {
        pushHistorySnapshot();
        const newShape: ShapeAnnotation = {
          id: `shape-${Date.now()}`,
          pageIndex: currentPage,
          type: "shape",
          shapeType,
          x: tempShape.x,
          y: tempShape.y,
          width: tempShape.w,
          height: tempShape.h,
          strokeColor: shapeStrokeColor,
          fillColor: shapeFillColor,
          strokeWidth: shapeStrokeWidth,
        };
        setAnnotations((prev) => [...prev, newShape]);
        setSelectedId(newShape.id);
        showToast(`Placed ${shapeType} vector shape`);
      }
      setShapeStart(null);
      setTempShape(null);
    } else if (activeTool === "whiteout" && whiteoutStart && tempWhiteout) {
      if (tempWhiteout.w > 1 && tempWhiteout.h > 1) {
        pushHistorySnapshot();
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
    } else if (activeTool === "highlight" && highlightStart && tempHighlight) {
      if (tempHighlight.w > 1 && tempHighlight.h > 1) {
        pushHistorySnapshot();
        const newHighlight: HighlightAnnotation = {
          id: `highlight-${Date.now()}`,
          pageIndex: currentPage,
          type: "highlight",
          x: tempHighlight.x,
          y: tempHighlight.y,
          width: tempHighlight.w,
          height: tempHighlight.h,
          color: highlightColor,
        };
        setAnnotations((prev) => [...prev, newHighlight]);
        setSelectedId(newHighlight.id);
      }
      setHighlightStart(null);
      setTempHighlight(null);
    }
  };

  // Rotate specific page by 90 degrees
  const rotatePageAtIndex = (targetIndex: number, delta = 90) => {
    pushHistorySnapshot();
    setPageRotations((prev) => {
      const updated = [...prev];
      updated[targetIndex] = ((updated[targetIndex] || 0) + delta) % 360;
      return updated;
    });
    showToast(`Rotated page ${targetIndex + 1} by ${delta}°`);
  };

  // Rotate current page
  const rotateCurrentPage = () => {
    rotatePageAtIndex(currentPage, 90);
  };

  // Select a detected PDF text block for inline in-place editing (Editing Mode)
  const handleSelectBlockForEdit = (block: DetectedTextBlock, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveInlineBlock(block);
    setInlineDraftText(block.text);
    setFontSize(block.font.fontSize);
    setIsBold(block.font.isBold);
    setIsItalic(block.font.isItalic);
    setFontFamily(block.font.standardFamily);
    const detectedColor = block.suggestedColor || "#0f172a";
    setTextColor(detectedColor);
    setTextBgColor(block.suggestedBgColor || "#ffffff");
    setSelectedId(null);
    showToast(`Detected Font: ${block.font.cleanName} (${block.font.fontSize}pt, ${block.font.isBold ? "Bold" : "Regular"})`);
  };

  // Re-open an already edited text block for instant seamless re-editing
  const handleReopenInPlaceEdit = (ann: InPlaceEditAnnotation) => {
    const virtualBlock: DetectedTextBlock = {
      id: ann.id,
      text: ann.newText,
      pageIndex: ann.pageIndex,
      x: ann.x,
      y: ann.y,
      width: ann.width,
      height: ann.height,
      pdfX: 0,
      pdfY: 0,
      pdfWidth: 0,
      pdfHeight: 0,
      font: {
        rawFontName: ann.cleanFontName,
        cleanName: ann.cleanFontName,
        standardFamily: ann.fontFamily,
        cssFamily: ann.fontFamily === "Times-Roman" ? "'Times New Roman', serif" : ann.fontFamily === "Courier" ? "'Courier New', monospace" : "Arial, sans-serif",
        fontSize: ann.fontSize,
        isBold: ann.isBold,
        isItalic: ann.isItalic,
        standardPdfFontKey: StandardFonts.Helvetica,
      },
      suggestedColor: ann.color || "#0f172a",
      suggestedBgColor: ann.bgColor || "#ffffff",
    };
    setActiveInlineBlock(virtualBlock);
    setInlineDraftText(ann.newText);
    setFontSize(ann.fontSize);
    setIsBold(ann.isBold);
    setIsItalic(ann.isItalic);
    setFontFamily(ann.fontFamily);
    setTextColor(ann.color || "#0f172a");
    setTextBgColor(ann.bgColor || "#ffffff");
    setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
    setActiveTool("smart-edit");
  };

  // Commit and bake inline in-place text replacement
  const handleCommitInlineEdit = () => {
    if (!activeInlineBlock) return;
    const trimmed = inlineDraftText.trim();
    if (trimmed) {
      pushHistorySnapshot();
      const inPlaceAnn: InPlaceEditAnnotation = {
        id: `inplace-${Date.now()}`,
        pageIndex: currentPage,
        type: "inplace-edit",
        originalText: activeInlineBlock.text,
        newText: trimmed,
        x: activeInlineBlock.x,
        y: activeInlineBlock.y,
        width: Math.max(activeInlineBlock.width, (trimmed.length / Math.max(1, activeInlineBlock.text.length)) * activeInlineBlock.width),
        height: Math.max(1.5, activeInlineBlock.height),
        color: textColor || "#0f172a",
        bgColor: textBgColor === "transparent" ? "#ffffff" : textBgColor || "#ffffff",
        fontSize: fontSize || activeInlineBlock.font.fontSize,
        fontFamily: fontFamily || activeInlineBlock.font.standardFamily,
        cleanFontName: activeInlineBlock.font.cleanName,
        isBold: isBold,
        isItalic: isItalic,
      };
      setAnnotations((prev) => [...prev, inPlaceAnn]);
      setDetectedBlocks((prev) =>
        prev.map((b) =>
          b.id === activeInlineBlock.id
            ? {
                ...b,
                text: trimmed,
                suggestedColor: textColor || b.suggestedColor,
                font: {
                  ...b.font,
                  fontSize: fontSize || b.font.fontSize,
                  isBold: isBold,
                  isItalic: isItalic,
                  standardFamily: fontFamily || b.font.standardFamily,
                },
              }
            : b
        )
      );
      setSelectedId(null);
      showToast(`Updated text with auto-matched font (${activeInlineBlock.font.cleanName})`);
    }
    setActiveInlineBlock(null);
  };

  // Sample/Eyedropper detected font into the active Text Tool (Option 1 & 2 integration)
  const sampleFontToTextTool = (block: DetectedTextBlock, switchToText = true) => {
    setFontFamily(block.font.standardFamily);
    setFontSize(block.font.fontSize);
    setIsBold(block.font.isBold);
    setIsItalic(block.font.isItalic);
    if (block.suggestedColor) setTextColor(block.suggestedColor);
    if (block.suggestedBgColor && block.suggestedBgColor !== "transparent") {
      setTextBgColor(block.suggestedBgColor);
    }
    if (selectedId) {
      updateSelectedAnnotationStyle({
        fontFamily: block.font.standardFamily,
        fontSize: block.font.fontSize,
        isBold: block.font.isBold,
        isItalic: block.font.isItalic,
        color: block.suggestedColor,
        cleanFontName: block.font.cleanName,
      });
    }
    if (switchToText) {
      setActiveTool("text");
    }
    showToast(`Sampled font: ${block.font.cleanName} (${block.font.fontSize}pt, ${block.font.standardFamily})`);
  };

  // Delete an annotation
  const deleteAnnotation = (id: string) => {
    pushHistorySnapshot();
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingTextId === id) setEditingTextId(null);
  };

  // Duplicate an annotation with offset (GAP-04)
  const duplicateAnnotation = (id: string) => {
    const target = annotations.find((a) => a.id === id);
    if (!target) return;
    pushHistorySnapshot();
    let cloned: Annotation;
    if (target.type === "draw") {
      cloned = {
        ...target,
        id: `draw-${Date.now()}`,
        points: target.points.map((p) => ({
          x: Math.min(100, p.x + 2),
          y: Math.min(100, p.y + 2),
        })),
      };
    } else {
      cloned = {
        ...target,
        id: `${target.type}-${Date.now()}`,
        x: Math.min(90, target.x + 2),
        y: Math.min(90, target.y + 2),
      };
    }
    setAnnotations((prev) => [...prev, cloned]);
    setSelectedId(cloned.id);
    showToast(`Duplicated ${target.type} annotation`);
  };

  // Initiate corner resizing of box-like annotations (GAP-03)
  const startResize = (
    e: React.MouseEvent,
    handle: "nw" | "ne" | "se" | "sw",
    box: { x: number; y: number; width: number; height: number }
  ) => {
    e.stopPropagation();
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    setResizeHandle(handle);
    setResizeInitialBox({ x: box.x, y: box.y, w: box.width, h: box.height });
    setResizeStartMouse({ x: mouseX, y: mouseY });
  };

  // Delete specific page by index
  const deletePageAtIndex = async (targetIndex: number) => {
    if (!pdfBytes || numPages <= 1) {
      showToast("Document must have at least one page.");
      return;
    }

    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      doc.removePage(targetIndex);
      const updatedBytes = await doc.save();

      const newPageRotations = pageRotations.filter((_, idx) => idx !== targetIndex);
      const newAnnotations = annotations
        .filter((a) => a.pageIndex !== targetIndex)
        .map((a) => (a.pageIndex > targetIndex ? { ...a, pageIndex: a.pageIndex - 1 } : a));

      setPdfBytes(updatedBytes);
      setNumPages(numPages - 1);
      setPageRotations(newPageRotations);
      setAnnotations(newAnnotations);
      if (currentPage >= numPages - 1) {
        setCurrentPage(Math.max(0, numPages - 2));
      } else if (currentPage > targetIndex) {
        setCurrentPage(currentPage - 1);
      }
      setSelectedId(null);
      showToast(`Deleted page ${targetIndex + 1}`);
    } catch (e) {
      console.error(e);
      showToast("Failed to delete page");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete current page
  const deleteCurrentPage = async () => {
    await deletePageAtIndex(currentPage);
  };

  // Insert clean blank page
  const insertBlankPage = async (atIndex = currentPage + 1) => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      doc.insertPage(atIndex, [595.28, 841.89]); // Standard A4
      const updatedBytes = await doc.save();
      const newRotations = [...pageRotations];
      newRotations.splice(atIndex, 0, 0);
      const newAnnotations = annotations.map((a) =>
        a.pageIndex >= atIndex ? { ...a, pageIndex: a.pageIndex + 1 } : a
      );
      setPdfBytes(updatedBytes);
      setNumPages(numPages + 1);
      setPageRotations(newRotations);
      setAnnotations(newAnnotations);
      setCurrentPage(atIndex);
      showToast(`Inserted blank page at position ${atIndex + 1}`);
    } catch {
      showToast("Failed to insert blank page");
    } finally {
      setIsProcessing(false);
    }
  };

  // Duplicate specific page by index
  const duplicatePageAtIndex = async (targetIndex: number) => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const [copiedPage] = await doc.copyPages(doc, [targetIndex]);
      const insertAt = targetIndex + 1;
      doc.insertPage(insertAt, copiedPage);
      const updatedBytes = await doc.save();
      const newRotations = [...pageRotations];
      newRotations.splice(insertAt, 0, pageRotations[targetIndex] || 0);
      setPdfBytes(updatedBytes);
      setNumPages(numPages + 1);
      setPageRotations(newRotations);
      setCurrentPage(insertAt);
      showToast(`Duplicated page ${targetIndex + 1}`);
    } catch {
      showToast("Failed to duplicate page");
    } finally {
      setIsProcessing(false);
    }
  };

  // Duplicate current page
  const duplicateCurrentPage = async () => {
    await duplicatePageAtIndex(currentPage);
  };

  // Reorder page from one index to another
  const reorderPage = async (fromIdx: number, toIdx: number) => {
    if (!pdfBytes || numPages <= 1 || fromIdx === toIdx) return;
    if (fromIdx < 0 || fromIdx >= numPages || toIdx < 0 || toIdx >= numPages) return;

    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const order = Array.from({ length: numPages }, (_, i) => i);
      const [movedItem] = order.splice(fromIdx, 1);
      order.splice(toIdx, 0, movedItem);

      const copied = await newDoc.copyPages(doc, order);
      copied.forEach((p) => newDoc.addPage(p));
      const updatedBytes = await newDoc.save();

      const newRotations = [...pageRotations];
      const [movedRot] = newRotations.splice(fromIdx, 1);
      newRotations.splice(toIdx, 0, movedRot);

      // Remap annotations
      const newAnnotations = annotations.map((a) => {
        if (a.pageIndex === fromIdx) return { ...a, pageIndex: toIdx };
        if (fromIdx < toIdx && a.pageIndex > fromIdx && a.pageIndex <= toIdx) {
          return { ...a, pageIndex: a.pageIndex - 1 };
        }
        if (fromIdx > toIdx && a.pageIndex >= toIdx && a.pageIndex < fromIdx) {
          return { ...a, pageIndex: a.pageIndex + 1 };
        }
        return a;
      });

      setPdfBytes(updatedBytes);
      setPageRotations(newRotations);
      setAnnotations(newAnnotations);
      setCurrentPage(toIdx);
      showToast(`Moved page ${fromIdx + 1} to position ${toIdx + 1}`);
    } catch {
      showToast("Failed to reorder page");
    } finally {
      setIsProcessing(false);
    }
  };

  // Move current page left or right
  const moveCurrentPage = async (direction: "left" | "right") => {
    const targetIdx = direction === "left" ? currentPage - 1 : currentPage + 1;
    await reorderPage(currentPage, targetIdx);
  };

  // Batch rotate all pages
  const batchRotateAll = (delta = 90) => {
    setPageRotations((prev) => prev.map((r) => (r + delta) % 360));
    showToast(`Rotated all ${numPages} pages by ${delta}°`);
  };

  // Image Annotation File Upload
  const handleImageAnnotationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const arrayBuffer = new Uint8Array(
        atob(result.split(",")[1])
          .split("")
          .map((c) => c.charCodeAt(0))
      );

      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const newImg: ImageAnnotation = {
        id: `img-${Date.now()}`,
        pageIndex: currentPage,
        type: "image",
        imageDataUrl: result,
        bytes: arrayBuffer,
        mimeType,
        name: file.name,
        x: 35,
        y: 35,
        width: 25,
        height: 18,
      };

      setAnnotations((prev) => [...prev, newImg]);
      setSelectedId(newImg.id);
      setActiveTool("select");
      showToast(`Inserted image: ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Export Converters handlers
  const handleExportText = async () => {
    if (!pdfBytes) return;
    setIsConverting(true);
    try {
      await exportPdfToTextFile(pdfBytes, fileName);
      showToast("Plain text file (.txt) exported!");
    } catch (err) {
      showToast("Failed to export text: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsConverting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!pdfBytes) return;
    setIsConverting(true);
    try {
      const res = await exportPdfToExcelWorkbook(pdfBytes, fileName);
      showToast(`Spreadsheet exported with ${res.sheetCount} page sheets!`);
    } catch (err) {
      showToast("Failed to extract spreadsheet: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsConverting(false);
    }
  };

  const handleExportWord = async () => {
    if (!pdfBytes) return;
    setIsConverting(true);
    try {
      await exportPdfToWordDocx(pdfBytes, fileName);
      showToast("Word document (.doc) exported!");
    } catch (err) {
      showToast("Failed to export Word doc: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsConverting(false);
    }
  };

  const handleExportPresentation = async () => {
    if (!pdfBytes) return;
    setIsConverting(true);
    try {
      await exportPdfToPresentationPpt(pdfBytes, fileName);
      showToast("Presentation outline (.ppt) exported!");
    } catch (err) {
      showToast("Failed to export PPT: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsConverting(false);
    }
  };

  // Master format-preserving conversion & layout reconstruction pipeline
  const handleRunLayoutAnalysis = async (targetDownload?: "docx" | "searchable_pdf" | "html" | "md" | "txt") => {
    if (!pdfBytes) return;
    setIsOcrRunning(true);
    setShowOcrModal(true);
    setOcrStatus("Inspecting document typography & raster streams...");
    setOcrProgressPercent(5);

    try {
      const nature = await inspectPdfNature(pdfBytes);
      setDetectedPdfNature(nature);

      let structure: DocumentStructure;
      if (nature.isScanned) {
        setOcrStatus("Scanned image detected. Running Layout-Aware Optical Recognition...");
        structure = await parseScannedPdfWithLayoutOcr(pdfBytes, (p) => {
          setOcrStatus(p.status);
          setOcrProgressPercent(p.progressPercent);
        });
      } else {
        setOcrStatus("Born-digital PDF detected. Reconstructing native headings, typography & tables...");
        structure = await parseDigitalPdfStructure(pdfBytes, (p) => {
          setOcrStatus(p.status);
          setOcrProgressPercent(p.progressPercent);
        });
      }

      setDocumentStructure(structure);
      setOcrResultText(structure.markdown || structure.blocks.map((b) => b.text).filter(Boolean).join("\n\n"));

      if (targetDownload === "docx") {
        await exportStructureToDocx(structure, fileName, (p) => {
          setOcrStatus(p.status);
          setOcrProgressPercent(p.progressPercent);
        });
        showToast("Formatted Word (.docx) downloaded successfully!");
      } else if (targetDownload === "html") {
        exportStructureToHtml(structure, fileName);
        showToast("Structured HTML downloaded successfully!");
      } else if (targetDownload === "md") {
        exportStructureToMarkdown(structure, fileName);
        showToast("Structured Markdown (.md) downloaded successfully!");
      } else {
        showToast(nature.isScanned ? "Layout-aware OCR complete!" : "Digital structure parsed with full formatting!");
      }
    } catch (err) {
      showToast("Conversion Error: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleRunOcr = async () => {
    await handleRunLayoutAnalysis();
  };

  const handleExportSearchablePdf = async () => {
    if (!pdfBytes) return;
    setIsOcrRunning(true);
    setShowOcrModal(true);
    setOcrStatus("Initializing Searchable PDF OCR pipeline...");
    setOcrProgressPercent(5);
    try {
      await exportSearchablePdf(pdfBytes, fileName, (p: OcrPageProgress) => {
        setOcrStatus(p.status);
        setOcrProgressPercent(p.progressPercent);
      });
      showToast("Searchable PDF downloaded successfully!");
    } catch (err) {
      showToast("Searchable PDF Error: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsOcrRunning(false);
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
      const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique);
      const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
      const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
      const timesBoldItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);
      const courier = await doc.embedFont(StandardFonts.Courier);
      const courierBold = await doc.embedFont(StandardFonts.CourierBold);
      const courierOblique = await doc.embedFont(StandardFonts.CourierOblique);
      const courierBoldOblique = await doc.embedFont(StandardFonts.CourierBoldOblique);
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
            let textFont = helvetica;
            if (ann.fontFamily === "Times-Roman") {
              textFont = ann.isBold && ann.isItalic ? timesBoldItalic : ann.isBold ? timesBold : ann.isItalic ? timesItalic : timesRoman;
            } else if (ann.fontFamily === "Courier") {
              textFont = ann.isBold && ann.isItalic ? courierBoldOblique : ann.isBold ? courierBold : ann.isItalic ? courierOblique : courier;
            } else {
              textFont = ann.isBold && ann.isItalic ? helveticaBoldOblique : ann.isBold ? helveticaBold : ann.isItalic ? helveticaOblique : helvetica;
            }
            const pdfX = (ann.x / 100) * width;
            const pdfY = height - (ann.y / 100) * height - ann.fontSize;
            const safeAnnText = sanitizeWinAnsiText(ann.text);
            
            // Draw background rectangle if requested (e.g. Whiteout background or yellow highlight)
            if (ann.bgColor && ann.bgColor !== "transparent") {
              const bgRgb = parseHexColor(ann.bgColor, { r: 1, g: 1, b: 1 });
              const textWidth = textFont.widthOfTextAtSize(safeAnnText, ann.fontSize);
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
            page.drawText(safeAnnText, {
              x: pdfX,
              y: pdfY,
              size: ann.fontSize,
              font: textFont,
              color: rgb(textRgb.r, textRgb.g, textRgb.b),
            });
          } else if (ann.type === "inplace-edit") {
            const pdfX = (ann.x / 100) * width;
            const pdfW = (ann.width / 100) * width;
            const pdfH = (ann.height / 100) * height;
            const pdfY = height - (ann.y / 100) * height - pdfH;
            const bgRgb = parseHexColor(ann.bgColor || "#ffffff", { r: 1, g: 1, b: 1 });

            // 1. Mask original text area
            page.drawRectangle({
              x: pdfX - 1,
              y: pdfY - 1,
              width: pdfW + 2,
              height: pdfH + 2,
              color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
            });

            // 2. Select matching embedded standard font
            let targetFont = helvetica;
            if (ann.fontFamily === "Times-Roman") {
              targetFont = ann.isBold && ann.isItalic ? timesBoldItalic : ann.isBold ? timesBold : ann.isItalic ? timesItalic : timesRoman;
            } else if (ann.fontFamily === "Courier") {
              targetFont = ann.isBold && ann.isItalic ? courierBoldOblique : ann.isBold ? courierBold : ann.isItalic ? courierOblique : courier;
            } else {
              targetFont = ann.isBold && ann.isItalic ? helveticaBoldOblique : ann.isBold ? helveticaBold : ann.isItalic ? helveticaOblique : helvetica;
            }

            const textRgb = parseHexColor(ann.color, { r: 0.1, g: 0.1, b: 0.1 });
            page.drawText(sanitizeWinAnsiText(ann.newText), {
              x: pdfX,
              y: pdfY + Math.max(1, pdfH * 0.15),
              size: ann.fontSize,
              font: targetFont,
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

            page.drawText(sanitizeWinAnsiText(ann.text), {
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
          } else if (ann.type === "image") {
            try {
              const embeddedImage =
                ann.mimeType === "image/png"
                  ? await doc.embedPng(ann.bytes)
                  : await doc.embedJpg(ann.bytes);
              const pdfX = (ann.x / 100) * width;
              const pdfW = (ann.width / 100) * width;
              const pdfH = (ann.height / 100) * height;
              const pdfY = height - (ann.y / 100) * height - pdfH;
              page.drawImage(embeddedImage, {
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
              });
            } catch (err) {
              console.warn("Failed to embed image annotation:", err);
            }
          } else if (ann.type === "highlight") {
            const pdfX = (ann.x / 100) * width;
            const pdfW = (ann.width / 100) * width;
            const pdfH = (ann.height / 100) * height;
            const pdfY = height - (ann.y / 100) * height - pdfH;
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(0.98, 0.85, 0.2),
              opacity: 0.45,
            });
          } else if (ann.type === "shape") {
            const pdfX = (ann.x / 100) * width;
            const pdfW = (ann.width / 100) * width;
            const pdfH = (ann.height / 100) * height;
            const pdfY = height - (ann.y / 100) * height - pdfH;
            const strokeRgb = parseHexColor(ann.strokeColor, { r: 0.15, g: 0.35, b: 0.85 });
            const hasFill = ann.fillColor && ann.fillColor !== "transparent";
            const fillRgb = hasFill ? parseHexColor(ann.fillColor!, { r: 1, g: 1, b: 1 }) : undefined;

            if (ann.shapeType === "rectangle") {
              page.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
                borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                borderWidth: ann.strokeWidth,
                color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
              });
            } else if (ann.shapeType === "circle") {
              page.drawEllipse({
                x: pdfX + pdfW / 2,
                y: pdfY + pdfH / 2,
                xScale: pdfW / 2,
                yScale: pdfH / 2,
                borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                borderWidth: ann.strokeWidth,
                color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
              });
            } else if (ann.shapeType === "line" || ann.shapeType === "arrow") {
              page.drawLine({
                start: { x: pdfX, y: pdfY + pdfH },
                end: { x: pdfX + pdfW, y: pdfY },
                thickness: ann.strokeWidth,
                color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              });
              if (ann.shapeType === "arrow") {
                const arrowLength = 10;
                const angle = Math.atan2(-pdfH, pdfW);
                page.drawLine({
                  start: { x: pdfX + pdfW, y: pdfY },
                  end: {
                    x: pdfX + pdfW - arrowLength * Math.cos(angle - Math.PI / 6),
                    y: pdfY - arrowLength * Math.sin(angle - Math.PI / 6),
                  },
                  thickness: ann.strokeWidth,
                  color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                });
                page.drawLine({
                  start: { x: pdfX + pdfW, y: pdfY },
                  end: {
                    x: pdfX + pdfW - arrowLength * Math.cos(angle + Math.PI / 6),
                    y: pdfY - arrowLength * Math.sin(angle + Math.PI / 6),
                  },
                  thickness: ann.strokeWidth,
                  color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                });
              }
            }
          } else if (ann.type === "link") {
            const pdfX = (ann.x / 100) * width;
            const pdfW = (ann.width / 100) * width;
            const pdfH = (ann.height / 100) * height;
            const pdfY = height - (ann.y / 100) * height - pdfH;
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              borderColor: rgb(0.2, 0.4, 0.9),
              borderWidth: 1,
              color: rgb(0.2, 0.4, 0.9),
              opacity: 0.08,
            });
            page.drawText(sanitizeWinAnsiText(ann.url), {
              x: pdfX + 2,
              y: pdfY + 2,
              size: 8,
              font: helvetica,
              color: rgb(0.1, 0.3, 0.8),
            });
            try {
              const linkAnnot = doc.context.obj({
                Type: "Annot",
                Subtype: "Link",
                Rect: [pdfX, pdfY, pdfX + pdfW, pdfY + pdfH],
                Border: [0, 0, 0],
                A: {
                  Type: "Action",
                  S: "URI",
                  URI: PDFString.of(ann.url),
                },
              });
              const linkAnnotRef = doc.context.register(linkAnnot);
              page.node.addAnnot(linkAnnotRef);
            } catch (linkErr) {
              console.warn("Failed to attach interactive PDF link annotation:", linkErr);
            }
          }
        }

        // Apply header text if specified
        if (headerText.trim()) {
          page.drawText(sanitizeWinAnsiText(headerText.trim()), {
            x: 36,
            y: height - 24,
            size: 9,
            font: helvetica,
            color: rgb(0.35, 0.35, 0.35),
          });
        }

        // Apply footer text if specified
        if (footerText.trim()) {
          page.drawText(sanitizeWinAnsiText(footerText.trim()), {
            x: 36,
            y: 20,
            size: 9,
            font: helvetica,
            color: rgb(0.35, 0.35, 0.35),
          });
        }

        // Apply page numbers if enabled
        if (includePageNumbers) {
          const numText = `Page ${p + 1} of ${pageCount}`;
          page.drawText(sanitizeWinAnsiText(numText), {
            x: footerText.trim() ? width - 110 : width / 2 - 35,
            y: 20,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }

        // Apply watermark if specified
        if (watermarkText.trim()) {
          page.drawText(sanitizeWinAnsiText(watermarkText.trim()), {
            x: width * 0.18,
            y: height * 0.45,
            size: 40,
            font: helveticaBold,
            color: rgb(0.82, 0.82, 0.82),
            rotate: degrees(35),
          });
        }
      }

      // Apply Legal Bates Stamping if enabled
      if (enableBates) {
        await applyBatesStamping(doc, {
          prefix: batesPrefix,
          startNumber: batesStart,
          digits: batesDigits,
          suffix: batesSuffix,
          position: batesPosition,
          fontSize: batesFontSize,
          colorHex: batesColor,
          pageRange: "all",
        });
      }

      // Deep Sanitize Metadata if enabled
      if (sanitizeMetadata) {
        sanitizePdfDocument(doc);
      }

      // Append Cryptographic Audit Certificate if enabled
      if (includeAuditCertificate) {
        const intermediateBytes = await doc.save();
        const finalSha256 = await calculateSha256(intermediateBytes);
        const certId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const actions: string[] = [];
        if (annotations.length > 0) actions.push(`Applied ${annotations.length} visual annotations & redactions`);
        if (enableBates) actions.push(`Applied legal Bates numbering (${batesPrefix}..., pos: ${batesPosition})`);
        if (flattenRedactions && pagesWithWhiteout.size > 0) actions.push(`Permanently flattened raster redactions on ${pagesWithWhiteout.size} pages`);
        if (sanitizeMetadata) actions.push("Deep purged document metadata dictionary and XMP stream");
        if (pageRotations.some((r) => r !== 0)) actions.push("Applied custom page rotation transforms");

        await appendAuditCertificate(doc, {
          documentName: fileName,
          originalSha256: originalSha256 || "N/A",
          modifiedSha256: finalSha256,
          pageCount: pageCount,
          timestamp: new Date().toISOString(),
          certificateId: certId,
          actionsPerformed: actions,
        });
      }

      const modifiedBytes = await doc.save();
      const blob = new Blob([modifiedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const downloadTarget = customExportName.trim()
        ? (customExportName.endsWith(".pdf") ? customExportName : `${customExportName}.pdf`)
        : `${fileName.replace(/\.pdf$/i, "")}_edited.pdf`;
      a.download = downloadTarget;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      trackPageView(undefined, undefined, "pdf-edited", {
        pages: numPages,
        tool_slug: "pdf-editor",
      });
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
          {/* Top Main Command Bar - Frozen & Sticky */}
          <div className="sticky top-2 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0e1628]/95 backdrop-blur-md p-3 shadow-2xl">
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

              {/* Zoom & Viewport Controls (GAP-07) */}
              <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                  className="p-1 hover:text-[#c7f36b] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  type="button"
                  onClick={fitToPage}
                  className="px-1.5 font-mono text-[11px] text-white/70 hover:text-white transition-colors"
                  title="Reset Zoom to 100%"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                  className="p-1 hover:text-[#c7f36b] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={fitToWidth}
                  className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/80 hover:bg-[#c7f36b]/20 hover:text-[#c7f36b] transition-colors"
                  title="Fit to Container Width"
                >
                  Fit
                </button>
              </div>

              {/* Undo / Redo Controls (GAP-01) */}
              <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  className="p-1 text-white/80 hover:text-[#c7f36b] disabled:opacity-30 disabled:hover:text-white/80 transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={13} />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  className="p-1 text-white/80 hover:text-[#c7f36b] disabled:opacity-30 disabled:hover:text-white/80 transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={13} />
                </button>
              </div>

              {/* Thumbnails Carousel Toggle */}
              <button
                type="button"
                onClick={() => setShowThumbnails((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  showThumbnails
                    ? "border-[#c7f36b] bg-[#c7f36b]/15 text-[#c7f36b] font-medium"
                    : "border-white/10 bg-black/40 text-white/70 hover:text-white"
                }`}
                title="Toggle Page Thumbnails Ribbon"
              >
                <Layers size={13} />
                <span className="hidden sm:inline">Thumbnails</span>
              </button>

              {/* Studio Viewport vs Full Page Scroll Mode */}
              <button
                type="button"
                onClick={() => setStudioViewMode((m) => (m === "viewport" ? "page-scroll" : "viewport"))}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  studioViewMode === "viewport"
                    ? "border-[#6fd5ff] bg-[#6fd5ff]/20 text-[#6fd5ff] font-medium shadow-sm shadow-[#6fd5ff]/20"
                    : "border-white/10 bg-black/40 text-white/70 hover:text-white"
                }`}
                title={
                  studioViewMode === "viewport"
                    ? "Studio Viewport active: Canvas scrolls in dedicated bay with pinned toolbars. Click for Full Page scroll."
                    : "Full Page scroll active. Click to switch to dedicated Studio Viewport bay."
                }
              >
                <Maximize2 size={13} />
                <span className="hidden md:inline">
                  {studioViewMode === "viewport" ? "Studio Viewport" : "Page Scroll"}
                </span>
              </button>
            </div>

            {/* Right: Page Actions & Export Button */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => moveCurrentPage("left")}
                disabled={currentPage === 0 || isProcessing}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Move page left in sequence"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => moveCurrentPage("right")}
                disabled={currentPage >= numPages - 1 || isProcessing}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Move page right in sequence"
              >
                <ChevronRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertBlankPage()}
                disabled={isProcessing}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                title="Insert blank A4 page"
              >
                <FilePlus size={13} /> Blank
              </button>
              <button
                type="button"
                onClick={duplicateCurrentPage}
                disabled={isProcessing}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                title="Duplicate current page"
              >
                <Copy size={13} /> Duplicate
              </button>
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
                onClick={() => batchRotateAll(90)}
                className="hidden sm:flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/70 hover:bg-white/10 transition-colors"
                title="Rotate all pages by 90 degrees"
              >
                All 90°
              </button>
              <button
                type="button"
                onClick={deleteCurrentPage}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
                title="Delete current page"
              >
                <Trash2 size={13} />
              </button>

              {/* Converter Dropdown Menu */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
                >
                  <FileDown size={13} /> Convert & OCR
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col w-56 rounded-xl border border-white/15 bg-[#0e1628] p-1.5 shadow-2xl z-50 animate-fade-in text-xs">
                  <button
                    onClick={() => handleRunLayoutAnalysis("docx")}
                    disabled={isConverting || isOcrRunning}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white/90 hover:bg-white/10 text-left font-medium"
                  >
                    <FileText size={13} className="text-blue-400" /> Export Word (.docx) <span className="text-[10px] text-blue-300 ml-auto bg-blue-500/20 px-1.5 py-0.5 rounded">Format</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isConverting}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white/80 hover:bg-white/10 text-left"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-400" /> Export Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleRunLayoutAnalysis("html")}
                    disabled={isConverting || isOcrRunning}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white/80 hover:bg-white/10 text-left"
                  >
                    <FileCode size={13} className="text-purple-400" /> Export HTML / Markdown
                  </button>
                  <button
                    onClick={handleExportText}
                    disabled={isConverting}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white/80 hover:bg-white/10 text-left"
                  >
                    <FileText size={13} className="text-amber-400" /> Export Text (.txt)
                  </button>
                  <button
                    onClick={handleExportPresentation}
                    disabled={isConverting}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white/80 hover:bg-white/10 text-left"
                  >
                    <FileText size={13} className="text-orange-400" /> Export Presentation (.ppt)
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => handleRunLayoutAnalysis()}
                    disabled={isOcrRunning}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[#c7f36b] hover:bg-[#c7f36b]/10 text-left font-semibold"
                  >
                    <ScanText size={13} /> Format-Preserving OCR Console
                  </button>
                  <button
                    onClick={handleExportSearchablePdf}
                    disabled={isOcrRunning}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[#c7f36b] hover:bg-[#c7f36b]/10 text-left"
                  >
                    <Sparkles size={13} /> Export Searchable PDF (OCR)
                  </button>
                </div>
              </div>

              {/* Custom Export Filename (GAP-08) */}
              <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs">
                <Tag size={12} className="text-[#c7f36b]" />
                <input
                  type="text"
                  value={customExportName}
                  onChange={(e) => setCustomExportName(e.target.value)}
                  placeholder={`${fileName.replace(/\.pdf$/i, "")}_edited.pdf`}
                  className="w-32 xl:w-44 bg-transparent text-[11px] font-mono text-white placeholder-white/30 focus:outline-none"
                  title="Target file name for exported PDF"
                />
              </div>

              <label className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors">
                Change PDF
                <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={exportModifiedPdf}
                disabled={isProcessing}
                className="signal-button flex items-center gap-1.5 bg-[#c7f36b] text-[#0b1020] font-semibold hover:bg-[#b8eb55] shadow-lg shadow-[#c7f36b]/10 py-1.5 px-4 text-xs"
              >
                {exportSuccess ? <Check size={15} /> : <Download size={15} />}
                {exportSuccess ? "Exported!" : "Export PDF"}
              </button>
            </div>
          </div>

          {/* Main 2-Column Editor Layout: Left Sticky Controls + Right Canvas */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
            {/* Left Column: Sticky Frozen Control Panel */}
            <div
              className={`lg:col-span-4 xl:col-span-3 space-y-4 rounded-xl border border-white/15 bg-[#0e1628]/98 backdrop-blur-md p-4 shadow-2xl transition-all ${
                isPanelFrozen
                  ? "sticky top-[4.75rem] z-30 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain"
                  : "relative max-h-none overflow-visible"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 mb-2">
                  <p className="mono-label text-xs text-[#c7f36b]">01 · SELECT ACTIVE TOOL</p>
                  <button
                    type="button"
                    onClick={() => setIsPanelFrozen((v) => !v)}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                      isPanelFrozen
                        ? "border-[#c7f36b]/40 bg-[#c7f36b]/15 text-[#c7f36b] shadow-sm shadow-[#c7f36b]/20"
                        : "border-white/15 bg-white/5 text-white/50 hover:text-white hover:border-white/30"
                    }`}
                    title={
                      isPanelFrozen
                        ? "Panel is frozen & stays visible while scrolling. Click to unfreeze."
                        : "Panel unpinned. Click to freeze panel while scrolling."
                    }
                  >
                    {isPanelFrozen ? <Pin size={11} className="fill-[#c7f36b]" /> : <PinOff size={11} />}
                    <span>{isPanelFrozen ? "Panel Frozen" : "Unpinned"}</span>
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveTool("smart-edit"); setSelectedId(null); }}
                    className={`col-span-2 flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      activeTool === "smart-edit"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] shadow-md shadow-[#c7f36b]/15"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-[#c7f36b]" />
                      <span>Editing Mode</span>
                    </div>
                    <span className="text-[10px] font-mono bg-[#c7f36b]/20 text-[#c7f36b] px-2 py-0.5 rounded-full border border-[#c7f36b]/30">
                      Default
                    </span>
                  </button>
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
                    onClick={() => { setActiveTool("highlight"); setSelectedId(null); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "highlight"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Highlighter size={14} /> Highlight
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
                    <Square size={14} /> Cover / Redact
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
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "stamp"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Stamp size={14} /> Stamp Badge
                  </button>
                  <label
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium cursor-pointer transition-colors ${
                      activeTool === "image"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <ImageIcon size={14} /> Add Image
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleImageAnnotationUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("link"); setSelectedId(null); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "link"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <LinkIcon size={14} /> Add Link
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("shape"); setSelectedId(null); }}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      activeTool === "shape"
                        ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold shadow-sm"
                        : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Shapes size={14} /> Shapes
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
                </div>
              </div>

              {/* Intelligent Auto-Font & In-Place Text Editing (Editing Mode) */}
              {activeTool === "smart-edit" && (
                <div className="space-y-3 rounded-lg border border-sky-500/30 bg-sky-500/[0.05] p-3.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#c7f36b]" /> Editing Mode
                    </span>
                    <span className="text-[10px] font-mono text-[#c7f36b] bg-[#c7f36b]/15 px-1.5 py-0.5 rounded border border-[#c7f36b]/30">
                      DEFAULT · ACTIVE
                    </span>
                  </div>

                  {isExtractingBlocks ? (
                    <div className="flex items-center gap-2 p-2.5 rounded bg-black/40 border border-white/10 text-xs text-white/70">
                      <div className="h-3 w-3 rounded-full border-2 border-[#c7f36b] border-t-transparent animate-spin" />
                      <span>Scanning page typography and fonts...</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      💡 <b>Hover and click directly on any text</b> on the page. The engine will detect its original font family, size, weight, and color so you can edit it in place.
                    </p>
                  )}

                  {activeInlineBlock ? (
                    <div className="space-y-3 rounded-lg border border-[#c7f36b]/40 bg-black/60 p-3 animate-fade-in text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="text-[11px] font-mono text-[#c7f36b] font-bold">EDITING TEXT LINE</span>
                        <span className="text-[10px] font-mono text-white/70">
                          {fontSize || activeInlineBlock.font.fontSize}pt · {isBold ? "Bold" : "Regular"}
                        </span>
                      </div>

                      {/* Detected Font Info Badge */}
                      <div className="flex items-center justify-between rounded bg-white/5 p-2 text-[10.5px]">
                        <span className="text-white/60">Detected Font:</span>
                        <span className="font-mono text-[#c7f36b] font-semibold truncate max-w-[150px]">
                          {activeInlineBlock.font.cleanName}
                        </span>
                      </div>

                      {/* Formatting Controls Bar */}
                      <div className="flex items-center flex-wrap gap-2 rounded bg-white/[0.04] p-2 border border-white/10">
                        {/* Bold & Italic */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setIsBold((b) => !b)}
                            className={`h-7 w-7 rounded font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                              isBold
                                ? "bg-[#c7f36b] text-[#0b1020] font-black ring-1 ring-[#c7f36b]"
                                : "text-white/80 hover:bg-white/10 border border-white/20"
                            }`}
                            title="Toggle Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsItalic((it) => !it)}
                            className={`h-7 w-7 rounded italic font-serif text-xs flex items-center justify-center transition-all cursor-pointer ${
                              isItalic
                                ? "bg-[#c7f36b] text-[#0b1020] font-black ring-1 ring-[#c7f36b]"
                                : "text-white/80 hover:bg-white/10 border border-white/20"
                            }`}
                            title="Toggle Italic"
                          >
                            I
                          </button>
                        </div>

                        {/* Font Size Stepper */}
                        <div className="flex items-center rounded border border-white/20 bg-black/40 px-1 py-0.5 gap-1">
                          <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.max(6, (s || activeInlineBlock.font.fontSize) - 1))}
                            className="h-6 w-5 rounded hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                            title="Decrease font size"
                          >
                            -
                          </button>
                          <span className="font-mono text-[11px] text-[#c7f36b] px-1 font-bold min-w-[32px] text-center">
                            {fontSize || activeInlineBlock.font.fontSize}pt
                          </span>
                          <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.min(72, (s || activeInlineBlock.font.fontSize) + 1))}
                            className="h-6 w-5 rounded hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                            title="Increase font size"
                          >
                            +
                          </button>
                        </div>

                        {/* Font Family selector */}
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value as any)}
                          className="bg-black/80 border border-white/20 rounded text-[11px] text-white/90 px-2 py-1 outline-none cursor-pointer flex-1"
                        >
                          <option value="Helvetica">Sans (Arial / Helvetica)</option>
                          <option value="Times-Roman">Serif (Times New Roman)</option>
                          <option value="Courier">Mono (Courier New)</option>
                        </select>

                        {/* Text Color Picker & Quick Swatches */}
                        <div className="flex items-center gap-1.5 w-full pt-1 border-t border-white/10">
                          <span className="text-[10px] font-mono text-white/60">Color:</span>
                          <div className="flex items-center gap-1 flex-1">
                            {[
                              { color: "#0f172a", label: "Black" },
                              { color: "#1e3a8a", label: "Navy" },
                              { color: "#dc2626", label: "Red" },
                              { color: "#059669", label: "Green" },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => setTextColor(c.color)}
                                style={{ backgroundColor: c.color }}
                                className={`h-4 w-4 rounded-full border transition-transform cursor-pointer ${
                                  textColor === c.color ? "ring-2 ring-[#c7f36b] scale-110 border-white" : "border-white/30 hover:scale-105"
                                }`}
                                title={`Set color: ${c.label}`}
                              />
                            ))}
                            <input
                              type="color"
                              value={textColor || "#0f172a"}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="h-5 w-5 rounded cursor-pointer border border-white/20 bg-transparent p-0 ml-1"
                              title="Choose custom text color"
                            />
                            <span className="font-mono text-[10px] text-white/60 ml-auto uppercase">{textColor || "#0f172a"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Text Input */}
                      <div>
                        <label className="text-[10px] font-mono text-white/60 block mb-1">EDITED TEXT:</label>
                        <textarea
                          rows={2}
                          value={inlineDraftText}
                          onChange={(e) => setInlineDraftText(e.target.value)}
                          className="w-full rounded border border-white/20 bg-black/70 p-2 text-xs text-white focus:border-[#c7f36b] focus:outline-none resize-none font-medium"
                          placeholder="Enter new text..."
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCommitInlineEdit}
                          className="flex-1 rounded bg-[#c7f36b] py-2 text-xs font-bold text-[#0b1020] hover:bg-[#b8eb55] transition-colors cursor-pointer shadow-md"
                        >
                          Apply Changes (Enter)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveInlineBlock(null)}
                          className="rounded border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded border border-white/10 bg-black/30 p-2 text-[11px] text-white/70">
                        <span>Found <b className="font-mono text-[#c7f36b]">{detectedBlocks.length}</b> text blocks on P.{currentPage + 1}</span>
                      </div>

                      {/* Search / Filter Blocks */}
                      {detectedBlocks.length > 0 && (
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-2 text-white/40" />
                          <input
                            type="text"
                            value={smartEditSearchQuery}
                            onChange={(e) => setSmartEditSearchQuery(e.target.value)}
                            placeholder="Search page text..."
                            className="w-full rounded border border-white/15 bg-black/60 pl-7 pr-2 py-1 text-[11px] text-white placeholder-white/40 focus:border-[#c7f36b] focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Scrollable list of detected text items with font badges */}
                      {detectedBlocks.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {detectedBlocks
                            .filter((b) => !smartEditSearchQuery || b.text.toLowerCase().includes(smartEditSearchQuery.toLowerCase()))
                            .slice(0, 30)
                            .map((b) => (
                              <div
                                key={b.id}
                                onMouseEnter={() => setHoveredBlockId(b.id)}
                                onMouseLeave={() => setHoveredBlockId(null)}
                                className={`rounded border p-1.5 transition-all text-[11px] ${
                                  hoveredBlockId === b.id
                                    ? "border-[#c7f36b] bg-[#c7f36b]/10"
                                    : "border-white/10 bg-black/40 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-white/60 mb-0.5">
                                  <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                                    <span
                                      className="h-2 w-2 rounded-full border border-white/30 shrink-0"
                                      style={{ backgroundColor: b.suggestedColor }}
                                      title={`Detected Color: ${b.suggestedColor}`}
                                    />
                                    <span className="font-mono text-[#c7f36b] truncate" title={b.font.rawFontName}>
                                      {b.font.cleanName}
                                    </span>
                                  </div>
                                  <span className="font-mono shrink-0">{b.font.fontSize}pt · {b.font.isBold ? "Bold" : "Reg"}</span>
                                </div>
                                <p className="truncate text-white/90 text-xs mb-1.5 font-medium">{b.text}</p>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleSelectBlockForEdit(b, e)}
                                    className="flex-1 rounded bg-[#c7f36b]/20 border border-[#c7f36b]/40 py-0.5 text-[10px] font-semibold text-[#c7f36b] hover:bg-[#c7f36b] hover:text-[#0b1020] transition-colors"
                                  >
                                    Edit Text
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => sampleFontToTextTool(b)}
                                    title="Sample this font into the Add Text tool"
                                    className="flex items-center gap-1 rounded border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300 hover:bg-sky-500/20 transition-colors"
                                  >
                                    <Pipette size={10} />
                                    <span>Sample Font</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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

                  {/* Font Family Selection (Option 1 & 2) */}
                  <div className="space-y-1.5 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>Typography Family</span>
                      <span className="font-mono text-[#c7f36b] text-[10.5px]">{fontFamily}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "Helvetica" as const, label: "Sans", sample: "Helvetica" },
                        { id: "Times-Roman" as const, label: "Serif", sample: "Times" },
                        { id: "Courier" as const, label: "Mono", sample: "Courier" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setFontFamily(f.id);
                            if (selectedAnnotation && selectedAnnotation.type === "text") {
                              updateSelectedAnnotationStyle({ fontFamily: f.id });
                            }
                          }}
                          className={`rounded border px-2 py-1 text-center transition-all ${
                            fontFamily === f.id
                              ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] shadow-sm font-bold"
                              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          <span className="block text-[11px] leading-tight">{f.sample}</span>
                          <span className="block text-[9px] opacity-60 leading-tight">{f.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Font Eyedropper CTA */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool("smart-edit");
                        setSelectedId(null);
                        showToast("Font Eyedropper: Click any text on the page to copy its font into the Text Tool!");
                      }}
                      className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-sky-400/40 bg-sky-500/10 py-1.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors mt-1"
                    >
                      <Pipette size={12} className="text-[#c7f36b]" />
                      <span>Pick / Sample Font from PDF</span>
                    </button>
                  </div>

                  {/* Font Size & Weight / Style */}
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
                    <div className="flex items-center justify-around gap-1 pt-3">
                      <label className="flex items-center gap-1 text-xs text-white/80 cursor-pointer p-1 rounded hover:bg-white/5">
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
                        <span className="font-bold">Bold</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-white/80 cursor-pointer p-1 rounded hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={isItalic}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsItalic(val);
                            if (selectedAnnotation && selectedAnnotation.type === "text") {
                              updateSelectedAnnotationStyle({ isItalic: val });
                            }
                          }}
                          className="accent-[#c7f36b]"
                        />
                        <span className="italic">Italic</span>
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

              {/* Geometric Vector Shape Tool Config (GAP-05) */}
              {activeTool === "shape" && (
                <div className="space-y-3 rounded-lg border border-blue-500/30 bg-blue-500/[0.04] p-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <Shapes size={14} className="text-blue-400" /> Vector Shape Settings
                    </span>
                    <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded capitalize">
                      {shapeType}
                    </span>
                  </div>

                  {/* Shape Type Selector */}
                  <div>
                    <label className="text-[10px] font-mono text-white/60 block mb-1">SHAPE TYPE:</label>
                    <div className="grid grid-cols-4 gap-1 text-[11px]">
                      {(["rectangle", "circle", "arrow", "line"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setShapeType(st)}
                          className={`rounded border py-1 px-1 text-center capitalize transition-colors ${
                            shapeType === st
                              ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                              : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                          }`}
                        >
                          {st === "rectangle" ? "Rect" : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stroke Width Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-white/70 mb-1">
                      <span>Stroke Thickness</span>
                      <span className="font-mono text-[#c7f36b]">{shapeStrokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={shapeStrokeWidth}
                      onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
                      className="w-full accent-[#c7f36b]"
                    />
                  </div>

                  {/* Stroke Color */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/70 block">Border / Stroke Color:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["#2563eb", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#000000", "#ffffff"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setShapeStrokeColor(c)}
                          className={`h-5 w-5 rounded-full border border-white/40 ${
                            shapeStrokeColor === c ? "ring-2 ring-[#c7f36b] scale-110" : ""
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fill Color */}
                  {shapeType !== "line" && shapeType !== "arrow" && (
                    <div className="space-y-1 pt-1 border-t border-white/10">
                      <span className="text-[11px] text-white/70 block">Fill Color:</span>
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                        {[
                          { id: "transparent", label: "None" },
                          { id: "#ffffff", label: "White" },
                          { id: "#fef08a", label: "Yellow" },
                          { id: "#bfdbfe", label: "Blue" },
                        ].map((fill) => (
                          <button
                            key={fill.id}
                            type="button"
                            onClick={() => setShapeFillColor(fill.id)}
                            className={`rounded border py-1 text-center transition-colors ${
                              shapeFillColor === fill.id
                                ? "border-[#c7f36b] bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                            }`}
                          >
                            {fill.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-white/60 leading-relaxed bg-white/[0.02] p-2 rounded border border-white/5">
                    Click & drag directly across the document canvas to draw a vector {shapeType}.
                  </p>
                </div>
              )}

              {/* Highlight Tool Config */}
              {activeTool === "highlight" && (
                <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                      <Highlighter size={13} className="text-amber-400" /> Highlighter Settings
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span>Highlight Tint</span>
                    <div className="flex gap-1.5">
                      {[
                        { color: "rgba(250, 204, 21, 0.45)", name: "Yellow" },
                        { color: "rgba(34, 197, 94, 0.45)", name: "Green" },
                        { color: "rgba(244, 114, 182, 0.45)", name: "Pink" },
                        { color: "rgba(96, 165, 250, 0.45)", name: "Blue" },
                      ].map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          onClick={() => setHighlightColor(c.color)}
                          className={`h-5 w-5 rounded-full border border-white/40 ${highlightColor === c.color ? "ring-2 ring-[#c7f36b]" : ""}`}
                          style={{ backgroundColor: c.color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/60">
                    Click and drag across text to apply a translucent highlight marker.
                  </p>
                </div>
              )}

              {/* Link Tool Config */}
              {activeTool === "link" && (
                <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-3">
                  <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                    <LinkIcon size={13} className="text-blue-400" /> Clickable Hyperlink
                  </span>
                  <div>
                    <label className="text-[11px] text-white/70 block mb-1">Target Web URL:</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded border border-white/10 bg-black/40 p-1.5 font-mono text-xs text-white"
                    />
                  </div>
                  <p className="text-[11px] text-white/50">
                    Click anywhere on the document to place this link box.
                  </p>
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
                <p className="mono-label text-xs text-white/60">WATERMARK & HEADER/FOOTER</p>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-white/70">Header Text (Top)</label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="e.g. Acme Corp Header"
                      className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-[11px] text-white placeholder-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/70">Footer Text (Bottom)</label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="e.g. Internal Confidential"
                      className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-[11px] text-white placeholder-white/30"
                    />
                  </div>
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

              {/* Enterprise Legal & Audit Suite Controls */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="mono-label text-xs text-[#c7f36b] flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={13} /> ENTERPRISE LEGAL & AUDIT
                  </p>
                  <span className="text-[9px] font-mono bg-[#c7f36b]/15 text-[#c7f36b] px-1.5 py-0.5 rounded border border-[#c7f36b]/30">
                    LIVE PREVIEW
                  </span>
                </div>

                {/* Bates Stamping Accordion */}
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-2.5">
                  <label className="flex items-center justify-between text-xs text-white cursor-pointer font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} className="text-[#c7f36b]" />
                      Legal Bates Numbering
                    </span>
                    <input
                      type="checkbox"
                      checked={enableBates}
                      onChange={(e) => setEnableBates(e.target.checked)}
                      className="accent-[#c7f36b]"
                    />
                  </label>

                  {enableBates && (
                    <div className="space-y-2 pt-1 border-t border-white/5 animate-fade-in text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-white/60">Prefix</label>
                          <input
                            type="text"
                            value={batesPrefix}
                            onChange={(e) => setBatesPrefix(e.target.value)}
                            placeholder="CASE-2026-"
                            className="w-full rounded border border-white/10 bg-black/40 p-1 font-mono text-[11px] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/60">Start #</label>
                          <input
                            type="number"
                            min={1}
                            value={batesStart}
                            onChange={(e) => setBatesStart(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded border border-white/10 bg-black/40 p-1 font-mono text-[11px] text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-white/60">Zero Digits ({batesDigits})</label>
                          <input
                            type="range"
                            min={3}
                            max={8}
                            value={batesDigits}
                            onChange={(e) => setBatesDigits(parseInt(e.target.value))}
                            className="w-full accent-[#c7f36b]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/60">Position</label>
                          <select
                            value={batesPosition}
                            onChange={(e) => setBatesPosition(e.target.value as any)}
                            className="w-full rounded border border-white/10 bg-black/40 p-1 text-[11px] text-white"
                          >
                            <option value="bottom-right">Bottom-Right</option>
                            <option value="bottom-center">Bottom-Center</option>
                            <option value="bottom-left">Bottom-Left</option>
                            <option value="top-right">Top-Right</option>
                            <option value="top-center">Top-Center</option>
                            <option value="top-left">Top-Left</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-[10px] font-mono text-[#c7f36b]">
                        Live on Canvas: {batesPrefix}{String(batesStart + currentPage).padStart(batesDigits, "0")}{batesSuffix}
                      </p>
                    </div>
                  )}
                </div>

                {/* Deep Metadata Purge */}
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-2">
                  <label className="flex items-center justify-between text-xs text-white cursor-pointer font-medium">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-amber-400" />
                      Deep Sanitize Metadata
                    </span>
                    <input
                      type="checkbox"
                      checked={sanitizeMetadata}
                      onChange={(e) => setSanitizeMetadata(e.target.checked)}
                      className="accent-[#c7f36b]"
                    />
                  </label>
                  {metadataReport && (
                    <div className="flex items-center justify-between text-[10.5px] text-white/60">
                      <span>Author: {metadataReport.author || "Clean"}</span>
                      <span className={metadataReport.hasXmpMetadata ? "text-amber-400" : "text-emerald-400"}>
                        {metadataReport.hasXmpMetadata ? "XMP Present" : "0 Leaks"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit Certificate with QR */}
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-1.5">
                  <label className="flex items-center justify-between text-xs text-white cursor-pointer font-medium">
                    <span className="flex items-center gap-1.5">
                      <QrCode size={13} className="text-[#c7f36b]" />
                      Append SHA-256 Audit Cert
                    </span>
                    <input
                      type="checkbox"
                      checked={includeAuditCertificate}
                      onChange={(e) => setIncludeAuditCertificate(e.target.checked)}
                      className="accent-[#c7f36b]"
                    />
                  </label>
                  {originalSha256 && (
                    <p className="text-[10px] font-mono text-white/50 truncate">
                      SHA-256: {originalSha256.slice(0, 16)}...
                    </p>
                  )}
                </div>
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

            {/* Right Column: PDF Canvas Workspace (GAP-07 containerRef attached) */}
            <div
              ref={containerRef}
              className={`lg:col-span-8 xl:col-span-9 rounded-2xl border border-white/15 bg-[#141a29] p-4 sm:p-6 flex flex-col items-center shadow-2xl transition-all ${
                studioViewMode === "viewport"
                  ? "max-h-[calc(100vh-6rem)] overflow-auto"
                  : "min-h-[650px] overflow-auto"
              }`}
            >
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

            {/* Page Manager & Thumbnail Carousel Ribbon */}
            {showThumbnails && numPages > 0 && (
              <div className="w-full max-w-4xl mb-5 rounded-xl border border-white/10 bg-black/40 p-2.5 backdrop-blur-sm shadow-md">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="mono-label text-[11px] text-[#c7f36b]">PAGE MANAGER & THUMBNAILS ({numPages})</span>
                    <span className="text-[10px] text-white/50 hidden sm:inline">Drag cards or use arrows to reorder</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => batchRotateAll(90)}
                      className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Rotate All 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBlankPage()}
                      className="rounded border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-2 py-0.5 text-[10px] text-[#c7f36b] hover:bg-[#c7f36b]/20 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={10} /> Blank Page
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5">
                  {Array.from({ length: numPages }).map((_, idx) => (
                    <PdfPageThumbnail
                      key={`thumb-${idx}-${pageRotations[idx] || 0}-${pdfBytes?.byteLength || 0}`}
                      pageIndex={idx}
                      pdfBytes={pdfBytes!}
                      isActive={currentPage === idx}
                      rotation={pageRotations[idx] || 0}
                      annotationCount={annotations.filter((a) => a.pageIndex === idx).length}
                      onClick={() => {
                        setCurrentPage(idx);
                        setSelectedId(null);
                      }}
                      onRotate={() => rotatePageAtIndex(idx)}
                      onDuplicate={() => duplicatePageAtIndex(idx)}
                      onDelete={() => deletePageAtIndex(idx)}
                      canDelete={numPages > 1}
                      onMoveLeft={() => reorderPage(idx, idx - 1)}
                      canMoveLeft={idx > 0}
                      onMoveRight={() => reorderPage(idx, idx + 1)}
                      canMoveRight={idx < numPages - 1}
                      onDragStart={() => setDraggedPageIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedPageIndex !== null && draggedPageIndex !== idx) {
                          reorderPage(draggedPageIndex, idx);
                          setDraggedPageIndex(null);
                        }
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => insertBlankPage()}
                    className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] p-3 text-white/60 hover:text-[#c7f36b] hover:border-[#c7f36b]/40 min-h-[110px] min-w-[70px] transition-colors flex-shrink-0"
                    title="Add new blank A4 page"
                  >
                    <Plus size={18} />
                    <span className="text-[10px] mt-1 font-mono">Add Page</span>
                  </button>
                </div>
              </div>
            )}

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
                              setIsItalic(!!ann.isItalic);
                              if (ann.fontFamily) setFontFamily(ann.fontFamily);
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
                              fontFamily: ann.fontFamily === "Times-Roman" ? "'Times New Roman', Times, Georgia, serif" : ann.fontFamily === "Courier" ? "'Courier New', Courier, monospace" : "Arial, Helvetica, sans-serif",
                              fontWeight: ann.isBold ? "bold" : "normal",
                              fontStyle: ann.isItalic ? "italic" : "normal",
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
                              <>
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
                                    fontStyle: "inherit",
                                    fontFamily: "inherit",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    outline: "none",
                                    minWidth: "60px",
                                  }}
                                />
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                                >
                                  <span className="font-mono text-[#c7f36b] uppercase text-[9px]">
                                    {ann.fontFamily === "Times-Roman" ? "Serif" : ann.fontFamily === "Courier" ? "Mono" : "Sans"} · {ann.fontSize}pt
                                  </span>
                                  <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                  <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                                </div>
                              </>
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
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b, 0 0 8px rgba(199,243,107,0.5)" : "none",
                              cursor: "move",
                            }}
                          >
                            {isSelected && (
                              <>
                                <div onMouseDown={(e) => startResize(e, "nw", ann)} className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "ne", ann)} className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "se", ann)} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "sw", ann)} className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                                >
                                  <span className="font-mono text-[#c7f36b] uppercase text-[9px]">Redaction</span>
                                  <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                  <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                                </div>
                              </>
                            )}
                          </div>
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
                            <span>{ann.text}</span>
                            {isSelected && (
                              <div
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                              >
                                <span className="font-mono text-[#c7f36b] uppercase text-[9px]">Stamp</span>
                                <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                              </div>
                            )}
                          </div>
                        );
                      }
                      if (ann.type === "image") {
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
                              border: isSelected ? "2px solid #c7f36b" : "1px dashed rgba(255,255,255,0.3)",
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b, 0 0 10px rgba(199,243,107,0.5)" : "none",
                              cursor: "move",
                            }}
                            className="group select-none"
                          >
                            <img
                              src={ann.imageDataUrl}
                              alt={ann.name || "Embedded image"}
                              className="w-full h-full object-contain pointer-events-none"
                            />
                            {isSelected && (
                              <>
                                <div onMouseDown={(e) => startResize(e, "nw", ann)} className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "ne", ann)} className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "se", ann)} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "sw", ann)} className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                                >
                                  <span className="font-mono text-[#c7f36b] uppercase text-[9px]">Image</span>
                                  <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                  <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      if (ann.type === "highlight") {
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
                              mixBlendMode: "multiply",
                              border: isSelected ? "2px solid #c7f36b" : "1px dashed rgba(245,158,11,0.4)",
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b, 0 0 8px rgba(199,243,107,0.5)" : "none",
                              cursor: "move",
                            }}
                          >
                            {isSelected && (
                              <>
                                <div onMouseDown={(e) => startResize(e, "nw", ann)} className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "ne", ann)} className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "se", ann)} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "sw", ann)} className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                                >
                                  <span className="font-mono text-[#c7f36b] uppercase text-[9px]">Highlight</span>
                                  <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                  <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      if (ann.type === "link") {
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
                              backgroundColor: "rgba(37,99,235,0.15)",
                              border: isSelected ? "2px solid #c7f36b" : "1.5px dashed #2563eb",
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b, 0 0 8px rgba(199,243,107,0.5)" : "none",
                              cursor: "move",
                            }}
                            className="flex items-center px-1.5 overflow-hidden text-[10px] font-mono text-blue-300 select-none"
                          >
                            <LinkIcon size={11} className="mr-1 flex-shrink-0 text-blue-400" />
                            <span className="truncate flex-1">{ann.url}</span>
                            {isSelected && (
                              <>
                                <div onMouseDown={(e) => startResize(e, "nw", ann)} className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "ne", ann)} className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "se", ann)} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "sw", ann)} className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                                >
                                  <span className="font-mono text-[#c7f36b] uppercase text-[9px]">Link</span>
                                  <a href={ann.url} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:text-[#c7f36b]" title="Open URL in new tab"><Eye size={11} /></a>
                                  <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                  <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      if (ann.type === "shape") {
                        const hasFill = ann.fillColor && ann.fillColor !== "transparent";
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
                              boxShadow: isSelected ? "0 0 0 2px #c7f36b, 0 0 8px rgba(199,243,107,0.5)" : "none",
                              cursor: "move",
                            }}
                          >
                            <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                              {ann.shapeType === "rectangle" && (
                                <rect
                                  x={2}
                                  y={2}
                                  width={96}
                                  height={96}
                                  stroke={ann.strokeColor}
                                  strokeWidth={ann.strokeWidth * 0.8}
                                  fill={hasFill ? ann.fillColor : "none"}
                                />
                              )}
                              {ann.shapeType === "circle" && (
                                <ellipse
                                  cx={50}
                                  cy={50}
                                  rx={48}
                                  ry={48}
                                  stroke={ann.strokeColor}
                                  strokeWidth={ann.strokeWidth * 0.8}
                                  fill={hasFill ? ann.fillColor : "none"}
                                />
                              )}
                              {(ann.shapeType === "line" || ann.shapeType === "arrow") && (
                                <>
                                  <line
                                    x1={0}
                                    y1={100}
                                    x2={100}
                                    y2={0}
                                    stroke={ann.strokeColor}
                                    strokeWidth={ann.strokeWidth * 0.8}
                                  />
                                  {ann.shapeType === "arrow" && (
                                    <polygon
                                      points="100,0 85,12 88,2"
                                      fill={ann.strokeColor}
                                    />
                                  )}
                                </>
                              )}
                            </svg>
                            {isSelected && (
                              <>
                                <div onMouseDown={(e) => startResize(e, "nw", ann)} className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "ne", ann)} className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "se", ann)} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nwse-resize z-30" />
                                <div onMouseDown={(e) => startResize(e, "sw", ann)} className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#c7f36b] border border-black shadow cursor-nesw-resize z-30" />
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute -top-7 left-0 z-40 flex items-center gap-1 rounded bg-[#0e1628] border border-[#c7f36b]/60 px-1.5 py-0.5 shadow-xl text-[10px] text-white"
                                >
                                  <span className="font-mono text-[#c7f36b] uppercase text-[9px]">{ann.shapeType}</span>
                                  <button type="button" onClick={() => duplicateAnnotation(ann.id)} className="p-0.5 hover:text-[#c7f36b]" title="Duplicate"><Copy size={11} /></button>
                                  <button type="button" onClick={() => deleteAnnotation(ann.id)} className="p-0.5 text-red-400 hover:text-red-300" title="Delete"><Trash2 size={11} /></button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      if (ann.type === "inplace-edit") {
                        const isSelected = ann.id === selectedId;
                        return (
                          <div
                            key={ann.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(ann.id);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleReopenInPlaceEdit(ann);
                            }}
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
                              minWidth: `${ann.width}%`,
                              backgroundColor: ann.bgColor || "#ffffff",
                              color: ann.color || "#0f172a",
                              fontSize: `${ann.fontSize * 1.5 * zoomScale}px`,
                              fontFamily: ann.fontFamily === "Times-Roman"
                                ? (ann.cleanFontName ? `"${ann.cleanFontName}", 'Times New Roman', Times, Georgia, serif` : "'Times New Roman', Times, Georgia, serif")
                                : ann.fontFamily === "Courier"
                                ? (ann.cleanFontName ? `"${ann.cleanFontName}", 'Courier New', Courier, monospace` : "'Courier New', Courier, monospace")
                                : (ann.cleanFontName ? `"${ann.cleanFontName}", Arial, Helvetica, -apple-system, sans-serif` : "Arial, Helvetica, -apple-system, sans-serif"),
                              fontWeight: ann.isBold ? "bold" : "normal",
                              fontStyle: ann.isItalic ? "italic" : "normal",
                              lineHeight: "1.2",
                              padding: "0 2px",
                              cursor: "pointer",
                              border: isSelected ? "1px dashed #0284c7" : "1px solid transparent",
                              boxShadow: isSelected ? "0 0 0 1px rgba(2, 132, 199, 0.4)" : "none",
                              borderRadius: "2px",
                              zIndex: isSelected ? 35 : 15,
                              whiteSpace: "pre-wrap",
                              display: "inline-flex",
                              alignItems: "center",
                              overflow: "visible",
                            }}
                            className="select-none transition-shadow"
                            title="Click to select, double-click to edit text"
                          >
                            <span>{ann.newText}</span>
                            {isSelected && (
                              <div
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute -top-7 left-0 z-50 flex items-center gap-1.5 rounded-lg bg-[#0e1628] border border-sky-400/80 px-2 py-0.5 shadow-xl text-[10px] text-white whitespace-nowrap"
                              >
                                <span className="font-mono text-sky-300 font-semibold">{ann.cleanFontName}</span>
                                <span className="text-white/60">{ann.fontSize}pt · {ann.isBold ? "Bold" : "Reg"}</span>
                                <div className="h-3 w-px bg-white/20 mx-0.5" />
                                <button
                                  type="button"
                                  onClick={() => handleReopenInPlaceEdit(ann)}
                                  className="text-[#c7f36b] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                  title="Edit this text line in place"
                                >
                                  ✏️ Edit Text
                                </button>
                                <button
                                  type="button"
                                  onClick={() => duplicateAnnotation(ann.id)}
                                  className="p-0.5 hover:text-[#c7f36b] ml-1 cursor-pointer"
                                  title="Duplicate"
                                >
                                  <Copy size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteAnnotation(ann.id)}
                                  className="p-0.5 text-red-400 hover:text-red-300 cursor-pointer"
                                  title="Delete text"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
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

                    {/* Interactive Detected Text Blocks Layer (Editing Mode) */}
                    {activeTool === "smart-edit" && (
                      <div className="absolute inset-0 pointer-events-none">
                        {detectedBlocks.map((block) => {
                          const isHovered = hoveredBlockId === block.id;
                          const isActive = activeInlineBlock?.id === block.id;

                          return (
                            <div
                              key={block.id}
                              onMouseEnter={() => setHoveredBlockId(block.id)}
                              onMouseLeave={() => setHoveredBlockId(null)}
                              onClick={(e) => handleSelectBlockForEdit(block, e)}
                              style={{
                                position: "absolute",
                                left: `${block.x}%`,
                                top: `${block.y}%`,
                                width: `${block.width}%`,
                                height: `${block.height}%`,
                                pointerEvents: "auto",
                                cursor: "pointer",
                                border: isActive ? "none" : isHovered ? "1.5px dashed #38bdf8" : "1px solid transparent",
                                backgroundColor: isActive ? "transparent" : isHovered ? "rgba(56,189,248,0.12)" : "transparent",
                                borderRadius: "2px",
                              }}
                              className="transition-colors group"
                              title={`Click to edit: "${block.text}" (${block.font.cleanName})`}
                            >
                              {/* Font Tag badge on hover */}
                              {isHovered && !isActive && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "100%",
                                    left: "0",
                                    fontSize: "9px",
                                  }}
                                  className="rounded bg-[#0e1628] border border-sky-400/80 px-1.5 py-0.5 font-mono text-sky-200 shadow-xl whitespace-nowrap z-50 pointer-events-none mb-0.5 flex items-center gap-1"
                                >
                                  <span className="h-1 w-1 rounded-full bg-[#c7f36b]" />
                                  <span>{block.font.cleanName}</span>
                                  <span className="text-white/50">{block.font.fontSize}pt</span>
                                </div>
                              )}

                              {/* In-Place Content Editable Input when active */}
                              {isActive && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: "absolute",
                                    left: "-2px",
                                    top: "-2px",
                                    minWidth: "max(100%, 280px)",
                                    zIndex: 60,
                                  }}
                                  className="relative"
                                >
                                  {/* Floating Top/Bottom Formatting Toolbar (Editing Mode) */}
                                  <div
                                    style={{
                                      position: "absolute",
                                      ...(block.y < 9
                                        ? { top: "100%", marginTop: "8px" }
                                        : { bottom: "100%", marginBottom: "8px" }),
                                      left: "0",
                                    }}
                                    className="flex items-center flex-wrap gap-1.5 rounded-xl bg-[#0e1628]/98 border border-sky-400/80 px-3 py-1.5 shadow-2xl z-50 text-xs backdrop-blur-md whitespace-nowrap"
                                  >
                                    {/* Detected Font Family & Standard Select */}
                                    <div className="flex items-center gap-1 pr-1.5 border-r border-white/15">
                                      <span className="font-mono text-[11px] font-semibold text-sky-300 max-w-[110px] truncate" title={block.font.cleanName}>
                                        {block.font.cleanName}
                                      </span>
                                      <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value as any)}
                                        className="bg-black/80 border border-white/20 rounded text-[10px] text-white/90 px-1 py-0.5 outline-none cursor-pointer"
                                        title="Font Family"
                                      >
                                        <option value="Helvetica">Sans</option>
                                        <option value="Times-Roman">Serif</option>
                                        <option value="Courier">Mono</option>
                                      </select>
                                    </div>

                                    {/* Bold Toggle [B] */}
                                    <button
                                      type="button"
                                      onClick={() => setIsBold((b) => !b)}
                                      className={`h-6 w-6 rounded font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                        isBold
                                          ? "bg-[#c7f36b] text-[#0b1020] font-black ring-1 ring-[#c7f36b]"
                                          : "text-white/80 hover:bg-white/15 border border-white/20"
                                      }`}
                                      title={isBold ? "Bold is ON (Click to make Normal)" : "Bold is OFF (Click to make Bold)"}
                                    >
                                      B
                                    </button>

                                    {/* Italic Toggle [I] */}
                                    <button
                                      type="button"
                                      onClick={() => setIsItalic((it) => !it)}
                                      className={`h-6 w-6 rounded italic font-serif text-xs flex items-center justify-center transition-all cursor-pointer ${
                                        isItalic
                                          ? "bg-[#c7f36b] text-[#0b1020] font-black ring-1 ring-[#c7f36b]"
                                          : "text-white/80 hover:bg-white/15 border border-white/20"
                                      }`}
                                      title="Toggle Italic"
                                    >
                                      I
                                    </button>

                                    {/* Font Size Stepper */}
                                    <div className="flex items-center rounded border border-white/20 bg-black/40 px-1 py-0.5 gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setFontSize((s) => Math.max(6, (s || block.font.fontSize) - 1))}
                                        className="h-5 w-4 rounded hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                                        title="Decrease font size (-1pt)"
                                      >
                                        -
                                      </button>
                                      <span className="font-mono text-[11px] text-[#c7f36b] px-0.5 font-bold min-w-[28px] text-center">
                                        {fontSize || block.font.fontSize}pt
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setFontSize((s) => Math.min(72, (s || block.font.fontSize) + 1))}
                                        className="h-5 w-4 rounded hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                                        title="Increase font size (+1pt)"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Quick Color Swatches */}
                                    <div className="flex items-center gap-1 px-1 border-x border-white/15">
                                      {[
                                        { color: "#0f172a", label: "Black" },
                                        { color: "#1e3a8a", label: "Navy" },
                                        { color: "#dc2626", label: "Red" },
                                        { color: "#059669", label: "Green" },
                                      ].map((c) => (
                                        <button
                                          key={c.color}
                                          type="button"
                                          onClick={() => setTextColor(c.color)}
                                          style={{ backgroundColor: c.color }}
                                          className={`h-4 w-4 rounded-full border transition-transform cursor-pointer ${
                                            textColor === c.color ? "ring-2 ring-[#c7f36b] scale-110 border-white" : "border-white/30 hover:scale-105"
                                          }`}
                                          title={`Set color: ${c.label}`}
                                        />
                                      ))}
                                      <input
                                        type="color"
                                        value={textColor || "#0f172a"}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="h-5 w-5 rounded cursor-pointer border border-white/20 bg-transparent p-0"
                                        title="Choose custom text color"
                                      />
                                    </div>

                                    {/* Save & Cancel */}
                                    <button
                                      type="button"
                                      onClick={handleCommitInlineEdit}
                                      className="rounded bg-[#c7f36b] text-[#0b1020] px-3 py-1 text-xs font-bold hover:bg-[#b8eb55] transition-colors shadow-sm cursor-pointer ml-1 flex items-center gap-1"
                                      title="Apply text changes (Enter)"
                                    >
                                      ✓ Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveInlineBlock(null)}
                                      className="rounded border border-white/20 text-white/80 hover:bg-white/10 px-2 py-1 text-xs transition-colors cursor-pointer"
                                      title="Cancel editing (Escape)"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* In-Place Text Input Field directly on document (Editing Mode) */}
                                  <div
                                    style={{
                                      borderRadius: "3px",
                                      border: "1.5px solid #0284c7",
                                      backgroundColor: "#ffffff",
                                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                                      display: "flex",
                                      alignItems: "center",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      value={inlineDraftText}
                                      autoFocus
                                      onChange={(e) => setInlineDraftText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleCommitInlineEdit();
                                        } else if (e.key === "Escape") {
                                          setActiveInlineBlock(null);
                                        }
                                      }}
                                      style={{
                                        fontSize: `${(fontSize || block.font.fontSize) * 1.5 * zoomScale}px`,
                                        fontFamily: fontFamily === "Times-Roman"
                                          ? (block.font.cleanName ? `"${block.font.cleanName}", 'Times New Roman', Times, serif` : "'Times New Roman', Times, serif")
                                          : fontFamily === "Courier"
                                          ? (block.font.cleanName ? `"${block.font.cleanName}", 'Courier New', monospace` : "'Courier New', monospace")
                                          : (block.font.cleanName ? `"${block.font.cleanName}", Arial, Helvetica, sans-serif` : "Arial, Helvetica, sans-serif"),
                                        fontWeight: isBold ? "bold" : "normal",
                                        fontStyle: isItalic ? "italic" : "normal",
                                        color: textColor || block.suggestedColor || "#0f172a",
                                        backgroundColor: "#ffffff",
                                        lineHeight: "1.25",
                                        width: "100%",
                                        padding: "2px 6px",
                                        outline: "none",
                                        border: "none",
                                      }}
                                      className="focus:outline-none min-w-[220px]"
                                      placeholder="Type edited text..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

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

                    {/* Temporary Shape drag preview */}
                    {activeTool === "shape" && tempShape && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${tempShape.x}%`,
                          top: `${tempShape.y}%`,
                          width: `${tempShape.w}%`,
                          height: `${tempShape.h}%`,
                          border: `2px dashed ${shapeStrokeColor}`,
                          backgroundColor: shapeFillColor !== "transparent" ? shapeFillColor : "rgba(37,99,235,0.1)",
                          pointerEvents: "none",
                          borderRadius: shapeType === "circle" ? "50%" : "2px",
                        }}
                      />
                    )}

                    {/* Temporary Highlight drag preview */}
                    {activeTool === "highlight" && tempHighlight && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${tempHighlight.x}%`,
                          top: `${tempHighlight.y}%`,
                          width: `${tempHighlight.w}%`,
                          height: `${tempHighlight.h}%`,
                          backgroundColor: highlightColor,
                          border: "1px dashed #f59e0b",
                          pointerEvents: "none",
                        }}
                      />
                    )}

                    {/* Live Header Preview */}
                    {headerText.trim() && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "20px",
                          fontSize: `${Math.max(9, 10 * zoomScale)}px`,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                        className="font-mono text-black/60 bg-white/80 px-1.5 py-0.5 rounded shadow-sm border border-black/10"
                        title="Live Header Preview"
                      >
                        {headerText}
                      </div>
                    )}

                    {/* Live Footer & Page Numbers Preview */}
                    {(footerText.trim() || includePageNumbers) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          left: "20px",
                          right: "20px",
                          fontSize: `${Math.max(9, 10 * zoomScale)}px`,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                        className="flex items-center justify-between font-mono text-black/60 bg-white/80 px-2 py-0.5 rounded shadow-sm border border-black/10"
                        title="Live Footer Preview"
                      >
                        <span>{footerText.trim()}</span>
                        {includePageNumbers && <span>Page {currentPage + 1} of {numPages}</span>}
                      </div>
                    )}

                    {/* Live Watermark Preview */}
                    {watermarkText.trim() && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%) rotate(-45deg)",
                          pointerEvents: "none",
                          userSelect: "none",
                          fontSize: `${Math.max(26, 44 * zoomScale)}px`,
                          color: "rgba(0, 0, 0, 0.12)",
                          fontWeight: "bold",
                          letterSpacing: "4px",
                          whiteSpace: "nowrap",
                        }}
                        title="Live Watermark Preview"
                      >
                        {watermarkText}
                      </div>
                    )}

                    {/* Live Bates Stamping Preview Overlay */}
                    {enableBates && (
                      <div
                        style={{
                          position: "absolute",
                          fontSize: `${Math.max(9, batesFontSize * 1.1 * zoomScale)}px`,
                          pointerEvents: "none",
                          userSelect: "none",
                          ...(batesPosition === "bottom-right"
                            ? { bottom: "14px", right: "18px" }
                            : batesPosition === "bottom-center"
                            ? { bottom: "14px", left: "50%", transform: "translateX(-50%)" }
                            : batesPosition === "bottom-left"
                            ? { bottom: "14px", left: "18px" }
                            : batesPosition === "top-right"
                            ? { top: "14px", right: "18px" }
                            : batesPosition === "top-center"
                            ? { top: "14px", left: "50%", transform: "translateX(-50%)" }
                            : { top: "14px", left: "18px" }),
                        }}
                        className="rounded bg-black/85 px-2.5 py-1 font-mono font-bold text-[#c7f36b] border border-[#c7f36b]/60 shadow-2xl z-20 flex items-center gap-1.5 backdrop-blur-sm"
                        title="Live Bates Stamping Preview (Rendered on Export)"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c7f36b] animate-ping" />
                        <span>
                          {batesPrefix}
                          {String(batesStart + currentPage).padStart(batesDigits, "0")}
                          {batesSuffix}
                        </span>
                        <span className="text-[9px] text-white/50 uppercase font-sans">Bates</span>
                      </div>
                    )}
                  </div>
                {/* Mobile / Narrow Screen Floating Action Dock so tools are never lost */}
                <div className="lg:hidden sticky bottom-4 z-40 mt-4 flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-[#0e1628]/95 px-3 py-2 shadow-2xl backdrop-blur-md text-xs">
                  <button
                    type="button"
                    onClick={() => { setActiveTool("smart-edit"); setSelectedId(null); }}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === "smart-edit" ? "bg-[#c7f36b] text-[#0b1020]" : "text-white/70 hover:text-white"}`}
                    title="Smart Edit"
                  >
                    <Sparkles size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("text"); setSelectedId(null); }}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === "text" ? "bg-[#c7f36b] text-[#0b1020]" : "text-white/70 hover:text-white"}`}
                    title="Add Text"
                  >
                    <Type size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("highlight"); setSelectedId(null); }}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === "highlight" ? "bg-[#c7f36b] text-[#0b1020]" : "text-white/70 hover:text-white"}`}
                    title="Highlight"
                  >
                    <Highlighter size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("whiteout"); setSelectedId(null); }}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === "whiteout" ? "bg-[#c7f36b] text-[#0b1020]" : "text-white/70 hover:text-white"}`}
                    title="Cover / Redact"
                  >
                    <Square size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("draw"); setSelectedId(null); }}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === "draw" ? "bg-[#c7f36b] text-[#0b1020]" : "text-white/70 hover:text-white"}`}
                    title="Draw / Sign"
                  >
                    <PenTool size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("stamp"); setSelectedId(null); }}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === "stamp" ? "bg-[#c7f36b] text-[#0b1020]" : "text-white/70 hover:text-white"}`}
                    title="Stamp"
                  >
                    <Stamp size={14} />
                  </button>
                  <div className="h-4 w-px bg-white/20 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("pdf-visual-editor-container")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#c7f36b] px-1.5 py-0.5 rounded hover:bg-[#c7f36b]/10"
                    title="Jump to Tool Settings"
                  >
                    Options ↑
                  </button>
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

        {/* Format-Preserving Document Converter & OCR Console Modal */}
        {showOcrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="max-w-4xl w-full rounded-2xl border border-white/20 bg-[#0c1222] p-6 shadow-2xl space-y-4 text-white animate-fade-in flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#c7f36b]/10 border border-[#c7f36b]/30 flex items-center justify-center text-[#c7f36b] shadow-inner">
                    <ScanText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      Format-Preserving Converter & OCR Console
                      <span className="text-[10px] font-mono uppercase bg-[#c7f36b]/15 text-[#c7f36b] px-2 py-0.5 rounded-full border border-[#c7f36b]/30">
                        Zero-Server Local WASM
                      </span>
                    </h3>
                    <p className="text-xs text-white/50">
                      Preserve headings, tables, typographic hierarchy & layout when converting or extracting PDF documents
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOcrModal(false)}
                  disabled={isOcrRunning}
                  className="text-white/50 hover:text-white text-lg p-1.5 rounded-lg hover:bg-white/5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Document Nature Pre-Flight Diagnostic Banner */}
              {detectedPdfNature && (
                <div
                  className={`rounded-xl border p-3 flex items-start gap-3 text-xs shrink-0 ${
                    detectedPdfNature.isScanned
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-sky-500/10 border-sky-500/30 text-sky-200"
                  }`}
                >
                  <div className="mt-0.5 font-bold shrink-0">
                    {detectedPdfNature.isScanned ? "📷 Scanned Raster PDF" : "🎯 Born-Digital Vector PDF"}
                  </div>
                  <div className="leading-relaxed text-[11px] opacity-90">
                    {detectedPdfNature.isScanned ? (
                      <span>
                        Document contains scanned images. Using <strong>Layout-Aware OCR (Tesseract WASM)</strong> with bounding box spatial clustering to reconstruct headings, paragraphs, and columnar alignment.
                      </span>
                    ) : (
                      <span>
                        Document contains native vector typography ({detectedPdfNature.totalChars} characters detected across {detectedPdfNature.numPages} pages). Extracting native font sizes, tables, and weights directly into <strong>OpenXML DOCX</strong> with zero OCR loss.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Progress & Live Telemetry */}
              {isOcrRunning && (
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3 shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#c7f36b] font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#c7f36b] animate-ping" />
                      {ocrStatus || "Analyzing typography & layout..."}
                    </span>
                    <span className="font-mono text-white/70">{ocrProgressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#c7f36b] to-emerald-400 transition-all duration-300 ease-out"
                      style={{ width: `${ocrProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/50">
                    Running entirely in browser WebAssembly memory. Your private documents never touch an external server or API.
                  </p>
                </div>
              )}

              {/* Direct Format Export Action Grid */}
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3 space-y-2 shrink-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60 flex items-center justify-between">
                  <span>Export with Preserved Formatting:</span>
                  <span className="text-[10px] lowercase text-white/40">select a format to download immediately</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={() => {
                      if (documentStructure) {
                        exportStructureToDocx(documentStructure, fileName);
                        showToast("Word (.docx) downloaded!");
                      } else {
                        handleRunLayoutAnalysis("docx");
                      }
                    }}
                    className="flex flex-col items-start gap-1 p-2 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-left cursor-pointer transition-all disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-300">
                      <FileText size={14} /> Word (.docx)
                    </div>
                    <span className="text-[10px] text-white/50 leading-tight">Headings, tables, and typography intact</span>
                  </button>

                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={handleExportSearchablePdf}
                    className="flex flex-col items-start gap-1 p-2 rounded-lg border border-[#c7f36b]/30 bg-[#c7f36b]/10 hover:bg-[#c7f36b]/20 text-left cursor-pointer transition-all disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#c7f36b]">
                      <Sparkles size={14} /> Searchable PDF
                    </div>
                    <span className="text-[10px] text-white/50 leading-tight">100% visual fidelity + selectable text</span>
                  </button>

                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={() => {
                      if (documentStructure) {
                        exportStructureToHtml(documentStructure, fileName);
                        showToast("HTML document downloaded!");
                      } else {
                        handleRunLayoutAnalysis("html");
                      }
                    }}
                    className="flex flex-col items-start gap-1 p-2 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left cursor-pointer transition-all disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-purple-300">
                      <FileCode size={14} /> Semantic HTML
                    </div>
                    <span className="text-[10px] text-white/50 leading-tight">Styled tables & clean web headings</span>
                  </button>

                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={() => {
                      if (documentStructure) {
                        exportStructureToMarkdown(documentStructure, fileName);
                        showToast("Markdown (.md) downloaded!");
                      } else {
                        handleRunLayoutAnalysis("md");
                      }
                    }}
                    className="flex flex-col items-start gap-1 p-2 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-left cursor-pointer transition-all disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-teal-300">
                      <FileText size={14} /> Markdown (.md)
                    </div>
                    <span className="text-[10px] text-white/50 leading-tight">Markdown tables & structure for LLMs</span>
                  </button>

                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={handleExportExcel}
                    className="flex flex-col items-start gap-1 p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left cursor-pointer transition-all disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-300">
                      <FileSpreadsheet size={14} /> Excel (.xlsx)
                    </div>
                    <span className="text-[10px] text-white/50 leading-tight">Extracted multi-column grid matrix</span>
                  </button>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOcrActiveTab("formatted")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      ocrActiveTab === "formatted"
                        ? "bg-[#c7f36b] text-[#0c1222] font-semibold"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Formatted Document Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setOcrActiveTab("raw")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      ocrActiveTab === "raw"
                        ? "bg-[#c7f36b] text-[#0c1222] font-semibold"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Raw Stream / Markdown
                  </button>
                </div>

                {documentStructure && (
                  <span className="font-mono text-[11px] text-white/40">
                    {documentStructure.blocks.length} blocks parsed • {documentStructure.totalWords} words
                  </span>
                )}
              </div>

              {/* Content Viewport */}
              <div className="flex-1 min-h-[220px] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#080d18]">
                {ocrActiveTab === "formatted" ? (
                  <div className="flex-1 p-4 overflow-y-auto max-h-[320px] text-slate-200 text-xs leading-relaxed space-y-2">
                    {documentStructure?.previewHtml ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: documentStructure.previewHtml }}
                        className="prose prose-invert prose-xs max-w-none"
                      />
                    ) : isOcrRunning ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-white/50 space-y-2">
                        <div className="h-6 w-6 rounded-full border-2 border-[#c7f36b] border-t-transparent animate-spin" />
                        <p className="text-xs">Reconstructing typography hierarchy and layout matrix...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-white/40 space-y-2">
                        <FileText size={32} className="opacity-30" />
                        <p className="text-xs">Click "Format-Preserving OCR Console" or an export format above to run conversion.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    readOnly={isOcrRunning}
                    value={
                      isOcrRunning && !ocrResultText
                        ? "Extracting character stream and bounding boxes from PDF buffers...\nPlease wait while engine processes."
                        : ocrResultText
                    }
                    onChange={(e) => setOcrResultText(e.target.value)}
                    placeholder="Extracted document markdown and raw text will appear here..."
                    className="w-full flex-1 p-3 text-xs font-mono text-white/90 placeholder:text-white/30 focus:border-[#c7f36b] focus:outline-none resize-none leading-relaxed overflow-y-auto bg-transparent border-0"
                  />
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isOcrRunning || !ocrResultText}
                    onClick={() => {
                      navigator.clipboard.writeText(ocrResultText);
                      showToast("Document text copied to clipboard!");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Copy size={13} /> Copy Content
                  </button>

                  <button
                    type="button"
                    disabled={isOcrRunning || !ocrResultText}
                    onClick={() => {
                      const blob = new Blob([ocrResultText], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${fileName.replace(/\.pdf$/i, "")}_extracted.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast("Text file downloaded!");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Download size={13} /> Download .txt
                  </button>

                  <button
                    type="button"
                    disabled={isOcrRunning}
                    onClick={() => handleRunLayoutAnalysis()}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    <ScanText size={13} /> Re-analyze Document
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOcrRunning}
                  onClick={() => setShowOcrModal(false)}
                  className="signal-button text-xs px-4 py-2 cursor-pointer disabled:opacity-40"
                >
                  Close Console
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
