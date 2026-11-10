/** Regression cases against the actual shared engines (no duplicated algorithms). */
import {
  calculatePercentage, convertUnit, parseFiniteDecimal, displayNumber,
  analyzeTextStatistics, TEXT_STATS_MAX_CHARS, UNIT_CATEGORIES, UNITS,
} from "../client/src/lib/advancedEverydayEngines";

let passed = 0;
function assert(condition: unknown, message: string) {
  if (!condition) throw new Error("Advanced everyday regression failed: " + message);
  passed++;
}
function approx(actual: number | undefined, expected: number, label: string, tolerance = 1e-9) {
  assert(typeof actual === "number" && Number.isFinite(actual) &&
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    label + " (expected " + expected + ", actual " + actual + ")");
}
function percent(mode: Parameters<typeof calculatePercentage>[0], a: string, b: string) {
  return calculatePercentage(mode, a, b);
}
function unit(cat: Parameters<typeof convertUnit>[0], a: string, from: string, to: string) {
  return convertUnit(cat, a, from, to);
}

// Preserve original two-field calculator semantics.
approx(percent("partOfTotal", "18", "120").value?.value, 15, "legacy part/total percentage");
assert(percent("partOfTotal", "18", "120").value?.explanation === "18 is 15% of 120.", "legacy output readable");
approx(percent("partOfTotal", "0", "120").value?.value, 0, "zero part");
assert(Boolean(percent("partOfTotal", "1", "0").error), "reject zero denominator");
approx(percent("partOfTotal", "-10", "50").value?.value, -20, "signed parts");
approx(percent("percentOf", "20", "150").value?.value, 30, "percent of amount");
approx(percent("percentOf", "0", "150").value?.value, 0, "zero percent of amount");
approx(percent("percentOf", "125", "80").value?.value, 100, "percentage above 100");
approx(percent("change", "80", "100").value?.value, 25, "relative increase");
approx(percent("change", "100", "80").value?.value, -20, "relative decrease");
assert(Boolean(percent("change", "0", "50").error), "reject ambiguous zero original");
approx(percent("difference", "80", "100").value?.value, 22.222222222222, "symmetric percent difference");
approx(percent("difference", "0", "0").value?.value, 0, "two zeroes equal");
approx(percent("difference", "-10", "10").value?.value, 200, "symmetric opposite signs");
approx(percent("reverseIncrease", "120", "20").value?.value, 100, "reverse increase");
approx(percent("reverseDiscount", "80", "20").value?.value, 100, "reverse discount");
assert(Boolean(percent("reverseDiscount", "0", "100").error), "100 percent discount cannot reverse");
assert(Boolean(percent("reverseDiscount", "20", "101").error), "discount >100 rejected");
assert(Boolean(percent("reverseIncrease", "20", "-1").error), "negative percentage rate rejected");
approx(percent("points", "12.5", "15").value?.value, 2.5, "percentage points");
approx(percent("points", "15", "12.5").value?.value, -2.5, "negative percentage points");
assert(percent("points", "15", "20").value?.unit === "points", "percentage points distinctly labeled");
assert(parseFiniteDecimal("") === null, "blank not parsed as zero");
assert(parseFiniteDecimal("  ") === null, "whitespace not parsed as zero");
assert(parseFiniteDecimal("0x10") === null, "hex disallowed");
assert(parseFiniteDecimal("Infinity") === null, "infinity disallowed");
assert(parseFiniteDecimal("1e999") === null, "overflow disallowed");
approx(parseFiniteDecimal(" -1.25e2 ") ?? undefined, -125, "scientific decimal accepted");
assert(Boolean(percent("percentOf", "1e308", "1e308").error), "percentage overflow guarded");
assert(displayNumber(0) === "0", "numeric zero formatted");
assert(displayNumber(1.5).includes("1.5"), "decimal formatting");

// Preserve km -> mi default while adding accurate US customary and scientific dimensions.
approx(unit("length", "1", "km", "mi").value?.result, 1000 / 1609.344, "legacy kilometer to miles");
approx(unit("length", "1", "mi", "km").value?.result, 1.609344, "miles to km");
approx(unit("length", "1", "ft", "m").value?.result, 0.3048, "feet to meters");
approx(unit("length", "1", "in", "cm").value?.result, 2.54, "inches to cm");
approx(unit("length", "1", "yd", "ft").value?.result, 3, "yards to feet");
approx(unit("mass", "1", "lb", "kg").value?.result, 0.45359237, "pounds to kg");
approx(unit("mass", "16", "oz", "lb").value?.result, 1, "ounces to pounds");
approx(unit("mass", "1", "st", "lb").value?.result, 14, "stones to pounds");
approx(unit("temperature", "32", "f", "c").value?.result, 0, "freezing point Fahrenheit");
approx(unit("temperature", "212", "f", "c").value?.result, 100, "boiling point Fahrenheit");
approx(unit("temperature", "100", "c", "f").value?.result, 212, "boiling point Celsius");
approx(unit("temperature", "-40", "c", "f").value?.result, -40, "C/F intersect");
approx(unit("temperature", "0", "c", "k").value?.result, 273.15, "Kelvin offset");
approx(unit("temperature", "0", "k", "c").value?.result, -273.15, "absolute zero");
assert(Boolean(unit("temperature", "-1", "k", "c").error), "negative Kelvin rejected");
assert(Boolean(unit("temperature", "-274", "c", "f").error), "below absolute zero rejected");
approx(unit("area", "1", "acre", "sqm").value?.result, 4046.8564224, "acre in square metres");
approx(unit("area", "1", "sqft", "sqm").value?.result, 0.09290304, "square feet in square metres");
approx(unit("area", "1", "sqmi", "sqkm").value?.result, 2.589988110336, "square miles to square km");
approx(unit("volume", "1", "gal-us", "l").value?.result, 3.785411784, "US gallon not imperial");
approx(unit("volume", "1", "cup-us", "ml").value?.result, 236.5882365, "US customary cup");
approx(unit("volume", "3", "tsp-us", "tbsp-us").value?.result, 1, "three US teaspoons to tablespoon");
approx(unit("volume", "4", "qt-us", "gal-us").value?.result, 1, "four quarts per US gallon");
approx(unit("speed", "60", "mph", "kmh").value?.result, 96.56064, "mph to km/h");
approx(unit("speed", "1", "kn", "kmh").value?.result, 1.852, "knot to km/h");
approx(unit("pressure", "1", "bar", "kpa").value?.result, 100, "bar to kPa");
approx(unit("pressure", "1", "atm", "pa").value?.result, 101325, "atmosphere to Pascal");
approx(unit("data", "1", "mb", "mib").value?.result, 1000000 / 1048576, "decimal MB vs binary MiB");
approx(unit("data", "8", "bit", "b").value?.result, 1, "eight bits to byte");
assert(Boolean(unit("length", "-1", "m", "ft").error), "negative physical quantity rejected");
assert(Boolean(unit("length", "foo", "m", "ft").error), "invalid unit amount rejected");
assert(Boolean(unit("length", "1", "km", "lb").error), "cross-category conversion rejected");
assert(Boolean(unit("bogus" as "length", "1", "km", "mi").error), "unknown category rejected");
for (const category of UNIT_CATEGORIES) {
  assert(UNITS[category.id].length >= 3, category.id + " has meaningful conversion options");
  const ids = UNITS[category.id].map(v => v.id);
  assert(new Set(ids).size === ids.length, category.id + " has unique unit IDs");
  for (const definition of UNITS[category.id]) {
    assert(Number.isFinite(definition.factor) && definition.factor > 0, definition.id + " finite conversion factor");
  }
}

// Preserve existing word/character/line counters; add Unicode, sentence and frequency tests.
const sample = analyzeTextStatistics("Write something useful. Then take a quick break.");
assert(sample.words === 9, "legacy sample word count");
assert(sample.characters === "Write something useful. Then take a quick break.".length, "legacy JS-character count");
assert(sample.lines === 1, "legacy single-line count");
assert(sample.readingMinutes === 1, "legacy reading estimate");
const empty = analyzeTextStatistics("");
assert(empty.words === 0 && empty.lines === 0 && empty.paragraphs === 0, "empty input zero counts");
assert(empty.readingMinutes === 0 && empty.speakingMinutes === 0, "no invented reading duration for empty input");
const paragraphs = analyzeTextStatistics("Hello world.\r\nSecond sentence!\r\n\r\nAnother paragraph.");
assert(paragraphs.lines === 4, "CRLF lines");
assert(paragraphs.paragraphs === 2, "blank-line separated paragraphs");
assert(paragraphs.sentences === 3, "sentence segmentation");
assert(paragraphs.words === 6, "paragraph word count");
const repeated = analyzeTextStatistics("Apple apple banana. Apple!");
assert(repeated.words === 4, "case-insensitive token count");
assert(repeated.uniqueWords === 2, "unique word count");
assert(repeated.keywords[0].word === "apple" && repeated.keywords[0].count === 3, "word frequency");
const unicode = analyzeTextStatistics("नमस्ते दुनिया café résumé");
assert(unicode.words >= 4, "Indic and accented Unicode tokenization");
assert(unicode.withoutWhitespace < unicode.characters, "characters without whitespace");
assert(analyzeTextStatistics("你好世界").words >= 1, "CJK input count");
assert(analyzeTextStatistics("😀 hey").characters === "😀 hey".length, "existing UTF-16 character semantics");
assert(analyzeTextStatistics("one\n").lines === 2, "trailing newline included in lines");
assert(analyzeTextStatistics(" \n  ").paragraphs === 0, "whitespace-only paragraphs ignored");
assert(analyzeTextStatistics(Array(201).fill("hello").join(" ")).readingMinutes === 2, "reading time ceiling");
assert(analyzeTextStatistics(Array(131).fill("hello").join(" ")).speakingMinutes === 2, "speaking time ceiling");
assert(analyzeTextStatistics("Red blue").keywords.every(k => k.count === 1), "two unique keywords");
let oversizedRejected = false;
try { analyzeTextStatistics("x".repeat(TEXT_STATS_MAX_CHARS + 1)); } catch (e) { oversizedRejected = e instanceof RangeError; }
assert(oversizedRejected, "200k character cap is enforced");

console.log("PASS: " + passed + " deterministic advanced everyday tool regression assertions.");
