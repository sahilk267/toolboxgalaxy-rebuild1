import React from "react";
import { Link } from "wouter";
import { getToolOfTheDayDetails } from "@/lib/toolOfTheDay";
import FavoriteToolButton from "@/components/FavoriteToolButton";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Lock,
  Sparkles,
  Calculator,
  Percent,
  Scale,
  Binary,
  Braces,
  KeyRound,
  FileText,
  Palette,
  Activity,
  Clock,
  Link2,
  Code2,
  Type,
  Fingerprint,
  QrCode,
  Image as ImageIcon,
  ShieldAlert,
  Layers,
  FileSpreadsheet,
  MessageSquare,
  Regex,
  Terminal,
  Wrench,
  LucideIcon,
} from "lucide-react";
import type { ToolKind } from "@shared/toolsData";

function getToolIcon(kind: ToolKind): LucideIcon {
  switch (kind) {
    case "calculator":
    case "gstTax":
    case "loanEmi":
    case "splitBill":
      return Calculator;
    case "percentage":
    case "discount":
      return Percent;
    case "unit":
    case "landArea":
      return Scale;
    case "bmi":
      return Activity;
    case "base64":
    case "hash":
      return Binary;
    case "json":
    case "jsonToZod":
      return Braces;
    case "jsonCsv":
    case "csvViewer":
    case "excelStudio":
      return FileSpreadsheet;
    case "password":
      return KeyRound;
    case "passwordAudit":
      return ShieldAlert;
    case "textStats":
    case "textCase":
    case "findReplace":
    case "lineSorter":
    case "markdown":
    case "wordDocx":
      return FileText;
    case "textDiff":
      return Layers;
    case "color":
    case "gradient":
    case "contrast":
      return Palette;
    case "age":
    case "dateDiff":
    case "businessDays":
      return Calendar;
    case "timeZone":
    case "timestamp":
    case "workShift":
    case "cronSchedule":
      return Clock;
    case "url":
    case "cleanUrl":
      return Link2;
    case "html":
      return Code2;
    case "uuid":
      return Fingerprint;
    case "qr":
      return QrCode;
    case "imageResize":
    case "imageTransform":
    case "imageMetadata":
    case "favicon":
    case "passportPhoto":
      return ImageIcon;
    case "pdfEditor":
    case "pdfMergeSplit":
    case "imagesToPdf":
      return FileText;
    case "whatsappDirect":
      return MessageSquare;
    case "numberToWords":
      return Type;
    case "jwtDebugger":
      return KeyRound;
    case "regexTester":
      return Regex;
    case "curlToCode":
      return Terminal;
    default:
      return Wrench;
  }
}

export default function ToolOfTheDayCard() {
  const details = getToolOfTheDayDetails();
  if (!details) return null;

  const { tool, dateLabel } = details;
  const ToolIcon = getToolIcon(tool.kind);

  const accentStyles = {
    lime: {
      badge: "border-[#c7f36b]/40 text-[#c7f36b] bg-[#c7f36b]/10",
      glow: "from-[#c7f36b]/15 via-transparent to-transparent",
      iconBg: "border-[#c7f36b]/30 bg-[#c7f36b]/10 text-[#c7f36b]",
      border: "hover:border-[#c7f36b]/60",
      cta: "bg-[#c7f36b] text-[#0b1020] hover:bg-[#d5f788]",
      pill: "text-[#c7f36b]",
    },
    sky: {
      badge: "border-[#6fd5ff]/40 text-[#6fd5ff] bg-[#6fd5ff]/10",
      glow: "from-[#6fd5ff]/15 via-transparent to-transparent",
      iconBg: "border-[#6fd5ff]/30 bg-[#6fd5ff]/10 text-[#6fd5ff]",
      border: "hover:border-[#6fd5ff]/60",
      cta: "bg-[#6fd5ff] text-[#0b1020] hover:bg-[#8ee0ff]",
      pill: "text-[#6fd5ff]",
    },
    ember: {
      badge: "border-[#ff9b54]/40 text-[#ff9b54] bg-[#ff9b54]/10",
      glow: "from-[#ff9b54]/15 via-transparent to-transparent",
      iconBg: "border-[#ff9b54]/30 bg-[#ff9b54]/10 text-[#ff9b54]",
      border: "hover:border-[#ff9b54]/60",
      cta: "bg-[#ff9b54] text-[#0b1020] hover:bg-[#ffad74]",
      pill: "text-[#ff9b54]",
    },
    violet: {
      badge: "border-[#c084fc]/40 text-[#c084fc] bg-[#c084fc]/10",
      glow: "from-[#c084fc]/15 via-transparent to-transparent",
      iconBg: "border-[#c084fc]/30 bg-[#c084fc]/10 text-[#c084fc]",
      border: "hover:border-[#c084fc]/60",
      cta: "bg-[#c084fc] text-[#0b1020] hover:bg-[#cca3fd]",
      pill: "text-[#c084fc]",
    },
  }[tool.accent] || {
    badge: "border-[#c7f36b]/40 text-[#c7f36b] bg-[#c7f36b]/10",
    glow: "from-[#c7f36b]/15 via-transparent to-transparent",
    iconBg: "border-[#c7f36b]/30 bg-[#c7f36b]/10 text-[#c7f36b]",
    border: "hover:border-[#c7f36b]/60",
    cta: "bg-[#c7f36b] text-[#0b1020] hover:bg-[#d5f788]",
    pill: "text-[#c7f36b]",
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#12192c] via-[#0c1222] to-[#070b16] p-5 sm:p-7 shadow-2xl transition-all duration-300 ${accentStyles.border}`}
      aria-label={`Tool of the day: ${tool.name}`}
    >
      {/* Subtle radial ambient backdrop glow */}
      <div
        className={`pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br ${accentStyles.glow} blur-3xl`}
        aria-hidden="true"
      />

      {/* Top Telemetry Runway */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-[#c7f36b] animate-pulse" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-white/80 uppercase">
            TOOL OF THE DAY
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-white/50">
            <Calendar size={12} className="text-white/40" />
            {dateLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] tracking-wider text-white/60 uppercase">
            <CheckCircle2 size={11} className={accentStyles.pill} />
            VERIFIED LOCAL
          </span>
          <FavoriteToolButton tool={tool} />
        </div>
      </div>

      {/* Main Feature Layout */}
      <div className="mt-5 grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr_auto]">
        {/* Tool Icon Emblem */}
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${accentStyles.iconBg} shadow-inner shadow-black/40`}
        >
          <ToolIcon size={30} strokeWidth={1.75} />
        </div>

        {/* Content Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium tracking-wider text-white/45 uppercase">
              {tool.category}
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[10px] text-white/45 uppercase">
              DAILY FEATURED MODULE
            </span>
          </div>

          <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#f4f2ea] sm:text-3xl">
            {tool.name}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            {tool.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/10 bg-white/[0.02] px-2 py-0.5 font-mono text-[10px] text-white/55"
              >
                {tag}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-white/40 ml-1">
              <Lock size={10} /> In-browser executor
            </span>
          </div>
        </div>

        {/* Action Link Button */}
        <div className="flex sm:justify-end">
          <Link
            href={`/tools/${tool.slug}`}
            className={`signal-button inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium text-sm transition-transform active:scale-[0.98] ${accentStyles.cta}`}
          >
            Launch Tool
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
