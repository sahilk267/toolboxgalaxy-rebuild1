// Surviv Battle Royale - 2D Top-Down Tactical Island Survival
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Share2,
  Crosshair,
  Shield,
  Zap,
  Flame,
  Swords,
  Skull,
  Radio,
  Clock
} from "lucide-react";
import SurvivCanvas from "@/components/SurvivCanvas";
import { SurvivAudio } from "@/game/surviv/audio";
import { SurvivEngine } from "@/game/surviv/engine";
import {
  MAP_SIZE,
  WEAPONS,
  AMMO_COLORS,
  MEDS_CONFIG
} from "@/game/surviv/constants";
import type {
  PlayerEntity,
  ZoneState,
  KillFeedEntry
} from "@/game/surviv/types";

const SURVIV_STATS_KEY = "toolboxgalaxy:surviv-stats";

export default function SurvivBattleRoyale() {
  const audio = useRef(new SurvivAudio());
  const engineRef = useRef<SurvivEngine | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(() => audio.current.isEnabled());
  const [player, setPlayer] = useState<PlayerEntity | null>(null);
  const [aliveCount, setAliveCount] = useState(30);
  const [totalCount, setTotalCount] = useState(30);
  const [zone, setZone] = useState<ZoneState | null>(null);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);

  const [matchResult, setMatchResult] = useState<{
    over: boolean;
    won: boolean;
    rank: number;
    kills: number;
    damage: number;
  }>({ over: false, won: false, rank: 0, kills: 0, damage: 0 });

  const [copied, setCopied] = useState(false);

  // Best Wins & High Kills Persistence
  const [bestStats, setBestStats] = useState<{ wins: number; bestKills: number }>(() => {
    try {
      const saved = localStorage.getItem(SURVIV_STATS_KEY);
      return saved ? JSON.parse(saved) : { wins: 0, bestKills: 0 };
    } catch {
      return { wins: 0, bestKills: 0 };
    }
  });

  // Challenge URL params
  const challengeInfo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const by = params.get("by");
    const kills = Number(params.get("kills")) || 0;
    const rank = Number(params.get("rank")) || 0;
    if (by || kills > 0) {
      return { by: by || "A Survivor", kills, rank };
    }
    return null;
  }, []);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    audio.current.setEnabled(next);
    setSoundEnabled(next);
  };

  const handlePlayerUpdate = useCallback((p: PlayerEntity) => {
    setPlayer({
      ...p,
      weapons: [...p.weapons] as [any, any, any],
      ammo: { ...p.ammo },
      meds: { ...p.meds }
    });
  }, []);

  const handleAliveUpdate = useCallback((alive: number, total: number) => {
    setAliveCount(alive);
    setTotalCount(total);
  }, []);

  const handleKillFeed = useCallback((item: KillFeedEntry) => {
    setKillFeed((prev) => [item, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setKillFeed((prev) => prev.filter((k) => k.id !== item.id));
    }, 4500);
  }, []);

  const handleZoneUpdate = useCallback((z: ZoneState) => {
    setZone({ ...z });
  }, []);

  const handleGameOver = useCallback((won: boolean, rank: number, kills: number, damage: number) => {
    setMatchResult({ over: true, won, rank, kills, damage });

    setBestStats((prev) => {
      const next = {
        wins: won ? prev.wins + 1 : prev.wins,
        bestKills: Math.max(prev.bestKills, kills)
      };
      try {
        localStorage.setItem(SURVIV_STATS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const callbacks = useMemo(() => ({
    onPlayerUpdate: handlePlayerUpdate,
    onAliveUpdate: handleAliveUpdate,
    onKillFeed: handleKillFeed,
    onZoneUpdate: handleZoneUpdate,
    onGameOver: handleGameOver
  }), [handlePlayerUpdate, handleAliveUpdate, handleKillFeed, handleZoneUpdate, handleGameOver]);

  const handleRestart = () => {
    setMatchResult({ over: false, won: false, rank: 0, kills: 0, damage: 0 });
    if (engineRef.current) {
      engineRef.current.dispose();
      window.location.reload();
    }
  };

  const handleReload = () => {
    if (engineRef.current && player) {
      engineRef.current.reloadWeapon(engineRef.current.player);
    }
  };

  const handleSwitchWeapon = (slot: 0 | 1 | 2) => {
    if (engineRef.current) {
      engineRef.current.switchWeapon(slot);
    }
  };

  const handleUseMed = (type: "bandage" | "medkit" | "soda" | "pills") => {
    if (engineRef.current) {
      engineRef.current.useMed(engineRef.current.player, type);
    }
  };

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/surviv-io?by=Survivor&kills=${Math.max(player?.kills || 0, matchResult.kills)}&rank=${matchResult.rank || 1}`;
  };

  const getShareText = () => {
    const k = Math.max(player?.kills || 0, matchResult.kills);
    const r = matchResult.rank || 1;
    return `🔥 Surviv Battle Royale • ${matchResult.won ? "🏆 CHICKEN DINNER #1!" : `Rank #${r}`} with ${k} kills!\n` +
      `⚡ Top-down 2D Battle Royale with zero install on Toolbox Galaxy.\n\n` +
      `⚔️ Drop into the island and outlive me:\n` +
      `${getChallengeUrl()}`;
  };

  const handleShare = () => {
    const text = getShareText();
    if (navigator.share) {
      navigator.share({ title: "Surviv Battle Royale Challenge", text, url: getChallengeUrl() }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  useEffect(() => {
    return () => {
      audio.current.dispose();
    };
  }, []);

  const activeWeapon = useMemo(() => {
    if (!player) return WEAPONS.fists;
    const slotItem = player.weapons[player.activeSlot];
    if (!slotItem) return WEAPONS.fists;
    return WEAPONS[slotItem.weaponId] || WEAPONS.fists;
  }, [player]);

  const activeSlotItem = player?.weapons[player.activeSlot];

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#719853] font-sans">
      {/* 1. Underlying 2D Game Simulation Canvas */}
      <SurvivCanvas callbacks={callbacks} engineRef={engineRef} audio={audio.current} />

      {/* 2. TOP HEADER HUD */}
      <header className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Navigation & Audio Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/games"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/20 text-white hover:bg-black/80 text-xs font-medium transition"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Games Bay</span>
          </Link>

          <button
            onClick={handleSoundToggle}
            className={`p-2 rounded-lg backdrop-blur border text-xs font-medium transition ${
              soundEnabled
                ? "bg-black/60 border-white/20 text-lime-400 hover:bg-black/80"
                : "bg-red-950/60 border-red-500/40 text-red-400"
            }`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Center: Alive Counter & Zone Warning */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-black/70 backdrop-blur border border-white/20 text-white shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
              <Skull size={15} />
              <span>{aliveCount} ALIVE</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-lime-400">
              <Crosshair size={15} />
              <span>{player?.kills || 0} KILLS</span>
            </div>
          </div>

          {/* Zone Shrink Warning Banner */}
          {zone && (
            <div
              className={`px-3 py-0.5 rounded-full text-[11px] font-mono font-bold border backdrop-blur transition-all ${
                zone.isShrinking
                  ? "bg-red-950/80 border-red-500 text-red-300 animate-pulse"
                  : "bg-black/60 border-white/20 text-white/80"
              }`}
            >
              {zone.isShrinking
                ? `⚠️ GAS EXPANDING (${Math.ceil(zone.phaseTimer)}s)`
                : `SAFE ZONE CLOSES IN ${Math.ceil(zone.phaseTimer)}s`}
            </div>
          )}
        </div>

        {/* Right: Best Wins & Kills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {challengeInfo && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-400/40 text-amber-300 text-xs font-mono">
              <Swords size={14} className="text-amber-400" />
              <span>Beat {challengeInfo.by} ({challengeInfo.kills} kills)</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/20 text-right font-mono">
            <div className="text-[10px] text-amber-400 flex items-center justify-end gap-1">
              <Trophy size={11} /> WINS: {bestStats.wins}
            </div>
            <div className="text-xs text-white/80">BEST: {bestStats.bestKills} KILLS</div>
          </div>
        </div>
      </header>

      {/* 3. TOP-RIGHT KILL FEED */}
      <div className="absolute top-16 right-3 sm:right-4 flex flex-col items-end gap-1 pointer-events-none z-20">
        {killFeed.map((item) => (
          <div
            key={item.id}
            className={`px-3 py-1 rounded-lg text-xs font-mono border backdrop-blur flex items-center gap-2 shadow-md ${
              item.isPlayerKiller
                ? "bg-lime-950/80 border-lime-400 text-lime-300 font-bold"
                : item.isPlayerVictim
                ? "bg-red-950/80 border-red-400 text-red-300 font-bold"
                : "bg-black/75 border-white/15 text-white/90"
            }`}
          >
            <span>{item.killerName}</span>
            <span className="text-white/40 text-[10px]">[{item.weaponName}]</span>
            <span className="text-white/70">{item.victimName}</span>
          </div>
        ))}
      </div>

      {/* 4. BOTTOM-RIGHT TACTICAL RADAR MINI-MAP */}
      <div className="absolute bottom-20 sm:bottom-4 right-3 sm:right-4 w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-black/80 backdrop-blur border-2 border-white/20 overflow-hidden pointer-events-none z-10 shadow-2xl relative">
        {/* Island Shore Line */}
        <div className="absolute inset-1 rounded-xl border border-yellow-500/40 bg-[#719853]/40" />

        {/* Current Toxic Gas Storm (Red Ring) */}
        {zone && (
          <div
            className="absolute rounded-full border-2 border-red-500/90 bg-red-500/10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(zone.currentCenterX / MAP_SIZE) * 100}%`,
              top: `${(zone.currentCenterY / MAP_SIZE) * 100}%`,
              width: `${(zone.currentRadius * 2 / MAP_SIZE) * 100}%`,
              height: `${(zone.currentRadius * 2 / MAP_SIZE) * 100}%`
            }}
          />
        )}

        {/* Target Safe Circle (White Dotted) */}
        {zone && (
          <div
            className="absolute rounded-full border border-dashed border-white/80 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(zone.targetCenterX / MAP_SIZE) * 100}%`,
              top: `${(zone.targetCenterY / MAP_SIZE) * 100}%`,
              width: `${(zone.targetRadius * 2 / MAP_SIZE) * 100}%`,
              height: `${(zone.targetRadius * 2 / MAP_SIZE) * 100}%`
            }}
          />
        )}

        {/* Player Radar Pin */}
        {player && player.active && (
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white -translate-x-1/2 -translate-y-1/2 shadow-sm shadow-cyan-400"
            style={{
              left: `${(player.x / MAP_SIZE) * 100}%`,
              top: `${(player.y / MAP_SIZE) * 100}%`
            }}
          />
        )}
      </div>

      {/* 5. BOTTOM-LEFT MEDICAL HOTBAR */}
      <div className="absolute bottom-20 sm:bottom-4 left-3 sm:left-4 flex items-center gap-1.5 z-20 pointer-events-auto">
        {(["bandage", "medkit", "soda", "pills"] as const).map((type, idx) => {
          const cfg = MEDS_CONFIG[type];
          const count = player?.meds[type === "bandage" ? "bandages" : type === "medkit" ? "medkits" : type === "soda" ? "sodas" : "pills"] || 0;
          const hotkeys = ["7", "8", "9", "0"];

          return (
            <button
              key={type}
              onClick={() => handleUseMed(type)}
              disabled={count === 0 || player?.isUsingMed}
              className={`flex flex-col items-center justify-center w-12 sm:w-14 h-14 rounded-xl backdrop-blur border text-white transition ${
                count > 0 && !player?.isUsingMed
                  ? "bg-black/70 border-white/25 hover:bg-black/90 hover:border-cyan-400 cursor-pointer"
                  : "bg-black/40 border-white/10 opacity-40 cursor-not-allowed"
              }`}
            >
              <span className="text-lg leading-none">{cfg.icon}</span>
              <span className="text-[10px] font-mono font-bold mt-1 text-white/90">x{count}</span>
              <span className="text-[8px] font-mono text-white/40 leading-none">[{hotkeys[idx]}]</span>
            </button>
          );
        })}
      </div>

      {/* 6. BOTTOM-CENTER SURVIV HEALTH & ADRENALINE METERS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[86%] sm:w-96 flex flex-col items-center pointer-events-none z-20">
        {/* Using Med Progress Bar */}
        {player?.isUsingMed && (
          <div className="w-full mb-1.5 px-3 py-1 rounded-lg bg-black/80 backdrop-blur border border-amber-400 text-amber-300 text-xs font-mono flex items-center justify-between">
            <span>HEALING...</span>
            <span>{Math.ceil(player.medTimer / 1000)}s</span>
          </div>
        )}

        {/* Adrenaline Boost Bar (Orange) */}
        <div className="w-full h-2.5 rounded-full bg-black/80 border border-black overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
            style={{ width: `${player?.boost || 0}%` }}
          />
        </div>

        {/* Health Bar (Green / Red) */}
        <div className="w-full h-5 rounded-full bg-black/90 border-2 border-black overflow-hidden relative shadow-lg">
          <div
            className={`h-full transition-all duration-150 ${
              (player?.health || 0) > 50
                ? "bg-gradient-to-r from-green-500 to-lime-400"
                : (player?.health || 0) > 25
                ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                : "bg-gradient-to-r from-red-600 to-red-400 animate-pulse"
            }`}
            style={{ width: `${Math.max(0, player?.health || 0)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
            {Math.ceil(player?.health || 0)} / 100 HP
          </div>
        </div>

        {/* Armor & Equipment Badges */}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-white/80">
          <span className="px-2 py-0.5 rounded bg-black/60 border border-white/15">
            🛡️ VEST: Lv{player?.vestTier || 0}
          </span>
          <span className="px-2 py-0.5 rounded bg-black/60 border border-white/15">
            🪖 HELMET: Lv{player?.helmetTier || 0}
          </span>
          <span className="px-2 py-0.5 rounded bg-black/60 border border-white/15">
            🎒 PACK: Lv{player?.backpackTier || 1}
          </span>
          <span className="px-2 py-0.5 rounded bg-black/60 border border-white/15">
            🔭 SCOPE: {player?.scopeTier || 1}x
          </span>
        </div>
      </div>

      {/* 7. BOTTOM WEAPON & AMMO SLOTS HUD (Above mini-map on right or bottom right) */}
      <div className="absolute bottom-20 sm:bottom-4 right-3 sm:right-44 flex items-center gap-1.5 z-20 pointer-events-auto">
        {[0, 1, 2].map((slotIdx) => {
          const item = player?.weapons[slotIdx];
          const isSelected = player?.activeSlot === slotIdx;
          const wep = item ? WEAPONS[item.weaponId] : slotIdx === 2 ? WEAPONS.fists : null;
          const hotkey = slotIdx + 1;

          return (
            <button
              key={slotIdx}
              onClick={() => handleSwitchWeapon(slotIdx as 0 | 1 | 2)}
              className={`flex flex-col justify-between w-20 sm:w-24 h-16 p-1.5 rounded-xl backdrop-blur border text-left transition ${
                isSelected
                  ? "bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-black/60 border-white/15 text-white/70 hover:bg-black/80 cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-mono text-white/40">[{hotkey}]</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </div>

              <div className="font-bold text-[11px] truncate leading-tight">
                {wep ? wep.name : "Empty"}
              </div>

              <div className="text-[10px] font-mono text-white/60">
                {wep && wep.category !== "melee" ? (
                  <span>
                    {item?.curAmmo} / {wep.ammoType ? player?.ammo[wep.ammoType] || 0 : 0}
                  </span>
                ) : (
                  <span>Melee</span>
                )}
              </div>
            </button>
          );
        })}

        {/* Reload Button */}
        {activeWeapon.category !== "melee" && (
          <button
            onClick={handleReload}
            className={`px-2.5 py-3 rounded-xl border font-mono text-xs font-bold transition cursor-pointer ${
              player?.isReloading
                ? "bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse"
                : "bg-black/70 border-white/20 text-white hover:bg-black/90"
            }`}
          >
            {player?.isReloading ? "..." : "[R]"}
          </button>
        )}
      </div>

      {/* 8. MATCH OVER / CHICKEN DINNER MODAL */}
      {matchResult.over && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0f172a] border-2 text-center text-white shadow-2xl relative border-amber-400/50">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                matchResult.won
                  ? "bg-amber-500/20 border border-amber-400 text-amber-300"
                  : "bg-red-500/20 border border-red-400 text-red-400"
              }`}
            >
              {matchResult.won ? <Trophy size={36} /> : <Crosshair size={36} />}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
              {matchResult.won ? "WINNER WINNER!" : "ELIMINATED"}
            </h2>
            <div className="text-xl font-bold font-mono text-amber-400 mb-2">
              {matchResult.won ? "CHICKEN DINNER #1" : `RANK #${matchResult.rank}`}
            </div>
            <p className="text-white/60 text-sm mb-6 font-mono">
              {matchResult.won
                ? "You are the supreme survivor of the island!"
                : "Better luck next drop into the battle arena."}
            </p>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-left">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50">TOTAL KILLS</div>
                <div className="text-2xl font-bold text-lime-400">{matchResult.kills}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50">DAMAGE DEALT</div>
                <div className="text-2xl font-bold text-cyan-300">{Math.round(matchResult.damage)}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-amber-400">BEST KILLS</div>
                <div className="text-xl font-bold text-amber-300">{bestStats.bestKills}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-amber-400">TOTAL WINS</div>
                <div className="text-xl font-bold text-amber-300">{bestStats.wins}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                <RotateCcw size={18} /> Drop Again (Play Next Match)
              </button>

              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Share2 size={16} /> {copied ? "Challenge Link Copied!" : "Challenge Friends (Share Match)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
