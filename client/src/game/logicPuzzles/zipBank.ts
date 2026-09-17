// Orbital Workbench / Zip board bank: seven independently solver-verified 6×6 fields. Each route, station sequence, and wall map is authored data—not a visual transform.
import type { Cell } from "@/game/logicPuzzles/core";
export type ZipDifficulty = "calm" | "standard" | "dense";
export type ZipBoard = { rows: number; cols: number; numbers: { value: number; cell: Cell }[]; blockedEdges: [Cell, Cell][] };
export type ZipEdition = { id: string; difficulty: ZipDifficulty; board: ZipBoard; solution: Cell[]; turns: number };
const cell = (index: number): Cell => ({ row: Math.floor(index / 6), col: index % 6 });
const buildEdition = (id: string, difficulty: ZipDifficulty, route: number[], checkpoints: number[], walls: [number, number][], turns: number): ZipEdition => {
  const solution = route.map(cell);
  return { id, difficulty, solution, turns, board: { rows: 6, cols: 6, numbers: checkpoints.map((step, index) => ({ value: index + 1, cell: solution[step] })), blockedEdges: walls.map(([a, b]) => [cell(a), cell(b)]) } };
};
export const zipEditionBank: ZipEdition[] = [
  buildEdition("zip-aegis", "calm", [16,22,28,27,21,20,19,13,14,15,9,10,4,5,11,17,23,29,35,34,33,32,26,25,31,30,24,18,12,6,0,1,7,8,2,3], [0,4,8,12,16,20,24,28,32,35], [[3,9],[12,13],[31,32],[22,23],[27,33],[19,25],[18,19]], 21),
  buildEdition("zip-borealis", "calm", [12,18,24,30,31,32,26,20,21,27,33,34,35,29,28,22,23,17,16,10,11,5,4,3,2,1,0,6,7,8,9,15,14,13,19,25], [0,4,9,13,17,21,25,29,33,35], [[11,17],[7,13],[16,22],[14,20],[8,14],[15,16],[9,10],[23,29]], 20),
  buildEdition("zip-cinder", "standard", [2,1,0,6,12,13,7,8,14,15,21,20,19,18,24,30,31,25,26,32,33,27,28,22,16,10,9,3,4,5,11,17,23,29,35,34], [0,5,10,14,18,22,26,30,35], [[13,14],[10,11],[6,7],[4,10],[21,22],[24,25],[9,15],[33,34]], 22),
  buildEdition("zip-delta", "standard", [9,15,14,13,19,18,12,6,0,1,7,8,2,3,4,5,11,10,16,22,21,20,26,25,24,30,31,32,33,27,28,34,35,29,23,17], [0,4,9,15,20,25,30,35], [[25,31],[15,21],[26,32],[22,28],[3,9],[28,29],[1,2],[22,23],[15,16]], 22),
  buildEdition("zip-ember", "standard", [16,10,4,5,11,17,23,22,28,29,35,34,33,27,21,15,9,3,2,8,7,1,0,6,12,13,14,20,19,18,24,30,31,25,26,32], [0,5,11,16,21,26,31,35], [[7,13],[9,10],[19,25],[8,14],[21,22],[10,11],[26,27],[24,25],[31,32]], 22),
  buildEdition("zip-fathom", "dense", [7,8,2,3,4,5,11,17,23,22,16,10,9,15,21,27,28,29,35,34,33,32,26,25,31,30,24,18,19,20,14,13,12,6,0,1], [0,6,12,18,24,30,35], [[26,27],[16,17],[27,33],[20,26],[8,9],[1,2],[10,11],[20,21],[1,7]], 20),
  buildEdition("zip-gamma", "dense", [26,20,14,8,7,13,12,18,19,25,24,30,31,32,33,34,35,29,28,27,21,22,23,17,16,15,9,10,11,5,4,3,2,1,0,6], [0,7,14,21,28,35], [[6,12],[26,32],[28,34],[22,28],[25,26],[3,9],[13,14],[18,24],[6,7],[10,16]], 20),
];
export function zipEditionForDate(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number); const ordinal = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return zipEditionBank[((ordinal % zipEditionBank.length) + zipEditionBank.length) % zipEditionBank.length];
}
