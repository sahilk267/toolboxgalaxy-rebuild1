// Toolbox Galaxy: Curated NYT-Style Connections Editions with clever wordplay, distinct difficulty tiers, and daily seeding
export interface ConnectionGroup {
  category: string;
  level: 0 | 1 | 2 | 3; // 0: Yellow (Easiest), 1: Green (Medium), 2: Blue (Hard), 3: Purple (Tricky/Wordplay)
  words: [string, string, string, string];
}

export interface ConnectionsEdition {
  id: string;
  date: string;
  title: string;
  groups: [ConnectionGroup, ConnectionGroup, ConnectionGroup, ConnectionGroup];
}

export const CONNECTIONS_LEVEL_CONFIG = [
  { level: 0, name: "Straightforward", color: "#f59e0b", bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300", emoji: "🟨" },
  { level: 1, name: "Intermediate", color: "#10b981", bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300", emoji: "🟩" },
  { level: 2, name: "Nuanced", color: "#3b82f6", bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300", emoji: "🟦" },
  { level: 3, name: "Wordplay & Tricky", color: "#a855f7", bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-300", emoji: "🟪" },
] as const;

export const connectionsEditionBank: ConnectionsEdition[] = [
  {
    id: "connections-001",
    date: "2026-09-02",
    title: "Celestial Associations",
    groups: [
      {
        category: "TYPES OF COFFEE DRINKS",
        level: 0,
        words: ["ESPRESSO", "LATTE", "MOCHA", "AMERICANO"]
      },
      {
        category: "THINGS WITH KEYS",
        level: 1,
        words: ["PIANO", "KEYBOARD", "LOCK", "MAP"]
      },
      {
        category: "SHADES OF GREEN",
        level: 2,
        words: ["EMERALD", "OLIVE", "MINT", "SAGE"]
      },
      {
        category: "WORDS THAT CAN FOLLOW 'SPACE'",
        level: 3,
        words: ["BAR", "CADET", "JAM", "SUIT"]
      }
    ]
  },
  {
    id: "connections-002",
    date: "2026-09-03",
    title: "Wired & Inspired",
    groups: [
      {
        category: "WEB BROWSER NAMES",
        level: 0,
        words: ["CHROME", "SAFARI", "EDGE", "FIREFOX"]
      },
      {
        category: "UNITS OF DIGITAL DATA",
        level: 1,
        words: ["BIT", "BYTE", "NIBBLE", "WORD"]
      },
      {
        category: "SYNONYMS FOR SWIFT",
        level: 2,
        words: ["BRISK", "FLEET", "RAPID", "QUICK"]
      },
      {
        category: "WORDS ENDING IN NUMBERS WHEN SPOKEN",
        level: 3,
        words: ["CANINE", "HERO", "WEIGHT", "BEFORE"]
      }
    ]
  },
  {
    id: "connections-003",
    date: "2026-09-04",
    title: "Urban Rhythms",
    groups: [
      {
        category: "AIRPORT CODES (CITIES)",
        level: 0,
        words: ["JFK", "LAX", "ORD", "LHR"]
      },
      {
        category: "MUSICAL TEMPOS",
        level: 1,
        words: ["LARGO", "ANDANTE", "ALLEGRO", "PRESTO"]
      },
      {
        category: "THINGS THAT CAN BE FOLDED",
        level: 2,
        words: ["ORIGAMI", "LAUNDRY", "POKER HAND", "MAP"]
      },
      {
        category: "___ CAKE",
        level: 3,
        words: ["CARROT", "POUND", "SPONGE", "FUNNEL"]
      }
    ]
  },
  {
    id: "connections-004",
    date: "2026-09-05",
    title: "Vivid Currents",
    groups: [
      {
        category: "BODY PARTS IN CARD GAMES",
        level: 0,
        words: ["HEART", "HAND", "FACE", "PALM"]
      },
      {
        category: "GEOMETRIC SHAPES",
        level: 1,
        words: ["DIAMOND", "HEXAGON", "OVAL", "RHOMBUS"]
      },
      {
        category: "FASTENERS",
        level: 2,
        words: ["BOLT", "RIVET", "SCREW", "VELCRO"]
      },
      {
        category: "WORDS WITH DOUBLE 'O' THAT DON'T RHYME WITH 'MOON'",
        level: 3,
        words: ["BOOK", "DOOR", "FLOOD", "FOOT"]
      }
    ]
  },
  {
    id: "connections-005",
    date: "2026-09-06",
    title: "Cosmic Links",
    groups: [
      {
        category: "PLANETS IN OUR SOLAR SYSTEM",
        level: 0,
        words: ["MARS", "VENUS", "JUPITER", "SATURN"]
      },
      {
        category: "CLASSIC BOARD GAMES",
        level: 1,
        words: ["CHESS", "CLUE", "RISK", "SORRY"]
      },
      {
        category: "PARTS OF A TREE",
        level: 2,
        words: ["BARK", "BRANCH", "ROOT", "TRUNK"]
      },
      {
        category: "THINGS YOU CAN 'CATCH'",
        level: 3,
        words: ["COLD", "DRIFT", "FIRE", "WAVE"]
      }
    ]
  },
  {
    id: "connections-006",
    date: "2026-09-07",
    title: "Mind Bridges",
    groups: [
      {
        category: "PRIMARY & SECONDARY COLORS",
        level: 0,
        words: ["AMBER", "CYAN", "MAGENTA", "VIOLET"]
      },
      {
        category: "CHEF's TOOLS",
        level: 1,
        words: ["WHISK", "GRATER", "PEELER", "TONGS"]
      },
      {
        category: "SYNONYMS FOR SHINING",
        level: 2,
        words: ["BEAMING", "GLOWING", "LUMINOUS", "RADIANT"]
      },
      {
        category: "HOMOPHONES OF ANIMALS",
        level: 3,
        words: ["BARE", "DEAR", "HARE", "NIGHT"]
      }
    ]
  },
  {
    id: "connections-007",
    date: "2026-09-08",
    title: "Synapse Spark",
    groups: [
      {
        category: "KINDS OF CHEESE",
        level: 0,
        words: ["BRIE", "CHEDDAR", "GOUDA", "SWISS"]
      },
      {
        category: "WATER BODIES",
        level: 1,
        words: ["BAY", "COVE", "GULF", "STRAIT"]
      },
      {
        category: "THINGS WITH STRINGS",
        level: 2,
        words: ["GUITAR", "PUPPET", "KITE", "TENNIS RACKET"]
      },
      {
        category: "WORDS BEFORE 'PAPER'",
        level: 3,
        words: ["FLY", "SAND", "TOILET", "WALL"]
      }
    ]
  }
];

export function connectionsEditionForDate(dateStr: string): ConnectionsEdition {
  const match = connectionsEditionBank.find((e) => e.date === dateStr);
  if (match) return match;
  
  // Deterministic daily hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const index = hash % connectionsEditionBank.length;
  return {
    ...connectionsEditionBank[index],
    date: dateStr,
    id: `connections-${dateStr}`,
  };
}
