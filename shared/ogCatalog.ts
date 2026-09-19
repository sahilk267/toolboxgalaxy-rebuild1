/**
 * Open Graph & Social Share Image Catalog for Toolbox Galaxy.
 * Provides isomorphic definitions, category groupings, and image URL resolvers
 * for pre-rendered social cards across tools, categories, games, and hubs.
 */

export const BASE_URL = "https://toolboxgalaxy.com";
export const OG_IMAGE_DIR = "/og";

export interface OgImageDefinition {
  id: string;
  filename: string;
  title: string;
  categoryBadge: string;
  subtitle: string;
  tags: string[];
  accentColor: string; // Hex color for highlights and visual glow
  badgeBg: string;
  visualType: string;
}

// 1. Tool Category Visual Templates
export const TOOL_CATEGORY_OG: Record<string, OgImageDefinition> = {
  "image-tools": {
    id: "image-tools",
    filename: "og-category-image-tools.png",
    title: "Image & Media Studio",
    categoryBadge: "IMAGE & VISUAL UTILITIES",
    subtitle: "Crop, resize, compress, strip EXIF metadata, and extract color palettes in your browser.",
    tags: ["100% Private", "Zero Uploads", "Client-Side Canvas", "High Fidelity"],
    accentColor: "#38bdf8", // Sky
    badgeBg: "rgba(56, 189, 248, 0.15)",
    visualType: "image",
  },
  "pdf-studio": {
    id: "pdf-studio",
    filename: "og-category-pdf-doc-studio.png",
    title: "PDF & Document Studio",
    categoryBadge: "OFFICE & DOCUMENT SUITE",
    subtitle: "Merge, split, edit, redact, and inspect PDF, Word DOCX, and Excel XLSX files privately.",
    tags: ["Confidential", "In-Browser PDF.js", "No Server Processing", "Unlimited Use"],
    accentColor: "#f43f5e", // Rose/Crimson
    badgeBg: "rgba(244, 63, 94, 0.15)",
    visualType: "pdf",
  },
  "regional-tools": {
    id: "regional-tools",
    filename: "og-category-regional-tools.png",
    title: "Regional & India Utilities",
    categoryBadge: "LOCALIZED WORKBENCH",
    subtitle: "Calculate GST, convert Rupees to cheque words, convert Bigha/Guntha land area, and resize exam photos.",
    tags: ["GST India", "Govt Photo Resizer", "Land Area Bigha", "Cheque Words"],
    accentColor: "#f59e0b", // Amber/Gold
    badgeBg: "rgba(245, 158, 11, 0.15)",
    visualType: "regional",
  },
  "developer-tools": {
    id: "developer-tools",
    filename: "og-category-developer-tools.png",
    title: "Developer Tools & Decoders",
    categoryBadge: "ENGINEERING FOUNDRY",
    subtitle: "Inspect JWT tokens, test Regex, visualize Cron, generate Zod schemas, format JSON, and convert cURL.",
    tags: ["Instant Syntax Check", "Offline-Ready", "Zero Telemetry", "Dev-Grade"],
    accentColor: "#c7f36b", // Lime
    badgeBg: "rgba(199, 243, 107, 0.15)",
    visualType: "developer",
  },
  "daily-utilities": {
    id: "daily-utilities",
    filename: "og-category-daily-utilities.png",
    title: "Daily Utilities & Calculators",
    categoryBadge: "EVERYDAY UTILITY SUITE",
    subtitle: "Fast arithmetic, unit conversions, percentage, BMI, loan EMI, date difference, and text operations.",
    tags: ["Clean Interface", "Fast Calculations", "Precision Math", "Zero Ads"],
    accentColor: "#a855f7", // Violet
    badgeBg: "rgba(168, 85, 247, 0.15)",
    visualType: "daily",
  },
  "tools-hub": {
    id: "tools-hub",
    filename: "og-tools-foundry.png",
    title: "Tools Foundry — 50+ In-Browser Utilities",
    categoryBadge: "PRIVACY-FIRST WORKBENCH",
    subtitle: "Comprehensive suite of 50+ verified local-first tools: PDF, Image, Developer, and Everyday Calculators.",
    tags: ["50+ Local Tools", "100% In-Browser", "Zero Data Leaks", "Instant Run"],
    accentColor: "#c7f36b", // Lime
    badgeBg: "rgba(199, 243, 107, 0.15)",
    visualType: "tools-hub",
  },
};

// Tool slug to category ID mapping
export const TOOL_SLUG_TO_CATEGORY: Record<string, string> = {
  // Image Tools
  "image-resizer": "image-tools",
  "favicon-generator": "image-tools",
  "image-crop-rotate-convert": "image-tools",
  "image-metadata-remover": "image-tools",
  "color-signal": "image-tools",
  "color-contrast-checker": "image-tools",
  "gradient-forge": "image-tools",
  "qr-code-generator": "image-tools",

  // PDF & Doc Studio
  "pdf-visual-editor": "pdf-studio",
  "pdf-merge-split": "pdf-studio",
  "images-to-pdf": "pdf-studio",
  "excel-spreadsheet-studio": "pdf-studio",
  "word-docx-converter": "pdf-studio",

  // Regional & India Tools
  "gst-tax-calculator": "regional-tools",
  "passport-photo-resizer": "regional-tools",
  "land-area-converter": "regional-tools",
  "number-to-words-rupees": "regional-tools",
  "whatsapp-direct-chat": "regional-tools",

  // Developer Tools
  "json-to-zod-schema": "developer-tools",
  "jwt-debugger": "developer-tools",
  "cron-schedule-expression": "developer-tools",
  "regex-tester": "developer-tools",
  "curl-to-code": "developer-tools",
  "json-station": "developer-tools",
  "base64-workbench": "developer-tools",
  "hash-generator": "developer-tools",
  "uuid-generator": "developer-tools",
  "url-workbench": "developer-tools",
  "html-entity-tool": "developer-tools",
  "text-diff-checker": "developer-tools",
  "json-csv-converter": "developer-tools",
  "csv-viewer-cleaner": "developer-tools",
  "markdown-workspace": "developer-tools",
  "password-strength-auditor": "developer-tools",

  // Daily Utilities
  "basic-calculator": "daily-utilities",
  "percentage-calculator": "daily-utilities",
  "unit-converter": "daily-utilities",
  "password-generator": "daily-utilities",
  "text-statistics": "daily-utilities",
  "bmi-calculator": "daily-utilities",
  "discount-calculator": "daily-utilities",
  "age-calculator": "daily-utilities",
  "date-difference": "daily-utilities",
  "text-case-tool": "daily-utilities",
  "business-days-calculator": "daily-utilities",
  "time-zone-meeting-planner": "daily-utilities",
  "timestamp-converter": "daily-utilities",
  "find-replace-workspace": "daily-utilities",
  "split-bill-tip-calculator": "daily-utilities",
  "loan-emi-estimate": "daily-utilities",
  "work-shift-duration": "daily-utilities",
  "line-sorter-deduplicator": "daily-utilities",
  "tracking-url-cleaner": "daily-utilities",
};

// 2. Per-Game Visual Templates
export const GAMES_OG: Record<string, OgImageDefinition> = {
  "the-hive": {
    id: "the-hive",
    filename: "og-game-the-hive.png",
    title: "The Hive — Daily Hex Word Puzzle",
    categoryBadge: "SPELLING BEE LOGIC",
    subtitle: "Create words from 7 honeycomb letters, spot the secret pangram, and reach Queen Bee rank.",
    tags: ["Daily Edition", "Hexagonal Honeycomb", "Pangram Hunt", "Audio Feedback"],
    accentColor: "#eab308", // Golden Yellow
    badgeBg: "rgba(234, 179, 8, 0.15)",
    visualType: "game-hive",
  },
  "orbit-lexicon": {
    id: "orbit-lexicon",
    filename: "og-game-orbit-lexicon.png",
    title: "Wordle (Lexicon) — Daily 5-Letter Word",
    categoryBadge: "MYSTERY WORD CHALLENGE",
    subtitle: "Guess the hidden 5-letter word in 6 attempts with color feedback cues. Clean, fast, and 100% ad-free.",
    tags: ["6 Guesses", "Daily New Word", "Share Challenge", "Streak Tracking"],
    accentColor: "#10b981", // Emerald Green
    badgeBg: "rgba(16, 185, 129, 0.15)",
    visualType: "game-wordle",
  },
  "connections": {
    id: "connections",
    filename: "og-game-connections.png",
    title: "Connections — 4×4 Word Association",
    categoryBadge: "CATEGORY DEDUCTION",
    subtitle: "Find groups of four words that share a common thread across four ascending difficulty tiers.",
    tags: ["4 Hidden Tiers", "Daily Puzzle", "One Away Cues", "NYT Style"],
    accentColor: "#8b5cf6", // Purple
    badgeBg: "rgba(139, 92, 246, 0.15)",
    visualType: "game-connections",
  },
  "queens": {
    id: "queens",
    filename: "og-game-queens.png",
    title: "Queens — Region Crown Placement",
    categoryBadge: "GEOMETRIC LOGIC",
    subtitle: "Place one queen per row, column, and colored territory. No queens can touch, even diagonally.",
    tags: ["Crown Placement", "Zero Touching", "Speed Timer", "Clean Deduction"],
    accentColor: "#f59e0b", // Amber
    badgeBg: "rgba(245, 158, 11, 0.15)",
    visualType: "game-queens",
  },
  "mini-sudoku": {
    id: "mini-sudoku",
    filename: "og-game-mini-sudoku.png",
    title: "Mini Sudoku — 6×6 Fast Logic",
    categoryBadge: "NUMERICAL DEDUCTION",
    subtitle: "Fill the 6×6 grid so every row, column, and 2×3 box contains digits 1 through 6 without duplicates.",
    tags: ["6×6 Grid", "Daily Handcrafted", "Pencil Notes", "Error Checking"],
    accentColor: "#38bdf8", // Sky Blue
    badgeBg: "rgba(56, 189, 248, 0.15)",
    visualType: "game-sudoku",
  },
  "strands": {
    id: "strands",
    filename: "og-game-strands.png",
    title: "Strands — Theme Threads & Spangram",
    categoryBadge: "NYT-STYLE WORD SEARCH",
    subtitle: "Uncover themed words hidden in an 8×6 grid and discover the golden spangram touching both sides.",
    tags: ["Golden Spangram", "8×6 Letter Grid", "Hint Meter", "Daily Theme"],
    accentColor: "#06b6d4", // Cyan
    badgeBg: "rgba(6, 182, 212, 0.15)",
    visualType: "game-strands",
  },
  "tango": {
    id: "tango",
    filename: "og-game-tango.png",
    title: "Tango — Sun & Moon Binary Logic",
    categoryBadge: "BINARY BALANCING",
    subtitle: "Fill each cell with a sun or moon following strict equality (=) and opposite (×) constraints.",
    tags: ["Sun & Moon", "Equal Balancing", "No 3 in a Row", "Pure Logic"],
    accentColor: "#ec4899", // Pink
    badgeBg: "rgba(236, 72, 153, 0.15)",
    visualType: "game-tango",
  },
  "patches": {
    id: "patches",
    filename: "og-game-patches.png",
    title: "Patches — Exact Cover Quilt",
    categoryBadge: "SPATIAL PACKING",
    subtitle: "Divide the grid into rectangular colored patches matching designated sizes without overlaps.",
    tags: ["Exact Cover", "Geometric Reasoning", "Patchwork Colors", "Daily Board"],
    accentColor: "#14b8a6", // Teal
    badgeBg: "rgba(20, 184, 166, 0.15)",
    visualType: "game-patches",
  },
  "zip": {
    id: "zip",
    filename: "og-game-zip.png",
    title: "Zip — Ordered Wall Labyrinth",
    categoryBadge: "SINGLE-PATH LOGIC",
    subtitle: "Connect numbered check-points sequentially with a single continuous non-intersecting line.",
    tags: ["Ordered Route", "Wall Obstacles", "Single Path", "Speed Run"],
    accentColor: "#6366f1", // Indigo
    badgeBg: "rgba(99, 102, 241, 0.15)",
    visualType: "game-zip",
  },
  "wend": {
    id: "wend",
    filename: "og-game-wend.png",
    title: "Wend — Orthogonal Word Trail",
    categoryBadge: "WORD PATH LOGIC",
    subtitle: "Trace valid vocabulary words orthogonally across the grid leaving zero unused letters behind.",
    tags: ["Orthogonal Steps", "Complete Coverage", "Vocabulary Trail", "Daily Edition"],
    accentColor: "#84cc16", // Lime-Green
    badgeBg: "rgba(132, 204, 22, 0.15)",
    visualType: "game-wend",
  },
  "chess-puzzles": {
    id: "chess-puzzles",
    filename: "og-game-chess-puzzles.png",
    title: "Chess Puzzles — Tactical Deduction",
    categoryBadge: "MASTERCLASS TACTICS",
    subtitle: "Deduce the best moves, forks, pins, and checkmate sequences in curated daily positions.",
    tags: ["Forks & Pins", "Checkmate in 2", "Grandmaster Rating", "Tactical Vision"],
    accentColor: "#f97316", // Orange
    badgeBg: "rgba(249, 115, 22, 0.15)",
    visualType: "game-chess",
  },
  "nonogram": {
    id: "nonogram",
    filename: "og-game-nonogram.png",
    title: "Nonogram — Picross Picture Logic",
    categoryBadge: "PICTURE CROSS DEDUCTION",
    subtitle: "Use row and column numerical clues to shade pixels and reveal hidden retro pixel artwork.",
    tags: ["Pixel Art Reveal", "Number Clues", "Zero Guesswork", "Picross Standard"],
    accentColor: "#0ea5e9", // Sky
    badgeBg: "rgba(14, 165, 233, 0.15)",
    visualType: "game-nonogram",
  },
  "orbit-dash": {
    id: "orbit-dash",
    filename: "og-game-orbit-dash.png",
    title: "Orbit Dash — 3D Cyber Dodge",
    categoryBadge: "3D ARCADE ACTION",
    subtitle: "High-speed 3D tunnel runner built with Babylon.js. Dodge laser barriers and collect cosmic prisms.",
    tags: ["Babylon.js 3D", "60 FPS Action", "Cyber Tunnel", "High Score Run"],
    accentColor: "#c084fc", // Neon Purple
    badgeBg: "rgba(192, 132, 252, 0.15)",
    visualType: "game-orbit-dash",
  },
  "mini-crossword": {
    id: "mini-crossword",
    filename: "og-game-mini-crossword.png",
    title: "Mini Crossword — Daily 5×5 Speed Puzzle",
    categoryBadge: "SPEED CROSSWORD",
    subtitle: "Solve the daily 5×5 mini crossword puzzle across and down with clever clues and zero ads.",
    tags: ["5×5 Mini", "Daily New Clues", "Stopwatch Timer", "Mobile Optimized"],
    accentColor: "#c7f36b", // Lime
    badgeBg: "rgba(199, 243, 107, 0.15)",
    visualType: "game-crossword",
  },
  "logic-lab": {
    id: "logic-lab",
    filename: "og-game-logic-lab.png",
    title: "Logic Lab — Custom Puzzle Generator",
    categoryBadge: "EXPERIMENTAL PLAYGROUND",
    subtitle: "Custom rule playground and puzzle sandbox to practice Queens, Sudoku, Tango, and word puzzles.",
    tags: ["Custom Sizes", "Infinite Practice", "Difficulty Slider", "Sandbox Mode"],
    accentColor: "#38bdf8", // Sky
    badgeBg: "rgba(56, 189, 248, 0.15)",
    visualType: "game-logic-lab",
  },
  "games-hub": {
    id: "games-hub",
    filename: "og-games-bay.png",
    title: "Games Bay — Free Daily Brain Puzzles",
    categoryBadge: "DAILY NYT-STYLE LOGIC HUB",
    subtitle: "Play The Hive, Wordle, Connections, Queens, Sudoku, Tango, and Strands with zero ads and zero install.",
    tags: ["15+ Daily Games", "Streak Records", "Audio Feedback", "100% Free Forever"],
    accentColor: "#c7f36b", // Lime
    badgeBg: "rgba(199, 243, 107, 0.15)",
    visualType: "games-hub",
  },
};

// 3. Main Brand Default Fallback
export const DEFAULT_OG: OgImageDefinition = {
  id: "default",
  filename: "og-default.png",
  title: "Toolbox Galaxy — In-Browser Workbench",
  categoryBadge: "PRIVACY-FIRST PLATFORM",
  subtitle: "100% client-side workbench: PDF & Document Studio, 50+ developer utilities, and daily logic puzzles.",
  tags: ["100% Client-Side", "Zero Server Uploads", "Private & Free", "Instant Loading"],
  accentColor: "#c7f36b",
  badgeBg: "rgba(199, 243, 107, 0.15)",
  visualType: "default-galaxy",
};

// All OG definitions for bulk generation
export const ALL_OG_DEFINITIONS: OgImageDefinition[] = [
  DEFAULT_OG,
  ...Object.values(TOOL_CATEGORY_OG),
  ...Object.values(GAMES_OG),
];

/**
 * Resolves the appropriate category ID for any given tool slug.
 */
export function getToolCategoryId(slug: string): string {
  const cleanSlug = slug.toLowerCase().trim();
  if (TOOL_SLUG_TO_CATEGORY[cleanSlug]) {
    return TOOL_SLUG_TO_CATEGORY[cleanSlug];
  }
  // Fallbacks based on keywords in slug
  if (cleanSlug.includes("image") || cleanSlug.includes("color") || cleanSlug.includes("photo") || cleanSlug.includes("qr") || cleanSlug.includes("gradient")) {
    return "image-tools";
  }
  if (cleanSlug.includes("pdf") || cleanSlug.includes("doc") || cleanSlug.includes("excel") || cleanSlug.includes("sheet")) {
    return "pdf-studio";
  }
  if (cleanSlug.includes("gst") || cleanSlug.includes("rupee") || cleanSlug.includes("land") || cleanSlug.includes("bigha")) {
    return "regional-tools";
  }
  if (cleanSlug.includes("json") || cleanSlug.includes("jwt") || cleanSlug.includes("regex") || cleanSlug.includes("cron") || cleanSlug.includes("code") || cleanSlug.includes("hash") || cleanSlug.includes("uuid")) {
    return "developer-tools";
  }
  return "daily-utilities";
}

/**
 * Resolves the absolute OG image URL for any path in the application.
 */
export function resolveOgImageUrl(pathname: string): string {
  const cleanPath = pathname.split("?")[0].trim().toLowerCase();

  // 1. Tool route (/tools/:slug)
  if (cleanPath.startsWith("/tools/")) {
    const slug = cleanPath.replace(/^\/tools\/?/, "").split("/")[0];
    const categoryId = getToolCategoryId(slug);
    const categoryDef = TOOL_CATEGORY_OG[categoryId] || TOOL_CATEGORY_OG["daily-utilities"];
    return `${BASE_URL}${OG_IMAGE_DIR}/${categoryDef.filename}`;
  }

  // 2. Tools hub (/tools)
  if (cleanPath === "/tools" || cleanPath === "/tools/") {
    return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["tools-hub"].filename}`;
  }

  // 3. Document / PDF studio paths
  if (cleanPath === "/studio" || cleanPath === "/pdf-studio" || cleanPath === "/document-studio") {
    return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["pdf-studio"].filename}`;
  }

  // 3b. Guides hub and individual technical guides
  if (cleanPath.startsWith("/guides/")) {
    const slug = cleanPath.replace(/^\/guides\/?/, "").split("/")[0];
    if (slug.includes("pdf")) {
      return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["pdf-studio"].filename}`;
    }
    if (slug.includes("gst") || slug.includes("passport")) {
      return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["regional-tools"].filename}`;
    }
    if (slug.includes("json") || slug.includes("csv")) {
      return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["developer-tools"].filename}`;
    }
    return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["tools-hub"].filename}`;
  }

  if (cleanPath === "/guides" || cleanPath === "/guides/") {
    return `${BASE_URL}${OG_IMAGE_DIR}/${TOOL_CATEGORY_OG["tools-hub"].filename}`;
  }

  // 4. Game routes (/games/:slug or /games/logic/:slug)
  if (cleanPath.startsWith("/games/") || cleanPath.startsWith("/games/logic/")) {
    let gameSlug = cleanPath.replace(/^\/games\/(?:logic\/)?/, "").split("/")[0];
    // Normalize game alias slugs
    if (gameSlug === "wordle") gameSlug = "orbit-lexicon";
    if (gameSlug === "hive" || gameSlug === "spelling-bee") gameSlug = "the-hive";
    if (gameSlug === "crossword") gameSlug = "mini-crossword";
    if (gameSlug === "theme-threads") gameSlug = "strands";

    const gameDef = GAMES_OG[gameSlug];
    if (gameDef) {
      return `${BASE_URL}${OG_IMAGE_DIR}/${gameDef.filename}`;
    }
  }

  // 5. Games hub (/games)
  if (cleanPath === "/games" || cleanPath === "/games/") {
    return `${BASE_URL}${OG_IMAGE_DIR}/${GAMES_OG["games-hub"].filename}`;
  }

  // 6. Default fallback for home (/), privacy, terms, contact, etc.
  return `${BASE_URL}${OG_IMAGE_DIR}/${DEFAULT_OG.filename}`;
}
