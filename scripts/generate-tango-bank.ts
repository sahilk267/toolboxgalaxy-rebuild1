// Deterministic authoring tool. It writes review candidates only after the local Tango solver proves a unique completion.
import { countTangoSolutions, solvedTango, type TangoGrid, type TangoRelation } from "../client/src/game/logicPuzzles/tango";

let state = 0x5a17c0de;
const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0xffffffff; };
const shuffle = <T,>(items: T[]) => [...items].sort(() => random() - .5);
const validLine = (line: (0 | 1)[]) => line.filter((value) => value === 0).length === 3 && line.filter((value) => value === 1).length === 3 && !line.some((value, index) => index < 4 && value === line[index + 1] && value === line[index + 2]);
const allRows: (0 | 1)[][] = Array.from({ length: 64 }, (_, number) => Array.from({ length: 6 }, (_, bit) => ((number >> bit) & 1) as 0 | 1)).filter(validLine);
const cell = (index: number) => ({ row: Math.floor(index / 6), col: index % 6 });
const edgeKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
const partialGridValid = (grid: TangoGrid) => Array.from({ length: 6 }, (_, col) => grid.map((row) => row[col])).every((line) => { const zeros = line.filter((value) => value === 0).length; const ones = line.filter((value) => value === 1).length; return zeros <= 3 && ones <= 3 && !line.some((value, index) => index < line.length - 2 && value === line[index + 1] && value === line[index + 2]); });

function makeSolution(): TangoGrid | null {
  const grid: TangoGrid = [];
  const search = (): boolean => {
    if (grid.length === 6) return solvedTango(grid, []);
    for (const row of shuffle(allRows)) {
      const candidate = [...grid, row];
      if (!partialGridValid(candidate)) continue;
      grid.push(row); if (search()) return true; grid.pop();
    }
    return false;
  };
  return search() ? grid.map((row) => [...row]) : null;
}

function relationsFor(solution: TangoGrid, total: number) {
  const edges: [number, number][] = [];
  for (let row = 0; row < 6; row += 1) for (let col = 0; col < 6; col += 1) { const index = row * 6 + col; if (col < 5) edges.push([index, index + 1]); if (row < 5) edges.push([index, index + 6]); }
  return shuffle(edges).slice(0, total).map(([a, b]): TangoRelation => ({ a: cell(a), b: cell(b), relation: solution[Math.floor(a / 6)][a % 6] === solution[Math.floor(b / 6)][b % 6] ? "same" : "different" }));
}

type Candidate = { id: string; difficulty: "calm" | "standard" | "dense"; solution: TangoGrid; givens: TangoGrid; relations: TangoRelation[]; clueCount: number };
const configs: { id: string; difficulty: Candidate["difficulty"]; givens: number; relations: number }[] = [
  { id: "tango-apollo", difficulty: "calm", givens: 12, relations: 18 }, { id: "tango-borealis", difficulty: "calm", givens: 11, relations: 18 }, { id: "tango-celeste", difficulty: "standard", givens: 9, relations: 16 }, { id: "tango-drift", difficulty: "standard", givens: 8, relations: 16 }, { id: "tango-equinox", difficulty: "standard", givens: 8, relations: 15 }, { id: "tango-fathom", difficulty: "dense", givens: 6, relations: 14 }, { id: "tango-galileo", difficulty: "dense", givens: 5, relations: 14 },
];
const solutionKeys = new Set<string>(); const relationKeys = new Set<string>(); const maskKeys = new Set<string>(); const candidates: Candidate[] = [];
for (const config of configs) {
  let chosen: Candidate | null = null;
  for (let attempt = 0; attempt < 600 && !chosen; attempt += 1) {
    const solution = makeSolution(); if (!solution) throw new Error("No Tango solution could be generated."); const solutionKey = solution.flat().join(""); if (solutionKeys.has(solutionKey)) continue;
    const relations = relationsFor(solution, config.relations); const relationKey = relations.map((relation) => `${edgeKey(relation.a.row * 6 + relation.a.col, relation.b.row * 6 + relation.b.col)}:${relation.relation}`).sort().join("|"); if (relationKeys.has(relationKey)) continue;
    const givens = solution.map((row) => [...row] as (0 | 1 | null)[]); let remaining = 36;
    for (const index of shuffle(Array.from({ length: 36 }, (_, value) => value))) { if (remaining <= config.givens) break; const row = Math.floor(index / 6); const col = index % 6; const saved = givens[row][col]; givens[row][col] = null; if (countTangoSolutions(givens, 2, relations) === 1) remaining -= 1; else givens[row][col] = saved; }
    const maskKey = givens.flat().map((value) => value === null ? "0" : "1").join(""); if (remaining === config.givens && !maskKeys.has(maskKey) && countTangoSolutions(givens, 2, relations) === 1) { chosen = { ...config, solution, givens, relations, clueCount: remaining }; solutionKeys.add(solutionKey); relationKeys.add(relationKey); maskKeys.add(maskKey); }
  }
  if (!chosen) throw new Error(`Could not find a unique ${config.id} candidate.`); candidates.push(chosen);
}
console.log(JSON.stringify(candidates, null, 2));
