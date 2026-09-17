import { logicPersonalBests } from "../client/src/lib/logicPersonalBest";
import type { PuzzleCompletionMap } from "../client/src/lib/puzzleCompletion";

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const reference = new Date(2026, 7, 27);
const records: PuzzleCompletionMap = {
  "strands-strands-breakfast:2026-08-27": true,
  "hive-hive-001:2026-08-27": true,
  "mini-sudoku-sudoku-apollo:2026-08-25": true,
  "mini-sudoku-sudoku-apollo:2026-08-26": true,
  "tango-tango-apollo:2026-08-26": true,
  "tango-tango-borealis:2026-08-27": true,
  "patches-patches-apollo:2026-08-27": true,
  "wend-wend-galileo:2026-08-27": true,
  "zip-zip-not-a-real-edition:2026-08-27": true,
  "queens-queens-apollo:2026-08-28": true,
  "tango:2026-08-27": true,
  "wend-wend-apollo:not-a-date": true,
  "patches-patches-borealis:2026-02-30": true,
};

const bySlug = Object.fromEntries(logicPersonalBests(reference, records).map((record) => [record.slug, record]));
assert(Object.keys(bySlug).join(",") === "strands,hive,connections,wordle,mini-crossword,queens,mini-sudoku,tango,patches,zip,wend", "The personal-best overview must expose all eleven genuine browser-local puzzle banks in a stable order.");
assert(bySlug.strands.availableEditions === 7, "Strands must disclose its seven authored editions.");
assert(bySlug.hive.availableEditions === 6, "The Hive must disclose its authored editions.");
assert(bySlug.strands.completedEditions === 1 && bySlug.strands.currentStreak === 1 && bySlug.strands.longestStreak === 1, "Strands completion on the reference date must register 1 completed edition and a 1-day streak.");
assert(bySlug.hive.completedEditions === 1 && bySlug.hive.currentStreak === 1 && bySlug.hive.longestStreak === 1, "The Hive completion on the reference date must register 1 completed edition and a 1-day streak.");
assert(bySlug["mini-sudoku"].completedEditions === 1 && bySlug["mini-sudoku"].longestStreak === 2 && bySlug["mini-sudoku"].currentStreak === 0, "Repeating a completed Mini Sudoku edition on different dates must preserve its one-edition count while its valid consecutive-day record remains visible.");
assert(bySlug.tango.completedEditions === 2 && bySlug.tango.currentStreak === 2 && bySlug.tango.longestStreak === 2, "Two distinct reached Tango editions on consecutive dates must create an honest two-edition and two-day local record.");
assert(bySlug.patches.completedEditions === 1 && bySlug.patches.currentStreak === 1 && bySlug.wend.completedEditions === 1 && bySlug.wend.currentStreak === 1, "A genuine current-day authored completion must appear only on its own game card.");
assert(bySlug.queens.completedEditions === 0 && bySlug.zip.completedEditions === 0, "Future and unknown-edition keys must not inflate a personal-best card.");
assert(Object.values(bySlug).every((record) => Number.isFinite(record.currentStreak) && Number.isFinite(record.longestStreak)), "Malformed legacy, date, and completion records must be ignored without destabilizing personal-best calculations.");

console.log("Logic personal-best model verified: all 11 real bank cards including Strands and Hive, edition deduplication, reached-date streaks, and legacy/unknown/malformed/future exclusion.");

