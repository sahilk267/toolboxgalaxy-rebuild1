/**
 * Real Chromium browser smoke test for the background-removal tool.
 * Run only after npm run build, with server listening on localhost:3000.
 * Test input is synthetic. This proves workflow mechanics, not edge quality.
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const url = "http://127.0.0.1:3000/tools/background-remover";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
let page;
try {
  page = await browser.newPage({ acceptDownloads: true });
  // Prevent accidental third-party requests while testing local inference.
  await page.route(/https?:\/\//, route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.hostname === "127.0.0.1" || requestUrl.hostname === "localhost") return route.continue();
    return route.abort();
  });
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  if (!response || response.status() !== 200) throw new Error("Tool route did not return 200");
  await page.getByRole("heading", { name: "Free AI Background Remover" }).waitFor();

  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#dceeff";
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = "#1b4965";
    ctx.fillRect(124, 135, 85, 100);
    ctx.fillStyle = "#f1c7a5";
    ctx.beginPath();
    ctx.ellipse(167, 97, 38, 49, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#22181b";
    ctx.beginPath();
    ctx.arc(167, 62, 42, Math.PI, 2 * Math.PI);
    ctx.fill();
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "synthetic-portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(encoded, "base64"),
  });
  await page.getByRole("button", { name: "Remove background" }).click();
  await page.getByRole("button", { name: "Download PNG" }).waitFor({ timeout: 180_000 });
  const outputFigure = page.getByAltText("Photo with background removed");
  await outputFigure.waitFor();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith(".png")) throw new Error("Incorrect PNG download name");
  const filepath = await download.path();
  if (!filepath) throw new Error("Missing downloaded file");
  const bytes = await fs.readFile(filepath);
  if (bytes.length < 100 || bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a")
    throw new Error("Output is not a real PNG file");
  const size = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = "data:image/png;base64," + base64;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, bytes.toString("base64"));
  if (size[0] !== 320 || size[1] !== 240)
    throw new Error("Output dimensions do not match the original file");

  const matteRange = await page.evaluate(async (encodedFile) => {
    const image = new Image();
    image.src = "data:image/png;base64," + encodedFile;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let min = 255, max = 0;
    for (let pixel = 3; pixel < pixels.length; pixel += 4) {
      min = Math.min(min, pixels[pixel]);
      max = Math.max(max, pixels[pixel]);
    }
    return { min, max };
  }, bytes.toString("base64"));
  console.log("Synthetic portrait AI alpha range:", matteRange);
  if (matteRange.min >= 200 || matteRange.max <= 50) {
    throw new Error("AI output has no useful transparent/opaque alpha separation");
  }

  // Verify that a solid-color export is still opaque PNG.
  await page.getByRole("combobox").selectOption("white");
  const whitePromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const whiteDownload = await whitePromise;
  const whitePath = await whiteDownload.path();
  const whiteBytes = await fs.readFile(whitePath);
  const rgba = await page.evaluate(async (encodedFile) => {
    const image = new Image();
    image.src = "data:image/png;base64," + encodedFile;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, 1, 1).data[3];
  }, whiteBytes.toString("base64"));
  if (rgba !== 255) throw new Error("Solid background PNG has transparent pixels");

  console.log("PASS Chromium: upload, browser-AI inference, cutout PNG, original resolution and solid-background export");
} catch (error) {
  console.error("Chromium background remover smoke FAILED:", error);
  if (page) console.error("Page errors:", await page.locator('[role="alert"]').allTextContents().catch(() => []));
  process.exitCode = 1;
} finally {
  await browser.close();
}
