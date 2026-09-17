// Logic Lab / Tango: binary-grid validation for balance, no triples, and same/different adjacency relations.
import type { Cell } from "@/game/logicPuzzles/core";
import { tangoEditionBank } from "@/game/logicPuzzles/tangoBank";

export type TangoValue = 0 | 1 | null;
export type TangoGrid = TangoValue[][];
export type TangoRelation = { a: Cell; b: Cell; relation: "same" | "different" };
export { tangoEditionBank, tangoEditionForDate } from "@/game/logicPuzzles/tangoBank";
export const tangoSolution: TangoGrid = tangoEditionBank[0].solution;
export const tangoGivens: TangoGrid = tangoEditionBank[0].givens;
export const tangoRelations: TangoRelation[] = tangoEditionBank[0].relations;

const lineInvalid = (line: TangoValue[]) => { const known = line.filter((value): value is 0 | 1 => value !== null); if (known.filter((value) => value === 0).length > 3 || known.filter((value) => value === 1).length > 3) return true; for (let index = 0; index < 4; index += 1) if (line[index] !== null && line[index] === line[index + 1] && line[index] === line[index + 2]) return true; return false; };
export function tangoViolations(grid: TangoGrid, relations: TangoRelation[] = tangoRelations) { const invalid = new Set<string>(); for (let row = 0; row < 6; row += 1) if (lineInvalid(grid[row])) for (let col = 0; col < 6; col += 1) invalid.add(`${row}:${col}`); for (let col = 0; col < 6; col += 1) { const line = grid.map((row) => row[col]); if (lineInvalid(line)) for (let row = 0; row < 6; row += 1) invalid.add(`${row}:${col}`); } relations.forEach(({ a, b, relation }) => { const av = grid[a.row][a.col]; const bv = grid[b.row][b.col]; if (av !== null && bv !== null && ((relation === "same" && av !== bv) || (relation === "different" && av === bv))) { invalid.add(`${a.row}:${a.col}`); invalid.add(`${b.row}:${b.col}`); } }); return invalid; }
export function solvedTango(grid: TangoGrid, relations: TangoRelation[] = tangoRelations) { return grid.every((row) => row.every((value) => value !== null)) && tangoViolations(grid, relations).size === 0; }
export function countTangoSolutions(seed: TangoGrid, limit = 2, relations: TangoRelation[] = tangoRelations) { const grid = seed.map((row) => [...row]); let count = 0; const search = (): void => { if (count >= limit) return; let target: [number, number] | null = null; for (let row = 0; row < 6 && !target; row += 1) for (let col = 0; col < 6; col += 1) if (grid[row][col] === null) { target = [row, col]; break; } if (!target) { if (solvedTango(grid, relations)) count += 1; return; } const [row, col] = target; for (const value of [0, 1] as const) { grid[row][col] = value; if (tangoViolations(grid, relations).size === 0) search(); grid[row][col] = null; } }; search(); return count; }
