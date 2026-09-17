// Helper routines for Connections game
import { ConnectionsEdition, ConnectionGroup } from "./connectionsBank";

export interface GuessResult {
  correct: boolean;
  group?: ConnectionGroup;
  oneAway?: boolean;
  message?: string;
}

export function getAllWords(edition: ConnectionsEdition): string[] {
  const all: string[] = [];
  for (const group of edition.groups) {
    all.push(...group.words);
  }
  return all;
}

export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  let s = seed !== undefined ? seed : Math.random() * 1000000;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function evaluateGuess(selectedWords: string[], edition: ConnectionsEdition): GuessResult {
  if (selectedWords.length !== 4) {
    return { correct: false, message: "Select 4 words to submit." };
  }

  const upperSelected = selectedWords.map((w) => w.toUpperCase());

  for (const group of edition.groups) {
    const groupUpper = group.words.map((w) => w.toUpperCase());
    let matches = 0;
    for (const w of upperSelected) {
      if (groupUpper.includes(w)) matches++;
    }

    if (matches === 4) {
      return { correct: true, group };
    }
  }

  // Check if "One away" (exactly 3 matches with any category)
  for (const group of edition.groups) {
    const groupUpper = group.words.map((w) => w.toUpperCase());
    let matches = 0;
    for (const w of upperSelected) {
      if (groupUpper.includes(w)) matches++;
    }
    if (matches === 3) {
      return { correct: false, oneAway: true, message: "One away..." };
    }
  }

  return { correct: false, message: "Not a match." };
}
