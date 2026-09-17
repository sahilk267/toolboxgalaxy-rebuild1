// Orbital Workbench / Mini Sudoku bank: seven independently solver-verified 6×6 fields. Every edition has its own solution grid and clue arrangement.
import type { SudokuGrid } from "@/game/logicPuzzles/miniSudoku";
export type SudokuDifficulty = "calm" | "standard" | "dense";
export type MiniSudokuEdition = { id: string; difficulty: SudokuDifficulty; solution: SudokuGrid; givens: SudokuGrid; clueCount: number };
const edition = (id: string, difficulty: SudokuDifficulty, solution: SudokuGrid, givens: SudokuGrid): MiniSudokuEdition => ({ id, difficulty, solution, givens, clueCount: givens.flat().filter(Boolean).length });
export const miniSudokuEditionBank: MiniSudokuEdition[] = [
  edition("sudoku-apollo", "calm", [[6,3,4,1,5,2],[1,5,2,6,3,4],[4,1,5,2,6,3],[2,6,3,4,1,5],[5,2,6,3,4,1],[3,4,1,5,2,6]], [[0,0,0,1,5,2],[1,5,2,6,0,4],[0,1,0,0,6,0],[2,6,3,4,0,0],[5,0,6,0,4,1],[0,0,1,0,2,0]]),
  edition("sudoku-borealis", "calm", [[6,5,4,3,2,1],[3,2,1,6,5,4],[4,3,2,1,6,5],[1,6,5,4,3,2],[2,1,6,5,4,3],[5,4,3,2,1,6]], [[6,0,0,0,2,0],[0,2,1,0,0,0],[4,3,2,0,0,5],[0,0,5,4,0,2],[0,1,6,0,4,3],[5,4,3,0,0,6]]),
  edition("sudoku-celeste", "standard", [[1,4,3,2,6,5],[5,6,2,3,4,1],[6,2,1,5,3,4],[4,3,5,1,2,6],[2,1,4,6,5,3],[3,5,6,4,1,2]], [[0,0,3,0,6,0],[5,0,2,0,4,0],[0,0,0,5,0,0],[0,3,5,1,2,6],[2,0,0,6,5,3],[0,0,0,4,0,2]]),
  edition("sudoku-drift", "standard", [[2,3,1,5,4,6],[5,4,6,2,3,1],[4,6,2,3,1,5],[3,1,5,4,6,2],[1,5,4,6,2,3],[6,2,3,1,5,4]], [[2,0,1,0,0,6],[5,0,6,0,3,0],[4,0,0,3,1,5],[3,1,0,0,0,0],[0,5,0,0,0,3],[0,0,0,1,5,0]]),
  edition("sudoku-equinox", "standard", [[4,3,2,5,6,1],[5,1,6,4,2,3],[3,6,5,1,4,2],[1,2,4,3,5,6],[2,5,3,6,1,4],[6,4,1,2,3,5]], [[0,3,2,0,6,1],[5,1,0,0,2,0],[0,6,0,1,0,0],[1,0,4,3,5,0],[0,0,0,0,0,4],[0,0,0,2,3,0]]),
  edition("sudoku-fathom", "dense", [[4,6,3,2,5,1],[2,1,5,4,3,6],[3,2,1,5,6,4],[5,4,6,3,1,2],[6,3,2,1,4,5],[1,5,4,6,2,3]], [[4,0,0,0,0,0],[0,1,5,0,0,0],[0,0,1,5,0,4],[0,4,0,3,0,0],[6,0,0,0,0,5],[0,5,4,6,0,3]]),
  edition("sudoku-galileo", "dense", [[3,2,6,5,4,1],[5,4,1,3,2,6],[6,5,4,1,3,2],[1,3,2,6,5,4],[4,1,3,2,6,5],[2,6,5,4,1,3]], [[3,0,0,0,4,0],[0,0,1,0,0,0],[0,5,0,1,0,2],[1,3,0,0,0,0],[0,0,0,2,6,0],[0,6,0,4,0,3]]),
];
export function miniSudokuEditionForDate(dateId: string) { const [year, month, day] = dateId.split("-").map(Number); const ordinal = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000); return miniSudokuEditionBank[((ordinal % miniSudokuEditionBank.length) + miniSudokuEditionBank.length) % miniSudokuEditionBank.length]; }
