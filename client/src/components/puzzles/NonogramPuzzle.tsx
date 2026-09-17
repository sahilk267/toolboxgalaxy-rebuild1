import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { OrbitAudio } from "@/game/audio";
import {
  getNonogramEditionForDate,
  type NonogramEdition
} from "@/game/logicPuzzles/nonogramBank";
import { markPuzzleFieldComplete } from "@/lib/puzzleCompletion";
import GameAudioControls from "@/components/GameAudioControls";
import {
  ArrowLeft,
  Check,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  X,
  Pencil,
  Eye
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

// Cell states: 0 = empty, 1 = filled, 2 = crossed
type CellState = 0 | 1 | 2;

export default function NonogramPuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: NonogramEdition = useMemo(() => getNonogramEditionForDate(dateStr), [dateStr]);

  const [grid, setGrid] = useState<CellState[][]>(() =>
    Array.from({ length: edition.size }, () => Array(edition.size).fill(0))
  );
  const [activeTool, setActiveTool] = useState<"fill" | "cross">("fill");
  const [isSolved, setIsSolved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [hintCount, setHintCount] = useState(0);

  // Sync grid when edition changes
  useEffect(() => {
    handleReset();
  }, [edition]);

  // Live Timer
  useEffect(() => {
    if (isSolved) return;
    const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isSolved]);

  // Check if grid matches solution
  useEffect(() => {
    if (isSolved) return;

    let solved = true;
    for (let r = 0; r < edition.size; r++) {
      for (let c = 0; c < edition.size; c++) {
        const expected = edition.solution[r][c] === 1;
        const actual = grid[r][c] === 1;
        if (expected !== actual) {
          solved = false;
          break;
        }
      }
      if (!solved) break;
    }

    if (solved) {
      setIsSolved(true);
      markPuzzleFieldComplete("nonogram", edition.id);
      audio.current.play("puzzleSolve");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setShowVictoryModal(true);
      }, 700);
    }
  }, [grid, edition, isSolved]);

  const handleReset = () => {
    audio.current.play("rotate");
    setGrid(Array.from({ length: edition.size }, () => Array(edition.size).fill(0)));
    setIsSolved(false);
    setShowVictoryModal(false);
    setHintCount(0);
  };

  const handleCellClick = (r: number, c: number, overrideTool?: "fill" | "cross") => {
    if (isSolved) return;

    const tool = overrideTool || activeTool;
    audio.current.play("rotate");

    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const current = next[r][c];

      if (tool === "fill") {
        next[r][c] = current === 1 ? 0 : 1;
      } else {
        next[r][c] = current === 2 ? 0 : 2;
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    handleCellClick(r, c, "cross");
  };

  const handleHint = () => {
    if (isSolved) return;
    audio.current.play("relayCorrect");

    // Find first cell that differs from solution
    for (let r = 0; r < edition.size; r++) {
      for (let c = 0; c < edition.size; c++) {
        const expected = edition.solution[r][c];
        const actual = grid[r][c];
        if (expected === 1 && actual !== 1) {
          setGrid((prev) => {
            const next = prev.map((row) => [...row]);
            next[r][c] = 1;
            return next;
          });
          setHintCount((h) => h + 1);
          return;
        } else if (expected === 0 && actual === 1) {
          setGrid((prev) => {
            const next = prev.map((row) => [...row]);
            next[r][c] = 2; // Mark cross
            return next;
          });
          setHintCount((h) => h + 1);
          return;
        }
      }
    }
  };

  // Determine if row clues are satisfied
  const isRowSatisfied = (r: number) => {
    const filledBlocks: number[] = [];
    let count = 0;
    for (let c = 0; c < edition.size; c++) {
      if (grid[r][c] === 1) {
        count++;
      } else if (count > 0) {
        filledBlocks.push(count);
        count = 0;
      }
    }
    if (count > 0) filledBlocks.push(count);
    if (filledBlocks.length === 0) filledBlocks.push(0);

    const target = edition.rowClues[r];
    return JSON.stringify(filledBlocks) === JSON.stringify(target);
  };

  // Determine if column clues are satisfied
  const isColSatisfied = (c: number) => {
    const filledBlocks: number[] = [];
    let count = 0;
    for (let r = 0; r < edition.size; r++) {
      if (grid[r][c] === 1) {
        count++;
      } else if (count > 0) {
        filledBlocks.push(count);
        count = 0;
      }
    }
    if (count > 0) filledBlocks.push(count);
    if (filledBlocks.length === 0) filledBlocks.push(0);

    const target = edition.colClues[c];
    return JSON.stringify(filledBlocks) === JSON.stringify(target);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="logic-game-page flex flex-col h-screen max-h-screen overflow-hidden select-none bg-[#090d16] text-[#f4f2ea]">
      {/* Top Standard Action Bar */}
      <header className="shrink-0 h-14 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/games" className="logic-action">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">GAMES BAY</span>
          </Link>
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <img src={orbitMark} alt="" className="w-6 h-6 object-contain" />
            <div className="leading-none">
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Nonogram Griddlers <span className="text-cyan-400 text-xs">⬛</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                Picross Numerical Picture Logic
              </span>
            </div>
          </div>
        </div>

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
            title="Nonogram rules"
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button
            type="button"
            className="logic-action"
            onClick={handleHint}
            title="Reveal a cell hint"
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <button
            type="button"
            className="logic-action"
            onClick={handleReset}
            title="Reset puzzle"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Grid Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          {/* Objective Banner */}
          <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300 font-semibold">{edition.title}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              5×5 Griddler
            </span>
          </div>

          {/* Mode Switcher Tools */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTool("fill")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition ${
                activeTool === "fill"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Pencil size={14} />
              <span>Fill (⬛)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("cross")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition ${
                activeTool === "cross"
                  ? "bg-rose-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <X size={14} />
              <span>Cross (❌)</span>
            </button>
          </div>

          {/* Picross Grid Container */}
          <div className="p-3 sm:p-5 bg-[#131b2b] rounded-2xl border-2 border-[#2b3850] shadow-2xl flex flex-col items-end">
            {/* Top Column Clues */}
            <div className="flex ml-auto mb-1.5">
              {edition.colClues.map((clues, c) => {
                const satisfied = isColSatisfied(c);
                return (
                  <div
                    key={`col-${c}`}
                    className={`w-11 sm:w-14 flex flex-col items-center justify-end pb-1 text-xs font-mono font-bold transition-colors ${
                      satisfied ? "text-cyan-400/40" : "text-cyan-300"
                    }`}
                  >
                    {clues.map((num, i) => (
                      <span key={i} className="leading-tight">
                        {num}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Rows with Left Row Clues + Cells */}
            <div className="flex flex-col gap-1.5">
              {grid.map((row, r) => {
                const satisfied = isRowSatisfied(r);
                return (
                  <div key={`row-${r}`} className="flex items-center gap-1.5">
                    {/* Row Clue Header */}
                    <div
                      className={`w-16 sm:w-20 flex items-center justify-end pr-2 text-xs font-mono font-bold transition-colors gap-1.5 ${
                        satisfied ? "text-cyan-400/40" : "text-cyan-300"
                      }`}
                    >
                      {edition.rowClues[r].map((num, i) => (
                        <span key={i}>{num}</span>
                      ))}
                    </div>

                    {/* Row Cells */}
                    <div className="flex gap-1.5">
                      {row.map((cell, c) => {
                        return (
                          <button
                            key={`${r}-${c}`}
                            type="button"
                            onClick={() => handleCellClick(r, c)}
                            onContextMenu={(e) => handleContextMenu(e, r, c)}
                            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-bold text-lg transition-all shadow-inner select-none ${
                              cell === 1
                                ? "bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95"
                                : cell === 2
                                ? "bg-[#182233] text-rose-400 hover:bg-[#202c42]"
                                : "bg-[#253248] hover:bg-[#2e3e59] active:scale-95"
                            }`}
                          >
                            {cell === 2 && <X size={20} className="stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-mono">
            Left click to toggle mode · Right click to place/remove Cross (❌)
          </p>
        </div>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="text-cyan-400" size={20} />
                How to Play Nonogram (Picross)
              </h2>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-slate-300 space-y-2.5">
              <p>
                Nonograms are picture logic puzzles where numbers outside the grid tell you how many consecutive filled squares exist in that row or column.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li>A number like <b>5</b> means 5 consecutive filled squares in that line.</li>
                <li>Numbers like <b>1 1</b> mean two separate blocks of 1 filled square, with at least one empty space between them.</li>
                <li>Use <b>Fill (⬛)</b> to mark verified tiles, and <b>Cross (❌)</b> to mark cells that must stay empty.</li>
                <li>Once all rows and columns match the numbers, the secret picture is revealed!</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition"
            >
              Start Griddler
            </button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/10">
              {edition.symbol}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Picture Revealed!</h2>
              <p className="text-xs text-cyan-400 font-mono font-semibold">{edition.title}</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/10">
              Congratulations! You solved today's numerical logic picture in{" "}
              <b className="text-emerald-400 font-mono">{formatTime(seconds)}</b>
              {hintCount > 0 ? ` with ${hintCount} hint${hintCount > 1 ? "s" : ""}.` : " with zero hints!"}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition"
              >
                Replay
              </button>
              <Link
                href="/games"
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition flex items-center justify-center"
              >
                Games Bay
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
