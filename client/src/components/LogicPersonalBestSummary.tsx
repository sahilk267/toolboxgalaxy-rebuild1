// Orbital Workbench: a Games Bay personal-record rack reads existing genuine edition flags only; it communicates completion-derived counts, never speed/score claims or unverified progress.
import { logicPersonalBests } from "@/lib/logicPersonalBest";
import { CalendarCheck, ChevronRight, Flame, Grid3X3, Moon, Crown, Sparkles, Route, Layers, SpellCheck, FileSpreadsheet, Hexagon, Waypoints } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const iconFor = {
  strands: Waypoints,
  hive: Hexagon,
  connections: Layers,
  wordle: SpellCheck,
  "mini-crossword": FileSpreadsheet,
  "mini-sudoku": Grid3X3,
  tango: Moon,
  queens: Crown,
  patches: Sparkles,
  zip: Route,
  wend: Grid3X3
};

const codeFor = {
  strands: "ST",
  hive: "H",
  connections: "C",
  wordle: "WD",
  "mini-crossword": "X",
  "mini-sudoku": "S",
  tango: "T",
  queens: "Q",
  patches: "P",
  zip: "Z",
  wend: "W"
};

export default function LogicPersonalBestSummary() {
  const [revision, setRevision] = useState(0);
  useEffect(() => { const sync = () => setRevision((value) => value + 1); window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync); }, []);
  const records = useMemo(() => logicPersonalBests(), [revision]); const completed = records.reduce((total, record) => total + record.completedEditions, 0); const available = records.reduce((total, record) => total + record.availableEditions, 0);
  return <section className="logic-personal-best" aria-labelledby="logic-personal-best-title"><header><div><p className="mono-label text-[#c7f36b]">PERSONAL BESTS / THIS BROWSER</p><h2 id="logic-personal-best-title" className="font-display">Your field record.</h2><p>Completion-derived edition counts and best local daily runs. This is not a speed score, profile, or cloud record.</p></div><div className="logic-personal-best__total"><CalendarCheck size={18} /><span><b>{completed}/{available}</b><small>AUTHORED FIELDS</small></span></div></header><div className="logic-personal-best__grid">{records.map((record) => { const Icon = iconFor[record.slug]; const targetHref = record.slug === "hive" ? "/games/the-hive" : `/games/${record.slug}`; return <Link key={record.slug} href={targetHref} className={`logic-personal-best__card logic-personal-best__card--${record.slug}`} aria-label={`${record.label}: ${record.completedEditions} of ${record.availableEditions} authored editions complete, best local run ${record.longestStreak} days. Open ${record.label}.`}><div><span className="logic-personal-best__code">{codeFor[record.slug]}</span><Icon size={18} /><b>{record.label}</b><ChevronRight size={15} /></div><p><strong>{record.completedEditions}<i>/{record.availableEditions}</i></strong><small>EDITIONS COMPLETE</small></p><p><strong><Flame size={13} /> {record.longestStreak}</strong><small>BEST LOCAL RUN</small></p><em>{record.completedEditions ? `${record.currentStreak} DAY CURRENT` : "NO FIELD LOCKED"}</em></Link>; })}</div><footer><span>LOCAL COMPLETIONS ONLY / NO ACCOUNT</span><span>Counts accept only verified authored edition records dated on or before this device’s local day.</span></footer></section>;
}
