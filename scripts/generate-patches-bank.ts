import { patchSolutionStats, solvedPatches, type Patch, type PatchClue, type PatchesBoard } from "../client/src/game/logicPuzzles/patches";

type Candidate = { id: string; difficulty: "calm" | "standard" | "dense"; board: PatchesBoard; solution: Patch[]; clueCount: number; searchNodes: number; partitionSignature: string; canonicalTopology: string; clueSignature: string };
type Rect = { top: number; left: number; height: number; width: number };

let seed = 20260827;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
const range = (end: number) => Array.from({ length: end }, (_, index) => index);
const key = (rect: Rect) => `${rect.top},${rect.left},${rect.height},${rect.width}`;
const shapeFor = (rect: Rect): PatchClue["shape"] => rect.height === rect.width ? "square" : rect.width > rect.height ? "wide" : "tall";
const transforms = [(row: number, col: number) => [row, col], (row: number, col: number) => [col, 5 - row], (row: number, col: number) => [5 - row, 5 - col], (row: number, col: number) => [5 - col, row], (row: number, col: number) => [row, 5 - col], (row: number, col: number) => [5 - row, col], (row: number, col: number) => [col, row], (row: number, col: number) => [5 - col, 5 - row]];
const topologySignature = (solution: Patch[]) => solution.map((patch, index) => Array.from({ length: patch.height * patch.width }, (_, cell) => `${patch.top + Math.floor(cell / patch.width)}:${patch.left + cell % patch.width}`).sort().join(",")).sort().join("|");
const canonicalTopology = (solution: Patch[]) => transforms.map((transform) => solution.map((patch) => Array.from({ length: patch.height * patch.width }, (_, cell) => transform(patch.top + Math.floor(cell / patch.width), patch.left + cell % patch.width).join(":")).sort().join(",")).sort().join("|")).sort()[0];

function makeTiling() { const rectangles: Rect[] = [{ top: 0, left: 0, height: 6, width: 6 }]; const target = 8 + Math.floor(random() * 6); while (rectangles.length < target) { const splittable = rectangles.filter((rect) => rect.height > 1 || rect.width > 1); if (!splittable.length) break; const current = pick(splittable); const index = rectangles.indexOf(current); const horizontal = current.height > 1 && (current.width === 1 || random() < .52); const cut = horizontal ? 1 + Math.floor(random() * (current.height - 1)) : 1 + Math.floor(random() * (current.width - 1)); const next = horizontal ? [{ ...current, height: cut }, { ...current, top: current.top + cut, height: current.height - cut }] : [{ ...current, width: cut }, { ...current, left: current.left + cut, width: current.width - cut }]; rectangles.splice(index, 1, ...next); }
  return rectangles;
}

function candidate(index: number): Candidate | null { const rectangles = makeTiling(); const clueCells = rectangles.map((rect) => ({ row: rect.top + Math.floor(random() * rect.height), col: rect.left + Math.floor(random() * rect.width) })); const clues: PatchClue[] = rectangles.map((rect, clueIndex) => ({ id: String.fromCharCode(65 + clueIndex), cell: clueCells[clueIndex], area: rect.height * rect.width, shape: rect.height !== rect.width && random() < .32 ? "free" : shapeFor(rect) })); const solution: Patch[] = rectangles.map((rect, clueIndex) => ({ ...rect, clueId: clues[clueIndex].id })); const board: PatchesBoard = { rows: 6, cols: 6, clues }; const stats = patchSolutionStats(board); if (stats.count !== 1 || !solvedPatches(solution, board)) return null; const partitionSignature = topologySignature(solution); return { id: "", difficulty: stats.nodes < 12 ? "calm" : stats.nodes < 20 ? "standard" : "dense", board, solution, clueCount: clues.length, searchNodes: stats.nodes, partitionSignature, canonicalTopology: canonicalTopology(solution), clueSignature: clues.map((clue) => `${clue.cell.row}:${clue.cell.col}:${clue.area}:${clue.shape}`).sort().join("|") };
}

const bank: Candidate[] = []; const partitionSignatures = new Set<string>(); const canonicalSignatures = new Set<string>(); const clueSignatures = new Set<string>(); const targetDifficulties: Candidate["difficulty"][] = ["calm", "calm", "standard", "standard", "standard", "dense", "dense"];
for (let attempt = 0; attempt < 80_000 && bank.length < 7; attempt += 1) { const item = candidate(attempt); if (!item || item.difficulty !== targetDifficulties[bank.length] || partitionSignatures.has(item.partitionSignature) || canonicalSignatures.has(item.canonicalTopology) || clueSignatures.has(item.clueSignature)) continue; item.id = ["patches-apollo", "patches-borealis", "patches-celeste", "patches-drift", "patches-equinox", "patches-fathom", "patches-galileo"][bank.length]; bank.push(item); partitionSignatures.add(item.partitionSignature); canonicalSignatures.add(item.canonicalTopology); clueSignatures.add(item.clueSignature); }
if (bank.length !== 7) throw new Error(`Generated ${bank.length} distinct unique Patches boards; expected seven.`);
console.log(JSON.stringify(bank, null, 2));
