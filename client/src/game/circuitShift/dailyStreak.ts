// Circuit Shift Daily Streak: stores only completed local calendar dates in this browser, with no account, network request, or puzzle workspace data.
const STORAGE_KEY = "toolbox-circuit-shift-daily-streak-v1";
export type DailyStreak = { current: number; longest: number; lastCompletedId: string | null };
const empty: DailyStreak = { current: 0, longest: 0, lastCompletedId: null };
function read() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); return value && Number.isFinite(value.current) && Number.isFinite(value.longest) && (typeof value.lastCompletedId === "string" || value.lastCompletedId === null) ? { current: Math.max(0, value.current), longest: Math.max(0, value.longest), lastCompletedId: value.lastCompletedId } as DailyStreak : empty; } catch { return empty; } }
function dateIdFromLocal(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function previousDateId(id: string) { const [year, month, day] = id.split("-").map(Number); return dateIdFromLocal(new Date(year, month - 1, day - 1)); }
export function getDailyStreak() { return read(); }
export function completeDailyStreak(id: string) { const current = read(); if (current.lastCompletedId === id) return current; const nextCurrent = current.lastCompletedId === previousDateId(id) ? current.current + 1 : 1; const next: DailyStreak = { current: nextCurrent, longest: Math.max(current.longest, nextCurrent), lastCompletedId: id }; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Disabled browser storage leaves the completed board usable without a retained streak. */ } return next; }
