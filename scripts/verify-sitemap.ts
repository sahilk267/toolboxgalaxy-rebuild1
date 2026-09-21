import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../client/src/data/toolRegistry";
import { logicGames } from "../client/src/pages/Games";
import { GUIDES } from "../shared/guidesData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = path.resolve(__dirname, "../client/public/sitemap.xml");
const BASE_URL = "https://toolboxgalaxy.com";

let failures = 0;
function assert(condition: unknown, name: string) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL · ${name}`);
  } else {
    console.log(`PASS · ${name}`);
  }
}

// Read and validate physical presence
assert(fs.existsSync(SITEMAP_PATH), `Sitemap file exists at ${SITEMAP_PATH}`);

const xmlContent = fs.existsSync(SITEMAP_PATH) ? fs.readFileSync(SITEMAP_PATH, "utf-8") : "";
assert(xmlContent.length > 500, "Sitemap XML contains substantive content");
assert(xmlContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "Sitemap has standard XML declaration");
assert(xmlContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), "Sitemap includes sitemaps.org namespace");

// Extract all <loc> entries
const locMatches = Array.from(xmlContent.matchAll(/<loc>(.*?)<\/loc>/g)).map((m) => m[1].trim());
const uniqueLocs = new Set(locMatches);

assert(locMatches.length > 0, `Extracted ${locMatches.length} <loc> entries from sitemap`);
assert(uniqueLocs.size === locMatches.length, `Sitemap has zero duplicate URLs (${uniqueLocs.size} unique / ${locMatches.length} total)`);

// 1. Core and Legal Routes
const requiredCoreRoutes = [
  `${BASE_URL}/`,
  `${BASE_URL}/studio`,
  `${BASE_URL}/tools`,
  `${BASE_URL}/guides`,
  `${BASE_URL}/games`,
  `${BASE_URL}/privacy`,
  `${BASE_URL}/terms`,
  `${BASE_URL}/contact`,
];

const missingCore = requiredCoreRoutes.filter((url) => !uniqueLocs.has(url));
assert(
  missingCore.length === 0,
  missingCore.length === 0
    ? "All required core and legal routes (/, /studio, /tools, /guides, /games, /privacy, /terms, /contact) are present in sitemap"
    : `Missing core routes: ${missingCore.join(", ")}`
);

// 2. Arcade Games
assert(
  uniqueLocs.has(`${BASE_URL}/games/orbit-dash`),
  "Orbit Dash arcade route (/games/orbit-dash) is present in sitemap"
);
assert(
  uniqueLocs.has(`${BASE_URL}/games/tank-evolution`),
  "Diep Tank evolution arcade route (/games/tank-evolution) is present in sitemap"
);
assert(
  uniqueLocs.has(`${BASE_URL}/games/surviv-io`),
  "Surviv Battle Royale route (/games/surviv-io) is present in sitemap"
);
assert(
  uniqueLocs.has(`${BASE_URL}/games/krunker`),
  "Krunker Voxel FPS arcade route (/games/krunker) is present in sitemap"
);

// 3. Logic Games validation against Games.tsx logicGames
const missingGameSlugs: string[] = [];
for (const game of logicGames) {
  const expectedUrl = `${BASE_URL}/games/${game.slug}`;
  if (!uniqueLocs.has(expectedUrl)) {
    missingGameSlugs.push(game.slug);
  }
}

assert(
  missingGameSlugs.length === 0,
  missingGameSlugs.length === 0
    ? `All ${logicGames.length} logic games from Games.tsx logicGames are present in sitemap`
    : `Missing game slugs in sitemap: ${missingGameSlugs.join(", ")}`
);

// 4. Tools validation against toolRegistry.ts tools
const missingToolSlugs: string[] = [];
for (const tool of tools) {
  const expectedUrl = `${BASE_URL}/tools/${tool.slug}`;
  if (!uniqueLocs.has(expectedUrl)) {
    missingToolSlugs.push(tool.slug);
  }
}

assert(
  missingToolSlugs.length === 0,
  missingToolSlugs.length === 0
    ? `All ${tools.length} registered tools from toolRegistry.ts are present in sitemap`
    : `Missing tool slugs in sitemap: ${missingToolSlugs.join(", ")}`
);

// 5. Technical Guides validation against GUIDES
const missingGuideSlugs: string[] = [];
for (const guide of GUIDES) {
  const expectedUrl = `${BASE_URL}/guides/${guide.slug}`;
  if (!uniqueLocs.has(expectedUrl)) {
    missingGuideSlugs.push(guide.slug);
  }
}

assert(
  missingGuideSlugs.length === 0,
  missingGuideSlugs.length === 0
    ? `All ${GUIDES.length} technical guides from guidesData.ts are present in sitemap`
    : `Missing guide slugs in sitemap: ${missingGuideSlugs.join(", ")}`
);

// Summary & exit code
if (failures > 0) {
  console.error(`\n${failures} sitemap verification check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll sitemap verification checks passed successfully (${uniqueLocs.size} total URLs verified).`);
