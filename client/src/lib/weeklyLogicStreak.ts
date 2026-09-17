// Orbital Workbench: derive a transparent weekly activity view from existing local completion flags only; no game opens, demos, accounts, or network data count.
import { readPuzzleCompletionMap, type PuzzleCompletionMap } from "@/lib/puzzleCompletion";

export const genuineDailyLogicSlugs = ["hive", "connections", "wordle", "mini-crossword", "strands", "queens", "mini-sudoku", "tango", "patches", "zip", "wend"] as const;
export type GenuineDailyLogicSlug = typeof genuineDailyLogicSlugs[number];
export type WeeklyLogicFilter = "all" | GenuineDailyLogicSlug;
export type WeeklyLogicDay = { id: string; shortLabel: string; dayNumber: number; isToday: boolean; isFuture: boolean; completedFields: GenuineDailyLogicSlug[] };
export type WeeklyLogicSummary = { weekStart: string; weekEnd: string; days: WeeklyLogicDay[]; currentStreak: number; longestStreak: number; completedDays: number; totalCompletedFields: number };

const oneDay = 86_400_000;
const formatId = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromId = (id: string) => { const [year, month, day] = id.split("-").map(Number); return new Date(year, month - 1, day); };
const addDays = (date: Date, amount: number) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
const monday = (date: Date) => addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -((date.getDay() + 6) % 7));
const completionPrefixes: Record<GenuineDailyLogicSlug, string> = {
  hive: "hive-hive-",
  connections: "connections-connections-",
  wordle: "wordle-wordle-",
  "mini-crossword": "mini-crossword-crossword-",
  strands: "strands-strands-",
  "mini-sudoku": "mini-sudoku-sudoku-",
  tango: "tango-tango-",
  queens: "queens-queens-",
  patches: "patches-patches-",
  zip: "zip-zip-",
  wend: "wend-wend-"
};
const completionSlugFor = (slug: GenuineDailyLogicSlug) => completionPrefixes[slug];
const genuineGameForCompletionSlug = (slug: string): GenuineDailyLogicSlug | null => {
  return genuineDailyLogicSlugs.find((game) => {
    const prefix = completionSlugFor(game);
    if (slug.startsWith(prefix)) return true;
    if (game === "strands" && (slug.startsWith("strands-") || slug === "strands")) return true;
    if (game === "hive" && (slug.startsWith("hive-") || slug === "hive")) return true;
    if (game === "connections" && (slug.startsWith("connections-") || slug === "connections")) return true;
    if (game === "wordle" && (slug.startsWith("wordle-") || slug === "wordle")) return true;
    if (game === "mini-crossword" && (slug.startsWith("mini-crossword-") || slug.startsWith("mini-cross-") || slug === "mini-crossword")) return true;
    return false;
  }) ?? null;
};
const includesFilter = (game: GenuineDailyLogicSlug, filter: WeeklyLogicFilter) => filter === "all" || game === filter;

export function completedFieldsForDate(dateId: string, completions: PuzzleCompletionMap, filter: WeeklyLogicFilter = "all"): GenuineDailyLogicSlug[] {
  return genuineDailyLogicSlugs.filter((game) =>
    includesFilter(game, filter) &&
    Object.keys(completions).some((key) => {
      const separator = key.lastIndexOf(":");
      if (separator < 0) return false;
      if (key.slice(separator + 1) !== dateId) return false;
      const slug = key.slice(0, separator);
      return genuineGameForCompletionSlug(slug) === game;
    })
  );
}
export function completedLogicDates(completions: PuzzleCompletionMap, filter: WeeklyLogicFilter = "all") { const dates = new Set<string>(); Object.keys(completions).forEach((key) => { const separator = key.lastIndexOf(":"); if (separator < 0) return; const slug = key.slice(0, separator); const dateId = key.slice(separator + 1); const game = genuineGameForCompletionSlug(slug); if (game && includesFilter(game, filter) && /^\d{4}-\d{2}-\d{2}$/.test(dateId)) dates.add(dateId); }); return Array.from(dates).sort(); }
const longestRun = (dateIds: string[]) => { let longest = 0; let current = 0; let previous = ""; dateIds.forEach((id) => { current = previous && fromId(id).getTime() - fromId(previous).getTime() === oneDay ? current + 1 : 1; longest = Math.max(longest, current); previous = id; }); return longest; };
const currentRun = (today: Date, completed: Set<string>) => { let count = 0; let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate()); while (completed.has(formatId(cursor))) { count += 1; cursor = addDays(cursor, -1); } return count; };

export function weeklyLogicSummary(reference = new Date(), weekOffset = 0, completions = readPuzzleCompletionMap(), filter: WeeklyLogicFilter = "all"): WeeklyLogicSummary {
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()); const todayId = formatId(today); const weekStartDate = addDays(monday(today), weekOffset * 7); const completedDateIds = completedLogicDates(completions, filter).filter((id) => id <= todayId); const completedSet = new Set(completedDateIds);
  const days = Array.from({ length: 7 }, (_, index) => { const date = addDays(weekStartDate, index); const id = formatId(date); const isFuture = date.getTime() > today.getTime(); return { id, shortLabel: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date).toUpperCase(), dayNumber: date.getDate(), isToday: id === todayId, isFuture, completedFields: isFuture ? [] : completedFieldsForDate(id, completions, filter) }; });
  return { weekStart: formatId(weekStartDate), weekEnd: formatId(addDays(weekStartDate, 6)), days, currentStreak: currentRun(today, completedSet), longestStreak: longestRun(completedDateIds), completedDays: completedDateIds.length, totalCompletedFields: Object.keys(completions).filter((key) => { const separator = key.lastIndexOf(":"); const game = separator >= 0 ? genuineGameForCompletionSlug(key.slice(0, separator)) : null; return Boolean(game && includesFilter(game, filter) && key.slice(separator + 1) <= todayId); }).length };
}
