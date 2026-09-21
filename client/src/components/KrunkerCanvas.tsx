import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Crosshair,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  HelpCircle,
  Trophy,
  Zap,
  Target,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { KrunkerEngine } from "@/game/krunker/engine";
import {
  WeaponClass,
  KillfeedEntry,
  ScorePopup,
  MatchStats,
  KrunkerCallbacks,
} from "@/game/krunker/types";
import { WEAPON_DEFS } from "@/game/krunker/constants";
import { krunkerAudio } from "@/game/krunker/audio";

interface KrunkerCanvasProps {
  onBackToMenu?: () => void;
}

export const KrunkerCanvas: React.FC<KrunkerCanvasProps> = ({ onBackToMenu }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<KrunkerEngine | null>(null);

  // UI States
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [health, setHealth] = useState<number>(100);
  const [maxHealth] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(30);
  const [magSize, setMagSize] = useState<number>(30);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0);
  const [activeClass, setActiveClass] = useState<WeaponClass>("triggerman");
  const [isADS, setIsADS] = useState<boolean>(false);

  // Combat Feedbacks
  const [hitmarkerActive, setHitmarkerActive] = useState<boolean>(false);
  const [hitmarkerHeadshot, setHitmarkerHeadshot] = useState<boolean>(false);
  const [damageIndicator, setDamageIndicator] = useState<boolean>(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [killerInfo, setKillerInfo] = useState<{ killer: string; weapon: string } | null>(null);
  const [showTabScoreboard, setShowTabScoreboard] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [matchEnded, setMatchEnded] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState<MatchStats | null>(null);
  const [matchWinner, setMatchWinner] = useState<string>("");
  const [matchTime, setMatchTime] = useState<number>(240);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<
    Array<{ name: string; kills: number; deaths: number; score: number; isPlayer?: boolean }>
  >([]);

  // Mobile virtual joystick state
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const touchLookRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);
  const touchMoveRef = useRef<{ id: number; startX: number; startY: number } | null>(null);

  // Sound toggle
  const toggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    krunkerAudio.setMuted(nextMuted);
  }, [isMuted]);

  // Track pointer lock exit time to comply with browser cooldowns
  const lastExitTimeRef = useRef<number>(0);
  const pendingLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Request Pointer Lock on desktop safely
  const requestLock = useCallback(() => {
    if (!containerRef.current || matchEnded) return;
    if (document.pointerLockElement === containerRef.current) return;

    if (pendingLockTimeoutRef.current) {
      clearTimeout(pendingLockTimeoutRef.current);
      pendingLockTimeoutRef.current = null;
    }

    const elapsed = Date.now() - lastExitTimeRef.current;
    if (elapsed < 1250) {
      // Chrome cooldown: pointer lock cannot be acquired immediately after exiting
      pendingLockTimeoutRef.current = setTimeout(() => {
        requestLock();
      }, 1300 - elapsed);
      return;
    }

    try {
      const lockPromise = containerRef.current.requestPointerLock() as unknown;
      if (lockPromise && typeof (lockPromise as Promise<void>).catch === "function") {
        (lockPromise as Promise<void>).catch(() => {
          // Gracefully suppress DOMException during cooldown or gesture constraints
          setIsLocked(false);
        });
      }
    } catch {
      // Ignore synchronous exceptions
    }
  }, [matchEnded]);

  // Change active weapon class
  const handleSelectClass = useCallback((wClass: WeaponClass) => {
    setActiveClass(wClass);
    if (engineRef.current) {
      engineRef.current.setWeaponClass(wClass);
      setAmmo(WEAPON_DEFS[wClass].magSize);
      setMagSize(WEAPON_DEFS[wClass].magSize);
    }
  }, []);

  // Respawn Handler
  const handleRespawn = useCallback(() => {
    if (engineRef.current && !isAlive) {
      engineRef.current.spawnPlayer();
      setIsAlive(true);
      setKillerInfo(null);
      requestLock();
    }
  }, [isAlive, requestLock]);

  // Setup Three.js Engine & Listeners
  useEffect(() => {
    if (!containerRef.current) return;

    // Detect mobile touch
    const checkMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsMobile(checkMobile);

    const callbacks: KrunkerCallbacks = {
      onKillfeed: (entry) => {
        setKillfeed((prev) => [entry, ...prev.slice(0, 4)]);
      },
      onScoreAdd: (score, reason, color) => {
        const popup: ScorePopup = {
          id: Math.random().toString(),
          text: reason,
          score,
          color: color || "#eab308",
          timestamp: Date.now(),
        };
        setScorePopups((prev) => [...prev.slice(-3), popup]);
        setTimeout(() => {
          setScorePopups((prev) => prev.filter((p) => p.id !== popup.id));
        }, 1500);
      },
      onPlayerHit: (_damage, isHeadshot) => {
        setHitmarkerHeadshot(isHeadshot);
        setHitmarkerActive(true);
        setTimeout(() => setHitmarkerActive(false), 140);
      },
      onPlayerDamaged: (curHp) => {
        setHealth(curHp);
        setDamageIndicator(true);
        setTimeout(() => setDamageIndicator(false), 180);
      },
      onPlayerKilled: (killer, weapon) => {
        setIsAlive(false);
        setKillerInfo({ killer, weapon });
      },
      onPlayerRespawn: () => {
        setIsAlive(true);
        setKillerInfo(null);
      },
      onAmmoChange: (curAmmo, mag, reloading) => {
        setAmmo(curAmmo);
        setMagSize(mag);
        setIsReloading(reloading);
      },
      onSpeedUpdate: (curSpeed) => {
        setSpeed(curSpeed);
      },
      onLeaderboardUpdate: (players) => {
        setLeaderboard(players);
      },
      onMatchEnd: (stats, winner) => {
        setMatchEnded(true);
        setFinalStats(stats);
        setMatchWinner(winner);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      },
    };

    const engine = new KrunkerEngine(containerRef.current, callbacks);
    engineRef.current = engine;

    // Pointer Lock Change Listener
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === containerRef.current;
      setIsLocked(locked);
      if (!locked) {
        lastExitTimeRef.current = Date.now();
      }
    };
    const onPointerLockError = () => {
      // Browser prevented lock (e.g. cooldown active or user gesture lost)
      setIsLocked(false);
      lastExitTimeRef.current = Date.now();
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);

    // Mouse Move Listener
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === containerRef.current && engineRef.current) {
        engineRef.current.onMouseMove(e.movementX, e.movementY);
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    // Mouse Buttons Listener
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;
      if (e.button === 0 && engineRef.current) {
        engineRef.current.isMouseDown = true;
      } else if (e.button === 2 && engineRef.current) {
        engineRef.current.isRightMouseDown = true;
        setIsADS(true);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && engineRef.current) {
        engineRef.current.isMouseDown = false;
      } else if (e.button === 2 && engineRef.current) {
        engineRef.current.isRightMouseDown = false;
        setIsADS(false);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);

    // Keyboard Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      engineRef.current.keys[e.code] = true;

      if (e.code === "Tab") {
        e.preventDefault();
        setShowTabScoreboard(true);
      }

      // Quick switch classes via number keys [1] - [5]
      if (e.code === "Digit1") handleSelectClass("triggerman");
      if (e.code === "Digit2") handleSelectClass("hunter");
      if (e.code === "Digit3") handleSelectClass("run-n-gun");
      if (e.code === "Digit4") handleSelectClass("vince");
      if (e.code === "Digit5") handleSelectClass("detective");

      // Jump to respawn if dead
      if (e.code === "Space" && !engineRef.current.isAlive) {
        engineRef.current.spawnPlayer();
        setIsAlive(true);
        setKillerInfo(null);
      }

      // ADS toggle with KeyE
      if (e.code === "KeyE") {
        setIsADS(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      engineRef.current.keys[e.code] = false;

      if (e.code === "Tab") {
        setShowTabScoreboard(false);
      }

      if (e.code === "KeyE" && !engineRef.current.isRightMouseDown) {
        setIsADS(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Window Resize
    const onResize = () => {
      if (!containerRef.current || !engineRef.current) return;
      engineRef.current.onResize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", onResize);

    // Match Timer Countdown Display
    const timerInterval = setInterval(() => {
      if (engineRef.current) {
        setMatchTime(Math.ceil(engineRef.current.matchTimeRemaining));
      }
    }, 500);

    return () => {
      clearInterval(timerInterval);
      if (pendingLockTimeoutRef.current) {
        clearTimeout(pendingLockTimeoutRef.current);
      }
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("pointerlockerror", onPointerLockError);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      engine.destroy();
    };
  }, [handleSelectClass]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Weapon details
  const weapon = WEAPON_DEFS[activeClass];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[720px] max-h-[85vh] bg-black select-none overflow-hidden font-mono text-white rounded-xl border border-white/10 shadow-2xl cursor-crosshair"
      onClick={() => {
        if (!isLocked && !matchEnded && isAlive) {
          requestLock();
        }
      }}
    >
      {/* 1. Click to Lock / Start Overlay (Desktop) */}
      {!isLocked && isAlive && !matchEnded && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
              <Crosshair size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white font-sans uppercase">
                Krunker Voxel FPS
              </h2>
              <p className="text-xs text-amber-400/90 font-mono mt-1">
                FAST-PACED SLIDE-HOPPING · HITSCAN ARENA
              </p>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Click anywhere inside the screen to capture mouse look. Press{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-amber-300">
                Shift
              </kbd>{" "}
              while moving to slide, and immediately press{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-amber-300">
                Space
              </kbd>{" "}
              to slide-hop and build intense bhop velocity!
            </p>

            <button
              onClick={requestLock}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Target size={18} /> Click To Lock & Play
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
              <span>WASD: Move</span>
              <span>•</span>
              <span>Shift: Slide</span>
              <span>•</span>
              <span>Space: Jump</span>
              <span>•</span>
              <span>Right Click: ADS</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Damage Red Edge Flash Vignette */}
      {damageIndicator && (
        <div className="absolute inset-0 z-20 pointer-events-none border-8 border-red-600/70 bg-red-950/20 animate-pulse" />
      )}

      {/* 3. Sniper Scope Overlay (Active when Hunter sniper is ADS) */}
      {activeClass === "hunter" && isADS && isAlive && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          {/* Black outer mask */}
          <div className="absolute inset-0 bg-radial from-transparent via-black/85 to-black" />
          {/* Circular aperture */}
          <div className="relative w-[500px] h-[500px] rounded-full border-4 border-black/90 shadow-[0_0_0_2000px_rgba(0,0,0,0.94)] flex items-center justify-center">
            {/* Fine Reticle Lines */}
            <div className="absolute w-full h-[1.5px] bg-red-600/90" />
            <div className="absolute h-full w-[1.5px] bg-red-600/90" />
            {/* Center dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs shadow-red-500" />
            {/* Range notch marks */}
            <div className="absolute w-12 h-[1px] bg-zinc-400/80 -translate-y-8" />
            <div className="absolute w-16 h-[1px] bg-zinc-400/80 -translate-y-16" />
            <div className="absolute w-12 h-[1px] bg-zinc-400/80 translate-y-8" />
            <div className="absolute w-16 h-[1px] bg-zinc-400/80 translate-y-16" />
          </div>
        </div>
      )}

      {/* 4. Dynamic Central Crosshair & Hitmarker */}
      {isAlive && (!isADS || activeClass !== "hunter") && (
        <div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center">
          {/* Hitmarker X */}
          {hitmarkerActive && (
            <div className="relative w-8 h-8 flex items-center justify-center animate-in zoom-in-75 duration-75">
              <div
                className={`absolute w-4 h-0.5 rotate-45 ${
                  hitmarkerHeadshot ? "bg-red-500 shadow-md shadow-red-500" : "bg-white"
                }`}
              />
              <div
                className={`absolute w-4 h-0.5 -rotate-45 ${
                  hitmarkerHeadshot ? "bg-red-500 shadow-md shadow-red-500" : "bg-white"
                }`}
              />
              {hitmarkerHeadshot && (
                <span className="absolute -top-6 text-[10px] font-black text-red-400 tracking-wider">
                  HEADSHOT
                </span>
              )}
            </div>
          )}

          {/* Regular Crosshair Ticks */}
          {!hitmarkerActive && (
            <div className="relative flex items-center justify-center">
              {/* Center Dot */}
              <div className="w-1 h-1 rounded-full bg-white/90" />
              {/* 4 Ticks */}
              <div className="absolute -top-3 w-0.5 h-2 bg-white/85 shadow-xs" />
              <div className="absolute -bottom-3 w-0.5 h-2 bg-white/85 shadow-xs" />
              <div className="absolute -left-3 h-0.5 w-2 bg-white/85 shadow-xs" />
              <div className="absolute -right-3 h-0.5 w-2 bg-white/85 shadow-xs" />
            </div>
          )}
        </div>
      )}

      {/* 5. Top Bar: Match Timer & Scoreboard Teaser */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Top Left: Match Clock & Ping */}
        <div className="flex items-center gap-3 bg-zinc-900/85 backdrop-blur-xs border border-zinc-800/80 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{formatTime(matchTime)}</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 font-mono">FFA ARENA</span>
        </div>

        {/* Top Center: Killstreak / Score Notification Banner */}
        <div className="flex flex-col items-center gap-1">
          {scorePopups.map((popup) => (
            <div
              key={popup.id}
              style={{ color: popup.color }}
              className="text-sm font-black tracking-wider uppercase drop-shadow-md animate-in slide-in-from-top-3 fade-in duration-150"
            >
              {popup.text}
            </div>
          ))}
        </div>

        {/* Top Right: Live Killfeed */}
        <div className="flex flex-col items-end gap-1 max-w-xs">
          {killfeed.map((entry) => (
            <div
              key={entry.id}
              className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1.5 border shadow-sm backdrop-blur-xs ${
                entry.isPlayerKiller
                  ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                  : entry.isPlayerVictim
                  ? "bg-red-950/80 border-red-500/50 text-red-300"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-300"
              }`}
            >
              <span className="font-bold">{entry.killer}</span>
              <span className="text-zinc-500 text-[10px]">[{entry.weapon}]</span>
              {entry.isHeadshot && <span className="text-red-400 text-xs">🎯</span>}
              <span className="font-bold">{entry.victim}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Quick Class Selector Bar (Top-Mid left) */}
      <div className="absolute top-14 left-4 z-30 flex items-center gap-1 pointer-events-auto">
        {(["triggerman", "hunter", "run-n-gun", "vince", "detective"] as WeaponClass[]).map(
          (cls, idx) => {
            const w = WEAPON_DEFS[cls];
            const isSel = activeClass === cls;
            return (
              <button
                key={cls}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectClass(cls);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
                  isSel
                    ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                }`}
                title={`${w.category} · Press [${idx + 1}]`}
              >
                <span className="opacity-60 mr-1 text-[9px]">[{idx + 1}]</span>
                {w.className}
              </button>
            );
          }
        )}
      </div>

      {/* 7. Bottom Left: Health Bar & Class Name */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight text-white">{health}</span>
          <span className="text-xs text-zinc-400 font-bold uppercase">HP</span>
        </div>

        {/* Health Progress Bar */}
        <div className="w-52 h-3 bg-zinc-900/90 border border-zinc-700/80 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              health > 50
                ? "bg-lime-500 shadow-xs shadow-lime-500/50"
                : health > 25
                ? "bg-amber-500 shadow-xs shadow-amber-500/50"
                : "bg-red-500 shadow-xs shadow-red-500/50 animate-pulse"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (health / maxHealth) * 100))}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: weapon.primaryColor }}
          />
          <span className="font-bold text-white uppercase">{weapon.className}</span>
          <span className="text-[10px] text-zinc-500">({weapon.category})</span>
        </div>
      </div>

      {/* 8. Bottom Center: Iconic Krunker Speedometer */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-2xl font-black tracking-tighter ${
              speed > 350
                ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                : speed > 220
                ? "text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                : "text-zinc-300"
            }`}
          >
            {speed}
          </span>
          <span className="text-[10px] text-zinc-500 font-bold">U/S</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">
          SLIDE-HOP SPEED
        </span>
      </div>

      {/* 9. Bottom Right: Ammo Counter & Reload State */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-none flex flex-col items-end gap-1.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-4xl font-black tracking-tight ${
              ammo === 0 ? "text-red-500 animate-pulse" : "text-white"
            }`}
          >
            {ammo}
          </span>
          <span className="text-xl text-zinc-500 font-bold">/</span>
          <span className="text-xl text-zinc-400 font-bold">{magSize}</span>
        </div>

        {/* Reload progress bar */}
        {isReloading ? (
          <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-[11px] font-bold text-amber-400 animate-pulse uppercase tracking-wider flex items-center gap-1.5">
            <RotateCcw size={12} className="animate-spin" /> Reloading...
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            [R] RELOAD
          </span>
        )}
      </div>

      {/* 10. Top Utility Buttons (Mute, Scoreboard, Help, Fullscreen) */}
      <div className="absolute top-4 right-4 z-35 flex items-center gap-1.5 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSound();
          }}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTabScoreboard((v) => !v);
          }}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title="Toggle Scoreboard [Tab]"
        >
          <Trophy size={15} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp((v) => !v);
          }}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title="Controls & Mechanics Guide"
        >
          <HelpCircle size={15} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (containerRef.current?.requestFullscreen) {
              containerRef.current.requestFullscreen();
            }
          }}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize size={15} />
        </button>
      </div>

      {/* 11. Death Screen Overlay */}
      {!isAlive && !matchEnded && (
        <div className="absolute inset-0 z-45 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 text-center animate-in fade-in duration-200">
          <div className="max-w-sm bg-zinc-950 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 animate-bounce">
              <ShieldAlert size={28} />
            </div>

            <div>
              <h3 className="text-xl font-black text-red-500 tracking-tight uppercase">
                You Were Eliminated
              </h3>
              {killerInfo && (
                <p className="text-xs text-zinc-400 mt-1">
                  Killed by <span className="text-white font-bold">{killerInfo.killer}</span> with{" "}
                  <span className="text-amber-400">{killerInfo.weapon}</span>
                </p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRespawn();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} /> Respawn Now [Space]
            </button>
          </div>
        </div>
      )}

      {/* 12. Scoreboard Modal ([Tab] or button) */}
      {showTabScoreboard && (
        <div
          className="absolute inset-0 z-45 flex items-center justify-center bg-black/70 backdrop-blur-xs p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <h3 className="font-bold text-base text-white uppercase tracking-wider">
                  FFA Arena Scoreboard
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Time: {formatTime(matchTime)}</span>
            </div>

            <div className="divide-y divide-zinc-900 text-xs">
              <div className="grid grid-cols-12 py-1.5 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Player</span>
                <span className="col-span-2 text-center">Kills</span>
                <span className="col-span-2 text-center">Deaths</span>
                <span className="col-span-2 text-right">Score</span>
              </div>

              {leaderboard.map((player, idx) => (
                <div
                  key={player.name}
                  className={`grid grid-cols-12 py-2 items-center ${
                    player.isPlayer
                      ? "text-amber-300 font-bold bg-amber-500/10 -mx-2 px-2 rounded"
                      : "text-zinc-300"
                  }`}
                >
                  <span className="col-span-1 text-zinc-500">{idx + 1}</span>
                  <span className="col-span-5 flex items-center gap-1.5">
                    {player.name}
                    {player.isPlayer && (
                      <span className="text-[9px] px-1 bg-amber-400/20 text-amber-400 rounded">
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 text-center font-mono">{player.kills}</span>
                  <span className="col-span-2 text-center font-mono text-zinc-400">
                    {player.deaths}
                  </span>
                  <span className="col-span-2 text-right font-mono font-bold">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-zinc-500 text-center pt-2">
              Press [Tab] or click outside to close
            </p>
          </div>
        </div>
      )}

      {/* 13. Help & Controls Modal */}
      {showHelp && (
        <div
          className="absolute inset-0 z-45 flex items-center justify-center bg-black/75 backdrop-blur-xs p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <Flame size={18} /> Krunker Mechanics & Controls
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div>
                <p className="font-bold text-white">Slide-Hopping & Bhop:</p>
                <p className="text-zinc-400 mt-0.5">
                  Hold <kbd className="px-1 bg-zinc-800 rounded">W</kbd> + press{" "}
                  <kbd className="px-1 bg-zinc-800 rounded">Shift</kbd> to slide, then instantly
                  press <kbd className="px-1 bg-zinc-800 rounded">Space</kbd> to jump. In air, you
                  retain full momentum. Repeat on landing to build speeds over 300+ units/sec!
                </p>
              </div>

              <div>
                <p className="font-bold text-white">Jump Pads:</p>
                <p className="text-zinc-400 mt-0.5">
                  Step on any glowing cyan jump pad in the courtyards to launch 25 meters skyward for
                  high-altitude aerial frags!
                </p>
              </div>

              <div>
                <p className="font-bold text-white">Vince Shotgun Jump:</p>
                <p className="text-zinc-400 mt-0.5">
                  Select <span className="text-red-400 font-bold">Vince</span>, jump in the air, look
                  straight down, and fire to propel yourself upwards on recoil!
                </p>
              </div>

              <div>
                <p className="font-bold text-white">Hitscan & Headshots:</p>
                <p className="text-zinc-400 mt-0.5">
                  Bullets are instant hitscan raycasts. Aim for the blocky head for 1.5x–2.0x
                  damage, headshot ding, and fast kills.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14. Match End Victory / Defeat Modal */}
      {matchEnded && finalStats && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-md w-full bg-zinc-950 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy size={32} />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                Match Complete
              </h2>
              <p className="text-xs text-amber-400 mt-1">
                Winner: <span className="font-bold">{matchWinner}</span>
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Kills</span>
                <span className="text-xl font-black text-amber-400">{finalStats.kills}</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Deaths</span>
                <span className="text-xl font-black text-zinc-300">{finalStats.deaths}</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Headshots</span>
                <span className="text-xl font-black text-red-400">{finalStats.headshots}</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Accuracy</span>
                <span className="text-lg font-black text-cyan-400">
                  {finalStats.shotsFired > 0
                    ? Math.round((finalStats.shotsHit / finalStats.shotsFired) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Top Speed</span>
                <span className="text-lg font-black text-lime-400">
                  {Math.round(finalStats.topSpeed * 10)}
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Score</span>
                <span className="text-lg font-black text-amber-300">{finalStats.score}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setMatchEnded(false);
                if (engineRef.current) {
                  engineRef.current.matchTimeRemaining = 240;
                  engineRef.current.isMatchEnded = false;
                  engineRef.current.spawnPlayer();
                  requestLock();
                }
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} /> Play Another Match
            </button>

            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-xl border border-zinc-800 cursor-pointer"
              >
                Back to Arcade Hub
              </button>
            )}
          </div>
        </div>
      )}

      {/* 15. Mobile Touch Controls (When touch screen detected) */}
      {isMobile && isAlive && !matchEnded && (
        <div className="absolute inset-0 z-35 pointer-events-none">
          {/* Left Virtual Move Area */}
          <div
            className="absolute bottom-6 left-6 w-36 h-36 rounded-full bg-white/10 border-2 border-white/20 pointer-events-auto flex items-center justify-center touch-none"
            onTouchStart={(e) => {
              const touch = e.changedTouches[0];
              touchMoveRef.current = { id: touch.identifier, startX: touch.clientX, startY: touch.clientY };
            }}
            onTouchMove={(e) => {
              if (!touchMoveRef.current || !engineRef.current) return;
              for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === touchMoveRef.current.id) {
                  const dx = t.clientX - touchMoveRef.current.startX;
                  const dy = t.clientY - touchMoveRef.current.startY;
                  engineRef.current.keys["KeyW"] = dy < -15;
                  engineRef.current.keys["KeyS"] = dy > 15;
                  engineRef.current.keys["KeyA"] = dx < -15;
                  engineRef.current.keys["KeyD"] = dx > 15;
                }
              }
            }}
            onTouchEnd={() => {
              touchMoveRef.current = null;
              if (engineRef.current) {
                engineRef.current.keys["KeyW"] = false;
                engineRef.current.keys["KeyS"] = false;
                engineRef.current.keys["KeyA"] = false;
                engineRef.current.keys["KeyD"] = false;
              }
            }}
          >
            <span className="text-[10px] text-white/50 font-bold">MOVE</span>
          </div>

          {/* Right Touch Aim Area */}
          <div
            className="absolute top-20 right-0 bottom-24 left-44 pointer-events-auto touch-none"
            onTouchStart={(e) => {
              const touch = e.changedTouches[0];
              touchLookRef.current = { id: touch.identifier, lastX: touch.clientX, lastY: touch.clientY };
            }}
            onTouchMove={(e) => {
              if (!touchLookRef.current || !engineRef.current) return;
              for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === touchLookRef.current.id) {
                  const dx = t.clientX - touchLookRef.current.lastX;
                  const dy = t.clientY - touchLookRef.current.lastY;
                  engineRef.current.onMouseMove(dx * 1.8, dy * 1.8);
                  touchLookRef.current.lastX = t.clientX;
                  touchLookRef.current.lastY = t.clientY;
                }
              }
            }}
            onTouchEnd={() => {
              touchLookRef.current = null;
            }}
          />

          {/* Right Action Buttons: Fire, Jump, Slide, ADS, Reload */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              {/* ADS Button */}
              <button
                onTouchStart={() => {
                  if (engineRef.current) {
                    engineRef.current.isRightMouseDown = true;
                    setIsADS(true);
                  }
                }}
                onTouchEnd={() => {
                  if (engineRef.current) {
                    engineRef.current.isRightMouseDown = false;
                    setIsADS(false);
                  }
                }}
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                  isADS
                    ? "bg-amber-500 border-amber-400 text-black"
                    : "bg-black/60 border-white/30 text-white"
                }`}
              >
                ADS
              </button>

              {/* Jump Button */}
              <button
                onTouchStart={() => {
                  if (engineRef.current) engineRef.current.keys["Space"] = true;
                }}
                onTouchEnd={() => {
                  if (engineRef.current) engineRef.current.keys["Space"] = false;
                }}
                className="w-14 h-14 rounded-full bg-sky-500/70 border-2 border-sky-400 text-white font-bold text-xs flex items-center justify-center active:scale-95"
              >
                JUMP
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Slide Button */}
              <button
                onTouchStart={() => {
                  if (engineRef.current) engineRef.current.keys["ShiftLeft"] = true;
                }}
                onTouchEnd={() => {
                  if (engineRef.current) engineRef.current.keys["ShiftLeft"] = false;
                }}
                className="w-14 h-14 rounded-full bg-emerald-500/70 border-2 border-emerald-400 text-white font-bold text-xs flex items-center justify-center active:scale-95"
              >
                SLIDE
              </button>

              {/* Fire Button */}
              <button
                onTouchStart={() => {
                  if (engineRef.current) engineRef.current.isMouseDown = true;
                }}
                onTouchEnd={() => {
                  if (engineRef.current) engineRef.current.isMouseDown = false;
                }}
                className="w-16 h-16 rounded-full bg-red-600/90 border-2 border-red-400 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95"
              >
                FIRE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KrunkerCanvas;
