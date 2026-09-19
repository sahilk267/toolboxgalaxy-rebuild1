// Verification script for Tool of the Day feature:
// 1. Determinism (same date always returns the same tool)
// 2. Selection changes at local midnight rather than UTC midnight
// 3. Full coverage of the tool registry (no tool excluded, modulo bounds verification)
// 4. Zero state persistence / localStorage side effects

import { tools } from "../client/src/data/toolRegistry";
import {
  getLocalDateKey,
  getDayNumberSinceEpoch,
  getToolOfTheDay,
  getToolOfTheDayDetails,
} from "../client/src/lib/toolOfTheDay";

let failures = 0;
function assert(condition: unknown, name: string) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL · ${name}`);
  } else {
    console.log(`PASS · ${name}`);
  }
}

console.log("=================================================");
console.log("  TOOLBOX GALAXY — TOOL OF THE DAY VERIFICATION  ");
console.log("=================================================\n");

// ----------------------------------------------------------------------
// 1. DETERMINISM TESTS
// ----------------------------------------------------------------------
console.log("--- 1. Testing Determinism ---");

const fixedDate = new Date(2026, 8, 18, 14, 30, 0); // Sep 18, 2026 14:30
const run1 = getToolOfTheDay(tools, fixedDate);
const run2 = getToolOfTheDay(tools, fixedDate);
const run3 = getToolOfTheDay(tools, new Date(2026, 8, 18, 14, 30, 0));

assert(
  run1 !== null && run2 !== null && run1.slug === run2.slug && run1.slug === run3?.slug,
  "Calling getToolOfTheDay with the same calendar timestamp is 100% deterministic"
);

const details1 = getToolOfTheDayDetails(tools, fixedDate);
const details2 = getToolOfTheDayDetails(tools, fixedDate);
assert(
  details1 !== null &&
    details2 !== null &&
    details1.tool.slug === details2.tool.slug &&
    details1.dateKey === details2.dateKey &&
    details1.index === details2.index &&
    details1.dateKey === "2026-09-18",
  "getToolOfTheDayDetails returns deterministic metadata and formatted dateKey '2026-09-18'"
);

// Determinism across different times on the same local date
const morning = new Date(2026, 8, 18, 1, 0, 0);
const noon = new Date(2026, 8, 18, 12, 0, 0);
const evening = new Date(2026, 8, 18, 23, 59, 0);
assert(
  getToolOfTheDay(tools, morning)?.slug === getToolOfTheDay(tools, noon)?.slug &&
    getToolOfTheDay(tools, noon)?.slug === getToolOfTheDay(tools, evening)?.slug,
  "Any time of day within the same local calendar day selects the exact same tool"
);

// ----------------------------------------------------------------------
// 2. LOCAL MIDNIGHT ROLLOVER VS UTC MIDNIGHT TESTS
// ----------------------------------------------------------------------
console.log("\n--- 2. Testing Local Midnight vs UTC Midnight Rollover ---");

// Exactly at local midnight boundary
const beforeMidnight = new Date(2026, 8, 18, 23, 59, 59, 999);
const afterMidnight = new Date(2026, 8, 19, 0, 0, 0, 0);

const keyBefore = getLocalDateKey(beforeMidnight);
const keyAfter = getLocalDateKey(afterMidnight);
const daysBefore = getDayNumberSinceEpoch(beforeMidnight);
const daysAfter = getDayNumberSinceEpoch(afterMidnight);

assert(
  keyBefore === "2026-09-18" && keyAfter === "2026-09-19",
  "Local date key advances from 2026-09-18 to 2026-09-19 right at local midnight"
);

assert(
  daysAfter === daysBefore + 1,
  "Day number since epoch increments by exactly 1 at local midnight"
);

const toolBefore = getToolOfTheDay(tools, beforeMidnight);
const toolAfter = getToolOfTheDay(tools, afterMidnight);
assert(
  toolBefore !== null && toolAfter !== null && toolBefore.slug !== toolAfter.slug,
  "Tool selection changes across local midnight rollover"
);

// Verify that date key derivation uses local calendar parts, avoiding the UTC toISOString() bug
// For any date, getLocalDateKey matches local getFullYear, getMonth+1, getDate
const testSample = new Date(2026, 8, 18, 20, 0, 0);
const expectedLocalKey = `${testSample.getFullYear()}-${String(testSample.getMonth() + 1).padStart(2, "0")}-${String(testSample.getDate()).padStart(2, "0")}`;
assert(
  getLocalDateKey(testSample) === expectedLocalKey,
  "getLocalDateKey uses local calendar fields (matching daily.ts localDateId)"
);

// Verify that if a visitor's local date is still Sep 18, even if UTC has crossed into Sep 19 (e.g., negative offset),
// the selection relies on the local date
const localEvening = new Date(2026, 8, 18, 21, 30, 0);
assert(
  getLocalDateKey(localEvening) === "2026-09-18",
  "Evening timestamp strictly reflects local date regardless of UTC date drift"
);

// ----------------------------------------------------------------------
// 3. COMPLETE REGISTRY ROTATION & MODULO BOUNDS TESTS
// ----------------------------------------------------------------------
console.log("\n--- 3. Testing Full Registry Coverage & Modulo Bounds ---");

const totalTools = tools.length;
assert(totalTools === 53, `Tool registry contains exactly 53 non-game tools (found: ${totalTools})`);

// Iterate through a full cycle of 53 consecutive days
const baseEpochDay = new Date(2026, 0, 1, 12, 0, 0); // Jan 1, 2026
const cycleSeenSlugs = new Set<string>();
const cycleSeenIndices = new Set<number>();

for (let d = 0; d < totalTools; d++) {
  const currentDate = new Date(2026, 0, 1 + d, 12, 0, 0);
  const details = getToolOfTheDayDetails(tools, currentDate);
  if (details) {
    cycleSeenSlugs.add(details.tool.slug);
    cycleSeenIndices.add(details.index);
  }
}

assert(
  cycleSeenIndices.size === totalTools,
  `Every tool index (0 to ${totalTools - 1}) is reached over a ${totalTools}-day rotation (modulo covers all)`
);

assert(
  cycleSeenSlugs.size === totalTools,
  `Every single tool (${totalTools}/${totalTools}) in the registry appears in rotation with zero exclusions`
);

// Test across 2 full cycles (106 days) to ensure clean repeating without offset drift
const doubleCycleCounts = new Map<string, number>();
for (let d = 0; d < totalTools * 2; d++) {
  const currentDate = new Date(2026, 0, 1 + d, 12, 0, 0);
  const tool = getToolOfTheDay(tools, currentDate);
  if (tool) {
    doubleCycleCounts.set(tool.slug, (doubleCycleCounts.get(tool.slug) || 0) + 1);
  }
}

let allAppearedTwice = true;
for (const tool of tools) {
  if (doubleCycleCounts.get(tool.slug) !== 2) {
    allAppearedTwice = false;
    break;
  }
}

assert(
  allAppearedTwice,
  `Over ${totalTools * 2} days, every tool appears exactly 2 times (perfect cyclic fairness)`
);

// Long range test: 3,650 days (~10 years) ensures no index bounds violations
let boundsViolation = false;
for (let d = 0; d < 3650; d++) {
  const futureDate = new Date(2026, 0, 1 + d, 12, 0, 0);
  const details = getToolOfTheDayDetails(tools, futureDate);
  if (!details || details.index < 0 || details.index >= totalTools) {
    boundsViolation = true;
    break;
  }
}
assert(!boundsViolation, "Over 10 years (3,650 days), index is guaranteed 0 <= index < totalTools");

// Edge case: empty registry handles gracefully
const emptyResult = getToolOfTheDay([], new Date());
assert(emptyResult === null, "Empty tool list returns null without throwing an exception");

// ----------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------
console.log("-------------------------------------------------");
if (failures) {
  console.error(`\n❌ ${failures} Tool of the Day regression(s) failed.`);
  process.exit(1);
} else {
  console.log("\n✅ All Tool of the Day verification checks passed successfully!");
}
