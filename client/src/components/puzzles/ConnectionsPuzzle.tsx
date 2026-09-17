import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { OrbitAudio } from "@/game/audio";
import { connectionsEditionForDate, CONNECTIONS_LEVEL_CONFIG, type ConnectionGroup, type ConnectionsEdition } from "@/game/logicPuzzles/connectionsBank";
import { evaluateGuess, getAllWords, shuffleArray } from "@/game/logicPuzzles/connections";
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
  AlertCircle,
  Swords,
  Send
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

export default function ConnectionsPuzzle() {
  const audio = useRef<OrbitAudio>(new OrbitAudio());
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edition: ConnectionsEdition = useMemo(() => connectionsEditionForDate(dateStr), [dateStr]);

  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<ConnectionGroup[]>([]);
  const [mistakesLeft, setMistakesLeft] = useState(4);
  const [message, setMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guessHistory, setGuessHistory] = useState<number[][]>([]); // array of level indices for share grid
  const [hintGroupIdx, setHintGroupIdx] = useState(0);
  const [hintStep, setHintStep] = useState(1); // 1 = 2 words, 2 = 3 words, 3 = all 4 words + category theme

  const isSolved = solvedGroups.length === 4;
  const isGameOver = mistakesLeft === 0 && !isSolved;

  // Initial load or reset
  const handleReset = () => {
    audio.current.play("rotate");
    const all = getAllWords(edition);
    setRemainingWords(shuffleArray(all));
    setSelectedWords([]);
    setSolvedGroups([]);
    setMistakesLeft(4);
    setMessage(null);
    setSeconds(0);
    setGuessHistory([]);
    setHintGroupIdx(0);
    setHintStep(1);
  };

  useEffect(() => {
    handleReset();
  }, [edition]);

  // Mark completion
  useEffect(() => {
    if (isSolved) {
      const editionSlug = edition.id.startsWith("connections-") ? edition.id : `connections-${edition.id}`;
      markPuzzleFieldComplete("connections", edition.id);
      markPuzzleFieldComplete(`connections-${editionSlug}`, dateStr);
      audio.current.play("puzzleSolve");
    }
  }, [isSolved, edition.id, dateStr]);

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
    const targetMistakes = params.has("mistakes") ? Number(params.get("mistakes")) : null;
    const targetSecs = Number(params.get("time")) || 0;
    if (by || targetMistakes !== null || targetSecs > 0) {
      return { by: by || "A Friend", targetMistakes: targetMistakes ?? 0, targetSecs };
    }
    return null;
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleWord = (word: string) => {
    if (isSolved || isGameOver) return;
    audio.current.play("toggle");
    setMessage(null);

    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      if (selectedWords.length < 4) {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  const handleShuffle = () => {
    audio.current.play("rotate");
    setRemainingWords(shuffleArray(remainingWords));
  };

  const handleDeselectAll = () => {
    audio.current.play("toggle");
    setSelectedWords([]);
    setMessage(null);
  };

  const handleHint = () => {
    if (isSolved || isGameOver) return;
    audio.current.play("relayCorrect");

    // Find all remaining unsolved groups
    const unsolved = edition.groups.filter((g) => !solvedGroups.some((sg) => sg.category === g.category));
    if (unsolved.length === 0) return;

    const currentGroup = unsolved[hintGroupIdx % unsolved.length];
    const words = currentGroup.words;

    if (hintStep === 1) {
      const selected = words.slice(0, 2);
      setSelectedWords(selected);
      setMessage(`💡 Hint (1/3): "${selected[0]}" & "${selected[1]}" share a category! (Tap Hint again for +1 word)`);
      setHintStep(2);
    } else if (hintStep === 2) {
      const selected = words.slice(0, 3);
      setSelectedWords(selected);
      setMessage(`💡 Hint (2/3): "${selected[0]}", "${selected[1]}", and "${selected[2]}" belong together! (Tap Hint for full category)`);
      setHintStep(3);
    } else {
      const selected = words.slice(0, 4);
      setSelectedWords(selected);
      setMessage(`💡 Category Hint (3/3): "${currentGroup.category}" → [${words.join(", ")}]. Tap 'Submit Guess' or tap Hint again for next group!`);
      setHintStep(1);
      setHintGroupIdx((prev) => (prev + 1) % unsolved.length);
    }
  };

  const handleSubmitGuess = () => {
    if (selectedWords.length !== 4) {
      setMessage("Select 4 words");
      return;
    }

    // Map each selected word to its group level for the share emoji
    const currentLevels: number[] = [];
    for (const w of selectedWords) {
      const g = edition.groups.find((grp) => grp.words.some((gw) => gw.toUpperCase() === w.toUpperCase()));
      if (g) currentLevels.push(g.level);
    }
    setGuessHistory((prev) => [...prev, currentLevels]);

    const result = evaluateGuess(selectedWords, edition);

    if (result.correct && result.group) {
      const group = result.group;
      audio.current.play("relayCorrect");
      setSolvedGroups((prev) => [...prev, group]);
      setRemainingWords((prev) => prev.filter((w) => !group.words.includes(w)));
      setSelectedWords([]);
      setMessage(`Solved: ${group.category}!`);
      setHintStep(1);
      setHintGroupIdx(0);
    } else {
      audio.current.play("relayFail");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const nextMistakes = mistakesLeft - 1;
      setMistakesLeft(nextMistakes);

      if (result.oneAway) {
        setMessage("One away! (3 of 4 words match a category)");
      } else {
        setMessage(result.message || "Not a match.");
      }

      if (nextMistakes === 0) {
        setMessage("Out of mistakes! Revealing all categories.");
      }
    }
  };

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/connections?by=Friend&mistakes=${4 - mistakesLeft}&time=${seconds}`;
  };

  const getViralShareText = () => {
    let emojiGrid = "";
    guessHistory.forEach((guess) => {
      emojiGrid += guess.map((lvl) => CONNECTIONS_LEVEL_CONFIG[lvl]?.emoji || "⬜").join("") + "\n";
    });

    const challengeUrl = getChallengeUrl();
    return `🔠 Connections #${edition.date} ${isSolved ? "👑 SOLVED!" : ""}\n` +
      `⏱️ Time: ${formatTime(seconds)} | Mistakes: ${4 - mistakesLeft}/4\n` +
      `${emojiGrid}` +
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
        title: `Toolbox Galaxy Connections Challenge`,
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
              <h1 className="text-sm font-bold text-white tracking-tight">Connections</h1>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">4×4 Word Association</span>
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
            title="Reveal 1 category hint"
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

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        {/* Automated Peer-to-Peer Challenge Inbound Banner */}
        {challengeInfo && (
          <div className="w-full max-w-md mb-3 p-2.5 bg-gradient-to-r from-purple-500/15 via-blue-500/10 to-purple-500/15 border border-purple-500/40 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
                <Swords size={15} />
              </div>
              <div>
                <span className="text-purple-300 font-bold block">
                  Challenge from {challengeInfo.by}!
                </span>
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-white font-mono">≤{challengeInfo.targetMistakes} mistakes</strong>
                  {challengeInfo.targetSecs > 0 && ` in ${formatTime(challengeInfo.targetSecs)}`}
                </span>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (4 - mistakesLeft) <= challengeInfo.targetMistakes
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              }`}
            >
              {(4 - mistakesLeft) <= challengeInfo.targetMistakes ? "On Target ⚡" : "Over Target"}
            </span>
          </div>
        )}

        {/* Instructions */}
        <p className="text-xs sm:text-sm text-slate-400 text-center mb-3">
          Group words that share a common connection. Find 4 groups of 4!
        </p>

        {/* Solved Category Cards */}
        <div className="w-full space-y-2 mb-3">
          {solvedGroups.map((group) => {
            const config = CONNECTIONS_LEVEL_CONFIG[group.level];
            return (
              <div
                key={group.category}
                className={`w-full p-3.5 rounded-xl border ${config.border} ${config.bg} text-center animate-in fade-in zoom-in-95 duration-300 shadow-md`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-white">
                  {group.category}
                </div>
                <div className="text-xs text-white/80 font-medium mt-1 tracking-wide">
                  {group.words.join(", ")}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4x4 Active Words Grid */}
        {remainingWords.length > 0 && (
          <div className={`w-full grid grid-cols-4 gap-2 sm:gap-2.5 transition-transform ${isShaking ? "animate-bounce text-red-400" : ""}`}>
            {remainingWords.map((word) => {
              const isSelected = selectedWords.includes(word);
              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggleWord(word)}
                  className={`h-16 sm:h-20 rounded-xl font-bold text-xs sm:text-sm tracking-tight transition-all duration-150 flex items-center justify-center text-center p-2 border ${
                    isSelected
                      ? "bg-[#c7f36b] text-[#090d16] border-[#c7f36b] scale-[1.02] shadow-lg shadow-[#c7f36b]/20"
                      : "bg-slate-900/90 text-white/90 border-white/10 hover:border-white/30 hover:bg-slate-800"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-slate-800/90 border border-white/15 text-xs font-medium text-amber-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={14} />
            <span>{message}</span>
          </div>
        )}

        {/* Mistakes Counter */}
        {!isSolved && (
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Mistakes remaining:</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < mistakesLeft ? "bg-[#c7f36b]" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        {!isSolved && !isGameOver && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
            <button
              type="button"
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all active:scale-95"
            >
              <Shuffle size={14} />
              <span>Shuffle</span>
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={selectedWords.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-white transition-all active:scale-95"
            >
              <X size={14} />
              <span>Deselect All</span>
            </button>
            <button
              type="button"
              onClick={handleSubmitGuess}
              disabled={selectedWords.length !== 4}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#c7f36b] hover:bg-[#d6f685] disabled:opacity-40 disabled:hover:bg-[#c7f36b] text-[#090d16] text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#c7f36b]/10"
            >
              <Check size={14} />
              <span>Submit Guess</span>
            </button>
          </div>
        )}

        {/* Solved Victory Frame */}
        {isSolved && (
          <div className="mt-6 w-full p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 text-center space-y-3 shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Genius! All 4 Connections Solved!</h3>
            <p className="text-xs text-slate-300">
              Completed in <b>{formatTime(seconds)}</b> with {4 - mistakesLeft} mistake(s).
            </p>

            {/* Inbound Challenge Result */}
            {challengeInfo && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-inner ${
                  (4 - mistakesLeft) <= challengeInfo.targetMistakes
                    ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                    : "bg-amber-950/50 border-amber-500/40 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{(4 - mistakesLeft) <= challengeInfo.targetMistakes ? "🏆" : "⏱️"}</span>
                  <span className="font-bold">
                    {(4 - mistakesLeft) < challengeInfo.targetMistakes
                      ? `You beat ${challengeInfo.by}!`
                      : (4 - mistakesLeft) === challengeInfo.targetMistakes
                      ? `Tied with ${challengeInfo.by}!`
                      : `${challengeInfo.by} made fewer mistakes!`}
                  </span>
                </div>
                <span className="font-mono font-bold">
                  {4 - mistakesLeft} vs {challengeInfo.targetMistakes} mistakes
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
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e1628] border border-white/20 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base">How to Play Connections</h3>
              <button type="button" onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>• Find groups of four items that share something in common.</p>
              <p>• Select 4 items and tap <b>'Submit Guess'</b> to check if your guess is correct.</p>
              <p>• Find the groups without making 4 mistakes!</p>
              <div className="pt-2 space-y-1.5">
                <p className="font-semibold text-white">Category Difficulty Color Codes:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <span className="p-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">🟨 Straightforward</span>
                  <span className="p-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">🟩 Intermediate</span>
                  <span className="p-1.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300">🟦 Nuanced</span>
                  <span className="p-1.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300">🟪 Tricky / Wordplay</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
