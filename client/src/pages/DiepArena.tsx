// Diep Arena - Full-Screen Tactical 2D Tank Evolution Game
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Share2,
  Swords,
  Crosshair,
  Shield,
  Zap,
  Flame,
  Send
} from "lucide-react";
import DiepCanvas from "@/components/DiepCanvas";
import { DiepAudio } from "@/game/diep/audio";
import { DiepEngine } from "@/game/diep/engine";
import {
  STAT_LABELS,
  LEVEL_XP,
  TANK_CLASSES,
  ARENA_SIZE,
  NEST_RADIUS
} from "@/game/diep/constants";
import type {
  TankEntity,
  TankClassId,
  StatKey,
  LeaderboardEntry,
  KillFeedItem
} from "@/game/diep/types";

const DIEP_HIGH_SCORE_KEY = "toolboxgalaxy:diep-highscore";

export default function DiepArena() {
  const audio = useRef(new DiepAudio());
  const engineRef = useRef<DiepEngine | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(() => audio.current.isEnabled());
  const [player, setPlayer] = useState<TankEntity | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [evolutionChoices, setEvolutionChoices] = useState<TankClassId[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    level: number;
    classId: TankClassId;
    kills: number;
  }>({ score: 0, level: 1, classId: "basic", kills: 0 });

  const [autoFireActive, setAutoFireActive] = useState(false);
  const [autoSpinActive, setAutoSpinActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // High Score Tracking
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(DIEP_HIGH_SCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  // Challenge from URL parameter
  const challengeInfo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const by = params.get("by");
    const targetScore = Number(params.get("score")) || 0;
    if (by || targetScore > 0) {
      return { by: by || "A Friend", targetScore };
    }
    return null;
  }, []);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    audio.current.setEnabled(next);
    setSoundEnabled(next);
  };

  const handlePlayerUpdate = useCallback((p: TankEntity) => {
    setPlayer({ ...p, stats: { ...p.stats } });
    if (p.score > highScore) {
      setHighScore(p.score);
      try {
        localStorage.setItem(DIEP_HIGH_SCORE_KEY, String(p.score));
      } catch {}
    }
  }, [highScore]);

  const handleLeaderboardUpdate = useCallback((entries: LeaderboardEntry[]) => {
    setLeaderboard(entries);
  }, []);

  const handleKillFeed = useCallback((item: KillFeedItem) => {
    setKillFeed((prev) => [item, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setKillFeed((prev) => prev.filter((k) => k.id !== item.id));
    }, 4500);
  }, []);

  const handleEvolutionChoices = useCallback((choices: TankClassId[]) => {
    setEvolutionChoices(choices);
  }, []);

  const handleGameOver = useCallback((score: number, level: number, classId: TankClassId, kills: number) => {
    setIsGameOver(true);
    setGameOverStats({ score, level, classId, kills });
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem(DIEP_HIGH_SCORE_KEY, String(score));
      } catch {}
    }
  }, [highScore]);

  const handleRestart = () => {
    setIsGameOver(false);
    setEvolutionChoices([]);
    if (engineRef.current) {
      engineRef.current.dispose();
      // Trigger re-mount by reloading or re-initializing engine
      window.location.reload();
    }
  };

  const callbacks = useMemo(() => ({
    onPlayerUpdate: handlePlayerUpdate,
    onLeaderboardUpdate: handleLeaderboardUpdate,
    onKillFeed: handleKillFeed,
    onEvolutionChoices: handleEvolutionChoices,
    onGameOver: handleGameOver
  }), [handlePlayerUpdate, handleLeaderboardUpdate, handleKillFeed, handleEvolutionChoices, handleGameOver]);

  // Upgrade Stat
  const handleUpgradeStat = (key: StatKey) => {
    if (engineRef.current) {
      engineRef.current.upgradeStat(key);
    }
  };

  // Select Evolution
  const handleSelectEvolution = (classId: TankClassId) => {
    if (engineRef.current) {
      engineRef.current.evolve(classId);
    }
  };

  // Toggle Auto-Fire
  const toggleAutoFire = () => {
    if (engineRef.current) {
      engineRef.current.autoFire = !engineRef.current.autoFire;
      setAutoFireActive(engineRef.current.autoFire);
    }
  };

  // Toggle Auto-Spin
  const toggleAutoSpin = () => {
    if (engineRef.current) {
      engineRef.current.autoSpin = !engineRef.current.autoSpin;
      setAutoSpinActive(engineRef.current.autoSpin);
    }
  };

  // Share Viral Challenge
  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/tank-evolution?by=Commander&score=${Math.max(player?.score || 0, gameOverStats.score, highScore)}`;
  };

  const getShareText = () => {
    const s = Math.max(player?.score || 0, gameOverStats.score);
    return `🛡️ Diep Tank Arena • Score: ${s} pts (Lv ${player?.level || gameOverStats.level} ${TANK_CLASSES[player?.classId || gameOverStats.classId]?.name})!\n` +
      `⚡ Classic 2D Tank evolution with zero install on Toolbox Galaxy.\n\n` +
      `⚔️ Can you beat my score of ${s}? Battle now:\n` +
      `${getChallengeUrl()}`;
  };

  const handleShare = () => {
    const text = getShareText();
    if (navigator.share) {
      navigator.share({ title: "Diep Tank Challenge", text, url: getChallengeUrl() }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Cleanup audio
  useEffect(() => {
    return () => {
      audio.current.dispose();
    };
  }, []);

  // Compute XP progress percentage
  const currentLvl = player?.level || 1;
  const currentLvlXP = LEVEL_XP[currentLvl - 1] || 0;
  const nextLvlXP = LEVEL_XP[currentLvl] || (currentLvlXP + 10000);
  const scoreInLevel = (player?.score || 0) - currentLvlXP;
  const neededInLevel = Math.max(1, nextLvlXP - currentLvlXP);
  const xpPercent = Math.min(100, Math.max(0, (scoreInLevel / neededInLevel) * 100));

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#cdcdcd] font-sans">
      {/* 1. Underlying 2D Game Canvas */}
      <DiepCanvas callbacks={callbacks} engineRef={engineRef} audio={audio.current} />

      {/* 2. TOP HEADER HUD */}
      <header className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Back to Games Bay & Controls */}
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

          <button
            onClick={toggleAutoFire}
            className={`px-2.5 py-1.5 rounded-lg backdrop-blur border text-[11px] font-mono transition ${
              autoFireActive
                ? "bg-cyan-600/80 border-cyan-400 text-white shadow-md shadow-cyan-500/20"
                : "bg-black/60 border-white/20 text-white/80 hover:bg-black/80"
            }`}
          >
            [E] Auto-Fire: {autoFireActive ? "ON" : "OFF"}
          </button>

          <button
            onClick={toggleAutoSpin}
            className={`hidden sm:block px-2.5 py-1.5 rounded-lg backdrop-blur border text-[11px] font-mono transition ${
              autoSpinActive
                ? "bg-amber-600/80 border-amber-400 text-white"
                : "bg-black/60 border-white/20 text-white/80 hover:bg-black/80"
            }`}
          >
            [C] Auto-Spin: {autoSpinActive ? "ON" : "OFF"}
          </button>
        </div>

        {/* Center: Active Challenge Banner */}
        {challengeInfo && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-400/40 text-amber-300 text-xs font-mono shadow-lg">
            <Swords size={15} className="animate-bounce text-amber-400" />
            <span>Beat {challengeInfo.by}: <b>{challengeInfo.targetScore.toLocaleString()} pts</b></span>
          </div>
        )}

        {/* Right: Score & High Score */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur border border-white/20 text-right">
            <div className="text-[10px] text-white/60 font-mono tracking-wider">SCORE</div>
            <div className="text-base sm:text-lg font-bold text-white font-mono leading-none">
              {(player?.score || 0).toLocaleString()}
            </div>
          </div>

          <div className="hidden sm:block px-3 py-1 rounded-lg bg-black/60 backdrop-blur border border-white/20 text-right">
            <div className="text-[10px] text-amber-400 font-mono tracking-wider flex items-center justify-end gap-1">
              <Trophy size={11} /> BEST
            </div>
            <div className="text-base font-bold text-amber-300 font-mono leading-none">
              {highScore.toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* 3. TOP-RIGHT LEADERBOARD */}
      <div className="absolute top-16 right-3 sm:right-4 w-44 sm:w-56 p-2 rounded-xl bg-black/70 backdrop-blur border border-white/15 text-white pointer-events-none z-10 shadow-xl">
        <div className="text-[11px] font-mono font-bold tracking-wider text-white/70 border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
          <span>LEADERBOARD</span>
          <span className="text-[9px] text-lime-400">120 FPS</span>
        </div>
        <div className="space-y-1">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between text-xs font-mono px-1.5 py-0.5 rounded ${
                entry.isPlayer ? "bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-bold" : "text-white/80"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-white/40 text-[10px] w-3.5">{idx + 1}.</span>
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate max-w-[85px] sm:max-w-[110px]">{entry.name}</span>
              </div>
              <span className="text-[11px] text-white/90 shrink-0">{entry.score.toLocaleString()}</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-[11px] text-white/40 italic py-1">Scanning arena...</div>
          )}
        </div>
      </div>

      {/* 4. KILL FEED ALERTS */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-20">
        {killFeed.map((item) => (
          <div
            key={item.id}
            className="px-3 py-1 rounded-full bg-black/80 backdrop-blur border border-white/20 text-xs font-mono text-white flex items-center gap-2 shadow-lg animate-fade-in"
          >
            <span style={{ color: item.killerColor }} className="font-bold">{item.killer}</span>
            <span className="text-white/50 text-[10px]">destroyed</span>
            <span style={{ color: item.victimColor }}>{item.victim}</span>
          </div>
        ))}
      </div>

      {/* 5. EVOLUTION CHOICES SELECTOR (Level 15 / 30 / 45) */}
      {evolutionChoices.length > 0 && (
        <div className="absolute top-16 left-3 sm:left-4 max-w-sm p-3 rounded-2xl bg-black/85 backdrop-blur-md border-2 border-cyan-400 text-white z-30 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/15 pb-1.5 mb-2">
            <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
              <Zap size={14} /> TANK UPGRADE AVAILABLE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300">
              Lv {player?.level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {evolutionChoices.map((cid) => {
              const def = TANK_CLASSES[cid];
              if (!def) return null;
              return (
                <button
                  key={cid}
                  onClick={() => handleSelectEvolution(cid)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-cyan-500/30 border border-white/20 hover:border-cyan-400 text-left transition group"
                >
                  <div className="font-bold text-xs text-white group-hover:text-cyan-300">{def.name}</div>
                  <div className="text-[10px] text-white/60 line-clamp-2 mt-1 leading-tight">
                    {def.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. BOTTOM-LEFT STAT UPGRADES PANEL */}
      <div className="absolute bottom-16 sm:bottom-4 left-3 sm:left-4 w-52 sm:w-64 p-2.5 rounded-xl bg-black/75 backdrop-blur border border-white/15 text-white z-20 shadow-xl">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider mb-2 border-b border-white/10 pb-1">
          <span className="text-white/80">STAT UPGRADES</span>
          {player && player.statPoints > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] animate-pulse">
              +{player.statPoints} PTS
            </span>
          )}
        </div>

        <div className="space-y-1">
          {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => {
            const info = STAT_LABELS[key];
            const currentVal = player?.stats[key] || 0;
            const canUpgrade = (player?.statPoints || 0) > 0 && currentVal < 7;

            return (
              <div
                key={key}
                onClick={() => canUpgrade && handleUpgradeStat(key)}
                className={`flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded transition ${
                  canUpgrade
                    ? "cursor-pointer hover:bg-white/15 bg-white/5 border border-white/20"
                    : "opacity-85"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono text-white/40 w-3">{info.hotkey}</span>
                  <span className="text-[11px] truncate font-medium" style={{ color: info.color }}>
                    {info.name}
                  </span>
                </div>

                {/* 7-Segment Progress Pips */}
                <div className="flex items-center gap-1 shrink-0">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-3 rounded-xs border border-black/50"
                      style={{
                        backgroundColor: i < currentVal ? info.color : "#333333",
                        opacity: i < currentVal ? 1 : 0.4
                      }}
                    />
                  ))}
                  {canUpgrade && (
                    <span className="text-[11px] font-bold text-lime-400 ml-1">+</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. BOTTOM-CENTER LEVEL & XP PROGRESS BAR */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[85%] sm:w-96 flex flex-col items-center pointer-events-none z-20">
        <div className="flex items-center justify-between w-full text-xs font-mono text-white/90 drop-shadow mb-1 px-1">
          <span className="font-bold text-cyan-300">
            {TANK_CLASSES[player?.classId || "basic"]?.name || "Basic Tank"}
          </span>
          <span>Level {currentLvl} / 45</span>
        </div>

        {/* Diep Signature XP Bar */}
        <div className="w-full h-4 rounded-full bg-black/80 border-2 border-black overflow-hidden relative shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-lime-400 transition-all duration-150"
            style={{ width: `${xpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
            {Math.floor(scoreInLevel).toLocaleString()} / {Math.floor(neededInLevel).toLocaleString()} XP
          </div>
        </div>
      </div>

      {/* 8. BOTTOM-RIGHT RADAR MINI-MAP */}
      <div className="absolute bottom-16 sm:bottom-4 right-3 sm:right-4 w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-black/75 backdrop-blur border-2 border-white/20 overflow-hidden pointer-events-none z-10 shadow-2xl relative">
        {/* Center Nest Ring */}
        <div
          className="absolute rounded-full border border-indigo-400/40 bg-indigo-500/10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: "50%",
            top: "50%",
            width: `${(NEST_RADIUS * 2 / ARENA_SIZE) * 100}%`,
            height: `${(NEST_RADIUS * 2 / ARENA_SIZE) * 100}%`
          }}
        />

        {/* Bots Dots */}
        {engineRef.current?.bots.map((b) => {
          if (!b.active) return null;
          const left = (b.x / ARENA_SIZE) * 100;
          const top = (b.y / ARENA_SIZE) * 100;
          return (
            <div
              key={b.id}
              className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                backgroundColor: b.color
              }}
            />
          );
        })}

        {/* Player Dot */}
        {player && player.active && (
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white -translate-x-1/2 -translate-y-1/2 shadow-sm shadow-cyan-400"
            style={{
              left: `${(player.x / ARENA_SIZE) * 100}%`,
              top: `${(player.y / ARENA_SIZE) * 100}%`
            }}
          />
        )}
      </div>

      {/* 9. GAME OVER / RESPAWN MODAL */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#111625] border border-red-500/40 text-center text-white shadow-2xl relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Crosshair size={36} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
              TANK DESTROYED
            </h2>
            <p className="text-white/60 text-sm mb-6 font-mono">
              You fought valiantly in the 2D Evolution Arena.
            </p>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-left">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50">FINAL SCORE</div>
                <div className="text-xl font-bold text-white">{gameOverStats.score.toLocaleString()}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-amber-400">HIGH SCORE</div>
                <div className="text-xl font-bold text-amber-300">{highScore.toLocaleString()}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50">TANK CLASS</div>
                <div className="text-sm font-bold text-cyan-300 truncate">
                  {TANK_CLASSES[gameOverStats.classId]?.name} (Lv {gameOverStats.level})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50">ENEMIES DESTROYED</div>
                <div className="text-xl font-bold text-lime-400">{gameOverStats.kills}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer"
              >
                <RotateCcw size={18} /> Respawn Tank
              </button>

              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Share2 size={16} /> {copied ? "Challenge Link Copied!" : "Challenge a Friend (Copy Link)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
