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
  Crosshair,
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
                <span>4 ARCADES · 12 LOGIC PUZZLES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Blessing & Dua Card */}
        <div className="my-6">
          <DailyDuaCard />
        </div>

        {/* Krunker Voxel FPS (3D Slide-Hop Arena) */}
        <div className="game-launch-card border-amber-500/40 bg-[#17120a] mb-4">
          <div className="game-icon bg-amber-500/10 border-amber-500/30 text-amber-400">
            <Crosshair size={30} />
          </div>
          <div className="flex-1">
            <div className="telemetry-strip text-amber-400">
              <span>VOXEL FPS 04</span>
              <span>THREE.JS 3D ENGINE · SLIDE-HOPPING BHOP</span>
            </div>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.045em] text-white">
              Krunker Voxel FPS (3D Slide-Hop Arena)
            </h2>
            <p className="mt-3 max-w-xl text-white/62">
              High-velocity 3D browser first-person shooter. Chain crouch-slides into jumps to build 300+ U/S bhop momentum, hit instant hitscan headshots, launch off jump pads, and dominate FFA matches across 5 combat classes.
            </p>
            <div className="game-meta">
              <span>
                <Clock3 size={15} /> 4 min FFA matches
              </span>
              <span>
                <Gauge size={15} /> Pointer Lock + WASD / Touch
              </span>
              <span>
                <Zap size={15} /> 5 Classes & Jump Pads
              </span>
              <span>
                <Trophy size={15} /> Slide-Hop Bhop Leaderboard
              </span>
            </div>
          </div>
          <Link href="/games/krunker" className="ember-button bg-amber-400 hover:bg-amber-300 text-black border-amber-400">
            Play FPS <ArrowRight size={17} />
          </Link>
        </div>

        {/* Surviv Battle Royale (2D Top-Down Island Survival) */}
        <div className="game-launch-card border-amber-500/40 bg-[#161f12] mb-4">
          <div className="game-icon bg-amber-500/10 border-amber-500/30 text-amber-400">
            <Trophy size={30} />
          </div>
          <div className="flex-1">
            <div className="telemetry-strip text-amber-400">
              <span>BATTLE ROYALE 03</span>
              <span>30 SURVIVORS · TOXIC ZONE SHRINK</span>
            </div>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.045em] text-white">
              Surviv Battle Royale (2D Island Survival)
            </h2>
            <p className="mt-3 max-w-xl text-white/62">
              Loot firearms, ammo, vests, and medkits from wooden crates and military bunkers. Use trees, rocks, and bushes for tactical cover as the lethal red gas storm contracts. Outlast 29 survivors for the #1 Chicken Dinner.
            </p>
            <div className="game-meta">
              <span>
                <Clock3 size={15} /> 3–5 min matches
              </span>
              <span>
                <Gauge size={15} /> Dual Joysticks / Mouse + WASD
              </span>
              <span>
                <Zap size={15} /> 9 Weapons & Scopes
              </span>
              <span>
                <Trophy size={15} /> Winner Winner Chicken Dinner
              </span>
            </div>
          </div>
          <Link href="/games/surviv-io" className="ember-button bg-amber-400 hover:bg-amber-300 text-black border-amber-400">
            Drop In <ArrowRight size={17} />
          </Link>
        </div>

        {/* Diep Tank Evolution Arena */}
        <div className="game-launch-card border-cyan-500/30 bg-[#0c1524] mb-4">
          <div className="game-icon bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
            <Crosshair size={30} />
          </div>
          <div className="flex-1">
            <div className="telemetry-strip text-cyan-400">
              <span>ARCADE ARENA 02</span>
              <span>120 FPS VECTOR SIMULATION</span>
            </div>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.045em] text-white">
              Diep Tank (2D Evolution Arena)
            </h2>
            <p className="mt-3 max-w-xl text-white/62">
              Destroy geometric shapes, farm XP, upgrade 8 stats, evolve through 4 tiers of specialized tank classes, and outmaneuver intelligent AI bots in a 3200×3200 arena.
            </p>
            <div className="game-meta">
              <span>
                <Clock3 size={15} /> Continuous survival
              </span>
              <span>
                <Gauge size={15} /> Mouse/Keys + Dual Touch
              </span>
              <span>
                <Zap size={15} /> 15 Tank Classes
              </span>
              <span>
                <Trophy size={15} /> Browser high score & viral challenge
              </span>
            </div>
          </div>
          <Link href="/games/tank-evolution" className="ember-button bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400">
            Play Arena <ArrowRight size={17} />
          </Link>
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
