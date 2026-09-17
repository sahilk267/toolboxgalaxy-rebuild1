import { useState } from "react";
import { PDFDocument } from "pdf-lib";
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

  // Split state
  const [splitFile, setSplitFile] = useState<PdfFileItem | null>(null);
  const [pageRange, setPageRange] = useState<string>("1");
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitDone, setSplitDone] = useState(false);

  // Merge File handlers
  const handleAddMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;

    const newItems: PdfFileItem[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i];
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const doc = await PDFDocument.load(bytes);
        newItems.push({
          id: `${Date.now()}-${i}-${Math.random()}`,
          name: file.name,
          size: file.size,
          pageCount: doc.getPageCount(),
          bytes,
        });
      } catch (err) {
        console.warn("Skipping invalid PDF:", file.name);
      }
    }
    setFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const executeMerge = async () => {
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
      URL.revokeObjectURL(url);
      setMergeDone(true);
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
    if (!file) return;
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

      // Parse range string (e.g. "1-3, 5, 7-9")
      const pagesToExtract: number[] = [];
      const parts = pageRange.split(",").map((p) => p.trim());
      
      for (const part of parts) {
        if (part.includes("-")) {
          const [startStr, endStr] = part.split("-");
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
              if (!pagesToExtract.includes(i - 1)) pagesToExtract.push(i - 1);
            }
          }
        } else {
          const num = parseInt(part, 10);
          if (!isNaN(num) && num >= 1 && num <= totalPages) {
            if (!pagesToExtract.includes(num - 1)) pagesToExtract.push(num - 1);
          }
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
      URL.revokeObjectURL(url);
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
                Order your files and combine them into a single coherent document. 100% in-browser.
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
              Extract specific pages or page ranges from a document into a standalone PDF.
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
  dataUrl: string;
  bytes: Uint8Array;
}

export function ImagesToPdfTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const arrayBuffer = new Uint8Array(
          atob(result.split(",")[1])
            .split("")
            .map((c) => c.charCodeAt(0))
        );
        setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${i}-${Math.random()}`,
            name: file.name,
            type: file.type,
            dataUrl: result,
            bytes: arrayBuffer,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
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
        if (img.type === "image/png") {
          embeddedImage = await pdfDoc.embedPng(img.bytes);
        } else {
          // jpg or webp
          embeddedImage = await pdfDoc.embedJpg(img.bytes);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = 595.28; // A4 portrait
        let pageHeight = 841.89;

        if (pageSize === "letter") {
          pageWidth = 612;
          pageHeight = 792;
        } else if (pageSize === "fit") {
          pageWidth = imgWidth + margin * 2;
          pageHeight = imgHeight + margin * 2;
        }

        if (pageSize !== "fit" && orientation === "landscape") {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate aspect ratio fitting within margins
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;

        const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;

        const xPos = margin + (availableWidth - finalWidth) / 2;
        const yPos = margin + (availableHeight - finalHeight) / 2;

        page.drawImage(embeddedImage, {
          x: xPos,
          y: yPos,
          width: finalWidth,
          height: finalHeight,
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
      URL.revokeObjectURL(url);
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
                  src={img.dataUrl}
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
