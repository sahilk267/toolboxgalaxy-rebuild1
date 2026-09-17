import { writeFileSync } from "node:fs";

type Cell = { row: number; col: number };
type WordPath = { word: string; path: Cell[] };
type Candidate = { id: string; difficulty: "calm" | "standard" | "dense"; grid: string[][]; words: WordPath[]; topology: string; canonicalTopology: string; candidatePaths: number; solverNodes: number };
const size = 5;
const editions = [
  { id: "wend-apollo", difficulty: "calm" as const, words: ["TANGO", "SUDOKU", "PUZZLES", "GRID", "ZIP"] },
  { id: "wend-borealis", difficulty: "calm" as const, words: ["ORBIT", "SIGNAL", "ROUTE", "FIELD", "NODE"] },
  { id: "wend-cascade", difficulty: "standard" as const, words: ["SOLVE", "PUZZLE", "TRACE", "LOCAL", "GRID"] },
  { id: "wend-delta", difficulty: "standard" as const, words: ["TANGO", "SUDOKU", "QUEENS", "PATCH", "ARC"] },
  { id: "wend-equinox", difficulty: "standard" as const, words: ["PLANET", "ROCKET", "COMET", "STAR", "MOON"] },
  { id: "wend-fathom", difficulty: "dense" as const, words: ["VERIFY", "SCRIPT", "BUILD", "TEST", "SAFE"] },
  { id: "wend-galileo", difficulty: "dense" as const, words: ["GALAXY", "WORKBENCH", "TOOL", "PLAY", "GO"] },
];
const transforms = [
  (r: number, c: number): Cell => ({ row: r, col: c }), (r: number, c: number): Cell => ({ row: c, col: 4 - r }),
  (r: number, c: number): Cell => ({ row: 4 - r, col: 4 - c }), (r: number, c: number): Cell => ({ row: 4 - c, col: r }),
  (r: number, c: number): Cell => ({ row: r, col: 4 - c }), (r: number, c: number): Cell => ({ row: 4 - r, col: c }),
  (r: number, c: number): Cell => ({ row: c, col: r }), (r: number, c: number): Cell => ({ row: 4 - c, col: 4 - r }),
];
const key = (cell: Cell) => `${cell.row}:${cell.col}`;
const adjacent = (cell: Cell) => [[cell.row - 1, cell.col], [cell.row + 1, cell.col], [cell.row, cell.col - 1], [cell.row, cell.col + 1]].filter(([row, col]) => row >= 0 && row < size && col >= 0 && col < size).map(([row, col]) => ({ row, col }));
const seeded = (seed: number) => { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 2 ** 32; }; };
const shuffled = <T>(items: T[], random: () => number) => [...items].sort(() => random() - .5);

function hamiltonian(seed: number) {
  const random = seeded(seed); let nodes = 0;
  const start = { row: Math.floor(random() * size), col: Math.floor(random() * size) }; const path = [start]; const used = new Set([key(start)]);
  const visit = (): boolean => { nodes += 1; if (path.length === size * size) return true; const options = shuffled(adjacent(path[path.length - 1]), random).filter((cell) => !used.has(key(cell))).sort((a, b) => adjacent(a).filter((cell) => !used.has(key(cell))).length - adjacent(b).filter((cell) => !used.has(key(cell))).length); for (const cell of options) { path.push(cell); used.add(key(cell)); if (visit()) return true; path.pop(); used.delete(key(cell)); } return false; };
  return visit() ? { path, nodes } : null;
}

function topology(words: WordPath[], transform = transforms[0]) { return words.map((item) => item.path.map((cell) => key(transform(cell.row, cell.col))).join(",")).sort().join("|"); }
function allWordPaths(word: string, grid: string[][]) { const matches: Cell[][] = []; const visit = (path: Cell[]) => { const cursor = path[path.length - 1]; if (path.length === word.length) { matches.push(path); return; } for (const cell of adjacent(cursor)) if (!path.some((item) => key(item) === key(cell)) && grid[cell.row][cell.col] === word[path.length]) visit([...path, cell]); }; grid.forEach((line, row) => line.forEach((letter, col) => { if (letter === word[0]) visit([{ row, col }]); })); return matches; }
function countExactCovers(words: string[], grid: string[][]) { const candidates = words.map((word) => allWordPaths(word, grid)); let nodes = 0; let total = 0; const visit = (index: number, used: Set<string>) => { nodes += 1; if (total > 1) return; if (index === words.length) { if (used.size === 25) total += 1; return; } for (const path of candidates[index]) { if (path.some((cell) => used.has(key(cell)))) continue; const next = new Set(used); path.forEach((cell) => next.add(key(cell))); visit(index + 1, next); } }; visit(0, new Set()); return { total, candidatePaths: candidates.reduce((sum, paths) => sum + paths.length, 0), nodes }; }

const usedCanonical = new Set<string>(); const output: Candidate[] = [];
for (const [editionIndex, edition] of editions.entries()) {
  let selected: Candidate | undefined;
  for (let trial = 1; trial <= 1200 && !selected; trial += 1) { const route = hamiltonian((editionIndex + 17) * 10_000 + trial); if (!route) continue; let cursor = 0; const words: WordPath[] = edition.words.map((word) => { const path = route.path.slice(cursor, cursor + word.length); cursor += word.length; return { word, path }; }); const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => "")); words.forEach((item) => item.path.forEach((cell, index) => { grid[cell.row][cell.col] = item.word[index]; })); const raw = topology(words); const canonical = transforms.map((transform) => topology(words, transform)).sort()[0]; if (usedCanonical.has(canonical)) continue; const solution = countExactCovers(edition.words, grid); if (solution.total !== 1) continue; selected = { id: edition.id, difficulty: edition.difficulty, grid, words, topology: raw, canonicalTopology: canonical, candidatePaths: solution.candidatePaths, solverNodes: solution.nodes + route.nodes }; }
  if (!selected) throw new Error(`Could not generate unique Wend edition ${edition.id}.`); usedCanonical.add(selected.canonicalTopology); output.push(selected);
}
writeFileSync("/home/ubuntu/wend-bank-candidates.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated ${output.length} unique Wend editions.`);
