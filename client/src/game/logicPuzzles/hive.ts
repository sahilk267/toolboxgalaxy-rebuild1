// The Hive (Spelling Bee) evaluation and scoring logic
import { HiveEdition, HIVE_RANKS } from "./hiveBank";

export interface WordValidation {
  valid: boolean;
  score: number;
  isPangram: boolean;
  message?: string;
}

export function isPangram(word: string, edition: HiveEdition): boolean {
  const upper = word.toUpperCase();
  const allLetters = [edition.centerLetter, ...edition.outerLetters];
  return allLetters.every((l) => upper.includes(l));
}

export function calculateWordScore(word: string, edition: HiveEdition): { points: number; isPangram: boolean } {
  const upper = word.toUpperCase();
  const pangram = isPangram(upper, edition);

  let points = 0;
  if (upper.length === 4) {
    points = 1;
  } else {
    points = upper.length;
  }

  if (pangram) {
    points += 7; // Pangram bonus
  }

  return { points, isPangram: pangram };
}

export function getMaxScore(edition: HiveEdition): number {
  return edition.validWords.reduce((sum, word) => {
    return sum + calculateWordScore(word, edition).points;
  }, 0);
}

export function getCurrentRank(score: number, maxScore: number) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  let currentRank: (typeof HIVE_RANKS)[number] = HIVE_RANKS[0];

  for (const rank of HIVE_RANKS) {
    if (ratio >= rank.pct) {
      currentRank = rank;
    }
  }

  // Find next rank
  const currentIndex = HIVE_RANKS.findIndex((r) => r.name === currentRank.name);
  const nextRank = currentIndex < HIVE_RANKS.length - 1 ? HIVE_RANKS[currentIndex + 1] : null;
  const pointsToNext = nextRank ? Math.ceil(nextRank.pct * maxScore) - score : 0;

  return {
    rank: currentRank,
    nextRank,
    pointsToNext: Math.max(0, pointsToNext),
    progressPercent: Math.min(100, Math.round(ratio * 100)),
  };
}

export function validateWordGuess(
  word: string,
  edition: HiveEdition,
  foundWords: string[]
): WordValidation {
  const upper = word.trim().toUpperCase();

  if (upper.length < 4) {
    return { valid: false, score: 0, isPangram: false, message: "Too short (min 4 letters)" };
  }

  if (!upper.includes(edition.centerLetter.toUpperCase())) {
    return {
      valid: false,
      score: 0,
      isPangram: false,
      message: `Must use center letter: "${edition.centerLetter}"`,
    };
  }

  const validChars = new Set([edition.centerLetter.toUpperCase(), ...edition.outerLetters.map((l) => l.toUpperCase())]);
  for (const char of upper) {
    if (!validChars.has(char)) {
      return { valid: false, score: 0, isPangram: false, message: `Bad letter: "${char}"` };
    }
  }

  if (foundWords.map((w) => w.toUpperCase()).includes(upper)) {
    return { valid: false, score: 0, isPangram: false, message: "Already found" };
  }

  const inDictionary = edition.validWords.some((w) => w.toUpperCase() === upper);
  if (!inDictionary) {
    return { valid: false, score: 0, isPangram: false, message: "Not in word list" };
  }

  const { points, isPangram: pangram } = calculateWordScore(upper, edition);
  const message = pangram ? `Pangram! +${points} 🌟` : `Good! +${points}`;

  return {
    valid: true,
    score: points,
    isPangram: pangram,
    message,
  };
}

export function shuffleLetters<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
