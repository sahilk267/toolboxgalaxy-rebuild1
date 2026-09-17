// Circuit Shift Daily Challenge: derives one reproducible board from the player device's local calendar date; nothing is fetched or transmitted.
export type DailyChallenge = { id: string; label: string; scrambleOffsets: number[] };

function localDateId(date = new Date()) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function seedFrom(value: string) { return Array.from(value).reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 0x811c9dc5); }
function step(seed: number) { return (Math.imul(seed, 1664525) + 1013904223) >>> 0; }

export function getDailyChallenge(date = new Date()): DailyChallenge { const id = localDateId(date); let state = seedFrom(id); const scrambleOffsets = Array.from({ length: 16 }, () => { state = step(state); return 1 + (state % 3); }); const label = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date); return { id, label, scrambleOffsets }; }
