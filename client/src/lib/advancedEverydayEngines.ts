/**
 * Pure local-first math and writing engines. No rate feeds, network or stored input.
 * Keep these separate from React so they can be regression tested directly in Node.
 */
export type PercentMode =
  | "partOfTotal" | "percentOf" | "change" | "difference"
  | "reverseIncrease" | "reverseDiscount" | "points";

export interface PercentResult {
  value: number;
  unit: "%" | "points" | "number";
  explanation: string;
  formula: string;
}

export function parseFiniteDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return null;
  const result = Number(trimmed);
  return Number.isFinite(result) ? result : null;
}

export function displayNumber(n: number): string {
  if (!Number.isFinite(n)) return "Invalid";
  if (n !== 0 && (Math.abs(n) < 0.00000001 || Math.abs(n) >= 1e15))
    return n.toExponential(6);
  return Number(n.toPrecision(12)).toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function calculatePercentage(mode: PercentMode, first: string, second: string): { value?: PercentResult; error?: string } {
  const a = parseFiniteDecimal(first);
  const b = parseFiniteDecimal(second);
  if (a === null || b === null) return { error: "Enter two valid finite numbers." };
  let value: number, unit: PercentResult["unit"], explanation: string, formula: string;
  unit = "%";
  switch (mode) {
    case "partOfTotal":
      if (b === 0) return { error: "Total must not be zero." };
      value = (a / b) * 100;
      formula = "Part ÷ Total × 100";
      explanation = displayNumber(a) + " is " + displayNumber(value) + "% of " + displayNumber(b) + ".";
      break;
    case "percentOf":
      value = (a / 100) * b;
      unit = "number";
      formula = "Percentage ÷ 100 × Amount";
      explanation = displayNumber(a) + "% of " + displayNumber(b) + " = " + displayNumber(value) + ".";
      break;
    case "change":
      if (a === 0) return { error: "Starting value must not be zero." };
      value = ((b - a) / Math.abs(a)) * 100;
      formula = "(New − Original) ÷ |Original| × 100";
      explanation = displayNumber(value) + "% change from " + displayNumber(a) + " to " + displayNumber(b) + ".";
      break;
    case "difference": {
      const averageMagnitude = (Math.abs(a) + Math.abs(b)) / 2;
      value = averageMagnitude === 0 ? 0 : (Math.abs(b - a) / averageMagnitude) * 100;
      formula = "|A − B| ÷ ((|A| + |B|) ÷ 2) × 100";
      explanation = displayNumber(value) + "% symmetric difference between " + displayNumber(a) + " and " + displayNumber(b) + ".";
      break;
    }
    case "reverseIncrease":
    case "reverseDiscount": {
      if (b < 0 || b > 100) return { error: "Enter a percentage rate from 0 to 100." };
      const factor = mode === "reverseIncrease" ? 1 + b / 100 : 1 - b / 100;
      if (factor === 0) return { error: "A 100% discount cannot be reversed." };
      value = a / factor;
      unit = "number";
      formula = mode === "reverseIncrease" ? "Final ÷ (1 + Rate ÷ 100)" : "Final ÷ (1 − Rate ÷ 100)";
      explanation = "Original amount = " + displayNumber(value) + " before the " + displayNumber(b) + "% " + (mode === "reverseIncrease" ? "increase" : "discount") + ".";
      break;
    }
    case "points":
      value = b - a;
      unit = "points";
      formula = "New percentage − Old percentage";
      explanation = displayNumber(value) + " percentage points from " + displayNumber(a) + "% to " + displayNumber(b) + "%.";
      break;
    default:
      return { error: "Unsupported percentage calculation." };
  }
  if (!Number.isFinite(value)) return { error: "Result is outside the supported numeric range." };
  return { value: { value, unit, explanation, formula } };
}

export type UnitCategory = "length" | "mass" | "temperature" | "area" | "volume" | "speed" | "pressure" | "data";
export type UnitDefinition = { id: string; label: string; factor: number };
export const UNIT_CATEGORIES: readonly { id: UnitCategory; label: string }[] = [
  { id: "length", label: "Length" },
  { id: "mass", label: "Weight / Mass" },
  { id: "temperature", label: "Temperature" },
  { id: "area", label: "Area" },
  { id: "volume", label: "Volume / Cooking" },
  { id: "speed", label: "Speed" },
  { id: "pressure", label: "Pressure" },
  { id: "data", label: "Digital storage" },
];

export const UNITS: Record<UnitCategory, readonly UnitDefinition[]> = {
  length: [
    { id: "km", label: "Kilometres (km)", factor: 1000 },
    { id: "mi", label: "Miles (mi)", factor: 1609.344 },
    { id: "m", label: "Metres (m)", factor: 1 },
    { id: "ft", label: "Feet (ft)", factor: 0.3048 },
    { id: "in", label: "Inches (in)", factor: 0.0254 },
    { id: "yd", label: "Yards (yd)", factor: 0.9144 },
    { id: "cm", label: "Centimetres (cm)", factor: 0.01 },
    { id: "mm", label: "Millimetres (mm)", factor: 0.001 },
  ],
  mass: [
    { id: "kg", label: "Kilograms (kg)", factor: 1 },
    { id: "lb", label: "Pounds (lb)", factor: 0.45359237 },
    { id: "g", label: "Grams (g)", factor: 0.001 },
    { id: "oz", label: "Ounces (oz)", factor: 0.028349523125 },
    { id: "st", label: "Stone (st)", factor: 6.35029318 },
    { id: "mg", label: "Milligrams (mg)", factor: 0.000001 },
  ],
  temperature: [
    { id: "c", label: "Celsius (°C)", factor: 1 },
    { id: "f", label: "Fahrenheit (°F)", factor: 1 },
    { id: "k", label: "Kelvin (K)", factor: 1 },
  ],
  area: [
    { id: "sqm", label: "Square metres (m²)", factor: 1 },
    { id: "sqft", label: "Square feet (ft²)", factor: 0.09290304 },
    { id: "acre", label: "Acres", factor: 4046.8564224 },
    { id: "ha", label: "Hectares", factor: 10000 },
    { id: "sqkm", label: "Square kilometres (km²)", factor: 1000000 },
    { id: "sqmi", label: "Square miles (mi²)", factor: 2589988.110336 },
  ],
  volume: [
    { id: "l", label: "Litres (L)", factor: 1 },
    { id: "gal-us", label: "US gallons", factor: 3.785411784 },
    { id: "ml", label: "Millilitres (mL)", factor: 0.001 },
    { id: "qt-us", label: "US quarts", factor: 0.946352946 },
    { id: "cup-us", label: "US customary cups", factor: 0.2365882365 },
    { id: "floz-us", label: "US fluid ounces", factor: 0.0295735295625 },
    { id: "tbsp-us", label: "US tablespoons", factor: 0.01478676478125 },
    { id: "tsp-us", label: "US teaspoons", factor: 0.00492892159375 },
    { id: "m3", label: "Cubic metres (m³)", factor: 1000 },
  ],
  speed: [
    { id: "kmh", label: "Kilometres / hour", factor: 1 / 3.6 },
    { id: "mph", label: "Miles / hour", factor: 0.44704 },
    { id: "ms", label: "Metres / second", factor: 1 },
    { id: "fps", label: "Feet / second", factor: 0.3048 },
    { id: "kn", label: "Knots", factor: 1852 / 3600 },
  ],
  pressure: [
    { id: "kpa", label: "Kilopascals (kPa)", factor: 1000 },
    { id: "psi", label: "Pounds / square inch (psi)", factor: 6894.757293168 },
    { id: "pa", label: "Pascals (Pa)", factor: 1 },
    { id: "bar", label: "Bar", factor: 100000 },
    { id: "atm", label: "Atmospheres (atm)", factor: 101325 },
  ],
  data: [
    { id: "mb", label: "Megabytes (MB, decimal)", factor: 1000000 },
    { id: "mib", label: "Mebibytes (MiB, binary)", factor: 1048576 },
    { id: "b", label: "Bytes (B)", factor: 1 },
    { id: "bit", label: "Bits", factor: 0.125 },
    { id: "kb", label: "Kilobytes (KB, decimal)", factor: 1000 },
    { id: "gb", label: "Gigabytes (GB, decimal)", factor: 1000000000 },
    { id: "kib", label: "Kibibytes (KiB, binary)", factor: 1024 },
    { id: "gib", label: "Gibibytes (GiB, binary)", factor: 1073741824 },
  ],
};

const celsiusFrom = (amount: number, from: string): number =>
  from === "f" ? (amount - 32) * 5 / 9 : from === "k" ? amount - 273.15 : amount;
const celsiusTo = (c: number, to: string): number =>
  to === "f" ? c * 9 / 5 + 32 : to === "k" ? c + 273.15 : c;

export function convertUnit(category: UnitCategory, amount: string, from: string, to: string):
  { value?: { result: number; output: string; detail: string }; error?: string } {
  const n = parseFiniteDecimal(amount);
  if (n === null) return { error: "Enter a valid finite number." };
  const set = UNITS[category];
  if (!set) return { error: "Choose a valid conversion category." };
  const source = set.find(unit => unit.id === from);
  const destination = set.find(unit => unit.id === to);
  if (!source || !destination) return { error: "Choose two compatible units." };
  if (category !== "temperature" && n < 0) return { error: "Enter a non-negative quantity." };
  if (category === "temperature" && celsiusFrom(n, from) < -273.15000000001)
    return { error: "Temperature cannot be below absolute zero." };
  const result = category === "temperature"
    ? celsiusTo(celsiusFrom(n, from), to)
    : (n * source.factor) / destination.factor;
  if (!Number.isFinite(result)) return { error: "Converted result is outside the supported numeric range." };
  const detail = displayNumber(n) + " " + source.label + " = " + displayNumber(result) + " " + destination.label;
  return { value: { result, output: displayNumber(result), detail } };
}

export const TEXT_STATS_MAX_CHARS = 200_000;
export type TextReport = {
  words: number; characters: number; withoutWhitespace: number; lines: number;
  sentences: number; paragraphs: number; uniqueWords: number; readingMinutes: number;
  speakingMinutes: number; keywords: { word: string; count: number }[];
};

function wordTokens(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
      return Array.from(segmenter.segment(text))
        .filter(segment => segment.isWordLike)
        .map(segment => segment.segment.toLocaleLowerCase());
    } catch { /* use deterministic Unicode fallback */ }
  }
  return (text.match(/[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu) ?? [])
    .map(word => word.toLocaleLowerCase());
}

export function analyzeTextStatistics(text: string): TextReport {
  if (text.length > TEXT_STATS_MAX_CHARS) throw new RangeError("Text exceeds 200,000 characters.");
  const trimmed = text.trim();
  const tokens = wordTokens(trimmed);
  const counts = new Map<string, number>();
  tokens.forEach(token => counts.set(token, (counts.get(token) ?? 0) + 1));
  let sentences = 0;
  if (trimmed) {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
        sentences = Array.from(segmenter.segment(trimmed)).filter(s => /[\p{L}\p{N}]/u.test(s.segment)).length;
      } catch { sentences = 0; }
    }
    if (!sentences) sentences = trimmed.split(/(?<=[.!?。！？])\s+/u).filter(x => /[\p{L}\p{N}]/u.test(x)).length;
  }
  return {
    words: tokens.length,
    characters: text.length, // Preserve existing JavaScript string-length behavior.
    withoutWhitespace: text.replace(/\s/gu, "").length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
    sentences,
    paragraphs: trimmed ? trimmed.split(/(?:\r\n|\r|\n)[\t ]*(?:\r\n|\r|\n)/).filter(p => p.trim()).length : 0,
    uniqueWords: counts.size,
    readingMinutes: tokens.length ? Math.ceil(tokens.length / 200) : 0,
    speakingMinutes: tokens.length ? Math.ceil(tokens.length / 130) : 0,
    keywords: Array.from(counts, ([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
      .slice(0, 8),
  };
}
