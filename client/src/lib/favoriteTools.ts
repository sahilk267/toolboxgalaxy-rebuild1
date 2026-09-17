// Local-first favorites: saves only verified tool route slugs in this browser; workspace inputs, outputs, files, and generated content are never retained.
import type { ToolDefinition } from "@/data/toolRegistry";

const STORAGE_KEY = "toolbox-galaxy-favorite-tools-v1";
const EVENT_NAME = "toolbox-galaxy-favorite-tools-change";
const MAX_ITEMS = 12;
function read() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(value) ? Array.from(new Set(value.filter((slug): slug is string => typeof slug === "string"))).slice(0, MAX_ITEMS) : []; } catch { return []; } }
function publish() { window.dispatchEvent(new Event(EVENT_NAME)); }
export function favoriteToolsEvent() { return EVENT_NAME; }
export function getFavoriteSlugs() { return read(); }
export function isFavorite(slug: string) { return read().includes(slug); }
export function toggleFavorite(tool: ToolDefinition) { const saved = read(); const next = saved.includes(tool.slug) ? saved.filter((slug) => slug !== tool.slug) : [tool.slug, ...saved].slice(0, MAX_ITEMS); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); publish(); return next.includes(tool.slug); } catch { return saved.includes(tool.slug); } }
export function clearFavoriteTools() { try { localStorage.removeItem(STORAGE_KEY); publish(); } catch { /* Storage can be disabled; the current browser session stays usable. */ } }
