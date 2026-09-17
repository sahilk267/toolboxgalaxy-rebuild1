import React, { useState } from "react";
import { useDailyReminder } from "@/hooks/useDailyReminder";
import { Bell, X, ShieldCheck, Check } from "lucide-react";

export const DailyReminderPrompt: React.FC = () => {
  const {
    isEligibleForPrompt,
    isRequesting,
    optIn,
    dismiss,
    hasPeriodicSync,
  } = useDailyReminder();

  const [optedInSuccess, setOptedInSuccess] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  if (!isEligibleForPrompt && !optedInSuccess && !deniedMessage) {
    return null;
  }

  const handleOptIn = async () => {
    const result = await optIn();
    if (result.success) {
      setOptedInSuccess(true);
      setTimeout(() => {
        dismiss();
      }, 2500);
    } else if (result.permission === "denied") {
      setDeniedMessage("Notifications are blocked in your browser settings.");
      setTimeout(() => {
        dismiss();
      }, 3500);
    }
  };

  return (
    <aside
      aria-label="Daily puzzle reminder prompt"
      className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-[#c7f36b]/30 bg-[#12192c]/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 text-white"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss reminder prompt"
      >
        <X size={16} />
      </button>

      {optedInSuccess ? (
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c7f36b]/20 text-[#c7f36b]">
            <Check size={20} />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">Reminder enabled!</p>
            <p className="text-xs text-white/70">
              {hasPeriodicSync
                ? "Periodic local reminder registered for new daily puzzles."
                : "Best-effort local reminder active on this device."}
            </p>
          </div>
        </div>
      ) : deniedMessage ? (
        <div className="py-1">
          <p className="font-display text-sm font-bold text-amber-400">Permission blocked</p>
          <p className="text-xs text-white/70 mt-0.5">{deniedMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 pr-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#c7f36b]/20 text-[#c7f36b]">
              <Bell size={17} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold tracking-tight text-white">
                Daily Puzzle Reminder
              </h3>
              <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                You've solved 2+ daily puzzles! Get a once-daily local notification when fresh editions drop.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-white/60 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
            <ShieldCheck size={13} className="text-[#c7f36b] shrink-0" />
            <span>100% device-local · No server push · Opt out anytime</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOptIn}
              disabled={isRequesting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#c7f36b] px-3.5 py-2 text-xs font-bold text-[#0b1020] hover:bg-[#d8ff7a] disabled:opacity-50 transition-all shadow-sm"
            >
              <Bell size={13} />
              <span>{isRequesting ? "Enabling..." : "Enable Reminder"}</span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
