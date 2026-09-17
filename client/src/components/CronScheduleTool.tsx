import { useState, useMemo } from "react";
import { 
  Clock, 
  Calendar, 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  ArrowRight,
  RefreshCw,
  Terminal,
  HelpCircle
} from "lucide-react";

// Common cron presets
const CRON_PRESETS = [
  { label: "Every Minute", expr: "* * * * *", desc: "Runs once every minute" },
  { label: "Every 5 Minutes", expr: "*/5 * * * *", desc: "Runs at :00, :05, :10..." },
  { label: "Every 15 Minutes", expr: "*/15 * * * *", desc: "Runs at :00, :15, :30, :45" },
  { label: "Hourly at :00", expr: "0 * * * *", desc: "Runs at the top of every hour" },
  { label: "Daily at Midnight", expr: "0 0 * * *", desc: "Runs at 00:00 every night" },
  { label: "Daily at 9:00 AM", expr: "0 9 * * *", desc: "Runs every morning at 09:00" },
  { label: "Weekdays at 9:00 AM", expr: "0 9 * * 1-5", desc: "Runs Mon–Fri at 09:00" },
  { label: "Weekly on Sunday", expr: "0 0 * * 0", desc: "Runs Sunday at 00:00" },
  { label: "1st of Every Month", expr: "0 0 1 * *", desc: "Runs monthly at 00:00 on day 1" },
  { label: "Quarterly Clean (1st Jan/Apr/Jul/Oct)", expr: "0 0 1 1,4,7,10 *", desc: "Runs on quarterly boundaries" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Parse cron field to set of numbers
function parseField(field: string, min: number, max: number, mapNames?: Record<string, number>): Set<number> | null {
  const result = new Set<number>();
  let norm = field.trim().toUpperCase();

  if (mapNames) {
    Object.entries(mapNames).forEach(([name, val]) => {
      norm = norm.replace(new RegExp(name, "g"), String(val));
    });
  }

  if (norm === "*") {
    for (let i = min; i <= max; i++) result.add(i);
    return result;
  }

  const parts = norm.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      const [rangeStr, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return null;

      let start = min;
      let end = max;
      if (rangeStr !== "*") {
        if (rangeStr.includes("-")) {
          const [rStart, rEnd] = rangeStr.split("-").map(Number);
          if (isNaN(rStart) || isNaN(rEnd)) return null;
          start = rStart;
          end = rEnd;
        } else {
          start = parseInt(rangeStr, 10);
          if (isNaN(start)) return null;
        }
      }

      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) result.add(i);
      }
    } else if (part.includes("-")) {
      const [rStart, rEnd] = part.split("-").map(Number);
      if (isNaN(rStart) || isNaN(rEnd) || rStart > rEnd) return null;
      for (let i = rStart; i <= rEnd; i++) {
        if (i >= min && i <= max) result.add(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < min || num > max) return null;
      result.add(num);
    }
  }

  return result.size > 0 ? result : null;
}

// Convert cron string to human-friendly English sentence
function explainCron(fields: string[]): string {
  const [minStr, hourStr, domStr, monthStr, dowStr] = fields;

  let timeDesc = "";
  if (minStr === "*" && hourStr === "*") {
    timeDesc = "every minute";
  } else if (minStr.startsWith("*/") && hourStr === "*") {
    timeDesc = `every ${minStr.slice(2)} minutes`;
  } else if (hourStr === "*" && !minStr.includes("*") && !minStr.includes("/")) {
    timeDesc = `at minute ${minStr} past every hour`;
  } else if (!hourStr.includes("*") && !hourStr.includes("/") && !minStr.includes("*") && !minStr.includes("/")) {
    const h = parseInt(hourStr, 10);
    const m = parseInt(minStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    timeDesc = `at ${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  } else {
    timeDesc = `at minute [${minStr}] of hour [${hourStr}]`;
  }

  let domDesc = "";
  if (domStr !== "*") {
    domDesc = ` on day ${domStr} of the month`;
  }

  let monthDesc = "";
  if (monthStr !== "*") {
    monthDesc = ` in month ${monthStr}`;
  }

  let dowDesc = "";
  if (dowStr !== "*") {
    if (dowStr === "1-5") dowDesc = " on weekdays (Monday through Friday)";
    else if (dowStr === "0,6" || dowStr === "6,0") dowDesc = " on weekends (Saturday & Sunday)";
    else if (dowStr === "0" || dowStr === "7") dowDesc = " on Sunday";
    else dowDesc = ` on day-of-week [${dowStr}]`;
  }

  return `Runs ${timeDesc}${domDesc}${dowDesc}${monthDesc}.`;
}

// Calculate the next N run times
function calculateNextRuns(fields: string[], count = 8): Date[] {
  const [minStr, hourStr, domStr, monthStr, dowStr] = fields;

  const validMinutes = parseField(minStr, 0, 59);
  const validHours = parseField(hourStr, 0, 23);
  const validDom = parseField(domStr, 1, 31);
  const validMonths = parseField(monthStr, 1, 12, {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
  });
  const validDow = parseField(dowStr, 0, 7, {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
  });

  if (!validMinutes || !validHours || !validDom || !validMonths || !validDow) {
    return [];
  }

  // Normalize DOW: 7 is Sunday (0)
  if (validDow.has(7)) {
    validDow.add(0);
  }

  const results: Date[] = [];
  const current = new Date();
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1); // Start from next minute

  let iterations = 0;
  const maxIterations = 50000;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const m = current.getMonth() + 1;
    if (!validMonths.has(m)) {
      current.setMonth(current.getMonth() + 1, 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const d = current.getDate();
    const dow = current.getDay();
    const domMatch = validDom.has(d);
    const dowMatch = validDow.has(dow);

    // Standard cron rule: if both DOM and DOW are specified (not *), either can match
    const hasDomRestr = domStr !== "*";
    const hasDowRestr = dowStr !== "*";
    let dayMatches = false;
    if (hasDomRestr && hasDowRestr) {
      dayMatches = domMatch || dowMatch;
    } else if (hasDomRestr) {
      dayMatches = domMatch;
    } else if (hasDowRestr) {
      dayMatches = dowMatch;
    } else {
      dayMatches = true;
    }

    if (!dayMatches) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const h = current.getHours();
    if (!validHours.has(h)) {
      current.setHours(current.getHours() + 1, 0, 0, 0);
      continue;
    }

    const min = current.getMinutes();
    if (validMinutes.has(min)) {
      results.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}

export default function CronScheduleTool() {
  const [cronInput, setCronInput] = useState<string>("0 9-17 * * 1-5");
  const [copied, setCopied] = useState<boolean>(false);

  // Parse input into 5 fields
  const parsed = useMemo(() => {
    const raw = cronInput.trim().replace(/\s+/g, " ");
    const parts = raw.split(" ");

    if (parts.length !== 5) {
      return {
        error: `Expected 5 space-separated fields (minute, hour, day-of-month, month, day-of-week). Found ${parts.length}.`,
        fields: parts
      };
    }

    try {
      const explanation = explainCron(parts);
      const nextRuns = calculateNextRuns(parts, 8);

      if (nextRuns.length === 0) {
        return {
          error: "Invalid field values or schedule that never triggers.",
          fields: parts
        };
      }

      return {
        error: null,
        fields: parts,
        explanation,
        nextRuns
      };
    } catch (e: any) {
      return {
        error: e.message || "Failed to parse cron expression.",
        fields: parts
      };
    }
  }, [cronInput]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cronInput.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (index: number, val: string) => {
    const current = (parsed?.fields || ["*", "*", "*", "*", "*"]).slice(0, 5);
    while (current.length < 5) current.push("*");
    current[index] = val.trim() || "*";
    setCronInput(current.join(" "));
  };

  const formatRelative = (d: Date) => {
    const diffMs = d.getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "in < 1 min";
    if (diffMin < 60) return `in ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHours < 24) return `in ${diffHours}h ${remMin > 0 ? `${remMin}m` : ""}`;
    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-6" id="cron-tool-root">
      {/* Quick Presets Strip */}
      <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-[#0e1628] border border-white/10 text-xs font-mono">
        <Sparkles size={16} className="text-lime-400 shrink-0" />
        <span className="text-white/60 uppercase">POPULAR PRESETS:</span>
        <div className="flex flex-wrap gap-1.5">
          {CRON_PRESETS.map((p) => (
            <button
              key={p.label}
              id={`preset-${p.label.toLowerCase().replace(/\s+/g, "-")}`}
              type="button"
              onClick={() => setCronInput(p.expr)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Cron Input Card */}
      <div className="p-6 rounded-2xl bg-[#0e1628] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <label htmlFor="cron-main-input" className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase">
            <Clock size={16} className="text-lime-400" />
            <span>CRON EXPRESSION (5 FIELDS: MIN HOUR DOM MON DOW)</span>
          </label>
          <button
            id="copy-cron-btn"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white"
          >
            {copied ? <Check size={14} className="text-lime-400" /> : <Copy size={14} />}
            <span>{copied ? "COPIED" : "COPY"}</span>
          </button>
        </div>

        {/* Large Expression Display / Input */}
        <div className="relative">
          <input
            id="cron-main-input"
            type="text"
            value={cronInput}
            onChange={(e) => setCronInput(e.target.value)}
            placeholder="* * * * *"
            className="w-full px-4 py-3.5 text-lg sm:text-2xl font-mono font-bold bg-[#090d18] border border-white/15 rounded-xl text-lime-400 focus:outline-none focus:border-lime-400 tracking-wider"
          />
        </div>

        {/* 5 Field Quick Dissectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {[
            { label: "MINUTE", range: "0–59", val: parsed.fields[0] || "*" },
            { label: "HOUR", range: "0–23", val: parsed.fields[1] || "*" },
            { label: "DAY OF MONTH", range: "1–31", val: parsed.fields[2] || "*" },
            { label: "MONTH", range: "1–12", val: parsed.fields[3] || "*" },
            { label: "DAY OF WEEK", range: "0–6 (Sun=0)", val: parsed.fields[4] || "*" },
          ].map((col, idx) => (
            <div key={col.label} className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>{col.label}</span>
                <span>{col.range}</span>
              </div>
              <input
                id={`field-col-${idx}`}
                type="text"
                value={col.val}
                onChange={(e) => updateField(idx, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-lime-400"
              />
            </div>
          ))}
        </div>

        {/* Human Translation Banner */}
        {parsed.error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
            <div>
              <b className="block text-rose-300 mb-1">INVALID CRON FORMAT</b>
              <p>{parsed.error}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gradient-to-r from-lime-950/40 via-[#0e1628] to-sky-950/40 border border-lime-400/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-lime-400">
              <CheckCircle2 size={16} />
              <span className="font-bold uppercase tracking-wider">NATURAL LANGUAGE TRANSLATION</span>
            </div>
            <p className="text-base sm:text-lg font-sans font-medium text-slate-100">
              {parsed.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Execution Timeline (Next 8 Runs) */}
      {!parsed.error && parsed.nextRuns && parsed.nextRuns.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/10 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-white/70 uppercase">
              <Calendar size={15} className="text-sky-400" />
              <span>PROJECTED RUN SCHEDULE (NEXT {parsed.nextRuns.length} EXECUTIONS)</span>
            </span>
            <span className="text-white/40">Local Timezone</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            {parsed.nextRuns.map((runDate, i) => (
              <div
                key={runDate.toISOString()}
                className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-lime-400/10 text-lime-400 flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-slate-100 font-semibold block">
                      {runDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-white/50 text-[11px]">
                      {runDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-white/5 text-sky-300 text-[11px] font-medium border border-white/5">
                  {formatRelative(runDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cron Syntax Quick Guide */}
      <div className="p-4 rounded-xl bg-[#090d18] border border-white/10 text-xs font-mono text-white/60 space-y-2">
        <b className="text-white/80 block uppercase">Special Characters Cheatsheet:</b>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 rounded bg-white/5"><code className="text-lime-400">*</code> : Matches any value</div>
          <div className="p-2 rounded bg-white/5"><code className="text-lime-400">,</code> : Value list separator (e.g. 1,15,30)</div>
          <div className="p-2 rounded bg-white/5"><code className="text-lime-400">-</code> : Range of values (e.g. 9-17)</div>
          <div className="p-2 rounded bg-white/5"><code className="text-lime-400">/</code> : Step values (e.g. */10 = every 10)</div>
        </div>
      </div>
    </div>
  );
}
