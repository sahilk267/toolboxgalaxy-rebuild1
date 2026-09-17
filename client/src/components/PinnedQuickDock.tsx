import React from "react";
import { Link } from "wouter";
import { useFavorites } from "@/lib/favorites";
import { tools } from "@/data/toolRegistry";
import { Star, X, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

// Known games list for quick dock matching
const GAME_MODULES = [
  { slug: "strands", name: "Strands (Theme Threads)", category: "Daily Puzzle", href: "/games/strands" },
  { slug: "the-hive", name: "The Hive (Spelling Bee)", category: "Daily Puzzle", href: "/games/the-hive" },
  { slug: "orbit-lexicon", name: "Lexicon (Wordle)", category: "Daily Puzzle", href: "/games/orbit-lexicon" },
  { slug: "connections", name: "Connections", category: "Daily Puzzle", href: "/games/connections" },
  { slug: "queens", name: "Queens (8-Queens Grid)", category: "Logic Game", href: "/games/queens" },
  { slug: "mini-sudoku", name: "Mini Sudoku", category: "Logic Game", href: "/games/mini-sudoku" },
  { slug: "chess-puzzles", name: "Chess Tactics", category: "Logic Game", href: "/games/chess-puzzles" },
  { slug: "nonogram", name: "Nonogram Griddlers", category: "Logic Game", href: "/games/nonogram" },
  { slug: "game2048", name: "2048 Orbital", category: "Arcade", href: "/games/game2048" },
  { slug: "orbit-dash", name: "Orbit Dash", category: "Arcade", href: "/games/orbit-dash" },
];

export const PinnedQuickDock: React.FC = () => {
  const { favorites, togglePin } = useFavorites();

  const pinnedItems = favorites
    .map((slug) => {
      const tool = tools.find((t) => t.slug === slug);
      if (tool) {
        return {
          slug: tool.slug,
          name: tool.name,
          category: tool.category,
          href: `/tools/${tool.slug}`,
          isGame: false,
        };
      }
      const game = GAME_MODULES.find((g) => g.slug === slug);
      if (game) {
        return {
          slug: game.slug,
          name: game.name,
          category: game.category,
          href: game.href,
          isGame: true,
        };
      }
      return null;
    })
    .filter(Boolean) as { slug: string; name: string; category: string; href: string; isGame: boolean }[];

  if (pinnedItems.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-white/50 mb-1">
          <Star size={14} className="text-[#c7f36b]" />
          <span>PINNED QUICK DOCK</span>
        </div>
        <p className="text-xs text-white/70">
          No pinned modules yet. Click the <Star size={12} className="inline text-amber-400 fill-amber-400" /> icon on any tool or game card to pin it for instant 1-click access.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Pinned quick dock" className="rounded-2xl border border-[#c7f36b]/25 bg-gradient-to-b from-[#111a2f]/90 to-[#0c1222]/90 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#c7f36b]/20 text-[#c7f36b]">
            <Star size={13} className="fill-[#c7f36b]" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Pinned Quick Dock</span>
              <span className="rounded-full bg-[#c7f36b]/15 px-2 py-0.5 text-[10px] text-[#c7f36b]">
                {pinnedItems.length} active
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
          <ShieldCheck size={12} className="text-[#6fd5ff]" />
          <span className="hidden sm:inline">Zero-network client memory</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {pinnedItems.map((item) => (
          <div
            key={item.slug}
            className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2.5 hover:border-[#c7f36b]/50 hover:bg-[#c7f36b]/5 transition-all shadow-sm"
          >
            <Link href={item.href} className="flex-1 min-w-0 pr-1">
              <span className="block truncate text-xs font-semibold text-white group-hover:text-[#c7f36b] transition-colors">
                {item.name}
              </span>
              <span className="block truncate text-[10px] font-mono text-white/50">
                {item.category}
              </span>
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePin(item.slug);
              }}
              className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors"
              title={`Unpin ${item.name}`}
              aria-label={`Unpin ${item.name}`}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
