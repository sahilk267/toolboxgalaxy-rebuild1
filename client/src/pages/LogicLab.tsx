// Orbital Workbench: shared catalog for browser-local logic modules; verified availability is explicit.
import AppShell from "@/components/AppShell";
import { ArrowRight, Boxes, Crown, Grid3X3, MoonStar, Route, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const modules = [
  { slug: "mini-sudoku", name: "Mini Sudoku", rule: "6×6 / 2×3 regions", detail: "Place digits 1–6 exactly once in every row, column, and shaded box.", icon: Grid3X3, status: "Verified now" },
  { slug: "tango", name: "Tango", rule: "Binary balance grid", detail: "Balance two symbols, avoid triples, and honor same/different links.", icon: MoonStar, status: "Verified now" },
  { slug: "queens", name: "Queens", rule: "Region crown placement", detail: "One crown per row, column, and region—with no touching crowns.", icon: Crown, status: "Verified now" },
  { slug: "patches", name: "Patches", rule: "Rectangle partition", detail: "Partition the board using clue-owned rectangles with no gaps or overlap.", icon: Boxes, status: "Verified now" },
  { slug: "zip", name: "Zip", rule: "Ordered full-grid path", detail: "Connect the numbered stations in order while covering the whole grid.", icon: Route, status: "Verified now" },
  { slug: "wend", name: "Wend", rule: "Exact-cover word paths", detail: "Trace target words orthogonally until every letter tile is used once.", icon: Route, status: "Verified now" }
];

export default function LogicLab() {
  return (
    <AppShell>
      <section className="page-section logic-lab">
        <div className="logic-lab__hero">
          <div>
            <p className="mono-label text-[#c7f36b]">GAMES BAY / LOGIC LAB</p>
            <h1 className="font-display">Puzzle systems,<br />not guesswork.</h1>
            <p>Every board is backed by an independent local validator. Rules are source-researched, answers are fixed and verified, and play remains entirely in this browser.</p>
            <div className="logic-lab__stats">
              <span><b>06</b> verified modules live</span>
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
        <div className="logic-lab__runway">
          <span>MODULE FIELD / VERIFIED RULES</span>
          <i />
          <span>TOUCH + KEYS / LOCAL STATE</span>
        </div>
        <div className="logic-lab__grid">
          {modules.map((module) => {
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
                <Link href={`/games/logic/${module.slug}`} className="logic-card__launch">
                  Open module <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
