# Game Plan: Orbit Dash

## Main Build

Orbit Dash is a lightweight, single-player browser arcade game. The player moves a lime signal ship vertically through incoming orbital gates, collects orange signal fragments, and builds a local high score. The implementation uses a fixed top-down orthographic Babylon scene; no physics plugin, network service, login, or server persistence is required.

- **Assets needed:** The generated wide arcade artwork is used as the background art direction layer. The ship, gates, fragments, stars, and arena grid are procedural Babylon meshes so the game remains lightweight for shared hosting.
- **Verify:**
  - Arrow keys, W/S, pointer position, and touch movement move the ship in the intended vertical direction.
  - Gates move right-to-left, retain a passable gap, and trigger a visible game-over state on collision.
  - Signal fragments increase the score when collected; passed gates increase the score.
  - Space or R starts a new run after a game over; local high score persists in the browser.
  - `?demo` activates a deterministic autopilot so a screenshot visibly shows gameplay in progress.
  - No missing textures, clipped HUD, or console errors occur during the captured run.
  - The finished route retains the Orbit Workbench palette: midnight ink, signal lime, controlled ember-orange, and a compact telemetry HUD.

---

# Game Plan: Signal Switch

## Main Build

Signal Switch is a lightweight, single-player browser reflex game. A signal packet arrives at one of four relay pads around a central hub. The player selects the matching pad using arrow keys, WASD, or a direct tap/click before the countdown expires. Correct relays increase a browser-local score and shorten the next relay window; an incorrect selection or expiry ends the run. The fixed top-down orthographic scene uses procedural Babylon meshes, local high score storage, and the existing user-initiated sound-effect model.

- **Assets needed:** One generated 16:9 in-game reference image establishes the midnight-blue console board, signal-lime active pad, ember packet, and sparse starfield. The pad grid, hub, selector, and packet remain lightweight procedural geometry.
- **Verify:**
  - Arrow keys and WASD select the matching relay pad; clicking/tapping a pad selects it directly.
  - A correct input updates score, progresses the relay sequence, and triggers the appropriate opt-in sound effect.
  - A wrong input or completed countdown shows a clear game-over state and keeps the high score local to the browser.
  - `?demo` runs a deterministic relay sequence for visual verification.
- The HUD, touch targets, sound toggle, and start/restart controls stay readable on desktop and mobile.
- No missing textures, console errors, clipped controls, or placeholder gameplay elements appear in the captured run.

---

# Game Plan: Circuit Shift

## Main Build

Circuit Shift is a lightweight, single-player rotation puzzle. The player turns tiles on a fixed 4×4 board until a continuous signal path reaches the output relay. A solved board starts the next deterministic layout and improves a browser-local score; a timer measures the current solve without a forced game-over. The scene uses procedural tiles and one generated reference image, avoiding physics, imported models, multiplayer, and server state.

- **Assets needed:** One generated 16:9 in-game reference establishes the navy control-board, lime circuit traces, cyan selection outline, and restrained amber warning accent. The sixteen tiles, input/output sockets, board frame, and glow effects remain procedural Babylon geometry.
- **Verify:**
  - Clicking/tapping a tile or using arrow keys plus space rotates the selected tile by exactly 90 degrees.
  - A valid connected route from input to output visibly changes the HUD to solved, adds score, and triggers the opt-in success sound.
  - Reset loads the deterministic starting layout; local high score remains only in browser storage.
  - `?demo` rotates the known solution sequence so capture shows an in-progress or completed board.
- HUD, touch targets, sound control, and restart behavior are readable on desktop and mobile, with no missing asset, console, or network failures.

### Daily Challenge extension

The Daily Challenge derives the board scramble from the visitor’s local calendar date. For the same device-local date, the challenge seed and tile offsets are reproducible; no time service, account, API, or server leaderboard is used. The mode stores only that date’s local best score under its own browser key and applies a fixed 1.9× score multiplier. A Daily Streak stores only successfully completed device-local date IDs, counts consecutive calendar dates, and is idempotent for a same-day retry. `?daily=1&demo=1` runs the daily board’s known auto-rotation sequence for visual verification while sound remains disabled until the player uses the visible sound/start action; demo completion never writes a streak.

---

# Game Plan: Logic Puzzle Suite

The Games Bay adds six browser-local puzzle editions informed by Patches, Zip, Mini Sudoku, Tango, Queens, and Wend. Detailed source-backed rules, local geometry choices, solver requirements, and authoring tests are maintained in [`PUZZLE_RULES_SPEC.md`](./PUZZLE_RULES_SPEC.md). The implementation ships only fixed puzzle definitions that pass independent validators and uniqueness checks where applicable; it does not scrape, reproduce, or depend on LinkedIn’s daily data.

The completed suite launches directly from Games Bay at `/games/mini-sudoku`, `/games/tango`, `/games/queens`, `/games/patches`, `/games/zip`, and `/games/wend`; `/games/logic-lab` and `/games/logic/:slug` remain secondary catalog and compatible legacy routes. All six now use a dedicated full-screen cockpit field with high-contrast semantic controls, visible reset and verified-next-move hint actions, keyboard-focusable boards, and a silent deterministic demo route.

Each direct route derives a repeatable local-date orientation plus Calm, Standard, or Dense presentation profile. Mini Sudoku, Zip, Tango, Queens, Patches, and Wend each select one genuine edition from a bundled seven-board bank using the device-local date. Every selected edition has a different underlying solution and relevant reasoning topology—Mini Sudoku clue mask, Zip route/stations/walls, Tango givens and equal/different relation map, Queens connected region map and non-touching queen arrangement, Patches clue-owned rectangle partition, or Wend target words plus orthogonal exact-cover paths—and a solver-verified unique completion. Their HUDs show the actual named edition and their browser-local completion records stay separate. Shared Games Bay SOUND uses one local browser preference; Logic Lab’s optional ambient MUSIC still requires a visible user gesture. The project validation script is `pnpm exec tsx scripts/verify-logic-puzzles.ts`.

Games Bay also exposes a **Weekly Local Streak Calendar**. It reads only existing browser-local completion flags for the genuine Mini Sudoku, Tango, Queens, Patches, Zip, and Wend edition banks; it never counts a route visit, visual orientation, demo, legacy fixed-board completion, or future-dated record. Visitors may filter the current display to `All fields` or one game, then arrange the same seven semantic local-day records in an initially selected `Grid` field map or a connected `Timeline` signal log. Both views retain identical markers, verified-day totals, field counts, streak figures, scope, week range, and share payload, while their current-session choice resets to Grid on a page load. The nearby six-card **Personal Best** overview separately counts distinct completed authored editions out of each game’s seven bundled fields and shows each game’s completion-derived longest/current local-date run; it deliberately makes no time, score, profile, or cloud-ranking claim. When a genuine derived summary exists, an explicit local share card can format only the visible range, selected scope, current/longest streaks, verified-day total, and field count for native share, clipboard copy, or a plain-text download. The current week can be inspected alongside past weeks, while every figure and export remains browser-local without new user input storage, accounts, APIs, remote clocks, or background jobs. Its permanent regressions are `pnpm exec tsx scripts/verify-weekly-logic-streak.ts`, `pnpm exec tsx scripts/verify-weekly-logic-share.ts`, and `pnpm exec tsx scripts/verify-logic-personal-bests.ts`; the trusted browser suite additionally exercises real pointer/keyboard filtering and view selection, view-reset behavior, personal-best card navigation, sharing fallbacks, week navigation, and local aggregation.

---

# Daily Tools Batch 1

The Tool Foundry now contains **29 verified browser-local modules**. The first high-demand daily batch adds Business Days Calculator, Time Zone Meeting Planner, Timestamp Converter, Text Diff Checker, and Find / Replace Workspace. The five contracts are intentionally non-overlapping: business weekdays are not plain date distance; time-zone planning is not live scheduling; epoch decoding is not calendar duration; line difference is not text statistics; and literal/regex replacement is not text-case conversion. Each derives output solely from the visible workspace state, provides reset/copy and error feedback, and neither persists drafts nor contacts a provider.

The Business Days Calculator states its Monday–Friday/no-holiday-feed boundary. The Time Zone Meeting Planner uses browser `Intl` data and detects a nonexistent daylight-saving time; it does not create invitations or synchronize calendars. Timestamp Converter supports whole Unix seconds/milliseconds only. Text Diff limits local comparison work and shows additions/removals separately. Find / Replace confines literal or optional regex evaluation to current in-tab text and reports invalid patterns. `TOOL_BATCH_1_SPEC.md` is the precise contract; `pnpm exec tsx scripts/verify-daily-tools.ts` proves its engines and unique slugs/names/runner kinds; `pnpm exec tsx scripts/playtest-daily-tools.ts` performs real browser route/input/error/reset/copy checks.

## Daily Tools Batch 2

The Tool Foundry now contains **32 verified browser-local modules**. The second non-duplicate calculation batch adds Split Bill & Tip, Loan / EMI Estimate, and Work Shift Duration. Split Bill is a group allocation view rather than a generic percentage calculation; Loan / EMI Estimate makes its equal-payment fixed-rate formula, exclusion list, and non-advice status explicit; and Work Shift calculates a same-day or overnight paid duration after an unpaid break rather than a calendar-date span or payroll entitlement. Each workspace is current-tab-only, gives clear invalid-input/recovery feedback, and provides one prominent instrument readout with supporting values.

No module contacts a lender, rate provider, payment system, holiday feed, timeclock, payroll system, account, or remote clock. Currency selection only changes current number formatting and never retrieves a conversion rate. `TOOL_BATCH_2_SPEC.md` defines the three distinct contracts. The shared duplicate regression now requires 32 unique slugs, display names, and runner kinds; it checks split/tip arithmetic, zero/fixed-rate EMI edges, cross-midnight shifts, invalid terms, and invalid breaks. The real browser suite checks direct routes, pointer and keyboard input, reset/copy feedback, an overnight control path, and responsive layouts.

## Structured Data Tools Batch 3

The Tool Foundry now contains **34 verified browser-local modules**. This batch adds JSON ↔ CSV Converter and CSV Viewer & Cleaner as distinct structured-data workspaces: the converter changes a pasted tabular JSON array into CSV or a validated CSV table into JSON; the viewer validates a pasted CSV table, previews it accessibly, and offers explicit trim-cell and remove-blank-row transforms. JSON Station remains a JSON formatter/validator and is not a CSV converter. Find / Replace remains an exact text transform and is not a table cleaner.

Both tools use a pure, bounded parser for quoted commas, escaped quotes, and quoted embedded newlines. CSV headers must be nonblank and unique without regard to case; nonblank rows must be rectangular. JSON conversion accepts only a non-empty array of flat objects and derives its columns in first-seen key order. The rendered local preview is limited to 12 rows × 12 fields, while valid exports retain the full accepted table. CSV exports prefix formula-looking cells with an apostrophe so spreadsheet applications receive text, and this browser never evaluates a cell.

Pasted data stays in current React state only. The modules offer no file input, upload, account, API, server runtime, automatic persistence, or remote spreadsheet integration. Visitors can explicitly copy, download, or reset an output; Apply clean copy changes only the current textarea. `TOOL_BATCH_3_SPEC.md` is the complete contract. `pnpm exec tsx scripts/verify-structured-data-tools.ts` covers pure parser/serializer/cleanup/limit behavior and 34-entry registry uniqueness; the shared Chromium suite now includes direct routes, valid/invalid keyboard-pasted data, pointer transforms, semantic previews, copy/download/reset, and no-persistence checks.

## Image Tools Batch 4

The Tool Foundry now contains **35 verified browser-local modules**. Image Crop / Rotate / Convert is deliberately separate from Image Resizer and Favicon Generator: it preserves the full source by default, exposes an explicit source-pixel crop window, applies left/right 90° rotation, and creates a visitor-triggered PNG, JPG, or WebP output. Image Resizer continues to resize the un-cropped source; Favicon Generator continues to center-crop only square icon PNGs at predefined sizes.

The editor accepts an explicitly selected still PNG, JPG, or WebP only. The 20 MB, 8,192px-edge, and 20-million-pixel bounds are browser responsiveness guards—not upload controls. Crop presets visibly warn about edge loss, while X/Y/width/height values clamp inside the original source. PNG preserves transparency and JPG uses a white canvas backing; quality applies only to JPG/WebP. Selected file bytes, decoded pixels, canvas output, object URLs, and crop settings stay in current browser memory with no account, API, upload, server runtime, analytics payload, automatic persistence, or source-file mutation. `TOOL_BATCH_4_SPEC.md` is the exact contract; `scripts/verify-image-transform.ts` and `scripts/playtest-image-transform.ts` cover geometry, limits, direct local-file selection, real pointer/keyboard input, export/download/reset, and no-storage behavior.

## Text Utilities Batch 5

The Tool Foundry now contains **36 verified browser-local modules**. Line Sorter & De-duplicator provides a single-list cleanup workflow—explicit alphabetical or first-seen ordering, optional duplicate removal, optional edge trimming, optional blank-line retention, and optional case-sensitive duplicate matching. It is distinct from character-case transformation, two-text comparison, find/replace, CSV-table cleanup, and JSON formatting.

The pure engine limits processing to 250,000 characters and 20,000 lines. By default it trims line edges, removes blank lines and later case-insensitive matches, preserves the first match, then sorts retained lines A→Z. Visitors may change every rule and see input/repeated/blank/output counts. Pasted text and every output remain current-tab state only: no upload, file read, storage, API, account, server runtime, remote history, or background job exists. `TOOL_BATCH_5_SPEC.md` records the full contract. `scripts/verify-line-tool.ts` and `scripts/playtest-line-tool.ts` verify ordering, matching policy, bounds, direct route, real keyboard/pointer actions, explicit copy/download/reset, and no persistence or request.


## Image Tools Batch 6

The Tool Foundry now contains **37 verified browser-local modules**. Image Metadata Remover is deliberately separate from Image Resizer, Favicon Generator, and Image Crop / Rotate / Convert: it accepts one explicitly selected PNG, JPG, or WebP, decodes it in the browser, and re-exports the same native raster dimensions through a fresh PNG canvas output. It exposes no crop, rotation, resize, format, or quality controls.

The 20 MB, 8,192px edge, and 20-million-pixel bounds protect browser responsiveness; they are not upload limits. The source file is never modified. Object URLs are revoked on replacement, reset, and unmount. The clean re-export is an honest common-raster cleanup path, not a forensic scanner or guarantee about every format-specific metadata chunk. No source bytes, filename, pixels, metadata, or output are sent to an API, server, account, background task, remote image service, or browser-storage record. `TOOL_BATCH_6_SPEC.md` is the exact contract. `scripts/verify-image-metadata.ts` covers supported types, bounds, native dimensions, output format, and 37-entry uniqueness; `scripts/playtest-image-metadata.ts` covers direct routing, local file selection, pointer download, keyboard clear, unsupported input, and no persistence/network activity.

The next proposed single quality-controlled group is **Unit Price Comparator**; it must remain separate from Fuel Cost Estimator and any new image batch.
