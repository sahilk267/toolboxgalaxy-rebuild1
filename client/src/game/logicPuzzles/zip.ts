// Orbital Workbench / Zip: validates the selected static 6×6 edition without any remote puzzle feed or unchecked runtime generation.
import type { Cell } from "@/game/logicPuzzles/core";
import { keyOf, orthogonal, sameCell } from "@/game/logicPuzzles/core";
import { zipEditionBank, type ZipBoard, type ZipEdition } from "@/game/logicPuzzles/zipBank";
export type Edge = [Cell, Cell];
export type { ZipBoard, ZipEdition } from "@/game/logicPuzzles/zipBank";
export { zipEditionBank, zipEditionForDate } from "@/game/logicPuzzles/zipBank";
export const zipBoard = zipEditionBank[0].board;
export const zipSolution = zipEditionBank[0].solution;
const blocked = (board: ZipBoard, a: Cell, b: Cell) => board.blockedEdges.some(([left, right]) => sameCell(left, a) && sameCell(right, b) || sameCell(left, b) && sameCell(right, a));
const numberAt = (board: ZipBoard, cell: Cell) => board.numbers.find((item) => sameCell(item.cell, cell))?.value;
export function validZipPath(path: Cell[], board: ZipBoard = zipBoard) {
  if (!path.length || !sameCell(path[0], board.numbers[0].cell)) return false;
  const visited = new Set<string>(); let expected = 1;
  for (let index = 0; index < path.length; index += 1) {
    const cell = path[index];
    if (cell.row < 0 || cell.row >= board.rows || cell.col < 0 || cell.col >= board.cols || visited.has(keyOf(cell))) return false;
    if (index > 0 && (!orthogonal(path[index - 1], cell) || blocked(board, path[index - 1], cell))) return false;
    const label = numberAt(board, cell); if (label !== undefined) { if (label !== expected) return false; expected += 1; }
    visited.add(keyOf(cell));
  }
  return true;
}
export function solvedZip(path: Cell[], board: ZipBoard = zipBoard) { return validZipPath(path, board) && path.length === board.rows * board.cols && board.numbers.every((item) => path.some((cell) => sameCell(cell, item.cell))); }
export function countZipSolutions(board: ZipBoard = zipBoard, limit = 2) {
  let count = 0; const allCells = Array.from({ length: board.rows * board.cols }, (_, index) => ({ row: Math.floor(index / board.cols), col: index % board.cols }));
  const connected = (current: Cell, visited: Set<string>) => {
    const remaining = new Set([keyOf(current), ...allCells.filter((cell) => !visited.has(keyOf(cell))).map(keyOf)]); const reached = new Set<string>(); const stack = [current];
    while (stack.length) { const cell = stack.pop()!; if (reached.has(keyOf(cell))) continue; reached.add(keyOf(cell)); [{ row: cell.row - 1, col: cell.col }, { row: cell.row + 1, col: cell.col }, { row: cell.row, col: cell.col - 1 }, { row: cell.row, col: cell.col + 1 }].filter((next) => next.row >= 0 && next.row < board.rows && next.col >= 0 && next.col < board.cols && !blocked(board, cell, next) && remaining.has(keyOf(next)) && !reached.has(keyOf(next))).forEach((next) => stack.push(next)); }
    return reached.size === remaining.size;
  };
  const search = (path: Cell[]): void => {
    if (count >= limit) return;
    if (path.length === board.rows * board.cols) { if (solvedZip(path, board)) count += 1; return; }
    const last = path[path.length - 1]; const visited = new Set(path.map(keyOf));
    const nexts = [{ row: last.row - 1, col: last.col }, { row: last.row + 1, col: last.col }, { row: last.row, col: last.col - 1 }, { row: last.row, col: last.col + 1 }].filter((next) => next.row >= 0 && next.row < board.rows && next.col >= 0 && next.col < board.cols && !visited.has(keyOf(next)) && !blocked(board, last, next));
    for (const next of nexts) { const nextPath = [...path, next]; if (validZipPath(nextPath, board) && connected(next, new Set(nextPath.map(keyOf)))) search(nextPath); }
  };
  search([board.numbers[0].cell]); return count;
}
