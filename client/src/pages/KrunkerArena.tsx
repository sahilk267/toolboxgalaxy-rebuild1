// Krunker Voxel FPS - 3D Slide-Hopping Hitscan Arena
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Crosshair,
  Zap,
  Flame,
  Trophy,
  Share2,
  Target,
  Swords,
  Gauge,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import KrunkerCanvas from "@/components/KrunkerCanvas";
import { WEAPON_DEFS } from "@/game/krunker/constants";
import { WeaponClass } from "@/game/krunker/types";

const KRUNKER_STATS_KEY = "toolboxgalaxy:krunker-career-stats";

interface CareerStats {
  totalKills: number;
  totalHeadshots: number;
  bestStreak: number;
  topSpeed: number;
  matchesPlayed: number;
}

export default function KrunkerArena() {
  const [copied, setCopied] = useState(false);
  const [careerStats, setCareerStats] = useState<CareerStats>(() => {
    try {
      const saved = localStorage.getItem(KRUNKER_STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      totalKills: 0,
      totalHeadshots: 0,
      bestStreak: 0,
      topSpeed: 0,
      matchesPlayed: 0,
    };
  });

  const handleShare = () => {
    const url = window.location.origin + "/games/krunker";
    const text = `🎯 I'm slide-hopping at ${careerStats.topSpeed || 280} u/s in 3D Krunker Voxel FPS on ToolboxGalaxy! Can you out-frag me in the voxel arena?`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0c1220]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/games"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Arcade Bay</span>
            </Link>
            <div className="h-4 w-px bg-white/15 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Crosshair size={18} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-tight uppercase flex items-center gap-2">
                  Krunker Voxel FPS
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                    3D ARENA
                  </span>
                </h1>
                <p className="text-[11px] text-white/50 font-mono hidden md:block">
                  Three.js 3D Voxel Shooter · Slide-Hopping Bhop · Instant Hitscan Raycasts
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share Challenge"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Game Canvas Viewport */}
        <div className="relative">
          <KrunkerCanvas onBackToMenu={() => (window.location.href = "/games")} />
        </div>

        {/* Tactical Overview Banner & Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
              <Flame size={14} /> SLIDE-HOPPING BHOP
            </div>
            <p className="text-[11px] text-white/60 leading-tight">
              Slide into jumps to preserve zero-friction air momentum and surpass 300+ units/sec.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
              <Zap size={14} /> HITSCAN BALLISTICS
            </div>
            <p className="text-[11px] text-white/60 leading-tight">
              True zero-travel hitscan rays with headshot multipliers (up to 2.0x) and crisp dings.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-lime-400 text-xs font-bold mb-1">
              <Swords size={14} /> 5 COMBAT CLASSES
            </div>
            <p className="text-[11px] text-white/60 leading-tight">
              Triggerman, Hunter, Run N Gun, Vince Shotgun, and Detective with distinct models.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
              <Gauge size={14} /> JUMP PADS & VERTICALITY
            </div>
            <p className="text-[11px] text-white/60 leading-tight">
              Launch into 25m aerial arcs and perform Vince shotgun recoil boosts in mid-air.
            </p>
          </div>
        </div>

        {/* Classes Loadout Grid */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <Target size={18} className="text-amber-400" />
                Voxel Combat Classes
              </h2>
              <p className="text-xs text-white/50 font-mono">
                Press [1]–[5] in-game to switch instantly between specialized loadouts.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold hidden sm:inline">
              5 CLASSES LOADED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {(["triggerman", "hunter", "run-n-gun", "vince", "detective"] as WeaponClass[]).map(
              (clsId, idx) => {
                const w = WEAPON_DEFS[clsId];
                return (
                  <div
                    key={clsId}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          [{idx + 1}]
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: w.primaryColor }}
                        />
                      </div>
                      <h3 className="font-bold text-sm text-white mt-1">{w.className}</h3>
                      <p className="text-[11px] text-amber-400 font-mono">{w.category}</p>
                      <p className="text-[11px] text-white/60 leading-relaxed mt-1 line-clamp-3">
                        {w.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] font-mono text-white/70">
                      <div className="flex justify-between">
                        <span>Damage:</span>
                        <span className="text-white font-bold">
                          {w.damage} {w.pellets > 1 ? `× ${w.pellets}` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Headshot:</span>
                        <span className="text-red-400 font-bold">{w.headshotMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Magazine:</span>
                        <span className="text-white font-bold">{w.magSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobility:</span>
                        <span className="text-lime-400 font-bold">
                          {Math.round(w.movementSpeed * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Slide-Hopping Guide & Mechanics Tutorial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-3">
            <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
              <Zap size={18} /> The Physics of Slide-Hopping (Bhop)
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              In classic Krunker.io, high-level players move across the map at blinding speeds using
              slide-hopping:
            </p>
            <ol className="space-y-2 text-xs text-white/70 font-mono list-decimal list-inside">
              <li>
                <strong className="text-white">Slide Initiation:</strong> Hold{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">W</kbd> and tap{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Shift</kbd>. Friction drops to
                near zero and adds an initial burst of forward velocity.
              </li>
              <li>
                <strong className="text-white">Slide-to-Air Jump:</strong> Instantly hit{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> before friction slows
                you down. In air, air-resistance is zero, preserving 100% of your slide speed.
              </li>
              <li>
                <strong className="text-white">Chain Momentum:</strong> The moment you touch the
                ground, repeat the Slide → Jump cycle without pausing. Watch the center speedometer
                skyrocket past 200, 300, and 400+ U/S!
              </li>
            </ol>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 space-y-3">
            <h3 className="font-bold text-base text-cyan-400 flex items-center gap-2">
              <Sparkles size={18} /> Special Jump Techniques & Map Secrets
            </h3>
            <div className="space-y-3 text-xs text-white/70 leading-relaxed">
              <div>
                <p className="font-bold text-white">Vince Shotgun Blast-Jumping:</p>
                <p className="text-white/60 mt-0.5">
                  Select <strong className="text-red-400">Vince</strong>, jump into the air, aim your
                  crosshair straight down towards the ground, and fire. The shotgun's heavy recoil
                  impulse launches you high into the sky!
                </p>
              </div>

              <div>
                <p className="font-bold text-white">Cyan Kinetic Jump Pads:</p>
                <p className="text-white/60 mt-0.5">
                  The glowing cyan pads situated in the courtyards launch anyone stepping onto them 25
                  meters into the air, allowing you to rain down fire or reach upper fortress bridges.
                </p>
              </div>

              <div>
                <p className="font-bold text-white">Hunter ADS Sniper Zoom:</p>
                <p className="text-white/60 mt-0.5">
                  Right-click to enter ADS with Hunter to bring up the authentic black aperture sniper
                  scope with precision red crosshairs. Headshots are instant 1-shot eliminations!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="border-t border-white/10 bg-[#080c16] px-4 py-4 mt-8 text-center text-xs font-mono text-white/40">
        ToolboxGalaxy 3D Voxel Arcade · Krunker-Inspired Three.js Engine · Pure WebGL & Web Audio API
      </footer>
    </div>
  );
}
