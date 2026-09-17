// Local-first history: stores only public registry metadata for recently opened tool routes, never workspace inputs or outputs.
import type { ToolDefinition } from "@/data/toolRegistry";

const STORAGE_KEY = "toolbox-galaxy-recent-tools-v1";
const EVENT_NAME = "toolbox-galaxy-recent-tools-change";
const MAX_ITEMS = 6;
export type RecentToolEntry = Pick<ToolDefinition, "slug" | "name" | "category"> & { visitedAt: string };

function read() { try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is RecentToolEntry => Boolean(item && typeof item.slug === "string" && typeof item.name === "string" && typeof item.category === "string" && typeof item.visitedAt === "string")).slice(0, MAX_ITEMS) : []; } catch { return []; } }
function publish() { window.dispatchEvent(new Event(EVENT_NAME)); }
export function recentToolHistoryEvent() { return EVENT_NAME; }
export function getRecentTools() { return read(); }
export function recordToolVisit(tool: ToolDefinition) { const entry: RecentToolEntry = { slug: tool.slug, name: tool.name, category: tool.category, visitedAt: new Date().toISOString() }; const next = [entry, ...read().filter((item) => item.slug !== entry.slug)].slice(0, MAX_ITEMS); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); publish(); } catch { /* Storage can be disabled; the current tool remains fully usable. */ } }
export function clearRecentTools() { try { localStorage.removeItem(STORAGE_KEY); publish(); } catch { /* Storage can be disabled; no action is needed. */ } }
export function exportRecentTools(entries: RecentToolEntry[]) { const payload = { exportedAt: new Date().toISOString(), privacy: "Metadata-only route history. No tool inputs, outputs, files, or generated content are included.", entries }; const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "toolbox-galaxy-recent-tools.json"; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0); }
