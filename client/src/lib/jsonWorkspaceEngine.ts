/** Safe, bounded local JSON formatting, tree browsing, path lookup and structural comparison. */
export const MAX_JSON_CHARS = 250_000;
export const MAX_DIFFS = 100;
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type JsonParse = { value?: JsonValue; error?: string; line?: number; column?: number; valid: boolean };
export type JsonDiff = { path: string; kind: "added" | "removed" | "changed"; left: string; right: string };

export function jsonErrorPosition(input: string, error: string): { line?: number; column?: number } {
  const location = /line (\d+) column (\d+)/i.exec(error);
  if (location) return { line: Number(location[1]), column: Number(location[2]) };
  const found = /position (\d+)/i.exec(error);
  if (!found) return {};
  const pos = Math.min(input.length, Math.max(0, Number(found[1])));
  const prefix = input.slice(0, pos).replace(/\r\n?/g, "\n");
  const lines = prefix.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function readJson(input: string): JsonParse {
  if (input.length > MAX_JSON_CHARS) return { valid: false, error: "JSON must not exceed 250,000 characters." };
  if (!input.trim()) return { valid: false, error: "Enter valid JSON to begin." };
  try {
    return { valid: true, value: JSON.parse(input) as JsonValue };
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Invalid JSON";
    return { valid: false, error: message, ...jsonErrorPosition(input, message) };
  }
}

function sorted(value: JsonValue, depth = 0): JsonValue {
  if (depth > 100) throw new Error("JSON nesting is too deep to sort.");
  if (Array.isArray(value)) return value.map(item => sorted(item, depth + 1));
  if (value && typeof value === "object") {
    // Object.fromEntries avoids prototype mutation for keys such as __proto__.
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key], depth + 1)])) as JsonValue;
  }
  return value;
}

export function formatJson(input: string, minify = false, sortKeys = false):
  { output?: string; error?: string } {
  const parsed = readJson(input);
  if (!parsed.valid) return { error: parsed.error };
  try {
    const data = sortKeys ? sorted(parsed.value!) : parsed.value;
    return { output: JSON.stringify(data, null, minify ? 0 : 2) };
  } catch (reason) {
    return { error: reason instanceof Error ? reason.message : "Unable to format JSON." };
  }
}

export function parseJsonPath(path: string): { segments?: (string | number)[]; error?: string } {
  const text = path.trim();
  if (!text.startsWith("$")) return { error: "JSON path must begin with $." };
  const segments: (string | number)[] = [];
  let pos = 1;
  while (pos < text.length) {
    if (segments.length >= 100) return { error: "JSON path is too deep." };
    if (text[pos] === ".") {
      const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(text.slice(pos + 1));
      if (!match) return { error: "Expected a property after the dot." };
      segments.push(match[0]);
      pos += match[0].length + 1;
    } else if (text[pos] === "[") {
      const start = pos + 1;
      if (text[start] === '"') {
        let end = start + 1, escaped = false;
        for (; end < text.length; end++) {
          if (!escaped && text[end] === '"') break;
          if (!escaped && text[end] === "\\") escaped = true;
          else escaped = false;
        }
        if (end >= text.length || text[end + 1] !== "]") return { error: "Unterminated quoted JSON path key." };
        try {
          const key = JSON.parse(text.slice(start, end + 1));
          if (typeof key !== "string") throw new Error("Not a string");
          segments.push(key);
        } catch { return { error: "Invalid escaped JSON path property." }; }
        pos = end + 2;
      } else {
        const match = /^(0|[1-9]\d*)\]/.exec(text.slice(start));
        if (!match) return { error: "Use [0] numeric indices or [\"key\"] for special property names." };
        const index = Number(match[1]);
        if (!Number.isSafeInteger(index)) return { error: "JSON array index is too large." };
        segments.push(index);
        pos += match[0].length + 1;
      }
    } else return { error: "Unsupported JSON path syntax." };
  }
  return { segments };
}

export function queryJson(input: string, path: string): { output?: string; error?: string } {
  const parsed = readJson(input);
  if (!parsed.valid) return { error: parsed.error };
  const query = parseJsonPath(path);
  if (!query.segments) return { error: query.error };
  let current: JsonValue = parsed.value!;
  for (const segment of query.segments) {
    if (current === null || typeof current !== "object" ||
        !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { error: "JSON path not found." };
    }
    current = (current as Record<string | number, JsonValue>)[segment];
  }
  return { output: JSON.stringify(current, null, 2) };
}

function brief(value: JsonValue | undefined): string {
  if (value === undefined) return "—";
  try {
    const text = JSON.stringify(value);
    return text.length > 180 ? text.slice(0, 177) + "..." : text;
  } catch { return "unrepresentable"; }
}
function keyPath(path: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? path + "." + key : path + "[" + JSON.stringify(key) + "]";
}

export function compareJson(left: string, right: string): { changes?: JsonDiff[]; error?: string } {
  const a = readJson(left), b = readJson(right);
  if (!a.valid) return { error: "Left JSON: " + a.error };
  if (!b.valid) return { error: "Right JSON: " + b.error };
  const changes: JsonDiff[] = [];
  function walk(x: JsonValue, y: JsonValue, path: string, depth: number) {
    if (changes.length >= MAX_DIFFS) return;
    if (depth > 100) throw new Error("JSON nesting exceeds comparison limit.");
    if (Object.is(x, y)) return;
    if (!x || !y || typeof x !== "object" || typeof y !== "object" ||
        Array.isArray(x) !== Array.isArray(y)) {
      changes.push({ path, kind: "changed", left: brief(x), right: brief(y) }); return;
    }
    const xObject = x as Record<string, JsonValue>, yObject = y as Record<string, JsonValue>;
    const keys = new Set([...Object.keys(xObject), ...Object.keys(yObject)]);
    for (const key of keys) {
      if (changes.length >= MAX_DIFFS) return;
      const node = Array.isArray(x) ? path + "[" + key + "]" : keyPath(path, key);
      if (!Object.prototype.hasOwnProperty.call(xObject, key))
        changes.push({ path: node, kind: "added", left: "—", right: brief(yObject[key]) });
      else if (!Object.prototype.hasOwnProperty.call(yObject, key))
        changes.push({ path: node, kind: "removed", left: brief(xObject[key]), right: "—" });
      else walk(xObject[key], yObject[key], node, depth + 1);
    }
  }
  try { walk(a.value!, b.value!, "$", 0); }
  catch (reason) { return { error: reason instanceof Error ? reason.message : "Comparison failed." }; }
  return { changes };
}
