// Tool of the Day: deterministic local-date-based rotation across verified tools.
// Uses the visitor's device-local calendar date (matching client/src/game/logicPuzzles/daily.ts)
// so the selection rolls over at local midnight without UTC/timezone shift bugs.
import { tools as defaultTools, type ToolDefinition } from "@/data/toolRegistry";

/**
 * Formats a local date into "YYYY-MM-DD" key using the device's local calendar.
 * Exactly matches localDateId in client/src/game/logicPuzzles/daily.ts.
 */
export const getLocalDateKey = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Converts a device-local calendar date into an integer day count since Unix epoch (1970-01-01).
 * Uses Date.UTC(year, month, day) purely as a Gregorian calendar day-counter,
 * ensuring integer day steps without daylight-saving shifts or UTC-midnight flipping.
 */
export function getDayNumberSinceEpoch(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export type ToolOfTheDayInfo = {
  tool: ToolDefinition;
  index: number;
  dateKey: string;
  dateLabel: string;
};

/**
 * Deterministically selects one tool per calendar day from the provided tool registry.
 * Cycles evenly across all tools (index = dayNumber % totalTools).
 */
export function getToolOfTheDay(
  toolList: ToolDefinition[] = defaultTools,
  date = new Date()
): ToolDefinition | null {
  if (!toolList || toolList.length === 0) return null;
  const dayNumber = getDayNumberSinceEpoch(date);
  const index = ((dayNumber % toolList.length) + toolList.length) % toolList.length;
  return toolList[index];
}

/**
 * Returns the tool of the day with structured metadata (date key, human label, index).
 */
export function getToolOfTheDayDetails(
  toolList: ToolDefinition[] = defaultTools,
  date = new Date()
): ToolOfTheDayInfo | null {
  if (!toolList || toolList.length === 0) return null;
  const dateKey = getLocalDateKey(date);
  const dayNumber = getDayNumberSinceEpoch(date);
  const index = ((dayNumber % toolList.length) + toolList.length) % toolList.length;
  const tool = toolList[index];
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  return {
    tool,
    index,
    dateKey,
    dateLabel,
  };
}
