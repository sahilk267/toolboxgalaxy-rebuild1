import { countQueensSolutionsFor, queensSolution } from "../client/src/game/logicPuzzles/queens";

const size = 6;
let state = 0x9e3779b9;
const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 0x100000000; };
const key = (row: number, col: number) => `${row}:${col}`;
const adjacent = (row: number, col: number) => [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size);

for (let attempt = 0; attempt < 100000; attempt += 1) {
  const map = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  const assigned = new Set<string>();
  queensSolution.forEach((col, row) => { map[row][col] = row; assigned.add(key(row, col)); });
  while (assigned.size < size * size) {
    const frontier: Array<[number, number, number]> = [];
    for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) if (map[row][col] >= 0) adjacent(row, col).forEach(([nextRow, nextCol]) => { if (!assigned.has(key(nextRow, nextCol))) frontier.push([nextRow, nextCol, map[row][col]]); });
    const [row, col, region] = frontier[Math.floor(random() * frontier.length)];
    map[row][col] = region; assigned.add(key(row, col));
  }
  if (countQueensSolutionsFor(map) === 1) { console.log(JSON.stringify(map)); process.exit(0); }
}
throw new Error("No unique deterministic region map found");
