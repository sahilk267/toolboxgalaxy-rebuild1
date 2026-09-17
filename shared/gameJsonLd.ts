import { GameMetadata } from "./gamesData";

export interface GameJsonLdSchema {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory: "GameApplication";
  genre: string;
  operatingSystem: string;
  browserRequirements: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
  creator: {
    "@type": "Organization";
    name: string;
  };
}

/**
 * Returns an accurate genre for each logic/arcade game.
 */
export function getGameGenre(game: GameMetadata): string {
  switch (game.slug) {
    case "the-hive":
    case "orbit-lexicon":
    case "strands":
    case "mini-crossword":
      return "Word Game / Vocabulary Puzzle";
    case "connections":
      return "Association / Categorization Puzzle";
    case "mini-sudoku":
    case "tango":
      return "Numerical / Binary Logic Puzzle";
    case "queens":
    case "patches":
    case "zip":
    case "wend":
    case "nonogram":
      return "Spatial Logic / Grid Puzzle";
    case "chess-puzzles":
      return "Chess Tactics / Strategy Puzzle";
    case "orbit-dash":
      return "3D Arcade / Reflex Game";
    case "logic-lab":
    default:
      return "Brain Training / Daily Logic Puzzle";
  }
}

/**
 * Builds the typed Schema.org WebApplication (GameApplication) structured data object for a game.
 */
export function buildGameJsonLd(game: GameMetadata, baseUrl = "https://toolboxgalaxy.com"): GameJsonLdSchema {
  const canonicalUrl = `${baseUrl}/games/${game.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${game.name} – Free Daily Logic Puzzle`,
    description: `${game.name}: ${game.detail}. Play free in your browser with zero ads.`,
    url: canonicalUrl,
    applicationCategory: "GameApplication",
    genre: getGameGenre(game),
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Aaditech Solution",
    },
  };
}

/**
 * Generates an escaped <script type="application/ld+json"> tag for the game.
 */
export function renderGameJsonLdScript(game: GameMetadata, baseUrl = "https://toolboxgalaxy.com"): string {
  const data = buildGameJsonLd(game, baseUrl);
  const jsonSafe = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${jsonSafe}\n</script>`;
}
