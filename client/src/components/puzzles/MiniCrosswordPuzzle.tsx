import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { OrbitAudio } from "@/game/audio";
import { miniCrosswordEditionForDate, type MiniCrosswordEdition, type CrosswordClue } from "@/game/logicPuzzles/miniCrosswordBank";
import { isCrosswordSolved, getClueNumberAt } from "@/game/logicPuzzles/miniCrossword";
import { markPuzzleFieldComplete } from "@/lib/puzzleCompletion";
import GameAudioControls from "@/components/GameAudioControls";
import { 
  ArrowLeft, 
  Check, 
  HelpCircle, 
  Lightbulb, 
  RotateCcw, 
  Share2, 
  Sparkles, 
  Timer, 
  Trophy, 
  X, 
  ChevronRight,
  Swords,
  Send
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

export default function MiniCrosswordPuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: MiniCrosswordEdition = useMemo(() => miniCrosswordEditionForDate(dateStr), [dateStr]);

  const [grid, setGrid] = useState<string[][]>(() => Array.from({ length: 5 }, () => Array(5).fill("")));
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [direction, setDirection] = useState<"A" | "D">("A"); // Across | Down
  const [isSolved, setIsSolved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize or on date change / reset
  const handleReset = () => {
    audio.current.play("rotate");
    setGrid(Array.from({ length: 5 }, () => Array(5).fill("")));
    setSelectedCell({ r: 0, c: 0 });
    setDirection("A");
    setIsSolved(false);
    setSeconds(0);
  };

  useEffect(() => {
    handleReset();
  }, [edition]);

  // Check solved
  useEffect(() => {
    if (isSolved) return;
    if (isCrosswordSolved(grid, edition)) {
      setIsSolved(true);
      markPuzzleFieldComplete("mini-crossword", edition.id);
      markPuzzleFieldComplete(`mini-crossword-crossword-${edition.id.replace(/^mini-cross-/, "")}`, dateStr);
      audio.current.play("puzzleSolve");
    }
  }, [grid, edition, isSolved, dateStr]);

  // Timer
  useEffect(() => {
    if (isSolved) return;
    const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isSolved]);

  // Peer-to-Peer Automated Challenge System
  const challengeInfo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const by = params.get("by");
    const targetSecs = Number(params.get("time")) || 0;
    if (by || targetSecs > 0) {
      return { by: by || "A Friend", targetSecs };
    }
    return null;
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Find active clue for the selected cell
  const activeClue = useMemo(() => {
    const { r, c } = selectedCell;
    if (direction === "A") {
      return edition.clues.find((clue) => clue.dir === "A" && clue.row === r);
    } else {
      return edition.clues.find((clue) => clue.dir === "D" && clue.col === c);
    }
  }, [direction, edition.clues, selectedCell]);

  const handleCellClick = (r: number, c: number) => {
    if (edition.grid[r][c] === "#") return;
    audio.current.play("toggle");

    if (selectedCell.r === r && selectedCell.c === c) {
      // Toggle direction
      setDirection((prev) => (prev === "A" ? "D" : "A"));
    } else {
      setSelectedCell({ r, c });
    }
  };

  const handleClueClick = (clue: CrosswordClue) => {
    audio.current.play("toggle");
    setDirection(clue.dir);
    setSelectedCell({ r: clue.row, c: clue.col });
  };

  const handleKeyPress = useCallback((key: string) => {
    if (isSolved) return;

    const { r, c } = selectedCell;

    if (key === "BACKSPACE" || key === "DELETE") {
      audio.current.play("toggle");
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = "";
        return next;
      });

      // Step back
      if (direction === "A" && c > 0) {
        setSelectedCell({ r, c: c - 1 });
      } else if (direction === "D" && r > 0) {
        setSelectedCell({ r: r - 1, c });
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(key)) {
      audio.current.play("fragment");
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = key.toUpperCase();
        return next;
      });

      // Advance cursor
      if (direction === "A") {
        if (c < 4 && edition.grid[r][c + 1] !== "#") {
          setSelectedCell({ r, c: c + 1 });
        }
      } else {
        if (r < 4 && edition.grid[r + 1][c] !== "#") {
          setSelectedCell({ r: r + 1, c });
        }
      }
    }
  }, [direction, edition.grid, isSolved, selectedCell]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        handleKeyPress("BACKSPACE");
      } else if (e.key === "ArrowLeft") {
        if (selectedCell.c > 0) setSelectedCell((p) => ({ ...p, c: p.c - 1 }));
      } else if (e.key === "ArrowRight") {
        if (selectedCell.c < 4) setSelectedCell((p) => ({ ...p, c: p.c + 1 }));
      } else if (e.key === "ArrowUp") {
        if (selectedCell.r > 0) setSelectedCell((p) => ({ ...p, r: p.r - 1 }));
      } else if (e.key === "ArrowDown") {
        if (selectedCell.r < 4) setSelectedCell((p) => ({ ...p, r: p.r + 1 }));
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setDirection((prev) => (prev === "A" ? "D" : "A"));
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, selectedCell]);

  const handleHint = () => {
    if (isSolved) return;
    const { r, c } = selectedCell;
    const target = edition.grid[r][c];
    if (target && target !== "#") {
      audio.current.play("relayCorrect");
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = target.toUpperCase();
        return next;
      });
    } else {
      // Find first empty cell
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (edition.grid[row][col] !== "#" && grid[row][col] !== edition.grid[row][col]) {
            audio.current.play("relayCorrect");
            setGrid((prev) => {
              const next = prev.map((rw) => [...rw]);
              next[row][col] = edition.grid[row][col].toUpperCase();
              return next;
            });
            setSelectedCell({ r: row, c: col });
            return;
          }
        }
      }
    }
  };

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/mini-crossword?by=Friend&time=${seconds}`;
  };

  const getViralShareText = () => {
    const challengeUrl = getChallengeUrl();
    return `📰 Mini Crossword #${edition.date} 👑 100% SOLVED!\n` +
      `⏱️ Time: ${formatTime(seconds)}\n` +
      `🟩 5×5 Daily Speed Crossword\n\n` +
      `⚔️ Can you solve it faster? Tap here:\n` +
      `${challengeUrl}`;
  };

  const handleWhatsAppShare = () => {
    audio.current.play("relayCorrect");
    const text = getViralShareText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleTwitterShare = () => {
    audio.current.play("relayCorrect");
    const text = getViralShareText();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShare = () => {
    const shareText = getViralShareText();
    const challengeUrl = getChallengeUrl();

    if (navigator.share) {
      navigator.share({
        title: `Toolbox Galaxy Mini Crossword Challenge`,
        text: shareText,
        url: challengeUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="logic-game-page flex flex-col h-screen max-h-screen overflow-hidden select-none bg-[#090d16] text-[#f4f2ea]">
      {/* Compact Standard Header Bar matching Queens/Mini-Sudoku */}
      <header className="shrink-0 h-14 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/games" className="logic-action">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Games Bay</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={orbitMark} alt="" className="w-6 h-6 object-contain" />
            <div className="leading-none">
              <h1 className="text-sm font-bold text-white tracking-tight">Mini Crossword</h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">5×5 Daily Speed Puzzle</span>
            </div>
          </div>
        </div>

        {/* Standard Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-emerald-400 font-mono text-xs font-semibold shadow-inner">
            <Timer size={13} className="text-emerald-400" />
            <span>{formatTime(seconds)}</span>
          </div>

          <GameAudioControls audio={audio} music />

          <button
            type="button"
            className="logic-action"
            onClick={() => setShowRules(!showRules)}
            title="How to play & rules"
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button 
            type="button" 
            className="logic-action" 
            onClick={handleHint} 
            title="Reveal 1 square hint"
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <button 
            type="button" 
            className="logic-action" 
            onClick={handleReset} 
            title="Reset board"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button 
            type="button" 
            className="logic-action logic-action--primary" 
            onClick={handleShare}
            title="Share puzzle score"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full flex flex-col lg:flex-row gap-6 items-center justify-center">
        {/* Left Column: Active Clue + 5x5 Grid */}
        <div className="flex flex-col items-center max-w-sm w-full">
          {/* Automated Peer-to-Peer Challenge Inbound Banner */}
          {challengeInfo && (
            <div className="w-full mb-3 p-2.5 bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-blue-500/15 border border-blue-500/40 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <Swords size={15} />
                </div>
                <div>
                  <span className="text-blue-300 font-bold block">
                    Challenge from {challengeInfo.by}!
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Target: <strong className="text-white font-mono">{challengeInfo.targetSecs > 0 ? formatTime(challengeInfo.targetSecs) : "Beat the clock"}</strong>
                  </span>
                </div>
              </div>
              {challengeInfo.targetSecs > 0 && (
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    seconds < challengeInfo.targetSecs
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {seconds < challengeInfo.targetSecs ? "On Pace ⚡" : "Over Target"}
                </span>
              )}
            </div>
          )}

          {/* Active Highlighted Clue Banner */}
          <div className="w-full mb-3 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 min-h-[44px] flex items-center gap-2 text-xs">
            <span className="font-bold text-[#c7f36b] uppercase shrink-0">
              {activeClue ? `${activeClue.num}${activeClue.dir}` : "1A"}:
            </span>
            <span className="text-slate-200 line-clamp-2">
              {activeClue ? activeClue.clue : "Select a square to begin"}
            </span>
          </div>

          {/* 5x5 Crossword Grid */}
          <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-white/15 shadow-2xl">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => {
                const isBlack = edition.grid[r][c] === "#";
                const isSelected = selectedCell.r === r && selectedCell.c === c;
                const isInActiveWord =
                  activeClue &&
                  ((direction === "A" && activeClue.row === r) || (direction === "D" && activeClue.col === c));
                const clueNum = getClueNumberAt(r, c, edition);
                const letter = grid[r][c];

                if (isBlack) {
                  return <div key={`${r}-${c}`} className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 rounded-lg" />;
                }

                let bgStyle = "bg-slate-900/90 text-white border-white/10 hover:border-white/30";
                if (isSelected) {
                  bgStyle = "bg-[#c7f36b] text-[#090d16] border-[#c7f36b] font-black shadow-lg shadow-[#c7f36b]/20";
                } else if (isInActiveWord) {
                  bgStyle = "bg-blue-950/80 text-blue-200 border-blue-500/40";
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center font-bold text-lg sm:text-xl transition-all ${bgStyle}`}
                  >
                    {clueNum && (
                      <span
                        className={`absolute top-0.5 left-1 text-[9px] font-mono leading-none ${
                          isSelected ? "text-[#090d16]/70" : "text-slate-400"
                        }`}
                      >
                        {clueNum}
                      </span>
                    )}
                    <span>{letter}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Grid Toolbar */}
          <div className="mt-3 flex gap-2 w-full justify-center">
            <button
              type="button"
              onClick={handleHint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Lightbulb size={13} className="text-amber-400" />
              <span>Reveal Square</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clues List */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Across Clues */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c7f36b] flex items-center gap-1.5">
              <span>Across</span>
            </h4>
            <div className="space-y-1 text-xs">
              {edition.clues
                .filter((c) => c.dir === "A")
                .map((clue) => {
                  const isActive = activeClue?.num === clue.num && activeClue?.dir === "A";
                  return (
                    <button
                      key={`A-${clue.num}`}
                      type="button"
                      onClick={() => handleClueClick(clue)}
                      className={`w-full text-left p-1.5 rounded-lg transition-colors flex gap-2 ${
                        isActive ? "bg-blue-600/30 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="font-bold text-slate-300 shrink-0 w-4">{clue.num}</span>
                      <span className="line-clamp-1">{clue.clue}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Down Clues */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <span>Down</span>
            </h4>
            <div className="space-y-1 text-xs">
              {edition.clues
                .filter((c) => c.dir === "D")
                .map((clue) => {
                  const isActive = activeClue?.num === clue.num && activeClue?.dir === "D";
                  return (
                    <button
                      key={`D-${clue.num}`}
                      type="button"
                      onClick={() => handleClueClick(clue)}
                      className={`w-full text-left p-1.5 rounded-lg transition-colors flex gap-2 ${
                        isActive ? "bg-blue-600/30 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="font-bold text-slate-300 shrink-0 w-4">{clue.num}</span>
                      <span className="line-clamp-1">{clue.clue}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Solved Banner */}
          {isSolved && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3 shadow-xl animate-in zoom-in-95">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Crossword Solved!</h3>
                <p className="text-xs text-slate-300">Finished in {formatTime(seconds)}.</p>
              </div>

              {/* Inbound Challenge Result */}
              {challengeInfo && challengeInfo.targetSecs > 0 && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between shadow-inner ${
                    seconds <= challengeInfo.targetSecs
                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                      : "bg-amber-950/50 border-amber-500/40 text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{seconds <= challengeInfo.targetSecs ? "🏆" : "⏱️"}</span>
                    <span className="font-bold">
                      {seconds < challengeInfo.targetSecs
                        ? `You beat ${challengeInfo.by}!`
                        : seconds === challengeInfo.targetSecs
                        ? `Tied with ${challengeInfo.by}!`
                        : `${challengeInfo.by} was faster!`}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    {seconds <= challengeInfo.targetSecs
                      ? `-${challengeInfo.targetSecs - seconds}s ⚡`
                      : `+${seconds - challengeInfo.targetSecs}s`}
                  </span>
                </div>
              )}

              {/* 1-Click Viral Distribution */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <Send size={13} className="rotate-45" />
                  <span>WhatsApp Challenge</span>
                </button>

                <button
                  type="button"
                  onClick={handleTwitterShare}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <span className="font-mono font-black text-sm">𝕏</span>
                  <span>Share on X</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 rounded-xl bg-[#c7f36b] text-[#090d16] font-extrabold text-xs hover:bg-[#d6f685] transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 size={14} />
                <span>{copied ? "Copied Challenge Link!" : "Copy Challenge Link"}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e1628] border border-white/20 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base">How to Play Mini Crossword</h3>
              <button type="button" onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>• Fill in the 5×5 grid with words based on the Across and Down clues.</p>
              <p>• Tap a square to select it. Tap again to switch between Across and Down.</p>
              <p>• Type using your physical keyboard or tap a clue on the side to jump to that word.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Start Solving!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
