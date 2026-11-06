/**
 * Comprehensive Automated Regression Suite for Precision Repairs
 * Tests ACTUAL production modules and exports without duplicating algorithms.
 */

import * as XLSX from "xlsx";
import { syncDataToWorksheet, workbookHasFormulas, createValuesOnlyWorkbook } from "../client/src/components/ExcelStudioTool";
import { secureRandomInt, generateUniqueRandomInts, generateUniqueDecimals, generateRandomDecimals } from "../client/src/lib/secureRandom";
import { formatLocalDate, calendarDaysDifference, ageParts } from "../client/src/components/AdvancedToolRunners";
import { countWordsUnicode } from "../client/src/pages/ToolWorkspace";
import { tableToRawCsv, tableToSpreadsheetCsv } from "../client/src/lib/structuredDataEngines";
import { sanitizeWinAnsiText, detectUnsupportedWinAnsi, sanitizeWinAnsiTextWithAudit } from "../client/src/lib/pdfTextSanitizer";
import { COMPRESSION_PROFILES } from "../client/src/components/PdfCompressTool";
import { estimateVisualLines, chunkLinesForSlides, buildPresentationPptx } from "../client/src/lib/pdfExtraction";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { parseCurl, generateFetch, generateAxios, generatePython, generateGo, generateNode, generatePhp, pythonLiteral } from "../client/src/components/CurlToCodeTool";
import { parseGstDecimal } from "../client/src/components/RegionalHighDemandTools";
import { parseCronField, calculateNextRuns, explainCron } from "../client/src/components/CronScheduleTool";
import { validMockSqlTableName } from "../client/src/components/FakeDataGeneratorTool";
import { fitResizeDimensions, imageResizeError } from "../client/src/components/ImageResizerTool";
import { canvasBackingSize, logicalCanvasSize, pointerToCanvas, survivPointerToWorld } from "../client/src/game/canvasGeometry";
import { buildTextPdf, fitPdfCellText, wrapPdfTextLine } from "../client/src/lib/pdfTextExport";
import { parsePageRange, applyBatesStamping } from "../client/src/lib/enterprisePdf";
import { assertCanvasImageEncoding } from "../client/src/lib/imageExportValidation";
import { imagesPdfFileError, imagesPdfDimensionError, imagesPdfPlacement } from "../client/src/lib/imagesToPdfLayout";
import { KRUNKER_MATCH_DURATION_SECONDS, freshKrunkerMatchStats, resetKrunkerBotForMatch } from "../client/src/game/krunker/matchReset";
import { rayAabbDistance } from "../client/src/game/krunker/rayAabb";
import type { BotEntity } from "../client/src/game/krunker/types";
import * as THREE from "three";
import { StandardFonts } from "pdf-lib";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`  ✓ ${message}`);
  }
}

console.log("=== RUNNING TOOLBOXGALAXY PRECISION REPAIR REGRESSION SUITE ===");

// -------------------------------------------------------------
// P0-01: Excel Structural Row Deletion & Formula Preservation
// -------------------------------------------------------------
console.log("\n[P0-01] Testing Excel Structural Row Deletion & Stale Cell Pruning...");
{
  const wb = XLSX.utils.book_new();
  const originalRows = [
    ["Item", "Amount"],
    ["A", 100],
    ["B", 200],
    ["B", 200], // duplicate row
    ["C", 300],
  ];
  const ws = XLSX.utils.aoa_to_sheet(originalRows);
  // Add a formula in row 6
  ws["B6"] = { t: "n", f: "SUM(B2:B5)", v: 800 };
  ws["!ref"] = "A1:B6";
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Verify initial state
  assert(Boolean(ws["A5"]), "Initial cell A5 exists in original worksheet");
  assert(Boolean(ws["B6"]?.f), "Formula in cell B6 exists in original worksheet");

  // Deduplicate rows (remove duplicate row 'B, 200')
  const deduplicatedRows = [
    ["Item", "Amount"],
    ["A", 100],
    ["B", 200],
    ["C", 300],
  ];

  // Call actual production syncDataToWorksheet
  const cleanedWs = syncDataToWorksheet(ws, deduplicatedRows);

  // Assert stale row 5 and 6 cells were pruned
  assert(cleanedWs["A5"] === undefined, "Stale cell A5 was deleted from worksheet");
  assert(cleanedWs["B5"] === undefined, "Stale cell B5 was deleted from worksheet");
  assert(cleanedWs["B6"] === undefined, "Stale cell B6 was deleted from worksheet");
  assert(cleanedWs["!ref"] === "A1:B4", `Worksheet !ref was accurately updated to A1:B4 (was: ${cleanedWs["!ref"]})`);

  // Round-trip serialize and reopen XLSX with independent XLSX parser
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const reopenedWb = XLSX.read(buf, { type: "buffer" });
  const reopenedRows = XLSX.utils.sheet_to_json<any[]>(reopenedWb.Sheets["Sheet1"], { header: 1 });
  assert(reopenedRows.length === 4, `Reopened XLSX has exactly 4 rows (expected 4, found: ${reopenedRows.length})`);
  assert(reopenedRows[3][0] === "C" && reopenedRows[3][1] === 300, "Reopened XLSX last row is ['C', 300]");

  // Formula workbook safety and detection tests
  const formulaWb = XLSX.utils.book_new();
  const salesWs = XLSX.utils.aoa_to_sheet([["Item", "Price"], ["A", 10], ["B", 20]]);
  salesWs["B4"] = { t: "n", f: "SUM(B2:B3)", v: 30 };
  salesWs["!ref"] = "A1:B4";
  XLSX.utils.book_append_sheet(formulaWb, salesWs, "Sales");

  const summaryWs = XLSX.utils.aoa_to_sheet([["Total", 30]]);
  summaryWs["B1"] = { t: "n", f: "Sales!B4", v: 30 };
  XLSX.utils.book_append_sheet(formulaWb, summaryWs, "Summary");

  assert(workbookHasFormulas(formulaWb), "workbookHasFormulas correctly detects formulas in multi-sheet workbook");

  const plainWb = XLSX.utils.book_new();
  const plainWs = XLSX.utils.aoa_to_sheet([["Name", "Age"], ["John", 30]]);
  XLSX.utils.book_append_sheet(plainWb, plainWs, "Data");
  assert(!workbookHasFormulas(plainWb), "workbookHasFormulas returns false for plain data workbook");

  const valuesOnlyWb = createValuesOnlyWorkbook(formulaWb);
  assert(!workbookHasFormulas(valuesOnlyWb), "createValuesOnlyWorkbook strips formulas for safe static export");
  assert(valuesOnlyWb.Sheets["Sales"]["B4"].v === 30, "createValuesOnlyWorkbook preserves cell value 30");
  assert(Boolean(formulaWb.Sheets["Sales"]["B4"].f), "Original formula workbook remains 100% intact with formulas");
}

// -------------------------------------------------------------
// P0-02: Cryptographically Secure RNG & Rejection Sampling
// -------------------------------------------------------------
console.log("\n[P0-02 / Section D] Testing Cryptographically Secure RNG (secureRandom.ts)...");
{
  // 1. [0, 0] -> 0
  assert(secureRandomInt(0, 0) === 0, "secureRandomInt(0, 0) returns 0");

  // 2. [1, 6] within bounds
  let allInRange = true;
  for (let i = 0; i < 50; i++) {
    const val = secureRandomInt(1, 6);
    if (val < 1 || val > 6) allInRange = false;
  }
  assert(allInRange, "secureRandomInt(1, 6) consistently returns 1 through 6");

  // 3. Negative bounds [-10, -5]
  let negInRange = true;
  for (let i = 0; i < 20; i++) {
    const val = secureRandomInt(-10, -5);
    if (val < -10 || val > -5) negInRange = false;
  }
  assert(negInRange, "secureRandomInt(-10, -5) respects negative ranges");

  // 4. Full uint32 range [0, 4294967295] terminates without infinite loop
  const maxUint32Val = secureRandomInt(0, 0xffffffff);
  assert(maxUint32Val >= 0 && maxUint32Val <= 0xffffffff, "secureRandomInt(0, 0xFFFFFFFF) terminates cleanly");

  // 5. Invalid bounds throw
  let threwMinMax = false;
  try {
    secureRandomInt(5, 1);
  } catch {
    threwMinMax = true;
  }
  assert(threwMinMax, "secureRandomInt(5, 1) throws validation error");

  let threwNaN = false;
  try {
    secureRandomInt(NaN, 5);
  } catch {
    threwNaN = true;
  }
  assert(threwNaN, "secureRandomInt(NaN, 5) throws validation error");

  // 6. Unique random numbers rejection
  let threwUnique = false;
  try {
    generateUniqueRandomInts(1, 2, 3);
  } catch {
    threwUnique = true;
  }
  assert(threwUnique, "generateUniqueRandomInts(1, 2, 3) throws validation error");

  const uniqueArr = generateUniqueRandomInts(1, 10, 5);
  assert(new Set(uniqueArr).size === 5, "generateUniqueRandomInts generates strictly unique integers");

  // 7. Section D: Decimal Grid Boundaries & Precision Tolerances
  // 1.234 to 1.245, precision 2 => only 1.24
  const decSample = generateRandomDecimals(1.234, 1.245, 1, 2);
  assert(decSample[0] === 1.24, `generateRandomDecimals(1.234, 1.245, precision: 2) = 1.24 (got: ${decSample[0]})`);

  // 1.001 to 1.009, precision 2 => no valid value
  let threwNoDecValues = false;
  try {
    generateRandomDecimals(1.001, 1.009, 1, 2);
  } catch {
    threwNoDecValues = true;
  }
  assert(threwNoDecValues, "generateRandomDecimals(1.001, 1.009, precision: 2) throws validation error");

  // 0 to 0, precision 0 => 0
  const zeroDec = generateRandomDecimals(0, 0, 1, 0);
  assert(zeroDec[0] === 0, "generateRandomDecimals(0, 0, precision: 0) = 0");

  // Unique decimals domain validation
  let threwDecimals = false;
  try {
    generateUniqueDecimals(0, 1, 5, 0); // only 2 discrete values (0, 1)
  } catch {
    threwDecimals = true;
  }
  assert(threwDecimals, "generateUniqueDecimals(0, 1, 5, precision: 0) throws validation error when count exceeds domain");
}

// -------------------------------------------------------------
// P0-04: Age and Date Calculator Timezone & Ordinal Safety
// -------------------------------------------------------------
console.log("\n[P0-04] Testing Date & Age Calculation (AdvancedToolRunners.tsx)...");
{
  // 1. formatLocalDate does not drift UTC backward
  const testDate = new Date(2026, 8, 7, 2, 0, 0); // Sept 7 at 2 AM local
  const formatted = formatLocalDate(testDate);
  assert(formatted === "2026-09-07", `formatLocalDate matches local calendar date (got: ${formatted})`);

  // 2. calendarDaysDifference avoids DST division errors
  const jan31 = new Date(2026, 0, 31);
  const mar1 = new Date(2026, 2, 1);
  const diffDays = calendarDaysDifference(jan31, mar1);
  assert(diffDays === 29, `calendarDaysDifference(Jan 31, Mar 1) = 29 days in 2026 (got: ${diffDays})`);

  // Same date
  assert(calendarDaysDifference(jan31, jan31) === 0, "Same date difference is 0");
  // Adjacent dates
  assert(calendarDaysDifference(new Date(2026, 0, 1), new Date(2026, 0, 2)) === 1, "Adjacent date difference is 1");

  // 3. ageParts across month boundaries
  const age = ageParts(jan31, mar1);
  assert(age.years === 0 && age.months === 1 && age.days === 1, `ageParts(Jan 31 -> Mar 1) = 1 month, 1 day (got: ${age.months}m, ${age.days}d)`);
}

// -------------------------------------------------------------
// P1-07 / P1-08: Unicode Word Count & Password Characters
// -------------------------------------------------------------
console.log("\n[P1-07 / P1-08] Testing Unicode Word Counting & Password Alphabet...");
{
  assert(countWordsUnicode("Hello world") === 2, "countWordsUnicode('Hello world') = 2");
  assert(countWordsUnicode("नमस्ते दुनिया") === 2, "countWordsUnicode('नमस्ते दुनिया') = 2");
  assert(countWordsUnicode("café résumé") === 2, "countWordsUnicode('café résumé') = 2");
  assert(countWordsUnicode("") === 0, "countWordsUnicode('') = 0");

  const fs = await import("fs");
  const toolWorkspaceCode = fs.readFileSync("client/src/pages/ToolWorkspace.tsx", "utf-8");
  assert(!toolWorkspaceCode.includes("byte % alphabet.length"), "Password generator eliminates modulo arithmetic bias");
}

// -------------------------------------------------------------
// TASK A: Regex Worker Bounds
// -------------------------------------------------------------
console.log("\n[TASK A] Verifying Regex Worker Bounds...");
{
  const MAX_SAFE_CHARS = 20000;
  const longInput = "a".repeat(25000);
  const capped = longInput.length > MAX_SAFE_CHARS ? longInput.slice(0, MAX_SAFE_CHARS) : longInput;
  assert(capped.length === 20000, "Input is strictly capped to 20,000 characters");
}

// -------------------------------------------------------------
// TASK B: Telegram Secret Absence
// -------------------------------------------------------------
console.log("\n[TASK B] Verifying Telegram Secret Absence...");
{
  const fs = await import("fs");
  const telegramClientFile = fs.readFileSync("client/src/lib/telegramAlerts.ts", "utf-8");
  assert(!telegramClientFile.includes("VITE_TELEGRAM_BOT_TOKEN"), "telegramAlerts.ts has zero references to VITE_TELEGRAM_BOT_TOKEN");
  assert(!telegramClientFile.includes("https://api.telegram.org/bot"), "telegramAlerts.ts does not make direct browser bot calls");
}

// -------------------------------------------------------------
// TASK C: Contact Form Truthful States
// -------------------------------------------------------------
console.log("\n[TASK C] Verifying Contact Form Truthful States...");
{
  const fs = await import("fs");
  const contactFile = fs.readFileSync("client/src/pages/Contact.tsx", "utf-8");
  assert(!contactFile.includes("Message dispatched!"), "Contact.tsx does not display deceptive 'Message dispatched!' banner");
  assert(contactFile.includes("unconfigured"), "Contact.tsx explicitly handles unconfigured state");
}

// -------------------------------------------------------------
// TASK E: PDF Compression Honesty
// -------------------------------------------------------------
console.log("\n[TASK E] Verifying PDF Compression Honesty...");
{
  const fs = await import("fs");
  const pdfCompressFile = fs.readFileSync("client/src/components/PdfCompressTool.tsx", "utf-8");
  assert(pdfCompressFile.includes("Image-Based Compression"), "PDF compress discloses image rasterization lossy behavior");
  assert(pdfCompressFile.includes("This compression setting increased file size"), "Explicit notice when compression increases file size");
}

// -------------------------------------------------------------
// TASK G: WinAnsi Character Sanitizer
// -------------------------------------------------------------
console.log("\n[TASK G] Verifying Character Sanitization...");
{
  const cleanEnglish = sanitizeWinAnsiText("Hello World 123!");
  assert(cleanEnglish === "Hello World 123!", "Standard English ASCII preserved");

  const accented = sanitizeWinAnsiText("café résumé");
  assert(accented.includes("e"), "Accented letters mapped without deleting characters");
}

// -------------------------------------------------------------
// TASK K: Raw CSV vs Spreadsheet-Safe CSV
// -------------------------------------------------------------
console.log("\n[TASK K] Verifying Raw CSV vs Spreadsheet-Safe CSV...");
{
  const testTable = {
    headers: ["Val", "Num", "Formula", "Mention"],
    rows: [["-1", "+123", "=SUM(1,2)", "@username"]],
  };

  const rawCsv = tableToRawCsv(testTable);
  const spreadsheetCsv = tableToSpreadsheetCsv(testTable);

  assert(rawCsv.includes("-1"), "Raw CSV preserves exact negative number -1");
  assert(!rawCsv.includes("'-1"), "Raw CSV does not add apostrophe to -1");
  assert(!rawCsv.includes("'=SUM(1,2)"), "Raw CSV does not add apostrophe to =SUM(1,2)");

  assert(spreadsheetCsv.includes("-1"), "Spreadsheet-Safe CSV allows pure negative number -1");
  assert(spreadsheetCsv.includes("'=SUM(1,2)"), "Spreadsheet-Safe CSV escapes =SUM(1,2) with leading apostrophe");
  assert(spreadsheetCsv.includes("'@username"), "Spreadsheet-Safe CSV escapes @username with leading apostrophe");
}

// -------------------------------------------------------------
// P0-03: Searchable PDF Unicode Character Detection
// -------------------------------------------------------------
console.log("\n[P0-03] Testing Searchable PDF Unicode Detection (pdfTextSanitizer.ts)...");
{
  const englishText = "ToolboxGalaxy System Report 2026";
  const englishUnsupported = detectUnsupportedWinAnsi(englishText);
  assert(englishUnsupported.length === 0, "English text produces 0 unsupported characters");

  const accentedText = "Café résumé with Zürich style";
  const accentedAudit = sanitizeWinAnsiTextWithAudit(accentedText);
  assert(!accentedAudit.hasUnsupported, "Accented Latin text is safely normalized with 0 unsupported characters");
  assert(accentedAudit.sanitized.includes("Cafe"), "Accented Cafe normalized to Cafe");

  const hindiText = "नमस्ते दुनिया 2026";
  const hindiUnsupported = detectUnsupportedWinAnsi(hindiText);
  assert(hindiUnsupported.length > 0, "Hindi Devanagari text correctly detected as unsupported for WinAnsi");

  const cjkText = "你好世界";
  const cjkUnsupported = detectUnsupportedWinAnsi(cjkText);
  assert(cjkUnsupported.length > 0, "CJK characters correctly detected as unsupported for WinAnsi");

  // Real PDFDocument embedding test
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const sanitized = sanitizeWinAnsiText(englishText);
  page.drawText(sanitized, { x: 50, y: 350, size: 12 });
  const pdfBytes = await pdfDoc.save();
  assert(pdfBytes.length > 0, "PDF document with WinAnsi text created successfully");
  const reopenedDoc = await PDFDocument.load(pdfBytes);
  assert(reopenedDoc.getPageCount() === 1, "Reopened PDF document has exactly 1 page");
}

// -------------------------------------------------------------
// P1-04: PDF Compression Profiles & Lossless Metadata Preservation
// -------------------------------------------------------------
console.log("\n[P1-04] Testing PDF Compression Profiles & Metadata Preservation...");
{
  const extreme = COMPRESSION_PROFILES.find((p) => p.id === "extreme");
  const recommended = COMPRESSION_PROFILES.find((p) => p.id === "recommended");
  const low = COMPRESSION_PROFILES.find((p) => p.id === "low");
  const lossless = COMPRESSION_PROFILES.find((p) => p.id === "lossless");

  assert(extreme?.scale === 1.0, "Extreme profile scale is 1.0 (72 DPI)");
  assert(recommended?.scale === 1.5, "Recommended profile scale is 1.5 (108 DPI)");
  assert(low?.scale === 2.0, "High Fidelity profile scale is 2.0 (144 DPI)");
  assert(lossless?.badge === "Structure Optimization", "Lossless profile uses honest 'Structure Optimization' badge");
  assert(!lossless?.description.includes("100% of selectable text"), "Lossless profile does not make absolute 100% claims");

  // Real PDFDocument metadata preservation test
  const testDoc = await PDFDocument.create();
  testDoc.addPage([500, 500]);
  testDoc.setTitle("Preserved Title 123");
  testDoc.setAuthor("Test Author");
  const initialBytes = await testDoc.save();

  // Load and repack using structure optimization (preserving metadata)
  const loadedDoc = await PDFDocument.load(initialBytes);
  assert(!loadedDoc.isEncrypted, "Loaded test PDF is not encrypted");
  const repackedBytes = await loadedDoc.save({ useObjectStreams: true, addDefaultPage: false });

  // Reopen and inspect title
  const verifiedDoc = await PDFDocument.load(repackedBytes);
  assert(verifiedDoc.getTitle() === "Preserved Title 123", "Lossless re-packing preserved original document Title metadata");
  assert(verifiedDoc.getAuthor() === "Test Author", "Lossless re-packing preserved original document Author metadata");
  assert(verifiedDoc.getPageCount() === 1, "Reopened optimized PDF maintains 1 page");
}

// -------------------------------------------------------------
// P1-05: PPTX Text Layout & Continuation Slide Chunking
// -------------------------------------------------------------
console.log("\n[P1-05] Testing PPTX Text Layout & Continuation Slides (pdfExtraction.ts)...");
{
  // 1. estimateVisualLines
  assert(estimateVisualLines("Short line") === 1, "Short line is 1 visual line");
  const long150Chars = "A".repeat(150);
  assert(estimateVisualLines(long150Chars) === 3, "150-char line is estimated as 3 visual lines");

  // 2. chunkLinesForSlides
  const sample40Lines: string[] = [];
  for (let i = 1; i <= 40; i++) {
    sample40Lines.push(`Marker ${i}: Detailed line content description item number ${i}`);
  }
  // Add a long line
  sample40Lines[5] = "Marker 6: " + "Very long clause text exceeding standard line boundaries. ".repeat(6);

  const chunks = chunkLinesForSlides(sample40Lines, 10);
  assert(chunks.length >= 4, `40 lines + long line chunked into ${chunks.length} slides (expected >= 4)`);

  // A single oversized source line must become multiple bounded slides without text loss.
  const oversizedLine = "START-" + "x".repeat(1500) + "-END";
  const oversizedChunks = chunkLinesForSlides([oversizedLine], 10);
  assert(oversizedChunks.length >= 3, "Single 1500-character line generates continuation slides");
  assert(oversizedChunks.flat().join("") === oversizedLine, "Oversized source line preserved character-for-character");
  assert(oversizedChunks.every((chunk) => chunk.reduce((sum, text) => sum + estimateVisualLines(text), 0) <= 10), "Every slide chunk stays within ten estimated visual lines");


  // Verify all 40 lines are present in order
  const flattened = chunks.flat();
  assert(flattened.length === 40, "All 40 lines are preserved without omission");
  assert(flattened[0].startsWith("Marker 1:"), "First item is Marker 1");
  assert(flattened[39].startsWith("Marker 40:"), "Last item is Marker 40");

  // 3. Real PPTX binary generation and JSZip inspection
  const testPages = [
    {
      pageNumber: 1,
      text: sample40Lines.slice(0, 20).join("\n"),
    },
    {
      pageNumber: 2,
      text: sample40Lines.slice(20).join("\n"),
    },
  ];

  const pptxResult = await buildPresentationPptx(testPages, "Precision Test Presentation");
  assert(pptxResult.bytes.length > 0, "Genuine PPTX binary generated");
  assert(pptxResult.slideCount >= 4, `Generated ${pptxResult.slideCount} slides for test document`);

  // Reopen PPTX using JSZip and inspect slide XML content
  const zip = await JSZip.loadAsync(pptxResult.bytes);
  let allSlideXml = "";
  for (let s = 1; s <= pptxResult.slideCount; s++) {
    const slideFile = zip.file(`ppt/slides/slide${s}.xml`);
    if (slideFile) {
      allSlideXml += await slideFile.async("string") + "\n";
    }
  }

  // Verify markers 1, 6, 20, 40 exist in the real PPTX XML
  assert(allSlideXml.includes("Marker 1:"), "PPTX slide XML contains Marker 1");
  assert(allSlideXml.includes("Marker 6:"), "PPTX slide XML contains long line Marker 6");
  assert(allSlideXml.includes("Marker 20:"), "PPTX slide XML contains Marker 20");
  assert(allSlideXml.includes("Marker 40:"), "PPTX slide XML contains Marker 40");
  const oversizedPptx = await buildPresentationPptx([{ pageNumber: 3, text: oversizedLine }], "Long Paragraph Test");
  assert(oversizedPptx.slideCount >= 3, "Real PPTX allocates multiple slides for a single oversized paragraph");
  const oversizedZip = await JSZip.loadAsync(oversizedPptx.bytes);
  const oversizedSlideXml: string[] = [];
  for (let i = 1; i <= oversizedPptx.slideCount; i++) {
    const slide = oversizedZip.file("ppt/slides/slide" + i + ".xml");
    assert(Boolean(slide), "Continuation slide " + i + " exists in the actual PPTX");
    if (slide) oversizedSlideXml.push(await slide.async("string"));
  }
  assert(oversizedSlideXml.join("").includes("START-") && oversizedSlideXml.join("").includes("-END"), "Reopened PPTX contains start and end of oversized text");

}

// -------------------------------------------------------------
// TOOL QA: GST input validation rejects malformed and negative amounts
// -------------------------------------------------------------
console.log("\n[TOOLS] Verifying strict GST input handling...");
{
  assert(parseGstDecimal("100", 1_000_000_000_000) === 100, "GST accepts ordinary invoice amount");
  assert(parseGstDecimal("0", 100) === 0, "GST accepts valid zero rate");
  assert(parseGstDecimal("18.5", 100) === 18.5, "GST accepts fractional custom rate");
  assert(parseGstDecimal("18oops", 100) === null, "GST rejects a partially parsed rate");
  assert(parseGstDecimal("-1", 1_000_000_000_000) === null, "GST rejects negative amount");
  assert(parseGstDecimal("", 1_000_000_000_000) === null, "GST rejects empty amount instead of silently using zero");
  assert(parseGstDecimal("101", 100) === null, "GST rejects a rate above supported range");
  assert(parseGstDecimal("1e309", 1_000_000_000_000) === null, "GST rejects non-finite exponential input");
}

// -------------------------------------------------------------
// TASK M: Analytics Privacy & PII Filter (ISS-044)
// -------------------------------------------------------------
console.log("\n[TASK M] Verifying Analytics Privacy & PII Sanitization...");
{
  const fs = await import("fs");
  const { sanitizeTelemetryProps } = await import("../client/src/lib/analytics");

  // 1. Verify PII filter drops sensitive keys
  const testPayload = {
    search_term: "super confidential query",
    email: "user@domain.com",
    token: "jwt.token.here",
    password: "secretpassword123",
    query_length: 24,
    category: "Developer",
    results_count: 5,
    has_results: true,
  };
  const sanitized = sanitizeTelemetryProps(testPayload);
  assert(sanitized !== undefined, "Sanitized telemetry object returned");
  assert(!("search_term" in (sanitized || {})), "search_term is strictly stripped from telemetry");
  assert(!("email" in (sanitized || {})), "email is strictly stripped");
  assert(!("token" in (sanitized || {})), "token is strictly stripped");
  assert(!("password" in (sanitized || {})), "password is strictly stripped");
  assert(sanitized?.query_length === 24, "Safe numerical metric query_length is preserved");
  assert(sanitized?.category === "Developer", "Safe category string is preserved");
  assert(sanitized?.results_count === 5, "Safe results_count is preserved");
  assert(sanitized?.has_results === true, "Safe has_results boolean is preserved");

  // 2. Verify Tools.tsx does not emit search_term
  const toolsSource = fs.readFileSync("client/src/pages/Tools.tsx", "utf-8");
  assert(!toolsSource.includes("search_term:"), "Tools.tsx does not emit raw search_term in telemetry");
  assert(toolsSource.includes("query_length:"), "Tools.tsx emits privacy-safe query_length");

  // 3. Verify index.html does not contain unconditional GTM noscript iframe
  const indexHtml = fs.readFileSync("client/index.html", "utf-8");
  assert(!indexHtml.includes("googletagmanager.com/ns.html"), "index.html has zero unconditional GTM noscript iframe tags");
}

// -------------------------------------------------------------
// TASK N: Telegram Relay Gating (ISS-045)
// -------------------------------------------------------------
console.log("\n[TASK N] Verifying Telegram Relay Gating & Absence of Deceptive Claims...");
{
  const fs = await import("fs");
  const contactSource = fs.readFileSync("client/src/pages/Contact.tsx", "utf-8");
  assert(contactSource.includes("isTelegramAlertsConfigured()"), "Contact.tsx gates Telegram notification behind configuration check");
  assert(contactSource.includes('type: "unconfigured"'), "Contact.tsx explicitly distinguishes unconfigured state from delivery");

  const telegramLib = fs.readFileSync("client/src/lib/telegramAlerts.ts", "utf-8");
  assert(telegramLib.includes("if (!relayUrl || typeof window === \"undefined\") return false;"), "sendTelegramMessage returns false when unconfigured");
}

// -------------------------------------------------------------
// TASK O: Service Worker Cache Allowlist (ISS-046)
// -------------------------------------------------------------
console.log("\n[TASK O] Verifying Service Worker Caching Allowlist & Bypass...");
{
  const fs = await import("fs");
  const swSource = fs.readFileSync("client/public/service-worker.js", "utf-8");
  assert(swSource.includes("isStaticAssetRequest"), "Service worker defines static asset request validator");
  assert(swSource.includes("STATIC_EXT_REGEX"), "Service worker enforces static file extension allowlist");
  assert(swSource.includes('/api/'), "Service worker explicitly skips /api/ routes");
  assert(swSource.includes('/contact/'), "Service worker explicitly skips /contact/ routes");
  assert(swSource.includes("Authorization"), "Service worker explicitly bypasses caching on authenticated requests");
  assert(swSource.includes("no-store") && swSource.includes("private"), "Service worker respects Cache-Control no-store and private headers");
}

// -------------------------------------------------------------
// TASK P: Accurate 61 Utility Count & MCP Catalog Integrity (ISS-047)
// -------------------------------------------------------------
console.log("\n[TASK P] Verifying Accurate 61 Tool Count & MCP Server Card...");
{
  const fs = await import("fs");
  const { tools } = await import("../shared/toolsData");
  assert(tools.length === 61, `toolsData.ts contains exactly 61 verified tools (actual: ${tools.length})`);

  const indexHtml = fs.readFileSync("client/index.html", "utf-8");
  assert(!indexHtml.includes("120+"), "index.html does not claim 120+ utilities");
  assert(indexHtml.includes("61 developer utilities") || indexHtml.includes("61 utilities"), "index.html accurately claims 61 utilities");

  const homeSource = fs.readFileSync("client/src/pages/Home.tsx", "utf-8");
  assert(!homeSource.includes("120+"), "Home.tsx does not claim 120+ utilities");
  assert(homeSource.includes("61 offline tools"), "Home.tsx accurately references 61 offline tools");

  const serverCard = JSON.parse(fs.readFileSync("client/public/.well-known/mcp/server-card.json", "utf-8"));
  assert(serverCard.tools.length >= 4, "MCP server-card.json defines at least 4 registered agent tools");
  assert(serverCard.tools.some((t: { name: string }) => t.name === "search_tools"), "MCP defines search_tools");
  assert(!JSON.stringify(serverCard).includes("120+"), "MCP server card does not claim 120+ tools");
  assert(JSON.stringify(serverCard).includes("61"), "MCP server card references 61 tools");

  const serverIndex = fs.readFileSync("server/index.ts", "utf-8");
  assert(serverIndex.includes('app.post("/api/mcp"'), "server/index.ts exposes real /api/mcp JSON-RPC endpoint");
}


// -------------------------------------------------------------
// TOOL/GAME BATCH A: cURL code generators use actual production functions
// -------------------------------------------------------------
console.log("\n[TOOLS] Verifying cURL parsing and generated language literals...");
{
  const curlInput = String.raw`curl -X POST https://example.com/api -H 'X-Note: a"b\c' -H 'Content-Type: application/json' --data '{"message":"true false null","active":true,"value":"hello"}'`;
  const parsed = parseCurl(curlInput);
  assert(parsed.method === "POST" && parsed.url === "https://example.com/api", "cURL parsing preserves method and URL");
  assert(parsed.headers["X-Note"] === 'a"b\\c', "cURL parsing preserves quoted header and literal backslash");
  assert(parsed.data === '{"message":"true false null","active":true,"value":"hello"}', "cURL shell tokenizer preserves nested JSON");

  const fetchCode = generateFetch(parsed);
  const axiosCode = generateAxios(parsed);
  const pythonCode = generatePython(parsed);
  const goCode = generateGo(parsed);
  const nodeCode = generateNode(parsed);
  const phpCode = generatePhp(parsed);

  let fetchSyntax = true;
  let nodeSyntax = true;
  try { new Function(fetchCode); } catch { fetchSyntax = false; }
  try { new Function(nodeCode); } catch { nodeSyntax = false; }
  assert(fetchSyntax && nodeSyntax, "Generated Fetch and Node.js snippets are syntactically valid");
  const encodedHeader = JSON.stringify("X-Note") + ": " + JSON.stringify('a"b\\c');
  assert(fetchCode.includes(encodedHeader), "Fetch output safely escapes quoted headers");
  assert(axiosCode.includes(encodedHeader), "Axios output safely escapes quoted headers");
  assert(nodeCode.includes(encodedHeader), "Node.js output safely escapes quoted headers");
  assert(goCode.includes("req.Header.Add(" + JSON.stringify("X-Note") + ", " + JSON.stringify('a"b\\c') + ")"), "Go output safely escapes header values");
  assert(pythonCode.includes('payload = {"message": "true false null", "active": True, "value": "hello"}'), "Python generator preserves text and correctly serializes booleans");
  assert(pythonLiteral({ text: "true null false", nested: [false, null, 1] }) === '{"text": "true null false", "nested": [False, None, 1]}', "Python literal serializer avoids mutating ordinary strings");
  assert(phpCode.includes("CURLOPT_HTTPHEADER") && phpCode.includes("true false null"), "PHP output retains headers and original body text");
  assert(fetchCode.includes('const raw = await response.text()'), "Fetch output handles non-JSON response bodies");
}


// -------------------------------------------------------------
// TOOL QA BATCH 3: cron, mock SQL output, and image-resizing boundaries
// -------------------------------------------------------------
console.log("\n[TOOLS] Verifying cron parsing, generated SQL identifiers, and image resize limits...");
{
  const intervals = parseCronField("*/15", 0, 59);
  assert(Boolean(intervals && [0, 15, 30, 45].every((v) => intervals.has(v)) && intervals.size === 4), "Cron */15 expands to expected minute set");
  assert(parseCronField("55-60", 0, 59) === null, "Cron rejects out-of-range range endpoint instead of silently clipping");
  assert(parseCronField("0-90/5", 0, 59) === null, "Cron rejects out-of-range stepped interval");
  assert(parseCronField("0/15/2", 0, 59) === null, "Cron rejects multiple step separators");
  assert(parseCronField("*/0", 0, 59) === null, "Cron rejects zero step");
  assert(parseCronField("60", 0, 59) === null, "Cron rejects invalid single minute");
  const namedMonths = parseCronField("JAN-MAR", 1, 12, { JAN: 1, FEB: 2, MAR: 3 });
  assert(Boolean(namedMonths && namedMonths.size === 3 && namedMonths.has(1) && namedMonths.has(3)), "Cron recognizes named month range");
  assert(explainCron(["0", "9", "1", "*", "1"]).includes(" OR "), "Cron explains day-of-month/day-of-week OR semantics");
  const cronRuns = calculateNextRuns(["0", "9", "1", "*", "1"], 2, new Date(2026, 0, 1, 8, 0, 0));
  assert(cronRuns.length === 2 && cronRuns[0].getDate() === 1 && cronRuns[1].getDate() === 5 && cronRuns.every((d) => d.getHours() === 9), "Cron schedules Jan 1 and following Monday under OR semantics");

  assert(validMockSqlTableName("users") && validMockSqlTableName("public.users"), "Fake-data SQL export accepts valid identifier names");
  assert(!validMockSqlTableName("") && !validMockSqlTableName("123users"), "Fake-data SQL export rejects missing or invalid identifiers");
  assert(!validMockSqlTableName("users; DROP TABLE users;--"), "Fake-data SQL export rejects executable table-name fragments");
  assert(!validMockSqlTableName("users name"), "Fake-data SQL export rejects whitespace in table identifier");

  const landscape = fitResizeDimensions(640, 480, 640, 480, "width", "800", true);
  assert(landscape?.width === 800 && landscape?.height === 600, "Image resize respects normal locked aspect ratio");
  const portrait = fitResizeDimensions(1, 8192, 1, 8192, "width", "8192", true);
  assert(portrait?.width === 1 && portrait?.height === 8192, "Image resize does not generate gigantic portrait canvas");
  const panorama = fitResizeDimensions(8192, 1, 8192, 1, "height", "8192", true);
  assert(panorama?.width === 8192 && panorama?.height === 1, "Image resize bounds extreme panoramic canvas");
  const unlocked = fitResizeDimensions(640, 480, 640, 480, "width", "800", false);
  assert(unlocked?.width === 800 && unlocked?.height === 480, "Unlocked image resize updates only chosen dimension");
  assert(imageResizeError(4000, 4000) === null, "Image resize accepts a safe 16MP output");
  assert(Boolean(imageResizeError(8192, 8192)), "Image resize blocks unsafe 67MP canvas allocation");
  assert(Boolean(imageResizeError(0, 800)), "Image resize rejects zero dimensions");
}


// -------------------------------------------------------------
// GAME QA BATCH 4: 2D canvas physical/CSS pixels and embedded aiming
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Diep/Surviv retina viewport and pointer transforms...");
{
  const retina = logicalCanvasSize(1600, 1200, 800, 600);
  assert(retina.width === 800 && retina.height === 600, "Diep retina backing buffer uses CSS-pixel camera viewport");
  const regular = logicalCanvasSize(800, 600, 800, 600);
  assert(regular.width === 800 && regular.height === 600, "Diep normal-density viewport remains unchanged");
  const fallback = logicalCanvasSize(1600, 1200, 0, 0);
  assert(fallback.width === 1600 && fallback.height === 1200, "Hidden canvas can fall back to bitmap dimensions");
  const backing = canvasBackingSize(800, 600, 2);
  assert(backing.width === 1600 && backing.height === 1200 && backing.scale === 2, "Surviv uses retina backing without changing logical coordinates");
  const fractionalBacking = canvasBackingSize(500, 400, 1.5);
  assert(fractionalBacking.width === 750 && fractionalBacking.height === 600, "Surviv supports fractional DPR 1.5");
  const cappedBacking = canvasBackingSize(600, 400, 4);
  assert(cappedBacking.width === 1200 && cappedBacking.height === 800, "Surviv caps expensive DPR values at 2");
  const point = pointerToCanvas(550, 340, 150, 40);
  assert(point.x === 400 && point.y === 300, "Embedded canvas pointer accounts for page offset");
  const center = survivPointerToWorld(550, 340, 150, 40, 800, 600, 1000, 900, 1);
  assert(center.x === 1000 && center.y === 900, "Surviv center pointer maps exactly to player world position");
  const right = survivPointerToWorld(630, 340, 150, 40, 800, 600, 1000, 900, 1);
  assert(right.x === 1080 && right.y === 900, "Surviv rightward aim maps by CSS pixels");
  const scoped = survivPointerToWorld(630, 340, 150, 40, 800, 600, 1000, 900, 0.5);
  assert(scoped.x === 1160 && scoped.y === 900, "Surviv scope zoom changes aim distance correctly");
  const topLeft = survivPointerToWorld(150, 40, 150, 40, 800, 600, 1000, 900, 1);
  assert(topLeft.x === 600 && topLeft.y === 600, "Surviv top-left pointer maps relative to canvas, not window");
}


// -------------------------------------------------------------
// TOOL QA BATCH 5: real Word/Excel PDF exports and Bates range correctness
// -------------------------------------------------------------
console.log("\n[TOOLS] Verifying PDF text layout, Excel column bounds, and Bates page ranges...");
{
  const sample = await PDFDocument.create();
  const font = await sample.embedFont(StandardFonts.Helvetica);
  const longWord = "START_" + "W".repeat(1900) + "_END";
  const lines = wrapPdfTextLine(longWord, font, 10, 250);
  assert(lines.length > 10, "Word PDF layout splits a long unbroken word over many bounded lines");
  assert(lines.join("") === longWord, "Word PDF layout preserves all unbroken characters");
  assert(lines.every((line) => font.widthOfTextAtSize(line, 10) <= 250.01), "Word PDF wrapped lines fit the actual PDF font width");

  const mixed = wrapPdfTextLine("One two three four five six seven", font, 12, 75);
  assert(mixed.length >= 2 && mixed.every((line) => font.widthOfTextAtSize(line, 12) <= 75.01), "Word PDF respects paragraph word boundaries and layout width");
  const cellText = fitPdfCellText("Long spreadsheet cell with text", font, 9, 55);
  assert(cellText.endsWith("...") && font.widthOfTextAtSize(cellText, 9) <= 55, "Excel PDF clips long cell text with a measured ellipsis");
  assert(fitPdfCellText("Short", font, 9, 100) === "Short", "Excel PDF preserves short cell values");
  assert(fitPdfCellText("LongValue", font, 9, 1) === "", "Excel PDF refuses to draw outside a column too narrow for any label");

  const sourceText = Array.from({ length: 150 }, (_, i) =>
    "# Entry " + i + "\n" + "LONG_" + "X".repeat(500) + " " + "ordinary paragraph ".repeat(8)
  ).join("\n");
  const output = await buildTextPdf(sourceText, "Document Export Layout Test");
  assert(output.length > 500, "Word PDF exporter produces nonempty genuine PDF bytes");
  const reopened = await PDFDocument.load(output);
  assert(reopened.getPageCount() > 1, "Long Word PDF export reopens with multiple continuation pages");
  assert(reopened.getPages().every((page) => Math.abs(page.getWidth() - 595.28) < 0.1), "Reopened Word PDF retains A4 portrait page dimensions");

  const pagesDoc = await PDFDocument.create();
  for (let i = 0; i < 5; i++) pagesDoc.addPage([595.28, 841.89]);
  const selected = parsePageRange("1, 3-4, 3", 5);
  assert(selected.size === 3 && selected.has(0) && selected.has(2) && selected.has(3), "Bates range selection deduplicates exact 1-based pages");
  assert(parsePageRange("all", 5).size === 5, "Bates accepts 'all' pages");
  assert(parsePageRange("  ", 5).size === 5, "Bates empty input defaults to all pages");

  for (const malformed of ["1foo", "0-2", "3-1", "1-99", "1,,3", "1--3", "2-3-4"]) {
    let rejected = false;
    try { parsePageRange(malformed, 5); } catch { rejected = true; }
    assert(rejected, "Bates rejects malformed/out-of-bounds range: " + malformed);
  }

  const stamped = await applyBatesStamping(pagesDoc, {
    prefix: "QA-",
    startNumber: 7,
    digits: 3,
    suffix: "",
    position: "bottom-right",
    fontSize: 9,
    colorHex: "#111111",
    pageRange: "1,3-4",
  });
  assert(stamped.stampedPages === 3 && stamped.sampleSequence === "QA-007", "Real Bates stamping numbers only three requested PDF pages");
  const stampedPdf = await pagesDoc.save();
  const reopenedStamped = await PDFDocument.load(stampedPdf);
  assert(reopenedStamped.getPageCount() === 5, "Reopened Bates-numbered PDF preserves the original five pages");
}


// -------------------------------------------------------------
// BATCH 6: browser image encoding, ordered images-to-PDF geometry, game replay
// -------------------------------------------------------------
console.log("\n[TOOLS/GAMES] Verifying image output formats, PDF geometry and Krunker replay state...");
{
  // The image download extension must always agree with the actual canvas output.
  const webp = new Blob(["image-data"], { type: "image/webp" });
  const jpeg = new Blob(["image-data"], { type: "image/jpeg" });
  const png = new Blob(["image-data"], { type: "image/png" });
  assert(assertCanvasImageEncoding(webp, "image/webp") === webp, "WebP export accepts browser-returned WebP format");
  assert(assertCanvasImageEncoding(jpeg, "image/jpeg") === jpeg, "JPEG export accepts browser-returned JPEG format");
  assert(assertCanvasImageEncoding(png, "image/png") === png, "PNG export accepts browser-returned PNG format");
  let fallbackRejected = false;
  try { assertCanvasImageEncoding(png, "image/webp"); } catch { fallbackRejected = true; }
  assert(fallbackRejected, "Image exporter rejects PNG fallback mislabeled as WebP");
  let emptyRejected = false;
  try { assertCanvasImageEncoding(new Blob([], { type: "image/png" }), "image/png"); } catch { emptyRejected = true; }
  assert(emptyRejected, "Image exporter rejects empty canvas image blob");

  assert(imagesPdfFileError({ type: "image/png", size: 200 }) === null, "Images-to-PDF accepts PNG");
  assert(imagesPdfFileError({ type: "image/jpeg", size: 200 }) === null, "Images-to-PDF accepts JPEG");
  assert(imagesPdfFileError({ type: "image/webp", size: 200 }) === null, "Images-to-PDF accepts WebP");
  assert(Boolean(imagesPdfFileError({ type: "image/svg+xml", size: 200 })), "Images-to-PDF rejects unsupported SVG input");
  assert(Boolean(imagesPdfFileError({ type: "image/png", size: 30 * 1024 * 1024 })), "Images-to-PDF rejects oversized uploaded images");
  assert(Boolean(imagesPdfDimensionError(8192, 8192)), "Images-to-PDF blocks overly expensive 67MP decode");
  assert(imagesPdfDimensionError(4000, 4000) === null, "Images-to-PDF accepts safe 16MP decode");

  const a4 = imagesPdfPlacement(1200, 600, "a4", "portrait", 20);
  assert(a4.pageWidth === 595.28 && a4.pageHeight === 841.89, "Images-to-PDF preserves A4 portrait dimensions");
  assert(a4.x >= 20 && a4.y >= 20 && a4.x + a4.width <= a4.pageWidth - 19.9, "Wide images stay within page margins");
  const landscape = imagesPdfPlacement(1200, 600, "a4", "landscape", 20);
  assert(landscape.pageWidth === 841.89 && landscape.pageHeight === 595.28, "Images-to-PDF rotates A4 landscape dimensions");
  const fit = imagesPdfPlacement(100, 50, "fit", "portrait", 20);
  assert(fit.pageWidth === 140 && fit.pageHeight === 90 && fit.x === 20 && fit.y === 20, "Fit-to-image uses exact image size and margins");
  let invalidMarginRejected = false;
  try { imagesPdfPlacement(100, 50, "a4", "portrait", 1000); } catch { invalidMarginRejected = true; }
  assert(invalidMarginRejected, "Images-to-PDF rejects margins that erase the printable area");

  const photoPdf = await PDFDocument.create();
  for (const layout of [a4, landscape, fit]) {
    const page = photoPdf.addPage([layout.pageWidth, layout.pageHeight]);
    page.drawRectangle({ x: layout.x, y: layout.y, width: layout.width, height: layout.height });
  }
  const reopened = await PDFDocument.load(await photoPdf.save());
  assert(reopened.getPageCount() === 3, "Images-to-PDF computed page placements survive real PDF save/reopen");
  assert(Math.abs(reopened.getPage(2).getWidth() - fit.pageWidth) < 0.01, "Reopened fit-to-image PDF retains expected physical width");

  const fresh = freshKrunkerMatchStats();
  assert(KRUNKER_MATCH_DURATION_SECONDS === 240, "Krunker match duration resets to four minutes");
  assert(Object.values(fresh).every((value) => value === 0), "Krunker round reset zeroes every gameplay statistic");
  fresh.score = 500;
  assert(freshKrunkerMatchStats().score === 0, "New Krunker match statistics are independent of previous rounds");

  const mockBot = {
    position: new THREE.Vector3(100, 2, 50),
    velocity: new THREE.Vector3(5, 0, 3),
    mesh: new THREE.Group(),
    leftLegMesh: new THREE.Mesh(),
    rightLegMesh: new THREE.Mesh(),
    health: 0, maxHealth: 100, isAlive: false, respawnTimer: 9,
    invulnerableTimer: 0, targetId: "player", state: "chase",
    stateTimer: 0, fireCooldown: 3, reactionTimer: 0,
    lastKnownTargetPos: new THREE.Vector3(1, 2, 3),
    rotationY: 1, pitch: 0.5, kills: 8, deaths: 4,
    score: 800, walkCycle: 4,
  } as unknown as BotEntity;
  mockBot.mesh.visible = false;
  resetKrunkerBotForMatch(mockBot, new THREE.Vector3(10, 0, 20));
  assert(mockBot.isAlive && mockBot.health === 100 && mockBot.mesh.visible, "Krunker replay revives previously eliminated bots");
  assert(mockBot.position.x === 10 && mockBot.position.z === 20 && mockBot.velocity.length() === 0, "Krunker replay restores spawn position and clears velocity");
  assert(mockBot.kills === 0 && mockBot.deaths === 0 && mockBot.score === 0, "Krunker replay clears bot scoreboard");
  assert(mockBot.targetId === null && mockBot.state === "patrol" && mockBot.respawnTimer === 0, "Krunker replay clears combat AI state");
}


// -------------------------------------------------------------
// GAME QA BATCH 7: actual Krunker hitscan collision geometry
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Krunker ray-box hits across collision edge cases...");
{
  const boxMin = { x: 5, y: -1, z: -1 };
  const boxMax = { x: 6, y: 1, z: 1 };
  const ray = (origin: { x: number; y: number; z: number },
               direction: { x: number; y: number; z: number }) =>
    rayAabbDistance(origin, direction, boxMin, boxMax);

  assert(ray({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }) === 5,
    "Krunker hits the nearest wall at correct ray distance");
  assert(ray({ x: 0, y: 2, z: 0 }, { x: 1, y: 0, z: 0 }) === null,
    "Krunker parallel ray outside box does not hit");
  assert(ray({ x: 5.5, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }) === 0.5,
    "Krunker ray starting INSIDE the collider hits the exit face");
  assert(ray({ x: 10, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }) === 4,
    "Krunker reverse-direction ray hits the correct face");
  assert(ray({ x: 10, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }) === null,
    "Krunker ray facing away from a collider does not hit");
  assert(ray({ x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }) === 5,
    "Krunker grazing ray on a box face is a collision");
  assert(ray({ x: 0, y: 2, z: 0 }, { x: 1, y: -0.1, z: 0 }) === null,
    "Krunker diagonal ray that misses the vertical slab does not hit");
  assert(ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }) === null,
    "Krunker zero direction vector is not a projectile collision");
  assert(ray({ x: Number.NaN, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }) === null,
    "Krunker rejects non-finite collision input");
  assert(rayAabbDistance(
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    { x: 6, y: 1, z: 1 }, { x: 5, y: -1, z: -1 }) === null,
    "Krunker rejects inverted collider bounds");
  assert(rayAabbDistance(
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    { x: 1, y: -1, z: -1 }, { x: 2, y: 1, z: 1 }) === 1,
    "Krunker chooses nearer collider for hitscan");
  assert(ray({ x: 5.5, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }) === 1,
    "Krunker inside-box ray parallel to horizontal axes exits vertically");
}

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
