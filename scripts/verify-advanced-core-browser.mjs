/** Real production build Chromium smoke for Favicon, Password/Passphrase and JSON tools. */
import { chromium } from "playwright";
import JSZip from "jszip";
import fs from "node:fs/promises";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ acceptDownloads: true });
let tests = 0;
function check(value, title) { if (!value) throw new Error(title); tests++; console.log("PASS " + title); }
async function download(button) {
  const next = page.waitForEvent("download");
  await button.click();
  const item = await next;
  const file = await item.path();
  check(Boolean(file), "Downloaded file exists");
  return { filename: item.suggestedFilename(), buffer: await fs.readFile(file) };
}
async function visit(slug, heading) {
  const response = await page.goto("http://127.0.0.1:3000/tools/" + slug, { waitUntil: "domcontentloaded" });
  check(response?.status() === 200, slug + " original URL works");
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
}
try {
  await page.route(/https?:\/\//, route => {
    const host = new URL(route.request().url()).hostname;
    return host === "127.0.0.1" ? route.continue() : route.abort();
  });

  // Favicon source PNG generated locally from canvas, no external image asset.
  await visit("favicon-generator", "Favicon Generator");
  const fav = page.locator('[data-tool="advanced-favicon"]');
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1166cc"; ctx.fillRect(0,0,400,300);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(100,50,200,200);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await fav.locator('[data-field="favicon-file"]').setInputFiles({
    name: "icon-source.png", mimeType: "image/png", buffer: Buffer.from(base64, "base64"),
  });
  await fav.getByRole("button", { name: "Create favicon package" }).click();
  await fav.getByRole("button", { name: "Download ZIP" }).waitFor({ timeout: 20000 });
  const pkg = await download(fav.getByRole("button", { name: "Download ZIP" }));
  check(pkg.filename === "toolboxgalaxy-favicon-kit.zip", "Favicon ZIP filename");
  const zip = await JSZip.loadAsync(pkg.buffer);
  for (const asset of [
    "favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png",
    "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png",
    "site.webmanifest", "favicon-html-snippet.txt"
  ]) check(Boolean(zip.file(asset)), "ZIP includes " + asset);
  const manifest = JSON.parse(await zip.file("site.webmanifest").async("string"));
  check(manifest.icons.length === 2, "ZIP manifest has Android icons");
  const ico = await zip.file("favicon.ico").async("uint8array");
  const icoHeader = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);
  check(icoHeader.getUint16(2,true) === 1 && icoHeader.getUint16(4,true) === 3, "Real three-frame ICO in ZIP");
  for(const [filename, dimension] of [["favicon-16x16.png",16],["apple-touch-icon.png",180],["android-chrome-512x512.png",512]]) {
    const bytes = await zip.file(filename).async("uint8array");
    const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    check(view.getUint32(16) === dimension && view.getUint32(20) === dimension, "PNG actual dimension " + dimension);
  }
  const icoDownload = await download(fav.getByRole("button", { name: "Download ICO" }));
  check(icoDownload.filename === "favicon.ico", "Standalone ICO download");
  check(icoDownload.buffer.byteLength === ico.length, "Standalone ICO equals ZIP ICO");

  // Password original defaults + new modes; never send password over network.
  await visit("password-generator", "Password Generator");
  const pass = page.locator('[data-tool="advanced-password"]');
  check(await pass.locator('[data-field="password-length"]').inputValue() === "18", "Preserve password 18-char default");
  await pass.getByRole("button", { name: "Generate passwords" }).click();
  const generated = pass.locator("[data-generated-passwords] li");
  await generated.first().waitFor();
  check((await generated.first().innerText()).trim().split("\n").join("").length >= 18, "Generated password appears");
  await pass.locator('[data-field="password-count"]').selectOption("5");
  await pass.getByRole("button", { name: "Generate passwords" }).click();
  check(await generated.count() === 5, "Password batch generation");
  await pass.locator('[data-field="password-mode"]').selectOption("passphrase");
  await pass.getByRole("button", { name: "Generate passphrases" }).click();
  check(await generated.count() === 5, "Passphrase batch generation");
  check((await generated.first().innerText()).includes("-"), "Passphrase uses word separators");

  await visit("password-strength-auditor", "Password Strength Auditor");
  const audit = page.locator('[data-tool="advanced-password-audit"]');
  await audit.locator('[data-field="audit-password"]').fill("password");
  await audit.getByText("Very weak", { exact: true }).first().waitFor();
  check((await audit.innerText()).includes("easily guessed"), "Audit warns about common password");
  await audit.locator('[data-field="audit-password"]').fill("This is a long unique sentence beyond ordinary length");
  await audit.getByText("Stronger", { exact: true }).first().waitFor();
  check((await audit.innerText()).includes("data breaches"), "Audit limitations shown");
  await audit.getByRole("button", { name: "Clear" }).click();
  check(await audit.locator('[data-field="audit-password"]').inputValue() === "", "Audit clear control");

  // JSON Station original format/minify mode and advanced tree/path/compare.
  await visit("json-station", "JSON Station");
  const json = page.locator('[data-tool="advanced-json"]');
  await json.locator('[data-json-output]').getByText('"mission": "tools"', { exact: false }).waitFor();
  check((await json.locator("[data-json-output]").innerText()).includes("\n"), "JSON default format is pretty");
  await json.locator('[data-json-mode="minify"]').click();
  check((await json.locator("[data-json-output]").innerText()).includes('{"mission":"tools","status":"verified"}'), "JSON default minification");
  await json.locator('[data-json-mode="tree"]').click();
  await json.getByRole("button", { name: "$: Object (2)" }).waitFor();
  check((await json.innerText()).includes("mission"), "JSON tree explorer shows key");
  await json.locator('[data-json-mode="query"]').click();
  check((await json.locator("[data-json-output]").innerText()).includes('"tools"'), "JSONPath lookup defaults to $.mission");
  await json.locator('[data-field="json-path"]').fill("$.constructor");
  await json.getByRole("alert").getByText("JSON path not found.", { exact: true }).waitFor();
  check(true,"Inherited properties cannot be queried");
  await json.locator('[data-field="json-path"]').fill("$.mission");
  await json.locator('[data-json-mode="compare"]').click();
  await json.locator("[data-json-diffs] li").first().waitFor();
  check((await json.locator("[data-json-diffs] li").first().innerText()).includes("$.status"), "JSON compare highlights changed key");
  await json.locator('[data-json-mode="format"]').click();
  const jsonDownload = await download(json.getByRole("button", { name: "Download JSON" }));
  check(JSON.parse(jsonDownload.buffer.toString("utf8")).mission === "tools", "JSON download parse roundtrip");
  await json.locator('[data-field="json-input"]').fill("{broken");
  await json.getByRole("alert").first().waitFor();
  check((await json.getByRole("alert").first().innerText()).length > 10, "Malformed JSON inline error");

  console.log("PASS: " + tests + " combined advanced core tools Chromium assertions.");
} catch (error) {
  console.error("FAILED combined Chromium QA:", error);
  console.error("Alerts:", await page.locator('[role="alert"]').allTextContents().catch(() => []));
  process.exitCode = 1;
} finally {
  await browser.close();
}
