// Orbital Workbench: privacy-safe local puzzle completion flags, keyed only by bundled route slug and device-local field date.
const STORAGE_KEY = "toolboxgalaxy:puzzle-completions";

export type PuzzleCompletionMap = Record<string, true>;

const keyFor = (slug: string, fieldId: string) => `${slug}:${fieldId}`;

function read() {
  if (typeof window === "undefined") return {} as PuzzleCompletionMap;
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as PuzzleCompletionMap; } catch { return {} as PuzzleCompletionMap; }
}

export function readPuzzleCompletionMap() { return read(); }

export function isPuzzleFieldComplete(slug: string, fieldId: string) {
  return Boolean(read()[keyFor(slug, fieldId)]);
}

export function markPuzzleFieldComplete(slug: string, fieldId: string) {
  if (typeof window === "undefined") return;
  const next = read(); next[keyFor(slug, fieldId)] = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}
