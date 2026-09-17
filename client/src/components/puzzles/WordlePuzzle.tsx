import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { OrbitAudio } from "@/game/audio";
import { wordleEditionForDate, type WordleEdition } from "@/game/logicPuzzles/wordleBank";
import { evaluateWordleGuess, isValidWord, type LetterStatus } from "@/game/logicPuzzles/wordle";
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
  Delete, 
  AlertCircle,
  Swords,
  Send
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export default function WordlePuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: WordleEdition = useMemo(() => wordleEditionForDate(dateStr), [dateStr]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealedLettersCount, setRevealedLettersCount] = useState(0);

  // Initialize or on date change / reset
  const handleReset = () => {
    audio.current.play("rotate");
    setGuesses([]);
    setCurrentGuess("");
    setIsSolved(false);
    setIsGameOver(false);
    setMessage(null);
    setSeconds(0);
    setRevealedLettersCount(0);
  };

  useEffect(() => {
    handleReset();
  }, [edition]);

  // Timer
  useEffect(() => {
    if (isSolved || isGameOver) return;
    const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isSolved, isGameOver]);

  // Peer-to-Peer Automated Challenge System
  const challengeInfo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const by = params.get("by");
    const targetGuesses = Number(params.get("guesses")) || 0;
    const targetSecs = Number(params.get("time")) || 0;
    if (by || targetGuesses > 0) {
      return { by: by || "A Friend", targetGuesses, targetSecs };
    }
    return null;
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleHint = () => {
    if (isSolved || isGameOver) return;
    audio.current.play("relayCorrect");

    const sol = edition.solution.toUpperCase();
    const nextCount = Math.min(sol.length, revealedLettersCount + 1);
    setRevealedLettersCount(nextCount);

    const filledWord = sol.slice(0, nextCount);
    setCurrentGuess(filledWord);

    const justRevealedChar = sol[nextCount - 1];

    if (nextCount < sol.length) {
      if (edition.hint) {
        setMessage(
          `💡 Letter ${nextCount}/${sol.length} Revealed: "${justRevealedChar}" (${filledWord}...) · Clue: "${edition.hint}" (Tap Hint for next letter)`
        );
      } else {
        setMessage(
          `💡 Letter ${nextCount}/${sol.length} Revealed: "${justRevealedChar}" (${filledWord}...) (Tap Hint for next letter)`
        );
      }
    } else {
      setMessage(`💡 All letters revealed: "${sol}"! Tap 'ENTER' to complete.`);
    }
  };

  // Keyboard status mapping (green > yellow > gray)
  const keyStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {};
    
    // Letters revealed via Hint show as green on the keyboard!
    if (revealedLettersCount > 0) {
      const sol = edition.solution.toUpperCase();
      for (let i = 0; i < revealedLettersCount; i++) {
        map[sol[i]] = "correct";
      }
    }

    guesses.forEach((guess) => {
      const evaluation = evaluateWordleGuess(guess, edition.solution);
      evaluation.forEach(({ char, status }) => {
        const current = map[char];
        if (status === "correct") {
          map[char] = "correct";
        } else if (status === "present" && current !== "correct") {
          map[char] = "present";
        } else if (status === "absent" && !current) {
          map[char] = "absent";
        }
      });
    });
    return map;
  }, [guesses, edition.solution, revealedLettersCount]);

  const handleKeyPress = useCallback((key: string) => {
    if (isSolved || isGameOver) return;
    setMessage(null);

    if (key === "BACKSPACE" || key === "DELETE") {
      audio.current.play("toggle");
      setCurrentGuess((prev) => prev.slice(0, -1));
      return;
    }

    if (key === "ENTER") {
      if (currentGuess.length !== 5) {
        audio.current.play("relayFail");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setMessage("Word must be 5 letters");
        return;
      }

      if (!isValidWord(currentGuess) && currentGuess.toUpperCase() !== edition.solution.toUpperCase()) {
        audio.current.play("relayFail");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setMessage("Not in word list");
        return;
      }

      const nextGuesses = [...guesses, currentGuess.toUpperCase()];
      setGuesses(nextGuesses);
      setCurrentGuess("");

      if (currentGuess.toUpperCase() === edition.solution.toUpperCase()) {
        setIsSolved(true);
        const editionSlug = edition.id.startsWith("wordle-") ? edition.id : `wordle-${edition.id}`;
        markPuzzleFieldComplete("wordle", edition.id);
        markPuzzleFieldComplete(`wordle-${editionSlug}`, dateStr);
        audio.current.play("puzzleSolve");
        setMessage("Splendid! You guessed the word!");
      } else if (nextGuesses.length >= 6) {
        setIsGameOver(true);
        audio.current.play("relayFail");
        setMessage(`Game Over! The word was ${edition.solution}.`);
      } else {
        audio.current.play("fragment");
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(key) && currentGuess.length < 5) {
      audio.current.play("toggle");
      setCurrentGuess((prev) => (prev + key).toUpperCase());
    }
  }, [currentGuess, edition.id, edition.solution, guesses, isGameOver, isSolved]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/wordle?by=Friend&guesses=${guesses.length}&time=${seconds}`;
  };

  const getViralShareText = () => {
    let grid = "";
    guesses.forEach((guess) => {
      const evaluation = evaluateWordleGuess(guess, edition.solution);
      grid += evaluation.map((e) => (e.status === "correct" ? "🟩" : e.status === "present" ? "🟨" : "⬛")).join("") + "\n";
    });

    const challengeUrl = getChallengeUrl();
    return `🟩 Wordle Plus #${edition.date} ${isSolved ? guesses.length : "X"}/6\n` +
      `⏱️ Time: ${formatTime(seconds)}\n` +
      `${grid}\n` +
      `⚔️ Can you beat my score? Tap here:\n` +
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
        title: `Toolbox Galaxy Wordle Plus Challenge`,
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
              <h1 className="text-sm font-bold text-white tracking-tight">Wordle Plus</h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">5-Letter Daily Mystery</span>
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
            title="Reveal 1 clue hint"
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

      {/* Main Board */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center justify-between max-w-lg mx-auto w-full">
        {/* Automated Peer-to-Peer Challenge Inbound Banner */}
        {challengeInfo && (
          <div className="w-full max-w-md mb-2 p-2.5 bg-gradient-to-r from-emerald-500/15 via-lime-500/10 to-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                <Swords size={15} />
              </div>
              <div>
                <span className="text-emerald-300 font-bold block">
                  Challenge from {challengeInfo.by}!
                </span>
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-white font-mono">{challengeInfo.targetGuesses > 0 ? `${challengeInfo.targetGuesses}/6 tries` : "Solve it!"}</strong>
                  {challengeInfo.targetSecs > 0 && ` in ${formatTime(challengeInfo.targetSecs)}`}
                </span>
              </div>
            </div>
            {challengeInfo.targetGuesses > 0 && (
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  guesses.length < challengeInfo.targetGuesses
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                {guesses.length < challengeInfo.targetGuesses ? "Leading ⚡" : "Tied/Trailing"}
              </span>
            )}
          </div>
        )}

        {/* Theme & Clue Prompt */}
        <div className="text-center text-xs text-slate-400 font-medium">
          Theme: <span className="text-[#c7f36b] font-semibold">{edition.theme}</span>
        </div>

        {/* 6-Row Guess Matrix */}
        <div className="my-auto space-y-1.5 sm:space-y-2">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const rowGuess = rowIndex < guesses.length ? guesses[rowIndex] : isCurrentRow ? currentGuess : "";
            const evaluation = rowIndex < guesses.length ? evaluateWordleGuess(rowGuess, edition.solution) : null;

            return (
              <div
                key={rowIndex}
                className={`flex gap-1.5 sm:gap-2 justify-center ${
                  isCurrentRow && isShaking ? "animate-bounce" : ""
                }`}
              >
                {Array.from({ length: 5 }).map((_, colIndex) => {
                  const letter = rowGuess[colIndex] || "";
                  const evalItem = evaluation ? evaluation[colIndex] : null;

                  let cellBg = "bg-slate-900/80 border-white/15 text-white";
                  if (evalItem) {
                    if (evalItem.status === "correct") {
                      cellBg = "bg-[#10b981] border-[#10b981] text-white font-black shadow-md shadow-emerald-500/20";
                    } else if (evalItem.status === "present") {
                      cellBg = "bg-[#f59e0b] border-[#f59e0b] text-white font-black shadow-md shadow-amber-500/20";
                    } else {
                      cellBg = "bg-slate-800 border-slate-700 text-slate-400";
                    }
                  } else if (isCurrentRow && colIndex < revealedLettersCount && letter) {
                    cellBg = "bg-emerald-900/70 border-emerald-400 text-emerald-100 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40 scale-105";
                  } else if (letter) {
                    cellBg = "bg-slate-800/90 border-white/40 text-white scale-105";
                  }

                  return (
                    <div
                      key={colIndex}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center font-bold text-lg sm:text-xl transition-all duration-200 ${cellBg}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Message Banner */}
        {message && (
          <div className="my-2 px-4 py-1.5 rounded-xl bg-slate-800 border border-white/15 text-xs font-semibold text-amber-300 flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle size={14} />
            <span>{message}</span>
          </div>
        )}

        {/* Solved / Game Over Banner */}
        {(isSolved || isGameOver) && (
          <div className="my-2 w-full p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-3 shadow-xl animate-in zoom-in-95">
            {challengeInfo && challengeInfo.targetGuesses > 0 && isSolved && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  guesses.length <= challengeInfo.targetGuesses
                    ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                    : "bg-amber-950/50 border-amber-500/40 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{guesses.length <= challengeInfo.targetGuesses ? "🏆" : "⏱️"}</span>
                  <span className="font-bold">
                    {guesses.length < challengeInfo.targetGuesses
                      ? `You beat ${challengeInfo.by}!`
                      : guesses.length === challengeInfo.targetGuesses
                      ? `Tied with ${challengeInfo.by}!`
                      : `${challengeInfo.by} won this round!`}
                  </span>
                </div>
                <span className="font-mono font-bold">
                  {guesses.length}/6 vs {challengeInfo.targetGuesses}/6
                </span>
              </div>
            )}

            <div>
              <h4 className="font-bold text-sm text-emerald-300">
                {isSolved ? `Splendid! You found ${edition.solution} in ${guesses.length}/6 tries!` : `The word was ${edition.solution}`}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ⏱️ Completed in {formatTime(seconds)} · Challenge your friends to beat your guesses!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
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

        {/* Onscreen Keyboard */}
        <div className="w-full max-w-md pt-2 space-y-1.5 pb-2">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((key) => {
                const status = keyStatuses[key];
                let keyBg = "bg-slate-800/90 text-white hover:bg-slate-700 border-white/10";
                if (status === "correct") {
                  keyBg = "bg-[#10b981] text-white font-bold border-[#10b981]";
                } else if (status === "present") {
                  keyBg = "bg-[#f59e0b] text-white font-bold border-[#f59e0b]";
                } else if (status === "absent") {
                  keyBg = "bg-slate-900 text-slate-500 border-transparent opacity-60";
                }

                const isWide = key === "ENTER" || key === "BACKSPACE";

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    className={`h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm border transition-all active:scale-95 flex items-center justify-center ${
                      isWide ? "px-2.5 sm:px-3 text-[11px]" : "flex-1 min-w-[28px] max-w-[40px]"
                    } ${keyBg}`}
                  >
                    {key === "BACKSPACE" ? <Delete size={16} /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e1628] border border-white/20 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base">How to Play Wordle Plus</h3>
              <button type="button" onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>• Guess the 5-letter word in 6 tries.</p>
              <p>• Each guess must be a valid 5-letter English word.</p>
              <p>• The color of the tiles will change to show how close your guess was:</p>
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-[#10b981] flex items-center justify-center font-bold text-white text-xs">W</span>
                  <span><b>Green:</b> Letter is in the word and in the correct spot.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-[#f59e0b] flex items-center justify-center font-bold text-white text-xs">I</span>
                  <span><b>Yellow:</b> Letter is in the word but in the wrong spot.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">N</span>
                  <span><b>Gray:</b> Letter is not in the word in any spot.</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Start Guessing!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
