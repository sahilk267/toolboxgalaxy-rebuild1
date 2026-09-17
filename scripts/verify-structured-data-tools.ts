import { tools } from "../client/src/data/toolRegistry";
import { cleanCsvTable, csvToJson, jsonToCsv, previewCsvTable, tableFromCsv, tableToCsv } from "../client/src/lib/structuredDataEngines";

let failures = 0;
function assert(condition: unknown, name: string) { if (condition) console.log(`PASS · ${name}`); else { failures += 1; console.error(`FAIL · ${name}`); } }
const valueOf = <T>(result: { value?: T; error?: string }) => result.value;
const batchSlugs = ["json-csv-converter", "csv-viewer-cleaner"];
assert(tools.length >= 37 && new Set(tools.map((tool) => tool.slug)).size === tools.length && new Set(tools.map((tool) => tool.name)).size === tools.length && new Set(tools.map((tool) => tool.kind)).size === tools.length && batchSlugs.every((slug) => tools.some((tool) => tool.slug === slug)), "Structured Data Batch 3 remains a unique registry without duplicate slug, name, or runner kind");

const jsonSource = '[{"id":1,"memo":"North, \\"new\\"\\nline","ok":true,"gone":null},{"id":2,"new field":"arrived"}]';
const jsonCsv = valueOf(jsonToCsv(jsonSource));
assert(jsonCsv?.table.headers.join("|") === "id|memo|ok|gone|new field" && jsonCsv?.csv.includes('"North, ""new""\nline"') && jsonCsv?.csv.includes("\r\n"), "JSON → CSV unions first-seen flat-object fields and safely escapes commas, quotes, and embedded newlines");
assert(Boolean(jsonToCsv('[{"nested":{"x":1}}]').error) && Boolean(jsonToCsv('[]').error), "JSON → CSV rejects empty arrays and nested structured values rather than flattening ambiguously");

const parsed = valueOf(csvToJson('name,note\r\nAsha,"hello, world\nand more"\r\nKiran,done'));
assert(parsed?.table.rows.length === 2 && parsed?.table.rows[0][1] === "hello, world\nand more" && parsed?.json.includes('"name": "Asha"'), "CSV → JSON reads RFC-style quoted commas and embedded newlines into string fields");
assert(Boolean(tableFromCsv('name,name\nAsha,Kiran').error) && Boolean(tableFromCsv('name,task\nAsha').error) && Boolean(tableFromCsv('name\n"unclosed').error), "CSV parsing rejects duplicate headers, non-rectangular rows, and unclosed quoted cells");

const cleaned = valueOf(cleanCsvTable('name,task\n Asha , Review \n\n Kiran , Ship ', { trimCells: true, removeEmptyRows: true }));
assert(cleaned?.trimmedCells === 4 && cleaned?.removedRows === 1 && cleaned?.table.rows.length === 2 && cleaned?.csv.includes("Asha,Review"), "CSV Viewer & Cleaner trims only cell edges and removes fully blank rows in the current local table");
assert(tableToCsv({ headers: ["note"], rows: [["=SUM(A1:A2)"]] }) === "note\r\n'=SUM(A1:A2)", "CSV export prefixes formula-looking cells so spreadsheet apps receive text, while the preview never evaluates cells");
const bounded = previewCsvTable({ headers: Array.from({ length: 13 }, (_, index) => `f${index}`), rows: Array.from({ length: 13 }, (_, index) => Array.from({ length: 13 }, () => String(index))) });
assert(bounded.headers.length === 12 && bounded.rows.length === 12 && bounded.truncated, "Table preview limits the rendered local viewport to 12 rows and 12 fields without truncating export data");
assert(Boolean(tableFromCsv("a".repeat(250_001)).error), "CSV parsing explains the bounded current-tab character limit");

if (failures) { console.error(`\n${failures} structured-data regression(s) failed.`); process.exit(1); }
console.log("\nAll Structured Data Batch 3 regressions passed.");
