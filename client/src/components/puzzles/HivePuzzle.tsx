import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { OrbitAudio } from "@/game/audio";
import { 
  getHiveEditionForDate, 
  type HiveEdition,
  HIVE_RANKS
} from "@/game/logicPuzzles/hiveBank";
import { 
  validateWordGuess, 
  getMaxScore, 
  getCurrentRank, 
  shuffleLetters,
  isPangram 
} from "@/game/logicPuzzles/hive";
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
  Shuffle, 
  Delete,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Award,
  Swords,
  Send,
  Flame
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

export default function HivePuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: HiveEdition = useMemo(() => getHiveEditionForDate(dateStr), [dateStr]);
  const maxScore = useMemo(() => getMaxScore(edition), [edition]);

  // Game state
  const [outerLetters, setOuterLetters] = useState<string[]>(() => [...edition.outerLetters]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "pangram" } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showFoundDrawer, setShowFoundDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hintTargetWord, setHintTargetWord] = useState<string | null>(null);
  const [hintRevealedLength, setHintRevealedLength] = useState<number>(0);

  // Sync outer letters if edition changes
  useEffect(() => {
    setOuterLetters([...edition.outerLetters]);
    setHintTargetWord(null);
    setHintRevealedLength(0);
  }, [edition]);

  // Timer
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Peer-to-Peer Automated Challenge System
  const challengeInfo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const by = params.get("by");
    const targetSecs = Number(params.get("time")) || 0;
    const rank = params.get("rank") || "Queen Bee";
    if (by || targetSecs > 0) {
      return { by: by || "A Friend", targetSecs, rank };
    }
    return null;
  }, []);

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Current rank info
  const rankInfo = useMemo(() => getCurrentRank(score, maxScore), [score, maxScore]);

  // Mark completion if Genius rank (70%+) reached
  useEffect(() => {
    if (rankInfo.rank.pct >= 0.7) {
      const editionSlug = edition.id.startsWith("hive-") ? edition.id : `hive-${edition.id}`;
      markPuzzleFieldComplete("hive", edition.id);
      markPuzzleFieldComplete(`hive-${editionSlug}`, dateStr);
    }
  }, [rankInfo.rank.pct, edition.id, dateStr]);

  // Reset
  const handleReset = () => {
    audio.current.play("rotate");
    setCurrentWord("");
    setFoundWords([]);
    setScore(0);
    setMessage(null);
    setSeconds(0);
    setHintTargetWord(null);
    setHintRevealedLength(0);
    setOuterLetters([...edition.outerLetters]);
  };

  // Shuffle outer letters
  const handleShuffle = () => {
    audio.current.play("rotate");
    setOuterLetters((prev) => shuffleLetters(prev));
  };

  // Add letter
  const handleAddLetter = (letter: string) => {
    audio.current.play("fragment");
    setCurrentWord((prev) => (prev + letter).toUpperCase());
    setMessage(null);
  };

  // Backspace / Delete
  const handleDelete = () => {
    if (currentWord.length > 0) {
      audio.current.play("toggle");
      setCurrentWord((prev) => prev.slice(0, -1));
      setMessage(null);
    }
  };

  // Submit word
  const handleSubmit = () => {
    if (!currentWord.trim()) return;

    const validation = validateWordGuess(currentWord, edition, foundWords);

    if (validation.valid) {
      const upper = currentWord.toUpperCase();
      const newFound = [...foundWords, upper];
      setFoundWords(newFound);
      setScore((s) => s + validation.score);
      setCurrentWord("");

      // If user completed the hinted target word, clear hint state so next hint picks the next word!
      if (hintTargetWord && upper === hintTargetWord.toUpperCase()) {
        setHintTargetWord(null);
        setHintRevealedLength(0);
      }

      if (validation.isPangram) {
        audio.current.play("puzzleSolve");
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#fbbf24", "#fef08a", "#10b981", "#3b82f6"]
        });
        setMessage({ text: validation.message || "Pangram! 🌟", type: "pangram" });
      } else {
        audio.current.play("relayCorrect");
        setMessage({ text: validation.message || `+${validation.score} pts!`, type: "success" });
      }

      // Check if all words completed in the edition!
      if (newFound.length >= edition.validWords.length) {
        const editionSlug = edition.id.startsWith("hive-") ? edition.id : `hive-${edition.id}`;
        markPuzzleFieldComplete("hive", edition.id);
        markPuzzleFieldComplete(`hive-${editionSlug}`, dateStr);
        setTimeout(() => {
          audio.current.play("puzzleSolve");
          confetti({
            particleCount: 140,
            spread: 100,
            origin: { y: 0.5 },
            colors: ["#f59e0b", "#fbbf24", "#fef08a", "#10b981", "#38bdf8", "#ec4899"]
          });
          setShowVictoryModal(true);
        }, 600);
      }

      // Auto dismiss message after 2.5s
      setTimeout(() => {
        setMessage((prev) => (prev?.type !== "pangram" ? null : prev));
      }, 2500);
    } else {
      audio.current.play("relayFail");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setMessage({ text: validation.message || "Invalid word", type: "error" });
    }
  };

  // Progressive Multi-Letter Hint
  const handleHint = () => {
    audio.current.play("relayCorrect");

    const unfound = edition.validWords.filter((w) => !foundWords.includes(w.toUpperCase()));
    const unfoundPangrams = edition.pangrams.filter((p) => !foundWords.includes(p.toUpperCase()));

    if (unfound.length === 0) {
      setMessage({
        text: `🎉 Incredible! You have found all ${edition.validWords.length} words in The Hive!`,
        type: "success"
      });
      return;
    }

    let target = hintTargetWord;
    let currentLen = hintRevealedLength;

    // Check if target is invalid, already found, or already 100% revealed
    if (!target || !unfound.includes(target) || currentLen >= target.length) {
      if (target && unfound.includes(target)) {
        // User already reached full word length and tapped hint again -> advance to next unfound word
        const currentIdx = unfound.indexOf(target);
        target = unfound[(currentIdx + 1) % unfound.length];
      } else if (unfoundPangrams.length > 0) {
        // Prioritize unfound pangram first
        target = unfoundPangrams[0];
      } else {
        target = unfound[0];
      }
      currentLen = 0;
    }

    // Advance revealed count: start at 2 letters, then 3, 4, 5... all the way to full word length
    const nextLen = currentLen === 0 ? Math.min(2, target.length) : currentLen + 1;
    const prefix = target.slice(0, nextLen);

    setHintTargetWord(target);
    setHintRevealedLength(nextLen);
    setCurrentWord(prefix);

    const isTargetPangram = isPangram(target, edition);

    if (nextLen >= target.length) {
      // Full word revealed!
      audio.current.play("puzzleSolve");
      setMessage({
        text: `💡 Word Revealed: "${target}" (${target.length} letters${isTargetPangram ? " · ⭐ Pangram!" : ""}) — Tap Enter to score!`,
        type: isTargetPangram ? "pangram" : "success"
      });
    } else {
      setMessage({
        text: `💡 Hint (${nextLen}/${target.length} letters): "${prefix}..." ${isTargetPangram ? "· ⭐ Pangram Clue" : ""} — Tap Hint for next letter!`,
        type: isTargetPangram ? "pangram" : "success"
      });
    }
  };

  // Skip / switch to next unfound word hint
  const handleNextWordHint = () => {
    audio.current.play("rotate");
    const unfound = edition.validWords.filter((w) => !foundWords.includes(w.toUpperCase()));
    if (unfound.length === 0) return;

    let nextTarget = unfound[0];
    if (hintTargetWord && unfound.includes(hintTargetWord)) {
      const idx = unfound.indexOf(hintTargetWord);
      nextTarget = unfound[(idx + 1) % unfound.length];
    } else if (unfound.length > 1) {
      nextTarget = unfound[1];
    }

    const nextLen = Math.min(2, nextTarget.length);
    const prefix = nextTarget.slice(0, nextLen);

    setHintTargetWord(nextTarget);
    setHintRevealedLength(nextLen);
    setCurrentWord(prefix);

    const isTargetPangram = isPangram(nextTarget, edition);
    setMessage({
      text: `💡 Next Word Target: "${prefix}..." (${nextLen}/${nextTarget.length} letters${isTargetPangram ? " · ⭐ Pangram" : ""}) — Tap Hint for more letters!`,
      type: isTargetPangram ? "pangram" : "success"
    });
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();

      if (key === "ENTER") {
        e.preventDefault();
        handleSubmit();
      } else if (key === "BACKSPACE" || key === "DELETE") {
        e.preventDefault();
        handleDelete();
      } else if (key === " " || key === "TAB") {
        e.preventDefault();
        handleShuffle();
      } else if (/^[A-Z]$/.test(key)) {
        const allLetters = [edition.centerLetter.toUpperCase(), ...edition.outerLetters.map((l) => l.toUpperCase())];
        if (allLetters.includes(key)) {
          e.preventDefault();
          handleAddLetter(key);
        }
      }
    },
    [currentWord, edition, foundWords]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Open Victory & Share Modal
  const handleShare = () => {
    audio.current.play("relayCorrect");
    setShowVictoryModal(true);
  };

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/hive?by=Friend&time=${seconds}&rank=${encodeURIComponent(rankInfo.rank.name)}`;
  };

  const getViralShareText = () => {
    const isCompleted = foundWords.length >= edition.validWords.length;
    const challengeUrl = getChallengeUrl();
    const pangramsFoundCount = foundWords.filter((w) => isPangram(w, edition)).length;

    return `🐝 Can you beat my time in The Hive?\n` +
      `🏆 Rank: ${rankInfo.rank.emoji} ${rankInfo.rank.name} (${score}/${maxScore} pts)\n` +
      `⏱️ Time: ${formatTime(seconds)} | Words: ${foundWords.length}/${edition.validWords.length} ${isCompleted ? "👑 (100% Solved!)" : ""}\n` +
      `⭐ Pangram: ${pangramsFoundCount > 0 ? "Found! 🌟" : "None yet"}\n\n` +
      `⚔️ Tap here to accept my challenge:\n` +
      `${challengeUrl}`;
  };

  const handleWhatsAppShare = () => {
    audio.current.play("relayCorrect");
    const text = getViralShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleTwitterShare = () => {
    audio.current.play("relayCorrect");
    const text = getViralShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyShareCard = async () => {
    audio.current.play("relayCorrect");
    const shareText = getViralShareText();
    const challengeUrl = getChallengeUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `The Hive Challenge - Beat ${formatTime(seconds)}!`,
          text: shareText,
          url: challengeUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Group found words alphabetically
  const sortedFoundWords = useMemo(() => {
    return [...foundWords].sort();
  }, [foundWords]);

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
                The Hive <span className="text-amber-400 text-xs">🐝</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">7-Letter Honeycomb Word Builder</span>
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
            title="How to play & scoring rules"
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button 
            type="button" 
            className={`logic-action ${hintTargetWord ? "border-amber-500/40 text-amber-300 bg-amber-500/10" : ""}`}
            onClick={handleHint} 
            title="Reveal letters of target word"
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span className="hidden sm:inline">
              {hintTargetWord ? `Hint (${hintRevealedLength}/${hintTargetWord.length})` : "Hint"}
            </span>
          </button>

          {hintTargetWord && (
            <button 
              type="button" 
              className="logic-action text-slate-300 hover:text-white" 
              onClick={handleNextWordHint} 
              title="Skip to next word hint"
            >
              <ChevronRight size={14} className="text-amber-400" />
              <span className="hidden sm:inline">Next Word</span>
            </button>
          )}

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
            title="Share your score"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* Main Playfield Layout */}
      <main className="flex-1 overflow-y-auto px-4 py-3 flex flex-col items-center justify-between max-w-2xl mx-auto w-full">
        {/* Automated Peer-to-Peer Challenge Inbound Banner */}
        {challengeInfo && (
          <div className="w-full max-w-md mb-2 p-2.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                <Swords size={15} />
              </div>
              <div>
                <span className="text-amber-300 font-bold block">
                  Challenge from {challengeInfo.by}!
                </span>
                <span className="text-[11px] text-slate-400">
                  Target to beat:{" "}
                  <strong className="text-white font-mono">
                    {challengeInfo.targetSecs > 0 ? formatTime(challengeInfo.targetSecs) : challengeInfo.rank}
                  </strong>
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

        {/* Rank & Points Progression Bar */}
        <section className="w-full max-w-md mt-1 mb-2 bg-slate-900/70 border border-white/10 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="text-base">{rankInfo.rank.emoji}</span>
              <span className="text-amber-300 font-semibold">{rankInfo.rank.name}</span>
              <span className="text-slate-400 text-[11px] font-normal">({score} pts)</span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              {rankInfo.nextRank ? (
                <span>{rankInfo.pointsToNext} pts to {rankInfo.nextRank.name}</span>
              ) : (
                <span className="text-amber-400 font-bold">Queen Bee Max! 👑</span>
              )}
            </div>
          </div>

          {/* Stepped Progress Milestones */}
          <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-300 rounded-full"
              style={{ width: `${rankInfo.progressPercent}%` }}
            />
          </div>

          {/* Rank Milestones markers */}
          <div className="flex justify-between items-center px-1 mt-1 text-[9px] text-slate-500 font-mono">
            {HIVE_RANKS.map((r, i) => (
              <span 
                key={r.name} 
                className={`${rankInfo.rank.pct >= r.pct ? "text-amber-400 font-bold" : "text-slate-600"}`}
                title={`${r.name} (${Math.round(r.pct * maxScore)} pts)`}
              >
                {i % 2 === 0 ? r.emoji : "•"}
              </span>
            ))}
          </div>

          {/* 1-by-1 Step Progress Tracker */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
              <span className="text-amber-400 font-bold">Goal:</span>
              <span className="text-white font-bold">{foundWords.length}</span>
              <span className="text-slate-500">/</span>
              <span className="text-amber-300 font-bold">{edition.validWords.length} Words</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">(1-by-1)</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: edition.validWords.length }).map((_, idx) => {
                const isFound = idx < foundWords.length;
                return (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isFound
                        ? "w-2.5 sm:w-3 bg-amber-400 shadow-sm shadow-amber-400/50"
                        : "w-1.5 bg-slate-800"
                    }`}
                    title={`Word ${idx + 1}: ${isFound ? "Found ✓" : "Unsolved"}`}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Dynamic Feedback Message */}
        <div className="min-h-[2.4rem] flex items-center justify-center w-full px-2">
          {message && (
            <div 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in zoom-in-95 duration-150 ${
                message.type === "pangram"
                  ? "bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300"
                  : message.type === "success"
                  ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-950/90 text-rose-300 border border-rose-500/40"
              }`}
            >
              {message.type === "pangram" && <Sparkles size={13} className="text-slate-950 shrink-0 animate-spin" />}
              <span>{message.text}</span>
              {hintTargetWord && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextWordHint();
                  }}
                  className="ml-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-inherit text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95 shrink-0"
                  title="Switch to next word"
                >
                  <span>Next Word</span>
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Word Construction Display */}
        <div 
          className={`flex items-center justify-center tracking-widest text-3xl sm:text-4xl font-black h-12 my-1 transition-transform ${
            isShaking ? "animate-shake text-rose-400" : "text-white"
          }`}
        >
          {currentWord ? (
            currentWord.split("").map((ch, idx) => (
              <span 
                key={idx} 
                className={ch === edition.centerLetter.toUpperCase() ? "text-amber-400 font-black" : "text-white"}
              >
                {ch}
              </span>
            ))
          ) : (
            <span className="text-slate-600 text-sm font-sans tracking-normal font-medium flex items-center gap-1.5">
              Type or tap letters to spell words
            </span>
          )}
          <span className="w-0.5 h-7 bg-amber-400 ml-1 animate-pulse" />
        </div>

        {/* Honeycomb Hexagonal Field */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Classic 3-column hexagonal interlocking grid */}
          <div className="flex items-center gap-2">
            {/* Column 1 (Left 2 hexagons) */}
            <div className="flex flex-col gap-2 pt-10">
              <HexButton 
                letter={outerLetters[0]} 
                onClick={() => handleAddLetter(outerLetters[0])} 
              />
              <HexButton 
                letter={outerLetters[1]} 
                onClick={() => handleAddLetter(outerLetters[1])} 
              />
            </div>

            {/* Column 2 (Center 3 hexagons with golden center) */}
            <div className="flex flex-col gap-2">
              <HexButton 
                letter={outerLetters[2]} 
                onClick={() => handleAddLetter(outerLetters[2])} 
              />
              <HexButton 
                letter={edition.centerLetter} 
                isCenter 
                onClick={() => handleAddLetter(edition.centerLetter)} 
              />
              <HexButton 
                letter={outerLetters[3]} 
                onClick={() => handleAddLetter(outerLetters[3])} 
              />
            </div>

            {/* Column 3 (Right 2 hexagons) */}
            <div className="flex flex-col gap-2 pt-10">
              <HexButton 
                letter={outerLetters[4]} 
                onClick={() => handleAddLetter(outerLetters[4])} 
              />
              <HexButton 
                letter={outerLetters[5]} 
                onClick={() => handleAddLetter(outerLetters[5])} 
              />
            </div>
          </div>
        </div>

        {/* Action Controls (Delete, Shuffle, Enter) */}
        <div className="flex items-center justify-center gap-3 mt-3 w-full max-w-xs">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2.5 rounded-full border border-white/20 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Delete size={14} />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            title="Shuffle outer letters (Spacebar)"
            className="w-11 h-11 rounded-full border border-white/20 bg-slate-900/80 hover:bg-slate-800 text-amber-400 flex items-center justify-center shadow-sm active:scale-95 active:rotate-180 transition-all"
          >
            <Shuffle size={16} />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-full border border-amber-400/40 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold tracking-wider flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span>Enter</span>
          </button>
        </div>

        {/* Found Words Drawer / Strip */}
        <section className="w-full max-w-md mt-4 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setShowFoundDrawer(!showFoundDrawer)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="font-semibold flex items-center gap-2">
              <Award size={13} className="text-amber-400" />
              <span>You have found {foundWords.length} words</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">
                {foundWords.filter((w) => isPangram(w, edition)).length > 0 && "⭐ Pangram found"}
              </span>
              {showFoundDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {showFoundDrawer && (
            <div className="mt-2 max-h-36 overflow-y-auto p-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs space-y-1">
              {sortedFoundWords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {sortedFoundWords.map((word) => {
                    const pangram = isPangram(word, edition);
                    return (
                      <span
                        key={word}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                          pangram
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                            : "bg-slate-800 text-slate-300 border border-white/5"
                        }`}
                      >
                        {word} {pangram && "⭐"}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic text-center py-2 text-[11px]">
                  Words you find will appear here in alphabetical order.
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐝</span>
                <h3 className="font-bold text-white text-base">How to Play The Hive</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowRules(false)} 
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>Construct words using the 7 letters in the honeycomb:</p>
              
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Words must have at least <strong className="text-white">4 letters</strong>.</li>
                <li>Words <strong className="text-amber-400">MUST include the center yellow letter</strong>.</li>
                <li>Daily editions feature a curated set of <strong className="text-white">12 recognizable words</strong> to find 1-by-1.</li>
                <li>Proper nouns, hyphens, and profanity do not qualify.</li>
              </ul>

              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <h4 className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider">Scoring Guide</h4>
                <p className="text-[11px] text-slate-400">
                  • 4-letter words are worth <strong className="text-white">1 point</strong>.<br />
                  • 5+ letter words earn <strong className="text-white">1 point per letter</strong>.<br />
                  • <strong className="text-amber-400">Pangram (using all 7 letters)</strong> awards an extra <strong className="text-white">+7 bonus points</strong>!
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <h4 className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider">Ranks & Goal</h4>
                <p className="text-[11px] text-slate-400">
                  Advance through ranks step-by-step from <strong>Beginner</strong> up to <strong>Genius 🧠</strong> and <strong>Queen Bee 👑</strong> as you find each word 1-by-1!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Got it, let's spell!
            </button>
          </div>
        </div>
      )}

      {/* Victory & Share Achievement Modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  {foundWords.length >= edition.validWords.length ? "👑" : "🐝"}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg tracking-tight">
                    {foundWords.length >= edition.validWords.length ? "Queen Bee Achieved!" : "Hive Achievement"}
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    {foundWords.length >= edition.validWords.length
                      ? `All ${edition.validWords.length} words discovered!`
                      : `${foundWords.length} of ${edition.validWords.length} words found`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVictoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1-by-1 Step Progression Grid */}
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">1-by-1 Step Progression</span>
                <span className="text-amber-400 font-mono font-bold">
                  {foundWords.length} / {edition.validWords.length} Solved
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {Array.from({ length: edition.validWords.length }).map((_, i) => {
                  const completed = i < foundWords.length;
                  return (
                    <div
                      key={i}
                      className={`h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        completed
                          ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 ring-1 ring-amber-300"
                          : "bg-slate-900 text-slate-600 border border-white/5"
                      }`}
                    >
                      {completed ? "✓" : i + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Metrics 4-Box Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-slate-950/70 border border-white/5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time</span>
                <div className="text-base font-mono font-black text-emerald-400 mt-0.5">{formatTime(seconds)}</div>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-white/5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rank</span>
                <div className="text-base font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                  <span>{rankInfo.rank.emoji}</span>
                  <span className="truncate">{rankInfo.rank.name}</span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-white/5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
                <div className="text-base font-mono font-black text-amber-300 mt-0.5">
                  {score} <span className="text-xs text-slate-500 font-normal">/ {maxScore} pts</span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-white/5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pangram</span>
                <div className="text-base font-bold text-yellow-300 mt-0.5 flex items-center justify-center gap-1">
                  <span>⭐</span>
                  <span>{foundWords.filter((w) => isPangram(w, edition)).length} / {edition.pangrams.length}</span>
                </div>
              </div>
            </div>

            {/* Challenge Result Banner if Inbound Challenge */}
            {challengeInfo && challengeInfo.targetSecs > 0 && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between shadow-inner ${
                  seconds <= challengeInfo.targetSecs
                    ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                    : "bg-amber-950/50 border-amber-500/40 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{seconds <= challengeInfo.targetSecs ? "🏆" : "⏱️"}</span>
                  <div>
                    <div className="font-extrabold text-white text-xs">
                      {seconds <= challengeInfo.targetSecs
                        ? `You beat ${challengeInfo.by}!`
                        : `${challengeInfo.by} was slightly faster!`}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Your time: <span className="font-mono font-bold text-white">{formatTime(seconds)}</span> vs Theirs:{" "}
                      <span className="font-mono">{formatTime(challengeInfo.targetSecs)}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono font-black text-xs px-2 py-1 rounded bg-black/40 border border-white/10">
                  {seconds <= challengeInfo.targetSecs
                    ? `-${challengeInfo.targetSecs - seconds}s ⚡`
                    : `+${seconds - challengeInfo.targetSecs}s`}
                </div>
              </div>
            )}

            {/* Share Preview Card */}
            <div className="p-3 bg-slate-950/90 rounded-xl border border-white/10 text-left font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-amber-400 font-bold flex items-center justify-between">
                <span>🐝 The Hive #{edition.date}</span>
                {foundWords.length >= edition.validWords.length && <span className="text-emerald-400">👑 100% SOLVED</span>}
              </div>
              <div>🏆 Rank: {rankInfo.rank.emoji} {rankInfo.rank.name} ({score} pts)</div>
              <div>⏱️ Time: {formatTime(seconds)} | Words: {foundWords.length}/{edition.validWords.length}</div>
              <div>⭐ Pangrams: {foundWords.filter((w) => isPangram(w, edition)).length} Found</div>
            </div>

            {/* Automated 1-Click Viral Distribution Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all active:scale-[0.98]"
                  title="Challenge your friends or groups on WhatsApp"
                >
                  <Send size={14} className="rotate-45" />
                  <span>WhatsApp Challenge</span>
                </button>

                <button
                  type="button"
                  onClick={handleTwitterShare}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                  title="Share your score on X / Twitter"
                >
                  <span className="font-mono font-black text-sm">𝕏</span>
                  <span>Share on X</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyShareCard}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-slate-950" />
                    <span>Copied Challenge Card & Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={18} className="text-slate-950" />
                    <span>Copy Challenge Link</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVictoryModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 transition-colors"
                >
                  {foundWords.length >= edition.validWords.length ? "Review Words" : "Keep Finding Words"}
                </button>
                <Link
                  href="/games"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-white/10 flex items-center justify-center transition-colors"
                >
                  Games Bay
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Geometric Hexagon Button
function HexButton({ 
  letter, 
  isCenter = false, 
  onClick 
}: { 
  letter: string; 
  isCenter?: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
      className={`w-[66px] h-[76px] sm:w-[76px] sm:h-[86px] flex items-center justify-center text-xl sm:text-2xl font-black transition-all active:scale-90 ${
        isCenter
          ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xl shadow-amber-500/25 ring-2 ring-amber-300"
          : "bg-slate-800/90 hover:bg-slate-700/90 text-white border border-white/10 hover:border-white/25"
      }`}
    >
      <span className="select-none pointer-events-none drop-shadow-sm">{letter.toUpperCase()}</span>
    </button>
  );
}
