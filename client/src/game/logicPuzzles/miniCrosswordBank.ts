// Toolbox Galaxy: Curated 5x5 Mini Crossword Daily Editions
export interface CrosswordClue {
  num: number;
  dir: "A" | "D"; // Across | Down
  clue: string;
  row: number;
  col: number;
  length: number;
  answer: string;
}

export interface MiniCrosswordEdition {
  id: string;
  date: string;
  title: string;
  grid: string[][]; // 5x5, '#' for black cell, letter for solution
  clues: CrosswordClue[];
}

export const MINI_CROSSWORD_BANK: MiniCrosswordEdition[] = [
  {
    id: "mini-cross-001",
    date: "2026-09-02",
    title: "Cosmic Spark",
    grid: [
      ["S", "P", "A", "R", "K"],
      ["O", "L", "I", "V", "E"],
      ["L", "A", "R", "G", "E"],
      ["A", "N", "G", "L", "E"],
      ["R", "E", "O", "P", "T"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Ignition trigger or small fiery particle", row: 0, col: 0, length: 5, answer: "SPARK" },
      { num: 6, dir: "A", clue: "Martini garnish or shade of green", row: 1, col: 0, length: 5, answer: "OLIVE" },
      { num: 7, dir: "A", clue: "Opposite of small", row: 2, col: 0, length: 5, answer: "LARGE" },
      { num: 8, dir: "A", clue: "Corner geometry measurement (e.g. 90°)", row: 3, col: 0, length: 5, answer: "ANGLE" },
      { num: 9, dir: "A", clue: "Choose again (as in an option)", row: 4, col: 0, length: 5, answer: "REOPT" },
      // Down
      { num: 1, dir: "D", clue: "Powered by the sun", row: 0, col: 0, length: 5, answer: "SOLAR" },
      { num: 2, dir: "D", clue: "Airplane or flat surface", row: 0, col: 1, length: 5, answer: "PLANE" },
      { num: 3, dir: "D", clue: "Atmosphere we breathe", row: 0, col: 2, length: 5, answer: "AIRGO" },
      { num: 4, dir: "D", clue: "Sound of a fast car engine", row: 0, col: 3, length: 5, answer: "RVGLP" },
      { num: 5, dir: "D", clue: "Things that fit into door locks", row: 0, col: 4, length: 5, answer: "KEEET" }
    ]
  },
  {
    id: "mini-cross-002",
    date: "2026-09-03",
    title: "Morning Brew",
    grid: [
      ["M", "O", "C", "H", "A"],
      ["A", "P", "R", "O", "N"],
      ["P", "A", "U", "S", "E"],
      ["L", "L", "A", "M", "A"],
      ["E", "S", "T", "E", "R"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Chocolatey coffee drink", row: 0, col: 0, length: 5, answer: "MOCHA" },
      { num: 6, dir: "A", clue: "Kitchen garment tied around the waist", row: 1, col: 0, length: 5, answer: "APRON" },
      { num: 7, dir: "A", clue: "Temporary halt in video playback", row: 2, col: 0, length: 5, answer: "PAUSE" },
      { num: 8, dir: "A", clue: "Woolly Andean pack animal", row: 3, col: 0, length: 5, answer: "LLAMA" },
      { num: 9, dir: "A", clue: "Sweet-smelling organic compound", row: 4, col: 0, length: 5, answer: "ESTER" },
      // Down
      { num: 1, dir: "D", clue: "Canadian flag leaf tree", row: 0, col: 0, length: 5, answer: "MAPLE" },
      { num: 2, dir: "D", clue: "Gem that creates iridescent rainbows", row: 0, col: 1, length: 5, answer: "OPALS" },
      { num: 3, dir: "D", clue: "Raw or unrefined state", row: 0, col: 2, length: 5, answer: "CRUST" },
      { num: 4, dir: "D", clue: "House or dwelling place", row: 0, col: 3, length: 5, answer: "HOSME" },
      { num: 5, dir: "D", clue: "One who is near or adjacent", row: 0, col: 4, length: 5, answer: "ANEAR" }
    ]
  },
  {
    id: "mini-cross-003",
    date: "2026-09-04",
    title: "Digital Wave",
    grid: [
      ["C", "H", "E", "S", "S"],
      ["L", "O", "G", "I", "C"],
      ["O", "U", "O", "T", "E"],
      ["U", "S", "E", "R", "S"],
      ["D", "E", "S", "K", "S"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Game played with kings, queens, and knights", row: 0, col: 0, length: 5, answer: "CHESS" },
      { num: 6, dir: "A", clue: "Reasoning conducted according to strict principles", row: 1, col: 0, length: 5, answer: "LOGIC" },
      { num: 7, dir: "A", clue: "Repeat speech with quotation marks", row: 2, col: 0, length: 5, answer: "OUOTE" },
      { num: 8, dir: "A", clue: "People interacting with software", row: 3, col: 0, length: 5, answer: "USERS" },
      { num: 9, dir: "A", clue: "Office furniture for keyboards and monitors", row: 4, col: 0, length: 5, answer: "DESKS" },
      // Down
      { num: 1, dir: "D", clue: "Fluffy sky shape or remote server network", row: 0, col: 0, length: 5, answer: "CLOUD" },
      { num: 2, dir: "D", clue: "Residence or home sweet home", row: 0, col: 1, length: 5, answer: "HOUSE" },
      { num: 3, dir: "D", clue: "Self-worth or conscious thinking subject", row: 0, col: 2, length: 5, answer: "EGOES" },
      { num: 4, dir: "D", clue: "Baby's rattle or stork visitor", row: 0, col: 3, length: 5, answer: "SITRK" },
      { num: 5, dir: "D", clue: "Winter sports sliding on snow", row: 0, col: 4, length: 5, answer: "SCESS" }
    ]
  }
];

export function miniCrosswordEditionForDate(dateStr: string): MiniCrosswordEdition {
  const match = MINI_CROSSWORD_BANK.find((e) => e.date === dateStr);
  if (match) return match;

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const index = hash % MINI_CROSSWORD_BANK.length;
  return {
    ...MINI_CROSSWORD_BANK[index],
    date: dateStr,
    id: `mini-cross-${dateStr}`,
  };
}
