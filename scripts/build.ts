import { build } from "vite";
import { generateSitemapXml } from "./generate-sitemap";
import { generateLlmsFullContent } from "./generate-llms-full";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = path.resolve(__dirname, "../client/public/sitemap.xml");
const LLMS_FULL_PATH = path.resolve(__dirname, "../client/public/llms-full.txt");

async function run() {
  console.log("[Build] Generating sitemap with recent lastmod dates...");
  const { xml, totalCount } = generateSitemapXml();
  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
  console.log(`[Build] Sitemap generated with ${totalCount} URLs.`);

  console.log("[Build] Generating comprehensive llms-full.txt machine specification...");
  const llmsFullContent = generateLlmsFullContent();
  fs.writeFileSync(LLMS_FULL_PATH, llmsFullContent, "utf-8");
  console.log(`[Build] llms-full.txt generated (${llmsFullContent.length} bytes).`);

  console.log("[Build] Running Vite production build with memory optimizations...");
  await build({
    configFile: path.resolve(__dirname, "../vite.config.ts"),
    build: {
      minify: "esbuild",
      sourcemap: false,
    },
  });
  console.log("[Build] Vite production build complete.");
}

run().catch((err) => {
  console.error("[Build] Build failed:", err);
  process.exit(1);
});
