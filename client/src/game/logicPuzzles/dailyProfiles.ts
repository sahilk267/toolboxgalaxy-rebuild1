// Logic Lab / Daily Field: authored Mini Sudoku clue-density profiles, each independently checked for one completion.
import type { SudokuGrid } from "@/game/logicPuzzles/miniSudoku";
import type { LogicDifficulty } from "@/game/logicPuzzles/daily";

export const miniSudokuProfiles: Record<LogicDifficulty, SudokuGrid> = {
  calm: [[1, 0, 3, 4, 0, 6], [0, 5, 6, 0, 2, 3], [2, 3, 0, 5, 6, 0], [5, 0, 1, 2, 0, 4], [3, 4, 0, 6, 1, 0], [0, 1, 2, 0, 4, 5]],
  standard: [[1, 0, 3, 4, 0, 6], [0, 5, 6, 0, 2, 3], [2, 3, 0, 5, 6, 0], [5, 0, 1, 2, 0, 4], [3, 4, 0, 6, 0, 0], [0, 0, 2, 0, 0, 0]],
  dense: [[1, 0, 3, 4, 0, 6], [0, 5, 6, 0, 2, 3], [2, 3, 0, 5, 6, 0], [0, 0, 1, 0, 0, 0], [3, 4, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0]],
};
