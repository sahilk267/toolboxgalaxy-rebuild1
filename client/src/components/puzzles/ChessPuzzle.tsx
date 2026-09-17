import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { OrbitAudio } from "@/game/audio";
import {
  getChessEditionForDate,
  type ChessPuzzleEdition,
  type ChessCoord,
  type ChessPiece
} from "@/game/logicPuzzles/chessBank";
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
  Swords,
  Send,
  ShieldAlert
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

const PIECE_SYMBOLS: Record<string, string> = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟"
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export default function ChessPuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: ChessPuzzleEdition = useMemo(() => getChessEditionForDate(dateStr), [dateStr]);

  const [board, setBoard] = useState<ChessPiece[][]>(() =>
    edition.initialBoard.map((row) => [...row])
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedCoord, setSelectedCoord] = useState<ChessCoord | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync board when edition changes
  useEffect(() => {
    handleReset();
  }, [edition]);

  // Live Timer
  useEffect(() => {
    if (isSolved) return;
    const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isSolved]);

  const handleReset = () => {
    audio.current.play("rotate");
    setBoard(edition.initialBoard.map((row) => [...row]));
    setCurrentStepIndex(0);
    setSelectedCoord(null);
    setIsSolved(false);
    setShowVictoryModal(false);
    setHintActive(false);
    setMessage({ text: edition.objective, type: "info" });
  };

  const handleHint = () => {
    audio.current.play("relayCorrect");
    setHintActive(true);
    const step = edition.moves[currentStepIndex];
    if (step) {
      setSelectedCoord(step.playerMove.from);
      setMessage({
        text: `💡 Hint: ${edition.hint}`,
        type: "info"
      });
    }
  };

  const onSquareClick = (r: number, c: number) => {
    if (isSolved) return;

    const piece = board[r][c];
    const isPlayerPiece = piece && piece.startsWith(edition.turn === "white" ? "w" : "b");

    // Case 1: Selecting or switching selected friendly piece
    if (!selectedCoord) {
      if (isPlayerPiece) {
        audio.current.play("rotate");
        setSelectedCoord({ r, c });
      }
      return;
    }

    if (isPlayerPiece) {
      audio.current.play("rotate");
      setSelectedCoord({ r, c });
      return;
    }

    // Case 2: Attempting move from selectedCoord to {r, c}
    const step = edition.moves[currentStepIndex];
    if (!step) return;

    const isTarget =
      selectedCoord.r === step.playerMove.from.r &&
      selectedCoord.c === step.playerMove.from.c &&
      r === step.playerMove.to.r &&
      c === step.playerMove.to.c;

    if (isTarget) {
      // Correct player move
      audio.current.play("relayCorrect");
      const nextBoard = board.map((row) => [...row]);
      const movingPiece = nextBoard[selectedCoord.r][selectedCoord.c];
      nextBoard[selectedCoord.r][selectedCoord.c] = null;
      nextBoard[r][c] = movingPiece;
      setBoard(nextBoard);
      setSelectedCoord(null);
      setHintActive(false);

      if (step.opponentReply) {
        // Opponent must respond
        setMessage({ text: `Brilliant! Opponent responds ${step.opponentReply.notation}...`, type: "success" });
        setTimeout(() => {
          audio.current.play("rotate");
          const reply = step.opponentReply!;
          const boardAfterReply = nextBoard.map((row) => [...row]);
          const oppPiece = boardAfterReply[reply.from.r][reply.from.c];
          boardAfterReply[reply.from.r][reply.from.c] = null;
          boardAfterReply[reply.to.r][reply.to.c] = oppPiece;
          setBoard(boardAfterReply);
          setCurrentStepIndex(currentStepIndex + 1);
          setMessage({ text: "Deliver the final winning blow!", type: "info" });
        }, 650);
      } else {
        // Puzzle fully solved!
        finishPuzzle();
      }
    } else {
      // Inaccurate move
      audio.current.play("relayFail");
      setSelectedCoord(null);
      setMessage({
        text: "That move isn't the most decisive. Try again!",
        type: "error"
      });
    }
  };

  const finishPuzzle = () => {
    setIsSolved(true);
    markPuzzleFieldComplete("chess-puzzles", edition.id);
    audio.current.play("puzzleSolve");
    setMessage({
      text: `🏆 Checkmate! ${edition.solutionExplanation}`,
      type: "success"
    });
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setShowVictoryModal(true);
    }, 900);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentStep = edition.moves[currentStepIndex];

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
                Chess Puzzles <span className="text-amber-400 text-xs">♟️</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">Tactical Daily Positions</span>
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
            title="Tactical theme rules"
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button
            type="button"
            className={`logic-action ${hintActive ? "border-amber-500/40 text-amber-300 bg-amber-500/10" : ""}`}
            onClick={handleHint}
            title="Reveal hint"
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <button
            type="button"
            className="logic-action"
            onClick={handleReset}
            title="Reset position"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Chess Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col items-center gap-3">
          {/* Objective Banner */}
          <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
              <span className="text-slate-300 font-semibold">{edition.title}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {edition.difficulty}
            </span>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`w-full text-center px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                message.type === "success"
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                  : message.type === "error"
                  ? "bg-rose-950/80 border border-rose-500/40 text-rose-300"
                  : "bg-slate-900 border border-white/10 text-slate-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* 8x8 Chessboard */}
          <div className="relative p-2.5 sm:p-3 bg-[#131b2b] rounded-2xl border-2 border-[#2b3850] shadow-2xl">
            <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[384px] sm:h-[384px] border border-[#2b3850] rounded-lg overflow-hidden shadow-inner">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const isDark = (r + c) % 2 === 1;
                  const isSelected = selectedCoord?.r === r && selectedCoord?.c === c;
                  const isHintTarget =
                    hintActive &&
                    currentStep &&
                    ((currentStep.playerMove.from.r === r && currentStep.playerMove.from.c === c) ||
                      (currentStep.playerMove.to.r === r && currentStep.playerMove.to.c === c));

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => onSquareClick(r, c)}
                      className={`relative flex items-center justify-center transition-colors select-none ${
                        isSelected
                          ? "bg-amber-400/50"
                          : isDark
                          ? "bg-[#253248] hover:bg-[#2d3d57]"
                          : "bg-[#7b8ea8] hover:bg-[#889cb8]"
                      } ${isHintTarget ? "ring-2 ring-amber-400 ring-inset animate-pulse" : ""}`}
                    >
                      {/* Board coordinate markers */}
                      {c === 0 && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold opacity-40 text-white">
                          {RANKS[r]}
                        </span>
                      )}
                      {r === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-40 text-white">
                          {FILES[c]}
                        </span>
                      )}

                      {/* Piece Icon */}
                      {piece && (
                        <span
                          className={`text-3xl sm:text-4xl leading-none transition-transform active:scale-95 ${
                            piece.startsWith("w")
                              ? "text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                              : "text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
                          }`}
                        >
                          {PIECE_SYMBOLS[piece] || ""}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-mono">
            Click your piece to select it, then tap the destination square.
          </p>
        </div>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="text-amber-400" size={20} />
                How to Play Chess Puzzles
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
                Each daily position presents a tactical challenge where you play the winning sequence.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li>Find the most forcing move (checkmate, fork, pin, or deflection).</li>
                <li>Tap your piece to pick it up, then tap its destination square.</li>
                <li>If the puzzle requires multiple moves, the opponent will counter automatically.</li>
                <li>Use the <b>Hint</b> button if you need guidance on which piece to activate.</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition"
            >
              Understood, Let's Play
            </button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Tactical Mastery!</h2>
              <p className="text-xs text-amber-400 font-mono">{edition.theme}</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/10">
              {edition.solutionExplanation}
            </p>

            <div className="flex items-center justify-center gap-4 py-2 font-mono text-sm">
              <span className="text-slate-400">Time:</span>
              <span className="text-emerald-400 font-bold">{formatTime(seconds)}</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition"
              >
                Replay Puzzle
              </button>
              <Link
                href="/games"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition flex items-center justify-center"
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
