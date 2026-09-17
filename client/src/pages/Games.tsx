// Orbital Workbench: games route introduces the separate lightweight-games product lane.
import AppShell from "@/components/AppShell";
import DailyDuaCard from "@/components/DailyDuaCard";
import LogicPersonalBestSummary from "@/components/LogicPersonalBestSummary";
import WeeklyLogicCalendar from "@/components/WeeklyLogicCalendar";
import { DailyReminderToggle } from "@/components/DailyReminderToggle";
import {
  ArrowRight,
  Clock3,
  Crown,
  Gamepad2,
  Gauge,
  Grid3X3,
  Moon,
  Route,
  Sparkles,
  Trophy,
  Volume2,
  Zap,
  Layers,
  SpellCheck,
  FileSpreadsheet,
  Hexagon,
  Waypoints,
} from "lucide-react";
import { Link } from "wouter";

import { GAMES_CATALOG } from "@shared/gamesData";
import type { LucideIcon } from "lucide-react";

const GAME_ICONS: Record<string, LucideIcon> = {
  strands: Waypoints,
  "the-hive": Hexagon,
  connections: Layers,
  "orbit-lexicon": SpellCheck,
  queens: Crown,
  "mini-sudoku": Grid3X3,
  tango: Moon,
  patches: Sparkles,
  zip: Route,
  wend: Grid3X3,
  "chess-puzzles": Trophy,
  nonogram: Grid3X3,
};

export const logicGames = GAMES_CATALOG.filter(
  (game) => game.slug in GAME_ICONS
).map((game) => ({
  ...game,
  icon: GAME_ICONS[game.slug],
}));

export default function Games() {
  return (
    <AppShell>
      <section className="page-section games-page">
        <div className="page-kicker">
          <span>02</span>
          <span>LIGHTWEIGHT GAMES BAY</span>
        </div>

        <div className="games-hero">
          <div>
            <p className="mono-label text-[#ff9b54]">SHORT SESSIONS / LOCAL SCORE</p>
            <h1 className="font-display mt-4 text-5xl font-semibold tracking-[-0.07em] md:text-7xl">
              Take a lap around the galaxy.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
              The games lane is a separate, lazy-loaded layer so everyday tools stay focused and fast.
            </p>
          </div>

          <div className="games-hero-visual hidden md:flex items-center justify-center p-8 bg-[#0e1628]/80 border border-white/10 rounded-2xl">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
                <Gamepad2 size={42} />
              </div>
              <p className="text-xs uppercase tracking-widest font-mono text-white/50">ARCADE BAY ACTIVE</p>
              <div className="flex items-center justify-center gap-2 text-xs text-lime-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span>1 ARCADE · 12 LOGIC PUZZLES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Blessing & Dua Card */}
        <div className="my-6">
          <DailyDuaCard />
        </div>

        {/* Orbit Dash */}
        <div className="game-launch-card">
          <div className="game-icon">
            <Gamepad2 size={30} />
          </div>
          <div className="flex-1">
            <div className="telemetry-strip">
              <span>ARCADE RUNNER 01</span>
              <span>LOCAL SCORE</span>
            </div>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.045em]">Orbit Dash</h2>
            <p className="mt-3 max-w-xl text-white/62">
              Dodge orbital gates, collect signal fragments, and keep a single clean run alive. No login and no multiplayer server required.
            </p>
            <div className="game-meta">
              <span>
                <Clock3 size={15} /> 2–5 minute sessions
              </span>
              <span>
                <Gauge size={15} /> Keyboard + touch
              </span>
              <span>
                <Volume2 size={15} /> Shared sound setting
              </span>
              <span>
                <Trophy size={15} /> Browser high score
              </span>
            </div>
          </div>
          <Link href="/games/orbit-dash" className="ember-button">
            Launch game <ArrowRight size={17} />
          </Link>
        </div>

        {/* Logic Modules Direct Field */}
        <section className="logic-launch-field">
          <header>
            <div>
              <p className="mono-label text-[#c7f36b]">VERIFIED LOGIC MODULES / DAILY FIELD</p>
              <h2 className="font-display">Pick a puzzle directly.</h2>
              <p>
                Every puzzle opens as its own full-screen Games Bay field, with a device-local daily profile, visible hint control, and shared sound preference.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DailyReminderToggle variant="compact" />
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-lime-950/30 border border-lime-400/20 text-lime-400 text-xs font-mono">
                <Zap size={15} />
                <span>100% OFFLINE LOCAL LOGIC</span>
              </div>
            </div>
          </header>

          <div className="logic-direct-grid">
            {logicGames.map(({ slug, name, detail, icon: Icon, tag }, index) => (
              <Link key={slug} href={`/games/${slug}`} className="logic-direct-card">
                <span className="logic-direct-card__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon size={25} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b>{name}</b>
                    {tag && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20 font-mono whitespace-nowrap">
                        {tag}
                      </span>
                    )}
                  </div>
                  <small>{detail}</small>
                </div>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </section>

        <LogicPersonalBestSummary />
        <WeeklyLogicCalendar />
      </section>
    </AppShell>
  );
}
