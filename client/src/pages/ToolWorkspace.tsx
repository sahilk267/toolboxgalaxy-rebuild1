// Orbital Workbench: local-only tool runners with visible validation and no legacy endpoint dependency.
import AppShell from "@/components/AppShell";
import { AgeTool, BmiTool, DateDifferenceTool, DiscountTool, GradientTool, HtmlTool, QrTool, TextCaseTool, UrlTool, UuidTool } from "@/components/AdvancedToolRunners";
import ImageResizerTool from "@/components/ImageResizerTool";
import ImageTransformTool from "@/components/ImageTransformTool";
import ImageMetadataTool from "@/components/ImageMetadataTool";
import { LineSorterTool } from "@/components/LineToolRunner";
import { FaviconGeneratorTool, HashGeneratorTool, PasswordStrengthTool } from "@/components/LocalSecurityTools";
import { ContrastCheckerTool, MarkdownWorkspaceTool } from "@/components/ContentTools";
import { BusinessDaysTool, FindReplaceTool, LoanEmiTool, SplitBillTool, TextDiffTool, TimeZonePlannerTool, TimestampConverterTool, WorkShiftTool } from "@/components/DailyToolRunners";
import { CsvViewerCleanerTool, JsonCsvConverterTool } from "@/components/StructuredDataRunners";
import PdfEditorTool from "@/components/PdfEditorTool";
import { ImagesToPdfTool, PdfMergeSplitTool } from "@/components/PdfToolsRunner";
import ExcelStudioTool from "@/components/ExcelStudioTool";
import WordDocxTool from "@/components/WordDocxTool";
import JsonToZodTool from "@/components/JsonToZodTool";
import TrackingUrlCleanerTool from "@/components/TrackingUrlCleanerTool";
import JwtDebuggerTool from "@/components/JwtDebuggerTool";
import CronScheduleTool from "@/components/CronScheduleTool";
import RegexTesterTool from "@/components/RegexTesterTool";
import CurlToCodeTool from "@/components/CurlToCodeTool";
import {
  LoremIpsumTool,
  RandomNumberTool,
  SeoMetaTool,
  UsernameGeneratorTool,
  OgImageBuilderTool,
  FakeDataGeneratorTool,
} from "@/components/GenerativeToolRunners";
import { 
  GstCalculatorTool, 
  LandAreaConverterTool, 
  NumberToWordsTool, 
  PassportPhotoResizerTool, 
  WhatsappDirectTool 
} from "@/components/RegionalHighDemandTools";
import FavoriteToolButton from "@/components/FavoriteToolButton";
import ShareToolButton from "@/components/ShareToolButton";
import { getTool } from "@/data/toolRegistry";
import { recordToolVisit } from "@/lib/recentToolHistory";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Clipboard, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { cleanUserName } from "@shared/userParam";

const toolTelemetry = {
  splitBill: ["ALLOCATION MATRIX", "GROUP INPUT / LIVE"], loanEmi: ["PAYMENT PROJECTION", "FIXED-RATE ESTIMATE"], workShift: ["TIME LEDGER", "SHIFT WINDOW / LIVE"], imageTransform: ["FRAME CUTTER", "PIXELS / LOCAL"], lineSorter: ["SEQUENCE CLEANUP", "TEXT / LOCAL"], imageMetadata: ["PRIVACY RELAY", "PIXELS / LOCAL"],
  whatsappDirect: ["COMMUNICATION RELAY", "DIRECT LINK / LOCAL"], gstTax: ["TAX ENGINE", "INVOICE BREAKDOWN"], passportPhoto: ["EXAM PORTAL SPEC", "COMPRESSION / MEMORY"], landArea: ["REGIONAL MATRIX", "PLOT CONVERTER"], numberToWords: ["BANKING PROTOCOL", "CHEQUE FORMATTER"],
  jsonToZod: ["SCHEMA COMPILER", "TYPE INFERENCE / LOCAL"], cleanUrl: ["PRIVACY PURGE", "SURVEILLANCE SANITIZER"],
  jwtDebugger: ["TOKEN AUDITOR", "ZERO NETWORK TRANSMISSION"], cronSchedule: ["SCHEDULE ENGINE", "5-FIELD CHRONO COMPILER"], regexTester: ["REGEX RUNTIME", "LIVE SYNTAX & REPLACE"],
  curlToCode: ["CLI TRANS-COMPILER", "MULTI-RUNTIME EMITTER"],
  loremIpsum: ["DUMMY CORPUS", "LATIN GENERATOR / LOCAL"],
  randomNumber: ["ENTROPY ENGINE", "CRYPTOGRAPHIC RNG / LIVE"],
  seoMeta: ["META TAG FORGE", "SEARCH & SOCIAL PREVIEW"],
  usernameGen: ["HANDLE FORGE", "ALGORITHMIC NAMING / LIVE"],
  ogImageBuilder: ["CANVAS FORGE", "1200x630 PIXEL MATRIX / LOCAL"],
  fakeDataGen: ["SYNTHETIC ENGINE", "IN-MEMORY RECORD GENERATOR"],
} as const;

function WorkspaceFrame({ children, tool }: { children: React.ReactNode; tool: NonNullable<ReturnType<typeof getTool>> }) {
  const telemetry = toolTelemetry[tool.kind as keyof typeof toolTelemetry] ?? ["LOCAL INSTRUMENT", "CURRENT-TAB EXECUTOR"] as const;
  const { isHindi } = useLanguage();
  const displayName = isHindi && tool.hindiName ? tool.hindiName : tool.name;
  const displayDescription = isHindi && tool.hindiDescription ? tool.hindiDescription : tool.description;

  const [referrer, setReferrer] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const params = new URLSearchParams(window.location.search);
      const rawBy = params.get("by");
      return rawBy ? cleanUserName(rawBy) : "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (referrer) {
      document.title = `${referrer} thinks you'll find this useful: ${displayName} | Toolbox Galaxy`;
    } else {
      document.title = `${displayName} – Free Online Tool | Toolbox Galaxy`;
    }
  }, [referrer, displayName]);

  return <AppShell><section className="page-section workspace"><Link href="/tools" className="back-link">← Back to tool foundry</Link>{referrer && (<aside className="tool-referral-banner" role="status" aria-label={`Recommended by ${referrer}`}><div className="tool-referral-banner__content"><span className="tool-referral-banner__tag">RECOMMENDATION</span><p><strong>{referrer}</strong> thinks you&apos;ll find this useful: <span>{displayName}</span>. This tool runs 100% locally in your browser with zero data sent to any server.</p></div><button type="button" onClick={() => setReferrer("")} className="tool-referral-banner__dismiss" aria-label="Dismiss recommendation" title="Dismiss notice"><X size={14} /></button></aside>)}<div className="workspace-intro"><div><p className="mono-label text-[#c7f36b]">VERIFIED LOCAL MODULE</p><h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">{displayName}</h1><p className="mt-4 max-w-xl text-white/62">{displayDescription}</p></div><div className="workspace-side-actions"><aside className="workspace-telemetry" aria-label={`${displayName} instrument status`}><span>MODULE / 0{tool.kind === "loanEmi" ? "2" : tool.kind === "workShift" ? "3" : tool.kind === "imageTransform" ? "4" : tool.kind === "lineSorter" ? "5" : tool.kind === "imageMetadata" ? "6" : tool.kind === "splitBill" ? "1" : "0"}</span><strong>{telemetry[0]}</strong><small>{telemetry[1]}</small><i>INPUT / LOCAL</i></aside><div className="flex items-center gap-2 justify-end"><FavoriteToolButton tool={tool} className="workspace-favorite" /><ShareToolButton tool={tool} className="workspace-share" /></div><div className="privacy-note"><ShieldCheck size={19} /><span>Input stays in this browser tab.</span></div></div></div>{tool.kind === "imageMetadata" ? <div className="metadata-route-bus" aria-label="Privacy relay status"><span>PRIVACY RELAY BUS</span><i aria-hidden="true" /><span>CURRENT TAB ONLY</span></div> : null}<div className="workspace-panel"><div className="console-divider"><span>01 · INPUT DECK</span><span>LOCAL EXECUTOR</span><span>02 · OUTPUT BAY</span></div>{children}</div></section></AppShell>;
}

function Result({ value, error }: { value: string; error?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!value) return; await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div className={`result-block ${error ? "result-block--error" : ""}`}><div className="telemetry-strip"><span>OUTPUT</span><button onClick={copy} disabled={!value} className="copy-button">{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button></div><pre aria-live="polite">{error || value || "Your result will appear here."}</pre></div>;
}

function Calculator() {
  const [a, setA] = useState("12"); const [b, setB] = useState("3"); const [operator, setOperator] = useState("÷");
  const result = useMemo(() => { const left = Number(a); const right = Number(b); if (!Number.isFinite(left) || !Number.isFinite(right)) return "Enter valid numbers."; if (operator === "÷" && right === 0) return "Division by zero is undefined."; const output = operator === "+" ? left + right : operator === "−" ? left - right : operator === "×" ? left * right : left / right; return Number.isInteger(output) ? String(output) : output.toFixed(8).replace(/0+$/, "").replace(/\.$/, ""); }, [a, b, operator]);
  return <div className="runner-stack"><div className="math-row"><label>Value A<input inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} /></label><label>Operation<select value={operator} onChange={(e) => setOperator(e.target.value)}>{["+", "−", "×", "÷"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Value B<input inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} /></label></div><Result value={result} /></div>;
}

function Percentage() {
  const [amount, setAmount] = useState("18"); const [total, setTotal] = useState("120"); const value = useMemo(() => { const a = Number(amount); const t = Number(total); if (!Number.isFinite(a) || !Number.isFinite(t) || t === 0) return "Enter a non-zero total."; return `${((a / t) * 100).toFixed(2)}%`; }, [amount, total]);
  return <div className="runner-stack"><div className="math-row"><label>Part<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label>Total<input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} /></label></div><Result value={`${amount} is ${value} of ${total}.`} /></div>;
}

const units = [{ value: "m", label: "Metres", factor: 1 }, { value: "km", label: "Kilometres", factor: 1000 }, { value: "mi", label: "Miles", factor: 1609.344 }, { value: "ft", label: "Feet", factor: 0.3048 }];
function UnitConverter() { const [amount, setAmount] = useState("1"); const [from, setFrom] = useState("km"); const [to, setTo] = useState("mi"); const output = useMemo(() => { const amountValue = Number(amount); const fromUnit = units.find((unit) => unit.value === from)!; const toUnit = units.find((unit) => unit.value === to)!; if (!Number.isFinite(amountValue)) return "Enter a valid value."; return `${amountValue} ${fromUnit.label} = ${(amountValue * fromUnit.factor / toUnit.factor).toFixed(6).replace(/0+$/, "")} ${toUnit.label}`; }, [amount, from, to]); return <div className="runner-stack"><div className="math-row"><label>Value<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label>From<select value={from} onChange={(e) => setFrom(e.target.value)}>{units.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></label><label>To<select value={to} onChange={(e) => setTo(e.target.value)}>{units.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></label></div><Result value={output} /></div>; }

function Base64() { const [mode, setMode] = useState("encode"); const [input, setInput] = useState("Hello, Galaxy."); const { output, error } = useMemo(() => { try { return { output: mode === "encode" ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input))), error: "" }; } catch { return { output: "", error: "That text is not valid Base64." }; } }, [input, mode]); return <div className="runner-stack"><label className="wide-field">Mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="encode">Encode UTF-8 text</option><option value="decode">Decode Base64 text</option></select></label><label className="wide-field">Input<textarea value={input} onChange={(e) => setInput(e.target.value)} rows={7} /></label><Result value={output} error={error} /></div>; }

function JsonStation() { const [input, setInput] = useState('{"mission":"tools","status":"verified"}'); const [minify, setMinify] = useState(false); const { output, error } = useMemo(() => { try { return { output: JSON.stringify(JSON.parse(input), null, minify ? 0 : 2), error: "" }; } catch (e) { return { output: "", error: e instanceof Error ? e.message : "Invalid JSON." }; } }, [input, minify]); return <div className="runner-stack"><div className="toggle-row"><button className={!minify ? "toggle-button toggle-button--active" : "toggle-button"} onClick={() => setMinify(false)}>Format</button><button className={minify ? "toggle-button toggle-button--active" : "toggle-button"} onClick={() => setMinify(true)}>Minify</button></div><label className="wide-field">JSON input<textarea value={input} onChange={(e) => setInput(e.target.value)} rows={9} spellCheck="false" /></label><Result value={output} error={error} /></div>; }

function Password() { const [length, setLength] = useState(18); const [value, setValue] = useState(""); const generate = () => { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?"; const bytes = crypto.getRandomValues(new Uint32Array(length)); setValue(Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")); }; return <div className="runner-stack"><label className="range-field">Length <strong>{length}</strong><input type="range" min="12" max="48" value={length} onChange={(e) => setLength(Number(e.target.value))} /></label><div className="flex gap-3"><button className="signal-button" onClick={generate}>Generate password</button><button className="reset-button" onClick={() => setValue("")}><RotateCcw size={15} /> Clear</button></div><Result value={value} /></div>; }

function TextStats() { const [input, setInput] = useState("Write something useful. Then take a quick break."); const stats = useMemo(() => { const trimmed = input.trim(); const words = trimmed ? trimmed.split(/\s+/).length : 0; return [["Words", words], ["Characters", input.length], ["Lines", input ? input.split(/\r?\n/).length : 0], ["Read", `${Math.max(1, Math.ceil(words / 200))} min`]]; }, [input]); return <div className="runner-stack"><label className="wide-field">Text<input className="hidden" /><textarea value={input} onChange={(e) => setInput(e.target.value)} rows={9} /></label><div className="stats-grid">{stats.map(([label, value]) => <div className="stat-tile" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div></div>; }

function ColorSignal() { const [value, setValue] = useState("#c7f36b"); const parsed = useMemo(() => /^#?[0-9a-fA-F]{6}$/.test(value) ? `#${value.replace("#", "").toUpperCase()}` : "", [value]); const rgb = parsed ? `${parseInt(parsed.slice(1, 3), 16)}, ${parseInt(parsed.slice(3, 5), 16)}, ${parseInt(parsed.slice(5, 7), 16)}` : ""; return <div className="runner-stack"><div className="color-layout"><div className="color-preview" style={{ background: parsed || "#1f2937" }} /><label>HEX color<input value={value} onChange={(e) => setValue(e.target.value)} /></label></div><Result value={parsed ? `HEX ${parsed}\nRGB ${rgb}` : "Use a six-digit HEX colour, e.g. #C7F36B."} /></div>; }

const runnerByKind = { calculator: Calculator, percentage: Percentage, unit: UnitConverter, base64: Base64, json: JsonStation, password: Password, textStats: TextStats, color: ColorSignal, bmi: BmiTool, discount: DiscountTool, age: AgeTool, dateDiff: DateDifferenceTool, url: UrlTool, html: HtmlTool, textCase: TextCaseTool, uuid: UuidTool, gradient: GradientTool, qr: QrTool, imageResize: ImageResizerTool, imageTransform: ImageTransformTool, imageMetadata: ImageMetadataTool, favicon: FaviconGeneratorTool, hash: HashGeneratorTool, passwordAudit: PasswordStrengthTool, markdown: MarkdownWorkspaceTool, contrast: ContrastCheckerTool, businessDays: BusinessDaysTool, timeZone: TimeZonePlannerTool, timestamp: TimestampConverterTool, textDiff: TextDiffTool, findReplace: FindReplaceTool, splitBill: SplitBillTool, loanEmi: LoanEmiTool, workShift: WorkShiftTool, jsonCsv: JsonCsvConverterTool, csvViewer: CsvViewerCleanerTool, lineSorter: LineSorterTool, pdfEditor: PdfEditorTool, pdfMergeSplit: PdfMergeSplitTool, imagesToPdf: ImagesToPdfTool, excelStudio: ExcelStudioTool, wordDocx: WordDocxTool, whatsappDirect: WhatsappDirectTool, gstTax: GstCalculatorTool, passportPhoto: PassportPhotoResizerTool, landArea: LandAreaConverterTool, numberToWords: NumberToWordsTool, jsonToZod: JsonToZodTool, cleanUrl: TrackingUrlCleanerTool, jwtDebugger: JwtDebuggerTool, cronSchedule: CronScheduleTool, regexTester: RegexTesterTool, curlToCode: CurlToCodeTool, loremIpsum: LoremIpsumTool, randomNumber: RandomNumberTool, seoMeta: SeoMetaTool, usernameGen: UsernameGeneratorTool, ogImageBuilder: OgImageBuilderTool, fakeDataGen: FakeDataGeneratorTool };

export default function ToolWorkspace() {
  const [, params] = useRoute("/tools/:slug");
  const tool = getTool(params?.slug || "");

  useEffect(() => {
    if (tool) {
      recordToolVisit(tool);
      trackEvent("view_tool", {
        tool_slug: tool.slug,
        tool_name: tool.name,
        tool_category: tool.category,
      });
    }
  }, [tool]);

  if (!tool) return <AppShell><section className="page-section"><p className="mono-label">MODULE NOT FOUND</p><Link href="/tools" className="signal-button mt-5 inline-flex">Return to tools</Link></section></AppShell>;
  const Runner = runnerByKind[tool.kind];
  return <WorkspaceFrame tool={tool}><Runner /></WorkspaceFrame>;
}
