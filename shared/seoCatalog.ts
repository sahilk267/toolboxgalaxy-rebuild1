import { tools, ToolDefinition } from "./toolsData";
import { GAMES_CATALOG, GameMetadata } from "./gamesData";
export * from "./ogCatalog";
export * from "./toolJsonLd";
export * from "./gameJsonLd";
export * from "./breadcrumbJsonLd";

export { tools, GAMES_CATALOG };
export type { ToolDefinition, GameMetadata };

/**
 * Normalizes a URL slug for robust lookup.
 */
function normalizeSlug(slug: string): string {
  return slug ? slug.trim().toLowerCase() : "";
}

/**
 * Finds a tool definition by slug.
 */
export function findToolBySlug(slug: string): ToolDefinition | undefined {
  const normalized = normalizeSlug(slug);
  return tools.find((t) => t.slug.toLowerCase() === normalized);
}

/**
 * Finds a game definition by slug.
 */
export function findGameBySlug(slug: string): GameMetadata | undefined {
  const normalized = normalizeSlug(slug);
  return GAMES_CATALOG.find((g) => g.slug.toLowerCase() === normalized);
}

/**
 * Truncates a description string cleanly to approximately maxLen characters (default: 155),
 * ensuring clean spacing and appending an ellipsis if trimmed.
 */
export function truncateDescription(text: string, maxLen = 155): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
}
