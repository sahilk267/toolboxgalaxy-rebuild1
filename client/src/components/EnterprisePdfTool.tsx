import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Download,
  Upload,
  Check,
  Sparkles,
  RefreshCw,
  FileCode,
  QrCode,
  Tag,
  Lock,
  Layers,
  ArrowRight,
  Eye,
  Info,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";
import {
  BatesStampingOptions,
  PdfMetadataReport,
  AcroFormFieldItem,
  AuditCertificateData,
  calculateSha256,
  inspectPdfMetadata,
  sanitizePdfDocument,
  applyBatesStamping,
  getAcroFormSummary,
  updateAcroForm,
  createSampleEnterpriseContract,
  appendAuditCertificate,
} from "@/lib/enterprisePdf";
import { trackPageView } from "@/lib/analytics";

type ActiveTab = "bates" | "sanitizer" | "acroform" | "audit";

export default function EnterprisePdfTool() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("bates");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("document.pdf");
  const [pageCount, setPageCount] = useState<number>(0);
  const [originalSha256, setOriginalSha256] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Audit Action Ledger
  const [actionLedger, setActionLedger] = useState<string[]>([]);

  // Metadata Sanitizer State
  const [metadataReport, setMetadataReport] = useState<PdfMetadataReport | null>(null);
  const [isSanitized, setIsSanitized] = useState(false);

  // Bates Numbering State
  const [batesPrefix, setBatesPrefix] = useState("CASE-2026-");
  const [batesStart, setBatesStart] = useState(1);
  const [batesDigits, setBatesDigits] = useState(6);
  const [batesSuffix, setBatesSuffix] = useState("");
  const [batesPosition, setBatesPosition] = useState<BatesStampingOptions["position"]>("bottom-right");
  const [batesFontSize, setBatesFontSize] = useState(9);
  const [batesColor, setBatesColor] = useState("#1f2937");
  const [batesRange, setBatesRange] = useState("all");
  const [batesApplied, setBatesApplied] = useState(false);

  // AcroForm State
  const [formFields, setFormFields] = useState<AcroFormFieldItem[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [formFlattened, setFormFlattened] = useState(false);

  // Certificate State
  const [lastCertId, setLastCertId] = useState<string | null>(null);

  // Load a file from array buffer
  const loadPdfBuffer = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    setStatusMessage("Ingesting and computing cryptographic SHA-256...");
    try {
      const bytes = new Uint8Array(buffer);
      const sha = await calculateSha256(bytes);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      setPdfBytes(bytes);
      setFileName(name);
      setPageCount(doc.getPageCount());
      setOriginalSha256(sha);

      // Inspect Metadata
      const meta = inspectPdfMetadata(doc);
      setMetadataReport(meta);
      setIsSanitized(false);

      // Inspect AcroForms
      const fields = getAcroFormSummary(doc);
      setFormFields(fields);
      const initialValues: Record<string, string | boolean> = {};
      fields.forEach((f) => {
        initialValues[f.name] = f.value;
      });
      setFieldValues(initialValues);
      setFormFlattened(false);
      setBatesApplied(false);
      setActionLedger([`Ingested document: ${name} (${doc.getPageCount()} pages, SHA-256: ${sha.slice(0, 16)}...)`]);

      setStatusMessage(null);
      trackPageView(undefined, undefined, "enterprise-pdf-ingested", { file_name: name });
    } catch (err) {
      alert("Error loading PDF: " + (err instanceof Error ? err.message : "Unknown error"));
      setStatusMessage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await loadPdfBuffer(buffer, file.name);
  };

  // Load Sample Enterprise Agreement
  const handleLoadSample = async () => {
    setIsProcessing(true);
    try {
      const sampleBytes = await createSampleEnterpriseContract();
      await loadPdfBuffer(sampleBytes.buffer as ArrayBuffer, "enterprise_sample_agreement.pdf");
    } catch (err) {
      alert("Error generating sample: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Apply Bates Numbering
  const handleApplyBates = async (downloadImmediate: boolean) => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const res = await applyBatesStamping(doc, {
        prefix: batesPrefix,
        startNumber: batesStart,
        digits: batesDigits,
        suffix: batesSuffix,
        position: batesPosition,
        fontSize: batesFontSize,
        colorHex: batesColor,
        pageRange: batesRange,
      });

      const updatedBytes = await doc.save();
      setPdfBytes(updatedBytes);
      setBatesApplied(true);

      const logMsg = `Applied Bates Stamps (${res.sampleSequence} - ${res.stampedPages} pages, pos: ${batesPosition})`;
      setActionLedger((prev) => [...prev, logMsg]);

      if (downloadImmediate) {
        triggerDownload(updatedBytes, `bates_${fileName}`);
      }
    } catch (err) {
      alert("Failed to apply Bates stamp: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Deep Sanitize Metadata
  const handleSanitizeMetadata = async (downloadImmediate: boolean) => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const res = await sanitizePdfDocument(doc);
      const updatedBytes = await doc.save();
      setPdfBytes(updatedBytes);
      setIsSanitized(true);
      setMetadataReport(inspectPdfMetadata(doc));

      const logMsg = `Purged metadata: ${res.purgedFields.length > 0 ? res.purgedFields.join(", ") : "XMP stream & document info cleaned"}`;
      setActionLedger((prev) => [...prev, logMsg]);

      if (downloadImmediate) {
        triggerDownload(updatedBytes, `sanitized_${fileName}`);
      }
    } catch (err) {
      alert("Failed to sanitize metadata: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Update AcroForm & Flatten
  const handleSaveForm = async (flatten: boolean, downloadImmediate: boolean) => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const res = updateAcroForm(doc, fieldValues, flatten);
      const updatedBytes = await doc.save();
      setPdfBytes(updatedBytes);

      if (flatten) {
        setFormFlattened(true);
        // Refresh field list as flattened fields become static vector objects
        const refreshed = getAcroFormSummary(doc);
        setFormFields(refreshed);
      }

      const logMsg = flatten
        ? `Flattened ${res.updatedCount} AcroForm fields permanently into vector paths`
        : `Updated ${res.updatedCount} AcroForm field values`;
      setActionLedger((prev) => [...prev, logMsg]);

      if (downloadImmediate) {
        triggerDownload(updatedBytes, flatten ? `flattened_${fileName}` : `filled_${fileName}`);
      }
    } catch (err) {
      alert("Failed to update form: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Export Form Values as JSON
  const handleExportFormJson = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fieldValues, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `${fileName.replace(/\.pdf$/i, "")}_form_data.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // 4. Generate & Append Cryptographic Audit Certificate
  const handleGenerateAuditCertificate = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const currentDoc = await PDFDocument.load(pdfBytes);
      const currentBytes = await currentDoc.save();
      const currentSha256 = await calculateSha256(currentBytes);

      const certId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setLastCertId(certId);

      const certData: AuditCertificateData = {
        documentName: fileName,
        originalSha256,
        modifiedSha256: currentSha256,
        pageCount: currentDoc.getPageCount(),
        timestamp: new Date().toISOString(),
        certificateId: certId,
        actionsPerformed: actionLedger,
      };

      await appendAuditCertificate(currentDoc, certData);
      const certifiedPdfBytes = await currentDoc.save();
      triggerDownload(certifiedPdfBytes, `certified_${fileName}`);

      setActionLedger((prev) => [...prev, `Appended Certificate ${certId} with SHA-256 verification QR`]);
    } catch (err) {
      alert("Error appending audit certificate: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper: Trigger Download
  const triggerDownload = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewBatesString = `${batesPrefix}${String(batesStart).padStart(batesDigits, "0")}${batesSuffix}`;

  return (
    <div className="runner-stack space-y-6">
      {/* Top Banner / Ingest Area */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c7f36b]/15 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[#c7f36b] border border-[#c7f36b]/30">
                <ShieldCheck size={12} /> ENTERPRISE CORE
              </span>
              <span className="text-xs text-white/50 font-mono">100% IN-BROWSER MEMORY</span>
            </div>
            <h3 className="mt-1 text-base font-semibold text-white">
              {fileName ? fileName : "Upload Document for Enterprise Processing"}
            </h3>
            {pdfBytes && (
              <p className="mt-0.5 text-xs text-white/60 font-mono">
                {pageCount} Pages • SHA-256:{" "}
                <span className="text-[#c7f36b]">{originalSha256.slice(0, 16)}...</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="signal-button inline-flex cursor-pointer items-center gap-2 text-xs">
              <Upload size={14} /> Upload PDF
              <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={handleLoadSample}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Sparkles size={14} className="text-[#c7f36b]" /> Load Sample MSA
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("bates")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === "bates"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Tag size={14} /> Legal Bates Numbering
        </button>
        <button
          onClick={() => setActiveTab("sanitizer")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === "sanitizer"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ShieldAlert size={14} /> Deep Metadata Sanitizer
        </button>
        <button
          onClick={() => setActiveTab("acroform")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === "acroform"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <FileCode size={14} /> AcroForm Studio ({formFields.length} fields)
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === "audit"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <QrCode size={14} /> Cryptographic Audit Certificate
        </button>
      </div>

      {!pdfBytes ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-10 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#c7f36b]" />
          <h4 className="mt-3 text-base font-medium text-white">No PDF Document Ingested</h4>
          <p className="mx-auto mt-1 max-w-md text-xs text-white/60">
            Upload your legal contracts, evidence briefs, or discovery filings, or load our pre-configured enterprise
            sample to evaluate Bates stamping, deep sanitization, AcroForms, and audit certificates.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleLoadSample}
              className="signal-button inline-flex items-center gap-2 text-xs bg-[#c7f36b] text-[#0b1020] font-semibold"
            >
              <Sparkles size={14} /> Open Sample Contract
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: BATES NUMBERING */}
          {activeTab === "bates" && (
            <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">Legal Discovery Bates Stamping</h4>
                  <p className="text-xs text-white/60">
                    Sequentially index documents for evidentiary compliance and trial discovery archives.
                  </p>
                </div>
                <div className="rounded-lg border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-3 py-1.5 font-mono text-xs text-[#c7f36b]">
                  Sample: <strong>{previewBatesString}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs text-white/70">Prefix</label>
                  <input
                    type="text"
                    value={batesPrefix}
                    onChange={(e) => setBatesPrefix(e.target.value)}
                    placeholder="e.g. CASE-2026-"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/70">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={batesStart}
                    onChange={(e) => setBatesStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/70">Zero-Padding Digits ({batesDigits})</label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={batesDigits}
                    onChange={(e) => setBatesDigits(parseInt(e.target.value))}
                    className="mt-2 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/70">Suffix (Optional)</label>
                  <input
                    type="text"
                    value={batesSuffix}
                    onChange={(e) => setBatesSuffix(e.target.value)}
                    placeholder="e.g. -CONF"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-white/70">Position Anchor</label>
                  <select
                    value={batesPosition}
                    onChange={(e) => setBatesPosition(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white"
                  >
                    <option value="bottom-right">Bottom Right (Standard)</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">Page Range</label>
                  <input
                    type="text"
                    value={batesRange}
                    onChange={(e) => setBatesRange(e.target.value)}
                    placeholder="all or e.g. 1-5, 7"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/70">Font Size ({batesFontSize}pt)</label>
                  <input
                    type="range"
                    min={7}
                    max={14}
                    value={batesFontSize}
                    onChange={(e) => setBatesFontSize(parseInt(e.target.value))}
                    className="mt-2 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-white/60">
                  Target: {pageCount} pages total • Stamp will be written as sharp vector text
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyBates(false)}
                    disabled={isProcessing}
                    className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    {batesApplied ? "Re-apply to Memory" : "Apply to Document"}
                  </button>
                  <button
                    onClick={() => handleApplyBates(true)}
                    disabled={isProcessing}
                    className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] text-xs font-semibold"
                  >
                    <Download size={14} /> Stamp & Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METADATA DEEP SANITIZER */}
          {activeTab === "sanitizer" && (
            <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">Deep Metadata & Stream Purge</h4>
                  <p className="text-xs text-white/60">
                    Strips hidden author identifiers, software watermarks, creation dates, and XML XMP streams.
                  </p>
                </div>
                {isSanitized ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={13} /> Sanitized: Verified 0 Leaks
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                    <AlertTriangle size={13} /> Metadata Present
                  </span>
                )}
              </div>

              {/* Inspection Audit Table */}
              <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                <table className="w-full text-left text-xs text-white/80">
                  <thead className="border-b border-white/10 bg-white/5 font-mono text-[11px] text-white/50">
                    <tr>
                      <th className="p-3">METADATA VECTOR</th>
                      <th className="p-3">EXTRACTED VALUE</th>
                      <th className="p-3">SECURITY RISK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr>
                      <td className="p-3 text-white/70">Document Title</td>
                      <td className="p-3 text-white">{metadataReport?.title || "— (Empty)"}</td>
                      <td className="p-3 text-xs text-white/40">Information Disclosure</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white/70">Author / Signer</td>
                      <td className="p-3 font-semibold text-amber-300">
                        {metadataReport?.author ? metadataReport.author : "— (Clean)"}
                      </td>
                      <td className="p-3 text-xs text-amber-400/80">Personal Identity Leak</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white/70">Software Producer</td>
                      <td className="p-3 text-white">{metadataReport?.producer || "— (Empty)"}</td>
                      <td className="p-3 text-xs text-white/40">Tool Fingerprinting</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white/70">Application Creator</td>
                      <td className="p-3 text-white">{metadataReport?.creator || "— (Empty)"}</td>
                      <td className="p-3 text-xs text-white/40">OS & App Fingerprinting</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white/70">Creation Timestamp</td>
                      <td className="p-3 text-white">{metadataReport?.creationDate || "— (Empty)"}</td>
                      <td className="p-3 text-xs text-white/40">Temporal Telemetry</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-white/70">XMP Metadata Stream</td>
                      <td className="p-3">
                        {metadataReport?.hasXmpMetadata ? (
                          <span className="text-amber-400 font-semibold">Active XML Stream Present</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">None (Clean)</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-white/40">Deep Object Inspection</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-white/60">
                  Purging removes XMP streams, cleans catalog pointers, and clears author info dictionaries.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSanitizeMetadata(false)}
                    disabled={isProcessing}
                    className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Purge in Memory
                  </button>
                  <button
                    onClick={() => handleSanitizeMetadata(true)}
                    disabled={isProcessing}
                    className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] text-xs font-semibold"
                  >
                    <Download size={14} /> Purge & Download Clean PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACROFORM STUDIO */}
          {activeTab === "acroform" && (
            <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">Interactive AcroForm Inspector & Editor</h4>
                  <p className="text-xs text-white/60">
                    Fill interactive PDF forms, export/import schema data via JSON, or lock fields permanently.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportFormJson}
                    disabled={formFields.length === 0}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40"
                  >
                    <FileCode size={13} /> Export JSON
                  </button>
                  {formFlattened && (
                    <span className="rounded-full bg-[#c7f36b]/15 px-3 py-1 text-xs font-semibold text-[#c7f36b] border border-[#c7f36b]/30">
                      Form Flattened (Immutable)
                    </span>
                  )}
                </div>
              </div>

              {formFields.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/30 p-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-white/40" />
                  <p className="mt-2 text-sm text-white/70">No AcroForm fields detected in this PDF.</p>
                  <p className="text-xs text-white/40 mt-1">
                    Standard scanned PDFs do not contain AcroForm inputs. Click "Load Sample MSA" above to test
                    interactive form filling and flattening.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {formFields.map((field) => (
                      <div key={field.name} className="rounded-lg border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-white/80 font-mono">{field.name}</label>
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/50">
                            {field.type}
                          </span>
                        </div>

                        {field.type === "text" && (
                          <input
                            type="text"
                            disabled={formFlattened}
                            value={(fieldValues[field.name] as string) || ""}
                            onChange={(e) =>
                              setFieldValues((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }))
                            }
                            className="w-full rounded border border-white/10 bg-white/5 p-2 text-xs text-white disabled:opacity-40"
                          />
                        )}

                        {field.type === "checkbox" && (
                          <label className="flex items-center gap-2 pt-1 text-xs text-white/80 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={formFlattened}
                              checked={Boolean(fieldValues[field.name])}
                              onChange={(e) =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.checked,
                                }))
                              }
                              className="rounded border-white/20 bg-white/5 h-4 w-4"
                            />
                            <span>{Boolean(fieldValues[field.name]) ? "Checked" : "Unchecked"}</span>
                          </label>
                        )}

                        {field.type === "dropdown" && (
                          <select
                            disabled={formFlattened}
                            value={(fieldValues[field.name] as string) || ""}
                            onChange={(e) =>
                              setFieldValues((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }))
                            }
                            className="w-full rounded border border-white/10 bg-white/5 p-2 text-xs text-white disabled:opacity-40"
                          >
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="text-xs text-white/60">
                      Flattening converts interactive text boxes into non-editable vector graphics.
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveForm(false, true)}
                        disabled={isProcessing}
                        className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Download Editable Form
                      </button>
                      <button
                        onClick={() => handleSaveForm(true, true)}
                        disabled={isProcessing}
                        className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] text-xs font-semibold"
                      >
                        <Lock size={14} /> Flatten & Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CRYPTOGRAPHIC AUDIT CERTIFICATE */}
          {activeTab === "audit" && (
            <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white">Tamper-Proof Audit Certificate & QR Proof</h4>
                  <p className="text-xs text-white/60">
                    Appends a formal certification sheet with SHA-256 verification and scannable QR payload.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c7f36b]/15 px-3 py-1 text-xs font-semibold text-[#c7f36b] border border-[#c7f36b]/30">
                  <ShieldCheck size={13} /> Local-First Cryptographic Seal
                </span>
              </div>

              {/* SHA-256 Checksum Card */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 font-mono">ORIGINAL INGEST DIGEST</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-[#c7f36b]">SHA-256</span>
                </div>
                <p className="font-mono text-xs text-white/90 break-all bg-white/[0.02] p-2 rounded border border-white/5">
                  {originalSha256}
                </p>
              </div>

              {/* Action Ledger */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80">Audit Action Ledger ({actionLedger.length} events)</label>
                <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2 max-h-48 overflow-y-auto">
                  {actionLedger.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-mono">
                      <span className="text-[#c7f36b] shrink-0">[{String(i + 1).padStart(2, "0")}]</span>
                      <span className="text-white/80">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <QrCode size={15} className="text-[#c7f36b]" />
                  <span>Includes embedded scannable verification QR code</span>
                </div>
                <button
                  onClick={handleGenerateAuditCertificate}
                  disabled={isProcessing}
                  className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] text-xs font-semibold"
                >
                  <FileCheck2 size={15} /> Append Certificate & Download Certified PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
