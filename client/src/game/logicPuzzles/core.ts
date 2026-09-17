// Logic Lab core: pure grid primitives shared by browser-local validators; no React, audio, or storage ownership lives here.
export type Cell = { row: number; col: number };
export const keyOf = ({ row, col }: Cell) => `${row}:${col}`;
export const sameCell = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col;
export const orthogonal = (a: Cell, b: Cell) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
export const inBounds = (cell: Cell, rows: number, cols: number) => cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols;
export const neighbors = (cell: Cell, rows: number, cols: number) => [{ row: cell.row - 1, col: cell.col }, { row: cell.row + 1, col: cell.col }, { row: cell.row, col: cell.col - 1 }, { row: cell.row, col: cell.col + 1 }].filter((next) => inBounds(next, rows, cols));
export const cloneGrid = <T,>(grid: T[][]) => grid.map((row) => [...row]);
