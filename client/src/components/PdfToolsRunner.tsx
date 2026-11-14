import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { trackPageView } from "@/lib/analytics";
import { imagesPdfDimensionError, imagesPdfFileError, imagesPdfPlacement } from "@/lib/imagesToPdfLayout";
import {
  FilePlus,
  Scissors,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  Check,
  Upload,
  Sparkles
} from "lucide-react";

/* -------------------------------------------------------------
 * 1. PDF MERGER & SPLITTER COMPONENT
 * -----------------------------------------------------------*/
const MAX_PDF_MERGE_FILES = 20;
const MAX_PDF_MERGE_BYTES = 100 * 1024 * 1024;
const MAX_MERGE_ITEM_BYTES = 30 * 1024 * 1024;
const MAX_SPLIT_PDF_BYTES = 50 * 1024 * 1024;

interface PdfFileItem {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  bytes: Uint8Array;
}

export function PdfMergeSplitTool() {
  const [activeTab, setActiveTab] = useState<"merge" | "split">("merge");

  // Merge state
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeDone, setMergeDone] = useState(false);
  const uploadBusyRef = useRef(false);

  // Split state
  const [splitFile, setSplitFile] = useState<PdfFileItem | null>(null);
  const [pageRange, setPageRange] = useState<string>("1");
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitDone, setSplitDone] = useState(false);

  // Merge File handlers
  const handleAddMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!selected.length || uploadBusyRef.current || isMerging) return;
    if (files.length + selected.length > MAX_PDF_MERGE_FILES) {
      alert(`You can merge up to ${MAX_PDF_MERGE_FILES} PDF files in one browser session.`);
      return;
    }
    uploadBusyRef.current = true;
    try {
      const newItems: PdfFileItem[] = [];
      const skipped: string[] = [];
      let bytesQueued = files.reduce((sum, item) => sum + item.size, 0);
      for (const [index, file] of selected.entries()) {
        if (!file.size || file.size > MAX_MERGE_ITEM_BYTES ||
            bytesQueued + file.size > MAX_PDF_MERGE_BYTES) {
          skipped.push(`${file.name} (over 30 MB per file or 100 MB combined)`);
          continue;
        }
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const pdf = await PDFDocument.load(bytes);
          newItems.push({
            id: `${Date.now()}-${index}-${Math.random()}`,
            name: file.name,
            size: file.size,
            pageCount: pdf.getPageCount(),
            bytes,
          });
          bytesQueued += file.size;
        } catch {
          skipped.push(`${file.name} (invalid, encrypted or unreadable)`);
        }
      }
      if (newItems.length) setFiles(previous => [...previous, ...newItems]);
      if (skipped.length) alert("Skipped PDFs:\n" + skipped.join("\n"));
    } finally {
      uploadBusyRef.current = false;
    }
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    if (isMerging) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  const removeFile = (id: string) => {
    if (isMerging) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const executeMerge = async () => {
    if (isMerging) return;
    if (files.length < 2) {
      alert("Please upload at least 2 PDF files to merge.");
      return;
    }
    setIsMerging(true);
    try {
      const mergedDoc = await PDFDocument.create();
      for (const item of files) {
        const doc = await PDFDocument.load(item.bytes);
        const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const mergedBytes = await mergedDoc.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged_galaxy_document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
      setMergeDone(true);
      trackPageView(undefined, undefined, "pdf-merged", {
        file_count: files.length,
        tool_slug: "pdf-merge-split",
      });
      setTimeout(() => setMergeDone(false), 3000);
    } catch (err) {
      alert("Error merging documents: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsMerging(false);
    }
  };

  // Split File handlers
  const handleSplitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isSplitting) return;
    if (file.size <= 0 || file.size > MAX_SPLIT_PDF_BYTES) {
      alert("Choose a nonempty PDF of 50 MB or less for browser-side splitting.");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const doc = await PDFDocument.load(bytes);
      const count = doc.getPageCount();
      setSplitFile({
        id: "split-1",
        name: file.name,
        size: file.size,
        pageCount: count,
        bytes,
      });
      setPageRange(`1-${count}`);
    } catch (err) {
      alert("Invalid or encrypted PDF file.");
    }
  };

  const executeSplit = async () => {
    if (!splitFile) return;
    setIsSplitting(true);
    try {
      const sourceDoc = await PDFDocument.load(splitFile.bytes);
      const totalPages = sourceDoc.getPageCount();

      // Parse range string (e.g. "1-3, 5, 7-9") with strict validation
      const pagesToExtract: number[] = [];
      const seenPages = new Set<number>();
      const parts = pageRange.split(",").map((p) => p.trim()).filter(Boolean);

      if (parts.length === 0) {
        alert("Please enter at least one page number or range (e.g. 1-3, 5).");
        setIsSplitting(false);
        return;
      }
      
      for (const part of parts) {
        if (/^\d+$/.test(part)) {
          const num = parseInt(part, 10);
          if (num < 1 || num > totalPages) {
            alert(`Page ${num} is out of bounds. The document has pages 1 to ${totalPages}.`);
            setIsSplitting(false);
            return;
          }
          if (!seenPages.has(num - 1)) {
            seenPages.add(num - 1);
            pagesToExtract.push(num - 1);
          }
        } else if (/^\d+\s*-\s*\d+$/.test(part)) {
          const [startStr, endStr] = part.split("-").map((s) => s.trim());
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (start > end) {
            alert(`Invalid range "${part}": start page (${start}) cannot be greater than end page (${end}).`);
            setIsSplitting(false);
            return;
          }
          if (start < 1 || end > totalPages) {
            alert(`Page range "${part}" is out of bounds. The document has pages 1 to ${totalPages}.`);
            setIsSplitting(false);
            return;
          }
          for (let i = start; i <= end; i++) {
            if (!seenPages.has(i - 1)) {
              seenPages.add(i - 1);
              pagesToExtract.push(i - 1);
            }
          }
        } else {
          alert(`Malformed page token "${part}". Please provide numbers and ranges like "1-3, 5" without letters or double dashes.`);
          setIsSplitting(false);
          return;
        }
      }

      if (pagesToExtract.length === 0) {
        alert(`No valid pages selected. Document has pages 1 to ${totalPages}.`);
        setIsSplitting(false);
        return;
      }

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(sourceDoc, pagesToExtract);
      copiedPages.forEach((p) => newDoc.addPage(p));

      const newBytes = await newDoc.save();
      const blob = new Blob([newBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${splitFile.name.replace(/\.pdf$/i, "")}_extracted.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
      setSplitDone(true);
      setTimeout(() => setSplitDone(false), 3000);
    } catch (err) {
      alert("Error splitting document: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="runner-stack space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("merge")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "merge"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          <Layers size={16} /> PDF Merger (Combine)
        </button>
        <button
          onClick={() => setActiveTab("split")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "split"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          <Scissors size={16} /> PDF Split & Extractor
        </button>
      </div>

      {/* MERGE VIEW */}
      {activeTab === "merge" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Merge Multiple PDFs</h3>
              <p className="text-xs text-white/60">
                Order your files and combine them locally (up to 20 PDFs, 30 MB each, 100 MB total).
              </p>
            </div>
            <label className="signal-button inline-flex cursor-pointer items-center gap-2 text-xs">
              <FilePlus size={14} /> Add PDF Files
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleAddMergeFiles}
                className="hidden"
              />
            </label>
          </div>

          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
              <Layers className="mx-auto h-10 w-10 text-white/40" />
              <p className="mt-3 text-sm text-white/70">No PDF files queued yet.</p>
              <p className="text-xs text-white/40">Select 2 or more PDF documents to merge.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-xs font-mono text-white/70">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-white/50">
                          {file.pageCount} {file.pageCount === 1 ? "page" : "pages"} · {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveFile(idx, "up")}
                        className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        disabled={idx === files.length - 1}
                        onClick={() => moveFile(idx, "down")}
                        className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-500/10"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-white/60">
                  Total pages: {files.reduce((acc, f) => acc + f.pageCount, 0)} across {files.length} documents
                </span>
                <button
                  onClick={executeMerge}
                  disabled={isMerging || files.length < 2}
                  className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] font-semibold"
                >
                  {mergeDone ? <Check size={16} /> : <Download size={16} />}
                  {mergeDone ? "Merged & Saved!" : "Merge & Download PDF"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SPLIT VIEW */}
      {activeTab === "split" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">Extract & Split PDF Pages</h3>
            <p className="text-xs text-white/60">
              Extract pages from a PDF up to 50 MB, entirely in your browser.
            </p>
          </div>

          {!splitFile ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
              <Scissors className="mx-auto h-10 w-10 text-white/40" />
              <p className="mt-3 text-sm text-white/70">Select a PDF to extract pages from.</p>
              <label className="signal-button mt-4 inline-flex cursor-pointer items-center gap-2 text-xs">
                <Upload size={14} /> Choose PDF
                <input type="file" accept="application/pdf" onChange={handleSplitUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-sm font-medium text-white">{splitFile.name}</p>
                  <p className="text-xs text-white/50">
                    Total: {splitFile.pageCount} {splitFile.pageCount === 1 ? "page" : "pages"} · {(splitFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <label className="reset-button cursor-pointer text-xs">
                  Change PDF
                  <input type="file" accept="application/pdf" onChange={handleSplitUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/80 font-medium">Page Range to Extract</label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  className="w-full rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white font-mono placeholder-white/30"
                />
                <p className="text-[11px] text-white/50">
                  Tip: Use commas to separate individual pages and dashes for ranges (e.g. "1, 3, 5-8").
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={executeSplit}
                  disabled={isSplitting}
                  className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] font-semibold"
                >
                  {splitDone ? <Check size={16} /> : <Download size={16} />}
                  {splitDone ? "Extracted & Saved!" : "Extract & Download PDF"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * 2. IMAGES TO PDF CONVERTER COMPONENT
 * -----------------------------------------------------------*/
interface ImageItem {
  id: string;
  name: string;
  type: string;
  previewUrl: string;
  bytes: Uint8Array;
}

const MAX_IMAGES_PER_PDF = 40;
const MAX_QUEUED_IMAGE_BYTES = 100 * 1024 * 1024;

async function renderImageToPngBytes(previewUrl: string): Promise<Uint8Array> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Failed to decode image for PDF"));
    element.src = previewUrl;
  });
  const canvas = document.createElement("canvas");
  try {
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const invalid = imagesPdfDimensionError(canvas.width, canvas.height);
    if (invalid) throw new Error(invalid);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to obtain 2D canvas context");
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(value =>
        value ? resolve(value) : reject(new Error("Unable to serialize canvas to PNG")),
        "image/png"),
    );
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function ImagesToPdfTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const imageUrlsRef = useRef(new Set<string>());
  useEffect(() => () => {
    for (const url of imageUrlsRef.current) URL.revokeObjectURL(url);
    imageUrlsRef.current.clear();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0 || isGenerating) return;
    if (images.length + selected.length > MAX_IMAGES_PER_PDF) {
      alert(`Choose at most ${MAX_IMAGES_PER_PDF} images for a browser-side PDF.`);
      return;
    }
    let totalBytes = images.reduce((sum, item) => sum + item.bytes.length, 0);
    const valid: ImageItem[] = [];
    const rejected: string[] = [];
    // Sequential reads avoid many simultaneous file allocations.
    for (const [index, file] of selected.entries()) {
      const validation = imagesPdfFileError(file);
      if (validation) { rejected.push(`${file.name}: ${validation}`); continue; }
      if (totalBytes + file.size > MAX_QUEUED_IMAGE_BYTES) {
        rejected.push(`${file.name}: combined images exceed the 100 MB browser limit.`);
        continue;
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const previewUrl = URL.createObjectURL(file);
        imageUrlsRef.current.add(previewUrl);
        valid.push({
          id: `${Date.now()}-${index}-${Math.random()}`,
          name: file.name, type: file.type, previewUrl, bytes,
        });
        totalBytes += bytes.length;
      } catch (reason) {
        rejected.push(`${file.name}: ${reason instanceof Error ? reason.message : "Unable to read file"}`);
      }
    }
    if (valid.length) setImages(previous => [...previous, ...valid]);
    if (rejected.length) alert("Skipped unreadable or over-limit images:\n" + rejected.join("\n"));
  };

  const removeImage = (id: string) => {
    if (isGenerating) return;
    const discarded = images.find(item => item.id === id);
    if (discarded) {
      URL.revokeObjectURL(discarded.previewUrl);
      imageUrlsRef.current.delete(discarded.previewUrl);
    }
    setImages(previous => previous.filter(item => item.id !== id));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const img of images) {
        let embeddedImage;
        const isPng = img.type === "image/png" || img.name.toLowerCase().endsWith(".png");
        const isJpg = img.type === "image/jpeg" || img.type === "image/jpg" || /\.jpe?g$/i.test(img.name);

        if (isPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(img.bytes);
          } catch {
            const pngBytes = await renderImageToPngBytes(img.previewUrl);
            embeddedImage = await pdfDoc.embedPng(pngBytes);
          }
        } else if (isJpg) {
          try {
            embeddedImage = await pdfDoc.embedJpg(img.bytes);
          } catch {
            const pngBytes = await renderImageToPngBytes(img.previewUrl);
            embeddedImage = await pdfDoc.embedPng(pngBytes);
          }
        } else {
          // WebP, BMP, GIF, SVG, etc: render to compatible PNG bitmap
          const pngBytes = await renderImageToPngBytes(img.previewUrl);
          embeddedImage = await pdfDoc.embedPng(pngBytes);
        }

        const layout = imagesPdfPlacement(
          embeddedImage.width, embeddedImage.height, pageSize, orientation, margin,
        );
        const page = pdfDoc.addPage([layout.pageWidth, layout.pageHeight]);
        page.drawImage(embeddedImage, {
          x: layout.x,
          y: layout.y,
          width: layout.width,
          height: layout.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted_images.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (err) {
      alert("Error generating PDF: " + (err instanceof Error ? err.message : "Ensure valid JPG/PNG images"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="runner-stack space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Images to PDF Converter</h3>
          <p className="text-xs text-white/60">
            Combine JPG, PNG, and WebP images into a standardized printable PDF book or document.
          </p>
        </div>
        <label className="signal-button inline-flex cursor-pointer items-center gap-2 text-xs">
          <Upload size={14} /> Add Images
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-[#c7f36b]" />
          <p className="mt-3 text-sm text-white/80">No images added yet.</p>
          <p className="text-xs text-white/40">Upload receipts, scanned papers, photos, or diagrams.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Settings Bar */}
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] text-white/70">Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-xs text-white"
              >
                <option value="a4">Standard A4</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/70">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                disabled={pageSize === "fit"}
                className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-xs text-white disabled:opacity-40"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/70">Margins: {margin}px</label>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
          </div>

          {/* Image Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="group relative rounded-lg border border-white/10 bg-white/[0.02] p-2 text-center"
              >
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                  #{idx + 1}
                </span>
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="mx-auto h-28 w-full rounded object-contain bg-black/20"
                />
                <p className="mt-1.5 truncate text-xs text-white/80">{img.name}</p>
                <div className="mt-2 flex items-center justify-center gap-1 border-t border-white/10 pt-1.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, "up")}
                    className="rounded p-1 text-white/60 hover:bg-white/10 disabled:opacity-20"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, "down")}
                    className="rounded p-1 text-white/60 hover:bg-white/10 disabled:opacity-20"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-white/60">{images.length} images queued for PDF</span>
            <button
              onClick={generatePdf}
              disabled={isGenerating}
              className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] font-semibold"
            >
              {isDone ? <Check size={16} /> : <Download size={16} />}
              {isDone ? "PDF Downloaded!" : "Create & Download PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
