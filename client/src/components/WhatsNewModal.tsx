import { useState, useEffect } from "react";
import { Sparkles, Bell, X, Send, Check, ShieldCheck, ArrowRight, Rss } from "lucide-react";
import { isNotificationSupported, getNotificationPermission, enableDailyReminder } from "@/lib/dailyReminder";

export const LATEST_RELEASE_DATE = "2026-10-04";
const STORAGE_SEEN_KEY = "tg_whats_new_viewed";

export function hasUnseenUpdates(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const lastSeen = localStorage.getItem(STORAGE_SEEN_KEY);
    return !lastSeen || lastSeen < LATEST_RELEASE_DATE;
  } catch {
    return false;
  }
}

export function markUpdatesAsSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SEEN_KEY, LATEST_RELEASE_DATE);
  } catch {
    // Local storage access restricted
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const RECENT_RELEASES = [
  {
    tag: "PDF STUDIO",
    title: "Visual Redaction & Document Editor",
    desc: "Black out sensitive text/boxes directly inside PDF documents in-browser without sending your files anywhere.",
    badge: "New",
  },
  {
    tag: "IMAGE FOUNDRY",
    title: "Passport Photo Resizer & WebP Converter",
    desc: "Government exam portal ready dimensions, background adjustments, and batch WebP lossless compression.",
    badge: "Updated",
  },
  {
    tag: "LOGIC LAB",
    title: "17 Daily Logic & Word Puzzles",
    desc: "Mini Sudoku, Queens, Connections, The Hive, Tango, Patches, Wend, and Mini Crossword with daily streaks.",
    badge: "Popular",
  },
  {
    tag: "DEVELOPER FOUNDRY",
    title: "Curl-to-Code & JWT Token Debugger",
    desc: "Transpile CLI curl requests to 8 languages, inspect/verify JWT claims with zero transmission.",
    badge: "New",
  },
];

export default function WhatsNewModal({ open, onClose }: Props) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribedToast, setSubscribedToast] = useState(false);

  useEffect(() => {
    if (open) {
      markUpdatesAsSeen();
      if (isNotificationSupported()) {
        setPermission(getNotificationPermission());
      } else {
        setPermission("unsupported");
      }
    }
  }, [open]);

  if (!open) return null;

  const handleEnablePush = async () => {
    const res = await enableDailyReminder();
    setPermission(res.permission);
    if (res.success) {
      setSubscribedToast(true);
      setTimeout(() => setSubscribedToast(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[#0e1628] p-5 sm:p-6 shadow-2xl text-[#f4f2ea] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#c7f36b]">
              RELEASE RADAR · OCT 2026
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight">What&apos;s New &amp; Releases</h2>
          </div>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed">
          We add new local-first utilities, offline converters, and puzzle games weekly. Stay in the loop with
          instant zero-spam updates.
        </p>

        {/* Subscribe / Notification Channels */}
        <div className="mt-4 rounded-xl border border-[#c7f36b]/30 bg-[#c7f36b]/5 p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#c7f36b] font-bold">
            GET NOTIFIED ABOUT NEW TOOLS
          </span>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Telegram Channel / Bot Subscribe */}
            <a
              href="https://t.me/ToolboxGalaxy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-white/15 bg-white/5 hover:border-[#0088cc] hover:bg-[#0088cc]/10 transition-all text-xs font-medium text-white group"
            >
              <div className="flex items-center gap-2">
                <Send size={15} className="text-[#0088cc] group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-semibold block">Telegram Channel</span>
                  <span className="text-[10px] text-white/50 block">Instant release alerts</span>
                </div>
              </div>
              <ArrowRight size={13} className="text-white/40 group-hover:text-white" />
            </a>

            {/* In-Browser Push Notifications */}
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={permission === "granted"}
              className="flex items-center justify-between p-3 rounded-xl border border-white/15 bg-white/5 hover:border-[#c7f36b] hover:bg-[#c7f36b]/10 transition-all text-xs font-medium text-white text-left group disabled:opacity-80"
            >
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-[#c7f36b] group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-semibold block">Browser Push</span>
                  <span className="text-[10px] text-white/50 block">
                    {permission === "granted" ? "Subscribed on this device ✓" : "1-click in-browser notice"}
                  </span>
                </div>
              </div>
              {permission === "granted" ? (
                <Check size={14} className="text-[#c7f36b]" />
              ) : (
                <ArrowRight size={13} className="text-white/40 group-hover:text-white" />
              )}
            </button>
          </div>

          {subscribedToast && (
            <div className="mt-2 text-center text-xs text-[#c7f36b] font-mono animate-in fade-in">
              ✓ Subscribed! You will receive a note when new tools release.
            </div>
          )}
        </div>

        {/* Feature Changelog List */}
        <div className="mt-5 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
            RECENT ADDITIONS &amp; HIGHLIGHTS
          </span>

          {RECENT_RELEASES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#c7f36b] uppercase">{item.tag}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                    {item.badge}
                  </span>
                </div>
              </div>
              <h4 className="mt-1 text-sm font-semibold text-white">{item.title}</h4>
              <p className="mt-0.5 text-xs text-white/65 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#c7f36b]" />
            <span>Zero cookies · No spam ever</span>
          </span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Rss size={12} />
            <span>Sitemap / RSS</span>
          </a>
        </div>
      </div>
    </div>
  );
}
