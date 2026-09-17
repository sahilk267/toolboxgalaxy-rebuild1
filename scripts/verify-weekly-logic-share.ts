import { buildWeeklyLogicShareText } from "../client/src/lib/weeklyLogicShare";

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };

const allFieldsText = buildWeeklyLogicShareText({ weekLabel: "August 24–30", scopeLabel: "All fields", currentStreak: 4, longestStreak: 9, completedDays: 4, totalCompletedFields: 7 });
assert(allFieldsText === "Toolbox Galaxy / Weekly Local Summary\nAll fields · August 24–30\n4-day current streak · 9-day longest streak\n4 verified days · 7 fields complete\nBuilt only from completed daily editions in this browser.", "The all-fields share payload must contain only its visible range, scope, and calendar metrics in a stable plain-text format.");

const wendText = buildWeeklyLogicShareText({ weekLabel: "August 24–30", scopeLabel: "Wend", currentStreak: 0, longestStreak: 1, completedDays: 1, totalCompletedFields: 1 });
assert(wendText.includes("Wend · August 24–30") && wendText.includes("0-day current streak") && wendText.includes("1 verified days · 1 fields complete"), "A selected-game share payload must reflect only the selected visible summary values.");
assert(!/toolboxgalaxy:puzzle-completions|apollo|galileo|wend-[a-z]+|tango-[a-z]+|mini-sudoku|grid|path|localStorage/i.test(allFieldsText + wendText), "A weekly share payload must not expose completion keys, edition IDs, puzzle content, browser storage details, or hidden implementation data.");

console.log("Weekly local share payload verified: stable visible-only all-fields and selected-game summaries with no local completion identifiers or puzzle content.");
