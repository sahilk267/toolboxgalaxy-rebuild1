import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../client/src/data/toolRegistry";
import { logicGames } from "../client/src/pages/Games";
import { GUIDES } from "../shared/guidesData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = path.resolve(__dirname, "../client/public/sitemap.xml");
const BASE_URL = "https://toolboxgalaxy.com";

interface SitemapEntry {
  loc: string;
  changefreq?: string;
  priority: string;
}

// 1. Core and Legal Static Routes
const coreRoutes: SitemapEntry[] = [
  { loc: `${BASE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${BASE_URL}/studio`, changefreq: "weekly", priority: "0.9" },
  { loc: `${BASE_URL}/tools`, changefreq: "daily", priority: "0.9" },
  { loc: `${BASE_URL}/guides`, changefreq: "daily", priority: "0.9" },
  { loc: `${BASE_URL}/games`, changefreq: "daily", priority: "0.9" },
  { loc: `${BASE_URL}/games/logic-lab`, changefreq: "weekly", priority: "0.8" },
];

const legalRoutes: SitemapEntry[] = [
  { loc: `${BASE_URL}/contact`, priority: "0.5" },
  { loc: `${BASE_URL}/privacy`, priority: "0.4" },
  { loc: `${BASE_URL}/terms`, priority: "0.4" },
];

// 2. Games priority configuration matching existing conventions
function getGameMetadata(slug: string): { priority: string; changefreq: string } {
  if (slug === "strands" || slug === "the-hive") {
    return { priority: "0.95", changefreq: "daily" };
  }
  if (slug === "connections" || slug === "orbit-lexicon" || slug === "mini-crossword") {
    return { priority: "0.9", changefreq: "daily" };
  }
  if (slug === "orbit-dash") {
    return { priority: "0.8", changefreq: "weekly" };
  }
  return { priority: "0.85", changefreq: "daily" };
}

// 3. Tools priority configuration matching existing conventions
function getToolMetadata(slug: string): { priority: string; changefreq?: string } {
  const flagshipDaily = [
    "whatsapp-direct-chat",
    "gst-tax-calculator",
    "passport-photo-resizer",
  ];
  if (flagshipDaily.includes(slug)) {
    return { priority: "0.9", changefreq: "daily" };
  }

  const flagshipWeekly = [
    "pdf-visual-editor",
    "land-area-converter",
    "number-to-words-rupees",
    "pdf-merge-split",
    "images-to-pdf",
    "excel-spreadsheet-studio",
    "word-docx-converter",
  ];
  if (flagshipWeekly.includes(slug)) {
    return { priority: "0.85", changefreq: "weekly" };
  }

  const highUtility = [
    "image-crop-rotate-convert",
    "image-metadata-remover",
    "line-sorter-deduplicator",
    "business-days-calculator",
    "time-zone-meeting-planner",
    "timestamp-converter",
    "text-diff-checker",
    "find-replace-workspace",
    "split-bill-tip-calculator",
    "loan-emi-estimate",
    "work-shift-duration",
    "json-csv-converter",
    "csv-viewer-cleaner",
  ];
  if (highUtility.includes(slug)) {
    return { priority: "0.85", changefreq: "weekly" };
  }

  return { priority: "0.8" };
}

function renderEntry(entry: SitemapEntry): string {
  const lines = [`  <url>`, `    <loc>${entry.loc}</loc>`];
  if (entry.changefreq) {
    lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  }
  lines.push(`    <priority>${entry.priority}</priority>`);
  lines.push(`  </url>`);
  return lines.join("\n");
}

export function generateSitemapXml(): { xml: string; totalCount: number; toolCount: number; gameCount: number } {
  const seenUrls = new Set<string>();

  const register = (entry: SitemapEntry): SitemapEntry => {
    if (seenUrls.has(entry.loc)) {
      throw new Error(`Duplicate URL detected in sitemap generation: ${entry.loc}`);
    }
    seenUrls.add(entry.loc);
    return entry;
  };

  // 1. Process Core
  const registeredCore = coreRoutes.map(register);

  // 2. Process Games: logicGames from Games.tsx + Orbit Dash + Mini Crossword
  const allGameSlugs = Array.from(
    new Set([
      ...logicGames.map((g) => g.slug),
      "orbit-dash",
      "mini-crossword",
    ])
  );

  const gameEntries: SitemapEntry[] = allGameSlugs.map((slug) => {
    const meta = getGameMetadata(slug);
    return register({
      loc: `${BASE_URL}/games/${slug}`,
      changefreq: meta.changefreq,
      priority: meta.priority,
    });
  });

  // 3. Process Tools: all tools from toolRegistry.ts
  const toolEntries: SitemapEntry[] = tools.map((tool) => {
    const meta = getToolMetadata(tool.slug);
    return register({
      loc: `${BASE_URL}/tools/${tool.slug}`,
      changefreq: meta.changefreq,
      priority: meta.priority,
    });
  });

  // 4. Process Technical Guides: all authoritative guides from guidesData.ts
  const guideEntries: SitemapEntry[] = GUIDES.map((guide) => {
    return register({
      loc: `${BASE_URL}/guides/${guide.slug}`,
      changefreq: "weekly",
      priority: "0.85",
    });
  });

  // 5. Process Legal & Contact
  const registeredLegal = legalRoutes.map(register);

  // 6. Construct XML document
  const xmlLines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <!-- Core Routes -->`,
    registeredCore.map(renderEntry).join("\n"),
    ``,
    `  <!-- Verified Logic Puzzles & Games (${gameEntries.length} items) -->`,
    gameEntries.map(renderEntry).join("\n"),
    ``,
    `  <!-- Tools Foundry (${toolEntries.length} items) -->`,
    toolEntries.map(renderEntry).join("\n"),
    ``,
    `  <!-- Technical Guides & Backlink Knowledge Base (${guideEntries.length} items) -->`,
    guideEntries.map(renderEntry).join("\n"),
    ``,
    `  <!-- Legal & Contact -->`,
    registeredLegal.map(renderEntry).join("\n"),
    `</urlset>`,
    ``,
  ];

  const xml = xmlLines.join("\n");
  return {
    xml,
    totalCount: seenUrls.size,
    toolCount: toolEntries.length,
    gameCount: gameEntries.length,
    guideCount: guideEntries.length,
  };
}

// When executed directly as a script
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log("[Sitemap Generator] Generating client/public/sitemap.xml...");
  const { xml, totalCount, toolCount, gameCount, guideCount } = generateSitemapXml();
  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
  console.log(`[Sitemap Generator] Success! Wrote ${totalCount} URLs (${toolCount} tools, ${gameCount} games, ${guideCount} guides) to ${SITEMAP_PATH}`);
}
