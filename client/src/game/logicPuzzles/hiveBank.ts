// Toolbox Galaxy: Curated NYT-Style "The Hive" (Spelling Bee) Editions
// 7 letters (1 center letter + 6 outer letters), 4+ letter words, mandatory center letter, pangram bonuses

export interface HiveEdition {
  id: string;
  date: string;
  centerLetter: string;
  outerLetters: [string, string, string, string, string, string];
  pangrams: string[];
  validWords: string[];
  themeHint?: string;
}

export interface HiveRank {
  name: string;
  threshold: number; // point threshold
  emoji: string;
}

export const HIVE_RANKS = [
  { name: "Beginner", pct: 0, emoji: "🥚" },
  { name: "Good Start", pct: 0.02, emoji: "🐣" },
  { name: "Moving Up", pct: 0.05, emoji: "🐥" },
  { name: "Good", pct: 0.08, emoji: "🐝" },
  { name: "Solid", pct: 0.15, emoji: "🛡️" },
  { name: "Nice", pct: 0.25, emoji: "✨" },
  { name: "Great", pct: 0.40, emoji: "🌟" },
  { name: "Amazing", pct: 0.50, emoji: "🚀" },
  { name: "Genius", pct: 0.70, emoji: "🧠" },
  { name: "Queen Bee", pct: 1.00, emoji: "👑" },
] as const;

export const rawHiveEditionsBank: HiveEdition[] = [
  {
    id: "hive-001",
    date: "2026-09-02",
    centerLetter: "A",
    outerLetters: ["E", "G", "I", "L", "N", "T"],
    pangrams: ["GELATIN", "ELATING"],
    themeHint: "Geometry & Harmony",
    validWords: [
      "GELATIN", "ELATING", "AGENT", "ANGLE", "GIANT", "GLEAN", 
      "TALENT", "LATENT", "ALIGN", "ALIEN", "LANE", "NEAT"
    ]
  },
  {
    id: "hive-002",
    date: "2026-09-03",
    centerLetter: "R",
    outerLetters: ["A", "C", "E", "L", "N", "T"],
    pangrams: ["CENTRAL"],
    themeHint: "Hubs & Signals",
    validWords: [
      "CENTRAL", "LANTERN", "NECTAR", "RENTAL", "LANCER", "CRANE", 
      "CRATE", "TRACE", "CLEAR", "ALERT", "ALTER", "LEARN"
    ]
  },
  {
    id: "hive-003",
    date: "2026-09-04",
    centerLetter: "A",
    outerLetters: ["C", "E", "H", "P", "R", "T"],
    pangrams: ["CHAPTER"],
    themeHint: "Story & Pages",
    validWords: [
      "CHAPTER", "CARPET", "CHEAP", "CHEAT", "PEACH", "PATCH", 
      "HEART", "EARTH", "TRACE", "CRATE", "PARCH", "REACH"
    ]
  },
  {
    id: "hive-004",
    date: "2026-09-05",
    centerLetter: "O",
    outerLetters: ["A", "B", "E", "L", "N", "T"],
    pangrams: ["NOTABLE"],
    themeHint: "Renown & Distinction",
    validWords: [
      "NOTABLE", "ALONE", "ATONE", "NOBLE", "BOAT", "BOLT", 
      "BONE", "LOAN", "LOBE", "NOTE", "TONE", "LONE"
    ]
  },
  {
    id: "hive-005",
    date: "2026-09-06",
    centerLetter: "A",
    outerLetters: ["D", "E", "L", "M", "N", "T"],
    pangrams: ["LAMENTED"],
    themeHint: "Memory & Structure",
    validWords: [
      "LAMENTED", "MANTLE", "LAMENT", "DENTAL", "MENTAL", "MEDAL", 
      "AMEND", "DEALT", "LEANT", "LAND", "LANE", "MEAL"
    ]
  },
  {
    id: "hive-006",
    date: "2026-09-07",
    centerLetter: "O",
    outerLetters: ["A", "E", "F", "L", "R", "T"],
    pangrams: ["FLOATER"],
    themeHint: "Waves & Motion",
    validWords: [
      "FLOATER", "FLOAT", "FLORAL", "FORTE", "LOAF", "LORE", 
      "ROLE", "TORE", "ALOFT", "AFORE", "FORT", "FOAL"
    ]
  }
];

// Strict mathematical sanitizer: guarantees EVERY word in an edition
// ONLY contains letters from [centerLetter, ...outerLetters], has centerLetter, and is length >= 4.
export function sanitizeEdition(edition: HiveEdition): HiveEdition {
  const allowed = new Set([
    edition.centerLetter.toUpperCase(),
    ...edition.outerLetters.map((l) => l.toUpperCase()),
  ]);
  const center = edition.centerLetter.toUpperCase();

  const validWords = Array.from(
    new Set(
      edition.validWords
        .map((w) => w.trim().toUpperCase())
        .filter((w) => {
          if (w.length < 4) return false;
          if (!w.includes(center)) return false;
          return w.split("").every((ch) => allowed.has(ch));
        })
    )
  );

  const pangrams = Array.from(
    new Set(
      edition.pangrams
        .map((p) => p.trim().toUpperCase())
        .filter((p) => {
          if (p.length < 4) return false;
          if (!p.includes(center)) return false;
          return (
            p.split("").every((ch) => allowed.has(ch)) &&
            Array.from(allowed).every((ch) => p.includes(ch))
          );
        })
    )
  );

  return {
    ...edition,
    validWords,
    pangrams,
  };
}

export const hiveEditionsBank: HiveEdition[] = rawHiveEditionsBank.map(sanitizeEdition);

export function getHiveEditionForDate(dateStr: string): HiveEdition {
  const match = hiveEditionsBank.find((e) => e.date === dateStr);
  if (match) return sanitizeEdition(match);

  // Stable daily hash fallback
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % hiveEditionsBank.length;
  return sanitizeEdition(hiveEditionsBank[index]);
}
