import { useState, useEffect, useCallback } from "react";
import { getFavoriteSlugs, toggleFavorite, favoriteToolsEvent, isFavorite as checkIsFavorite } from "./favoriteTools";
import { tools } from "@/data/toolRegistry";

const DEFAULT_FAVORITES = [
  "pdf-visual-editor",
  "jwt-debugger",
  "regex-tester",
  "cron-schedule-expression",
  "json-to-zod",
];

export function getPinnedFavorites(): string[] {
  const current = getFavoriteSlugs();
  if (current.length > 0) return current;
  // Initialize default favorites if user has no saved items yet
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("toolbox-galaxy-favorite-tools-v1", JSON.stringify(DEFAULT_FAVORITES));
      window.dispatchEvent(new Event(favoriteToolsEvent()));
      return DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  }
  return DEFAULT_FAVORITES;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getPinnedFavorites);

  useEffect(() => {
    const handleUpdate = () => {
      setFavorites(getFavoriteSlugs());
    };

    window.addEventListener(favoriteToolsEvent(), handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(favoriteToolsEvent(), handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const isPinned = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  const togglePin = useCallback(
    (slug: string) => {
      const tool = tools.find((t) => t.slug === slug);
      if (tool) {
        toggleFavorite(tool);
      } else {
        // Fallback for games or routes not in tools registry
        const saved = getFavoriteSlugs();
        const next = saved.includes(slug)
          ? saved.filter((s) => s !== slug)
          : [slug, ...saved].slice(0, 15);
        try {
          localStorage.setItem("toolbox-galaxy-favorite-tools-v1", JSON.stringify(next));
          window.dispatchEvent(new Event(favoriteToolsEvent()));
        } catch {
          // ignore
        }
      }
    },
    []
  );

  return { favorites, isPinned, togglePin };
}
