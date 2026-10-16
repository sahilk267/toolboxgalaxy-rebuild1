import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getDailyHabitStatus,
  dailyHabitEventName,
  type DailyHabitStatus,
} from "@/lib/dailyHabitTracker";
import { buildDailyHabitStreakShare, copyEmojiShareText } from "@/lib/dailyEmojiShare";
import { checkTimeBasedBadges, unlockBadge } from "@/lib/achievementBadges";
import { Flame, CheckCircle2, Circle, ArrowRight, Share2, Sparkles, Check, Shield } from "lucide-react";

export const DailyHabitPulse: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [status, setStatus] = useState<DailyHabitStatus>(() => getDailyHabitStatus());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const next = getDailyHabitStatus();
      setStatus(next);
      if (next.completedCount > 0) {
        unlockBadge("first-win");
      }
      if (next.streak >= 3) {
        unlockBadge("streak-warrior");
      }
      checkTimeBasedBadges();
    };

    window.addEventListener(dailyHabitEventName(), refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(dailyHabitEventName(), refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleShare = async () => {
    const shareText = buildDailyHabitStreakShare(
      status.streak,
      status.completedCount,
      status.totalCount
    );

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Toolbox Galaxy Daily Streak: ${status.streak} Days`,
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {}
    }

    const ok = await copyEmojiShareText(shareText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const percent = Math.round((status.completedCount / status.totalCount) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
        <div className="flex items-center gap-1 text-amber-400 font-bold">
          <Flame size={15} className={status.streak > 0 ? "fill-amber-400 animate-pulse" : ""} />
          <span>{status.streak}d streak</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <span className="text-white/70">
          {status.completedCount}/{status.totalCount} Quests
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#161208]/80 via-[#0e1628]/90 to-[#0b1020] p-5 shadow-2xl backdrop-blur-md">
      {/* Subtle background glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10">
            <Flame
              size={24}
              className={status.streak > 0 ? "fill-amber-400 text-amber-400 animate-pulse" : "text-amber-400/60"}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                DAILY HABIT & STREAK
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {status.dateLabel}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              {status.streak > 0 ? (
                <span>{status.streak}-Day Active Streak</span>
              ) : (
                <span>Begin Today&apos;s Daily Habit</span>
              )}
              {status.allDone && (
                <span className="text-xs font-sans font-semibold text-[#c7f36b] bg-[#c7f36b]/15 px-2 py-0.5 rounded-full border border-[#c7f36b]/30">
                  Clean Sweep!
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.shields > 0 && (
            <span
              className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300"
              title="Streak Shield protects your streak if you miss a single day"
            >
              <Shield size={13} className="text-sky-400 fill-sky-400/30" />
              <span>{status.shields} Shield</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white hover:border-[#c7f36b]/50 transition-all"
            title="Share streak to WhatsApp, X, or Slack"
          >
            {copied ? (
              <>
                <Check size={14} className="text-[#c7f36b]" />
                <span className="text-[#c7f36b]">Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-amber-400" />
                <span>Share Streak</span>
              </>
            )}
          </button>
        </div>
      </div>

      {status.shieldEngaged && (
        <div className="mt-3 p-3 rounded-xl bg-sky-950/70 border border-sky-500/50 text-xs text-sky-200 flex items-center gap-2.5 animate-in fade-in">
          <Shield size={16} className="text-sky-400 shrink-0" />
          <span>
            <strong>Streak Shield Activated!</strong> Your streak was preserved after a missed day. Solve today&apos;s quest to keep your chain going!
          </span>
        </div>
      )}

      {/* Progress Bar & Status Line */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-white/70">
            Today&apos;s Quests: <strong className="text-white">{status.completedCount} of {status.totalCount}</strong> solved
          </span>
          <span className="text-amber-400 font-bold">{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#c7f36b] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 3 Quest Cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {status.quests.map((quest) => (
          <Link
            key={quest.id}
            href={quest.href}
            className={`group relative flex flex-col justify-between rounded-xl p-3 border transition-all ${
              quest.completed
                ? "border-[#c7f36b]/30 bg-[#c7f36b]/5 hover:bg-[#c7f36b]/10"
                : "border-white/10 bg-white/[0.02] hover:border-amber-400/40 hover:bg-white/[0.05]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                  {quest.badge}
                </span>
                {quest.completed ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#c7f36b]">
                    <CheckCircle2 size={13} />
                    <span>Done</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-white/50 group-hover:text-amber-400">
                    <Circle size={13} />
                    <span>Pending</span>
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold text-sm text-white group-hover:text-[#c7f36b] transition-colors">
                {quest.title}
              </h3>
              <p className="text-[11px] text-white/60 line-clamp-1">{quest.subtitle}</p>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-white/50 group-hover:text-white pt-2 border-t border-white/5">
              <span>{quest.completed ? "Review edition" : "Solve today"}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Motivation Kicker */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/50 font-mono">
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" />
          {status.allDone
            ? "All quests cleared! New editions drop tonight at 12:00 AM."
            : status.isStreakAtRisk
            ? "⚠️ Streak pending! Complete 1 quest to preserve your chain."
            : "Complete quests daily to grow your unbroken streak."}
        </span>
        <Link href="/games/logic" className="text-white/60 hover:text-white underline">
          Calendar & Bests →
        </Link>
      </div>
    </div>
  );
};
