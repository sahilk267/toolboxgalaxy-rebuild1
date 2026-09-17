export type LineSortMode = "none" | "asc" | "desc";
export type LineToolOptions = { sort: LineSortMode; removeDuplicates: boolean; trimLines: boolean; keepBlankLines: boolean; caseSensitiveDuplicates: boolean };
export type LineToolValue = { output: string; inputLines: number; outputLines: number; removedDuplicates: number; removedBlankLines: number };
export type LineToolResult = { value: LineToolValue; error?: never } | { value?: never; error: string };

export const lineToolLimits = { maxCharacters: 250_000, maxLines: 20_000 } as const;
type PreparedLine = { text: string; match: string; index: number };
const normalise = (input: string) => input.replace(/\r\n?/g, "\n");

export function processLines(input: string, options: LineToolOptions): LineToolResult {
  if (input.length > lineToolLimits.maxCharacters) return { error: "Use up to 250,000 characters in this current-tab workspace." };
  if (!input) return { value: { output: "", inputLines: 0, outputLines: 0, removedDuplicates: 0, removedBlankLines: 0 } };
  const source = normalise(input).split("\n"); if (source.length > lineToolLimits.maxLines) return { error: "Use up to 20,000 lines in this current-tab workspace." };
  let removedBlankLines = 0; let removedDuplicates = 0; const seen = new Set<string>(); const prepared: PreparedLine[] = [];
  for (let index = 0; index < source.length; index += 1) { const text = options.trimLines ? source[index].trim() : source[index]; const blank = !text.trim(); if (blank && !options.keepBlankLines) { removedBlankLines += 1; continue; } const match = options.caseSensitiveDuplicates ? text : text.toLocaleLowerCase(); if (options.removeDuplicates && seen.has(match)) { removedDuplicates += 1; continue; } if (options.removeDuplicates) seen.add(match); prepared.push({ text, match, index }); }
  if (options.sort !== "none") prepared.sort((left, right) => { const compared = left.match < right.match ? -1 : left.match > right.match ? 1 : left.index - right.index; return options.sort === "asc" ? compared : -compared; });
  const output = prepared.map((line) => line.text).join("\n"); return { value: { output, inputLines: source.length, outputLines: prepared.length, removedDuplicates, removedBlankLines } };
}
