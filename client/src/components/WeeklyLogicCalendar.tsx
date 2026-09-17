// Orbital Workbench: a docked local-only calendar filters records, changes its Grid/Timeline arrangement, and may export visible totals in-memory; none of those presentation controls writes, infers, or transmits player activity automatically.
import { genuineDailyLogicSlugs, weeklyLogicSummary, type WeeklyLogicFilter } from "@/lib/weeklyLogicStreak";
import { copyWeeklyLogicSummary, downloadWeeklyLogicSummary, shareWeeklyLogicSummary } from "@/lib/weeklyLogicShare";
import { CalendarDays, ChevronLeft, ChevronRight, Clipboard, Download, Flame, LayoutGrid, List, Share2, ShieldCheck, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const dateRange = (start: string, end: string) => { const begin = new Date(`${start}T12:00:00`); const finish = new Date(`${end}T12:00:00`); const sameMonth = begin.getMonth() === finish.getMonth(); const label = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }); return sameMonth ? `${new Intl.DateTimeFormat("en", { month: "long" }).format(begin)} ${begin.getDate()}–${finish.getDate()}` : `${label.format(begin)} – ${label.format(finish)}`; };
const filterLabels: Record<WeeklyLogicFilter, { label: string; code: string }> = {
  all: { label: "All fields", code: "ALL" },
  hive: { label: "The Hive", code: "H" },
  connections: { label: "Connections", code: "C" },
  wordle: { label: "Wordle Plus", code: "WD" },
  "mini-crossword": { label: "Crossword", code: "X" },
  strands: { label: "Strands", code: "ST" },
  queens: { label: "Queens", code: "Q" },
  "mini-sudoku": { label: "Mini Sudoku", code: "S" },
  tango: { label: "Tango", code: "T" },
  patches: { label: "Patches", code: "P" },
  zip: { label: "Zip", code: "Z" },
  wend: { label: "Wend", code: "W" }
};
const filterOptions: WeeklyLogicFilter[] = ["all", ...genuineDailyLogicSlugs];
type CalendarView = "grid" | "timeline";
const viewLabels: Record<CalendarView, string> = { grid: "Grid", timeline: "Timeline" };

export default function WeeklyLogicCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState<WeeklyLogicFilter>("all");
  const [view, setView] = useState<CalendarView>("grid");
  const [shareFeedback, setShareFeedback] = useState("");
  useEffect(() => { const sync = () => setRevision((value) => value + 1); window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync); }, []);

  const summary = useMemo(() => weeklyLogicSummary(new Date(), weekOffset, undefined, filter), [filter, revision, weekOffset]);
  const selected = filterLabels[filter];
  const weekLabel = dateRange(summary.weekStart, summary.weekEnd);
  const fieldLimit = filter === "all" ? genuineDailyLogicSlugs.length : 1;
  const hasVisibleCompletedDay = summary.days.some((day) => day.completedFields.length > 0);
  const canShare = summary.totalCompletedFields > 0;
  const shareSummary = { weekLabel, scopeLabel: selected.label, currentStreak: summary.currentStreak, longestStreak: summary.longestStreak, completedDays: summary.completedDays, totalCompletedFields: summary.totalCompletedFields };
  const handleShare = async () => setShareFeedback((await shareWeeklyLogicSummary(shareSummary)) ? "Native share opened." : "Native sharing unavailable. Use Copy or Download.");
  const handleCopy = async () => setShareFeedback((await copyWeeklyLogicSummary(shareSummary)) ? "Summary copied locally." : "Clipboard unavailable. Use Download.");

  const dayCells = summary.days.map((day) => (
    <div key={day.id} role="listitem" className={`weekly-logic-day ${day.isToday ? "weekly-logic-day--today" : ""} ${day.completedFields.length ? "weekly-logic-day--complete" : ""} ${day.isFuture ? "weekly-logic-day--future" : ""}`} aria-label={day.completedFields.length ? `${day.id}: ${day.completedFields.length} verified ${selected.label} field${day.completedFields.length === 1 ? "" : "s"} complete` : day.isFuture ? `${day.id}: future local date` : `${day.id}: no verified ${selected.label} field completed`}>
      <small>{day.shortLabel}</small><b>{day.dayNumber}</b><i>{day.completedFields.length ? `${day.completedFields.length}/${fieldLimit}` : "—"}</i><span>{day.completedFields.length ? day.completedFields.map((slug) => <em key={slug}>{filterLabels[slug].code}</em>) : day.isFuture ? "FUTURE" : "LOCAL"}</span>
    </div>
  ));

  return <section className={`weekly-logic-calendar weekly-logic-calendar--${view}`} aria-labelledby="weekly-logic-title">
    <header>
      <div>
        <p className="mono-label text-[#c7f36b]">VERIFIED DAILY EDITIONS / THIS BROWSER</p>
        <h2 id="weekly-logic-title" className="font-display">Local streak calendar.</h2>
        <p>{filter === "all" ? "Only finished daily logic and word edition fields count here." : `Showing completed ${selected.label} daily editions only.`} Game opens, demos, and visual orientation changes never add activity.</p>
        <div className="weekly-logic-filter" role="group" aria-label="Filter verified calendar activity by game"><span>FIELD FILTER</span><div>{filterOptions.map((option) => <button key={option} type="button" data-calendar-filter={option} aria-pressed={filter === option} onClick={() => setFilter(option)}><b>{filterLabels[option].code}</b><small>{filterLabels[option].label}</small></button>)}</div></div>
        <div className="weekly-logic-view" role="group" aria-label="Choose weekly calendar visual arrangement"><span>VIEW MODE</span><div>{(Object.keys(viewLabels) as CalendarView[]).map((option) => <button key={option} type="button" data-calendar-view={option} aria-pressed={view === option} onClick={() => setView(option)}>{option === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}<small>{viewLabels[option]}</small></button>)}</div><p>Layout only. Grid is restored on page reload.</p></div>
      </div>
      <div className="weekly-logic-actions"><button type="button" onClick={() => setWeekOffset((value) => value - 1)} aria-label="Show previous week"><ChevronLeft size={17} /></button><div><CalendarDays size={17} /><b>{weekLabel}</b><small>{weekOffset === 0 ? "CURRENT WEEK" : `${weekOffset > 0 ? "+" : ""}${weekOffset} WEEK`}</small></div><button type="button" onClick={() => setWeekOffset((value) => value + 1)} aria-label="Show next week"><ChevronRight size={17} /></button><button type="button" className="weekly-logic-today" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>Today</button></div>
    </header>
    <div className="weekly-logic-metrics"><span><Flame size={16} /><b>{summary.currentStreak}</b><small>CURRENT STREAK</small></span><span><Trophy size={16} /><b>{summary.longestStreak}</b><small>LONGEST STREAK</small></span><span><ShieldCheck size={16} /><b>{summary.completedDays}</b><small>VERIFIED DAYS</small></span><span><CalendarDays size={16} /><b>{summary.totalCompletedFields}</b><small>FIELDS COMPLETE</small></span></div>
    {canShare && <aside className="weekly-logic-share" aria-label="Share weekly local completion summary"><div><p className="mono-label">WEEKLY SIGNAL / LOCAL SUMMARY</p><b>{selected.label} · {weekLabel}</b><span>{summary.currentStreak}-DAY CURRENT · {summary.longestStreak}-DAY LONGEST · {summary.completedDays} DAYS · {summary.totalCompletedFields} FIELDS</span></div><div className="weekly-logic-share__actions"><button type="button" data-weekly-share="native" onClick={handleShare}><Share2 size={14} />Share</button><button type="button" data-weekly-share="copy" onClick={handleCopy}><Clipboard size={14} />Copy</button><button type="button" data-weekly-share="download" onClick={() => { downloadWeeklyLogicSummary(shareSummary); setShareFeedback("Text summary downloaded."); }}><Download size={14} />Download</button></div><p className="weekly-logic-share__note" role="status">{shareFeedback || "Visible calendar totals only. No identity, account, completion key, or puzzle content is included."}</p></aside>}
    <div className={`weekly-logic-days weekly-logic-days--${view}`} role="list" aria-label={`${selected.label} weekly local activity for ${weekLabel} in ${view} view`}>{dayCells}</div>
    <footer><span>LOCAL STORAGE / NO ACCOUNT / NO NETWORK</span><span>{hasVisibleCompletedDay ? `${selected.label} completed days are counted once; ${view} view never changes stored records.` : filter === "all" ? summary.completedDays ? "No verified daily field is complete in this viewed week." : "No verified daily field is complete on this device yet—finish any genuine edition to light a local day." : `No completed ${selected.label} daily edition appears in this viewed week.`}</span></footer>
  </section>;
}
