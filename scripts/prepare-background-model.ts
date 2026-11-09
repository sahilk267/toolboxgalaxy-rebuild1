/**
 * Prepare same-origin background-removal assets before dev/build.
 * Pinned upstream model revision, no image upload API or remote inference.
 * Uses Node 22 built-in fetch and fs; no credentials are required.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "client", "public");
const MODEL_REVISION = "034e2d884afbab897e10e78fc5bb566b29533fd6";
const MODEL_NAME = "onnx-community/ormbg-ONNX";
const MODEL_DIR = path.join(PUBLIC, "models", MODEL_NAME);
const ORIGIN = "https://huggingface.co/" + MODEL_NAME + "/resolve/" + MODEL_REVISION + "/";
const MODEL_FILES = [
  { path: "config.json", minimum: 5, maximum: 100_000 },
  { path: "preprocessor_config.json", minimum: 5, maximum: 100_000 },
  { path: "onnx/model_uint8.onnx", minimum: 30_000_000, maximum: 60_000_000 },
];

async function hashFile(filename: string): Promise<string> {
  const buffer = await fs.readFile(filename);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function downloadAsset(relative: string, minimum: number, maximum: number) {
  const target = path.join(MODEL_DIR, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    const stat = await fs.stat(target);
    if (stat.size >= minimum && stat.size <= maximum) return;
  } catch { /* not downloaded yet */ }
  const url = ORIGIN + relative;
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok || !response.body) throw new Error("Model fetch failed (" + response.status + "): " + relative);
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) throw new Error("Model host returned HTML for " + relative);
  const tmp = target + ".tmp";
  let bytes = 0;
  try {
    const handle = await fs.open(tmp, "w");
    try {
      for await (const chunk of response.body) {
        bytes += chunk.byteLength;
        if (bytes > maximum) throw new Error("Model file too large: " + relative);
        await handle.write(chunk);
      }
    } finally { await handle.close(); }
    if (bytes < minimum) throw new Error("Incomplete model file: " + relative);
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.rm(tmp, { force: true });
    throw error;
  }
}

async function copyOnnxRuntime() {
  const from = path.join(ROOT, "node_modules", "onnxruntime-web", "dist");
  const to = path.join(PUBLIC, "ai-runtime");
  await fs.mkdir(to, { recursive: true });
  const names = await fs.readdir(from);
  const assets = names.filter(name => /^ort-wasm.*\.(?:mjs|wasm)$/.test(name));
  if (!assets.some(name => name.endsWith(".wasm")) || !assets.some(name => name.endsWith(".mjs")))
    throw new Error("ONNX WASM assets missing from the pinned npm dependency.");
  for (const name of assets) {
    await fs.copyFile(path.join(from, name), path.join(to, name));
  }
}

for (const file of MODEL_FILES) await downloadAsset(file.path, file.minimum, file.maximum);
await copyOnnxRuntime();
const files = [];
for (const entry of MODEL_FILES) {
  const filename = path.join(MODEL_DIR, entry.path);
  files.push({ path: entry.path, sha256: await hashFile(filename) });
}
await fs.writeFile(
  path.join(MODEL_DIR, "model-manifest.json"),
  JSON.stringify({ source: MODEL_NAME, revision: MODEL_REVISION, license: "Apache-2.0", files }, null, 2) + "\n",
);
console.log("Prepared pinned same-origin ORMBG model and ONNX WASM runtime.");
