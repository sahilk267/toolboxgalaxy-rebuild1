import { useState } from "react";
import mammoth from "mammoth";
import DOMPurify from "dompurify";
import {
  FileText,
  Download,
  Copy,
  Check,
  Upload,
  Eye,
  FileCode,
  BookOpen,
  Sparkles,
  BarChart2
} from "lucide-react";

export default function WordDocxTool() {
  const [activeTab, setActiveTab] = useState<"convert" | "generate">("convert");
  
  // Convert state
  const [fileName, setFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Generate docx state
  const [docTitle, setDocTitle] = useState<string>("Executive Summary Report");
  const [docBody, setDocBody] = useState<string>(
`# Project Overview & Strategy

## Objectives
1. Build local-first, zero-server document tools for modern web browsers.
2. Deliver high privacy with zero external telemetry.
3. Optimize for low-cost shared web hosting environments.

## Implementation Details
All document manipulation executes in the client runtime. Memory is isolated to the active browser tab.

- Performance: Instantaneous execution
- Cost: Zero server computing costs
- Security: User data remains 100% private`
  );

  const loadSampleDocx = async () => {
    const sampleHtml = `
      <h1>Toolbox Galaxy Document Report</h1>
      <p>This is a demonstration of <strong>Word (.docx)</strong> parsing entirely in the browser using WebAssembly and pure client-side parsers.</p>
      <h2>Key Functional Highlights</h2>
      <ul>
        <li>Client-side Markdown generation</li>
        <li>Clean semantic HTML extraction</li>
        <li>Instant document telemetry & reading metrics</li>
      </ul>
      <h2>Architecture & Privacy</h2>
      <p>No document packets are ever transferred over network sockets. The document is converted entirely in isolated memory.</p>
    `;
    const sampleMd = `
# Toolbox Galaxy Document Report

This is a demonstration of **Word (.docx)** parsing entirely in the browser using WebAssembly and pure client-side parsers.

## Key Functional Highlights
- Client-side Markdown generation
- Clean semantic HTML extraction
- Instant document telemetry & reading metrics

## Architecture & Privacy
No document packets are ever transferred over network sockets. The document is converted entirely in isolated memory.
    `.trim();

    setFileName("sample_executive_brief.docx");
    setHtmlContent(sampleHtml);
    setMarkdownContent(sampleMd);
    setRawText(sampleMd.replace(/[#*_-]/g, ""));
    setMessages([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract HTML
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(htmlResult.value);
      setMessages(htmlResult.messages.map((m) => `${m.type}: ${m.message}`));

      // Extract Raw Text
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      setRawText(textResult.value);

      // Convert HTML roughly to clean Markdown
      let md = htmlResult.value
        .replace(/<h1>(.*?)<\/h1>/gi, "\n# $1\n")
        .replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n")
        .replace(/<h3>(.*?)<\/h3>/gi, "\n### $1\n")
        .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i>(.*?)<\/i>/gi, "*$1*")
        .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<ul>/gi, "\n")
        .replace(/<\/ul>/gi, "\n")
        .replace(/<ol>/gi, "\n")
        .replace(/<\/ol>/gi, "\n")
        .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<br\s*[\/]?>/gi, "\n")
        .replace(/<[^>]+>/g, ""); // strip remaining tags

      setMarkdownContent(md.trim());
      setFileName(file.name);
    } catch (err) {
      alert("Error parsing Word (.docx) file. Please ensure it is a valid .docx document.");
    }
  };

  // Text Stats
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const charCount = rawText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const downloadTextFile = (content: string, ext: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName ? fileName.replace(/\.[^/.]+$/, "") : "document") + `.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate basic HTML-based doc file for MS Word
  const generateWordDoc = () => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${docTitle}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }
          h1 { font-size: 18pt; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
          h2 { font-size: 14pt; color: #1e40af; margin-top: 18px; }
          p { margin: 8px 0; }
          ul, ol { margin: 8px 0; padding-left: 24px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        ${docBody
          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
          .replace(/^### (.*$)/gim, "<h3>$1</h3>")
          .replace(/^\- (.*$)/gim, "<li>$1</li>")
          .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
          .replace(/\n\n/gim, "<p></p>")
          .replace(/\n/gim, "<br/>")}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="runner-stack space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("convert")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "convert"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          <BookOpen size={16} /> Word (.docx) to Markdown / HTML
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "bg-[#c7f36b] text-[#0b1020]"
              : "bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          <FileCode size={16} /> Markdown / Text to Word Document
        </button>
      </div>

      {activeTab === "convert" && (
        <>
          {!htmlContent ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-[#c7f36b]" />
              <h3 className="mt-4 text-xl font-semibold text-white">Word (.docx) Converter & Inspector</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
                Extract clean Markdown, HTML, and reading telemetry from Microsoft Word (.docx) documents in your browser.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <label className="signal-button inline-flex cursor-pointer items-center gap-2">
                  <Upload size={16} />
                  Choose Word (.docx) File
                  <input
                    type="file"
                    accept=".docx, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button onClick={loadSampleDocx} className="reset-button inline-flex items-center gap-2">
                  <Sparkles size={16} />
                  Load Sample Document
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Telemetry bar */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <span className="text-[11px] text-white/50 uppercase font-mono">Word Count</span>
                  <p className="text-xl font-bold text-[#c7f36b]">{wordCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <span className="text-[11px] text-white/50 uppercase font-mono">Characters</span>
                  <p className="text-xl font-bold text-white">{charCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <span className="text-[11px] text-white/50 uppercase font-mono">Reading Time</span>
                  <p className="text-xl font-bold text-white">{readingTime} min</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <span className="text-[11px] text-white/50 uppercase font-mono">File Name</span>
                  <p className="truncate text-xs font-mono text-white/90 pt-1">{fileName}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(markdownContent, "md")}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                  >
                    {copiedFormat === "md" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedFormat === "md" ? "Copied Markdown" : "Copy Markdown"}
                  </button>
                  <button
                    onClick={() => copyToClipboard(htmlContent, "html")}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                  >
                    {copiedFormat === "html" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedFormat === "html" ? "Copied HTML" : "Copy HTML"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadTextFile(markdownContent, "md")}
                    className="signal-button flex items-center gap-1.5 bg-[#c7f36b] text-[#0b1020] text-xs font-semibold"
                  >
                    <Download size={14} /> Download .md
                  </button>
                  <button
                    onClick={() => downloadTextFile(htmlContent, "html")}
                    className="reset-button flex items-center gap-1.5 text-xs"
                  >
                    <Download size={14} /> Download .html
                  </button>
                </div>
              </div>

              {/* Converted Views */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Markdown View */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-white/70">CLEAN MARKDOWN OUTPUT</span>
                  <textarea
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    rows={14}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/90"
                  />
                </div>

                {/* HTML Visual Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-white/70">DOCUMENT PREVIEW</span>
                  <div
                    className="prose prose-invert max-h-[310px] overflow-y-auto rounded-xl border border-white/10 bg-[#161a29] p-4 text-xs text-white/90"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "generate" && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <h3 className="text-base font-semibold text-white">Generate Word Document</h3>
            <p className="text-xs text-white/60">
              Type or paste Markdown content to compile and download a formatted Word document (.doc / .docx compatible).
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/70">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/70">Document Content (Markdown / Text)</label>
              <textarea
                value={docBody}
                onChange={(e) => setDocBody(e.target.value)}
                rows={10}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={generateWordDoc}
              className="signal-button flex items-center gap-2 bg-[#c7f36b] text-[#0b1020] font-semibold"
            >
              <Download size={16} /> Compile & Download Word Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
