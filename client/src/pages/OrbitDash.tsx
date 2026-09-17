// Orbit Dash / Orbital Workbench: full-screen game page with a DOM telemetry HUD over a Babylon canvas.
import GameCanvas from "@/components/GameCanvas";
import GameAudioControls from "@/components/GameAudioControls";
import { OrbitAudio, type SoundEvent } from "@/game/audio";
import { ArrowLeft, RotateCcw, Trophy, Share2, Swords, Send } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useMemo, useRef, useState } from "react";

export default function OrbitDash() {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<"ready" | "playing" | "over">("ready");
  const [copied, setCopied] = useState(false);
  const audio = useRef(new OrbitAudio());

  useEffect(() => () => audio.current.dispose(), []);

  // Peer-to-Peer Automated Challenge System
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

  const getChallengeUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://toolboxgalaxy.com";
    return `${origin}/games/orbit-dash?by=Friend&score=${Math.max(score, best)}`;
  };

  const getViralShareText = () => {
    const finalScore = Math.max(score, best);
    const challengeUrl = getChallengeUrl();
    return `🚀 Orbit Dash • High Score: ${finalScore} pts!\n` +
      `⚡ Fast-paced 3D Arcade Runner with zero install.\n\n` +
      `⚔️ Can you beat my high score of ${finalScore}? Fly now:\n` +
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
        title: `Orbit Dash Arcade Challenge`,
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

  const beginRun = async () => {
    if (!audio.current.isEnabled()) await audio.current.setEnabled(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  };

  const instruction =
    status === "ready"
      ? "Use ↑ ↓ or W S · move pointer to fly"
      : status === "over"
      ? "Signal lost · press Space or R to restart"
      : "Collect fragments · clear the gates";

  return (
    <section className="orbit-dash-page">
      <GameCanvas
        callbacks={{
          onScore: (nextScore, nextBest) => {
            setScore(nextScore);
            setBest(nextBest);
          },
          onStatus: setStatus,
          onSound: (event: SoundEvent) => audio.current.play(event),
        }}
      />
      <div className="game-hud">
        <div className="game-hud__top">
          <Link href="/games" className="game-back">
            <ArrowLeft size={16} /> Games bay
          </Link>
          <div className="game-brand">
            <span className="status-dot" /> ORBIT DASH
          </div>
          <div className="game-hud__actions">
            <GameAudioControls audio={audio} />
            <div className="game-score">
              <span>SCORE</span>
              <strong>{score.toString().padStart(2, "0")}</strong>
            </div>
          </div>
        </div>

        {/* Inbound Challenge HUD pill during ready or playing */}
        {challengeInfo && challengeInfo.targetScore > 0 && status !== "over" && (
          <div className="mx-auto mt-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Swords size={13} className="text-amber-400" />
            <span>Target: Beat {challengeInfo.by}'s {challengeInfo.targetScore} pts</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                score >= challengeInfo.targetScore ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/70"
              }`}
            >
              {score >= challengeInfo.targetScore ? "Beaten! 🏆" : `${challengeInfo.targetScore - score} to go`}
            </span>
          </div>
        )}

        <div className="game-hud__bottom">
          <div className="game-instruction">
            <RotateCcw size={15} />
            <span>{instruction}</span>
          </div>
          <div className="best-score">
            <Trophy size={15} />
            <span>BEST {best.toString().padStart(2, "0")}</span>
          </div>
        </div>

        {status !== "playing" && (
          <div className="game-overlay">
            <p className="mono-label text-[#c7f36b]">
              {status === "over" ? "RUN COMPLETE" : "ARCADE MODULE 01"}
            </p>
            <h1 className="font-display">
              {status === "over" ? "Reconnect the signal." : "Thread the orbit."}
            </h1>
            <p>
              {status === "over"
                ? `You locked in ${score} signal points (Best: ${best}).`
                : "Pass through the gates, pull in signal fragments, and keep the lane clear."}
            </p>

            {/* Duel Result when game over */}
            {status === "over" && challengeInfo && challengeInfo.targetScore > 0 && (
              <div
                className={`max-w-xs mx-auto my-2 p-2.5 rounded-xl border text-xs flex items-center justify-between shadow-inner ${
                  score >= challengeInfo.targetScore
                    ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                    : "bg-amber-950/50 border-amber-500/40 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{score >= challengeInfo.targetScore ? "🏆" : "⚡"}</span>
                  <span className="font-bold">
                    {score > challengeInfo.targetScore
                      ? `You beat ${challengeInfo.by}!`
                      : score === challengeInfo.targetScore
                      ? `Tied with ${challengeInfo.by}!`
                      : `${challengeInfo.by} leads by ${challengeInfo.targetScore - score}!`}
                  </span>
                </div>
                <span className="font-mono font-bold">
                  {score} vs {challengeInfo.targetScore} pts
                </span>
              </div>
            )}

            {/* Social Share Distribution when game over */}
            {status === "over" && (
              <div className="flex flex-col gap-2 max-w-xs mx-auto my-2 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                  >
                    <Send size={13} className="rotate-45" />
                    <span>WhatsApp</span>
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

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2 rounded-xl bg-[#c7f36b] text-[#090d16] font-extrabold text-xs hover:bg-[#d6f685] transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 size={13} />
                  <span>{copied ? "Copied Challenge Link!" : "Copy Challenge Link"}</span>
                </button>
              </div>
            )}

            <button onClick={beginRun} className="signal-button">
              {status === "over" ? "Run again" : "Start run"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
