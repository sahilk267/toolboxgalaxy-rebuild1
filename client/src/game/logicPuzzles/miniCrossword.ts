// Helper routines for Mini Crossword
import { MiniCrosswordEdition } from "./miniCrosswordBank";

export function isCrosswordSolved(grid: string[][], edition: MiniCrosswordEdition): boolean {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const target = edition.grid[r][c].toUpperCase();
      const current = (grid[r]?.[c] || "").toUpperCase();
      if (target !== "#" && current !== target) {
        return false;
      }
    }
  }
  return true;
}

export function getClueNumberAt(row: number, col: number, edition: MiniCrosswordEdition): number | null {
  const match = edition.clues.find((c) => c.row === row && c.col === col);
  return match ? match.num : null;
}
