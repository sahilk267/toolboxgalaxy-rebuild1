// Wordle evaluation engine
import { VALID_5_LETTER_WORDS } from "./wordleBank";

export type LetterStatus = "correct" | "present" | "absent" | "empty";

export interface EvaluatedLetter {
  char: string;
  status: LetterStatus;
}

export function evaluateWordleGuess(guess: string, target: string): EvaluatedLetter[] {
  const result: EvaluatedLetter[] = Array.from({ length: 5 }, (_, i) => ({
    char: guess[i] || "",
    status: "absent",
  }));

  const targetArr = target.toUpperCase().split("");
  const guessArr = guess.toUpperCase().split("");
  const matched = Array(5).fill(false);
  const guessMatched = Array(5).fill(false);

  // 1st pass: find exact matches (Green)
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i].status = "correct";
      matched[i] = true;
      guessMatched[i] = true;
    }
  }

  // 2nd pass: find misplaced letters (Yellow)
  for (let i = 0; i < 5; i++) {
    if (!guessMatched[i]) {
      const char = guessArr[i];
      for (let j = 0; j < 5; j++) {
        if (!matched[j] && targetArr[j] === char) {
          result[i].status = "present";
          matched[j] = true;
          break;
        }
      }
    }
  }

  return result;
}

export function isValidWord(word: string): boolean {
  if (word.length !== 5) return false;
  return VALID_5_LETTER_WORDS.has(word.toUpperCase());
}
