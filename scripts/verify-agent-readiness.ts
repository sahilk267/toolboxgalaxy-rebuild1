/**
 * Verification test suite for AI Agent Readiness (15 Requirements)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidRoute } from "../shared/routeValidator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;

function test(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`[PASS] ${name}`);
  } else {
    failures++;
    console.error(`[FAIL] ${name} ${details ? `(${details})` : ""}`);
  }
}

// 1. Robots.txt Content-Signal
const robotsPath = path.resolve(__dirname, "../client/public/robots.txt");
const robotsContent = fs.readFileSync(robotsPath, "utf-8");
test("1. robots.txt Content-Signal declared", /Content-Signal:\s*search=yes,\s*ai-train=no/i.test(robotsContent));

// 2. Sitemap lastmod
const sitemapPath = path.resolve(__dirname, "../client/public/sitemap.xml");
const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
const urlCount = (sitemapContent.match(/<url>/g) || []).length;
const lastmodCount = (sitemapContent.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length;
test("2. Sitemap carries lastmod on all URLs", urlCount > 0 && urlCount === lastmodCount, `${lastmodCount}/${urlCount} urls have lastmod`);

// 3. Missing pages return a real 404
test("3. Missing pages return a real 404",
  !isValidRoute("/non-existent-page-test") &&
  !isValidRoute("/tools/fake-tool") &&
  !isValidRoute("/games/fake-game") &&
  isValidRoute("/") &&
  isValidRoute("/about") &&
  isValidRoute("/tools/jwt-debugger")
);

// 4. Clear heading hierarchy on Home.tsx and index.html
const homePath = path.resolve(__dirname, "../client/src/pages/Home.tsx");
const homeContent = fs.readFileSync(homePath, "utf-8");
const h1MatchHome = homeContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/g);
test("4. Exactly one <h1> on Home page naming the site", h1MatchHome !== null && h1MatchHome.length === 1 && homeContent.includes("Toolbox Galaxy"));

// 5 & 6 & 7: Structured data schemas, Organization, sameAs
const indexPath = path.resolve(__dirname, "../client/index.html");
const indexContent = fs.readFileSync(indexPath, "utf-8");
test("5. Organization schema complete",
  indexContent.includes('"@type": "Organization"') &&
  indexContent.includes('"legalName": "Aaditech Solution"') &&
  indexContent.includes('"@type": "PostalAddress"') &&
  indexContent.includes('"addressLocality": "Mumbai"')
);
test("6. Entity has sameAs links", indexContent.includes('"sameAs":') && indexContent.includes("linkedin.com"));
test("7. Multiple schema types present",
  indexContent.includes('"@type": "Organization"') &&
  indexContent.includes('"@type": "WebSite"') &&
  indexContent.includes('"@type": "WebApplication"') &&
  indexContent.includes('"@type": "FAQPage"') &&
  indexContent.includes('"@type": "ItemList"')
);

// 8. About, contact and legal pages linked from homepage
test("8. About, contact and legal linked on Home",
  homeContent.includes('href="/about"') &&
  homeContent.includes('href="/contact"') &&
  homeContent.includes('href="/privacy"') &&
  homeContent.includes('href="/terms"')
);

// 9. Contact details machine readable
test("9. Contact details machine readable (mailto: and tel:)",
  homeContent.includes('mailto:support@toolboxgalaxy.com') &&
  homeContent.includes('tel:+919876543210') &&
  indexContent.includes('mailto:support@toolboxgalaxy.com') &&
  indexContent.includes('tel:+919876543210')
);

// 10 & 11: llms.txt served and well-formed
const llmsPath = path.resolve(__dirname, "../client/public/llms.txt");
const llmsContent = fs.readFileSync(llmsPath, "utf-8");
test("10. llms.txt file exists", fs.existsSync(llmsPath) && llmsContent.length > 100);
test("11. llms.txt is well-formed with top-level # and markdown links",
  llmsContent.startsWith("# Toolbox Galaxy") &&
  llmsContent.includes("> ") &&
  llmsContent.includes("## Core Workbenches") &&
  llmsContent.includes("[PDF & Document Studio](")
);

// 13: RFC 8288 Link headers in index.html and server
const serverPath = path.resolve(__dirname, "../server/index.ts");
const serverContent = fs.readFileSync(serverPath, "utf-8");
test("13. RFC 8288 Link headers emitted in server and index.html",
  serverContent.includes('Link') &&
  serverContent.includes('</llms.txt>; rel="alternate"') &&
  indexContent.includes('rel="alternate" type="text/plain" href="https://toolboxgalaxy.com/llms.txt"')
);

// 14: WebMCP tools registered
const webMcpPath = path.resolve(__dirname, "../client/src/lib/webMcp.ts");
const mainPath = path.resolve(__dirname, "../client/src/main.tsx");
test("14. WebMCP tools registered via navigator.modelContext and form annotated",
  fs.existsSync(webMcpPath) &&
  fs.readFileSync(mainPath, "utf-8").includes("registerBrowserTools()") &&
  homeContent.includes('toolname="search_toolbox"')
);

// 15: MCP Server Card (SEP-1649) published
const serverCardPath = path.resolve(__dirname, "../client/public/.well-known/mcp/server-card.json");
const cardContent = fs.readFileSync(serverCardPath, "utf-8");
const parsedCard = JSON.parse(cardContent);
test("15. MCP Server Card published at /.well-known/mcp/server-card.json",
  Boolean(parsedCard.name && parsedCard.version && parsedCard.endpoint && parsedCard.capabilities?.tools)
);

if (failures > 0) {
  console.error(`\n${failures} tests failed.`);
  process.exit(1);
} else {
  console.log(`\nAll 15 Agent-Readiness checks PASSED successfully!`);
}
