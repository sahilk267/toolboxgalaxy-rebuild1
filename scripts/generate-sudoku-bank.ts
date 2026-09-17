// Deterministic authoring utility. It emits candidate grids only; all candidates are independently rechecked before becoming shipped edition data.
import { countSudokuSolutions, type SudokuGrid } from "../client/src/game/logicPuzzles/miniSudoku";

let state = 0x51d0b4a7;
const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0xffffffff; };
const shuffle = <T,>(items: T[]) => [...items].sort(() => random() - .5);
const base: SudokuGrid = [[1,2,3,4,5,6],[4,5,6,1,2,3],[2,3,4,5,6,1],[5,6,1,2,3,4],[3,4,5,6,1,2],[6,1,2,3,4,5]];
const clone = (grid: SudokuGrid) => grid.map((row) => [...row]);

function makeSolution() {
  const digits = shuffle([1,2,3,4,5,6]); const bands = shuffle([0,1,2]); const stacks = shuffle([0,1]); const rows = bands.flatMap((band) => shuffle([band * 2, band * 2 + 1])); const cols = stacks.flatMap((stack) => shuffle([stack * 3, stack * 3 + 1, stack * 3 + 2]));
  return rows.map((row) => cols.map((col) => digits[base[row][col] - 1]));
}

type Candidate = { id: string; difficulty: "calm" | "standard" | "dense"; solution: SudokuGrid; givens: SudokuGrid; clueCount: number };
const configs: { id: string; difficulty: Candidate["difficulty"]; clues: number }[] = [
  { id: "sudoku-apollo", difficulty: "calm", clues: 20 }, { id: "sudoku-borealis", difficulty: "calm", clues: 19 }, { id: "sudoku-celeste", difficulty: "standard", clues: 17 }, { id: "sudoku-drift", difficulty: "standard", clues: 16 }, { id: "sudoku-equinox", difficulty: "standard", clues: 16 }, { id: "sudoku-fathom", difficulty: "dense", clues: 14 }, { id: "sudoku-galileo", difficulty: "dense", clues: 13 },
];
const usedSolutions = new Set<string>(); const usedMasks = new Set<string>(); const candidates: Candidate[] = [];
for (const config of configs) {
  let chosen: Candidate | null = null;
  for (let attempt = 0; attempt < 300 && !chosen; attempt += 1) {
    const solution = makeSolution(); const solutionSignature = solution.flat().join(""); if (usedSolutions.has(solutionSignature)) continue;
    const givens = clone(solution); let remaining = 36;
    for (const cell of shuffle(Array.from({ length: 36 }, (_, index) => index))) { if (remaining <= config.clues) break; const row = Math.floor(cell / 6); const col = cell % 6; const saved = givens[row][col]; givens[row][col] = 0; if (countSudokuSolutions(givens) === 1) remaining -= 1; else givens[row][col] = saved; }
    const maskSignature = givens.flat().map((value) => value ? "1" : "0").join(""); if (remaining === config.clues && !usedMasks.has(maskSignature) && countSudokuSolutions(givens) === 1) { chosen = { ...config, solution, givens, clueCount: remaining }; usedSolutions.add(solutionSignature); usedMasks.add(maskSignature); }
  }
  if (!chosen) throw new Error(`Could not author unique ${config.id} at ${config.clues} clues.`); candidates.push(chosen);
}
console.log(JSON.stringify(candidates, null, 2));
