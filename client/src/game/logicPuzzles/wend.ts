// Logic Lab / Wend: selected target-word paths form an authored orthogonal exact cover; no remote dictionary is required.
import type { Cell } from "@/game/logicPuzzles/core";
import { keyOf, orthogonal, sameCell } from "@/game/logicPuzzles/core";
import { wendEditionBank } from "@/game/logicPuzzles/wendBank";

export type WendGrid = string[][];
export type WendWord = { word: string; path: Cell[] };
export const wendGrid = wendEditionBank[0].grid;
export const wendWords = wendEditionBank[0].words;
const sizeOf = (grid: WendGrid) => grid.length;
const inBounds = (cell: Cell, grid: WendGrid) => cell.row >= 0 && cell.row < sizeOf(grid) && cell.col >= 0 && cell.col < sizeOf(grid);
const neighboring = (cell: Cell, grid: WendGrid) => [{ row: cell.row - 1, col: cell.col }, { row: cell.row + 1, col: cell.col }, { row: cell.row, col: cell.col - 1 }, { row: cell.row, col: cell.col + 1 }].filter((next) => inBounds(next, grid));

export const wordFromPath = (path: Cell[], grid: WendGrid = wendGrid) => path.map((cell) => grid[cell.row]?.[cell.col] || "").join("");
export function validWendPath(path: Cell[], grid: WendGrid = wendGrid) { return path.length > 0 && path.every((cell, index) => inBounds(cell, grid) && !path.slice(0, index).some((previous) => sameCell(previous, cell)) && (index === 0 || orthogonal(path[index - 1], cell))); }
export function matchesWendWord(path: Cell[], word: WendWord, grid: WendGrid = wendGrid) { return wordFromPath(path, grid) === word.word && path.length === word.path.length && path.every((cell, index) => sameCell(cell, word.path[index])); }
export function solvedWend(found: WendWord[], targets: WendWord[] = wendWords) { if (found.length !== targets.length || new Set(found.map((word) => word.word)).size !== targets.length) return false; const cells = found.flatMap((word) => word.path).map(keyOf); return new Set(cells).size === 25 && cells.length === 25; }
const pathsForWord = (word: string, grid: WendGrid) => { const paths: Cell[][] = []; const visit = (path: Cell[]) => { const cursor = path[path.length - 1]; if (path.length === word.length) { paths.push(path); return; } neighboring(cursor, grid).forEach((next) => { if (!path.some((cell) => sameCell(cell, next)) && grid[next.row][next.col] === word[path.length]) visit([...path, next]); }); }; grid.forEach((line, row) => line.forEach((letter, col) => { if (letter === word[0]) visit([{ row, col }]); })); return paths; };
export function countWendSolutions(targets: WendWord[], grid: WendGrid, limit = 2) { const options = targets.map((target) => pathsForWord(target.word, grid)).sort((a, b) => a.length - b.length); let count = 0; const visit = (index: number, used: Set<string>) => { if (count >= limit) return; if (index === options.length) { if (used.size === 25) count += 1; return; } options[index].forEach((path) => { if (path.some((cell) => used.has(keyOf(cell)))) return; const next = new Set(used); path.forEach((cell) => next.add(keyOf(cell))); visit(index + 1, next); }); }; visit(0, new Set()); return count; }
export { wendEditionBank, wendEditionById, wendEditionForDate } from "@/game/logicPuzzles/wendBank";
