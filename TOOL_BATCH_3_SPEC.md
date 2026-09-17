# Structured Data Tools — Batch 3 Contract

## Scope and non-overlap

Batch 3 adds two distinct browser-local modules to the Tool Foundry: **JSON ↔ CSV Converter** at `/tools/json-csv-converter` and **CSV Viewer & Cleaner** at `/tools/csv-viewer-cleaner`. The typed registry contains 34 unique slugs, display names, and runner kinds after this addition.

| Module | Accepts | Produces | Deliberately does not overlap with |
| --- | --- | --- | --- |
| JSON ↔ CSV Converter | A pasted non-empty JSON array of flat objects, or a pasted CSV table with a header row | CSV text or formatted JSON text | JSON Station’s formatting/validation, Base64, URL tools, and generic text transforms |
| CSV Viewer & Cleaner | A pasted CSV table with a header row | A bounded text preview and an explicit cleaned CSV copy | Find / Replace’s targeted text substitution, Text Diff comparison, and file-upload utilities |

> Both modules are paste-only, current-tab workspaces. They do not offer file upload/import, account storage, a server converter, a spreadsheet connection, or an automatic transmission path.

## JSON ↔ CSV conversion rules

For JSON-to-CSV, the input must be a non-empty array of plain objects. The first-seen union of object keys defines column order. Missing properties and `null` become empty cells; strings, numbers, and booleans become text cells. Arrays, nested objects, and other non-primitive values are rejected rather than flattened ambiguously.

For CSV-to-JSON, the parser accepts standard comma-delimited quoted cells, escaped double quotes, and quoted embedded newlines. The first row is a required header. Header names are trimmed, must be non-empty, and must be unique without regard to case. Every nonblank data row must have exactly the header’s column count. Blank rows are omitted from JSON output.

| Guard | Limit or behavior | Visitor-visible response |
| --- | --- | --- |
| Input size | 250,000 pasted characters | A clear local size-limit error |
| Data rows | 2,000 data rows | A clear local row-limit error |
| Fields | 60 columns/fields | A clear local field-limit error |
| Preview | First 12 rows and first 12 fields | A semantic table plus an explicit truncation note when needed |
| Spreadsheet formulas | CSV cells beginning with `=`, `+`, `-`, or `@` are prefixed with `'` on CSV export | Spreadsheet applications receive formula-looking values as text; the site never evaluates cell contents |

## CSV Viewer & Cleaner rules

The Viewer first validates the same CSV table contract, then offers two opt-in, in-memory transforms: **Trim cell edges** removes leading/trailing whitespace from data cells, and **Remove blank rows** excludes rows whose cells are all blank after the selected trim behavior. Counters report visible output rows, trimmed cells, and removed blank rows. **Apply clean copy** replaces only the currently open textarea; it does not alter a file or create a saved record.

The semantic preview uses table headers with `scope="col"`, renders all cell contents as inert text, and bounds its viewport to maintain a responsive static page. Copy and download are explicit browser actions; Reset restores only the bundled example for the currently open workspace.

## Privacy, hosting, and verification

No Batch 3 engine accesses `localStorage`, a network API, browser file data, an account, a remote spreadsheet, a server path, or a background task. The only retained Tool Foundry records remain existing metadata-only recent-route and favorites preferences; pasted JSON/CSV content is outside those utilities and is not saved.

Run `pnpm exec tsx scripts/verify-structured-data-tools.ts` for parser, serializer, cleanup, preview-bound, formula-text, and unique-registry coverage. Run `pnpm exec tsx scripts/playtest-daily-tools.ts` for real Chromium direct-route, keyboard-pasted input, invalid state, pointer action, semantic preview, copy/download/reset, and no-persistence coverage. The modules compile into the existing static Vite build and need no Hostinger configuration, PHP endpoint, environment secret, cron job, or backend runtime.
