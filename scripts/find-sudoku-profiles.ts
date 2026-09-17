import { cloneGrid } from "../client/src/game/logicPuzzles/core";
import { countSudokuSolutions, miniSudokuGivens } from "../client/src/game/logicPuzzles/miniSudoku";

const active = miniSudokuGivens.flatMap((line, row) => line.map((value, col) => ({ row, col, value })).filter(({ value }) => value > 0));
const profile = (target: number) => { const grid = cloneGrid(miniSudokuGivens); for (const { row, col } of [...active].reverse()) { if (grid.flat().filter(Boolean).length <= target) break; const keep = grid[row][col]; grid[row][col] = 0; if (countSudokuSolutions(grid) !== 1) grid[row][col] = keep; } return grid; };
console.log(JSON.stringify({ calm: profile(24), standard: profile(20), dense: profile(16) }));
