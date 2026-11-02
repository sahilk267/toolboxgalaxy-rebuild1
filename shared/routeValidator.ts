import { findToolBySlug, findGameBySlug, findGuideBySlug } from "./seoCatalog";

const EXACT_VALID_ROUTES = new Set([
  "/",
  "/studio",
  "/pdf-studio",
  "/document-studio",
  "/tools",
  "/guides",
  "/games",
  "/games/logic-lab",
  "/games/tank-evolution",
  "/games/diep",
  "/games/surviv-io",
  "/games/battle-royale",
  "/games/krunker",
  "/games/krunker-fps",
  "/games/orbit-dash",
  "/games/the-hive",
  "/games/hive",
  "/games/spelling-bee",
  "/games/wordle",
  "/games/orbit-lexicon",
  "/games/connections",
  "/games/mini-crossword",
  "/games/crossword",
  "/games/strands",
  "/games/theme-threads",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/index.html",
  "/index.md",
]);

/**
 * Validates whether a pathname corresponds to an existing, valid page route.
 * Returns true for all canonical and alias routes, false for 404 pages.
 */
export function isValidRoute(pathname: string): boolean {
  if (!pathname) return false;
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  if (EXACT_VALID_ROUTES.has(cleanPath)) return true;

  if (cleanPath.startsWith("/tools/")) {
    const slug = cleanPath.slice("/tools/".length).split("/")[0];
    return Boolean(findToolBySlug(slug));
  }

  if (cleanPath.startsWith("/guides/")) {
    const slug = cleanPath.slice("/guides/".length).split("/")[0];
    return Boolean(findGuideBySlug(slug));
  }

  if (cleanPath.startsWith("/games/logic/")) {
    const slug = cleanPath.slice("/games/logic/".length).split("/")[0];
    return Boolean(findGameBySlug(slug));
  }

  if (cleanPath.startsWith("/games/")) {
    const slug = cleanPath.slice("/games/".length).split("/")[0];
    return Boolean(findGameBySlug(slug));
  }

  return false;
}
