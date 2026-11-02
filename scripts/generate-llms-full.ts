import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../shared/toolsData";
import { GAMES_CATALOG } from "../shared/seoCatalog";
import { GUIDES } from "../shared/guidesData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../client/public/llms-full.txt");

export function generateLlmsFullContent(): string {
  let content = `# Toolbox Galaxy — Full Knowledge Base & Machine Discovery Specification (llms-full.txt)

> Toolbox Galaxy is a 100% in-browser, privacy-first technical workbench and daily NYT-style logic puzzles platform. All tools execute locally inside device WebAssembly, Web Workers, or JavaScript memory. Files and user inputs never touch external cloud servers. Zero tracking, zero telemetry, zero advertisements.

- **Canonical URL**: https://toolboxgalaxy.com
- **Maintainer**: Aaditech Solution (Mohd Aziz Shaikh)
- **Support**: support@toolboxgalaxy.com | +91-9876543210
- **Profiles**: https://www.linkedin.com/in/mohdazizshaikh
- **Agent Protocols**:
  - LLMs Discovery: https://toolboxgalaxy.com/llms.txt
  - Full LLMs Spec: https://toolboxgalaxy.com/llms-full.txt
  - MCP Server Card (SEP-1649): https://toolboxgalaxy.com/.well-known/mcp/server-card.json
  - WebMCP In-Browser Tools: navigator.modelContext.registerTool()
  - Markdown Representation: https://toolboxgalaxy.com/index.md (Accept: text/markdown)
  - Sitemap: https://toolboxgalaxy.com/sitemap.xml

---

## 1. Core Platform Workbenches

- [PDF & Document Studio](https://toolboxgalaxy.com/studio): Local in-browser PDF manipulation studio powered by pdf-lib and PDF.js. Supports page merging, splitting, rotation, visual signing, document redaction, page reordering, and OCR conversion with 100% client RAM sandboxing.
- [Tools Foundry](https://toolboxgalaxy.com/tools): Complete foundry of 61+ verified developer utilities, formatters, cryptography tools, unit converters, and calculators.
- [Daily Logic Puzzles Hub](https://toolboxgalaxy.com/games): Daily puzzle games inspired by classic NYT Games, LinkedIn logic challenges, and arcade classics.
- [Technical Knowledge Guides](https://toolboxgalaxy.com/guides): Comprehensive technical guides on client-side security, zero-upload PDF workflows, and browser-first utility execution.

---

## 2. Complete Tools Catalog (${tools.length} Verified In-Browser Utilities)

`;

  // Group tools by category
  const byCategory = new Map<string, typeof tools>();
  for (const t of tools) {
    const cat = t.category || "General Utilities";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  }

  for (const [category, catTools] of byCategory.entries()) {
    content += `### ${category} (${catTools.length} Utilities)\n\n`;
    for (const t of catTools) {
      content += `- [${t.name}](https://toolboxgalaxy.com/tools/${t.slug}): ${t.description}\n`;
    }
    content += `\n`;
  }

  content += `---

## 3. Daily Logic Puzzles & Arcade Games (${GAMES_CATALOG.length} Games)

`;

  for (const g of GAMES_CATALOG) {
    content += `- [${g.title}](https://toolboxgalaxy.com/games/${g.slug}): ${g.description} (${g.genre}, daily reset at local midnight).\n`;
  }

  content += `\n---

## 4. Technical Reference Guides (${GUIDES.length} Authoritative Articles)

`;

  for (const guide of GUIDES) {
    content += `- [${guide.title}](https://toolboxgalaxy.com/guides/${guide.slug}): ${guide.summary} (${guide.readingTimeMinutes} min read, Category: ${guide.category}).\n`;
  }

  content += `\n---

## 5. Privacy & Architecture Guarantees

1. **Zero-Upload Execution**: All file handling, PDF rasterization, image resizing, and cryptographic operations run exclusively inside local browser memory.
2. **Offline Capable**: Progressive Web App (PWA) with complete offline asset caching via Service Worker.
3. **No Advertising or Surveillance**: No third-party ad networks, no cross-site user trackers, no telemetry SDKs.
4. **Machine Readability**: Full Schema.org JSON-LD structured data (@graph covering Organization, WebSite, WebApplication, FAQPage, ItemList), RFC 8288 Link headers, and Markdown content negotiation.
`;

  return content;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const content = generateLlmsFullContent();
  fs.writeFileSync(OUTPUT_PATH, content, "utf-8");
  console.log(`Successfully generated client/public/llms-full.txt (${content.length} bytes, ${tools.length} tools, ${GAMES_CATALOG.length} games, ${GUIDES.length} guides).`);
}
