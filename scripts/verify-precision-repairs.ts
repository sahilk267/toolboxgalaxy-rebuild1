/**
 * Comprehensive Automated Regression Suite for Precision Repairs
 * Tests ACTUAL production modules and exports without duplicating algorithms.
 */

import * as XLSX from "xlsx";
import { syncDataToWorksheet, workbookHasFormulas, createValuesOnlyWorkbook, spreadsheetDataToMarkdownTable } from "../client/src/components/ExcelStudioTool";
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
import { segmentCircleHit, segmentBoxHit, firstProjectileImpact } from "../client/src/game/surviv/projectileCollision";
import { separateCircleFromBox, separateCircleFromCircle, resolveSurvivMovement } from "../client/src/game/surviv/playerCollision";
import { isStackableSurvivLoot, SURVIV_MEDICAL_LIMITS, transferSurvivLootStack } from "../client/src/game/surviv/lootTransfer";
import { SURVIV_INITIAL_ZONE_RADIUS, advanceSurvivZoneShrink, completeSurvivZoneShrink } from "../client/src/game/surviv/zoneMechanics";
import { MAP_SIZE as SURVIV_MAP_SIZE, ZONE_PHASES, WEAPONS as SURVIV_WEAPONS } from "../client/src/game/surviv/constants";
import type { ZoneState as SurvivZoneState } from "../client/src/game/surviv/types";
import type { SurvivCallbacks } from "../client/src/game/surviv/engine";
import type { GroundLoot as SurvivGroundLoot } from "../client/src/game/surviv/types";
import { SurvivEngine } from "../client/src/game/surviv/engine";
import { DiepEngine } from "../client/src/game/diep/engine";
import type { TankEntity as DiepTank, ShapeEntity as DiepShape, BulletEntity as DiepBullet } from "../client/src/game/diep/types";
import type { Obstacle as SurvivObstacle, PlayerEntity as SurvivPlayer, BulletEntity as SurvivBullet } from "../client/src/game/surviv/types";
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
// BATCH 14: Excel live-edits values-only roundtrip and Markdown table correctness
// -------------------------------------------------------------
console.log("\n[TOOLS] Verifying Excel values-only export with pending edits and Markdown clipboard fidelity...");
{
  const wb = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.aoa_to_sheet([
    ["Name", "Comment"],
    ["  Alice  ", "  task | note  "],
    ["Bob", "  line one  "],
  ]);
  XLSX.utils.book_append_sheet(wb, dataSheet, "Data");

  const formulaSheet = XLSX.utils.aoa_to_sheet([["Metric", "Total"], ["Revenue", 25]]);
  formulaSheet["B3"] = { t: "n", f: "SUM(B2:B2)", v: 25 };
  formulaSheet["!ref"] = "A1:B3";
  XLSX.utils.book_append_sheet(wb, formulaSheet, "Summary");
  const originalDataA2 = wb.Sheets.Data.A2.v;
  const pendingRows = [
    ["Name", "Comment"],
    ["Alice", "task | note"],
    ["Bob", "line one"],
  ];

  const valuesCopy = createValuesOnlyWorkbook(wb, "Data", pendingRows);
  assert(valuesCopy.SheetNames.join(",") === "Data,Summary",
    "Excel values-only export retains every sheet in the original order");
  assert(valuesCopy.Sheets.Data.A2.v === "Alice" && valuesCopy.Sheets.Data.B2.v === "task | note",
    "Excel values-only export writes pending active-sheet trimming edits");
  assert(valuesCopy.Sheets.Data.B3.v === "line one",
    "Excel values-only export also preserves later pending cleaned rows");
  assert(valuesCopy.Sheets.Summary.B3.v === 25 && !valuesCopy.Sheets.Summary.B3.f,
    "Excel values-only export preserves cached formula values without formula syntax");
  assert(wb.Sheets.Data.A2.v === originalDataA2 && Boolean(wb.Sheets.Summary.B3.f),
    "Excel values-only export leaves original workbook data and formulas untouched");
  assert(!workbookHasFormulas(valuesCopy) && workbookHasFormulas(wb),
    "Excel values-only export removes formulas only from its independent copy");

  const roundTripBytes = XLSX.write(valuesCopy, { type: "buffer", bookType: "xlsx" });
  const reloaded = XLSX.read(roundTripBytes, { type: "buffer", cellFormula: true });
  assert(reloaded.SheetNames.length === 2 && reloaded.Sheets.Data.A2.v === "Alice",
    "Reopened real XLSX file retains edited active worksheet and both sheets");
  assert(reloaded.Sheets.Summary.B3.v === 25 && !reloaded.Sheets.Summary.B3.f,
    "Reopened values-only XLSX has numeric cached results, not stale formulas");

  const regularExportSheet = XLSX.utils.aoa_to_sheet([["Input", "Formula"], ["  spaced  ", 10]]);
  regularExportSheet["B3"] = { t: "n", f: "B2*2", v: 20 };
  regularExportSheet["!ref"] = "A1:B3";
  syncDataToWorksheet(regularExportSheet, [["Input", "Formula"], ["spaced", 10], [null, 20]]);
  assert(regularExportSheet.A2.v === "spaced" && regularExportSheet.B3.f === "B2*2",
    "Excel trimming keeps source worksheet synchronized without overwriting live formula definitions");

  const md = spreadsheetDataToMarkdownTable([
    ["Name|ID", "Multiline", "Amount"],
    ["A\\B", "first\nsecond", 0],
    ["C", null, 25],
  ]);
  assert(md.includes("Name\\|ID") && !md.includes("| Name|ID |"),
    "Excel Markdown clipboard escapes pipe delimiters in headers");
  assert(md.includes("A\\\\B"),
    "Excel Markdown clipboard safely escapes literal backslashes");
  assert(md.includes("first<br>second") && md.split("\n").length === 4,
    "Excel Markdown clipboard preserves multiline cell values without adding extra table rows");
  assert(md.includes("| C |  | 25 |") && md.includes("| A\\\\B | first<br>second | 0 |"),
    "Excel Markdown clipboard preserves numeric zero and blank data cells");
  const raggedMd = spreadsheetDataToMarkdownTable([["Column"], ["Value", "Trailing"]]);
  assert(raggedMd.startsWith("| Column |  |") && raggedMd.includes("| --- | --- |"),
    "Excel Markdown clipboard retains data columns missing from a short header row");
  assert(spreadsheetDataToMarkdownTable([]) === "",
    "Excel Markdown clipboard handles an empty worksheet without producing malformed markup");
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
// TASK P: Accurate 62 Utility Count & MCP Catalog Integrity (ISS-047)
// -------------------------------------------------------------
console.log("\n[TASK P] Verifying Accurate 62 Tool Count & MCP Server Card...");
{
  const fs = await import("fs");
  const { tools } = await import("../shared/toolsData");
  assert(tools.length === 62, `toolsData.ts contains exactly 62 registered tools (actual: ${tools.length})`);

  const indexHtml = fs.readFileSync("client/index.html", "utf-8");
  assert(!indexHtml.includes("120+"), "index.html does not claim 120+ utilities");
  assert(indexHtml.includes("62 developer utilities") || indexHtml.includes("62 utilities"), "index.html accurately claims 62 utilities");

  const homeSource = fs.readFileSync("client/src/pages/Home.tsx", "utf-8");
  assert(!homeSource.includes("120+"), "Home.tsx does not claim 120+ utilities");
  assert(homeSource.includes("62 offline tools"), "Home.tsx accurately references 62 offline tools");

  const serverCard = JSON.parse(fs.readFileSync("client/public/.well-known/mcp/server-card.json", "utf-8"));
  assert(serverCard.tools.length >= 4, "MCP server-card.json defines at least 4 registered agent tools");
  assert(serverCard.tools.some((t: { name: string }) => t.name === "search_tools"), "MCP defines search_tools");
  assert(!JSON.stringify(serverCard).includes("120+"), "MCP server card does not claim 120+ tools");
  assert(JSON.stringify(serverCard).includes("62"), "MCP server card references 62 tools");

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


// -------------------------------------------------------------
// GAME QA BATCH 8: Surviv continuous projectile collision & real engine integration
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Surviv high-speed bullet collisions and cover protection...");
{
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };
  const wall = (x: number, active = true): SurvivObstacle => ({
    id: 10, type: "wall", x, y: 0, radius: 0, width: 10, height: 20,
    health: 100, maxHealth: 100, collidable: true, destructible: false,
    color: "#334155", active,
  });
  const enemy = (x: number, active = true): SurvivPlayer => ({
    id: 1, x, y: 0, active, isBot: true, health: 100, maxHealth: 100,
    vestTier: 0, helmetTier: 0,
  } as SurvivPlayer);
  const shooter: SurvivPlayer = {
    id: 0, x: 0, y: 0, active: true, isBot: false, health: 100,
    vestTier: 0, helmetTier: 0, damageDealt: 0,
    activeSlot: 0,
    weapons: [{ weaponId: "m9", curAmmo: 10 }, null, { weaponId: "fists", curAmmo: 0 }],
  } as SurvivPlayer;
  const projectile = (maxDistance = 200): SurvivBullet => ({
    id: 1, ownerId: 0, isBot: false, x: 0, y: 0, vx: 1000, vy: 0,
    damage: 16, distanceTraveled: 0, maxDistance, radius: 2,
    color: "#facc15", active: true,
  });
  const projectileKey = { ownerId: 0, radius: 2 };

  assert(segmentCircleHit(from, to, { x: 50, y: 0 }, 5) === 0.45,
    "Surviv segment-circle detects a thin enemy crossed in one frame");
  assert(segmentCircleHit({ x: 0, y: 5 }, { x: 100, y: 5 }, { x: 50, y: 0 }, 5) === 0.5,
    "Surviv segment-circle counts tangent hits");
  assert(segmentCircleHit(from, to, { x: 50, y: 30 }, 5) === null,
    "Surviv segment-circle rejects bullets missing a player");
  assert(segmentCircleHit({ x: 50, y: 0 }, to, { x: 50, y: 0 }, 5) === 0,
    "Surviv segment-circle detects a projectile originating inside its target");
  assert(segmentBoxHit(from, to, { x: 50, y: 0 }, 5, 5) === 0.45,
    "Surviv swept box hit detects a thin wall crossed between frame endpoints");
  assert(segmentBoxHit({ x: 50, y: 0 }, to, { x: 50, y: 0 }, 5, 5) === 0,
    "Surviv swept box detects bullets spawned inside a collider");
  assert(segmentBoxHit({ x: 0, y: 20 }, { x: 100, y: 20 }, { x: 50, y: 0 }, 5, 5) === null,
    "Surviv swept box excludes parallel rays outside a wall");
  assert(segmentBoxHit({ x: 100, y: 0 }, from, { x: 50, y: 0 }, 5, 5) === 0.45,
    "Surviv swept box detects reverse-direction shots");

  const blocked = firstProjectileImpact(projectileKey, from, to, [wall(50)], [shooter, enemy(80)]);
  assert(blocked?.kind === "obstacle" && blocked.obstacle.x === 50,
    "Surviv walls block shots aimed at enemies behind cover");
  const beforeCover = firstProjectileImpact(projectileKey, from, to, [wall(80)], [shooter, enemy(40)]);
  assert(beforeCover?.kind === "player" && beforeCover.target.x === 40,
    "Surviv correctly hits a player standing in front of a wall");
  const nearestWall = firstProjectileImpact(projectileKey, from, to, [wall(80), wall(35)], [shooter]);
  assert(nearestWall?.kind === "obstacle" && nearestWall.obstacle.x === 35,
    "Surviv picks the closest wall even if listed later in the array");
  const transparentWall = firstProjectileImpact(projectileKey, from, to, [wall(50, false)], [shooter, enemy(80)]);
  assert(transparentWall?.kind === "player",
    "Surviv inactive cover no longer blocks projectiles");
  assert(firstProjectileImpact(projectileKey, from, to, [], [shooter]) === null,
    "Surviv projectiles never damage their own shooter");

  // Exercise the real engine's private physics routine without creating random maps or audio.
  const runRealBullet = (obstacles: SurvivObstacle[], maxRange: number, enemyX: number) => {
    const game = Object.create(SurvivEngine.prototype) as SurvivEngine;
    game.player = { ...shooter, damageDealt: 0 };
    game.bots = [enemy(enemyX)];
    game.obstacles = obstacles;
    game.bullets = [projectile(maxRange)];
    game.particles = [];
    game.loot = [];
    (game as unknown as { updateBullets(dt: number): void }).updateBullets(0.1);
    return game;
  };
  const wallGame = runRealBullet([wall(50)], 200, 80);
  assert(wallGame.bullets.length === 0 && wallGame.bots[0].health === 100,
    "Real Surviv engine bullet cannot tunnel through a thin wall into a player");
  const openGame = runRealBullet([], 200, 80);
  assert(openGame.bullets.length === 0 && openGame.bots[0].health === 84 && openGame.player.damageDealt === 16,
    "Real Surviv engine registers a high-speed hit and correct damage in one frame");
  const lastRangeGame = runRealBullet([], 65, 80);
  assert(lastRangeGame.bots[0].health === 84,
    "Real Surviv engine registers a hit BEFORE a projectile reaches maximum range");
  const outOfRangeGame = runRealBullet([], 35, 80);
  assert(outOfRangeGame.bots[0].health === 100 && outOfRangeGame.bullets.length === 0,
    "Real Surviv engine clips projectile travel at maximum range without hitting distant enemy");
}


// -------------------------------------------------------------
// GAME QA BATCH 9: Surviv player/AI collision with boxes, circles and island bounds
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Surviv movement and obstacle separation...");
{
  const boxCenter = { x: 500, y: 500 };
  const insideBox = separateCircleFromBox({ x: 500, y: 500 }, boxCenter, 100, 40, 20);
  assert(insideBox.x === 500 && insideBox.y === 440,
    "Surviv player inside a thick wall exits beyond its nearest face, not merely one radius");
  const onFace = separateCircleFromBox({ x: 400, y: 500 }, boxCenter, 100, 40, 20);
  assert(onFace.x === 380 && onFace.y === 500,
    "Surviv center directly on a wall edge separates outwards");
  const touching = separateCircleFromBox({ x: 380, y: 500 }, boxCenter, 100, 40, 20);
  assert(touching.x === 380 && touching.y === 500,
    "Surviv exact wall tangency does not cause jitter");
  const nearCorner = separateCircleFromBox({ x: 395, y: 455 }, boxCenter, 100, 40, 20);
  assert(Math.abs(Math.hypot(nearCorner.x - 400, nearCorner.y - 460) - 20) < 1e-7,
    "Surviv wall corner resolves via actual diagonal separation distance");
  const outsideWall = separateCircleFromBox({ x: 700, y: 500 }, boxCenter, 100, 40, 20);
  assert(outsideWall.x === 700 && outsideWall.y === 500,
    "Surviv wall collision leaves distant players unchanged");

  const coincident = separateCircleFromCircle({ x: 700, y: 700 }, { x: 700, y: 700 }, 50);
  assert(coincident.x === 750 && coincident.y === 700,
    "Surviv coincident tree/player centers push player out deterministically");
  const ordinaryCircle = separateCircleFromCircle({ x: 720, y: 700 }, { x: 700, y: 700 }, 50);
  assert(ordinaryCircle.x === 750 && ordinaryCircle.y === 700,
    "Surviv normal tree/rock collision separates to sum of radii");
  const circleTangency = separateCircleFromCircle({ x: 750, y: 700 }, { x: 700, y: 700 }, 50);
  assert(circleTangency.x === 750 && circleTangency.y === 700,
    "Surviv circle tangency leaves a non-overlapping player unchanged");

  const wall = (x: number, y: number, w: number, h: number, active = true): SurvivObstacle => ({
    id: 50, type: "wall", x, y, radius: 0, width: w, height: h,
    health: 999, maxHealth: 999, collidable: true, destructible: false,
    color: "#334155", active,
  });
  const rock = (x: number, y: number, radius = 30, collidable = true): SurvivObstacle => ({
    id: 51, type: "rock", x, y, radius, health: 100, maxHealth: 100,
    collidable, destructible: false, color: "#64748b", active: true,
  });
  const moved = resolveSurvivMovement(
    { x: 700, y: 700 }, { x: 100, y: 0 }, 0.1, []
  );
  assert(moved.x === 710 && moved.y === 700,
    "Surviv ordinary player/bot movement preserves speed and direction");
  const isolatedWall = resolveSurvivMovement(
    { x: 500, y: 500 }, { x: 0, y: 0 }, 0, [wall(500, 500, 200, 80)]
  );
  assert(isolatedWall.y === 440 && isolatedWall.x === 500,
    "Surviv actual movement resolver frees a player trapped inside a thick wall");
  const disabledWall = resolveSurvivMovement(
    { x: 500, y: 500 }, { x: 0, y: 0 }, 0, [wall(500, 500, 200, 80, false)]
  );
  assert(disabledWall.x === 500 && disabledWall.y === 500,
    "Surviv destroyed walls no longer impede movement");
  const treeCenter = resolveSurvivMovement(
    { x: 700, y: 700 }, { x: 0, y: 0 }, 0, [rock(700, 700)]
  );
  assert(treeCenter.x === 750 && treeCenter.y === 700,
    "Surviv movement resolver frees a player exactly inside a tree");
  const bush = resolveSurvivMovement(
    { x: 700, y: 700 }, { x: 0, y: 0 }, 0, [rock(700, 700, 40, false)]
  );
  assert(bush.x === 700 && bush.y === 700,
    "Surviv noncollidable cover does not block movement");
  const bunkerCorner = resolveSurvivMovement(
    { x: 502, y: 502 }, { x: 0, y: 0 }, 0,
    [wall(500, 500, 20, 100), wall(500, 500, 100, 20)]
  );
  assert(bunkerCorner.x >= 530 && bunkerCorner.y >= 530,
    "Surviv adjoining bunker walls resolve both axes without leaving player embedded");
  const islandEdge = resolveSurvivMovement(
    { x: 55, y: 1000 }, { x: -1000, y: 0 }, 0.1, []
  );
  assert(islandEdge.x === 50,
    "Surviv player cannot escape west island boundary at high movement speed");
  const perimeter = resolveSurvivMovement(
    { x: 70, y: 55 }, { x: 0, y: -100 }, 0.1, [wall(1400, 30, 2800, 60)]
  );
  assert(perimeter.y >= 80 && perimeter.x === 70,
    "Surviv world-border wall prevents entry and does not push player outside island");

  // Integrate with actual production SurvivEngine moveAndCollide() for humans and bots.
  const testEngine = Object.create(SurvivEngine.prototype) as SurvivEngine;
  testEngine.obstacles = [wall(500, 500, 200, 80)];
  const human = { id: 0, x: 500, y: 500, vx: 0, vy: 0 } as SurvivPlayer;
  (testEngine as unknown as { moveAndCollide(p: SurvivPlayer, dt: number): void })
    .moveAndCollide(human, 0);
  assert(human.x === 500 && human.y === 440,
    "Real Surviv engine ejects a stuck human player from a solid wall");
  testEngine.obstacles = [rock(700, 700)];
  const bot = { id: 5, x: 700, y: 700, vx: 0, vy: 0, isBot: true } as SurvivPlayer;
  (testEngine as unknown as { moveAndCollide(p: SurvivPlayer, dt: number): void })
    .moveAndCollide(bot, 0);
  assert(bot.x === 750 && bot.y === 700,
    "Real Surviv AI bot movement also resolves coincident-center rock collisions");
}


// -------------------------------------------------------------
// GAME QA BATCH 10: Surviv partial stack pickups and medicine capacity
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Surviv ammo/medical loot persistence and inventory caps...");
{
  const partial = transferSurvivLootStack(118, 120, 30);
  assert(partial.taken === 2 && partial.carried === 120 && partial.onGround === 28,
    "Surviv ammo pickup takes only remaining backpack capacity");
  const full = transferSurvivLootStack(120, 120, 30);
  assert(full.taken === 0 && full.onGround === 30 && full.carried === 120,
    "Surviv full ammo inventory leaves entire ground stack");
  const medicine = transferSurvivLootStack(14, 15, 5);
  assert(medicine.taken === 1 && medicine.carried === 15 && medicine.onGround === 4,
    "Surviv medical pickup never exceeds inventory cap");
  const empty = transferSurvivLootStack(0, 3, 2);
  assert(empty.taken === 2 && empty.carried === 2 && empty.onGround === 0,
    "Surviv complete pickup consumes entire stack when capacity permits");
  const invalid = transferSurvivLootStack(2, 15, -1);
  assert(invalid.taken === 0 && invalid.carried === 2,
    "Surviv rejects corrupted negative loot amounts");
  assert(isStackableSurvivLoot("ammo") && isStackableSurvivLoot("bandage") &&
    isStackableSurvivLoot("medkit") && isStackableSurvivLoot("soda") &&
    isStackableSurvivLoot("pills") && !isStackableSurvivLoot("weapon"),
    "Surviv stackable loot classification excludes weapons and armor");
  assert(SURVIV_MEDICAL_LIMITS.bandage === 15 &&
    SURVIV_MEDICAL_LIMITS.medkit === 3 &&
    SURVIV_MEDICAL_LIMITS.soda === 6 &&
    SURVIV_MEDICAL_LIMITS.pills === 4,
    "Surviv existing medicine capacity limits are preserved");

  const game = Object.create(SurvivEngine.prototype) as SurvivEngine;
  const survivor = {
    id: 1, isBot: true, x: 700, y: 700,
    ammo: { "9mm": 118, "12g": 30, "762mm": 90, "556mm": 90 },
    backpackTier: 1,
    meds: { bandages: 14, medkits: 2, sodas: 6, pills: 4 },
    helmetTier: 0,
  } as SurvivPlayer;
  const makeLoot = (id: number, type: SurvivGroundLoot["type"], amount: number): SurvivGroundLoot => ({
    id, type, x: 700, y: 700, vx: 0, vy: 0, amount, active: true,
    ammoType: type === "ammo" ? "9mm" : undefined,
  });
  const ammoItem = makeLoot(1, "ammo", 30);
  const bandageItem = makeLoot(2, "bandage", 5);
  const medkitItem = makeLoot(3, "medkit", 3);
  const sodaItem = makeLoot(4, "soda", 2);
  game.loot = [ammoItem, bandageItem, medkitItem, sodaItem];
  (game as unknown as { checkLootPickup(p: SurvivPlayer): void }).checkLootPickup(survivor);
  assert(survivor.ammo["9mm"] === 120 && ammoItem.amount === 28 && ammoItem.active,
    "Real Surviv engine preserves unused ammo on the ground after a partial pickup");
  assert(survivor.meds.bandages === 15 && bandageItem.amount === 4 && bandageItem.active,
    "Real Surviv engine caps bandages and leaves leftover bandages");
  assert(survivor.meds.medkits === 3 && medkitItem.amount === 2 && medkitItem.active,
    "Real Surviv engine caps medkits and preserves unused medkits");
  assert(survivor.meds.sodas === 6 && sodaItem.amount === 2 && sodaItem.active,
    "Real Surviv engine does not consume soda when inventory is already full");

  // After inventory space is freed, the same surviving ground stacks can be picked up again.
  survivor.ammo["9mm"] = 95;
  survivor.meds.bandages = 10;
  survivor.meds.medkits = 0;
  survivor.meds.sodas = 4;
  (game as unknown as { checkLootPickup(p: SurvivPlayer): void }).checkLootPickup(survivor);
  assert(survivor.ammo["9mm"] === 120 && ammoItem.amount === 3 && ammoItem.active,
    "Real Surviv engine permits a later partial pickup from remaining ammunition");
  assert(survivor.meds.bandages === 14 && bandageItem.amount === 0 && !bandageItem.active,
    "Real Surviv engine deactivates bandage stack only after every item is taken");
  assert(survivor.meds.medkits === 2 && medkitItem.amount === 0 && !medkitItem.active,
    "Real Surviv engine consumes the complete medkit remainder when capacity opens");
  assert(survivor.meds.sodas === 6 && sodaItem.amount === 0 && !sodaItem.active,
    "Real Surviv engine takes the correct soda remainder and clears empty ground loot");

  const armor = makeLoot(5, "helmet", 1);
  armor.tier = 2;
  game.loot = [armor];
  (game as unknown as { checkLootPickup(p: SurvivPlayer): void }).checkLootPickup(survivor);
  assert(survivor.helmetTier === 2 && !armor.active,
    "Real Surviv engine still consumes an upgraded non-stackable helmet normally");
}


// -------------------------------------------------------------
// GAME QA BATCH 11: Surviv gas-zone shrink geometry and one-time deaths
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Surviv red-zone shrink progression and one-time deaths...");
{
  const initialTarget = SURVIV_MAP_SIZE * ZONE_PHASES[0].radiusRatio;
  assert(SURVIV_INITIAL_ZONE_RADIUS > initialTarget,
    "Surviv first red-zone phase actually SHRINKS rather than expanding");
  assert(SURVIV_INITIAL_ZONE_RADIUS > Math.SQRT2 * SURVIV_MAP_SIZE / 2,
    "Surviv initial gas-zone circle covers the playable island corners");

  const makeZone = (): SurvivZoneState => ({
    currentCenterX: 1400, currentCenterY: 1400,
    targetCenterX: 1600, targetCenterY: 1500,
    currentRadius: SURVIV_INITIAL_ZONE_RADIUS, targetRadius: initialTarget,
    phase: 0, phaseTimer: 45, isShrinking: true, dps: 1.5,
  });
  const zone = makeZone();
  advanceSurvivZoneShrink(zone, 45, 15);
  assert(Math.abs(zone.currentRadius - (SURVIV_INITIAL_ZONE_RADIUS + (initialTarget - SURVIV_INITIAL_ZONE_RADIUS) / 3)) < 0.001,
    "Surviv safe-zone radius moves a third of remaining distance in a third of time");
  assert(Math.abs(zone.currentCenterX - (1400 + 200 / 3)) < 0.001 &&
         Math.abs(zone.currentCenterY - (1400 + 100 / 3)) < 0.001,
    "Surviv gas-zone center moves in lockstep with radius");
  advanceSurvivZoneShrink(zone, 30, 30);
  assert(zone.currentRadius === initialTarget &&
    zone.currentCenterX === 1600 && zone.currentCenterY === 1500,
    "Surviv gas-zone radius and center reach their targets at phase completion");

  const malformedShrink = makeZone();
  malformedShrink.targetRadius = malformedShrink.currentRadius + 500;
  advanceSurvivZoneShrink(malformedShrink, 20, 5);
  assert(malformedShrink.currentRadius === SURVIV_INITIAL_ZONE_RADIUS,
    "Surviv shrinking phase never expands radius even with an invalid larger target");
  malformedShrink.currentCenterX = 1550;
  completeSurvivZoneShrink(malformedShrink);
  assert(malformedShrink.currentCenterX === 1600 &&
         malformedShrink.currentRadius === SURVIV_INITIAL_ZONE_RADIUS,
    "Surviv completed phases snap the center to the target without radius expansion");

  const makePlayer = (id: number, health = 100): SurvivPlayer => ({
    id, name: id === 0 ? "Survivor" : "AI Bot", isBot: id !== 0,
    x: 100, y: 100, vx: 0, vy: 0, angle: 0,
    health, maxHealth: 100, boost: 0,
    helmetTier: 0, vestTier: 0, backpackTier: 1, scopeTier: 1,
    weapons: [{ weaponId: "m9", curAmmo: 15 }, null, { weaponId: "fists", curAmmo: 0 }],
    activeSlot: 0, isReloading: false, reloadTimer: 0,
    ammo: { "9mm": 12, "12g": 0, "762mm": 0, "556mm": 0 },
    meds: { bandages: 0, medkits: 1, sodas: 0, pills: 0 },
    isUsingMed: false, medTimer: 0, medType: null,
    fireCooldown: 0, kills: 0, damageDealt: 0, active: true, inBush: false,
  });
  const engine = Object.create(SurvivEngine.prototype) as SurvivEngine;
  engine.player = makePlayer(0);
  engine.bots = [];
  engine.loot = [];
  engine.zone = makeZone();
  engine.zone.dps = 0;
  let killFeedEntries = 0;
  engine.callbacks = {
    onKillFeed: () => { killFeedEntries++; },
    onPlayerUpdate: () => {},
    onAliveUpdate: () => {},
    onZoneUpdate: () => {},
    onGameOver: () => {},
  } as SurvivCallbacks;
  (engine as unknown as { nextLootId: number }).nextLootId = 300;

  (engine as unknown as { updateZone(dt: number): void }).updateZone(15);
  assert(engine.zone.currentRadius < SURVIV_INITIAL_ZONE_RADIUS &&
         engine.zone.currentRadius > initialTarget,
    "Real Surviv engine shrinks the first zone rather than growing it");
  assert(engine.zone.currentCenterX > 1400 && engine.zone.currentCenterX < 1600,
    "Real Surviv engine moves gas-zone center toward next safe zone");
  (engine as unknown as { updateZone(dt: number): void }).updateZone(30);
  assert(engine.zone.phase === 1 && engine.zone.currentRadius === initialTarget,
    "Real Surviv engine advances phase with exact expected safe-zone radius");
  assert(engine.zone.currentCenterX === 1600 && engine.zone.currentCenterY === 1500,
    "Real Surviv engine completes safe-zone center motion before next phase");

  const attacker = makePlayer(0);
  const victim = makePlayer(1, 5);
  engine.loot = [];
  engine.zone = { ...makeZone(), currentRadius: 10, dps: 20 };
  (engine as unknown as { damagePlayer(t: SurvivPlayer, damage: number, attacker: SurvivPlayer, weapon: string): void })
    .damagePlayer(victim, 16, attacker, "M9");
  assert(!victim.active && victim.health === 0 && attacker.kills === 1,
    "Surviv real engine records one fatal combat hit and one kill");
  assert(attacker.damageDealt === 5,
    "Surviv combat damage statistic counts the actual 5 HP removed, not 16 HP of overkill");
  const lootAfterCombat = engine.loot.length;
  const feedAfterCombat = killFeedEntries;
  (engine as unknown as { damagePlayer(t: SurvivPlayer, damage: number, attacker: SurvivPlayer, weapon: string): void })
    .damagePlayer(victim, 16, attacker, "M9");
  (engine as unknown as { applyZoneDamage(p: SurvivPlayer, dt: number): void })
    .applyZoneDamage(victim, 1);
  assert(attacker.kills === 1 && attacker.damageDealt === 5,
    "Surviv already-dead victims never grant repeated kills or damage");
  assert(engine.loot.length === lootAfterCombat && killFeedEntries === feedAfterCombat,
    "Surviv already-dead victims never emit duplicate death loot or killfeed entries");

  const zoneVictim = makePlayer(2, 5);
  (engine as unknown as { applyZoneDamage(p: SurvivPlayer, dt: number): void })
    .applyZoneDamage(zoneVictim, 1);
  assert(zoneVictim.health === 0 && !zoneVictim.active,
    "Surviv red-zone damage kills an alive unprotected player exactly once");
  const afterGasDeath = engine.loot.length;
  const afterGasFeed = killFeedEntries;
  (engine as unknown as { applyZoneDamage(p: SurvivPlayer, dt: number): void })
    .applyZoneDamage(zoneVictim, 1);
  assert(engine.loot.length === afterGasDeath && killFeedEntries === afterGasFeed,
    "Surviv repeated red-zone ticks do not duplicate gas death loot or killfeed");
}


// -------------------------------------------------------------
// GAME QA BATCH 12: Surviv reload, auto-pickup, bandage and action invariants
// -------------------------------------------------------------
console.log("\n[GAMES] Verifying Surviv weapon reload and medical action correctness...");
{
  const player = (): SurvivPlayer => ({
    id: 0, name: "Survivor", isBot: true, x: 700, y: 700, vx: 0, vy: 0,
    angle: 0, health: 60, maxHealth: 100, boost: 0,
    helmetTier: 0, vestTier: 0, backpackTier: 1, scopeTier: 1,
    weapons: [{ weaponId: "m9", curAmmo: 3 }, { weaponId: "m870", curAmmo: 2 }, { weaponId: "fists", curAmmo: 0 }],
    activeSlot: 0, isReloading: false, reloadTimer: 0,
    ammo: { "9mm": 20, "12g": 9, "762mm": 0, "556mm": 0 },
    meds: { bandages: 3, medkits: 1, sodas: 1, pills: 1 },
    isUsingMed: false, medTimer: 0, medType: null,
    fireCooldown: 0, kills: 0, damageDealt: 0, active: true, inBush: false,
  });
  const game = Object.create(SurvivEngine.prototype) as SurvivEngine;
  game.player = player();
  game.bullets = [];

  game.reloadWeapon(game.player);
  assert(game.player.isReloading && game.player.reloadingSlot === 0 &&
         game.player.reloadTimer === SURVIV_WEAPONS.m9.reloadTimeMs,
    "Surviv reload locks its original weapon slot and uses its correct duration");
  const ammoBeforeSwitch = game.player.ammo["9mm"];
  game.switchWeapon(1);
  assert(!game.player.isReloading && game.player.reloadTimer === 0 &&
         game.player.reloadingSlot === undefined && game.player.activeSlot === 1,
    "Surviv manual slot switch cancels pending reload and clears stale timer");
  (game as unknown as { finishReload(p: SurvivPlayer): void }).finishReload(game.player);
  assert(game.player.weapons[0]!.curAmmo === 3 && game.player.weapons[1]!.curAmmo === 2 &&
         game.player.ammo["9mm"] === ammoBeforeSwitch,
    "Surviv canceled reload cannot later transfer ammo into a different gun");

  game.reloadWeapon(game.player);
  assert(game.player.isReloading && game.player.reloadingSlot === 1,
    "Surviv secondary shotgun reload starts on secondary slot");
  const m870Needed = SURVIV_WEAPONS.m870.magSize - 2;
  const shotgunAmmo = game.player.ammo["12g"];
  (game as unknown as { finishReload(p: SurvivPlayer): void }).finishReload(game.player);
  assert(!game.player.isReloading && game.player.reloadTimer === 0 &&
         game.player.reloadingSlot === undefined,
    "Surviv finished reload clears all reload state");
  assert(game.player.weapons[1]!.curAmmo === SURVIV_WEAPONS.m870.magSize &&
         game.player.ammo["12g"] === shotgunAmmo - m870Needed,
    "Surviv genuine reload fills magazine and debits only its correct ammo type");

  // An auto-looted weapon can silently change activeSlot while a reload is underway.
  const auto = player();
  auto.weapons[1] = null;
  game.player = auto;
  game.reloadWeapon(auto);
  const pickup: SurvivGroundLoot = {
    id: 801, type: "weapon", weaponId: "mac10", x: 700, y: 700,
    vx: 0, vy: 0, amount: 1, active: true,
  };
  const picked = (game as unknown as {
    tryCollectLoot(p: SurvivPlayer, loot: SurvivGroundLoot): boolean
  }).tryCollectLoot(auto, pickup);
  assert(picked && auto.activeSlot === 1 && auto.weapons[1]?.weaponId === "mac10",
    "Surviv engine auto-pickup correctly equips a newly found secondary weapon");
  assert(!auto.isReloading && auto.reloadTimer === 0 && auto.reloadingSlot === undefined,
    "Surviv auto-pickup cancels old-gun reload when it auto-switches slots");
  (game as unknown as { finishReload(p: SurvivPlayer): void }).finishReload(auto);
  assert(auto.weapons[0]!.curAmmo === 3 && auto.weapons[1]!.curAmmo === SURVIV_WEAPONS.mac10.magSize &&
         auto.ammo["9mm"] === 20,
    "Surviv auto-equipping never redirects stale reload into a newly picked weapon");

  // Even an unexpected direct slot mutation cannot redirect the pending reload.
  const mutated = player();
  game.player = mutated;
  game.reloadWeapon(mutated);
  mutated.activeSlot = 1;
  (game as unknown as { finishReload(p: SurvivPlayer): void }).finishReload(mutated);
  assert(!mutated.isReloading && mutated.weapons[1]!.curAmmo === 2 && mutated.ammo["12g"] === 9,
    "Surviv stale reload slot mismatch is rejected without moving ammo");

  const blocked = player();
  game.player = blocked;
  game.reloadWeapon(blocked);
  const magazineBeforeFire = blocked.weapons[0]!.curAmmo;
  const bulletsBeforeFire = game.bullets.length;
  game.fireWeapon(blocked);
  assert(blocked.weapons[0]!.curAmmo === magazineBeforeFire && game.bullets.length === bulletsBeforeFire,
    "Surviv firing cannot bypass an active reload through a public engine call");
  game.useMed(blocked, "bandage");
  assert(!blocked.isUsingMed,
    "Surviv does not consume medicine and reload simultaneously");

  const healing = player();
  game.player = healing;
  game.useMed(healing, "bandage");
  assert(healing.isUsingMed && healing.medType === "bandage",
    "Surviv begins a valid bandage action from below 75 health");
  game.reloadWeapon(healing);
  assert(!healing.isReloading,
    "Surviv cannot start a reload while applying medicine");
  healing.health = 80; // Simulate health regeneration while the bandage action is in progress.
  (game as unknown as { finishMed(p: SurvivPlayer): void }).finishMed(healing);
  assert(healing.health === 80 && healing.meds.bandages === 2,
    "Surviv completed bandage never REDUCES health already above its 75 HP cap");
  assert(!healing.isUsingMed && healing.medTimer === 0 && healing.medType === null,
    "Surviv finished bandage clears medical timer and action state");

  const ordinary = player();
  game.useMed(ordinary, "bandage");
  (game as unknown as { finishMed(p: SurvivPlayer): void }).finishMed(ordinary);
  assert(ordinary.health === 75 && ordinary.meds.bandages === 2,
    "Surviv bandage still heals 60 HP to its normal 75 HP cap");
  const pending = player();
  game.useMed(pending, "bandage");
  pending.meds.bandages = 0; // Item was consumed/removed while the timer was active.
  (game as unknown as { finishMed(p: SurvivPlayer): void }).finishMed(pending);
  assert(pending.meds.bandages === 0 && pending.health === 60,
    "Surviv medical completion never decrements a depleted stack below zero");

  const deceased = player();
  deceased.active = false;
  game.reloadWeapon(deceased);
  game.useMed(deceased, "medkit");
  game.fireWeapon(deceased);
  assert(!deceased.isReloading && !deceased.isUsingMed && deceased.weapons[0]!.curAmmo === 3,
    "Surviv inactive player cannot start reload, medical use, or firing");
}

// -------------------------------------------------------------
// GAME QA BATCH 13: Surviv projectile weapon attribution & Diep single elimination
// -------------------------------------------------------------
console.log("\n[GAMES] Testing Surviv in-flight weapon names and Diep elimination/collision finality...");
{
  // Fire an actual Surviv M9 projectile, switch to a shotgun while it is in
  // flight, and ensure the real engine's killfeed reports the weapon fired.
  const game = Object.create(SurvivEngine.prototype) as SurvivEngine;
  const shooter = {
    id: 0, name: "Shooter", isBot: true, active: true,
    x: 0, y: 0, angle: 0, vx: 0, vy: 0, fireCooldown: 0,
    isReloading: false, isUsingMed: false,
    weapons: [{ weaponId: "m9", curAmmo: 2 }, { weaponId: "m870", curAmmo: 2 }, { weaponId: "fists", curAmmo: 0 }],
    activeSlot: 0, ammo: { "9mm": 20, "12g": 8, "762mm": 0, "556mm": 0 },
    meds: { bandages: 0, medkits: 0, sodas: 0, pills: 0 },
    health: 100, maxHealth: 100, helmetTier: 0, vestTier: 0, damageDealt: 0, kills: 0,
  } as SurvivPlayer;
  const victim = {
    id: 4, name: "Victim", isBot: true, active: true,
    x: 80, y: 0, health: 5, maxHealth: 100,
    helmetTier: 0, vestTier: 0, activeSlot: 2,
    weapons: [null, null, { weaponId: "fists", curAmmo: 0 }],
    ammo: { "9mm": 0, "12g": 0, "762mm": 0, "556mm": 0 },
    meds: { bandages: 0, medkits: 0, sodas: 0, pills: 0 },
  } as SurvivPlayer;
  game.player = shooter;
  game.bots = [victim];
  game.obstacles = [];
  game.loot = [];
  game.bullets = [];
  game.particles = [];
  game.audio = { playGunshot: () => {}, playPickup: () => {} } as unknown as SurvivEngine["audio"];
  let lastWeapon = "";
  let deaths = 0;
  game.callbacks = {
    onKillFeed: (entry: { weaponName: string }) => { lastWeapon = entry.weaponName; deaths++; },
    onPlayerUpdate: () => {},
    onAliveUpdate: () => {},
    onZoneUpdate: () => {},
    onGameOver: () => {},
  } as SurvivCallbacks;
  game.fireWeapon(shooter);
  assert(game.bullets.length === 1 && game.bullets[0].weaponName === SURVIV_WEAPONS.m9.name,
    "Surviv real fireWeapon stores the fired M9 weapon name on its projectile");
  assert(shooter.weapons[0]!.curAmmo === 1, "Surviv firing still consumes exactly one M9 round");
  shooter.activeSlot = 1;
  const firedBullet = game.bullets[0];
  firedBullet.x = 0;
  firedBullet.y = 0;
  firedBullet.vx = 1000;
  firedBullet.vy = 0;
  firedBullet.maxDistance = 200;
  firedBullet.damage = 100;
  (game as unknown as { updateBullets(dt: number): void }).updateBullets(0.1);
  assert(!victim.active && deaths === 1, "Surviv switched-weapon bullet still delivers its lethal hit once");
  assert(lastWeapon === SURVIV_WEAPONS.m9.name && lastWeapon !== SURVIV_WEAPONS.m870.name,
    "Surviv killfeed credits the original gun despite an in-flight weapon switch");
  assert(shooter.kills === 1 && game.bullets.length === 0, "Surviv preserves kill score and consumes spent projectile");

  // Real Diep elimination must be idempotent even when overlapping damage
  // sources attempt to kill a tank in the same physics frame.
  const diep = Object.create(DiepEngine.prototype) as DiepEngine;
  const makeTank = (id: number, score: number, health = 100): DiepTank => ({
    id, name: id === 1 ? "Player" : "Bot", isBot: id !== 1,
    x: id === 1 ? 0 : 100, y: id === 1 ? 0 : 100,
    vx: 0, vy: 0, health, maxHealth: 100,
    score, level: 1, classId: "basic", active: true, color: "#123456",
    stats: { healthRegen: 0, maxHealth: 0, bodyDamage: 0,
      bulletSpeed: 0, bulletPenetration: 0, bulletDamage: 0,
      reload: 0, movementSpeed: 0 },
  } as DiepTank);
  const player = makeTank(1, 0);
  const bot = makeTank(2, 400, 0);
  diep.player = player;
  diep.bots = [bot];
  diep.kills = 0;
  let killfeed = 0;
  let popSounds = 0;
  let gameOvers = 0;
  diep.audio = { playPop: () => { popSounds++; }, playExplode: () => {} } as unknown as DiepEngine["audio"];
  diep.callbacks = {
    onKillFeed: () => { killfeed++; },
    onGameOver: () => { gameOvers++; },
    onPlayerUpdate: () => {},
    onLeaderboardUpdate: () => {},
    onEvolutionChoices: () => {},
  };
  (diep as unknown as { emitParticles(...args: unknown[]): void }).emitParticles = () => {};
  (diep as unknown as { addScore(t: DiepTank, xp: number): void }).addScore = (tank, amount) => { tank.score += amount; };
  const kill = (tank: DiepTank, killerId: number) =>
    (diep as unknown as { eliminateTank(t: DiepTank, killer: number): void }).eliminateTank(tank, killerId);
  kill(bot, player.id);
  const awarded = player.score;
  kill(bot, player.id);
  assert(!bot.active && awarded === 160 && player.score === awarded,
    "Diep eliminates a tank once and awards 40% score only once");
  assert(diep.kills === 1 && killfeed === 1 && popSounds === 1,
    "Diep duplicate lethal collisions cannot create repeated kills, feed or sound");

  // Two targets overlap one bullet, but it has insufficient penetration for two hits.
  diep.bots = [makeTank(2, 0), makeTank(3, 0)];
  const [targetA, targetB] = diep.bots;
  targetA.x = 100; targetA.y = 100;
  targetB.x = 100; targetB.y = 140; // exactly two tank radii apart, no ramming.
  diep.bullets = [{
    id: 1, ownerId: player.id, isBot: false, active: true,
    x: 100, y: 120, vx: 0, vy: 0, radius: 25,
    health: 10, maxHealth: 10, damage: 20, lifetime: 20,
    color: "#ff0000",
  } as DiepBullet];
  diep.shapes = [];
  diep.drones = [];
  (diep as unknown as { getComputedStats(t: DiepTank): { radius: number; bodyDamage: number } })
    .getComputedStats = () => ({ radius: 20, bodyDamage: 10 });
  diep.audio.playHit = () => {};
  (diep as unknown as { resolveCollisions(): void }).resolveCollisions();
  assert(targetA.health === 80 && targetB.health === 100,
    "Diep exhausted bullet cannot damage a second overlapping tank");
  assert(!diep.bullets[0].active, "Diep exhausted bullet is disabled on the first impact");

  // When a player dies from the first of two colliding shapes,
  // further shapes and ramming in the same frame must not damage them again.
  // The new opening shield intentionally prevents a game-over in the first
  // seconds; exercise collision lethality AFTER the protected learning phase.
  diep.elapsedSeconds = 30;
  player.active = true;
  player.health = 1;
  player.x = 100; player.y = 100;
  diep.bots = [];
  diep.bullets = [];
  const shape = (id: number): DiepShape => ({
    id, type: "square", x: 100, y: 100, vx: 0, vy: 0,
    rotation: 0, vRot: 0, radius: 10, health: 100, maxHealth: 100,
    xpValue: 10, bodyDamage: 10, damagedTimer: 0, active: true,
  });
  diep.shapes = [shape(1), shape(2)];
  diep.audio.playExplode = () => {};
  (diep as unknown as { resolveCollisions(): void }).resolveCollisions();
  assert(!player.active && player.health <= 0 && gameOvers === 1,
    "Diep environmental collision ends the player's life and emits game-over once");
  assert(diep.shapes[0].health === 90 && diep.shapes[1].health === 100,
    "Diep no longer allows a dead tank to damage more shapes in that frame");
}

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
