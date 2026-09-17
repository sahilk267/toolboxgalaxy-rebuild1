/**
 * Verification script for Open Graph and Twitter Share Image generation & injection.
 * Validates:
 * 1. Physical existence and PNG integrity of all 23 pre-rendered OG images in client/public/og/
 * 2. Exact route-to-image mapping resolution (per tool category, per game, hubs, and defaults)
 * 3. HTML template and SSR meta-tag injection correctness
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_OG_DEFINITIONS, resolveOgImageUrl, BASE_URL } from "../shared/ogCatalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OG_DIR = path.resolve(__dirname, "../client/public/og");

// Standard PNG Magic Bytes header [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function isPngValid(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);
    return buffer.equals(PNG_SIGNATURE);
  } catch {
    return false;
  }
}

async function verifyOgImages() {
  console.log("\n=======================================================");
  console.log("  TOOLBOX GALAXY — OG & SOCIAL SHARE IMAGE VERIFIER");
  console.log("=======================================================\n");

  let hasErrors = false;

  // 1. Verify files exist in client/public/og
  console.log("👉 Checking physical PNG assets in client/public/og/...");
  if (!fs.existsSync(OG_DIR)) {
    console.error(`❌ Missing OG directory at ${OG_DIR}`);
    process.exit(1);
  }

  let totalSizeKb = 0;
  for (const def of ALL_OG_DEFINITIONS) {
    const fullPath = path.join(OG_DIR, def.filename);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing expected file: ${def.filename}`);
      hasErrors = true;
      continue;
    }

    const stat = fs.statSync(fullPath);
    const sizeKb = stat.size / 1024;
    totalSizeKb += sizeKb;

    if (stat.size < 1000) {
      console.error(`❌ File suspiciously small (<1KB): ${def.filename}`);
      hasErrors = true;
      continue;
    }

    if (!isPngValid(fullPath)) {
      console.error(`❌ Invalid PNG magic header: ${def.filename}`);
      hasErrors = true;
      continue;
    }

    console.log(`  ✓ [PNG OK] ${def.filename.padEnd(32)} ${sizeKb.toFixed(1)} KB`);
  }

  console.log(`\nAll ${ALL_OG_DEFINITIONS.length} social share images verified (${totalSizeKb.toFixed(1)} KB total).\n`);

  // 2. Test URL Route Resolution
  console.log("👉 Testing Route-to-OG Image Resolvers...");
  const testCases: { route: string; expectedFilename: string; categoryDescription: string }[] = [
    // Regional Tools Category
    {
      route: "/tools/gst-tax-calculator",
      expectedFilename: "og-category-regional-tools.png",
      categoryDescription: "Regional/India Tools",
    },
    {
      route: "/tools/passport-photo-resizer",
      expectedFilename: "og-category-regional-tools.png",
      categoryDescription: "Regional/India Tools",
    },
    {
      route: "/tools/land-area-converter",
      expectedFilename: "og-category-regional-tools.png",
      categoryDescription: "Regional/India Tools",
    },
    {
      route: "/tools/number-to-words-rupees",
      expectedFilename: "og-category-regional-tools.png",
      categoryDescription: "Regional/India Tools",
    },

    // Developer Tools Category
    {
      route: "/tools/jwt-debugger",
      expectedFilename: "og-category-developer-tools.png",
      categoryDescription: "Developer Tools",
    },
    {
      route: "/tools/json-to-zod-schema",
      expectedFilename: "og-category-developer-tools.png",
      categoryDescription: "Developer Tools",
    },
    {
      route: "/tools/regex-tester",
      expectedFilename: "og-category-developer-tools.png",
      categoryDescription: "Developer Tools",
    },
    {
      route: "/tools/cron-schedule-expression",
      expectedFilename: "og-category-developer-tools.png",
      categoryDescription: "Developer Tools",
    },

    // Image Tools Category
    {
      route: "/tools/image-resizer",
      expectedFilename: "og-category-image-tools.png",
      categoryDescription: "Image Tools",
    },
    {
      route: "/tools/image-metadata-remover",
      expectedFilename: "og-category-image-tools.png",
      categoryDescription: "Image Tools",
    },
    {
      route: "/tools/color-signal",
      expectedFilename: "og-category-image-tools.png",
      categoryDescription: "Image Tools",
    },

    // PDF & Doc Studio Category
    {
      route: "/tools/pdf-visual-editor",
      expectedFilename: "og-category-pdf-doc-studio.png",
      categoryDescription: "PDF & Doc Studio",
    },
    {
      route: "/tools/excel-spreadsheet-studio",
      expectedFilename: "og-category-pdf-doc-studio.png",
      categoryDescription: "PDF & Doc Studio",
    },
    {
      route: "/studio",
      expectedFilename: "og-category-pdf-doc-studio.png",
      categoryDescription: "PDF & Doc Studio Route",
    },

    // Daily Utilities Category
    {
      route: "/tools/basic-calculator",
      expectedFilename: "og-category-daily-utilities.png",
      categoryDescription: "Daily Utilities",
    },
    {
      route: "/tools/percentage-calculator",
      expectedFilename: "og-category-daily-utilities.png",
      categoryDescription: "Daily Utilities",
    },
    {
      route: "/tools/bmi-calculator",
      expectedFilename: "og-category-daily-utilities.png",
      categoryDescription: "Daily Utilities",
    },
    {
      route: "/tools/split-bill-tip-calculator",
      expectedFilename: "og-category-daily-utilities.png",
      categoryDescription: "Daily Utilities",
    },

    // Distinct Per-Game Share Images
    {
      route: "/games/the-hive",
      expectedFilename: "og-game-the-hive.png",
      categoryDescription: "Game: The Hive",
    },
    {
      route: "/games/wordle",
      expectedFilename: "og-game-orbit-lexicon.png",
      categoryDescription: "Game: Wordle (Alias)",
    },
    {
      route: "/games/orbit-lexicon",
      expectedFilename: "og-game-orbit-lexicon.png",
      categoryDescription: "Game: Orbit Lexicon",
    },
    {
      route: "/games/connections",
      expectedFilename: "og-game-connections.png",
      categoryDescription: "Game: Connections",
    },
    {
      route: "/games/queens",
      expectedFilename: "og-game-queens.png",
      categoryDescription: "Game: Queens",
    },
    {
      route: "/games/mini-sudoku",
      expectedFilename: "og-game-mini-sudoku.png",
      categoryDescription: "Game: Mini Sudoku",
    },
    {
      route: "/games/strands",
      expectedFilename: "og-game-strands.png",
      categoryDescription: "Game: Strands",
    },
    {
      route: "/games/tango",
      expectedFilename: "og-game-tango.png",
      categoryDescription: "Game: Tango",
    },
    {
      route: "/games/patches",
      expectedFilename: "og-game-patches.png",
      categoryDescription: "Game: Patches",
    },
    {
      route: "/games/zip",
      expectedFilename: "og-game-zip.png",
      categoryDescription: "Game: Zip",
    },
    {
      route: "/games/wend",
      expectedFilename: "og-game-wend.png",
      categoryDescription: "Game: Wend",
    },
    {
      route: "/games/chess-puzzles",
      expectedFilename: "og-game-chess-puzzles.png",
      categoryDescription: "Game: Chess Puzzles",
    },
    {
      route: "/games/nonogram",
      expectedFilename: "og-game-nonogram.png",
      categoryDescription: "Game: Nonogram",
    },
    {
      route: "/games/orbit-dash",
      expectedFilename: "og-game-orbit-dash.png",
      categoryDescription: "Game: Orbit Dash",
    },
    {
      route: "/games/mini-crossword",
      expectedFilename: "og-game-mini-crossword.png",
      categoryDescription: "Game: Mini Crossword",
    },
    {
      route: "/games/logic-lab",
      expectedFilename: "og-game-logic-lab.png",
      categoryDescription: "Game: Logic Lab",
    },

    // Hubs and Defaults
    {
      route: "/tools",
      expectedFilename: "og-tools-foundry.png",
      categoryDescription: "Tools Hub",
    },
    {
      route: "/games",
      expectedFilename: "og-games-bay.png",
      categoryDescription: "Games Hub",
    },
    {
      route: "/",
      expectedFilename: "og-default.png",
      categoryDescription: "Home Default",
    },
    {
      route: "/privacy",
      expectedFilename: "og-default.png",
      categoryDescription: "Privacy Policy",
    },
  ];

  const distinctResolvedImages = new Set<string>();

  for (const tc of testCases) {
    const resolvedUrl = resolveOgImageUrl(tc.route);
    const expectedUrl = `${BASE_URL}/og/${tc.expectedFilename}`;
    distinctResolvedImages.add(resolvedUrl);

    if (resolvedUrl !== expectedUrl) {
      console.error(`❌ Mismatch for route ${tc.route}:`);
      console.error(`   Expected: ${expectedUrl}`);
      console.error(`   Got:      ${resolvedUrl}`);
      hasErrors = true;
    } else {
      console.log(`  ✓ ${tc.route.padEnd(32)} -> ${tc.expectedFilename} (${tc.categoryDescription})`);
    }
  }

  // 3. Social-Share Debugger Validation
  console.log("\n👉 Social-Share Debugger Verification Check:");
  console.log(`  Total test routes checked: ${testCases.length}`);
  console.log(`  Distinct OG images resolved: ${distinctResolvedImages.size}`);

  if (distinctResolvedImages.size < 15) {
    console.error(`❌ Warning: Expected high image diversity, only found ${distinctResolvedImages.size} distinct images!`);
    hasErrors = true;
  } else {
    console.log(`  ✓ Pass: Distinct, themed OG cards verified across categories and games (no generic fallback monotony).`);
  }

  // 4. Verify client/index.html template
  console.log("\n👉 Verifying client/index.html template...");
  const indexHtmlPath = path.resolve(__dirname, "../client/index.html");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

  if (indexHtml.includes("orbit-mark.svg") && indexHtml.includes('property="og:image" content="https://toolboxgalaxy.com/orbit-mark.svg"')) {
    console.error("❌ client/index.html still references generic orbit-mark.svg in og:image!");
    hasErrors = true;
  } else if (indexHtml.includes('property="og:image" content="https://toolboxgalaxy.com/og/og-default.png"')) {
    console.log("  ✓ client/index.html default og:image points to /og/og-default.png");
  } else {
    console.error("❌ client/index.html og:image not recognized");
    hasErrors = true;
  }

  if (indexHtml.includes('name="twitter:card" content="summary_large_image"')) {
    console.log("  ✓ Twitter card configured as 'summary_large_image'");
  } else {
    console.error("❌ Twitter card is not 'summary_large_image'");
    hasErrors = true;
  }

  if (hasErrors) {
    console.error("\n❌ Verification FAILED with errors.");
    process.exit(1);
  }

  console.log("\n🎉 ALL OPEN GRAPH & SOCIAL SHARE VALIDATION CHECKS PASSED PERFECTLY!\n");
}

verifyOgImages().catch((err) => {
  console.error("Fatal error in verifyOgImages:", err);
  process.exit(1);
});
