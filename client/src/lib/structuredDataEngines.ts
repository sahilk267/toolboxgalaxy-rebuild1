export type StructuredResult<T> = { value: T; error?: never } | { value?: never; error: string };

export type CsvTable = { headers: string[]; rows: string[][] };

const maxCharacters = 250_000;
const maxRows = 2_000;
const maxColumns = 60;
const plainObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const primitiveCell = (value: unknown) => value === null || value === undefined ? "" : typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : null;
const emptyRow = (row: string[]) => row.every((cell) => !cell.trim());

export function parseCsvRows(input: string): StructuredResult<string[][]> {
  if (input.length > maxCharacters) return { error: "Use a smaller pasted CSV (up to 250,000 characters) for this local workspace." };
  const source = input.replace(/^\uFEFF/, ""); if (!source.trim()) return { error: "Paste a CSV table with a header row." };
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false; let justClosedQuote = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]; const next = source[index + 1];
    if (quoted) { if (char === '"' && next === '"') { cell += '"'; index += 1; } else if (char === '"') { quoted = false; justClosedQuote = true; } else cell += char; continue; }
    if (char === '"') { if (cell) return { error: `Unexpected quote in row ${rows.length + 1}. Quote a whole cell and escape internal quotes as double quotes.` }; quoted = true; justClosedQuote = false; continue; }
    if (justClosedQuote && char !== "," && char !== "\n" && char !== "\r") return { error: `Unexpected character after a closing quote in row ${rows.length + 1}.` };
    if (char === ",") { row.push(cell); cell = ""; justClosedQuote = false; continue; }
    if (char === "\n" || char === "\r") { if (char === "\r" && next === "\n") index += 1; row.push(cell); rows.push(row); row = []; cell = ""; justClosedQuote = false; continue; }
    cell += char;
  }
  if (quoted) return { error: "A quoted CSV cell is not closed." };
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (rows.length > maxRows + 1) return { error: "Use a table with up to 2,000 data rows in this local workspace." };
  return { value: rows };
}

export function tableFromCsv(input: string): StructuredResult<CsvTable> {
  const parsed = parseCsvRows(input); if ("error" in parsed) return { error: parsed.error ?? "CSV could not be read." };
  const [rawHeaders, ...rawRows] = parsed.value; const headers = rawHeaders.map((header) => header.trim());
  if (!headers.length || headers.some((header) => !header)) return { error: "Every CSV header must contain a name." };
  if (headers.length > maxColumns) return { error: "Use a table with up to 60 columns in this local workspace." };
  if (new Set(headers.map((header) => header.toLocaleLowerCase())).size !== headers.length) return { error: "CSV headers must be unique (ignoring case) for a reliable table." };
  const rows: string[][] = [];
  for (let index = 0; index < rawRows.length; index += 1) { const row = rawRows[index]; if (emptyRow(row)) { rows.push(Array(headers.length).fill("")); continue; } if (row.length !== headers.length) return { error: `Row ${index + 2} has ${row.length} cells; the header has ${headers.length}.` }; rows.push(row); }
  return { value: { headers, rows } };
}

const csvCell = (rawValue: string) => { const value = /^\s*[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue; return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value; };
export function tableToCsv(table: CsvTable) { return [table.headers, ...table.rows].map((row) => row.map(csvCell).join(",")).join("\r\n"); }

export function previewCsvTable(table: CsvTable, rowLimit = 12, columnLimit = 12) { const headers = table.headers.slice(0, columnLimit); return { headers, rows: table.rows.slice(0, rowLimit).map((row) => row.slice(0, columnLimit)), truncated: table.rows.length > rowLimit || table.headers.length > columnLimit }; }

export function jsonToCsv(input: string): StructuredResult<{ csv: string; table: CsvTable }> {
  if (input.length > maxCharacters) return { error: "Use a smaller pasted JSON array (up to 250,000 characters) for this local workspace." };
  let parsed: unknown; try { parsed = JSON.parse(input); } catch { return { error: "Paste a valid JSON array of flat objects." }; }
  if (!Array.isArray(parsed) || !parsed.length) return { error: "JSON must be a non-empty array of flat objects." };
  if (parsed.length > maxRows) return { error: "Use up to 2,000 JSON objects in this local workspace." };
  if (!parsed.every(plainObject)) return { error: "Each JSON array item must be a plain object." };
  const headers: string[] = []; for (const row of parsed) for (const key of Object.keys(row)) if (!headers.includes(key)) headers.push(key);
  if (!headers.length || headers.length > maxColumns) return { error: "Use a JSON array with 1 to 60 named fields." };
  const rows: string[][] = [];
  for (let index = 0; index < parsed.length; index += 1) { const row = parsed[index]; const values: string[] = []; for (const key of headers) { const cell = primitiveCell(row[key]); if (cell === null) return { error: `JSON item ${index + 1}, field “${key}” must be text, a number, true/false, or null—not nested data.` }; values.push(cell); } rows.push(values); }
  const table = { headers, rows }; return { value: { table, csv: tableToCsv(table) } };
}

export function csvToJson(input: string): StructuredResult<{ json: string; table: CsvTable; skippedEmptyRows: number }> {
  const parsed = tableFromCsv(input); if ("error" in parsed) return { error: parsed.error ?? "CSV could not be read." };
  const keptRows = parsed.value.rows.filter((row) => !emptyRow(row)); const records = keptRows.map((row) => Object.fromEntries(parsed.value.headers.map((header, index) => [header, row[index]])));
  return { value: { table: { headers: parsed.value.headers, rows: keptRows }, json: JSON.stringify(records, null, 2), skippedEmptyRows: parsed.value.rows.length - keptRows.length } };
}

export function cleanCsvTable(input: string, options: { trimCells: boolean; removeEmptyRows: boolean }): StructuredResult<{ table: CsvTable; csv: string; trimmedCells: number; removedRows: number }> {
  const parsed = tableFromCsv(input); if ("error" in parsed) return { error: parsed.error ?? "CSV could not be read." };
  let trimmedCells = 0; const cleanedRows = parsed.value.rows.map((row) => row.map((cell) => { const next = options.trimCells ? cell.trim() : cell; if (next !== cell) trimmedCells += 1; return next; }));
  const removedRows = options.removeEmptyRows ? cleanedRows.filter(emptyRow).length : 0; const rows = options.removeEmptyRows ? cleanedRows.filter((row) => !emptyRow(row)) : cleanedRows;
  const table = { headers: parsed.value.headers, rows }; return { value: { table, csv: tableToCsv(table), trimmedCells, removedRows } };
}
