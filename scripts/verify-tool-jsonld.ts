/**
 * Verification script for Per-Tool JSON-LD Structured Data (Schema.org WebApplication).
 * 
 * Verifies:
 * 1. Offline schema generation for all 53 tools in toolRegistry/toolsData
 * 2. Strict Schema.org and Google Rich Snippet compliance (required fields, offers, types, categories)
 * 3. Server HTTP response verification for tool routes:
 *    - Exactly TWO valid, separate <script type="application/ld+json"> blocks present
 *    - Block 1 = Site-wide WebApplication (untouched)
 *    - Block 2 = Tool-specific WebApplication matching slug, name, description, category, and free offer
 * 4. Non-tool routes (/, /games/queens, /tools) have only ONE JSON-LD block (site-wide only)
 */

import http from "node:http";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tools } from "../shared/toolsData";
import { buildToolJsonLd, renderToolJsonLdScript } from "../shared/toolJsonLd";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PORT = 3560;
let serverProcess: ChildProcess | null = null;

async function checkPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function fetchRoute(routePath: string): Promise<{ statusCode: number; html: string }> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${TEST_PORT}${routePath}`, (res) => {
      let html = "";
      res.on("data", (chunk) => (html += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode || 200, html }));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function extractAllJsonLdBlocks(html: string): string[] {
  const matches: string[] = [];
  const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

// Google Rich Results structured data validation rules for WebApplication / SoftwareApplication
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateSoftwareApplicationSchema(data: any, expectedSlug?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data["@context"] !== "https://schema.org" && data["@context"] !== "http://schema.org") {
    errors.push(`Invalid @context: expected 'https://schema.org', got '${data["@context"]}'`);
  }

  const validTypes = ["WebApplication", "SoftwareApplication"];
  if (!validTypes.includes(data["@type"])) {
    errors.push(`Invalid @type: expected 'WebApplication' or 'SoftwareApplication', got '${data["@type"]}'`);
  }

  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.push(`Missing or invalid 'name': '${data.name}'`);
  }

  if (!data.description || typeof data.description !== "string" || data.description.trim().length < 5) {
    errors.push(`Missing or invalid 'description': '${data.description}'`);
  }

  if (!data.url || typeof data.url !== "string" || !data.url.startsWith("https://toolboxgalaxy.com")) {
    errors.push(`Missing or invalid 'url': '${data.url}'`);
  } else if (expectedSlug && data.url !== `https://toolboxgalaxy.com/tools/${expectedSlug}`) {
    errors.push(`URL mismatch: expected 'https://toolboxgalaxy.com/tools/${expectedSlug}', got '${data.url}'`);
  }

  if (!data.applicationCategory || typeof data.applicationCategory !== "string") {
    errors.push(`Missing or invalid 'applicationCategory': '${data.applicationCategory}'`);
  }

  // Google Rich Snippet requires either offers or aggregateRating
  if (!data.offers && !data.aggregateRating) {
    errors.push("Missing required Google Rich Snippet property: 'offers' or 'aggregateRating'");
  }

  if (data.offers) {
    if (data.offers["@type"] !== "Offer") {
      errors.push(`Invalid offers.@type: expected 'Offer', got '${data.offers["@type"]}'`);
    }
    if (data.offers.price !== "0" && typeof data.offers.price !== "number") {
      errors.push(`Invalid offers.price: expected '0', got '${data.offers.price}'`);
    }
    if (data.offers.priceCurrency !== "USD") {
      errors.push(`Invalid offers.priceCurrency: expected 'USD', got '${data.offers.priceCurrency}'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function runVerification() {
  console.log("\n=======================================================");
  console.log("  TOOLBOX GALAXY — TOOL JSON-LD STRUCTURED DATA AUDIT");
  console.log("=======================================================\n");

  let totalFailures = 0;

  // -------------------------------------------------------------
  // TEST 1: Schema generation & validity for all 53 tools
  // -------------------------------------------------------------
  console.log(`👉 1. Auditing structured data schemas across all ${tools.length} catalog tools...`);
  let validToolCount = 0;

  for (const tool of tools) {
    const jsonLd = buildToolJsonLd(tool);
    const validation = validateSoftwareApplicationSchema(jsonLd, tool.slug);

    if (!validation.valid) {
      console.error(`❌ Validation failed for tool ${tool.slug}:`, validation.errors);
      totalFailures++;
    } else {
      validToolCount++;
    }

    // Check script rendering safety
    const scriptTag = renderToolJsonLdScript(tool);
    if (!scriptTag.startsWith('<script type="application/ld+json">') || !scriptTag.endsWith("</script>")) {
      console.error(`❌ Script tag formatting error for ${tool.slug}`);
      totalFailures++;
    }
  }

  console.log(`  ✓ Successfully audited all ${validToolCount}/${tools.length} tool schemas against Schema.org WebApplication specs.`);

  // -------------------------------------------------------------
  // TEST 2: Start test server and verify HTTP response injection
  // -------------------------------------------------------------
  console.log("\n👉 2. Starting test server on port " + TEST_PORT + " to verify live SSR injection...");
  serverProcess = spawn("npx", ["tsx", path.resolve(__dirname, "../server/index.ts")], {
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: "production" },
    stdio: "pipe",
  });

  let serverUp = false;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkPortOpen(TEST_PORT)) {
      serverUp = true;
      break;
    }
  }

  if (!serverUp) {
    console.error("❌ Failed to start test server on port " + TEST_PORT);
    process.exit(1);
  }
  console.log("  ✓ Test server active and listening on port " + TEST_PORT);

  // Spot-check at least 5 diverse tool pages
  const toolSpotChecks = [
    { slug: "gst-tax-calculator", category: "FinanceApplication" },
    { slug: "passport-photo-resizer", category: "DesignApplication" },
    { slug: "jwt-debugger", category: "DeveloperApplication" },
    { slug: "basic-calculator", category: "UtilitiesApplication" },
    { slug: "bmi-calculator", category: "HealthApplication" },
    { slug: "json-to-zod-schema", category: "DeveloperApplication" },
    { slug: "image-resizer", category: "DesignApplication" },
  ];

  console.log(`\n👉 3. Testing live HTTP responses for ${toolSpotChecks.length} tool pages...`);

  for (const check of toolSpotChecks) {
    const route = `/tools/${check.slug}`;
    const response = await fetchRoute(route);

    if (response.statusCode !== 200) {
      console.error(`❌ HTTP ${response.statusCode} for ${route}`);
      totalFailures++;
      continue;
    }

    const blocks = extractAllJsonLdBlocks(response.html);

    if (blocks.length !== 2) {
      console.error(`❌ Expected exactly 2 JSON-LD blocks on ${route}, found ${blocks.length}`);
      totalFailures++;
      continue;
    }

    // Block 1: Site-wide WebApplication
    let siteWideData: any = null;
    try {
      siteWideData = JSON.parse(blocks[0]);
    } catch (e: any) {
      console.error(`❌ Block 1 (site-wide) failed JSON.parse on ${route}: ${e.message}`);
      totalFailures++;
      continue;
    }

    if (siteWideData.name !== "Toolbox Galaxy" || siteWideData.url !== "https://toolboxgalaxy.com") {
      console.error(`❌ Block 1 is not the site-wide WebApplication on ${route}`);
      totalFailures++;
      continue;
    }

    // Block 2: Per-tool WebApplication
    let toolData: any = null;
    try {
      toolData = JSON.parse(blocks[1]);
    } catch (e: any) {
      console.error(`❌ Block 2 (tool-specific) failed JSON.parse on ${route}: ${e.message}`);
      totalFailures++;
      continue;
    }

    const toolValidation = validateSoftwareApplicationSchema(toolData, check.slug);
    if (!toolValidation.valid) {
      console.error(`❌ Block 2 schema validation error on ${route}:`, toolValidation.errors);
      totalFailures++;
      continue;
    }

    if (toolData.applicationCategory !== check.category) {
      console.error(`❌ Expected applicationCategory '${check.category}', got '${toolData.applicationCategory}' on ${route}`);
      totalFailures++;
      continue;
    }

    console.log(`  ✓ [2 Valid JSON-LD Blocks] ${route.padEnd(30)} "${toolData.name}" (${toolData.applicationCategory})`);
  }

  // -------------------------------------------------------------
  // TEST 4: Verify non-tool routes have only ONE JSON-LD block
  // -------------------------------------------------------------
  console.log("\n👉 4. Verifying non-tool routes maintain exactly 1 site-wide JSON-LD block...");
  const nonToolRoutes = ["/", "/games", "/games/queens", "/tools", "/privacy"];

  for (const route of nonToolRoutes) {
    const response = await fetchRoute(route);
    const blocks = extractAllJsonLdBlocks(response.html);

    if (blocks.length !== 1) {
      console.error(`❌ Expected exactly 1 JSON-LD block on non-tool route ${route}, found ${blocks.length}`);
      totalFailures++;
      continue;
    }

    try {
      const parsed = JSON.parse(blocks[0]);
      if (parsed.name !== "Toolbox Galaxy") {
        console.error(`❌ Unexpected schema on ${route}`);
        totalFailures++;
        continue;
      }
    } catch (e: any) {
      console.error(`❌ JSON parse error on ${route}: ${e.message}`);
      totalFailures++;
      continue;
    }

    console.log(`  ✓ [1 Site-Wide JSON-LD Block] ${route.padEnd(20)} intact`);
  }

  if (totalFailures > 0) {
    console.error(`\n❌ Auditing failed with ${totalFailures} error(s).\n`);
    process.exit(1);
  }

  console.log("\n🎉 ALL JSON-LD STRUCTURED DATA AUDIT CHECKS PASSED PERFECTLY!\n");
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
  process.exit(0);
}

runVerification()
  .catch((err) => {
    console.error("Fatal error during JSON-LD verification:", err);
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
    process.exit(1);
  });
