/**
 * Actual Chromium smoke test for the browser AI runtime.
 * Run only after "npm run build" and ephemeral "npm i --no-save playwright@1.65.0".
 * This is not a substitute for desktop/mobile cross-browser QA.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const origin = "http://127.0.0.1:4173";
const tmp = await mkdtemp(path.join(os.tmpdir(), "toolbox-bg-smoke-"));
const browserServer = spawn(process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173"],
  { stdio: ["ignore", "pipe", "pipe"] });

let serverLogs = "";
browserServer.stdout.on("data", (chunk) => { serverLogs += String(chunk); });
browserServer.stderr.on("data", (chunk) => { serverLogs += String(chunk); });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (browserServer.exitCode !== null) throw new Error("Vite preview exited: " + serverLogs);
    try {
      const response = await fetch(origin + "/tools/background-remover", { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* booting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Vite preview never started: " + serverLogs);
}

let browser;
try {
  const portraitUrl = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman_small.jpg";
  const portraitResponse = await fetch(portraitUrl, { signal: AbortSignal.timeout(30_000) });
  if (!portraitResponse.ok) throw new Error("Could not download CI portrait fixture");
  const portraitBytes = Buffer.from(await portraitResponse.arrayBuffer());
  assert.ok(portraitBytes.length > 1000 && portraitBytes.length < 10 * 1024 * 1024);
  const portraitPath = path.join(tmp, "portrait.jpg");
  await writeFile(portraitPath, portraitBytes);

  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const unexpectedModelHosts = [];
  page.on("request", (request) => {
    if (/huggingface\.co|cdn\.jsdelivr\.net|api-inference/i.test(request.url())) {
      unexpectedModelHosts.push(request.url());
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") console.log("[browser console]", message.text().slice(0, 500));
  });

  await page.goto(origin + "/tools/background-remover", { waitUntil: "domcontentloaded" });
  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor();
  // Validate actual browser-level corrupt-file recovery before using a valid picture.
  await fileInput.setInputFiles({ name: "invalid.png", mimeType: "image/png", buffer: Buffer.from("not-an-image") });
  await page.getByRole("alert").waitFor({ timeout: 10_000 });
  assert.match(await page.getByRole("alert").innerText(), /could not decode/i);

  await fileInput.setInputFiles(portraitPath);
  await page.getByRole("img", { name: "Original selected image" }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Remove background" }).click();
  const outputPreview = page.getByRole("img", { name: "Image with background removed" });
  try {
    await outputPreview.waitFor({ timeout: 240_000 });
  } catch (error) {
    const alert = await page.getByRole("alert").allInnerTexts();
    throw new Error("AI pipeline did not produce an output: " + JSON.stringify(alert) + " / " + String(error));
  }
  assert.deepEqual(unexpectedModelHosts, [], "AI model/runtime must use same-origin assets only");

  const [transparentDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    page.getByRole("button", { name: /Download PNG/ }).click(),
  ]);
  const transparentBytes = await readFile(await transparentDownload.path());
  const info = await sharp(transparentBytes).metadata();
  assert.equal(info.format, "png");
  assert.equal(info.hasAlpha, true, "Transparent output must contain alpha channel");
  assert.ok(Math.max(info.width || 0, info.height || 0) <= 1280);
  const stats = await sharp(transparentBytes).stats();
  const minAlpha = stats.channels[3]?.min;
  assert.ok(minAlpha !== undefined && minAlpha < 255,
    "Actual AI output should have at least one transparent pixel");
  console.log("[browser] real portrait cutout PNG passed", info.width, info.height, "min alpha", minAlpha);

  await page.getByRole("combobox", { name: /^Background/ }).selectOption("white");
  const [whiteDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    page.getByRole("button", { name: /Download PNG/ }).click(),
  ]);
  const whiteBytes = await readFile(await whiteDownload.path());
  const whiteStats = await sharp(whiteBytes).stats();
  assert.equal(whiteStats.channels[3]?.min, 255, "White background export must be opaque");
  console.log("[browser] custom background export passed");

  await page.getByRole("button", { name: "Reset" }).click();
  assert.equal(await page.getByRole("img", { name: "Image with background removed" }).count(), 0);
  console.log("[browser] reset passed");
  console.log("CHROMIUM AI BACKGROUND REMOVAL E2E PASSED");
} finally {
  await browser?.close();
  browserServer.kill("SIGTERM");
}
