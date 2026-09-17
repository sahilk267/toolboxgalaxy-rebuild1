// Logic Lab / Mini Sudoku: 6×6 all-different solver for rows, columns, and 2×3 regions.
import { cloneGrid } from "@/game/logicPuzzles/core";
import { miniSudokuEditionBank } from "@/game/logicPuzzles/miniSudokuBank";

export const MINI_SUDOKU_SIZE = 6;
export type SudokuGrid = number[][];
export { miniSudokuEditionBank, miniSudokuEditionForDate } from "@/game/logicPuzzles/miniSudokuBank";
export const miniSudokuSolution: SudokuGrid = miniSudokuEditionBank[0].solution;
export const miniSudokuGivens: SudokuGrid = miniSudokuEditionBank[0].givens;

export function boxIndex(row: number, col: number) { return Math.floor(row / 2) * 2 + Math.floor(col / 3); }
export function validSudokuPlacement(grid: SudokuGrid, row: number, col: number, value: number) { if (value < 1 || value > 6) return false; for (let index = 0; index < MINI_SUDOKU_SIZE; index += 1) { if (index !== col && grid[row][index] === value) return false; if (index !== row && grid[index][col] === value) return false; } const boxRow = Math.floor(row / 2) * 2; const boxCol = Math.floor(col / 3) * 3; for (let r = boxRow; r < boxRow + 2; r += 1) for (let c = boxCol; c < boxCol + 3; c += 1) if ((r !== row || c !== col) && grid[r][c] === value) return false; return true; }
export function sudokuConflicts(grid: SudokuGrid) { const conflicts = new Set<string>(); for (let row = 0; row < 6; row += 1) for (let col = 0; col < 6; col += 1) { const value = grid[row][col]; if (value && !validSudokuPlacement(grid, row, col, value)) conflicts.add(`${row}:${col}`); } return conflicts; }
export function solvedSudoku(grid: SudokuGrid) { return grid.every((row) => row.every((value) => value > 0)) && sudokuConflicts(grid).size === 0; }
export function countSudokuSolutions(seed: SudokuGrid, limit = 2) { const grid = cloneGrid(seed); let count = 0; const search = (): void => { if (count >= limit) return; let target: [number, number] | null = null; let choices: number[] = []; for (let row = 0; row < 6; row += 1) for (let col = 0; col < 6; col += 1) if (grid[row][col] === 0) { const nextChoices = [1, 2, 3, 4, 5, 6].filter((value) => validSudokuPlacement(grid, row, col, value)); if (!target || nextChoices.length < choices.length) { target = [row, col]; choices = nextChoices; } } if (!target) { count += 1; return; } const [row, col] = target; for (const value of choices) { grid[row][col] = value; search(); grid[row][col] = 0; } }; search(); return count; }
