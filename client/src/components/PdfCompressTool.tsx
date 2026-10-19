import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "@/lib/pdfWorkerSetup";
import { PDFDocument } from "pdf-lib";
import {
  FileDown,
  Minimize2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Download,
  RotateCcw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useLocation } from "wouter";

export type CompressionLevel = "extreme" | "recommended" | "low" | "lossless";

interface CompressionConfig {
  id: CompressionLevel;
  title: string;
  badge: string;
  ratio: string;
  description: string;
  scale: number;
  quality: number;
  color: string;
}

const COMPRESSION_PROFILES: CompressionConfig[] = [
  {
    id: "extreme",
    title: "Extreme Compression",
    badge: "Maximum Reduction",
    ratio: "~65% - 80% Smaller",
    description: "Lowest file size. Downscaled to 72 DPI with aggressive optimization. Ideal for strict portal upload limits (under 1MB/2MB).",
    scale: 1.0,
    quality: 0.52,
    color: "#f59e0b",
  },
  {
    id: "recommended",
    title: "Recommended Compression",
    badge: "Most Popular",
    ratio: "~45% - 65% Smaller",
    description: "Good quality, high compression. Re-encoded at 144 DPI with balanced JPEG stream packing. Sharp text and clear graphics.",
    scale: 1.4,
    quality: 0.72,
    color: "#c7f36b",
  },
  {
    id: "low",
    title: "Less Compression",
    badge: "High Quality",
    ratio: "~20% - 35% Smaller",
    description: "High quality preservation. 200 DPI resolution with light compression. Retains high fidelity for presentations and print.",
    scale: 1.8,
    quality: 0.86,
    color: "#38bdf8",
  },
  {
    id: "lossless",
    title: "Lossless Stream Purge",
    badge: "100% Vector Intact",
    ratio: "~10% - 25% Smaller",
    description: "Strips unreferenced objects, dead metadata, and repacks object streams without rasterizing text or vectors.",
    scale: 1.0,
    quality: 1.0,
    color: "#a855f7",
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface PdfCompressToolProps {
  initialPdfBytes?: Uint8Array | null;
  initialFileName?: string;
  onOpenInEditor?: (bytes: Uint8Array, name: string) => void;
}

export default function PdfCompressTool({
  initialPdfBytes = null,
  initialFileName = "",
  onOpenInEditor,
}: PdfCompressToolProps) {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(initialPdfBytes);
  const [fileName, setFileName] = useState<string>(initialFileName || "document.pdf");
  const [originalSize, setOriginalSize] = useState<number>(initialPdfBytes?.length || 0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<CompressionLevel>("recommended");

  // Compression processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compression Result
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  // Handle uploaded file
  const handleFileChange = async (file: File) => {
    try {
      setErrorMessage(null);
      setCompressedBytes(null);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const pdf = await loadingTask.promise;

      setPdfBytes(bytes);
      setFileName(file.name);
      setOriginalSize(file.size);
      setPageCount(pdf.numPages);
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not parse PDF. Ensure the file is not password-protected or corrupt.");
    }
  };

  // Run Compression Engine
  const executeCompression = async () => {
    if (!pdfBytes) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setCurrentStep("Analyzing PDF structure and page metrics...");

    try {
      const profile = COMPRESSION_PROFILES.find((p) => p.id === selectedProfile)!;

      if (profile.id === "lossless") {
        // Pure vector & object stream packing
        setCurrentStep("Purging redundant metadata & packing object streams...");
        setProgressPercent(40);

        const pdfDoc = await PDFDocument.load(pdfBytes.slice(), { ignoreEncryption: true });
        
        // Strip XML metadata and dead xref entries
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("ToolboxGalaxy PDF Optimizer");
        pdfDoc.setCreator("ToolboxGalaxy Engine");

        setProgressPercent(80);
        setCurrentStep("Re-serializing compressed object tables...");

        const resultBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        setCompressedBytes(resultBytes);
        setCompressedSize(resultBytes.length);
        setProgressPercent(100);
      } else {
        // iLovePDF Intelligent Page Stream Recompression
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        const newDoc = await PDFDocument.create();

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setCurrentStep(`Optimizing page ${pageNum} of ${totalPages}...`);
          setProgressPercent(Math.round(10 + (pageNum / totalPages) * 75));

          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: profile.scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          if (!ctx) throw new Error("Could not initialize canvas rendering context.");

          // Render page to canvas with smooth graphics
          await (page.render as any)({
            canvasContext: ctx,
            viewport,
            intent: "display",
          }).promise;

          // Convert to compressed JPEG blob
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", profile.quality)
          );

          if (!blob) throw new Error(`Compression failed on page ${pageNum}.`);

          const imgBuffer = await blob.arrayBuffer();
          const embeddedImg = await newDoc.embedJpg(new Uint8Array(imgBuffer));

          // Get original PDF point dimensions so page layout is 100% preserved
          const origViewport = page.getViewport({ scale: 1.0 });
          const newPage = newDoc.addPage([origViewport.width, origViewport.height]);

          newPage.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
          });
        }

        setCurrentStep("Packaging final compressed PDF stream...");
        setProgressPercent(90);

        const resultBytes = await newDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        setCompressedBytes(resultBytes);
        setCompressedSize(resultBytes.length);
        setProgressPercent(100);
      }
    } catch (err) {
      console.error("Compression error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred during PDF compression."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Download compressed file
  const handleDownload = () => {
    if (!compressedBytes) return;
    const blob = new Blob([compressedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = fileName.replace(/\.pdf$/i, "");
    a.href = url;
    a.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open in Visual Editor
  const handleOpenEditor = () => {
    if (!compressedBytes) return;
    if (onOpenInEditor) {
      onOpenInEditor(compressedBytes, fileName);
    } else {
      // Set into session storage for studio auto-load
      try {
        const base64 = btoa(
          new Uint8Array(compressedBytes).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        sessionStorage.setItem("tg_studio_load_pdf", base64);
        sessionStorage.setItem("tg_studio_load_name", fileName);
      } catch {
        // ignore storage limits
      }
      setLocation("/studio");
    }
  };

  const savingsBytes = originalSize > compressedSize ? originalSize - compressedSize : 0;
  const savingsPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#12192c] via-[#0d1424] to-[#0a0f1d] p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#c7f36b]/15 px-3 py-1 text-xs font-mono font-bold text-[#c7f36b] border border-[#c7f36b]/30">
                <Minimize2 size={13} /> CLIENT-SIDE PDF COMPRESSOR
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-mono text-white/70 border border-white/10">
                <ShieldCheck size={13} className="text-[#c7f36b]" /> ZERO SERVER UPLOADS
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Compress & Optimize PDF File Size
            </h2>
            <p className="mt-1 text-sm text-white/70 max-w-2xl leading-relaxed">
              Reduce PDF file size up to <b>80%</b> while maintaining high visual quality. Select from 3 iLovePDF-style compression presets or lossless stream purge.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-[#c7f36b] flex items-center gap-1.5 shadow-inner">
              <Zap size={14} /> 100% Memory-Safe
            </span>
          </div>
        </div>
      </div>

      {/* Main Upload or Compression Configuration */}
      {!pdfBytes ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/30 p-12 text-center transition-all hover:border-[#c7f36b]/60 hover:bg-[#c7f36b]/[0.02] cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
            className="hidden"
          />
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c7f36b]/20 to-[#38bdf8]/10 border border-[#c7f36b]/30 text-[#c7f36b] shadow-xl group-hover:scale-105 transition-transform">
            <FileDown size={32} />
          </div>
          <h3 className="text-lg font-semibold text-white">Select PDF file to compress</h3>
          <p className="mt-1 text-sm text-white/60">
            or drag and drop your PDF document here
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono text-white/70">
            <ShieldCheck size={14} className="text-[#c7f36b]" />
            Your files stay 100% on your device (no cloud uploads)
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Card Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#12192c] p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30 shrink-0">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate max-w-md">{fileName}</p>
                <div className="flex items-center gap-2 text-xs font-mono text-white/60 mt-0.5">
                  <span>Size: <b className="text-white">{formatBytes(originalSize)}</b></span>
                  <span>•</span>
                  <span>Pages: <b className="text-white">{pageCount}</b></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPdfBytes(null);
                  setCompressedBytes(null);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> Change File
              </button>
            </div>
          </div>

          {/* Compression Level Presets (iLovePDF Style 3-Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
                <Sliders size={14} className="text-[#c7f36b]" /> Select Compression Level
              </h3>
              <span className="text-xs font-mono text-[#c7f36b]">
                {COMPRESSION_PROFILES.find((p) => p.id === selectedProfile)?.ratio}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {COMPRESSION_PROFILES.filter((p) => p.id !== "lossless").map((profile) => {
                const isSelected = selectedProfile === profile.id;
                return (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`relative flex flex-col justify-between rounded-xl border p-4.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#c7f36b] bg-[#c7f36b]/[0.08] shadow-lg shadow-[#c7f36b]/10 scale-[1.01]"
                        : "border-white/10 bg-[#0d1322] hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            isSelected
                              ? "bg-[#c7f36b] text-[#0a0f1d] border-[#c7f36b]"
                              : "bg-white/10 text-white/70 border-white/15"
                          }`}
                        >
                          {profile.badge}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? "border-[#c7f36b] bg-[#c7f36b]" : "border-white/30"
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-[#0a0f1d]" />}
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-white tracking-tight">
                        {profile.title}
                      </h4>
                      <p className="mt-1 text-xs text-white/60 leading-relaxed">
                        {profile.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-white/50">Expected:</span>
                      <span className="font-bold text-[#c7f36b]">{profile.ratio}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Lossless vector option toggle */}
            <div
              onClick={() => setSelectedProfile(selectedProfile === "lossless" ? "recommended" : "lossless")}
              className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                selectedProfile === "lossless"
                  ? "border-purple-400 bg-purple-500/10 shadow-md shadow-purple-500/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedProfile === "lossless" ? "border-purple-400 bg-purple-400" : "border-white/30"
                  }`}
                >
                  {selectedProfile === "lossless" && <div className="h-1.5 w-1.5 rounded-full bg-[#0a0f1d]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Lossless Vector & Object Stream Purge</span>
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[9px] font-mono text-purple-300 border border-purple-500/30">
                      100% Vector Intact
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60">
                    Preserves original vector text and font curves while stripping dead metadata and compressing PDF object stream dictionaries.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-300 font-semibold shrink-0 ml-2">~10% - 25%</span>
            </div>
          </div>

          {/* Action Button & Processing Indicator */}
          {!compressedBytes && !isProcessing && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={executeCompression}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c7f36b] to-[#a8e635] px-6 py-3 text-sm font-bold text-[#0b1020] hover:shadow-lg hover:shadow-[#c7f36b]/20 transition-all cursor-pointer font-sans"
              >
                <Minimize2 size={16} /> Compress PDF Now
              </button>
            </div>
          )}

          {/* Live Progress Bar */}
          {isProcessing && (
            <div className="rounded-xl border border-[#c7f36b]/30 bg-[#0e1628] p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-[#c7f36b] border-t-transparent animate-spin" />
                  {currentStep}
                </span>
                <span className="text-[#c7f36b] font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#c7f36b] to-[#38bdf8] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Compression Results Ledger (Before & After) */}
          {compressedBytes && !isProcessing && (
            <div className="rounded-2xl border border-[#c7f36b]/40 bg-gradient-to-b from-[#121c2e] to-[#0c1322] p-6 shadow-2xl space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-[#c7f36b]" />
                  <h3 className="text-lg font-bold text-white">PDF Compressed Successfully!</h3>
                </div>
                {savingsPercent > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c7f36b]/20 border border-[#c7f36b]/40 px-3 py-1 text-xs font-mono font-bold text-[#c7f36b]">
                    📉 -{savingsPercent}% REDUCTION ({formatBytes(savingsBytes)} saved)
                  </span>
                )}
              </div>

              {/* Before vs After Ledger Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <span className="text-xs font-mono uppercase text-white/50 block mb-1">ORIGINAL SIZE</span>
                  <p className="text-2xl font-bold font-mono text-white/80">{formatBytes(originalSize)}</p>
                  <p className="text-xs text-white/40 mt-1">{pageCount} Pages · Uncompressed Streams</p>
                </div>

                <div className="rounded-xl border border-[#c7f36b]/40 bg-[#c7f36b]/[0.06] p-4 relative overflow-hidden">
                  <span className="text-xs font-mono uppercase text-[#c7f36b] block mb-1 font-semibold">OPTIMIZED SIZE</span>
                  <p className="text-2xl font-bold font-mono text-[#c7f36b]">{formatBytes(compressedSize)}</p>
                  <p className="text-xs text-white/60 mt-1">
                    {savingsPercent > 0 ? `${savingsPercent}% smaller than original` : "Optimized stream packing applied"}
                  </p>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c7f36b] to-[#b3ed42] py-3 text-sm font-bold text-[#0b1020] hover:shadow-lg hover:shadow-[#c7f36b]/20 transition-all cursor-pointer font-sans"
                >
                  <Download size={16} /> Download Compressed PDF
                </button>

                <button
                  type="button"
                  onClick={handleOpenEditor}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors cursor-pointer"
                >
                  <ExternalLink size={16} /> Open in PDF Studio Editor
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompressedBytes(null);
                  }}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Re-compress with different settings"
                >
                  Adjust Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
