import React, { useState } from "react";
import { useDailyReminder } from "@/hooks/useDailyReminder";
import { Bell, BellOff, Info, X } from "lucide-react";

export const DailyReminderToggle: React.FC<{ variant?: "rail" | "compact" }> = ({
  variant = "rail",
}) => {
  const {
    isSupported,
    permission,
    isEnabled,
    isRequesting,
    optIn,
    optOut,
    hasPeriodicSync,
  } = useDailyReminder();

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<"unsupported" | "denied" | "details">("details");

  const handleToggle = async () => {
    if (!isSupported) {
      setModalReason("unsupported");
      setInfoModalOpen(true);
      return;
    }

    if (permission === "denied") {
      setModalReason("denied");
      setInfoModalOpen(true);
      return;
    }

    if (isEnabled) {
      await optOut();
    } else {
      const res = await optIn();
      if (!res.success && res.permission === "denied") {
        setModalReason("denied");
        setInfoModalOpen(true);
      }
    }
  };

  const statusLabel = !isSupported
    ? "N/A"
    : permission === "denied"
    ? "Blocked"
    : isEnabled
    ? "Active"
    : "Off";

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isRequesting}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-medium transition-all ${
            isEnabled
              ? "border-[#c7f36b]/40 bg-[#c7f36b]/10 text-[#c7f36b] hover:bg-[#c7f36b]/20"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          title={isEnabled ? "Daily reminders active (click to turn off)" : "Enable daily puzzle reminders"}
        >
          {isEnabled ? <Bell size={13} className="text-[#c7f36b]" /> : <BellOff size={13} />}
          <span>Reminders: {statusLabel}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isRequesting}
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all group ${
            isEnabled
              ? "border-[#c7f36b]/30 bg-[#c7f36b]/10 text-white hover:border-[#c7f36b]/60 hover:bg-[#c7f36b]/20"
              : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:text-white"
          }`}
          aria-label={isEnabled ? "Disable daily puzzle reminder notifications" : "Enable daily puzzle reminder notifications"}
        >
          <span className="flex items-center gap-2">
            {isEnabled ? (
              <Bell size={15} className="text-[#c7f36b] group-hover:scale-110 transition-transform" />
            ) : (
              <BellOff size={15} className="text-white/40 group-hover:scale-110 transition-transform" />
            )}
            <span>Daily Reminders</span>
          </span>
          <span
            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
              isEnabled
                ? "bg-[#c7f36b]/20 text-[#c7f36b] font-bold"
                : "bg-white/10 text-white/60"
            }`}
          >
            {statusLabel}
          </span>
        </button>
      )}

      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#12192c] p-6 shadow-2xl text-white">
            <button
              onClick={() => setInfoModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-[#c7f36b] mb-3">
              <Info size={22} />
              <h3 className="font-display font-bold text-base tracking-tight text-white">
                {modalReason === "unsupported"
                  ? "Notifications Unavailable"
                  : modalReason === "denied"
                  ? "Permission Blocked in Browser"
                  : "Daily Puzzle Reminders"}
              </h3>
            </div>

            <div className="space-y-3 text-xs text-white/80 leading-relaxed">
              {modalReason === "unsupported" ? (
                <>
                  <p>
                    The browser Notification or Service Worker API is not supported in this view.
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5 text-white/70">
                    <p>
                      • <strong>Safari iOS / iPadOS</strong>: Web notifications require adding the app to your Home Screen first via the Share menu.
                    </p>
                    <p>
                      • <strong>Private Browsing</strong>: Some browsers disable background notification APIs in incognito mode.
                    </p>
                  </div>
                </>
              ) : modalReason === "denied" ? (
                <>
                  <p>
                    Notification permission was previously denied for this site in your browser settings.
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5 text-white/70">
                    <p>To re-enable:</p>
                    <p>1. Click the site settings icon (padlock/sliders) next to the URL in your address bar.</p>
                    <p>2. Set <strong>Notifications</strong> to <strong>Allow</strong>.</p>
                    <p>3. Refresh the page.</p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Daily reminders are scheduled completely on your local device.
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 text-white/70">
                    <p>• Zero server push required</p>
                    <p>• Periodic Background Sync: {hasPeriodicSync ? "Supported" : "Graceful fallback"}</p>
                    <p>• 100% private and offline-safe</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setInfoModalOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#c7f36b] py-2.5 text-xs font-bold text-[#0b1020] hover:bg-[#d8ff7a] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
