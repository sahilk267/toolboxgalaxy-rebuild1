// Toolbox Galaxy: Premium LinkedIn-grade Single-Screen Daily Logic Puzzles with verified local rule engines
import GameAudioControls from "@/components/GameAudioControls";
import { OrbitAudio } from "@/game/audio";
import { isPuzzleFieldComplete, markPuzzleFieldComplete } from "@/lib/puzzleCompletion";
import { baseToDisplay, displayToBase, getLogicDaily, type LogicDaily } from "@/game/logicPuzzles/daily";
import { cloneGrid, sameCell } from "@/game/logicPuzzles/core";
import type { Cell } from "@/game/logicPuzzles/core";
import { miniSudokuEditionBank, miniSudokuEditionForDate, solvedSudoku, sudokuConflicts, type SudokuGrid } from "@/game/logicPuzzles/miniSudoku";
import { queensEditionBank, queensEditionForDate, solvedQueens, queensViolations, type QueenState } from "@/game/logicPuzzles/queens";
import { solvedPatches, validPatch, type Patch } from "@/game/logicPuzzles/patches";
import { tangoGivens, tangoSolution, tangoViolations, solvedTango as solvedTangoEngine, type TangoGrid, type TangoValue } from "@/game/logicPuzzles/tango";
import { tangoEditionBank, tangoEditionForDate } from "@/game/logicPuzzles/tangoBank";
import { patchCells } from "@/game/logicPuzzles/patches";
import { patchesEditionBank, patchesEditionForDate } from "@/game/logicPuzzles/patchesBank";
import { solvedZip, validZipPath, zipEditionBank, zipEditionForDate } from "@/game/logicPuzzles/zip";
import { matchesWendWord, solvedWend, validWendPath, wordFromPath } from "@/game/logicPuzzles/wend";
import { wendEditionBank, wendEditionForDate } from "@/game/logicPuzzles/wendBank";
import ConnectionsPuzzle from "@/components/puzzles/ConnectionsPuzzle";
import WordlePuzzle from "@/components/puzzles/WordlePuzzle";
import MiniCrosswordPuzzle from "@/components/puzzles/MiniCrosswordPuzzle";
import HivePuzzle from "@/components/puzzles/HivePuzzle";
import StrandsPuzzle from "@/components/puzzles/StrandsPuzzle";
import ChessPuzzle from "@/components/puzzles/ChessPuzzle";
import NonogramPuzzle from "@/components/puzzles/NonogramPuzzle";
import { 
  ArrowLeft, 
  CalendarDays, 
  Check, 
  Crown, 
  Eraser, 
  HelpCircle, 
  Lightbulb, 
  Moon, 
  RotateCcw, 
  Share2, 
  Sparkles, 
  Sun, 
  Timer, 
  Trophy, 
  X,
  Volume2,
  Swords,
  Send
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { Link, useRoute } from "wouter";

const orbitMark = "/orbit-mark.svg";
const demoMode = () => new URLSearchParams(window.location.search).has("demo");
const cellKey = (row: number, col: number) => `${row}:${col}`;
const emptyQueens = () => Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => "empty" as QueenState));

function usePuzzleCompletion(slug: string, daily: LogicDaily, solved: boolean, demo: boolean) {
  const [completed, setCompleted] = useState(() => isPuzzleFieldComplete(slug, daily.id));
  useEffect(() => { 
    if (solved && !demo) { 
      markPuzzleFieldComplete(slug, daily.id); 
      setCompleted(true); 
    } 
  }, [daily.id, demo, slug, solved]);
  return completed;
}

interface PuzzleFrameProps {
  eyebrow: string;
  title: string;
  rules: string;
  howToPlay: string[];
  children: ReactNode;
  solved: boolean;
  onReset: () => void;
  onHint: () => void;
  audio: MutableRefObject<OrbitAudio>;
  daily: LogicDaily;
  feedback: string;
  progress: { label: string; value: number; total: number };
  completedOnDevice: boolean;
  extraControls?: ReactNode;
}

function PuzzleFrame({
  eyebrow,
  title,
  rules,
  howToPlay,
  children,
  solved,
  onReset,
  onHint,
  audio,
  daily,
  feedback,
  progress,
  extraControls
}: PuzzleFrameProps) {
  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Live Timer
  useEffect(() => {
    if (solved) return;
    const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [solved]);

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

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    const path = typeof window !== "undefined" ? window.location.pathname : "/games";
    return `${origin}${path}?by=Friend&time=${seconds}`;
  };

  const getViralShareText = () => {
    const challengeUrl = getChallengeUrl();
    return `🧠 ${title} #${daily.id} 👑 100% SOLVED!\n` +
      `⏱️ Time: ${formatTime(seconds)}\n` +
      `✨ ${progress.label}: ${progress.value}/${progress.total}\n\n` +
      `⚔️ Can you beat my time? Tap here:\n` +
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

  // Real URL sharing with fallback & viral challenge link
  const shareScore = () => {
    const shareText = getViralShareText();
    const challengeUrl = getChallengeUrl();
    
    if (navigator.share) {
      navigator.share({
        title: `Toolbox Galaxy • ${title} Challenge`,
        text: shareText,
        url: challengeUrl
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
    <div className="logic-game-page flex flex-col h-screen max-h-screen overflow-hidden select-none">
      {/* Compact Top Navigation Bar */}
      <header className="shrink-0 h-14 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/games" className="logic-action">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Games Bay</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={orbitMark} alt="" className="w-6 h-6 object-contain" />
            <div className="leading-none">
              <h1 className="text-sm font-bold text-white tracking-tight">{title}</h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">{eyebrow}</span>
            </div>
          </div>
        </div>

        {/* Action controls right in top bar */}
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
            onClick={onHint} 
            title="Reveal 1 verified hint"
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <button 
            type="button" 
            className="logic-action" 
            onClick={onReset} 
            title="Reset board"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button 
            type="button" 
            className="logic-action logic-action--primary" 
            onClick={shareScore}
            title="Share puzzle link & score"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* Main Single-Screen Playfield Container */}
      <main className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 max-w-4xl w-full mx-auto overflow-hidden relative">
        {/* Automated Peer-to-Peer Challenge Inbound Banner */}
        {challengeInfo && (
          <div className="w-full mb-1.5 p-2 px-3 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs animate-in fade-in shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                <Swords size={13} />
              </div>
              <div>
                <span className="text-amber-300 font-bold">Challenge from {challengeInfo.by}!</span>
                {challengeInfo.targetSecs > 0 && (
                  <span className="text-[11px] text-slate-400 ml-1.5">
                    Target: <strong className="text-white font-mono">{formatTime(challengeInfo.targetSecs)}</strong>
                  </span>
                )}
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

        {/* Subtle subheader with status pill and stats */}
        <div className="w-full flex items-center justify-between px-2 text-xs shrink-0 mb-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {daily.difficulty} FIELD
            </span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <CalendarDays size={12} /> {daily.id}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider">{progress.label}:</span>
            <b className="text-emerald-400 text-sm font-bold">{progress.value}</b>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{progress.total}</span>
          </div>
        </div>

        {/* Overlay Rules Drawer (Floating Modal so it never pushes screen down) */}
        {showRules && (
          <div className="absolute inset-x-4 top-2 z-50 p-4 rounded-2xl bg-slate-900/95 border border-slate-700 text-xs text-slate-300 space-y-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between font-bold text-white uppercase tracking-wider pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <HelpCircle size={15} /> How to Play & Rules
              </span>
              <button type="button" onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>
            <p className="leading-relaxed text-slate-200">{rules}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              {howToPlay.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
              >
                Got it, let's play
              </button>
            </div>
          </div>
        )}

        {/* Victory Celebration Banner (compact & floating) */}
        {solved && (
          <div className="absolute inset-x-4 top-2 z-40 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 border-2 border-emerald-500/80 shadow-2xl backdrop-blur-xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg">
              <Trophy size={20} />
            </div>
            <h2 className="text-base font-bold text-white">Puzzle Solved in {formatTime(seconds)}! 🎉</h2>
            <p className="text-[11px] text-emerald-300/90 mt-0.5">
              Verified 100% in-browser. Outstanding logic mastery!
            </p>

            {/* Inbound Challenge Result */}
            {challengeInfo && challengeInfo.targetSecs > 0 && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between shadow-inner my-2 ${
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
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
              >
                <Send size={13} className="rotate-45" />
                <span>WhatsApp Challenge</span>
              </button>

              <button
                type="button"
                onClick={handleTwitterShare}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span className="font-mono font-black text-sm">𝕏</span>
                <span>Share on X</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={shareScore}
                className="flex-1 logic-action logic-action--primary text-xs py-1.5 px-3"
              >
                <Share2 size={13} />
                <span>{copied ? "Link Copied!" : "Copy Challenge Link"}</span>
              </button>
              <button
                type="button"
                onClick={onReset}
                className="logic-action text-xs py-1.5 px-4"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Center Grid Stage - Responsive scaling so whole board fits perfectly on screen */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0 py-1">
          <div className="w-full flex items-center justify-center max-h-[58vh] sm:max-h-[64vh]">
            {children}
          </div>
        </div>

        {/* Bottom Bar: Extra Controls (Keypad / Selectors) + Instant Feedback (All in 1 viewport) */}
        <div className="w-full shrink-0 flex flex-col items-center gap-1.5 pt-1 border-t border-slate-800/80">
          {extraControls && (
            <div className="w-full flex items-center justify-center">
              {extraControls}
            </div>
          )}

          {/* Feedback & Hint Status Line */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 px-2 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
              <Sparkles size={12} className="text-amber-400 shrink-0" />
              <span className="truncate">{feedback}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0 hidden sm:inline">
              100% Offline
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

// 1. Mini Sudoku Game
function MiniSudokuPuzzle() {
  const audio = useRef(new OrbitAudio());
  const demo = demoMode();
  const daily = useMemo(() => getLogicDaily(), []);
  const editionOverride = new URLSearchParams(window.location.search).get("edition");
  const edition = useMemo(() => miniSudokuEditionBank.find((item) => item.id === editionOverride) ?? miniSudokuEditionForDate(daily.id), [daily.id, editionOverride]);
  const editionDaily = useMemo(() => ({ ...daily, difficulty: edition.difficulty }), [daily, edition.difficulty]);
  const givens = useMemo(() => cloneGrid(edition.givens), [edition]);
  const [grid, setGrid] = useState<SudokuGrid>(() => cloneGrid(givens));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [feedback, setFeedback] = useState("Select a cell and tap digits 1–6.");
  const solved = solvedSudoku(grid);
  const conflicts = sudokuConflicts(grid);
  const solvedRef = useRef(false);

  useEffect(() => () => audio.current.dispose(), []);
  useEffect(() => {
    if (solved && !solvedRef.current && !demo) audio.current.play("puzzleSolve");
    solvedRef.current = solved;
  }, [solved, demo]);

  const setValue = (row: number, col: number, value: number) => {
    if (givens[row][col]) return;
    setGrid((current) => {
      const next = cloneGrid(current);
      next[row][col] = value;
      return next;
    });
    audio.current.play("rotate");
  };

  const handleKeypadInput = (val: number) => {
    if (!selectedCell) {
      setFeedback("Click a blank cell first to place a number.");
      return;
    }
    setValue(selectedCell.row, selectedCell.col, val);
  };

  const firstEmpty = () => {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (grid[r][c] === 0) return { row: r, col: c };
      }
    }
    return null;
  };

  const hint = () => {
    const target = firstEmpty();
    if (!target) return setFeedback("All cells are filled. Check duplicate constraints.");
    setValue(target.row, target.col, edition.solution[target.row][target.col]);
    setSelectedCell(target);
    setFeedback(`Hint: Row ${target.row + 1}, Col ${target.col + 1} is ${edition.solution[target.row][target.col]}.`);
  };

  const filled = grid.flat().filter(Boolean).length;
  const completedOnDevice = usePuzzleCompletion(`mini-sudoku-${edition.id}`, daily, solved, demo);

  return (
    <PuzzleFrame
      eyebrow="6×6 Number Grid"
      title="Mini Sudoku"
      rules="Place digits 1 through 6 such that every row, column, and each of the six 2×3 blocks contains each digit exactly once."
      howToPlay={[
        "Click a cell to select it, then tap numbers 1–6 on the keypad below or use your keyboard.",
        "Dark borders outline the 2×3 regions.",
        "Red highlighted cells indicate duplicates."
      ]}
      solved={solved}
      onReset={() => {
        setGrid(cloneGrid(givens));
        setSelectedCell(null);
        setFeedback("Board reset to initial clues.");
      }}
      onHint={hint}
      audio={audio}
      daily={editionDaily}
      feedback={feedback}
      progress={{ label: "Numbers Placed", value: filled, total: 36 }}
      completedOnDevice={completedOnDevice}
      extraControls={
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadInput(num)}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-800/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-white font-bold text-base sm:text-lg transition-all shadow active:scale-95 flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeypadInput(0)}
            className="px-2.5 h-9 sm:h-11 rounded-xl bg-slate-800/90 hover:bg-rose-600/80 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition-all shadow active:scale-95"
          >
            <Eraser size={14} />
            <span>Clear</span>
          </button>
        </div>
      }
    >
      <div className="sudoku-container w-full max-w-[360px] sm:max-w-[420px]">
        <div className="sudoku-grid-board">
          {Array.from({ length: 36 }, (_, index) => {
            const displayRow = Math.floor(index / 6);
            const displayCol = index % 6;
            const base = displayToBase(displayRow, displayCol, 6, daily.transform);
            const value = grid[base.row][base.col];
            const isGiven = Boolean(givens[base.row][base.col]);
            const isSelected = selectedCell?.row === base.row && selectedCell?.col === base.col;
            const isConflict = conflicts.has(cellKey(base.row, base.col));

            return (
              <button
                key={cellKey(displayRow, displayCol)}
                type="button"
                className={`sudoku-tile ${isGiven ? "sudoku-tile--given" : ""} ${isSelected ? "sudoku-tile--selected" : ""} ${isConflict ? "sudoku-tile--invalid" : ""} ${displayCol === 2 ? "sudoku-tile--box-right" : ""} ${displayRow === 1 || displayRow === 3 ? "sudoku-tile--box-bottom" : ""}`}
                disabled={isGiven}
                onClick={() => {
                  setSelectedCell({ row: base.row, col: base.col });
                  if (!isGiven) {
                    setValue(base.row, base.col, value === 6 ? 1 : value + 1);
                  }
                }}
                onKeyDown={(e) => {
                  const num = Number(e.key);
                  if (num >= 1 && num <= 6) {
                    e.preventDefault();
                    setValue(base.row, base.col, num);
                  }
                  if (e.key === "Backspace" || e.key === "Delete") {
                    setValue(base.row, base.col, 0);
                  }
                }}
              >
                {value || ""}
              </button>
            );
          })}
        </div>
      </div>
    </PuzzleFrame>
  );
}

// 2. Queens Region Game
function QueensEditionPuzzle() {
  const audio = useRef(new OrbitAudio());
  const demo = demoMode();
  const daily = useMemo(() => getLogicDaily(), []);
  const editionOverride = new URLSearchParams(window.location.search).get("edition");
  const edition = useMemo(() => queensEditionBank.find((item) => item.id === editionOverride) ?? queensEditionForDate(daily.id), [daily.id, editionOverride]);
  const editionDaily = useMemo(() => ({ ...daily, difficulty: edition.difficulty }), [daily, edition.difficulty]);
  const [grid, setGrid] = useState<QueenState[][]>(emptyQueens);
  const [toolMode, setToolMode] = useState<"queen" | "marked">("queen");
  const [feedback, setFeedback] = useState("Place 1 Crown per row, col, and colored region. Crowns cannot touch.");
  const solved = solvedQueens(grid, edition.regions);
  const invalid = queensViolations(grid, edition.regions);
  const solvedRef = useRef(false);

  useEffect(() => () => audio.current.dispose(), []);
  useEffect(() => {
    if (solved && !solvedRef.current && !demo) audio.current.play("puzzleSolve");
    solvedRef.current = solved;
  }, [solved, demo]);

  const cycle = (row: number, col: number) => {
    setGrid((current) => {
      const next = current.map((line) => [...line]);
      if (toolMode === "queen") {
        next[row][col] = next[row][col] === "queen" ? "empty" : "queen";
      } else {
        next[row][col] = next[row][col] === "marked" ? "empty" : "marked";
      }
      return next;
    });
    audio.current.play("rotate");
  };

  const hint = () => {
    const wrong = grid.flatMap((line, row) => line.map((value, col) => ({ row, col, value }))).find(({ row, col, value }) => value === "queen" && edition.solution[row] !== col);
    if (wrong) {
      setGrid((current) => {
        const next = current.map((line) => [...line]);
        next[wrong.row][wrong.col] = "empty";
        return next;
      });
      return setFeedback(`Hint: Cleared misplaced Crown at Row ${wrong.row + 1}, Col ${wrong.col + 1}.`);
    }
    const row = edition.solution.findIndex((col, currentRow) => grid[currentRow][col] !== "queen");
    if (row < 0) return setFeedback("All 6 crowns are placed correctly.");
    setGrid((current) => {
      const next = current.map((line) => [...line]);
      next[row][edition.solution[row]] = "queen";
      return next;
    });
    setFeedback(`Hint: A Crown belongs in Row ${row + 1}, Col ${edition.solution[row] + 1}.`);
  };

  const completedOnDevice = usePuzzleCompletion(`queens-${edition.id}`, daily, solved, demo);
  const crownCount = grid.flat().filter((v) => v === "queen").length;

  return (
    <PuzzleFrame
      eyebrow="Region Crown Placement"
      title="Queens"
      rules="Place exactly one Crown in each row, each column, and each colored region. Crowns cannot touch each other horizontally, vertically, or diagonally."
      howToPlay={[
        "Use the mode selector below to switch between placing Crowns and marking impossible cells with an X.",
        "Each distinct colored region must contain exactly one Crown.",
        "Red border indicates constraint conflicts."
      ]}
      solved={solved}
      onReset={() => {
        setGrid(emptyQueens());
        setFeedback("Board reset to empty field.");
      }}
      onHint={hint}
      audio={audio}
      daily={editionDaily}
      feedback={feedback}
      progress={{ label: "Queens Placed", value: crownCount, total: 6 }}
      completedOnDevice={completedOnDevice}
      extraControls={
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setToolMode("queen")}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all ${
              toolMode === "queen"
                ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Crown size={15} />
            <span>Place Crown</span>
          </button>
          <button
            type="button"
            onClick={() => setToolMode("marked")}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all ${
              toolMode === "marked"
                ? "bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-300"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <X size={15} />
            <span>Mark Dot (·)</span>
          </button>
        </div>
      }
    >
      <div className="queens-container w-full max-w-[360px] sm:max-w-[420px]">
        <div className="queens-grid-board">
          {Array.from({ length: 36 }, (_, index) => {
            const displayRow = Math.floor(index / 6);
            const displayCol = index % 6;
            const base = displayToBase(displayRow, displayCol, 6, daily.transform);
            const state = grid[base.row][base.col];
            const region = edition.regions[base.row][base.col];
            const isInvalid = invalid.has(cellKey(base.row, base.col));

            return (
              <button
                key={cellKey(displayRow, displayCol)}
                type="button"
                className={`queens-tile queens-tile--region-${region} ${isInvalid ? "queens-tile--invalid" : ""}`}
                onClick={() => cycle(base.row, base.col)}
              >
                {state === "queen" ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                    <Crown size={18} className="fill-amber-950" />
                  </div>
                ) : state === "marked" ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white/50 block" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </PuzzleFrame>
  );
}

// 3. Tango Binary Balance Game
function TangoEditionPuzzle() {
  const audio = useRef(new OrbitAudio());
  const demo = demoMode();
  const daily = useMemo(() => getLogicDaily(), []);
  const editionOverride = new URLSearchParams(window.location.search).get("edition");
  const edition = useMemo(() => tangoEditionBank.find((item) => item.id === editionOverride) ?? tangoEditionForDate(daily.id), [daily.id, editionOverride]);
  const editionDaily = useMemo(() => ({ ...daily, difficulty: edition.difficulty }), [daily, edition.difficulty]);
  const givens = useMemo(() => cloneGrid(edition.givens) as TangoGrid, [edition]);
  const [grid, setGrid] = useState<TangoGrid>(() => cloneGrid(givens) as TangoGrid);
  const [selectedMode, setSelectedMode] = useState<TangoValue | "cycle">(null);
  const [feedback, setFeedback] = useState("Balance 3 Moons and 3 Suns per line. No 3 of same in a row.");
  const solved = solvedTangoEngine(grid, edition.relations);
  const invalid = tangoViolations(grid, edition.relations);
  const solvedRef = useRef(false);

  useEffect(() => () => audio.current.dispose(), []);
  useEffect(() => {
    if (solved && !solvedRef.current && !demo) audio.current.play("puzzleSolve");
    solvedRef.current = solved;
  }, [solved, demo]);

  const cycle = (row: number, col: number) => {
    if (givens[row][col] !== null) return;
    setGrid((current) => {
      const next = cloneGrid(current) as TangoGrid;
      if (selectedMode === "cycle" || selectedMode === null) {
        next[row][col] = next[row][col] === null ? 0 : next[row][col] === 0 ? 1 : null;
      } else {
        next[row][col] = next[row][col] === selectedMode ? null : selectedMode;
      }
      return next;
    });
    audio.current.play("rotate");
  };

  const hint = () => {
    const incorrect = Array.from(invalid).map((key) => key.split(":").map(Number) as [number, number]).find(([row, col]) => givens[row][col] === null);
    const empty = grid.flatMap((line, row) => line.map((value, col) => ({ row, col, value }))).find(({ row, col, value }) => value === null && givens[row][col] === null);
    const target = incorrect ? { row: incorrect[0], col: incorrect[1] } : empty;
    if (!target) return setFeedback("All cells placed. Check line balances and relation markers.");
    setGrid((current) => {
      const next = cloneGrid(current) as TangoGrid;
      next[target.row][target.col] = edition.solution[target.row][target.col];
      return next;
    });
    setFeedback(`Hint: Row ${target.row + 1}, Col ${target.col + 1} is ${edition.solution[target.row][target.col] === 0 ? "Moon" : "Sun"}.`);
  };

  const completedOnDevice = usePuzzleCompletion(`tango-${edition.id}`, daily, solved, demo);
  const filled = grid.flat().filter((v) => v !== null).length;

  return (
    <PuzzleFrame
      eyebrow="Binary Grid Balance"
      title="Tango"
      rules="Fill every cell with either a Moon or a Sun so that each row and column contains exactly three Moons and three Suns. No three consecutive same symbols are allowed anywhere."
      howToPlay={[
        "Tap a cell to cycle Moon 🌙 → Sun ☀️ → Clear, or select a mode below.",
        "= means adjacent cells must be the same symbol.",
        "× means adjacent cells must be opposite symbols.",
        "Red highlight indicates rule violations."
      ]}
      solved={solved}
      onReset={() => {
        setGrid(cloneGrid(givens) as TangoGrid);
        setFeedback("Board reset to initial givens.");
      }}
      onHint={hint}
      audio={audio}
      daily={editionDaily}
      feedback={feedback}
      progress={{ label: "Symbols Placed", value: filled, total: 36 }}
      completedOnDevice={completedOnDevice}
      extraControls={
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedMode(0)}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all ${
              selectedMode === 0
                ? "bg-sky-500 text-slate-950 ring-2 ring-sky-300"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Moon size={15} className="fill-current" />
            <span>Moon (🌙)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedMode(1)}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all ${
              selectedMode === 1
                ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sun size={15} className="fill-current" />
            <span>Sun (☀️)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedMode("cycle")}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedMode === "cycle" || selectedMode === null
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            Auto Cycle
          </button>
        </div>
      }
    >
      <div className="tango-container w-full max-w-[360px] sm:max-w-[420px] relative">
        <div className="tango-grid-board">
          {Array.from({ length: 36 }, (_, index) => {
            const displayRow = Math.floor(index / 6);
            const displayCol = index % 6;
            const base = displayToBase(displayRow, displayCol, 6, daily.transform);
            const value = grid[base.row][base.col];
            const isGiven = givens[base.row][base.col] !== null;
            const isInvalid = invalid.has(cellKey(base.row, base.col));

            return (
              <button
                key={cellKey(displayRow, displayCol)}
                type="button"
                className={`tango-tile ${isGiven ? "tango-tile--given" : ""} ${isInvalid ? "tango-tile--invalid" : ""}`}
                disabled={isGiven}
                onClick={() => cycle(base.row, base.col)}
              >
                {value === 0 ? (
                  <Moon size={22} className="text-sky-300 fill-sky-300/30" />
                ) : value === 1 ? (
                  <Sun size={22} className="text-amber-300 fill-amber-300/30" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Relation markers */}
        {edition.relations.map((relation, index) => {
          const a = baseToDisplay(relation.a.row, relation.a.col, 6, daily.transform);
          const b = baseToDisplay(relation.b.row, relation.b.col, 6, daily.transform);
          const horizontal = a.row === b.row;
          const left = horizontal ? ((Math.min(a.col, b.col) + 1) / 6) * 100 : ((a.col + 0.5) / 6) * 100;
          const top = horizontal ? ((a.row + 0.5) / 6) * 100 : ((Math.min(a.row, b.row) + 1) / 6) * 100;

          return (
            <span
              key={index}
              className="tango-relation-badge"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {relation.relation === "same" ? "=" : "×"}
            </span>
          );
        })}
      </div>
    </PuzzleFrame>
  );
}

// 4. Patches / Shikaku Partition Game
function PatchesPuzzle() {
  const audio = useRef(new OrbitAudio());
  const demo = demoMode();
  const daily = useMemo(() => getLogicDaily(), []);
  const editionOverride = new URLSearchParams(window.location.search).get("edition");
  const edition = useMemo(() => patchesEditionBank.find((item) => item.id === editionOverride) ?? patchesEditionForDate(daily.id), [daily.id, editionOverride]);
  const editionDaily = useMemo(() => ({ ...daily, difficulty: edition.difficulty }), [daily, edition.difficulty]);
  const initialPlaced = () => edition.difficulty === "calm" ? [edition.solution[0]] : [];
  const [placed, setPlaced] = useState<Patch[]>(initialPlaced);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [feedback, setFeedback] = useState("Select a clue cell, then tap opposite corner to lock a rectangle.");
  const solved = solvedPatches(placed, edition.board);
  const solvedRef = useRef(false);

  useEffect(() => () => audio.current.dispose(), []);
  useEffect(() => {
    if (solved && !solvedRef.current && !demo) audio.current.play("puzzleSolve");
    solvedRef.current = solved;
  }, [solved, demo]);

  const select = (cell: Cell) => {
    if (!anchor) {
      setAnchor(cell);
      setFeedback("Anchor set. Now tap the opposite diagonal corner.");
      return;
    }
    const top = Math.min(anchor.row, cell.row);
    const left = Math.min(anchor.col, cell.col);
    const patch: Patch = {
      top,
      left,
      height: Math.abs(anchor.row - cell.row) + 1,
      width: Math.abs(anchor.col - cell.col) + 1,
      clueId: ""
    };
    const inside = edition.board.clues.filter(
      (clue) =>
        clue.cell.row >= top &&
        clue.cell.row < top + patch.height &&
        clue.cell.col >= left &&
        clue.cell.col < left + patch.width
    );
    setAnchor(null);
    if (inside.length !== 1) {
      setFeedback("Rectangle must contain exactly one clue number!");
      return;
    }
    patch.clueId = inside[0].id;
    const without = placed.filter((p) => p.clueId !== patch.clueId);
    if (!validPatch(patch, without, edition.board)) {
      setFeedback("Rectangle size/shape does not match clue area.");
      return;
    }
    setPlaced([...without, patch]);
    setFeedback(`Rectangle for Clue ${patch.clueId} placed.`);
    audio.current.play("rotate");
  };

  const hint = () => {
    const target = edition.solution.find((p) => !placed.some((item) => item.clueId === p.clueId));
    if (!target) return setFeedback("All rectangles are placed.");
    setPlaced((curr) => [...curr.filter((p) => p.clueId !== target.clueId), target]);
    setFeedback(`Hint: Placed rectangle for clue ${target.clueId}.`);
  };

  const completedOnDevice = usePuzzleCompletion(`patches-${edition.id}`, daily, solved, demo);
  const locked = new Set(placed.map((p) => p.clueId)).size;

  return (
    <PuzzleFrame
      eyebrow="Rectangle Partition"
      title="Patches"
      rules="Divide the 6×6 grid into non-overlapping rectangles such that every rectangle contains exactly one clue number equal to its area."
      howToPlay={[
        "Click a cell to set the starting corner, then click the opposite diagonal corner.",
        "Each rectangle must cover exactly one clue cell.",
        "Clue shapes: □ = Square, ↔ = Wide horizontal, ↕ = Tall vertical."
      ]}
      solved={solved}
      onReset={() => {
        setPlaced(initialPlaced());
        setAnchor(null);
        setFeedback("Board reset. Tap a corner to start.");
      }}
      onHint={hint}
      audio={audio}
      daily={editionDaily}
      feedback={feedback}
      progress={{ label: "Patches Placed", value: locked, total: edition.solution.length }}
      completedOnDevice={completedOnDevice}
    >
      <div className="patches-container w-full max-w-[360px] sm:max-w-[420px]">
        <div className="patches-grid-board">
          {Array.from({ length: edition.board.rows * edition.board.cols }, (_, index) => {
            const display = { row: Math.floor(index / edition.board.cols), col: index % edition.board.cols };
            const cell = displayToBase(display.row, display.col, edition.board.rows, daily.transform);
            const owner = placed.findIndex((patch) => patchCells(patch).some((item) => sameCell(item, cell)));
            const clue = edition.board.clues.find((item) => sameCell(item.cell, cell));
            const selected = anchor && sameCell(anchor, cell);

            return (
              <button
                key={cellKey(display.row, display.col)}
                type="button"
                className={`patches-tile ${owner >= 0 ? `patches-tile--patch-${owner % 6}` : ""} ${selected ? "patches-tile--anchor" : ""}`}
                onClick={() => select(cell)}
              >
                {clue && (
                  <div className="patches-clue-badge">
                    <b>{clue.area}</b>
                    <small>
                      {clue.shape === "square" ? "□" : clue.shape === "wide" ? "↔" : clue.shape === "tall" ? "↕" : "·"}
                    </small>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </PuzzleFrame>
  );
}

// 5. Zip Continuous Ordered Path Game
function ZipPuzzle() {
  const audio = useRef(new OrbitAudio());
  const demo = demoMode();
  const daily = useMemo(() => getLogicDaily(), []);
  const editionOverride = new URLSearchParams(window.location.search).get("edition");
  const edition = useMemo(() => zipEditionBank.find((item) => item.id === editionOverride) ?? zipEditionForDate(daily.id), [daily.id, editionOverride]);
  const editionDaily = useMemo(() => ({ ...daily, difficulty: edition.difficulty }), [daily, edition.difficulty]);
  const startingPath = () => edition.difficulty === "calm" ? edition.solution.slice(0, 3) : [edition.board.numbers[0].cell];
  const [path, setPath] = useState<Cell[]>(startingPath);
  const [feedback, setFeedback] = useState("Connect all 36 cells passing stations 1–6 in order.");
  const solved = solvedZip(path, edition.board);
  const solvedRef = useRef(false);

  useEffect(() => () => audio.current.dispose(), []);
  useEffect(() => {
    if (solved && !solvedRef.current && !demo) audio.current.play("puzzleSolve");
    solvedRef.current = solved;
  }, [solved, demo]);

  const select = (cell: Cell) => {
    const existing = path.findIndex((item) => sameCell(item, cell));
    if (existing >= 0) {
      setPath(path.slice(0, existing + 1));
      return setFeedback("Path rewound to this station.");
    }
    const next = [...path, cell];
    if (!validZipPath(next, edition.board)) {
      return setFeedback("Step must be an adjacent orthogonal neighbor without crossing walls.");
    }
    setPath(next);
    setFeedback(`${next.length}/36 cells connected.`);
    audio.current.play("rotate");
  };

  const hint = () => {
    let correct = 0;
    while (correct < path.length && sameCell(path[correct], edition.solution[correct])) correct += 1;
    const revealed = Math.min(correct + 1, edition.solution.length);
    setPath(edition.solution.slice(0, revealed));
    setFeedback(`Hint: Path extended to step ${revealed}.`);
  };

  const completedOnDevice = usePuzzleCompletion(`zip-${edition.id}`, daily, solved, demo);

  return (
    <PuzzleFrame
      eyebrow="Continuous Path Navigation"
      title="Zip"
      rules="Draw a single continuous line covering every cell in the 6×6 grid. You must visit numbered stations in exact ascending order without crossing walls or visiting cells twice."
      howToPlay={[
        "Click adjacent cells step-by-step from Station 1 onwards.",
        "Orange lines are impassable walls.",
        "Click any earlier step on your path to rewind.",
        "All 36 cells must be visited to complete."
      ]}
      solved={solved}
      onReset={() => {
        setPath(startingPath());
        setFeedback("Path reset to starting station.");
      }}
      onHint={hint}
      audio={audio}
      daily={editionDaily}
      feedback={feedback}
      progress={{ label: "Path Length", value: path.length, total: edition.solution.length }}
      completedOnDevice={completedOnDevice}
    >
      <div className="zip-container w-full max-w-[360px] sm:max-w-[420px] relative">
        <div className="zip-grid-board">
          {Array.from({ length: edition.board.rows * edition.board.cols }, (_, index) => {
            const display = { row: Math.floor(index / edition.board.cols), col: index % edition.board.cols };
            const cell = displayToBase(display.row, display.col, edition.board.rows, daily.transform);
            const pathIndex = path.findIndex((item) => sameCell(item, cell));
            const station = edition.board.numbers.find((item) => sameCell(item.cell, cell));

            return (
              <button
                key={cellKey(display.row, display.col)}
                type="button"
                className={`zip-tile ${pathIndex >= 0 ? "zip-tile--active" : ""}`}
                onClick={() => select(cell)}
              >
                {station ? (
                  <div className="zip-station-badge">
                    {station.value}
                  </div>
                ) : pathIndex >= 0 ? (
                  <span className="zip-step-badge">
                    {pathIndex + 1}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Walls */}
        {edition.board.blockedEdges.map(([a, b], index) => {
          const first = baseToDisplay(a.row, a.col, edition.board.rows, daily.transform);
          const second = baseToDisplay(b.row, b.col, edition.board.rows, daily.transform);
          const horizontal = first.row !== second.row;
          const left = horizontal ? (first.col / edition.board.cols) * 100 : ((Math.min(first.col, second.col) + 1) / edition.board.cols) * 100;
          const top = horizontal ? ((Math.min(first.row, second.row) + 1) / edition.board.rows) * 100 : (first.row / edition.board.rows) * 100;

          return (
            <span
              key={index}
              className={`zip-wall-line ${horizontal ? "zip-wall-line--horizontal" : "zip-wall-line--vertical"}`}
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}
      </div>
    </PuzzleFrame>
  );
}

// 6. Wend Word Exact Cover Game
function WendEditionPuzzle() {
  const audio = useRef(new OrbitAudio());
  const demo = demoMode();
  const daily = useMemo(() => getLogicDaily(), []);
  const editionOverride = new URLSearchParams(window.location.search).get("edition");
  const edition = useMemo(() => wendEditionBank.find((item) => item.id === editionOverride) ?? wendEditionForDate(daily.id), [daily.id, editionOverride]);
  const editionDaily = useMemo(() => ({ ...daily, difficulty: edition.difficulty }), [daily, edition.difficulty]);
  const initialFound = () => edition.difficulty === "calm" ? [edition.words[0].word] : [];
  const [found, setFound] = useState<string[]>(initialFound);
  const [active, setActive] = useState<Cell[]>([]);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const [feedback, setFeedback] = useState("Trace target words orthogonally. Cover all 25 letter tiles.");
  const foundWords = edition.words.filter((w) => found.includes(w.word));
  const solved = solvedWend(foundWords, edition.words);
  const solvedRef = useRef(false);

  useEffect(() => () => audio.current.dispose(), []);
  useEffect(() => {
    if (solved && !solvedRef.current && !demo) audio.current.play("puzzleSolve");
    solvedRef.current = solved;
  }, [solved, demo]);

  const select = (cell: Cell) => {
    if (foundWords.some((w) => w.path.some((item) => sameCell(item, cell)))) return;
    const existing = active.findIndex((item) => sameCell(item, cell));
    if (existing >= 0) {
      setActive(active.slice(0, existing + 1));
      return setFeedback("Word trace rewound.");
    }
    const next = [...active, cell];
    if (!validWendPath(next, edition.grid)) {
      return setFeedback("Orthogonal adjacent steps only without reusing tiles.");
    }
    const match = edition.words.find((w) => !found.includes(w.word) && matchesWendWord(next, w, edition.grid));
    if (match) {
      setFound([...found, match.word]);
      setActive([]);
      setHintCell(null);
      setFeedback(`Found "${match.word}"! Keep going.`);
      audio.current.play("rotate");
      return;
    }
    setActive(next);
    setFeedback(`Tracing "${wordFromPath(next, edition.grid)}" — tap next letter or rewind.`);
  };

  const hint = () => {
    if (active.length) {
      setActive([]);
      return setFeedback("Cleared current active trace.");
    }
    const word = edition.words.find((w) => !found.includes(w.word));
    if (!word) return setFeedback("All words found.");
    setHintCell(word.path[0]);
    setFeedback(`Hint: Word "${word.word}" starts at Row ${word.path[0].row + 1}, Col ${word.path[0].col + 1}.`);
  };

  const completedOnDevice = usePuzzleCompletion(`wend-${edition.id}`, daily, solved, demo);

  return (
    <PuzzleFrame
      eyebrow="Exact Word Cover"
      title="Wend"
      rules="Find all listed words by tracing orthogonal paths (up, down, left, right). Each letter tile on the 5×5 board belongs to exactly one word."
      howToPlay={[
        "Click the first letter of a target word, then click adjacent letters in spelling order.",
        "When a full word matches, it locks in place with a colored highlight.",
        "All 25 letters must be used with zero overlap."
      ]}
      solved={solved}
      onReset={() => {
        setFound(initialFound());
        setActive([]);
        setHintCell(null);
        setFeedback("Board reset.");
      }}
      onHint={hint}
      audio={audio}
      daily={editionDaily}
      feedback={feedback}
      progress={{ label: "Words Found", value: foundWords.length, total: edition.words.length }}
      completedOnDevice={completedOnDevice}
      extraControls={
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {edition.words.map((w) => {
              const isFound = found.includes(w.word);
              return (
                <div
                  key={w.word}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                    isFound
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 line-through"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {isFound && <Check size={12} className="text-emerald-400 no-underline" />}
                  <span>{w.word}</span>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      <div className="wend-container w-full max-w-[340px] sm:max-w-[390px]">
        <div className="wend-grid-board">
          {Array.from({ length: 25 }, (_, index) => {
            const displayRow = Math.floor(index / 5);
            const displayCol = index % 5;
            const cell = displayToBase(displayRow, displayCol, 5, daily.transform);
            const letter = edition.grid[cell.row][cell.col];
            const wordIndex = foundWords.findIndex((w) => w.path.some((item) => sameCell(item, cell)));
            const activeIndex = active.findIndex((item) => sameCell(item, cell));
            const isHint = hintCell && sameCell(hintCell, cell);

            return (
              <button
                key={cellKey(displayRow, displayCol)}
                type="button"
                className={`wend-tile ${wordIndex >= 0 ? `wend-tile--word-${wordIndex % 5}` : ""} ${activeIndex >= 0 ? "wend-tile--active" : ""} ${isHint ? "wend-tile--hint" : ""}`}
                onClick={() => select(cell)}
              >
                <span>{letter}</span>
              </button>
            );
          })}
        </div>
      </div>
    </PuzzleFrame>
  );
}

// Router switcher
export default function LogicPuzzle() {
  const [, legacy] = useRoute("/games/logic/:slug");
  const [, direct] = useRoute("/games/:slug");
  const slug = legacy?.slug ?? direct?.slug;

  if (slug === "connections") return <ConnectionsPuzzle />;
  if (slug === "wordle" || slug === "orbit-lexicon") return <WordlePuzzle />;
  if (slug === "mini-crossword" || slug === "crossword") return <MiniCrosswordPuzzle />;
  if (slug === "hive" || slug === "the-hive" || slug === "spelling-bee") return <HivePuzzle />;
  if (slug === "strands" || slug === "theme-threads") return <StrandsPuzzle />;
  if (slug === "mini-sudoku") return <MiniSudokuPuzzle />;
  if (slug === "tango") return <TangoEditionPuzzle />;
  if (slug === "queens") return <QueensEditionPuzzle />;
  if (slug === "patches") return <PatchesPuzzle />;
  if (slug === "zip") return <ZipPuzzle />;
  if (slug === "wend") return <WendEditionPuzzle />;
  if (slug === "chess-puzzles" || slug === "chess") return <ChessPuzzle />;
  if (slug === "nonogram" || slug === "griddlers") return <NonogramPuzzle />;

  return (
    <section className="logic-game-page">
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-white mb-3">Puzzle Module Not Found</h1>
        <p className="text-slate-400 mb-6">The requested puzzle field is not currently active.</p>
        <Link href="/games" className="logic-action logic-action--primary">
          Return to Games Bay
        </Link>
      </div>
    </section>
  );
}
