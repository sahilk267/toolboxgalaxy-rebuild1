// Logic Lab / Daily Field: device-local date selects a repeatable orientation and honest assist profile; no puzzle data is fetched.
export type LogicDifficulty = "calm" | "standard" | "dense";
export type LogicDaily = { id: string; label: string; difficulty: LogicDifficulty; transform: 0 | 1 | 2 | 3 };

const localDateId = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const seedFrom = (value: string) => Array.from(value).reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 0x811c9dc5);

export function getLogicDaily(date = new Date()): LogicDaily {
  const id = localDateId(date); const seed = seedFrom(id); const difficulty = (["calm", "standard", "dense"] as const)[seed % 3];
  return { id, label: new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date), difficulty, transform: ((seed >>> 4) % 4) as 0 | 1 | 2 | 3 };
}

export function displayToBase(row: number, col: number, size: number, transform: LogicDaily["transform"]) {
  if (transform === 1) return { row, col: size - 1 - col };
  if (transform === 2) return { row: size - 1 - row, col };
  if (transform === 3) return { row: size - 1 - row, col: size - 1 - col };
  return { row, col };
}

export function baseToDisplay(row: number, col: number, size: number, transform: LogicDaily["transform"]) { return displayToBase(row, col, size, transform); }
