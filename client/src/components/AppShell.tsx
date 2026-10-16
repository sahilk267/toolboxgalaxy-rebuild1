import { Link, useLocation } from "wouter";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DailyReminderPrompt } from "@/components/DailyReminderPrompt";
import { DailyReminderToggle } from "@/components/DailyReminderToggle";
import ShortcutReference from "@/components/ShortcutReference";
import CommandPalette from "@/components/CommandPalette";
import SupportModal from "@/components/SupportModal";
import WhatsNewModal, { hasUnseenUpdates } from "@/components/WhatsNewModal";
import { QuickScratchpad } from "@/components/QuickScratchpad";
import { AchievementsModal } from "@/components/AchievementsModal";
import { getUnlockedBadges, badgeUnlockedEventName } from "@/lib/achievementBadges";
import { toast } from "sonner";
import { recordVisitorCohort } from "@/lib/telegramAlerts";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileText,
  Gamepad2,
  Menu,
  Orbit,
  Wrench,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Coffee,
  Sun,
  Moon,
  Sparkles,
  Trophy,
  Edit3,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

const orbitMark = "/orbit-mark.svg";

const navItems = [
  { href: "/", label: "Overview", icon: Orbit },
  { href: "/studio", label: "PDF & Doc Studio", icon: FileText },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/guides", label: "Guides", icon: BookOpen },
  { href: "/games", label: "Games", icon: Gamepad2 },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState(() => Object.keys(getUnlockedBadges()).length);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    recordVisitorCohort();
    setHasNewBadge(hasUnseenUpdates());

    // Listen for real-time badge unlock events
    const handleBadgeUnlocked = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUnlockedCount(Object.keys(getUnlockedBadges()).length);
      if (detail?.badge) {
        toast.success(`Achievement Unlocked! ${detail.badge.icon}`, {
          description: `${detail.badge.title} — ${detail.badge.description || "Milestone achieved!"}`,
          duration: 4000,
        });
      }
    };

    // Hotkey listener: Ctrl+Shift+S or Cmd+Shift+S to open Scratchpad
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        setScratchpadOpen((prev) => !prev);
      }
    };

    window.addEventListener(badgeUnlockedEventName(), handleBadgeUnlocked);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener(badgeUnlockedEventName(), handleBadgeUnlocked);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tg_sidebar_collapsed");
        if (saved !== null) return saved === "true";
      } catch {
        // Storage access restricted
      }
    }
    return false;
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tg_sidebar_collapsed", String(next));
        } catch {
          // Storage write restricted
        }
      }
      return next;
    });
  };

  return (
    <div
      className={`app-shell min-h-screen bg-[#0b1020] text-[#f4f2ea] ${
        collapsed ? "app-shell--collapsed" : ""
      }`}
    >
      {/* Sidebar Rail */}
      <aside
        className={`site-rail ${open ? "site-rail--open" : ""} ${
          collapsed ? "site-rail--collapsed" : ""
        }`}
      >
        <div className="rail-brand flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={orbitMark} alt="Toolbox Galaxy orbit mark" className="orbit-mark" />
            <div>
              <p className="mono-label text-[#c7f36b]">TOOLBOX</p>
              <p className="font-display text-lg font-bold tracking-[-0.04em]">GALAXY</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:border-[#c7f36b]/40 hover:bg-[#c7f36b]/10 hover:text-[#c7f36b] transition-colors"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="rail-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === href : location.startsWith(href);
            return (
              <Link
                href={href}
                key={href}
                onClick={() => setOpen(false)}
                className={`rail-link ${active ? "rail-link--active" : ""}`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {active && <span className="active-pip" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className="rail-bottom">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-3 py-2 text-xs font-semibold text-[#c7f36b] hover:bg-[#c7f36b]/20 hover:border-[#c7f36b]/60 transition-all group"
          >
            <span className="flex items-center gap-2">
              <Coffee size={15} className="group-hover:scale-110 transition-transform" />
              <span>Support Galaxy</span>
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#c7f36b]/20 text-white">
              Free
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWhatsNewOpen(true);
              setHasNewBadge(false);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-all group"
            aria-label="What's New in Toolbox Galaxy"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#c7f36b] group-hover:rotate-12 transition-transform" />
              <span>What&apos;s New</span>
            </span>
            {hasNewBadge ? (
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-[#c7f36b] text-[#090d18] font-bold animate-pulse">
                New
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                Oct 26
              </span>
            )}
          </button>

          <CommandPalette />
          <ShortcutReference />

          {/* Quick Scratchpad Button */}
          <button
            type="button"
            onClick={() => setScratchpadOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-all group"
            aria-label="Open Quick Scratchpad (Ctrl+Shift+S)"
          >
            <span className="flex items-center gap-2">
              <Edit3 size={15} className="text-[#6fd5ff] group-hover:scale-110 transition-transform" />
              <span>Scratchpad</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/50">
              ^⇧S
            </span>
          </button>

          {/* Achievements Button */}
          <button
            type="button"
            onClick={() => setAchievementsOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-all group"
            aria-label="View Workbench Achievements"
          >
            <span className="flex items-center gap-2">
              <Trophy size={15} className="text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Achievements</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
              {unlockedCount}/10
            </span>
          </button>

          <PWAInstallButton variant="rail" />
          <DailyReminderToggle variant="rail" />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-all"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? <Sun size={15} className="text-[#c7f36b]" /> : <Moon size={15} className="text-amber-400" />}
              <span>Theme: {theme === "dark" ? "Dark" : "Light"}</span>
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/70">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <div className="rail-status">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <p className="mono-label">SYSTEM STATUS</p>
              <p className="text-sm text-white/80">Local-first build</p>
            </div>
          </div>

          <Link href="/contact" className="rail-contact">
            Send feedback <span>↗</span>
          </Link>

          <div className="rail-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>

          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-white/40 text-center flex items-center justify-center gap-1.5 flex-wrap">
            <span>By <span className="text-white/70 font-semibold">Aaditech Solution</span></span>
            <span>·</span>
            <a
              href="https://www.linkedin.com/in/mohdazizshaikh"
              target="_blank"
              rel="noreferrer"
              className="text-[#00a0dc] hover:text-[#c7f36b] transition-colors font-medium inline-flex items-center gap-0.5"
              title="Mohd Aziz Shaikh on LinkedIn"
            >
              <span>LinkedIn</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Floating Re-open Sidebar Button when collapsed on desktop */}
      {collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="fixed top-4 left-4 z-40 hidden md:flex items-center gap-2 rounded-xl border border-white/15 bg-[#0e1628]/90 px-3 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md hover:border-[#c7f36b]/60 hover:bg-[#121c33] hover:text-[#c7f36b] transition-all"
          title="Expand Sidebar Navigation"
        >
          <PanelLeftOpen size={16} className="text-[#c7f36b]" />
          <span>Show Menu</span>
        </button>
      )}

      {/* Mobile Top Bar */}
      <header className="mobile-bar">
        <Link href="/" className="flex items-center gap-2">
          <img src={orbitMark} alt="" className="h-10 w-10" />
          <span className="font-display font-bold tracking-tight">TOOLBOX GALAXY</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={18} className="text-[#c7f36b]" /> : <Moon size={18} className="text-amber-400" />}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`content-runway ${collapsed ? "content-runway--full" : ""}`}>
        <div className="page-grid" aria-hidden="true" />
        <div className="runway-stamp" aria-hidden="true">
          <img src={orbitMark} alt="" />
          <span>
            ORBITAL
            <br />
            WORKBENCH
          </span>
        </div>
        {children}
      </main>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <WhatsNewModal open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
      <QuickScratchpad isOpen={scratchpadOpen} onClose={() => setScratchpadOpen(false)} />
      <AchievementsModal isOpen={achievementsOpen} onClose={() => setAchievementsOpen(false)} />

      {/* Floating Scratchpad Quick Pill (Desktop & Mobile) */}
      <button
        type="button"
        onClick={() => setScratchpadOpen((prev) => !prev)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-[#0e1628]/95 px-3 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-md hover:border-[#6fd5ff]/50 hover:bg-[#121f38] hover:text-[#6fd5ff] transition-all group"
        title="Open Quick Scratchpad (Ctrl+Shift+S)"
        aria-label="Open Quick Scratchpad"
      >
        <Edit3 size={15} className="text-[#6fd5ff] group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Scratchpad</span>
      </button>

      <OfflineIndicator />
      <DailyReminderPrompt />

      {open && (
        <button
          type="button"
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
