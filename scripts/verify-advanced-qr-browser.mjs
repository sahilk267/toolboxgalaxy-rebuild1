/** Actual production Chromium QR preview, PNG/SVG, logo, and validation smoke. */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ acceptDownloads: true });
let checked = 0;
function assert(value, name) {
  if (!value) throw new Error(name);
  checked++;
}
async function getDownload(button) {
  const pending = page.waitForEvent("download");
  await button.click();
  const download = await pending;
  const pathname = await download.path();
  assert(Boolean(pathname), "Browser download exists");
  return { name: download.suggestedFilename(), bytes: await fs.readFile(pathname) };
}
try {
  await page.route(/https?:\/\//, route => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
  });
  const response = await page.goto("http://127.0.0.1:3000/tools/qr-code-generator", { waitUntil: "domcontentloaded" });
  assert(response?.status() === 200, "Existing QR route must return 200");
  await page.getByRole("heading", { name: "QR Code Generator", exact: true }).waitFor();
  const tool = page.locator('[data-tool="advanced-qr"]');
  const png = tool.getByRole("button", { name: "Download PNG" });
  const svg = tool.getByRole("button", { name: "Download SVG" });
  await tool.locator("[data-qr-image]").waitFor({ timeout: 20_000 });
  assert(await tool.locator('[data-field="qr-text"]').inputValue() === "https://toolboxgalaxy.com", "Original default URL kept");
  assert(!(await png.isDisabled()), "Default QR image is ready");

  const pngFile = await getDownload(png);
  assert(pngFile.name === "toolbox-galaxy-qr.png", "Original PNG filename retained");
  assert(pngFile.bytes.toString("hex", 0, 8) === "89504e470d0a1a0a", "PNG has valid signature");
  const size = await page.evaluate(async bytes => {
    const image = new Image();
    image.src = "data:image/png;base64," + bytes;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, pngFile.bytes.toString("base64"));
  assert(size[0] === 320 && size[1] === 320, "PNG preserves original 320px output size");

  const svgFile = await getDownload(svg);
  const svgText = svgFile.bytes.toString("utf8");
  assert(svgFile.name === "toolbox-galaxy-qr.svg", "Correct SVG export name");
  assert(svgText.includes("<svg") && svgText.includes("</svg>") && svgText.includes("<path"), "SVG is actual vector QR");
  await tool.locator('[data-field="qr-size"]').selectOption("512");
  await tool.locator("[data-qr-image]").waitFor();
  const png512 = await getDownload(png);
  const size512 = await page.evaluate(async bytes => {
    const image = new Image();
    image.src = "data:image/png;base64," + bytes;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, png512.bytes.toString("base64"));
  assert(size512[0] === 512 && size512[1] === 512, "Custom resolution affects actual PNG");

  await tool.locator('[data-field="qr-mode"]').selectOption("wifi");
  await tool.getByRole("alert").getByText("Wi-Fi password", { exact: false }).waitFor();
  assert(await png.isDisabled(), "Invalid Wi-Fi cannot export stale QR");
  await tool.locator('[data-field="qr-wifi-password"]').fill("secret;with:semicolon");
  await png.waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector('[data-tool="advanced-qr"] button[disabled]') || Boolean(document.querySelector('[data-qr-image]')));
  assert(!(await png.isDisabled()), "Valid Wi-Fi code becomes ready");
  await tool.locator('[data-field="qr-dark"]').fill("#777777");
  await tool.locator('[data-field="qr-light"]').fill("#888888");
  await tool.getByRole("alert").getByText("contrast", { exact: false }).waitFor();
  assert(await png.isDisabled(), "Low-contrast QR export rejected");
  await tool.locator('[data-field="qr-dark"]').fill("#000000");
  await tool.locator('[data-field="qr-light"]').fill("#ffffff");
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('[data-tool="advanced-qr"] button')].find(x => x.textContent?.includes("Download PNG"));
    return button && !button.disabled;
  });
  assert(!(await png.isDisabled()), "Readable colors restore QR output");

  await tool.locator('[data-field="qr-mode"]').selectOption("contact");
  await tool.locator('[data-field="qr-contact-name"]').fill("Alex Example");
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('[data-tool="advanced-qr"] button')].find(x => x.textContent?.includes("Download PNG"));
    return button && !button.disabled;
  });
  assert(!(await svg.isDisabled()), "Logo-free vCard allows SVG export");
  const logoBase64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#005cc5";
    ctx.fillRect(0, 0, 96, 96);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(20, 20, 56, 56);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await tool.getByLabel("Choose center logo").setInputFiles({
    name: "my-logo.png", mimeType: "image/png", buffer: Buffer.from(logoBase64, "base64"),
  });
  await tool.getByRole("button", { name: "Remove logo" }).waitFor();
  assert(await tool.locator('[data-field="qr-ecc"]').inputValue() === "H", "Logo enforces highest error correction");
  assert(await tool.locator('[data-field="qr-ecc"]').isDisabled(), "Logo locks highest ECC");
  assert(await svg.isDisabled(), "Logo SVG export disabled rather than silently omit logo");
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('[data-tool="advanced-qr"] button')].find(x => x.textContent?.includes("Download PNG"));
    return button && !button.disabled;
  });
  const branded = await getDownload(png);
  assert(branded.bytes.toString("hex", 0, 8) === "89504e470d0a1a0a", "Logo composite exported as true PNG");
  await tool.getByRole("button", { name: "Remove logo" }).click();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('[data-tool="advanced-qr"] button')].find(x => x.textContent?.includes("Download SVG"));
    return button && !button.disabled;
  });
  assert(!(await svg.isDisabled()), "Removing logo restores SVG export");

  await tool.getByRole("button", { name: "Reset" }).click();
  assert(await tool.locator('[data-field="qr-mode"]').inputValue() === "text", "Reset restores original text mode");
  assert(await tool.locator('[data-field="qr-text"]').inputValue() === "https://toolboxgalaxy.com", "Reset restores original URL");
  console.log("PASS: " + checked + " real Chromium advanced QR UI/export assertions");
} catch (error) {
  console.error("FAILED QR Chromium:", error);
  console.error("Visible alerts:", await page.locator('[role="alert"]').allTextContents().catch(() => []));
  process.exitCode = 1;
} finally {
  await browser.close();
}
