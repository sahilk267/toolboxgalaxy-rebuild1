export interface NonogramEdition {
  id: string;
  title: string;
  theme: string;
  symbol: string;
  size: number;
  solution: number[][]; // 1 = filled, 0 = empty
  rowClues: number[][];
  colClues: number[][];
  hint: string;
}

function calculateClues(matrix: number[][]) {
  const size = matrix.length;
  const rowClues: number[][] = [];
  const colClues: number[][] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    const clues: number[] = [];
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    rowClues.push(clues.length > 0 ? clues : [0]);
  }

  // Cols
  for (let c = 0; c < size; c++) {
    const clues: number[] = [];
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (matrix[r][c] === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    colClues.push(clues.length > 0 ? clues : [0]);
  }

  return { rowClues, colClues };
}

const RAW_EDITIONS = [
  {
    id: "nonogram-heart",
    title: "Radiant Heart",
    theme: "Love & Empathy",
    symbol: "❤️",
    size: 5,
    solution: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0]
    ],
    hint: "Notice the two completely filled rows in the middle ([5])!"
  },
  {
    id: "nonogram-crown",
    title: "Royal Diadem",
    theme: "Regal Splendor",
    symbol: "👑",
    size: 5,
    solution: [
      [1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0]
    ],
    hint: "Row 3 and 4 are full 5-wide spans form the headband of the crown."
  },
  {
    id: "nonogram-star",
    title: "Cosmic Star",
    theme: "Astronomy",
    symbol: "⭐",
    size: 5,
    solution: [
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1]
    ],
    hint: "Row 2 stretches completely across with 5 contiguous blocks."
  },
  {
    id: "nonogram-anchor",
    title: "Mariner's Anchor",
    theme: "Nautical Compass",
    symbol: "⚓",
    size: 5,
    solution: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
      [1, 0, 1, 0, 1],
      [0, 1, 1, 1, 0]
    ],
    hint: "Column 3 is completely filled with 5 blocks from top to bottom."
  },
  {
    id: "nonogram-coffee",
    title: "Morning Espresso",
    theme: "Café Ritual",
    symbol: "☕",
    size: 5,
    solution: [
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 1],
      [0, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1]
    ],
    hint: "The bottom row is the saucer, spanning all 5 cells."
  },
  {
    id: "nonogram-sword",
    title: "Knight's Blade",
    theme: "Valor & Honor",
    symbol: "🗡️",
    size: 5,
    solution: [
      [0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 0, 0, 0],
      [0, 1, 0, 0, 0]
    ],
    hint: "The blade forms an elegant diagonal running from top-right towards bottom-left."
  },
  {
    id: "nonogram-rocket",
    title: "Orbital Shuttle",
    theme: "Space Flight",
    symbol: "🚀",
    size: 5,
    solution: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1]
    ],
    hint: "Row 4 has all 5 thruster wing modules active."
  }
];

export const NONOGRAM_EDITIONS: NonogramEdition[] = RAW_EDITIONS.map((raw) => {
  const { rowClues, colClues } = calculateClues(raw.solution);
  return {
    ...raw,
    rowClues,
    colClues
  };
});

export function getNonogramEditionForDate(dateStr?: string): NonogramEdition {
  if (!dateStr) {
    const d = new Date();
    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % NONOGRAM_EDITIONS.length;
  return NONOGRAM_EDITIONS[index];
}
