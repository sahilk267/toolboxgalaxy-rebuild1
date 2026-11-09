/**
 * Provision a revision-pinned, SHA-256-verified Apache-2.0 ORMBG ONNX model and
 * version-matched ONNX Runtime WASM assets into Vite's static public directory.
 * Generated binaries are deliberately not committed to Git.
 *
 * npm ci -> npm run prepare:bg-model -> npm run build
 */
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { Transform } from "node:stream";
import { pipeline as streamPipeline } from "node:stream/promises";

const root = resolve(import.meta.dirname, "..");
const modelFolder = join(root, "client/public/models/onnx-community/ormbg-ONNX");
const wasmFolder = join(root, "client/public/models/wasm");
const modelRevision = "034e2d884afbab897e10e78fc5bb566b29533fd6";
const modelSha256 = "ffbcae62a7b675d616e64cb392ee028786c4cf74f83596590fba13733ef00171";
const modelRepo = "onnx-community/ormbg-ONNX";

function digest(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolveHash(hash.digest("hex")));
    stream.on("error", reject);
  });
}
async function provision(rel, expectedHash) {
  const dest = join(modelFolder, rel);
  await mkdir(dirname(dest), { recursive: true });
  try {
    const existing = await stat(dest);
    if (existing.size && (!expectedHash || await digest(dest) === expectedHash)) {
      console.log("[background model] reuse", rel);
      return;
    }
  } catch { /* first build */ }

  const url = `https://huggingface.co/${modelRepo}/resolve/${modelRevision}/${rel}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok || !response.body) throw new Error(`Model fetch failed (${response.status}): ${rel}`);
  const file = dest + ".part";
  const hash = createHash("sha256");
  let bytes = 0;
  try {
    const stream = Transform.from(async function* (iter) {
      for await (const chunk of iter) {
        bytes += chunk.length;
        if (bytes > 50_000_000) throw new Error("Unexpectedly large model asset");
        hash.update(chunk);
        yield chunk;
      }
    });
    await streamPipeline(response.body, stream, createWriteStream(file));
    if (bytes < 10) throw new Error("Downloaded model asset is empty");
    const actualHash = hash.digest("hex");
    if (expectedHash && actualHash !== expectedHash) {
      throw new Error(`SHA-256 mismatch for ${rel}: ${actualHash}`);
    }
    await rename(file, dest);
    console.log("[background model] downloaded", rel, bytes, "bytes");
  } catch (error) {
    await rm(file, { force: true });
    throw error;
  }
}

async function provisionWasm() {
  // Always copy from the *installed* matching version; NEVER mix incompatible ORT assets.
  await mkdir(wasmFolder, { recursive: true });
  const candidates = [
    join(root, "node_modules/onnxruntime-web/dist"),
    join(root, "node_modules/@huggingface/transformers/dist"),
  ];
  let count = 0;
  for (const folder of candidates) {
    let entries;
    try { entries = await readdir(folder); } catch { continue; }
    for (const name of entries) {
      if (!/^ort-wasm.*\.(?:mjs|wasm)$/.test(name)) continue;
      await copyFile(join(folder, name), join(wasmFolder, basename(name)));
      count++;
    }
  }
  if (count < 2) throw new Error("Compatible ONNX Runtime WASM assets are missing from npm installation");
  console.log(`[background model] copied ${count} WASM/runtime assets`);
}

async function provisionNotices() {
  const target = join(root, "client/public/licenses");
  await mkdir(target, { recursive: true });
  // npm packages include their official LICENSE files; fail closed if attribution assets disappear.
  for (const [source, dest] of [
    ["node_modules/@huggingface/transformers/LICENSE", "Apache-2.0.txt"],
  ]) {
    await copyFile(join(root, source), join(target, dest));
  }
}

await provision("config.json");
await provision("preprocessor_config.json");
await provision("onnx/model_uint8.onnx", modelSha256);
await provisionWasm();
await provisionNotices();
console.log("[background model] local assets ready; external model requests disabled at runtime");
