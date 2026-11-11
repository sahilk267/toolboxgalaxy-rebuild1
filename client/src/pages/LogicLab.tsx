// Orbital Workbench: shared catalog for browser-local logic modules; verified availability is explicit.
import AppShell from "@/components/AppShell";
import { lazy, Suspense, useMemo, useState } from "react";
const LogicPracticeStudio = lazy(() => import("@/components/LogicPracticeStudio"));
import { DailyHabitPulse } from "@/components/DailyHabitPulse";
import WeeklyLogicCalendar from "@/components/WeeklyLogicCalendar";
import LogicPersonalBestSummary from "@/components/LogicPersonalBestSummary";
import {
  ArrowRight,
  Boxes,
  Crown,
  Grid3X3,
  MoonStar,
  Route,
  ShieldCheck,
  Hexagon,
  FileQuestion,
  Network,
  Compass,
  Swords,
  Layers,
} from "lucide-react";
import { Link } from "wouter";

const modules = [
  { slug: "queens", name: "Queens", rule: "Region crown placement", detail: "One crown per row, column, and region—with no touching crowns.", icon: Crown, href: "/games/logic/queens", status: "Daily live" },
  { slug: "tango", name: "Tango", rule: "Binary balance grid", detail: "Balance two symbols, avoid triples, and honor same/different links.", icon: MoonStar, href: "/games/logic/tango", status: "Daily live" },
  { slug: "mini-sudoku", name: "Mini Sudoku", rule: "6×6 / 2×3 regions", detail: "Place digits 1–6 exactly once in every row, column, and shaded box.", icon: Grid3X3, href: "/games/logic/mini-sudoku", status: "Daily live" },
  { slug: "the-hive", name: "The Hive", rule: "Spelling Bee Genius", detail: "Form words using the 7 letters while always including the central golden hive tile.", icon: Hexagon, href: "/games/the-hive", status: "Daily live" },
  { slug: "orbit-lexicon", name: "Wordle Plus", rule: "5-Letter Word Challenge", detail: "Deduce the hidden 5-letter word in 6 attempts with color-coded feedback.", icon: FileQuestion, href: "/games/orbit-lexicon", status: "Daily live" },
  { slug: "connections", name: "Connections", rule: "4 Common Themes", detail: "Sort 16 words into 4 distinct groups of four without making 4 mistakes.", icon: Network, href: "/games/connections", status: "Daily live" },
  { slug: "strands", name: "Strands", rule: "Theme Threads Search", detail: "Find theme-bound words that cover the whole letter grid, plus the spangram.", icon: Compass, href: "/games/strands", status: "Daily live" },
  { slug: "patches", name: "Patches", rule: "Rectangle partition", detail: "Partition the board using clue-owned rectangles with no gaps or overlap.", icon: Boxes, href: "/games/logic/patches", status: "Daily live" },
  { slug: "zip", name: "Zip", rule: "Ordered full-grid path", detail: "Connect the numbered stations in order while covering the whole grid.", icon: Route, href: "/games/logic/zip", status: "Daily live" },
  { slug: "wend", name: "Wend", rule: "Exact-cover word paths", detail: "Trace target words orthogonally until every letter tile is used once.", icon: Route, href: "/games/logic/wend", status: "Daily live" },
  { slug: "chess-puzzles", name: "Chess Tactics", rule: "Tactical Checkmates", detail: "Find the best move or forced checkmate in verified grandmaster positions.", icon: Swords, href: "/games/chess-puzzles", status: "Daily live" },
  { slug: "nonogram", name: "Nonogram Griddlers", rule: "Numeric Picture Logic", detail: "Uncover the hidden pixel art by deducing runs of filled cells from number clues.", icon: Layers, href: "/games/nonogram", status: "Daily live" },
];

export default function LogicLab() {
  const [filter, setFilter] = useState<"all"|"words"|"numbers"|"spatial">("all");
  const [search, setSearch] = useState("");
  const visibleModules = useMemo(() => modules.filter(item => {
    const words = ["the-hive","orbit-lexicon","connections","strands","wend","mini-crossword"];
    const numbers = ["tango","mini-sudoku","nonogram"];
    const category = words.includes(item.slug) ? "words" : numbers.includes(item.slug) ? "numbers" : "spatial";
    return (filter === "all" || filter === category) &&
      (item.name+" "+item.rule+" "+item.detail).toLowerCase().includes(search.toLowerCase().trim());
  }), [filter, search]);
  return (
    <AppShell>
      <section className="page-section logic-lab">
        <div className="logic-lab__hero">
          <div>
            <p className="mono-label text-[#c7f36b]">GAMES BAY / LOGIC LAB</p>
            <h1 className="font-display">Puzzle systems,<br />not guesswork.</h1>
            <p>Every board is backed by an independent local validator. Rules are source-researched, answers are fixed and verified, and play remains entirely in this browser.</p>
            <div className="logic-lab__stats">
              <span><b>12</b> verified modules live</span>
              <span><b>00</b> contracts queued</span>
              <span><b>00</b> server calls</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-[#0a1222] border border-white/10 rounded-2xl text-center space-y-3">
            <div className="w-16 h-16 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <ShieldCheck size={36} />
            </div>
            <p className="text-xs font-mono tracking-widest text-white/60 uppercase">DETERMINISTIC SOLVERS</p>
            <p className="text-xs text-white/40 max-w-[200px]">Strict mathematical constraints with guaranteed unique solutions</p>
          </div>
        </div>

        {/* Daily Habit & Streak Pulse */}
        <div className="my-6">
          <DailyHabitPulse />
        </div>

        <div className="logic-lab__runway">
          <span>MODULE FIELD / VERIFIED RULES</span>
          <i />
          <span>TOUCH + KEYS / LOCAL STATE</span>
        </div>

        <Suspense fallback={<div role="status" className="my-6 text-slate-300">Loading local practice boards…</div>}>
          <LogicPracticeStudio />
        </Suspense>
        <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <label className="flex-1 min-w-[190px] text-sm text-slate-300">
            Find a puzzle
            <input aria-label="Search puzzle modules" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search names or rules…" className="mt-1 block w-full rounded-lg bg-slate-900 p-2" />
          </label>
          <label className="min-w-[150px] text-sm text-slate-300">
            Puzzle family
            <select aria-label="Puzzle category" value={filter}
              onChange={e=>setFilter(e.target.value as "all"|"words"|"numbers"|"spatial")}
              className="mt-1 block w-full rounded-lg bg-slate-900 p-2">
              <option value="all">All games</option><option value="words">Word puzzles</option>
              <option value="numbers">Number & symbols</option><option value="spatial">Spatial & tactics</option>
            </select>
          </label>
          <p role="status" className="self-end text-xs text-slate-400">{visibleModules.length} of {modules.length} modules</p>
        </div>
        <div className="logic-lab__grid">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.slug} className="logic-card logic-card--live">
                <div className="telemetry-strip">
                  <span>VALIDATOR PASS</span>
                  <span>{module.status}</span>
                </div>
                <Icon size={28} />
                <p className="mono-label">{module.rule}</p>
                <h2 className="font-display">{module.name}</h2>
                <p>{module.detail}</p>
                <Link href={module.href} className="logic-card__launch">
                  Open module <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>

        {visibleModules.length === 0 && <p role="status" className="mt-4 text-slate-300">
          No puzzle matches your search. Try another category or clear the search.
        </p>}

        {/* Weekly Streak Calendar & Personal Bests */}
        <div className="mt-12 space-y-8">
          <WeeklyLogicCalendar />
          <LogicPersonalBestSummary />
        </div>
      </section>
    </AppShell>
  );
}
