import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { OrbitAudio } from "@/game/audio";
import { 
  type CellCoord, 
  type StrandsWord, 
  type StrandsEdition,
  cellKey, 
  isAdjacent, 
  isValidPath, 
  getWordFromPath 
} from "@/game/logicPuzzles/strands";
import { getStrandsEditionForDate } from "@/game/logicPuzzles/strandsBank";
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
  Send,
  Flame,
  Waypoints
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

export default function StrandsPuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: StrandsEdition = useMemo(() => getStrandsEditionForDate(dateStr), [dateStr]);

  // Game state
  const [currentPath, setCurrentPath] = useState<CellCoord[]>([]);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [foundWords, setFoundWords] = useState<StrandsWord[]>([]);
  const [foundSpangram, setFoundSpangram] = useState<StrandsWord | null>(null);
  const [bonusWordsFound, setBonusWordsFound] = useState<string[]>([]);
  const [hintCredits, setHintCredits] = useState(0);
  const [activeHintWord, setActiveHintWord] = useState<StrandsWord | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "theme" | "spangram" | "bonus" | "error" | "info" } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [orderOfFound, setOrderOfFound] = useState<("theme" | "spangram" | "hint")[]>([]);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Total words to find: theme words + 1 spangram
  const totalTargetWords = edition.themeWords.length + 1;
  const currentFoundCount = foundWords.length + (foundSpangram ? 1 : 0);
  const isSolved = currentFoundCount === totalTargetWords;

  // Track timer
  useEffect(() => {
    if (isSolved) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSolved]);

  // Victory handling
  useEffect(() => {
    if (isSolved) {
      audio.current.play("puzzleSolve");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      const editionSlug = edition.id.startsWith("strands-") ? edition.id : `strands-${edition.id}`;
      markPuzzleFieldComplete("strands", edition.id);
      markPuzzleFieldComplete(`strands-${editionSlug}`, dateStr);
    }
  }, [isSolved, edition.id, dateStr]);

  // Set of cells already used by found words or spangram
  const usedCells = useMemo(() => {
    const map = new Map<string, { isSpangram: boolean; wordIndex: number }>();
    foundWords.forEach((fw, wIdx) => {
      fw.path.forEach(c => {
        map.set(cellKey(c), { isSpangram: false, wordIndex: wIdx });
      });
    });
    if (foundSpangram) {
      foundSpangram.path.forEach(c => {
        map.set(cellKey(c), { isSpangram: true, wordIndex: -1 });
      });
    }
    return map;
  }, [foundWords, foundSpangram]);

  // Cells in active hint
  const hintCellKeys = useMemo(() => {
    if (!activeHintWord) return new Set<string>();
    return new Set(activeHintWord.path.map(cellKey));
  }, [activeHintWord]);

  // Selected word string
  const currentWord = useMemo(() => {
    return getWordFromPath(edition.grid, currentPath);
  }, [edition.grid, currentPath]);

  // Show banner feedback message
  const showFeedback = useCallback((text: string, type: "theme" | "spangram" | "bonus" | "error" | "info") => {
    setMessage({ text, type });
    if (type === "error") {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
    setTimeout(() => {
      setMessage(m => (m?.text === text ? null : m));
    }, 2400);
  }, []);

  // Submit current path
  const submitPath = useCallback(() => {
    if (currentPath.length < 3) {
      setCurrentPath([]);
      return;
    }

    const word = getWordFromPath(edition.grid, currentPath);

    // 1. Check if Spangram
    if (word === edition.spangram && !foundSpangram) {
      audio.current.play("gate");
      setFoundSpangram({ word, path: [...currentPath], isSpangram: true });
      setOrderOfFound(prev => [...prev, "spangram"]);
      showFeedback(`SPANGRAM: ${word}!`, "spangram");
      if (activeHintWord?.word === word) setActiveHintWord(null);
      setCurrentPath([]);
      return;
    }

    // 2. Check if Theme Word
    const matchedTheme = edition.themeWords.find(tw => tw.word === word);
    if (matchedTheme) {
      const alreadyFound = foundWords.some(fw => fw.word === word);
      if (alreadyFound) {
        audio.current.play("relayFail");
        showFeedback(`Already found: ${word}`, "info");
      } else {
        audio.current.play("relayCorrect");
        setFoundWords(prev => [...prev, { ...matchedTheme, path: [...currentPath] }]);
        setOrderOfFound(prev => [...prev, activeHintWord?.word === word ? "hint" : "theme"]);
        showFeedback(`Theme Word: ${word}!`, "theme");
        if (activeHintWord?.word === word) setActiveHintWord(null);
      }
      setCurrentPath([]);
      return;
    }

    // 3. Check if Valid Bonus Word (charges hint meter)
    const isBonus = edition.bonusWords.includes(word);
    if (isBonus) {
      if (bonusWordsFound.includes(word)) {
        audio.current.play("relayFail");
        showFeedback(`Already used bonus: ${word}`, "info");
      } else {
        audio.current.play("toggle");
        const nextBonus = [...bonusWordsFound, word];
        setBonusWordsFound(nextBonus);
        const nextCredits = hintCredits + 1;
        setHintCredits(nextCredits);
        showFeedback(`Bonus word! ${word} (+1 Hint charge)`, "bonus");
      }
      setCurrentPath([]);
      return;
    }

    // 4. Invalid guess
    audio.current.play("relayFail");
    showFeedback(`Not in theme: ${word}`, "error");
    setCurrentPath([]);
  }, [currentPath, edition, foundSpangram, foundWords, activeHintWord, bonusWordsFound, hintCredits, showFeedback]);

  // Add cell to path
  const addCell = useCallback((c: CellCoord) => {
    const k = cellKey(c);
    // Cannot select already completed cells
    if (usedCells.has(k)) return;

    setCurrentPath(prev => {
      if (prev.length === 0) return [c];

      // If clicking the previous cell, undo last step (backtracking)
      if (prev.length > 1 && cellKey(prev[prev.length - 2]) === k) {
        audio.current.play("rotate");
        return prev.slice(0, -1);
      }

      // If already in current path, ignore
      if (prev.some(p => cellKey(p) === k)) return prev;

      // Must be adjacent to last cell
      const last = prev[prev.length - 1];
      if (isAdjacent(last, c)) {
        audio.current.play("rotate");
        return [...prev, c];
      }

      return prev;
    });
  }, [usedCells]);

  // Pointer event handlers for drag connecting
  const handlePointerDown = (c: CellCoord) => {
    if (isSolved) return;
    const k = cellKey(c);
    if (usedCells.has(k)) return;

    setIsPointerDown(true);
    setCurrentPath([c]);
    audio.current.play("rotate");
  };

  const handlePointerEnter = (c: CellCoord) => {
    if (!isPointerDown || isSolved) return;
    addCell(c);
  };

  const handlePointerUp = () => {
    if (!isPointerDown) return;
    setIsPointerDown(false);
    submitPath();
  };

  // Use Hint
  const handleUseHint = () => {
    if (hintCredits < 3) return;
    // Find first unfound theme word or spangram
    const unfoundTheme = edition.themeWords.find(tw => !foundWords.some(fw => fw.word === tw.word));
    const target = unfoundTheme || null;
    if (target) {
      audio.current.play("toggle");
      setActiveHintWord(target);
      setHintCredits(c => c - 3);
      setHintsUsed(h => h + 1);
      showFeedback(`Hint: letters highlighted for an unfound word!`, "info");
    }
  };

  // Reset puzzle
  const handleReset = () => {
    audio.current.play("rotate");
    setCurrentPath([]);
    setFoundWords([]);
    setFoundSpangram(null);
    setBonusWordsFound([]);
    setHintCredits(0);
    setActiveHintWord(null);
    setMessage(null);
    setOrderOfFound([]);
    setSeconds(0);
  };

  // Share text generator
  const getShareText = () => {
    const emojis = orderOfFound.map(item => {
      if (item === "spangram") return "🟡";
      if (item === "hint") return "💡";
      return "🔵";
    }).join("");

    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");

    return `Strands (Theme Threads) — ${dateStr}
Theme: "${edition.theme}"
${emojis}
Found: ${currentFoundCount}/${totalTargetWords} words
Time: ${m}:${s} · Hints: ${hintsUsed}
Play free at: ${window.location.origin}/games/strands`;
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Helper to format mm:ss
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col font-sans select-none" onPointerUp={handlePointerUp}>
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#090e1c]/80 backdrop-blur px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/games" className="inline-flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">GAMES BAY</span>
          </Link>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold">STRANDS</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-white/60">{dateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-mono text-white/70 bg-black/40 px-2.5 py-1 rounded border border-white/10">
            <Timer size={14} className="text-cyan-400" />
            <span>{formatTime(seconds)}</span>
          </div>
          <GameAudioControls audio={audio} />
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
            title="How to play"
            aria-label="Rules"
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col items-center">
        {/* Theme Banner */}
        <div className="w-full text-center my-2 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80">TODAY&apos;S THEME</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>&ldquo;{edition.theme}&rdquo;</span>
          </h1>
          <p className="text-xs text-white/60 italic font-mono max-w-md mx-auto">
            {edition.themeClue}
          </p>
        </div>

        {/* Progress & Hint Ribbon */}
        <div className="w-full bg-[#0d1424] border border-white/10 rounded-xl p-3 my-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white/60">THEME WORDS:</span>
            <b className="text-cyan-400 text-sm">{currentFoundCount}/{totalTargetWords}</b>
            {foundSpangram && (
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-bold">
                SPANGRAM FOUND
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseHint}
            disabled={hintCredits < 3 || isSolved}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold ${
              hintCredits >= 3
                ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 cursor-pointer animate-bounce"
                : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed"
            }`}
          >
            <Lightbulb size={14} className={hintCredits >= 3 ? "text-black fill-black" : ""} />
            <span>Hint ({Math.min(hintCredits, 3)}/3)</span>
          </button>
        </div>

        {/* Current Active Word Display */}
        <div className="h-10 w-full flex items-center justify-center mb-1">
          {message ? (
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold animate-fade-in ${
              message.type === "spangram" ? "bg-amber-400 text-black" :
              message.type === "theme" ? "bg-cyan-400 text-black" :
              message.type === "bonus" ? "bg-emerald-400 text-black" :
              message.type === "error" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
              "bg-white/10 text-white"
            }`}>
              {message.text}
            </div>
          ) : currentWord ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-widest text-cyan-300 font-mono px-4 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-400/30">
                {currentWord}
              </span>
              <button
                type="button"
                onClick={submitPath}
                className="text-xs bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold px-2.5 py-1.5 rounded shadow"
              >
                SUBMIT
              </button>
              <button
                type="button"
                onClick={() => setCurrentPath([])}
                className="text-white/40 hover:text-white p-1"
                title="Cancel selection"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-white/40 font-mono">Drag or click letters to form words</span>
          )}
        </div>

        {/* 8 rows x 6 cols Strands Grid */}
        <div 
          ref={gridContainerRef}
          className={`grid grid-cols-6 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-[#0a1020] border border-white/10 rounded-2xl shadow-2xl relative select-none touch-none ${isShaking ? "animate-shake" : ""}`}
        >
          {edition.grid.map((rowArr, r) =>
            rowArr.map((letter, c) => {
              const coord: CellCoord = { row: r, col: c };
              const k = cellKey(coord);
              const usedInfo = usedCells.get(k);
              const isSelected = currentPath.some(p => cellKey(p) === k);
              const isHint = hintCellKeys.has(k);

              let cellStyle = "bg-[#11182c] text-white hover:bg-slate-700/60 border-white/10";
              if (usedInfo) {
                if (usedInfo.isSpangram) {
                  cellStyle = "bg-amber-400 text-black font-extrabold border-amber-300 shadow-md shadow-amber-400/20";
                } else {
                  cellStyle = "bg-cyan-400 text-black font-extrabold border-cyan-300 shadow-md shadow-cyan-400/20";
                }
              } else if (isSelected) {
                cellStyle = "bg-cyan-500/40 text-cyan-200 border-cyan-400 ring-2 ring-cyan-400/50 scale-95";
              } else if (isHint) {
                cellStyle = "bg-amber-950/40 text-amber-200 border-dashed border-amber-400 animate-pulse";
              }

              return (
                <button
                  key={k}
                  type="button"
                  data-row={r}
                  data-col={c}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handlePointerDown(coord);
                  }}
                  onPointerEnter={() => handlePointerEnter(coord)}
                  onClick={() => {
                    // Click fallback for non-drag interaction
                    if (!isPointerDown) {
                      addCell(coord);
                    }
                  }}
                  disabled={isSolved || !!usedInfo}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all border ${cellStyle}`}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full flex items-center justify-between mt-4 px-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white font-mono transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Grid</span>
          </button>

          <span className="text-[11px] font-mono text-white/40">
            {bonusWordsFound.length} bonus word{bonusWordsFound.length === 1 ? "" : "s"} found
          </span>
        </div>

        {/* Solved Victory Card */}
        {isSolved && (
          <div className="w-full my-6 p-6 rounded-2xl bg-gradient-to-b from-cyan-950/60 via-[#0a1224] to-[#0a1020] border border-cyan-400/40 shadow-2xl text-center animate-fade-in space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Trophy size={32} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">PUZZLE MASTERED</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">Theme Threads Complete!</h2>
              <p className="text-sm text-white/70">
                You discovered every single theme word and navigated the Spangram!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-xs font-mono">
              <div>
                <span className="text-white/50 block">TIME</span>
                <b className="text-cyan-400 text-sm">{formatTime(seconds)}</b>
              </div>
              <div>
                <span className="text-white/50 block">WORDS</span>
                <b className="text-white text-sm">{totalTargetWords}</b>
              </div>
              <div>
                <span className="text-white/50 block">HINTS USED</span>
                <b className="text-amber-400 text-sm">{hintsUsed}</b>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={copyShare}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                <span>{copied ? "COPIED TO CLIPBOARD" : "COPY SCORE RESULTS"}</span>
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="py-3 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs uppercase font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Send size={15} />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Waypoints size={20} className="text-cyan-400" />
                <h3 className="font-bold text-lg text-white">How to Play Strands</h3>
              </div>
              <button type="button" onClick={() => setShowRules(false)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-white/80">
              <p>
                <b>1. Find the Theme Words:</b> Connect adjacent letters horizontally, vertically, or diagonally to spell words that match today&apos;s theme.
              </p>
              <p>
                <b>2. Uncover the Spangram:</b> There is one special word (colored in <span className="text-amber-400 font-bold">yellow</span>) that captures the overarching theme and touches opposite borders of the board.
              </p>
              <p>
                <b>3. Every Letter is Used:</b> By the end of the puzzle, every single letter in the 8×6 grid will belong to a theme word or the Spangram!
              </p>
              <p>
                <b>4. Earn Hints:</b> Find valid non-theme English words of 4+ letters to fill your hint meter. Every 3 bonus words unlocks 1 hint!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider hover:bg-cyan-300"
            >
              GOT IT, LET&apos;S PLAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
