// Toolbox Galaxy: Curated Wordle Plus 5-letter words bank & valid guess vocabulary
export interface WordleEdition {
  id: string;
  date: string;
  solution: string;
  hint: string;
  theme: string;
}

export const DAILY_WORDLE_BANK: WordleEdition[] = [
  { id: "wordle-001", date: "2026-09-02", solution: "ORBIT", hint: "Curved path of a celestial object", theme: "Space & Physics" },
  { id: "wordle-002", date: "2026-09-03", solution: "SOLAR", hint: "Relating to or determined by the sun", theme: "Astronomy" },
  { id: "wordle-003", date: "2026-09-04", solution: "PRISM", hint: "Transparent glass refracting light into colors", theme: "Optics" },
  { id: "wordle-004", date: "2026-09-05", solution: "PULSE", hint: "A rhythmical throbbing or burst of energy", theme: "Rhythm" },
  { id: "wordle-005", date: "2026-09-06", solution: "CRAFT", hint: "An activity involving skill in making things", theme: "Creation" },
  { id: "wordle-006", date: "2026-09-07", solution: "FORGE", hint: "Make or shape a metal object using fire", theme: "Engineering" },
  { id: "wordle-007", date: "2026-09-08", solution: "SPARK", hint: "A small fiery particle or ignition trigger", theme: "Energy" },
  { id: "wordle-008", date: "2026-09-09", solution: "BLAZE", hint: "A very large or fiercely burning fire", theme: "Light" },
  { id: "wordle-009", date: "2026-09-10", solution: "NOVA", hint: "A star showing a sudden large increase in brightness", theme: "Cosmos" },
  { id: "wordle-010", date: "2026-09-11", solution: "COSMO", hint: "Relating to the universe or world at large", theme: "Universe" },
  { id: "wordle-011", date: "2026-09-12", solution: "NEXUS", hint: "A connection or series of connections linking things", theme: "Logic" },
  { id: "wordle-012", date: "2026-09-13", solution: "RADAR", hint: "System for detecting presence or direction of objects", theme: "Detection" },
  { id: "wordle-013", date: "2026-09-14", solution: "LUNAR", hint: "Resembling or determined by the moon", theme: "Night Sky" },
  { id: "wordle-014", date: "2026-09-15", solution: "ZENITH", hint: "The time at which something is most powerful or high", theme: "Apex" },
];

export const VALID_5_LETTER_WORDS = new Set([
  "ABOUT", "ABOVE", "ACTOR", "ACUTE", "ADAPT", "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN",
  "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIKE", "ALIVE", "ALLOW", "ALONE",
  "ALONG", "ALTER", "AMONG", "ANGER", "ANGLE", "ANGRY", "APART", "APPLE", "APPLY", "ARENA",
  "ARGUE", "ARISE", "ARRAY", "ASIDE", "ASSET", "AUDIO", "AUDIT", "AVOID", "AWARD", "AWARE",
  "BADGE", "BAKER", "BASIC", "BASIS", "BEACH", "BEGIN", "BEING", "BELOW", "BENCH", "BIRTH",
  "BLACK", "BLADE", "BLAME", "BLANK", "BLAST", "BLAZE", "BLEED", "BLEND", "BLOCK", "BLOOD",
  "BOARD", "BOAST", "BOOST", "BOOTH", "BOUND", "BRAIN", "BRAND", "BRASS", "BRAVE", "BREAD",
  "BREAK", "BREED", "BRIEF", "BRING", "BRISK", "BROAD", "BROWN", "BUILD", "BUILT", "BUYER",
  "CABLE", "CALIF", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHART", "CHASE", "CHEAP",
  "CHECK", "CHEST", "CHIEF", "CHILD", "CHINA", "CHOSE", "CIVIL", "CLAIM", "CLASS", "CLEAN",
  "CLEAR", "CLICK", "CLOCK", "CLOSE", "COACH", "COAST", "COAST", "COLOR", "COUCH", "COUNT",
  "COURT", "COVER", "CRAFT", "CRANE", "CRASH", "CRAZY", "CREAM", "CRIME", "CROSS", "CROWD",
  "CROWN", "CRUDE", "CURVE", "CYCLE", "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DEBUT",
  "DELAY", "DEPTH", "DIRT", "DODGE", "DRAFT", "DRAIN", "DRAMA", "DRAWN", "DREAM", "DRESS",
  "DRIFT", "DRINK", "DRIVE", "DROVE", "DYING", "EAGER", "EARLY", "EARTH", "EIGHT", "ELITE",
  "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT",
  "EXIST", "EXTRA", "FAITH", "FALSE", "FAULT", "FIBER", "FIELD", "FIFTH", "FIFTY", "FIGHT",
  "FINAL", "FIRST", "FIXED", "FLASH", "FLEET", "FLOOR", "FLUID", "FOCUS", "FORCE", "FORGE",
  "FORTH", "FORTY", "FORUM", "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FRUIT",
  "FULLY", "FUNNY", "GIANT", "GIVEN", "GLASS", "GLOBE", "GLORY", "GLOVE", "GRACE", "GRADE",
  "GRAIN", "GRAND", "GRANT", "GRASS", "GRAVE", "GREAT", "GREEN", "GRIEF", "GROSS", "GROUP",
  "GROWN", "GUARD", "GUESS", "GUEST", "GUIDE", "HABIT", "HAPPY", "HEART", "HEAVY", "HEDGE",
  "HORSE", "HOTEL", "HOUSE", "HUMAN", "IDEAL", "IMAGE", "IMPLY", "INDEX", "INNER", "INPUT",
  "ISSUE", "JAPAN", "JOINT", "JUDGE", "JUICE", "KNIFE", "KNOCK", "KNOWN", "LABEL", "LABOR",
  "LARGE", "LASER", "LATER", "LAUGH", "LAYER", "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL",
  "LEVEL", "LIGHT", "LIMIT", "LINKS", "LIVED", "LOCAL", "LOGIC", "LOOSE", "LUCKY", "LUNCH",
  "MAGIC", "MAJOR", "MAKER", "MARCH", "MATCH", "MAYBE", "MAYOR", "MEDIA", "METAL", "MIGHT",
  "MINOR", "MINUS", "MIXED", "MODEL", "MONEY", "MONTH", "MORAL", "MOTOR", "MOUNT", "MOUSE",
  "MOUTH", "MOVIE", "MUSIC", "NAKED", "NERVE", "NEVER", "NEXUS", "NIGHT", "NOISE", "NORTH",
  "NOTED", "NOVEL", "NURSE", "OCCUR", "OCEAN", "OFFER", "OFTEN", "ORDER", "OTHER", "OUGHT",
  "PAINT", "PANEL", "PAPER", "PARTY", "PEACE", "PETER", "PHASE", "PHONE", "PHOTO", "PIECE",
  "PILOT", "PITCH", "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE", "POINT", "POUND", "POWER",
  "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRISM", "PRIZE", "PROOF", "PROUD",
  "PROVE", "PULSE", "QUEEN", "QUICK", "QUIET", "QUITE", "RADIO", "RAISE", "RANGE", "RAPID",
  "RATIO", "REACH", "REACT", "READY", "REFER", "RIGHT", "RIVAL", "RIVER", "ROBIN", "ROBOT",
  "ROUND", "ROUTE", "ROYAL", "RURAL", "SCALE", "SCENE", "SCOPE", "SCORE", "SENSE", "SERVE",
  "SEVEN", "SHALL", "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF", "SHELL", "SHIFT", "SHINE",
  "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOWN", "SIGHT", "SINCE", "SIXTH", "SIXTY", "SKILL",
  "SLEEP", "SLIDE", "SMALL", "SMART", "SMILE", "SMOKE", "SOLID", "SOLVE", "SORRY", "SOUND",
  "SOUTH", "SPACE", "SPARE", "SPARK", "SPEAK", "SPEED", "SPEND", "SPENT", "SPLIT", "SPOKE",
  "SPORT", "STAFF", "STAGE", "STAKE", "STAND", "START", "STATE", "STEAM", "STEEL", "STICK",
  "STILL", "STOCK", "STONE", "STOOD", "STORE", "STORM", "STORY", "STRIP", "STUCK", "STUDY",
  "STUFF", "STYLE", "SUGAR", "SUITE", "SUPER", "SWEET", "TABLE", "TAKEN", "TASTE", "TAXES",
  "TEACH", "TEETH", "TERRY", "TEXAS", "THANK", "THEFT", "THEIR", "THEME", "THERE", "THESE",
  "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW", "THROW", "TIGHT", "TIMES",
  "TITLE", "TODAY", "TOPIC", "TOTAL", "TOUCH", "TOUGH", "TOWER", "TRACK", "TRADE", "TRAIN",
  "TREAT", "TREND", "TRIAL", "TRIED", "TRUCK", "TRULY", "TRUST", "TRUTH", "TWICE", "UNDER",
  "UNDUE", "UNION", "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE", "USUAL", "VALID",
  "VALUE", "VIDEO", "VIRUS", "VISIT", "VITAL", "VOICE", "WASTE", "WATCH", "WATER", "WHEEL",
  "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE", "WHOSE", "WOMAN", "WOMEN", "WORLD", "WORRY",
  "WORSE", "WORST", "WORTH", "WOULD", "WOUND", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG",
  "YOUTH", "ZENITH", "ORBIT", "SOLAR", "LUNAR", "RADAR", "COSMO"
]);

export function wordleEditionForDate(dateStr: string): WordleEdition {
  const match = DAILY_WORDLE_BANK.find((e) => e.date === dateStr);
  if (match) return match;

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const index = hash % DAILY_WORDLE_BANK.length;
  return {
    ...DAILY_WORDLE_BANK[index],
    date: dateStr,
    id: `wordle-${dateStr}`,
  };
}
