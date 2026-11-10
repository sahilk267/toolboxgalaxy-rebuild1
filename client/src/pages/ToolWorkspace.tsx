// Orbital Workbench: local-only tool runners with visible validation and no legacy endpoint dependency.
import AppShell from "@/components/AppShell";
import { AgeTool, BmiTool, DateDifferenceTool, HtmlTool, UrlTool } from "@/components/AdvancedToolRunners";
import ImageResizerTool from "@/components/ImageResizerTool";
import ImageTransformTool from "@/components/ImageTransformTool";
import ImageMetadataTool from "@/components/ImageMetadataTool";
import { LineSorterTool } from "@/components/LineToolRunner";
import { HashGeneratorTool } from "@/components/LocalSecurityTools";
import { ContrastCheckerTool, MarkdownWorkspaceTool } from "@/components/ContentTools";
import { FindReplaceTool, SplitBillTool, TextDiffTool, TimestampConverterTool, WorkShiftTool } from "@/components/DailyToolRunners";
import { CsvViewerCleanerTool, JsonCsvConverterTool } from "@/components/StructuredDataRunners";
import PdfEditorTool from "@/components/PdfEditorTool";
import PdfCompressTool from "@/components/PdfCompressTool";
import EnterprisePdfTool from "@/components/EnterprisePdfTool";
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
import HeartfeltSupportPrompt from "@/components/HeartfeltSupportPrompt";
import { getTool } from "@/data/toolRegistry";
import { recordToolVisit } from "@/lib/recentToolHistory";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { recordToolTelemetry } from "@/lib/telegramAlerts";
import { markDailyToolVisited } from "@/lib/dailyHabitTracker";
import { unlockBadge, checkTimeBasedBadges } from "@/lib/achievementBadges";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Clipboard, RotateCcw, ShieldCheck, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { cleanUserName } from "@shared/userParam";
import { AdvancedPercentageTool, AdvancedUnitConverterTool, AdvancedTextStatisticsTool } from "@/components/AdvancedEverydayTools";

export function countWordsUnicode(text: string): number {
  if (!text || !text.trim()) return 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: "word" });
      let count = 0;
      for (const segment of segmenter.segment(text)) {
        if (segment.isWordLike) count++;
      }
      return count;
    } catch {
      // Fallback below
    }
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

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
    recordToolTelemetry(tool.slug, displayName);
  }, [referrer, displayName, tool.slug]);

  return <AppShell><section className="page-section workspace"><Link href="/tools" className="back-link">← Back to tool foundry</Link>{referrer && (<aside className="tool-referral-banner" role="status" aria-label={`Recommended by ${referrer}`}><div className="tool-referral-banner__content"><span className="tool-referral-banner__tag">RECOMMENDATION</span><p><strong>{referrer}</strong> thinks you&apos;ll find this useful: <span>{displayName}</span>. This tool runs 100% locally in your browser with zero data sent to any server.</p></div><button type="button" onClick={() => setReferrer("")} className="tool-referral-banner__dismiss" aria-label="Dismiss recommendation" title="Dismiss notice"><X size={14} /></button></aside>)}<div className="workspace-intro"><div><p className="mono-label text-[#c7f36b]">VERIFIED LOCAL MODULE</p><h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">{displayName}</h1><p className="mt-4 max-w-xl text-white/62">{displayDescription}</p></div><div className="workspace-side-actions"><aside className="workspace-telemetry" aria-label={`${displayName} instrument status`}><span>MODULE / 0{tool.kind === "loanEmi" ? "2" : tool.kind === "workShift" ? "3" : tool.kind === "imageTransform" ? "4" : tool.kind === "lineSorter" ? "5" : tool.kind === "imageMetadata" ? "6" : tool.kind === "splitBill" ? "1" : "0"}</span><strong>{telemetry[0]}</strong><small>{telemetry[1]}</small><i>INPUT / LOCAL</i></aside><div className="flex items-center gap-2 justify-end"><FavoriteToolButton tool={tool} className="workspace-favorite" /><ShareToolButton tool={tool} className="workspace-share" /></div><div className="privacy-note"><ShieldCheck size={19} /><span>Input stays in this browser tab.</span></div></div></div>{tool.kind === "imageMetadata" ? <div className="metadata-route-bus" aria-label="Privacy relay status"><span>PRIVACY RELAY BUS</span><i aria-hidden="true" /><span>CURRENT TAB ONLY</span></div> : null}<div className="workspace-panel"><div className="console-divider"><span>01 · INPUT DECK</span><span>LOCAL EXECUTOR</span><span>02 · OUTPUT BAY</span></div>{children}</div><HeartfeltSupportPrompt toolName={displayName} /></section></AppShell>;
}

function Result({ value, error }: { value: string; error?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!value) return; await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div className={`result-block ${error ? "result-block--error" : ""}`}><div className="telemetry-strip"><span>OUTPUT</span><button onClick={copy} disabled={!value} className="copy-button">{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button></div><pre aria-live="polite">{error || value || "Your result will appear here."}</pre></div>;
}

const AdvancedDiscountTool = lazy(() => import("@/components/AdvancedDailyBatch").then(m => ({ default: m.AdvancedDiscountTool })));
const AdvancedLoanTool = lazy(() => import("@/components/AdvancedDailyBatch").then(m => ({ default: m.AdvancedLoanTool })));
const AdvancedBusinessDaysTool = lazy(() => import("@/components/AdvancedDailyBatch").then(m => ({ default: m.AdvancedBusinessDaysTool })));
const AdvancedTimeZoneTool = lazy(() => import("@/components/AdvancedDailyBatch").then(m => ({ default: m.AdvancedTimeZoneTool })));
const AdvancedColorTool = lazy(() => import("@/components/AdvancedCreativeBatch").then(m => ({ default: m.AdvancedColorTool })));
const AdvancedGradientTool = lazy(() => import("@/components/AdvancedCreativeBatch").then(m => ({ default: m.AdvancedGradientTool })));
const AdvancedTextCaseTool = lazy(() => import("@/components/AdvancedCreativeBatch").then(m => ({ default: m.AdvancedTextCaseTool })));
const AdvancedBase64Tool = lazy(() => import("@/components/AdvancedDeveloperBatch").then(m => ({ default: m.AdvancedBase64Tool })));
const AdvancedUuidTool = lazy(() => import("@/components/AdvancedDeveloperBatch").then(m => ({ default: m.AdvancedUuidTool })));
const AdvancedCalculatorTool = lazy(() => import("@/components/AdvancedDeveloperBatch").then(m => ({ default: m.AdvancedCalculatorTool })));
const BackgroundRemoverTool = lazy(() => import("@/components/BackgroundRemoverTool"));
const AdvancedFaviconTool = lazy(() => import("@/components/AdvancedFaviconTool"));
const AdvancedJsonStation = lazy(() => import("@/components/AdvancedJsonStation"));
const AdvancedPasswordGenerator = lazy(() => import("@/components/AdvancedPasswordTools").then(module => ({ default: module.AdvancedPasswordGenerator })));
const AdvancedPasswordAuditor = lazy(() => import("@/components/AdvancedPasswordTools").then(module => ({ default: module.AdvancedPasswordAuditor })));
const AdvancedQrTool = lazy(() => import("@/components/AdvancedQrTool"));

const runnerByKind = { calculator: AdvancedCalculatorTool, percentage: AdvancedPercentageTool, unit: AdvancedUnitConverterTool, base64: AdvancedBase64Tool, json: AdvancedJsonStation, password: AdvancedPasswordGenerator, textStats: AdvancedTextStatisticsTool, color: AdvancedColorTool, bmi: BmiTool, discount: AdvancedDiscountTool, age: AgeTool, dateDiff: DateDifferenceTool, url: UrlTool, html: HtmlTool, textCase: AdvancedTextCaseTool, uuid: AdvancedUuidTool, gradient: AdvancedGradientTool, qr: AdvancedQrTool, imageResize: ImageResizerTool, imageTransform: ImageTransformTool, imageMetadata: ImageMetadataTool, favicon: AdvancedFaviconTool, hash: HashGeneratorTool, passwordAudit: AdvancedPasswordAuditor, markdown: MarkdownWorkspaceTool, contrast: ContrastCheckerTool, businessDays: AdvancedBusinessDaysTool, timeZone: AdvancedTimeZoneTool, timestamp: TimestampConverterTool, textDiff: TextDiffTool, findReplace: FindReplaceTool, splitBill: SplitBillTool, loanEmi: AdvancedLoanTool, workShift: WorkShiftTool, jsonCsv: JsonCsvConverterTool, csvViewer: CsvViewerCleanerTool, lineSorter: LineSorterTool, pdfEditor: PdfEditorTool, pdfCompress: PdfCompressTool, enterprisePdf: EnterprisePdfTool, pdfMergeSplit: PdfMergeSplitTool, imagesToPdf: ImagesToPdfTool, excelStudio: ExcelStudioTool, wordDocx: WordDocxTool, whatsappDirect: WhatsappDirectTool, gstTax: GstCalculatorTool, passportPhoto: PassportPhotoResizerTool, landArea: LandAreaConverterTool, numberToWords: NumberToWordsTool, jsonToZod: JsonToZodTool, cleanUrl: TrackingUrlCleanerTool, jwtDebugger: JwtDebuggerTool, cronSchedule: CronScheduleTool, regexTester: RegexTesterTool, curlToCode: CurlToCodeTool, loremIpsum: LoremIpsumTool, randomNumber: RandomNumberTool, seoMeta: SeoMetaTool, usernameGen: UsernameGeneratorTool, ogImageBuilder: OgImageBuilderTool, fakeDataGen: FakeDataGeneratorTool, backgroundRemoval: BackgroundRemoverTool };

export default function ToolWorkspace() {
  const [, params] = useRoute("/tools/:slug");
  const tool = getTool(params?.slug || "");

  useEffect(() => {
    if (tool) {
      recordToolVisit(tool);
      markDailyToolVisited();
      checkTimeBasedBadges();

      if (
        tool.slug === "clean-tracking-parameters" ||
        tool.slug === "image-metadata-viewer-exif" ||
        tool.slug === "password-strength-checker"
      ) {
        unlockBadge("privacy-purist");
      }

      if (
        tool.slug === "pdf-visual-editor" ||
        tool.slug === "word-docx-studio" ||
        tool.slug === "excel-studio" ||
        tool.slug === "pdf-merge-split"
      ) {
        unlockBadge("studio-artisan");
      }

      trackEvent("view_tool", {
        tool_slug: tool.slug,
        tool_name: tool.name,
        tool_category: tool.category,
      });
    }
  }, [tool]);

  if (!tool) return <AppShell><section className="page-section"><p className="mono-label">MODULE NOT FOUND</p><Link href="/tools" className="signal-button mt-5 inline-flex">Return to tools</Link></section></AppShell>;
  const Runner = runnerByKind[tool.kind];
  return <WorkspaceFrame tool={tool}><Suspense fallback={<p role="status">Loading background AI tool…</p>}><Runner /></Suspense></WorkspaceFrame>;
}
