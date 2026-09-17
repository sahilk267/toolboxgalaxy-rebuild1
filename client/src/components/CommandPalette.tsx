import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { tools } from "@/data/toolRegistry";
import { useFavorites } from "@/lib/favorites";
import {
  Calculator,
  FileText,
  Gamepad2,
  Keyboard,
  Orbit,
  Search,
  Wrench,
  Star,
  Sparkles,
  Zap,
  Code,
  ShieldCheck,
  Check
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";

const routes = [
  { label: "Workbench Overview", href: "/", detail: "Home Hub & Quick Telemetry", icon: Orbit },
  { label: "PDF & Doc Studio", href: "/studio", detail: "Interactive PDF, Excel & Word Workstation", icon: FileText },
  { label: "Tool Foundry", href: "/tools", detail: `${tools.length} verified offline modules`, icon: Wrench },
  { label: "Games & Puzzles Bay", href: "/games", detail: "Daily NYT-Style Logic & Arcade", icon: Gamepad2 }
];

const games = [
  { label: "Strands (Theme Threads)", href: "/games/strands", category: "Daily Puzzle", detail: "Find words around the secret daily theme" },
  { label: "The Hive (Spelling Bee)", href: "/games/the-hive", category: "Daily Puzzle", detail: "Create words from 7 letter honeycomb" },
  { label: "Orbit Lexicon (Wordle)", href: "/games/orbit-lexicon", category: "Daily Puzzle", detail: "6-guess daily 5-letter word puzzle" },
  { label: "Connections", href: "/games/connections", category: "Daily Puzzle", detail: "Group 16 words into 4 themed sets" },
  { label: "Queens", href: "/games/queens", category: "Logic Game", detail: "Place one queen per row, column, and colored region" },
  { label: "Mini Sudoku", href: "/games/mini-sudoku", category: "Logic Game", detail: "Fast 6x6 and 9x9 daily number grid" },
  { label: "Chess Puzzles", href: "/games/chess-puzzles", category: "Logic Game", detail: "Find the best move in tactical chess positions" },
  { label: "Nonogram Griddlers", href: "/games/nonogram", category: "Logic Game", detail: "Picross picture logic numerical deduction" },
  { label: "Tango", href: "/games/tango", category: "Logic Game", detail: "Sun and moon adjacent balance puzzle" },
  { label: "Patches", href: "/games/patches", category: "Logic Game", detail: "Fit geometric shapes to cover the board" },
  { label: "Zip", href: "/games/zip", category: "Logic Game", detail: "Continuous path tracing puzzle" },
  { label: "Wend", href: "/games/wend", category: "Daily Puzzle", detail: "Step-by-step word ladder transition" },
  { label: "2048 Orbital", href: "/games/game2048", category: "Arcade", detail: "Merge matching tiles up to 2048" },
  { label: "Minesweeper", href: "/games/minesweeper", category: "Arcade", detail: "Flag mines with probability deduction" },
  { label: "Pipes & Water Flow", href: "/games/pipes", category: "Logic Game", detail: "Rotate pipes to connect water flow" },
  { label: "Cryptogram", href: "/games/cryptogram", category: "Daily Puzzle", detail: "Decipher substitution cipher quotes" },
  { label: "Orbit Dash", href: "/games/orbit-dash", category: "Arcade", detail: "Retro reflex rhythm arcade runner" },
];

const editable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export default function CommandPalette() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).has("command"));
  const { favorites } = useFavorites();

  const go = (href: string) => {
    if (href !== location) navigate(href);
    setOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandKey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (commandKey && !editable(event.target) && !document.querySelector('[data-slot="dialog-content"]')) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Filter pinned items
  const pinnedItems = useMemo(() => {
    return favorites
      .map((slug) => {
        const tool = tools.find((t) => t.slug === slug);
        if (tool) {
          return { label: tool.name, href: `/tools/${tool.slug}`, category: tool.category, isGame: false };
        }
        const game = games.find((g) => g.href.endsWith(slug));
        if (game) {
          return { label: game.label, href: game.href, category: game.category, isGame: true };
        }
        return null;
      })
      .filter(Boolean) as { label: string; href: string; category: string; isGame: boolean }[];
  }, [favorites]);

  return (
    <>
      <button
        id="global-cmd-palette-btn"
        type="button"
        className="command-palette-trigger flex items-center justify-between w-full"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search size={14} className="text-[#c7f36b]" />
          <span>Quick search</span>
        </span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
          {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Quick open"
        description="Search Toolbox Galaxy navigation, verified tools, and daily logic puzzles."
        className="command-palette-dialog"
      >
        <div className="command-palette-heading border-b border-white/10 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c7f36b]">
              ORBITAL COMMAND PALETTE / LIVE RUNTIME
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-white/50">
              <ShieldCheck size={11} className="text-[#6fd5ff]" /> 100% Client Memory
            </span>
          </div>
          <p className="text-base font-bold text-white tracking-tight mt-0.5">Quick Jump</p>
          <p className="text-xs text-white/60">
            Navigate 45+ developer utilities and 17 logic puzzles without network calls
          </p>
        </div>

        <CommandInput placeholder="Search by tool name, language, category (e.g. 'jwt', 'pdf', 'wordle', 'curl')..." />

        <CommandList className="max-h-[60vh] overflow-y-auto">
          <CommandEmpty>No matching route, tool, or game found.</CommandEmpty>

          {pinnedItems.length > 0 && (
            <CommandGroup heading="★ Pinned Favorites">
              {pinnedItems.map((item) => (
                <CommandItem
                  key={`pin-${item.href}`}
                  value={`pinned ${item.label} ${item.category}`}
                  onSelect={() => go(item.href)}
                >
                  <Star className="text-amber-400 fill-amber-400" size={14} />
                  <span>{item.label}</span>
                  <small className="text-amber-300/80">{item.category}</small>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Primary Navigation">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <CommandItem
                  key={route.href}
                  value={`${route.label} ${route.detail}`}
                  onSelect={() => go(route.href)}
                >
                  <Icon size={14} className="text-[#6fd5ff]" />
                  <span>{route.label}</span>
                  <small>{route.detail}</small>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Daily Puzzles & Logic Games">
            {games.map((game) => (
              <CommandItem
                key={game.href}
                value={`${game.label} ${game.category} ${game.detail}`}
                onSelect={() => go(game.href)}
              >
                <Gamepad2 size={14} className="text-[#c7f36b]" />
                <span>{game.label}</span>
                <small>{game.category}</small>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Verified Developer & Offline Tools">
            {tools.map((tool) => (
              <CommandItem
                key={tool.slug}
                value={`${tool.name} ${tool.category} ${tool.description} ${tool.tags.join(" ")}`}
                onSelect={() => go(`/tools/${tool.slug}`)}
              >
                <Calculator size={14} className="text-white/60" />
                <span>{tool.name}</span>
                <small>{tool.category}</small>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <div className="command-palette-foot flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5">
            <Keyboard size={12} /> Use ↑ / ↓ to navigate, Enter to launch
          </span>
          <CommandShortcut>ESC to exit</CommandShortcut>
        </div>
      </CommandDialog>
    </>
  );
}
