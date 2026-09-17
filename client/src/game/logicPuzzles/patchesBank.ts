// Logic Lab / Patches bank: seven independently authored 6×6 rectangle partitions with unique solver outcomes and non-symmetry-equivalent topology.
import type { Patch, PatchClue, PatchShape, PatchesBoard } from "@/game/logicPuzzles/patches";

export type PatchesDifficulty = "calm" | "standard" | "dense";
export type PatchesEdition = { id: string; difficulty: PatchesDifficulty; board: PatchesBoard; solution: Patch[]; clueCount: number; searchNodes: number };
type RawEdition = [string, PatchesDifficulty, number, string, string];
const shape: Record<string, PatchShape> = { s: "square", w: "wide", t: "tall", f: "free" };
const clueId = (index: number) => String.fromCharCode(65 + index);
const decode = ([id, difficulty, searchNodes, clueToken, solutionToken]: RawEdition): PatchesEdition => {
  const clues: PatchClue[] = clueToken.split("|").map((token, index) => { const [row, col, area, kind] = token.split(","); return { id: clueId(index), cell: { row: Number(row), col: Number(col) }, area: Number(area), shape: shape[kind] }; });
  const solution: Patch[] = solutionToken.split("|").map((token, index) => { const [top, left, height, width] = token.split(",").map(Number); return { top, left, height, width, clueId: clueId(index) }; });
  return { id, difficulty, board: { rows: 6, cols: 6, clues }, solution, clueCount: clues.length, searchNodes };
};

const raw: RawEdition[] = [
  ["patches-apollo", "calm", 11, "0,1,5,w|2,0,4,s|4,1,4,s|3,2,12,t|5,0,1,s|5,1,2,f|5,3,1,s|5,4,1,s|0,5,1,s|2,5,5,t", "0,0,1,5|1,0,2,2|3,0,2,2|1,2,4,3|5,0,1,1|5,1,1,2|5,3,1,1|5,4,1,1|0,5,1,1|1,5,5,1"],
  ["patches-borealis", "calm", 10, "0,2,3,w|1,1,3,w|2,2,3,w|5,2,9,s|5,3,6,t|0,4,4,s|2,5,4,s|4,4,2,w|5,4,2,w", "0,0,1,3|1,0,1,3|2,0,1,3|3,0,3,3|0,3,6,1|0,4,2,2|2,4,2,2|4,4,1,2|5,4,1,2"],
  ["patches-celeste", "standard", 13, "4,1,12,t|0,2,1,s|0,3,1,s|0,4,1,s|0,5,1,s|1,3,3,w|1,5,1,s|2,2,4,f|4,5,8,f|5,2,1,s|5,4,2,w|5,5,1,s", "0,0,6,2|0,2,1,1|0,3,1,1|0,4,1,1|0,5,1,1|1,2,1,3|1,5,1,1|2,2,1,4|3,2,2,4|5,2,1,1|5,3,1,2|5,5,1,1"],
  ["patches-drift", "standard", 15, "0,2,3,w|0,3,1,s|0,4,2,f|1,0,1,s|5,0,4,t|1,2,2,w|4,1,8,t|2,3,2,t|5,3,3,f|1,5,2,w|5,4,8,f", "0,0,1,3|0,3,1,1|0,4,1,2|1,0,1,1|2,0,4,1|1,1,1,2|2,1,4,2|1,3,2,1|3,3,3,1|1,4,1,2|2,4,4,2"],
  ["patches-equinox", "standard", 14, "0,0,1,s|0,1,1,s|0,2,1,s|3,0,5,t|2,1,3,t|2,2,3,t|4,1,4,s|5,3,6,t|0,5,2,w|1,5,2,w|3,4,8,f", "0,0,1,1|0,1,1,1|0,2,1,1|1,0,5,1|1,1,3,1|1,2,3,1|4,1,2,2|0,3,6,1|0,4,1,2|1,4,1,2|2,4,4,2"],
  ["patches-fathom", "dense", 22, "0,2,8,f|0,5,4,s|2,0,1,s|3,0,1,s|4,0,1,s|5,0,1,s|2,1,1,s|4,1,2,t|3,2,6,t|2,5,2,f|3,4,4,s|5,1,1,s|5,5,4,f", "0,0,2,4|0,4,2,2|2,0,1,1|3,0,1,1|4,0,1,1|5,0,1,1|2,1,1,1|3,1,2,1|2,2,3,2|2,4,1,2|3,4,2,2|5,1,1,1|5,2,1,4"],
  ["patches-galileo", "dense", 21, "0,0,3,t|0,1,2,f|1,2,4,s|4,2,9,s|3,3,4,f|0,5,6,f|3,4,2,w|4,3,3,f|5,3,1,s|5,4,1,s|5,5,1,s", "0,0,3,1|0,1,1,2|1,1,2,2|3,0,3,3|0,3,4,1|0,4,3,2|3,4,1,2|4,3,1,3|5,3,1,1|5,4,1,1|5,5,1,1"],
];

export const patchesEditionBank = raw.map(decode);
export function patchesEditionForDate(dateId: string) { const [year, month, day] = dateId.split("-").map(Number); const ordinal = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000); return patchesEditionBank[((ordinal % patchesEditionBank.length) + patchesEditionBank.length) % patchesEditionBank.length]; }
