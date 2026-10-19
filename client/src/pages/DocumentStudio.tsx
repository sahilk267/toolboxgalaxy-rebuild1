import { useState } from "react";
import AppShell from "@/components/AppShell";
import PdfEditorTool from "@/components/PdfEditorTool";
import PdfCompressTool from "@/components/PdfCompressTool";
import EnterprisePdfTool from "@/components/EnterprisePdfTool";
import { ImagesToPdfTool, PdfMergeSplitTool } from "@/components/PdfToolsRunner";
import ExcelStudioTool from "@/components/ExcelStudioTool";
import WordDocxTool from "@/components/WordDocxTool";
import {
  FileText,
  Minimize2,
  Layers,
  Image,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  Tag
} from "lucide-react";

type StudioModule = "editor" | "compress" | "enterprise" | "merge-split" | "images-to-pdf" | "excel" | "docx";

interface ModuleConfig {
  id: StudioModule;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  icon: any;
}

const modules: ModuleConfig[] = [
  {
    id: "editor",
    title: "PDF Visual & Enterprise Studio",
    shortTitle: "Visual Studio",
    badge: "Interactive Canvas & Bates",
    description: "Live Bates numbering preview, permanent pixel redactions, deep metadata purge, visual signatures & SHA-256 audit certs.",
    icon: FileText,
  },
  {
    id: "compress",
    title: "PDF Compressor & Optimizer",
    shortTitle: "Compress PDF",
    badge: "Up to -80%",
    description: "Compress and reduce PDF file size with 3 iLovePDF quality presets or lossless stream purge in browser memory.",
    icon: Minimize2,
  },
  {
    id: "enterprise",
    title: "Enterprise PDF Suite (Legal & Audit)",
    shortTitle: "Enterprise Suite",
    badge: "Audit & Bates",
    description: "Legal Bates numbering, deep metadata purge, AcroForm editor/flattening, and SHA-256 audit certificates.",
    icon: ShieldCheck,
  },
  {
    id: "merge-split",
    title: "PDF Merge & Page Splitter",
    shortTitle: "Merge & Split",
    badge: "Multi-file",
    description: "Combine multiple PDF documents or extract custom page ranges in browser memory.",
    icon: Layers,
  },
  {
    id: "images-to-pdf",
    title: "Images to PDF Converter",
    shortTitle: "Images to PDF",
    badge: "Batch",
    description: "Convert JPG, PNG, and WebP photos/receipts into standardized printable PDFs.",
    icon: Image,
  },
  {
    id: "excel",
    title: "Excel & Spreadsheet Studio",
    shortTitle: "Excel & Sheets",
    badge: "XLSX / CSV",
    description: "Inspect multi-sheet workbooks, deduplicate rows, trim whitespace, and export to CSV/JSON/Table.",
    icon: FileSpreadsheet,
  },
  {
    id: "docx",
    title: "Word (.docx) Converter & Generator",
    shortTitle: "Word (.docx)",
    badge: "Markdown & Doc",
    description: "Extract clean Markdown/HTML and reading stats from DOCX files, or compile Markdown to Word.",
    icon: FileCode,
  },
];

export default function DocumentStudio() {
  const [activeModule, setActiveModule] = useState<StudioModule>("editor");
  const [sharedPdfBytes, setSharedPdfBytes] = useState<Uint8Array | null>(null);
  const [sharedFileName, setSharedFileName] = useState<string>("document.pdf");

  const currentModuleConfig = modules.find((m) => m.id === activeModule)!;

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Studio Header Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#12182c] via-[#0e1424] to-[#0b1020] p-6 lg:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 items-center gap-1.5 rounded-full bg-[#c7f36b]/15 px-3 text-xs font-mono font-semibold text-[#c7f36b] border border-[#c7f36b]/30">
                  <ShieldCheck size={14} /> 100% PRIVATE CLIENT-SIDE SUITE
                </span>
                <span className="hidden sm:flex h-7 items-center gap-1 rounded-full bg-white/5 px-2.5 text-xs font-mono text-white/70 border border-white/10">
                  <Zap size={13} className="text-[#c7f36b]" /> ZERO SERVER MEMORY
                </span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                PDF & Office Document Studio
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                All-in-one privacy-first document workstation. Fill forms, redact confidential details, merge, split, clean spreadsheets, and convert Word documents directly inside your browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/80">
                <Lock size={15} className="text-[#c7f36b]" />
                <div>
                  <p className="font-semibold text-white">Zero Cloud Uploads</p>
                  <p className="text-[11px] text-white/50">Files never leave this device</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Studio Module Switcher Bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {modules.map((m) => {
            const Icon = m.icon;
            const isSelected = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`group relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-[#c7f36b] bg-[#c7f36b]/10 text-white shadow-lg shadow-[#c7f36b]/5"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-[#c7f36b] text-[#0b1020]"
                        : "bg-white/5 text-white/80 group-hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`rounded text-[10px] font-mono px-1.5 py-0.5 ${
                      isSelected
                        ? "bg-[#c7f36b]/20 text-[#c7f36b]"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <div className="mt-2.5">
                  <p className={`text-sm font-semibold ${isSelected ? "text-[#c7f36b]" : "text-white"}`}>
                    {m.shortTitle}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-white/50">{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Active Workspace Container */}
        <div className="rounded-2xl border border-white/10 bg-[#0e1424]/90 p-4 sm:p-6 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">
                <currentModuleConfig.icon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{currentModuleConfig.title}</h2>
                <p className="text-xs text-white/60">{currentModuleConfig.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-mono text-white/60 border border-white/10">
                <Sparkles size={12} className="text-[#c7f36b]" /> Active Session Memory
              </span>
            </div>
          </div>

          {/* Render Active Tool */}
          <div className="mt-2">
            {activeModule === "editor" && (
              <PdfEditorTool
                initialPdfBytes={sharedPdfBytes}
                initialFileName={sharedFileName}
                onPdfLoaded={(bytes, name) => {
                  setSharedPdfBytes(bytes);
                  setSharedFileName(name);
                }}
              />
            )}
            {activeModule === "compress" && (
              <PdfCompressTool
                initialPdfBytes={sharedPdfBytes}
                initialFileName={sharedFileName}
                onOpenInEditor={(bytes, name) => {
                  setSharedPdfBytes(bytes);
                  setSharedFileName(name);
                  setActiveModule("editor");
                }}
              />
            )}
            {activeModule === "enterprise" && <EnterprisePdfTool />}
            {activeModule === "merge-split" && <PdfMergeSplitTool />}
            {activeModule === "images-to-pdf" && <ImagesToPdfTool />}
            {activeModule === "excel" && <ExcelStudioTool />}
            {activeModule === "docx" && <WordDocxTool />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
