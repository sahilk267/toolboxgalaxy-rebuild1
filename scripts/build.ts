import { build } from "vite";
import { generateSitemapXml } from "./generate-sitemap";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = path.resolve(__dirname, "../client/public/sitemap.xml");

async function run() {
  console.log("[Build] Generating sitemap with recent lastmod dates...");
  const { xml, totalCount } = generateSitemapXml();
  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
  console.log(`[Build] Sitemap generated with ${totalCount} URLs.`);

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
