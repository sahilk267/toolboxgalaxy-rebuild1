import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destMjs = path.resolve(__dirname, "../client/public/pdf.worker.min.mjs");
const destJs = path.resolve(__dirname, "../client/public/pdf.worker.min.js");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, destMjs);
  fs.copyFileSync(src, destJs);
  console.log("[PDF Worker] Synchronized client/public/pdf.worker.min.mjs and pdf.worker.min.js from pdfjs-dist");
} else {
  console.warn("[PDF Worker] Warning: node_modules/pdfjs-dist/build/pdf.worker.min.mjs not found");
}
