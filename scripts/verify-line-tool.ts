import { tools } from "../client/src/data/toolRegistry";
import { lineToolLimits, processLines } from "../client/src/lib/lineToolEngine";

let failures = 0;
function assert(condition: unknown, name: string) { if (condition) console.log(`PASS · ${name}`); else { failures += 1; console.error(`FAIL · ${name}`); } }
const standard = { sort: "asc" as const, removeDuplicates: true, trimLines: true, keepBlankLines: false, caseSensitiveDuplicates: false };

assert(tools.length >= 37 && new Set(tools.map((tool) => tool.slug)).size === tools.length && new Set(tools.map((tool) => tool.name)).size === tools.length && new Set(tools.map((tool) => tool.kind)).size === tools.length && tools.some((tool) => tool.slug === "line-sorter-deduplicator" && tool.kind === "lineSorter"), "Line Sorter & De-duplicator remains a unique registry without duplicate slug, name, or runner kind");
const standardResult = processLines("Signal\nsignal\nAmber\n\n  Beacon \nSignal", standard);
assert(standardResult.value?.output === "Amber\nBeacon\nSignal" && standardResult.value.removedDuplicates === 2 && standardResult.value.removedBlankLines === 1, "Default cleanup trims line edges, removes case-insensitive repetitions and blanks, then sorts locally A–Z");
const originalOrder = processLines(" Zebra \nalpha\nZebra\nalpha", { ...standard, sort: "none", removeDuplicates: false });
assert(originalOrder.value?.output === "Zebra\nalpha\nZebra\nalpha" && originalOrder.value.outputLines === 4, "Keep first-seen order retains every explicit line after optional trimming without acting as Find / Replace");
const caseSensitive = processLines("Signal\nsignal\nSignal", { ...standard, sort: "none", caseSensitiveDuplicates: true });
assert(caseSensitive.value?.output === "Signal\nsignal" && caseSensitive.value.removedDuplicates === 1, "Case-sensitive duplicate matching retains distinct casing while removing exact repeated lines");
const blanksKept = processLines("alpha\n \n\nalpha", { ...standard, sort: "none", removeDuplicates: false, trimLines: false, keepBlankLines: true });
assert(blanksKept.value?.output === "alpha\n \n\nalpha" && blanksKept.value.removedBlankLines === 0, "Explicit blank-line retention preserves blank and whitespace-only source rows when trimming is off");
assert(Boolean(processLines("x".repeat(lineToolLimits.maxCharacters + 1), standard).error) && Boolean(processLines(Array.from({ length: lineToolLimits.maxLines + 1 }, () => "x").join("\n"), standard).error), "Line processing rejects oversized current-tab character and line counts before producing output");

if (failures) { console.error(`\n${failures} line-tool regression(s) failed.`); process.exit(1); }
console.log("\nAll Text Utilities Batch 5 engine regressions passed.");
