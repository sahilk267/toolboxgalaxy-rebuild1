/** Real Chromium UI smoke: legacy defaults, advanced modes, reset and TXT output. */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const host = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ acceptDownloads: true });
const assert = (test, message) => { if (!test) throw new Error(message); };
let cases = 0;
async function contains(locator, value, label) {
  await locator.getByText(value, { exact: false }).first().waitFor({ timeout: 15000 });
  cases++;
  console.log("PASS " + label);
}
async function visit(slug, heading) {
  const response = await page.goto(host + "/tools/" + slug, { waitUntil: "domcontentloaded" });
  assert(response && response.status() === 200, "Tool route failed: " + slug);
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
}
try {
  await page.route(/https?:\/\//, route => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
  });
  await visit("percentage-calculator", "Percentage Calculator");
  const pct = page.locator('[data-tool="advanced-percentage"]');
  await contains(pct, "18 is 15% of 120.", "legacy 18/120 percentage");
  await pct.locator('[data-field="percentage-mode"]').selectOption("change");
  await contains(pct, "25% change from 80 to 100.", "percentage change new mode");
  await pct.locator('[data-field="percentage-mode"]').selectOption("reverseDiscount");
  await contains(pct, "Original amount = 100", "reverse discount");
  await pct.locator('[data-field="percentage-second"]').fill("100");
  await pct.getByRole("alert").getByText("100% discount cannot be reversed", { exact: false }).waitFor();
  cases++;
  await pct.locator('[data-field="percentage-mode"]').selectOption("partOfTotal");
  await contains(pct, "18 is 15% of 120.", "mode switch restores legacy defaults");

  await visit("unit-converter", "Unit Converter");
  const unit = page.locator('[data-tool="advanced-unit-converter"]');
  await contains(unit, "0.621371", "legacy km/mi default conversion");
  const choices = await unit.locator('[data-field="unit-category"] option').count();
  assert(choices === 8, "Expected 8 unit categories, found " + choices);
  cases++;
  await unit.locator('[data-field="unit-category"]').selectOption("temperature");
  await unit.locator('[data-field="unit-value"]').fill("100");
  await contains(unit, "212 Fahrenheit", "100 C equals 212 F");
  await unit.locator('[data-field="unit-category"]').selectOption("volume");
  await contains(unit.locator(".result-block"), "US gallons", "US customary volume mode");
  await unit.getByRole("button", { name: "Reset" }).click();
  await contains(unit, "0.621371", "unit reset preserves original km/mi default");

  await visit("text-statistics", "Text Statistics");
  const txt = page.locator('[data-tool="advanced-text-statistics"]');
  await contains(txt.locator(".stats-grid"), "Words", "word tile available");
  await txt.locator('[data-field="text-stats-input"]').fill("Apple apple banana. Apple!");
  await contains(txt, "Most frequent words", "frequency section available");
  await txt.getByText("apple", { exact: true }).waitFor();
  await txt.locator(".stats-grid").getByText("Unique words").waitFor();
  cases++;
  const downloadPromise = page.waitForEvent("download");
  await txt.getByRole("button", { name: "Export TXT" }).click();
  const download = await downloadPromise;
  assert(download.suggestedFilename() === "toolboxgalaxy-text-report.txt", "Incorrect report filename");
  const file = await download.path();
  const report = await fs.readFile(file, "utf-8");
  assert(report.includes("Words: 4") && report.includes("apple: 3"), "Report contains incorrect word counts");
  cases++;
  await txt.getByRole("button", { name: "Clear" }).click();
  const input = await txt.locator('[data-field="text-stats-input"]').inputValue();
  assert(input === "", "Clear did not reset text");
  cases++;
  console.log("PASS " + cases + " Chromium advanced everyday tool UI assertions.");
} catch (error) {
  console.error("FAILED browser advanced everyday smoke:", error);
  console.error("Visible error messages:", await page.locator('[role="alert"]').allTextContents().catch(() => []));
  process.exitCode = 1;
} finally {
  await browser.close();
}
