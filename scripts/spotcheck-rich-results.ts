/**
 * Spot-checks tool pages against Google Rich Results & Schema.org WebApplication requirements.
 */
import http from "node:http";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3570;

async function checkPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => resolve(res.statusCode === 200));
    req.on("error", () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function fetchRoute(routePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${routePath}`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(body));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function extractJsonLdBlocks(html: string): any[] {
  const blocks: any[] = [];
  const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    blocks.push(JSON.parse(match[1].trim()));
  }
  return blocks;
}

async function main() {
  console.log("===============================================================");
  console.log(" GOOGLE RICH RESULTS & SCHEMA.ORG SPOT-CHECK (3 TOOL PAGES)");
  console.log("===============================================================\n");

  const server: ChildProcess = spawn("npx", ["tsx", path.resolve(__dirname, "../server/index.ts")], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
    stdio: "pipe",
  });

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    if (await checkPortOpen(PORT)) break;
  }

  const pagesToTest = [
    "/tools/gst-tax-calculator",
    "/tools/jwt-debugger",
    "/tools/passport-photo-resizer",
  ];

  for (const page of pagesToTest) {
    console.log(`\n🔍 Spot-checking route: ${page}`);
    const html = await fetchRoute(page);
    const blocks = extractJsonLdBlocks(html);

    console.log(`  ✓ Number of JSON-LD blocks found: ${blocks.length}`);
    if (blocks.length !== 2) {
      throw new Error(`Expected 2 blocks on ${page}, got ${blocks.length}`);
    }

    console.log("\n  [Block 1: Site-wide WebApplication]");
    console.log(`    @type: ${blocks[0]["@type"]}`);
    console.log(`    name:  ${blocks[0].name}`);
    console.log(`    url:   ${blocks[0].url}`);

    console.log("\n  [Block 2: Per-Tool WebApplication]");
    console.log(`    @context:            ${blocks[1]["@context"]}`);
    console.log(`    @type:               ${blocks[1]["@type"]}`);
    console.log(`    name:                ${blocks[1].name}`);
    console.log(`    description:         ${blocks[1].description}`);
    console.log(`    url:                 ${blocks[1].url}`);
    console.log(`    applicationCategory: ${blocks[1].applicationCategory}`);
    console.log(`    operatingSystem:     ${blocks[1].operatingSystem}`);
    console.log(`    browserRequirements: ${blocks[1].browserRequirements}`);
    console.log(`    offers:              ${JSON.stringify(blocks[1].offers)}`);
    console.log(`    creator:             ${JSON.stringify(blocks[1].creator)}`);

    // Schema validations
    if (blocks[1]["@context"] !== "https://schema.org") throw new Error("Invalid @context");
    if (blocks[1]["@type"] !== "WebApplication") throw new Error("Invalid @type");
    if (!blocks[1].name) throw new Error("Missing name");
    if (!blocks[1].description) throw new Error("Missing description");
    if (!blocks[1].url.startsWith("https://toolboxgalaxy.com/tools/")) throw new Error("Invalid URL format");
    if (!blocks[1].applicationCategory) throw new Error("Missing applicationCategory");
    if (blocks[1].offers.price !== "0" || blocks[1].offers.priceCurrency !== "USD") {
      throw new Error("Invalid offers pricing");
    }

    console.log(`  ✅ Passed Schema.org / Google Rich Snippet compliance for ${page}!`);
  }

  console.log("\n🎉 Spot-check completed successfully for all 3 tool pages!\n");
  server.kill("SIGTERM");
  process.exit(0);
}

main().catch((err) => {
  console.error("Spot-check failure:", err);
  process.exit(1);
});
