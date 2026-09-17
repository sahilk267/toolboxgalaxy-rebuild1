export interface GameMetadata {
  slug: string;
  name: string;
  detail: string;
  tag?: string;
}

export const GAMES_CATALOG: GameMetadata[] = [
  {
    slug: "strands",
    name: "Strands (Theme Threads)",
    detail: "8×6 word grid · Theme Words & Spangram · Hint meter",
    tag: "NYT #1 NEW SENSATION",
  },
  {
    slug: "the-hive",
    name: "The Hive (Spelling Bee)",
    detail: "7-letter honeycomb word builder · Pangrams & Ranks",
    tag: "NYT VIRAL PHENOMENON",
  },
  {
    slug: "connections",
    name: "Connections",
    detail: "4×4 word association · 4 difficulty tiers",
    tag: "NYT STYLE #1 HIT",
  },
  {
    slug: "orbit-lexicon",
    name: "Wordle (Lexicon)",
    detail: "5-letter daily mystery word · 6 attempts",
    tag: "GLOBAL HIT",
  },
  {
    slug: "queens",
    name: "Queens",
    detail: "region crowns · no touching",
  },
  {
    slug: "mini-sudoku",
    name: "Mini Sudoku",
    detail: "6×6 number field · daily clue density",
  },
  {
    slug: "tango",
    name: "Tango",
    detail: "binary links · visible = / × rules",
  },
  {
    slug: "patches",
    name: "Patches",
    detail: "6×6 rectangle exact cover",
  },
  {
    slug: "zip",
    name: "Zip",
    detail: "5×5 ordered wall path",
  },
  {
    slug: "wend",
    name: "Wend",
    detail: "orthogonal word exact cover",
  },
  {
    slug: "chess-puzzles",
    name: "Chess Puzzles",
    detail: "Tactical positions · best move deduction",
    tag: "MASTERCLASS TACTICS",
  },
  {
    slug: "nonogram",
    name: "Nonogram Griddlers",
    detail: "Picross numerical picture logic",
    tag: "PICROSS PICTURE LOGIC",
  },
  {
    slug: "orbit-dash",
    name: "Orbit Dash",
    detail: "High-speed 3D cyber dodge arcade game built with Babylon.js",
    tag: "3D ARCADE",
  },
  {
    slug: "mini-crossword",
    name: "Mini Crossword",
    detail: "Daily 5×5 speed crossword puzzle across and down",
  },
  {
    slug: "logic-lab",
    name: "Logic Lab",
    detail: "Custom puzzle generator and logic playground",
  },
];
