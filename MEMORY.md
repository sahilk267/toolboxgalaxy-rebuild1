# Orbit Dash Build Notes

- Orbit Dash is deliberately a lightweight, local-score game so it fits the shared Hostinger deployment constraint.
- Generated artwork is loaded from Manus storage rather than committed into the project tree.
- The `?demo` URL flag enables a deterministic autopilot used for visual verification.
- The page route is `/games/orbit-dash`; it is intentionally full-screen and does not use the standard AppShell during play.

## Signal Switch Build Notes

- Signal Switch will be a distinct four-pad reaction game rather than a second scrolling obstacle game, so the Games Bay has clear mechanical variety without adding physics, multiplayer, or server dependencies.
- Its reference art uses the same midnight-ink, signal-lime, ember-orange, and deep-navy workbench system as Orbit Dash. The individual board objects will be procedural Babylon geometry, keeping the shared-hosting bundle compact.
- Browser sound must remain opt-in. The game will unlock audio only from the visible player control, then use short synthesized feedback tones rather than bundled audio files.

### Daily Challenge extension

- Daily Challenge is a second Circuit Shift mode, not an external service. It uses the player device’s local calendar date to generate a repeatable set of tile offsets.
- Its daily best is stored separately in localStorage under the date ID. No leaderboard, account, analytics event, puzzle input, or network call is involved.
- Use `/games/circuit-shift?daily=1&demo=1` for the deterministic visual route; its autoplay board stays silent unless the player explicitly opts into sound.

## Circuit Shift Build Notes

- Circuit Shift intentionally uses a fixed 4×4 board and deterministic layouts rather than procedural level generation. That keeps visual QA, touch targets, and puzzle completion logic predictable on shared hosting.
- Puzzle mechanics must remain readable in one screenshot: lime connected paths, dark inactive traces, a cyan selection outline, and a visible input/output relay.
- The game will share the existing synthesized browser sound system, but only after the player explicitly enables sound through the game HUD.

## Logic Lab Build Notes

- Logic Lab is a DOM/React puzzle suite rather than a Babylon canvas game because fixed grid constraints need reliable semantic buttons, keyboard access, and deterministic touch targets.
- It provides direct full-screen Games Bay routes: `/games/mini-sudoku`, `/games/tango`, `/games/queens`, `/games/patches`, `/games/zip`, and `/games/wend`. `/games/logic-lab` is optional navigation and `/games/logic/:slug` remains compatible. `PUZZLE_RULES_SPEC.md` remains the implementation contract; `research-linkedin-puzzles.md` records the underlying source research.
- Every board is authored and deterministic. `scripts/verify-logic-puzzles.ts` verifies known solutions, representative invalid states, applicable uniqueness claims, local daily-transform coordinate round trips, every Mini Sudoku, Tango, Queens, Patches, Zip, and Wend bank field, and seven-day selection coverage before release.
- Mini Sudoku has seven distinct 6×6 solution grids with unique clue masks from 13 to 20 clues; Tango has seven distinct binary solution layouts, clue masks, and equal/different relation topologies with solver-unique completions; Queens has seven distinct connected region maps and non-touching queen arrangements with unique solver results, non-symmetry-equivalent map signatures, and recorded search-depth bands; Patches has seven non-symmetry-equivalent 6×6 clue-owned rectangle covers with unique exact-cover results, varied clue/shape layouts, and recorded search-depth bands; Zip has seven distinct 6×6 non-repeating ordered orthogonal paths with unique solver results, scattered checkpoints, meaningful walls, and at least twenty turns; Wend has seven distinct 5×5 target-word sets and non-symmetry-equivalent orthogonal path covers with unique exact-cover results and recorded target-branch profiles.
- `daily.ts` derives a browser-local date ID, Calm/Standard/Dense profile, and reversible mirror orientation—no calendar API, remote daily feed, or account is involved. `miniSudokuBank.ts`, `tangoBank.ts`, `queensBank.ts`, `patchesBank.ts`, `zipBank.ts`, and `wendBank.ts` turn that local date into actual independently authored editions and board-specific completion keys.
- `WeeklyLogicCalendar` on `/games` reads the existing `toolboxgalaxy:puzzle-completions` map through `weeklyLogicStreak.ts`; it writes no new player state. It recognizes only edition-specific Mini Sudoku, Tango, Queens, Patches, Zip, and Wend completion prefixes, aggregates several same-day fields into one verified day, and derives current plus longest consecutive-day runs in memory. `logicPersonalBest.ts` then validates the full authored edition ID against each seven-field bank before a per-game card may count it, avoids misleading speed/score claims, and derives only distinct completed editions plus current/longest local-date runs. Its `All fields`/individual-game filter and Grid/Timeline calendar arrangement are browser-session UI only: they recompute or rearrange the same calendar data, preserve marker/metric/share values, clearly show a selected-game no-match week, and reset to All fields plus Grid on a reload. `weeklyLogicShare.ts` exports only visible calendar range/scope/current-longest streak/verified-day/field total values after a user gesture; native share, clipboard copy, and text download all remain optional browser features and reveal no completion key, board path, edition ID, identity, or hidden record. There is no server clock, background schedule, account, filter/view preference, personal profile, or sharing API request. Run `pnpm exec tsx scripts/verify-weekly-logic-streak.ts`, `pnpm exec tsx scripts/verify-logic-personal-bests.ts`, `pnpm exec tsx scripts/verify-weekly-logic-share.ts`, and `CALENDAR_ONLY=1 pnpm exec tsx /home/ubuntu/games-bay-playtest.ts` before release.
- Every direct game page has a visible Reset and one verified next-move Hint. Hints never consult a service; they reveal or repair only an authored solution fact that the local validator already owns.
- `OrbitAudio` persists one Games Bay master SOUND preference across Orbit Dash, Signal Switch, Circuit Shift, and Logic Lab. Logic Lab offers an optional ambient MUSIC loop. Both controls remain explicit user gestures, and master sound off pauses music; no route autoplay is attempted.
- The route flag `?demo=1` is purely visual QA. It stays silent, does not persist completion/progress, and never contacts a service.

## Daily Tools Batch 1

- The Tool Foundry now has 29 registry-backed local modules. `dailyToolEngines.ts` is the pure no-storage/no-network owner for Business Days, Time Zone Meeting Planner, Timestamp Converter, Text Diff, and Find / Replace; `DailyToolRunners.tsx` is only the controlled UI layer. Business Days deliberately uses Monday–Friday only, with no holiday data. Time Zone Planner relies on browser `Intl`, detects missing daylight-saving local times, and makes no calendar-sync claim. The five contracts, exclusion boundaries, and duplicate proof are in `TOOL_BATCH_1_SPEC.md`. Before any change run `pnpm exec tsx scripts/verify-daily-tools.ts` for engine plus unique slug/name/kind coverage and `pnpm exec tsx scripts/playtest-daily-tools.ts` for actual Chromium route/input/error/reset/copy coverage.

## Daily Tools Batch 2

- The foundry now has 32 registry-backed local modules. Batch 2 adds unique `splitBill`, `loanEmi`, and `workShift` engine/runner kinds. `TOOL_BATCH_2_SPEC.md` is the contract: Split Bill shares a tax-inclusive total plus chosen tip; Loan / EMI uses a clearly marked fixed-rate equal-payment estimate with no lender/rate/payment advice or integration; Work Shift measures same-day/overnight duration minus a shorter unpaid break but does not make payroll or employment-law decisions. Currency selection formats only the current local result and never fetches exchange data. The `DailyToolRunners` Batch 2 cards have allocation/payment/time operational signatures and dominant result readouts; keep that differentiation when touching the shared workspace style. Run the existing two daily-tool scripts before release; the deterministic suite now expects 32 unique slug/name/runner kinds.

## Structured Data Tools Batch 3

- The foundry now has 34 registry-backed local modules. `structuredDataEngines.ts` owns a no-storage/no-network/no-DOM CSV parser/serializer, JSON-table conversions, cleaner transforms, 250,000-character / 2,000-row / 60-field limits, and 12×12 preview shaping. `StructuredDataRunners.tsx` is the controlled current-tab UI layer for the unique `jsonCsv` and `csvViewer` runner kinds. JSON conversion accepts a non-empty array of flat objects; CSV uses unique trimmed headers and rectangular nonblank data rows. The UI renders cells as text and CSV exports prefix formula-looking values with an apostrophe. It offers no file import, upload, account, remote spreadsheet, or persistence of pasted user content. `TOOL_BATCH_3_SPEC.md` is the definitive contract. Before changes, run `pnpm exec tsx scripts/verify-structured-data-tools.ts`, `pnpm exec tsx scripts/verify-daily-tools.ts`, and `pnpm exec tsx scripts/playtest-daily-tools.ts`; the latter has actual direct-route, keyboard input, pointer clean/action, copy/download/reset, semantic-preview, and no-storage tests.

## Image Tools Batch 4

- The foundry now has 35 registry-backed local modules. `localImageTransform.ts` owns pure crop clamping, quarter-turn dimensions, format extensions, type/file/dimension/pixel limits, and no browser side effects. `ImageTransformTool.tsx` owns current-tab PNG/JPG/WebP file selection, object-URL cleanup, controlled crop inputs/presets, 90° left/right rotation, canvas export, explicit download, and reset/error UI for the unique `imageTransform` kind. It is a general deliberate crop/rotate/export workspace: Image Resizer remains full-source resizing, while Favicon Generator remains fixed square PNG center-cropping. There is no server, upload, storage, source-file mutation, account, image service, or persistence of image pixels/settings. `TOOL_BATCH_4_SPEC.md` is the contract. Before release, run `pnpm exec tsx scripts/verify-image-transform.ts` and `pnpm exec tsx scripts/playtest-image-transform.ts` together with all previous regressions; the browser test uses a real local image picker, source-pixel crop, rotation, JPG quality, output geometry, download, reset, unsupported-file, and no-storage checks.

## Text Utilities Batch 5

- The foundry now has 36 registry-backed local modules. `lineToolEngine.ts` owns pure 250,000-character / 20,000-line bounds, CRLF normalization, trim/blank/duplicate matching, deterministic order, and output counters; it knows no File, storage, network, or server API. `LineToolRunner.tsx` supplies one controlled current-tab input, explicit sorting/duplicate/trim/blank/case choices, counts, browser copy/download, Reset, and error visibility for the unique `lineSorter` kind. It is neither a text comparison, find/replace, case converter, JSON parser, nor CSV table cleaner. `TOOL_BATCH_5_SPEC.md` is definitive. Before release, run `pnpm exec tsx scripts/verify-line-tool.ts` and `pnpm exec tsx scripts/playtest-line-tool.ts` together with all existing checks; the browser suite asserts real keyboard input, pointer controls, ordering, policy changes, download/copy/reset, bounds, no local-storage record, and no request.


## Image Tools Batch 6

- The foundry now has 37 registry-backed local modules. `localImageMetadata.ts` owns pure supported-type, 20 MB file, 8,192px-edge, and 20-million-pixel bounds plus native-dimension clean re-export policy; it has no canvas, File, object URL, storage, network, or server dependency. `ImageMetadataTool.tsx` owns the current-tab PNG/JPG/WebP picker, decode, fresh PNG canvas output, object-URL cleanup, explicit clean/download/reset controls, keyboard clear, and unsupported/decode error state for the unique `imageMetadata` kind. It intentionally does not crop, rotate, resize, convert formats, or modify the original file. The browser re-export is a practical common-raster metadata cleanup path, not a forensic scanner or guarantee about every format-specific chunk. No image bytes, filename, metadata, pixels, output, or settings are uploaded or persisted. `TOOL_BATCH_6_SPEC.md` is the exact contract. Before release, run `pnpm exec tsx scripts/verify-image-metadata.ts` and `pnpm exec tsx scripts/playtest-image-metadata.ts` with the complete existing tool/game/calendar/share, public-route, build, PWA, and current-log gates; the browser suite uses real local file selection, native output geometry, pointer download, keyboard clear, unsupported-file handling, and no-storage/network assertions.

## PDF & Document Studio Suite (Modules 38-44)

- **PDF Visual Editor & Annotator (`/tools/pdf-visual-editor`)**: Built with Mozilla's PDF.js (`pdfjs-dist`) client-side worker synchronized via `scripts/ensure-pdf-worker.js`. Allows full-page rendering, annotation drawing, text layers, signature injection, and in-memory export.
- **PDF Merge & Split (`/tools/pdf-merge-split`)**: Client-side document reassembly using `pdf-lib`. Reorders pages, extracts ranges, and combines multi-file uploads into single PDF archives without remote processing.
- **PDF Security Redactor (`/tools/pdf-security-redactor`)**: Permanent redaction engine. Renders vector content to high-DPI raster canvases and draws black redaction blocks to permanently purge text and metadata, preventing copy-paste or vector-underlay recovery attacks.
- **Excel Spreadsheet Studio (`/tools/excel-spreadsheet-studio`)**: In-browser XLSX/CSV workbook editor using `exceljs`. Provides multi-sheet navigation, formula recalculations, cell styling, and export.
- **Document OCR Studio (`/tools/document-ocr-studio`)**: Client-side image-to-text extraction using WebAssembly Tesseract OCR. Processes local scans and screenshots without telemetry.
- **Word to Markdown (`/tools/word-to-markdown`)**: Converts `.docx` documents into clean, GitHub-flavored Markdown using `mammoth.js` client-side parsing.

## Regional & India Utilities (Modules 45-50)

- **GST & Business Tax Calculator (`/tools/gst-tax-calculator`)**: Interactive Indian Goods and Services Tax engine supporting CGST/SGST intrastate splits, IGST interstate calculations, reverse charge calculations, and tax slab presets (0%, 5%, 12%, 18%, 28%).
- **UPI QR Code Generator (`/tools/upi-qr-generator`)**: Generates NPIC-compliant UPI payment intent deep links (`upi://pay?pa=...&pn=...&am=...`) and renders sharp, scannable QR codes locally via canvas without external APIs.
- **IFSC Code & Bank Routing Directory (`/tools/ifsc-code-lookup`)**: Fast local directory and validator for RBI Bank Identification codes with branch decoding and NEFT/RTGS/IMPS capability matrix.
- **Salary In-Hand / CTC Breakdown (`/tools/salary-in-hand-calculator`)**: Tax calculation model implementing India's Old vs. New Tax Regimes (FY 2024-25 / AY 2025-26), standard deduction, 87A rebate, professional tax, employee EPF, and take-home salary projections.
- **Indian Postal Pincode Directory (`/tools/indian-pincode-lookup`)**: Instant 6-digit postal index number validator and state/district locator.
- **EPF / PF Corpus Estimator (`/tools/epf-corpus-estimator`)**: Compound retirement corpus calculator using EPFO interest rates (8.25%), employee/employer contribution splits, annual wage increments, and pension EPS allocation.

## Developer Tools, Encoders & Generators (Modules 51-56)

- **JSON to Zod & TypeScript Studio (`/tools/json-to-zod-schema`)**: Real-time TypeScript AST generator converting raw JSON payloads into strict Zod schemas and TypeScript interface declarations.
- **JWT Debugger & Inspector (`/tools/jwt-debugger`)**: Client-side JSON Web Token decoder and signature inspector with HMAC-SHA256 signature verification, claims decoding, expiration counters, and Unix timestamp visualizers.
- **Fake Data & Mock Generator (`/tools/fake-data-generator`)**: In-browser deterministic mock data generator producing realistic user profiles, addresses, transactions, UUIDs, and tabular arrays with one-click JSON/CSV download.
- **Open Graph Social Image Builder (`/tools/og-image-builder`)**: Real-time 1200x630 social card studio with SVG canvas rendering, category color schemes, custom subtitles, logo badges, and instant PNG export.
- **Cron Schedule Expression Builder (`/tools/cron-schedule-expression`)**: Visual cron parser and generator explaining minute, hour, day, month, and day-of-week intervals with human-readable English translations and next-run projections.
- **SQL Query Formatter (`/tools/sql-formatter`)**: Syntax highlighter and pretty-printer for ANSI, PostgreSQL, and MySQL dialect queries with keyword capitalization and indent customization.

## Image & Vector Utilities (Modules 57-59)

- **Govt Job & Passport Photo Resizer (`/tools/passport-photo-resizer`)**: Strict dimension and aspect ratio presets (US Passport, Indian Passport, Schengen Visa, SSC/UPSC exams) with exact target file size clamping (e.g., 20KB–50KB) via iterative JPEG quantization.
- **SVG to PNG & Vector Studio (`/tools/svg-to-png-converter`)**: High-fidelity vector rasterizer with scale multipliers (1x, 2x, 4x, 8x), transparency preserve toggles, and background fills.
- **Color Signal & Contrast Studio (`/tools/color-signal`)**: WCAG 2.1 AA/AAA compliance analyzer with luminance calculation, HEX/RGB/HSL conversion, and contrast matrix.

## 17 Games & Daily Logic Suite Architecture

The Games Bay at `/games` currently hosts **17 verified browser-local games**:
1. **The Hive (`/games/the-hive`)**: Daily 7-letter honeycomb spelling bee puzzle with center-letter requirement, pangram detection, and score ranks.
2. **Wordle (Orbit Lexicon) (`/games/orbit-lexicon` & `/games/wordle`)**: 5-letter daily deduction with exact letter feedback (green/yellow/gray) and shareable emoji grids.
3. **Connections (`/games/connections`)**: 4x4 word grid association challenge. Group 16 words into four secret themed categories with 4 mistake allowances.
4. **Queens (`/games/queens`)**: 6x6 colored region puzzle. Place crowns so each row, column, and color has 1 crown with no orthogonal or diagonal neighbors.
5. **Mini Sudoku (`/games/mini-sudoku`)**: 6x6 grid with 2x3 boxes and solver-verified single-solution clue bank.
6. **Strands (`/games/strands`)**: Theme word search with a yellow "spangram" spanning opposite edges of the letter matrix.
7. **Tango (`/games/tango`)**: Sun & Moon binary logic puzzle enforcing line balance, no triples, and equality/difference relations.
8. **Patches (`/games/patches`)**: 6x6 exact-cover quilt puzzle partitioning grids into clue-owned rectangles.
9. **Zip (`/games/zip`)**: Ordered wall labyrinth with consecutive numbered checkpoints and single Hamiltonian path.
10. **Wend (`/games/wend`)**: Orthogonal word trail puzzle covering 25 cells with target vocabulary paths.
11. **Chess Puzzles (`/games/chess-puzzles`)**: Tactical endgame deduction problems (mate-in-1, mate-in-2) powered by client-side chess board validation.
12. **Nonogram (`/games/nonogram`)**: Picross picture logic grid using row and column run constraints.
13. **Mini Crossword (`/games/mini-crossword`)**: Daily 5x5 speed crossword with keyboard navigation and timer.
14. **Orbit Dash (`/games/orbit-dash`)**: 3D orthographic cyber dodge arcade in Babylon.js.
15. **Signal Switch (`/games/signal-switch`)**: Four-pad reaction reflex game with synthesized Web Audio tones.
16. **Circuit Shift (`/games/circuit-shift`)**: 4x4 path trace rotation puzzle with deterministic Daily Challenge seed.
17. **Logic Lab (`/games/logic-lab`)**: Sandbox puzzle solver and generator catalog.

## Platform SEO, Social Virality & Notification System

- **23 OpenGraph Social Share Cards (`client/public/og/`)**: High-resolution 1200x630 PNGs generated by `scripts/generate-og-images.ts` using `sharp`. Covers categories, games, tools hub, and site defaults.
- **XML Sitemap (`client/public/sitemap.xml`)**: Built via `scripts/generate-sitemap.ts` covering all 90 canonical URLs (59 tools, 17 games, 5 guides, core routes).
- **Personalized Challenge Sharing (`?by=`)**: Secure sharing mechanism with `sanitizeUserParam` and HTML entity escaping to eliminate XSS vectors.
- **Daily Reminder Notification**: PWA Periodic Background Sync and Web Notification API integration (`dailyReminder.ts`) triggering daily reminder nudges for completed puzzle players with clean opt-in/opt-out toggles.
- **Tool of the Day Engine (`toolOfTheDay.ts`)**: Pure deterministic modulo calendar rotation across all 59 tools guaranteeing 100% cyclic fairness over 3,650 days.
- **Cookieless & Privacy Invariants**: Zero tracking scripts, zero Google Analytics without explicit user env key, full DNT honor, and zero backend transmission of user data.

