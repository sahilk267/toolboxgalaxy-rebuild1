import React, { useState, useEffect, useRef } from "react";
import {
  BADGE_DEFINITIONS,
  getUnlockedBadges,
  badgeUnlockedEventName,
  type UnlockedRecord,
} from "@/lib/achievementBadges";
import { exportWorkspaceProfile, importWorkspaceProfile } from "@/lib/workspaceProfileBackup";
import { Trophy, X, Sparkles, CheckCircle2, Lock, Download, Upload, Check } from "lucide-react";

export const AchievementsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [unlocked, setUnlocked] = useState<UnlockedRecord>(() => getUnlockedBadges());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const handleExport = () => {
    exportWorkspaceProfile();
    setBackupMsg("Profile downloaded!");
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importWorkspaceProfile(content);
        setBackupMsg(res.message);
        setTimeout(() => setBackupMsg(null), 3500);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const handleUpdate = () => {
      setUnlocked(getUnlockedBadges());
    };

    window.addEventListener(badgeUnlockedEventName(), handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(badgeUnlockedEventName(), handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const totalBadges = BADGE_DEFINITIONS.length;
  const unlockedCount = Object.keys(unlocked).length;
  const percentage = Math.round((unlockedCount / totalBadges) * 100);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(new Date(isoString));
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-amber-500/30 bg-[#0e1628] text-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievements-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-white/[0.02] to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10">
              <Trophy size={20} />
            </div>
            <div>
              <h2 id="achievements-title" className="font-display text-base font-bold text-white">
                Workbench Achievements
              </h2>
              <p className="text-xs text-white/60 font-mono">
                {unlockedCount} of {totalBadges} Badges Unlocked ({percentage}%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Achievements Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-white/[0.01] border-b border-white/5">
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#c7f36b] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {BADGE_DEFINITIONS.map((badge) => {
              const isUnlocked = Boolean(unlocked[badge.id]);
              const unlockedDate = unlocked[badge.id];

              return (
                <div
                  key={badge.id}
                  className={`relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                    isUnlocked
                      ? "border-amber-500/30 bg-amber-500/5 shadow-md shadow-amber-500/5"
                      : "border-white/5 bg-white/[0.02] opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                      isUnlocked
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        : "bg-white/5 border border-white/10 grayscale"
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-display font-semibold text-sm text-white truncate">
                        {badge.title}
                      </span>
                      {isUnlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#c7f36b] bg-[#c7f36b]/15 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={11} />
                          {formatDate(unlockedDate)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono text-white/40">
                          <Lock size={10} />
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{badge.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                        {badge.category}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/80">
                        {badge.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] text-xs font-mono text-white/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              title="Backup your streaks, badges, scratchpad & pinned tools to a JSON file"
            >
              <Download size={13} className="text-[#c7f36b]" />
              <span>Backup Profile</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              title="Restore a previously exported Galaxy backup file"
            >
              <Upload size={13} className="text-[#6fd5ff]" />
              <span>Restore Backup</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {backupMsg && (
              <span className="text-[#c7f36b] font-semibold text-[11px] animate-pulse">
                {backupMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-white/40">
              <Sparkles size={12} className="text-amber-400" />
              100% In-Browser Memory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
