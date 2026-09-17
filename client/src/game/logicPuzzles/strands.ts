// Orbital Workbench: Strands (Theme Threads) core logic and path validation.
export interface CellCoord {
  row: number;
  col: number;
}

export interface StrandsWord {
  word: string;
  path: CellCoord[];
  isSpangram?: boolean;
}

export interface StrandsEdition {
  id: string;
  theme: string;
  themeClue: string;
  spangram: string;
  spangramWord?: StrandsWord;
  grid: string[][]; // 8 rows x 6 cols (48 letters)
  themeWords: StrandsWord[];
  bonusWords: string[]; // Valid non-theme words present in the grid for hint meter
}

export const STRANDS_ROWS = 8;
export const STRANDS_COLS = 6;

export const cellKey = (c: CellCoord) => `${c.row},${c.col}`;

export function isAdjacent(a: CellCoord, b: CellCoord): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

export function isValidPath(path: CellCoord[]): boolean {
  if (path.length === 0) return false;
  const seen = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const k = cellKey(path[i]);
    if (seen.has(k)) return false;
    seen.add(k);
    if (i > 0 && !isAdjacent(path[i - 1], path[i])) {
      return false;
    }
  }
  return true;
}

export function touchesOppositeEdges(path: CellCoord[], rows = STRANDS_ROWS, cols = STRANDS_COLS): boolean {
  if (path.length < 2) return false;
  const touchTop = path.some(c => c.row === 0);
  const touchBottom = path.some(c => c.row === rows - 1);
  if (touchTop && touchBottom) return true;

  const touchLeft = path.some(c => c.col === 0);
  const touchRight = path.some(c => c.col === cols - 1);
  return touchLeft && touchRight;
}

export function getWordFromPath(grid: string[][], path: CellCoord[]): string {
  return path.map(c => grid[c.row]?.[c.col] ?? "").join("").toUpperCase();
}
