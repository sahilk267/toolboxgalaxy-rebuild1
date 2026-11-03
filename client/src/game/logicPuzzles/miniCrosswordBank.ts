// Toolbox Galaxy: Curated 5x5 Mini Crossword Daily Editions
// Every edition is a verified 5x5 word grid where all across and down entries are legitimate English words
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
  // 1: Cosmic Heart
  {
    id: "mini-cross-001",
    date: "2026-09-02",
    title: "Cosmic Heart",
    grid: [
      ["H", "E", "A", "R", "T"],
      ["E", "M", "B", "E", "R"],
      ["A", "B", "U", "S", "E"],
      ["R", "E", "S", "I", "N"],
      ["T", "R", "E", "N", "D"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Vital muscular organ pumping life throughout the body", row: 0, col: 0, length: 5, answer: "HEART" },
      { num: 6, dir: "A", clue: "Glowing coal remaining in a dying campfire", row: 1, col: 0, length: 5, answer: "EMBER" },
      { num: 7, dir: "A", clue: "Improper treatment or excessive misuse", row: 2, col: 0, length: 5, answer: "ABUSE" },
      { num: 8, dir: "A", clue: "Sticky organic substance secreted by pine trees", row: 3, col: 0, length: 5, answer: "RESIN" },
      { num: 9, dir: "A", clue: "General direction in which things are developing or shifting", row: 4, col: 0, length: 5, answer: "TREND" },
      // Down
      { num: 1, dir: "D", clue: "Symbol of love or core emotional center", row: 0, col: 0, length: 5, answer: "HEART" },
      { num: 2, dir: "D", clue: "Hot fragment smoldering after flames subside", row: 0, col: 1, length: 5, answer: "EMBER" },
      { num: 3, dir: "D", clue: "Treat with cruelty or use corruptly", row: 0, col: 2, length: 5, answer: "ABUSE" },
      { num: 4, dir: "D", clue: "Natural sap used in varnishes, bows, and adhesives", row: 0, col: 3, length: 5, answer: "RESIN" },
      { num: 5, dir: "D", clue: "Prevailing style, viral topic, or statistical pattern", row: 0, col: 4, length: 5, answer: "TREND" }
    ]
  },

  // 2: Fresh Breeze
  {
    id: "mini-cross-002",
    date: "2026-09-03",
    title: "Fresh Breeze",
    grid: [
      ["B", "L", "A", "S", "T"],
      ["L", "U", "N", "C", "H"],
      ["A", "N", "G", "E", "R"],
      ["S", "C", "E", "N", "E"],
      ["T", "H", "R", "E", "E"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Powerful gust of wind or fun party experience", row: 0, col: 0, length: 5, answer: "BLAST" },
      { num: 6, dir: "A", clue: "Midday meal eaten between morning and evening", row: 1, col: 0, length: 5, answer: "LUNCH" },
      { num: 7, dir: "A", clue: "Strong feeling of displeasure, hostility, or wrath", row: 2, col: 0, length: 5, answer: "ANGER" },
      { num: 8, dir: "A", clue: "Distinct dramatic act in a movie, play, or painting", row: 3, col: 0, length: 5, answer: "SCENE" },
      { num: 9, dir: "A", clue: "The count of primary colors or wheels on a tricycle", row: 4, col: 0, length: 5, answer: "THREE" },
      // Down
      { num: 1, dir: "D", clue: "Sudden explosive boom or horn trumpet sound", row: 0, col: 0, length: 5, answer: "BLAST" },
      { num: 2, dir: "D", clue: "Sandwich break or noon meal with colleagues", row: 0, col: 1, length: 5, answer: "LUNCH" },
      { num: 3, dir: "D", clue: "Intense annoyance or indignation", row: 0, col: 2, length: 5, answer: "ANGER" },
      { num: 4, dir: "D", clue: "Backdrop or setting where action unfolds", row: 0, col: 3, length: 5, answer: "SCENE" },
      { num: 5, dir: "D", clue: "Crowd number according to the classic adage", row: 0, col: 4, length: 5, answer: "THREE" }
    ]
  },

  // 3: Safe Harbor
  {
    id: "mini-cross-003",
    date: "2026-09-04",
    title: "Safe Harbor",
    grid: [
      ["C", "H", "A", "S", "E"],
      ["H", "A", "V", "E", "N"],
      ["A", "V", "E", "R", "T"],
      ["S", "E", "R", "V", "E"],
      ["E", "N", "T", "E", "R"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Pursue at high speed to overtake or catch", row: 0, col: 0, length: 5, answer: "CHASE" },
      { num: 6, dir: "A", clue: "Sheltered harbor, sanctuary, or peaceful refuge", row: 1, col: 0, length: 5, answer: "HAVEN" },
      { num: 7, dir: "A", clue: "Turn away eyes or ward off imminent danger", row: 2, col: 0, length: 5, answer: "AVERT" },
      { num: 8, dir: "A", clue: "Present dinner dishes or start a tennis rally", row: 3, col: 0, length: 5, answer: "SERVE" },
      { num: 9, dir: "A", clue: "Step inside a room or tap the Return key", row: 4, col: 0, length: 5, answer: "ENTER" },
      // Down
      { num: 1, dir: "D", clue: "Thrilling vehicle pursuit or playful game of tag", row: 0, col: 0, length: 5, answer: "CHASE" },
      { num: 2, dir: "D", clue: "Protective port for weary sailing vessels", row: 0, col: 1, length: 5, answer: "HAVEN" },
      { num: 3, dir: "D", clue: "Successfully deflect or avoid a catastrophe", row: 0, col: 2, length: 5, answer: "AVERT" },
      { num: 4, dir: "D", clue: "Perform loyal duty or dish out portions", row: 0, col: 3, length: 5, answer: "SERVE" },
      { num: 5, dir: "D", clue: "Gain admission or log into an application", row: 0, col: 4, length: 5, answer: "ENTER" }
    ]
  },

  // 4: Keen Vision
  {
    id: "mini-cross-004",
    date: "2026-09-05",
    title: "Keen Vision",
    grid: [
      ["E", "A", "G", "E", "R"],
      ["A", "L", "I", "V", "E"],
      ["G", "I", "V", "E", "N"],
      ["E", "V", "E", "N", "T"],
      ["R", "E", "N", "T", "S"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Keenly expectant, impatient, or avid to start", row: 0, col: 0, length: 5, answer: "EAGER" },
      { num: 6, dir: "A", clue: "Teeming with vitality and breathing with life", row: 1, col: 0, length: 5, answer: "ALIVE" },
      { num: 7, dir: "A", clue: "Stated as an axiom or presented as a gift", row: 2, col: 0, length: 5, answer: "GIVEN" },
      { num: 8, dir: "A", clue: "Major happening, social gala, or track contest", row: 3, col: 0, length: 5, answer: "EVENT" },
      { num: 9, dir: "A", clue: "Monthly lease fees paid for apartment living", row: 4, col: 0, length: 5, answer: "RENTS" },
      // Down
      { num: 1, dir: "D", clue: "Anticipating excitement like a beaver in folklore", row: 0, col: 0, length: 5, answer: "EAGER" },
      { num: 2, dir: "D", clue: "Opposite of dead or dormant", row: 0, col: 1, length: 5, answer: "ALIVE" },
      { num: 3, dir: "D", clue: "Assumed true for the purpose of an argument", row: 0, col: 2, length: 5, answer: "GIVEN" },
      { num: 4, dir: "D", clue: "Scheduled gathering on a calendar itinerary", row: 0, col: 3, length: 5, answer: "EVENT" },
      { num: 5, dir: "D", clue: "Charges paid by tenants to property landlords", row: 0, col: 4, length: 5, answer: "RENTS" }
    ]
  },

  // 5: New Horizon
  {
    id: "mini-cross-005",
    date: "2026-09-06",
    title: "New Horizon",
    grid: [
      ["A", "L", "T", "E", "R"],
      ["L", "E", "A", "V", "E"],
      ["T", "A", "K", "E", "N"],
      ["E", "V", "E", "N", "T"],
      ["R", "E", "N", "T", "S"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Make changes or adjustments to garments or plans", row: 0, col: 0, length: 5, answer: "ALTER" },
      { num: 6, dir: "A", clue: "Depart from an airport gate or take off on vacation", row: 1, col: 0, length: 5, answer: "LEAVE" },
      { num: 7, dir: "A", clue: "Seized, grabbed, or occupied like a park bench", row: 2, col: 0, length: 5, answer: "TAKEN" },
      { num: 8, dir: "A", clue: "An organized social gathering or milestone occurrence", row: 3, col: 0, length: 5, answer: "EVENT" },
      { num: 9, dir: "A", clue: "Lease payments made for office suites or cars", row: 4, col: 0, length: 5, answer: "RENTS" },
      // Down
      { num: 1, dir: "D", clue: "Modify code parameters or tailor a jacket", row: 0, col: 0, length: 5, answer: "ALTER" },
      { num: 2, dir: "D", clue: "Authorized employee time off or tree foliage", row: 0, col: 1, length: 5, answer: "LEAVE" },
      { num: 3, dir: "D", clue: "No longer available for booking", row: 0, col: 2, length: 5, answer: "TAKEN" },
      { num: 4, dir: "D", clue: "Notable historic incident or sporting match", row: 0, col: 3, length: 5, answer: "EVENT" },
      { num: 5, dir: "D", clue: "Tears in fabric or recurring property rents", row: 0, col: 4, length: 5, answer: "RENTS" }
    ]
  },

  // 6: Earth & Stone
  {
    id: "mini-cross-006",
    date: "2026-09-07",
    title: "Earth & Stone",
    grid: [
      ["L", "E", "A", "S", "T"],
      ["E", "A", "R", "T", "H"],
      ["A", "R", "G", "U", "E"],
      ["S", "T", "U", "F", "F"],
      ["T", "H", "E", "F", "T"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Smallest in degree, magnitude, or proportion", row: 0, col: 0, length: 5, answer: "LEAST" },
      { num: 6, dir: "A", clue: "The blue third rock orbiting our sun", row: 1, col: 0, length: 5, answer: "EARTH" },
      { num: 7, dir: "A", clue: "Debate points with passion in a court of law", row: 2, col: 0, length: 5, answer: "ARGUE" },
      { num: 8, dir: "A", clue: "Pack items into a suitcase or personal belongings", row: 3, col: 0, length: 5, answer: "STUFF" },
      { num: 9, dir: "A", clue: "The unlawful taking of someone else's property", row: 4, col: 0, length: 5, answer: "THEFT" },
      // Down
      { num: 1, dir: "D", clue: "Lowest possible amount or bottom tier", row: 0, col: 0, length: 5, answer: "LEAST" },
      { num: 2, dir: "D", clue: "Rich soil ground underfoot", row: 0, col: 1, length: 5, answer: "EARTH" },
      { num: 3, dir: "D", clue: "Make logical cases or quarrel verbally", row: 0, col: 2, length: 5, answer: "ARGUE" },
      { num: 4, dir: "D", clue: "Cram tightly or miscellaneous household goods", row: 0, col: 3, length: 5, answer: "STUFF" },
      { num: 5, dir: "D", clue: "Robbery or larceny crime", row: 0, col: 4, length: 5, answer: "THEFT" }
    ]
  },

  // 7: Autumn Glow
  {
    id: "mini-cross-007",
    date: "2026-09-08",
    title: "Autumn Glow",
    grid: [
      ["L", "E", "A", "S", "T"],
      ["E", "M", "B", "E", "R"],
      ["A", "B", "O", "V", "E"],
      ["S", "E", "V", "E", "N"],
      ["T", "R", "E", "N", "D"]
    ],
    clues: [
      // Across
      { num: 1, dir: "A", clue: "Minimum quantity, smallest fraction, or lowest rank", row: 0, col: 0, length: 5, answer: "LEAST" },
      { num: 6, dir: "A", clue: "Glowing cinder surviving in dying wood ash", row: 1, col: 0, length: 5, answer: "EMBER" },
      { num: 7, dir: "A", clue: "Higher overhead in the sky or beyond reach", row: 2, col: 0, length: 5, answer: "ABOVE" },
      { num: 8, dir: "A", clue: "Number of days in a standard week", row: 3, col: 0, length: 5, answer: "SEVEN" },
      { num: 9, dir: "A", clue: "Prevailing fashion wave or viral movement", row: 4, col: 0, length: 5, answer: "TREND" },
      // Down
      { num: 1, dir: "D", clue: "Smallest possible or least of all evils", row: 0, col: 0, length: 5, answer: "LEAST" },
      { num: 2, dir: "D", clue: "Warm reddish-orange spark in a hearth", row: 0, col: 1, length: 5, answer: "EMBER" },
      { num: 3, dir: "D", clue: "Situated at a greater altitude than below", row: 0, col: 2, length: 5, answer: "ABOVE" },
      { num: 4, dir: "D", clue: "Lucky number on rolling casino dice", row: 0, col: 3, length: 5, answer: "SEVEN" },
      { num: 5, dir: "D", clue: "A popular direction in technology and culture", row: 0, col: 4, length: 5, answer: "TREND" }
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
