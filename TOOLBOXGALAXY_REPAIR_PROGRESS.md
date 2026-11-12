# ToolboxGalaxy Repair & Verification Progress Ledger

## PDF Merge/Split guardrails — 12 November 2026

- Merge input queues are limited to 20 PDFs, 30 MB per document and 100 MB combined; uploads use a sequential loader, a race guard and same-file re-selection support.
- Merge actions cannot overlap or mutate their file queue mid-generation. PDF Split inputs are capped at 50 MB before reading.
- Split page-range expansion now tracks selected pages in a Set instead of repeatedly scanning all previously selected pages (preserves the original user-specified ordering). File-save object URLs are revoked after a short browser download handoff rather than synchronously.
- **Release boundary:** GitHub code and ledger updated only; no automated/manual tests, build, Hostinger upload or live deployment performed.


## PDF extraction worker lifecycle and text-table scaling — 12 November 2026

- **PDF text:** release PDF.js page caches and worker/document after extraction; build text fragments as arrays to avoid repeated large string copies, and skip non-text PDF objects.
- **PDF table export:** sort text vertically and group rows in one pass instead of scanning previous rows per text item. Release PDF.js worker and page caches even after errors.
- **Scope:** source code updates and Git push only; no build, unit tests, manual QA or deployment.


## Krunker keyboard/focus lifecycle hardening — 12 November 2026

- **Working branch:** `feat/browser-ai-background-remover`.
- **Krunker FPS keyboard isolation:** the global keydown handler no longer consumes Tab or class/respawn/ADS/movement shortcuts when a game overlay button, input, select, textarea, editable content, or dialog has focus. Unstarted games, hidden tabs, modifier shortcuts, IME composition, and desktop sessions without pointer lock cannot inject game inputs. Active pointer-locked gameplay preserves the existing keyboard shortcuts and scoreboard Tab behavior.
- **Scope:** source update and Git push only. No build, tests, manual gameplay verification or deployment performed per user request. This is not a verified runtime result.

## PDF OCR long-session worker and bitmap lifecycle — 12 November 2026

- Both text OCR and searchable PDF generation now dispose the Tesseract worker and PDF.js document in `finally`, including failure paths after engine setup.
- OCR page bitmaps are limited to approximately 15.8 megapixels and 8,192px per edge, automatically scaling down unusually large PDF pages; the searchable layer uses the actual render scale when calculating text coordinates.
- Every page canvas bitmap is released and `page.cleanup()` is called before advancing to the next page. Input PDFs above 40 MB are rejected before expensive OCR initialization.
- This is source implementation only; no tests, build, OCR accuracy assessment or deployment were performed.


## PDF conversion & pointer memory follow-up — 12 November 2026

- **Images-to-PDF:** replace memory-expensive base64 previews with Blob URLs; read images sequentially; bound queues at 40 images / 100 MB; release URLs on removal/unmount and canvas backing after conversion. Preserve file ordering and PNG/JPEG/WebP output behavior.
- **Strands:** a synchronous pointer ref and direct grid pointerup/cancel handlers close the race between a very fast tap and React's effect installing the window release handler. Cleanup is idempotent and off-grid cancellation cannot leave controls stuck.
- **Scope:** implementation and Git push only; no build, tests, manual QA or deployment performed.


## Puzzle input & game timer lifecycle — 12 November 2026

- **Cross-puzzle keyboard guard:** Wordle, Hive and Mini Crossword ignore keys when focus belongs to fields, buttons, contenteditable or dialogs, as well as IME, modifier shortcuts, hidden tabs and auto-repeat. This prevents global window listeners from hijacking other controls. Hive no longer blocks Tab navigation; Mini Crossword captures arrows only for grid navigation.
- **Seven puzzle clocks:** Wordle, Connections, Hive, Strands, Mini Crossword, Chess and Nonogram use the existing visible-tab timer and now also suspend counting while help/instructions or relevant result overlays are open. Timer resumes automatically when returning to play.
- **Strands mobile/desktop pointer lifecycle:** release is handled on window even when pointer ends outside the grid, pointercancel clears drag mode, and reset clears active pointer state. Touch taps can build a path incrementally; drag submission remains available, and keyboard button clicks do not double-append.
- **Scope:** source implementation and Git push only. No builds, tests, browser QA or live deployment performed; runtime fixes are not yet verified.


## Deep scalability phase — remaining games & media workflows (12 November 2026)

**Working branch:** `feat/browser-ai-background-remover`. Code implementation and Git push only; tests, manual QA and deployment explicitly deferred by user.

- **Signal Switch:** fixed a source-confirmed immediate game-over bug: the first canvas/key direction selected a random new relay and could lose on the starting gesture. First gesture now starts the round without grading the same input. First relay has 5.2 seconds; time gradually decreases with successful turns down to 1.5 seconds. HUD timer updates max ~10 times/sec instead of every WebGL frame. Keyboard handlers ignore editable controls and dialogs.
- **Circuit Shift and Signal Switch:** stop browser WebGL render loops while hidden and cap visible renders to ~30 FPS, keeping the game scene alive. Visibility event listeners and loops are removed on component teardown.
- **Image Metadata Remover:** selection/reset generations reject late decode/EXIF/re-export completions, release unused object URLs and canvas backings, and allow same-file re-selection; unreadable EXIF does not block safe image export.
- **AI Background Remover:** free large full-resolution canvas backing after matte composition and final background-color export while preserving full-size output.
- **Base64 Workbench:** prevent superseded asynchronous file reads from overwriting the latest chosen file, including after reset.
- **PDF Editor:** lazily render only thumbnails close to the viewport using IntersectionObserver, cap thumbnail bitmap area to 1 megapixel, release each independent pdf.js parser/worker promptly, cancel obsolete render tasks, and enforce a 24-megapixel main-page canvas budget. Precompute annotation badge counts in a single pass. Uploads above 50 MB are refused before browser allocation.
- **Image Crop/Rotate Editor:** avoid stale output after changing crop/rotation/quality or switching files mid-render, release canvas backing after encoding, and make same-file re-import reliable. Invalidation also unlocks the busy state so rapid option edits cannot leave the editor disabled.
- **Image/EXIF invalid uploads:** clear any superseded busy indicator when a newly selected file fails validation.
- **Verification boundary:** no executed unit tests, gameplay, builds, performance benchmarks or Hostinger deployment; this document records source changes, not verified runtime behavior.


## Implementation & scalability batch 2 — 12 November 2026

**Git branch:** `feat/browser-ai-background-remover`. These are source changes only; testing and deployment are deliberately deferred at the user's request.

- **Surviv Battle Royale:** static ordered obstacle spatial index for projectile sweeps, nearby bush/loot-target and melee candidate searches; reusable combatants list; hunting bots continuously refresh tracked target positions; fleeing-zone bots choose waypoints on staggered think timers rather than jittering per animation frame. HUD publishes at most 10 times/s, alive counters only when changed.
- **Krunker FPS:** cap large frame deltas, split player collision/movement over bounded substeps on slow devices, use squared distance checks and scalar movement to avoid transient bot vectors, normalize bot yaw on wrap, use pause-aware simulation time. Suspended matches park requestAnimationFrame entirely, clear stuck inputs on blur/unlock, and release scene mesh/geometry/material memory on teardown.
- **Krunker mobile:** stable touch identifiers and `touchcancel` handling for movement, aim, ADS, jump, slide and fire; focus/visibility guards prevent unwanted continued combat.
- **Excel Studio:** 100-row accessible preview pages instead of mounting every spreadsheet row at once; downloads still operate on complete sheet. Reject excessively large uploads/sheet dimensions, ignore superseded file reads, and reset pagination on import/sheet/filter changes.
- **PDF Compressor:** reject PDFs above a browser-local 40 MB cap; bound raster pages to 16 megapixels, free each canvas and page, close pdf.js worker/document after inspection and recompression.
- **Image Resizer:** stale asynchronous uploads/encodes are ignored after changing the source/settings; release canvas bitmap backing after export.
- **Orbit lifecycle follow-up:** visible Pause/Resume, keyboard P/Escape/Space support, input-reset on restart, hidden-tab/blur automatic pause and a frozen difficulty clock while paused.
- **Final source-review correction:** preserve Surviv melee crate reach when selecting broad-phase candidates and throttle Krunker speed HUD to 10 Hz without changing top-speed statistics.
- **Release boundary:** no build, tests, human QA, Hostinger upload or deployment performed; do not claim these modifications are verified runtime fixes.


## Runtime scalability and lifecycle hardening — implementation only (12 November 2026)

- **Working branch:** `feat/browser-ai-background-remover`; PR #22 merged previously as `b79c74dde3817eca5f81cf7237f199a4b451bb8b`.
- **Diep Arena:** switched legacy per-animation-frame physics to a bounded fixed 60 Hz simulation, with a maximum of four simulation ticks per render and no accumulated catch-up across pause/resume. This maintains movement, collision, recoil and projectile lifetimes across 30/60/120 Hz displays without an unbounded catch-up spike.
- **Diep opponents:** purge inactive bots when spawning replacements so the long-lived array cannot grow throughout an extended match. Existing living entities and unique IDs are preserved.
- **Diep game-over lifecycle:** stop the simulation when the player's final lethal hit is processed instead of continuing invisible updates.
- **Orbit Dash:** reuse three Babylon gate materials for the entire world instead of allocating and retaining three new materials with every gate; explicitly dispose them on world teardown.
- **Scope boundary:** implementation and Git push only. Per user request, no manual QA, test execution, build verification, production deployment or Hostinger changes are part of this checkpoint. This is *not* a claim that gameplay has been retested after these code changes.


## Games Upgrade Phase — Implementation candidate (11 November 2026)

- **Working feature branch:** `feat/games-upgrade-phase` based on the integrated `feat/browser-ai-background-remover` branch after [PR #20](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/20) successfully merged (10 further advanced tools).
- **New game review:** [PR #21](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/21), **Ready for Review, unmerged**; keep `main` and hosting untouched.
- **Puzzle upgrades:** All 13 listed puzzle games now share visible-time-only timer behavior (six from the common PuzzleFrame, seven independently rendered), including reset timer fairness. Logic Lab includes all 13 puzzles plus searchable categories.
- **Practice:** Verified seeded Sudoku/Queens/Tango unique-solution board variations, three difficulty tiers, keyboard/touch-friendly 6x6 controls, hints, undo, reset, constraints and deterministic reproduction. New practice sessions do not write daily-completion records.
- **Arcade:** Orbit Dash hover start/keyboard/graphics handling, Diep and Surviv active simulation pause and stuck-input clearance, Surviv rendering pause, Krunker physics/timer suspension. Original movement/collision/damage rules and game names preserved.
- **Evidence:** [Full CI](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42997527028) succeeded with **2,153 solver/timer assertions across 72 uniquely solvable generated fields**, existing tests and production build. [Games Chromium QA](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42997527175) succeeded with **58 UI/route assertions** across Logic Lab, all 13 puzzle URLs and four arcade URLs. Other four CI/browser workflows succeeded on this implementation candidate. The latest HEAD must pass again after final timer/docs refinements.
- **Details and limitations:** [docs/GAMES_UPGRADE_RELEASE.md](docs/GAMES_UPGRADE_RELEASE.md). Browser route smoke and solver checks do **not** amount to all-game controls or mobile graphics certification. Hostinger, manual testing and unrelated projects were excluded.


## Next-best development batch — Ten existing tools (11 November 2026)

- **Branch:** `feat/advanced-remaining-everyday-dev-tools` from the user's working `feat/browser-ai-background-remover` branch.
- **Review PR:** [#20](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/20), initially draft and **unmerged**. Do not modify `main` or Hostinger without a separate deliberate decision.
- **Actual code changes:** Discount Calculator, Loan / EMI Estimate, Business Days Calculator, Time Zone Meeting Planner, Color Signal, Gradient Forge, Text Case Tool, Base64 Workbench, UUID Generator and Basic Calculator, all using original slugs and defaults.
- **Implementation notes:** [docs/NEXT_PRIORITY_TOOLS_RELEASE.md](docs/NEXT_PRIORITY_TOOLS_RELEASE.md), including limits, nonofficial fixed-holiday examples, DST fold ambiguities, numeric-parser safety and manual QA.
- **Regression:** `scripts/verify-next-priority-tools.ts` runs real production engines in `npm run check` and verifies 165 cases on the first successful CI candidate; Chromium E2E uses actual production build and real CSV/HTML/TXT downloads for all ten tool URLs.
- **First evidence:** [successful CI](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42928041033) and [successful Chromium](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42927942087) (51 assertions). Reverify the final code/documentation PR head as those runs precede the final documentation commit.
- **Games:** no gameplay change included; do not conflate a generic "improvements" roadmap item with a verified game defect.
- **Unverified:** mobile iOS/Android, Safari/Firefox, production deployment and main-branch synchronization. Previously merged QR, Favicon, Password and JSON tool behavior remains regression-covered.


## Combined advanced-tool implementation batch — Merged into feature branch (11 November 2026)

**Source of truth:** [docs/CONSOLIDATED_ADVANCED_TOOLS_QA.md](docs/CONSOLIDATED_ADVANCED_TOOLS_QA.md). User requested the PRs merged into the existing `feat/browser-ai-background-remover` branch and opted to defer one combined manual/real-device QA pass. Merge into that branch is **not** proof that live hosting has deployed the changes.

- PR [#17](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/17): **merged** previously (advanced Percentage Calculator, Unit Converter and Text Statistics).
- PR [#18](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/18): **merged** at `d529e0ba4961` (Advanced QR Generator; QR contrast, payload validation, optional logo, PNG/SVG).
- PR [#19](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/19): **merged** after retargeting at `04957e1c49c5` (Favicon ICO/ZIP/manifest, secure bulk passwords and passphrases, strength auditor, JSON tree/query/compare/export).
- Final pre-merge PR #19 [full CI](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42878144207): **success**, including 126 core-engine, 80 QR-engine and 153 everyday-engine assertions, existing checks and production build.
- Final pre-merge PR #19 [consolidated Chromium QA](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42878144213): **success**, 40 Favicon/Password/JSON + 25 QR + 15 Percentage/Unit/Text browser assertions (80 total).
- **Still pending:** Verify live hosting deployment state, one combined Android/iPhone/Safari/Firefox and real-file manual QA, security/hosting review and eventual `main` synchronization (separate draft PR #15). Do not claim production/mobile certification. `main` remained unchanged by PRs #17–#19.
- Original tool slugs preserved; no game changes in this batch.

## Candidate upgrade batch — Percentage, Units and Text Statistics (10 November 2026)

**Branch:** `feat/advanced-percentage-units-text-stats` based on the user's deployed `feat/browser-ai-background-remover` branch. **Do not merge or deploy without CI and browser regression review.** Existing URLs and shared catalog tool identifiers are preserved.

- Percentage Calculator retains its 18 / 120 = 15% default and adds percentage-of, increase/decrease, symmetric difference, reverse increase/discount and percentage-point modes, each with explicit formula and zero-denominator guards.
- Unit Converter retains 1 kilometre to mile as its default and adds length, mass, temperatures, area, US customary volume/cooking, speed, pressure and explicitly separated decimal/binary data units. Uses fixed conversion constants and no network rates. Rejects incompatible units, negative physical quantities and below-absolute-zero temperatures.
- Text Statistics preserves legacy word/character/line counters and adds sentences, paragraphs, unique words, reading/speaking time, top word frequencies, copy/export and 200,000-character input bounds. Unicode word/sentence boundaries follow Intl.Segmenter where available.
- `scripts/verify-advanced-everyday.ts` exercises the actual pure engines and is wired to `npm run check`; `npm run verify:everyday` runs the focused suite.
- **Verified automated evidence:** [CI run 42729443088](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42729443088) passed locked npm install, TypeScript, existing suites, **153 new deterministic engine assertions**, and production build. [Chromium run 42729442403](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42729442403) passed **15 real UI assertions**, including output conversion, reset, validation, word frequency and downloaded TXT report.
- **Not certified:** Actual Safari/Firefox, iOS/Android device QA and extended accessibility/performance tests are still separate release gates. Neither smoke suite establishes universal browser/device support.


## Candidate Tool #62 — AI Background Remover (10 November 2026)

This is a **separate draft addition**, not part of the historical 61-tool browser-QA table below. PR [#15](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/15) adds browser-local ORMBG background removal with pinned Apache-2.0 model/runtime, original-dimension PNG composition, and upload/memory limits. The core main CI has passed (e.g. [run 42714460236](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42714460236)). A real Chrome/Chromium smoke passed [run 42715470051](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42715470051), demonstrating local model execution, image-to-PNG workflow and full-resolution output. Further alpha-mask assertions, performance measurements, Safari/mobile QA and actual Hostinger production deployment remain required. **PR #15 is draft; tool is not universally certified or merged.** Details in `docs/AI_BACKGROUND_REMOVER_RELEASE.md`.

## Current verification standard — 8 November 2026

**Scope:** improve and validate the existing **61 utility-tool registrations** and **18 game catalog entries** only. Work on SEO, marketing, analytics, hosting, or unrelated infrastructure is not part of this repair scope.

**Evidence distinction:** A passing TypeScript check, scripted production-function test, or Vite production build is **not** a full browser, device, or real-file workflow test. The tool/browser notes and issue results below are a historical ledger; claims such as "tested", "browser passed", and generic "PASSED" were **not independently reproduced across all tools and games** during the recent batches. They must **not** be read as 61/61 tools or 18/18 games end-to-end certified. Some listed legacy source paths and issue descriptions predate subsequent code refactors.

- **Latest independently verified baseline entering Batch 12:** main commit `5e6ac21ddae17d4703ca680060743c89ced0f725`; GitHub Actions run [42281457882](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42281457882) passed `npm ci`, `npm run check`, and `npm run build`.
- **Browser / touch / desktop / mobile:** not comprehensively exercised in these GitHub-only repair batches. No all-tools/all-games browser success claim.
- **Game verification:** deterministic puzzle-bank solvers, real game-engine methods, and mathematical collision/geometry tests cover **specific features**, not every UI transition or device.
- **Tool verification:** selected actual converter functions, document creation/reopen tests, and format validators run through CLI/CI. Other real file round-trips and visual checking remain pending.
- **Batch 12:** Surviv weapon reload / auto-pickup / bandage engine fixes merged in [PR #12](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/12); GitHub Actions [42289841790](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42289841790) passed clean install, automated checks and production build.
- **Batch 13:** Surviv shot-time weapon attribution and Diep single-death / exhausted-projectile fixes **merged in** [PR #13](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/13); main-branch GitHub Actions [42383165095](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42383165095) passed all three clean-install, check and build gates.
- **Latest independently verified baseline entering Batch 14:** `main` commit `e031bd07185bb2675d1ca23619ed91b7b7a73ae0`, CI [42383165095](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42383165095) **SUCCESS**.
- **Batch 14 (Excel Studio):** Active-sheet cleaning edits in values-only XLSX export, backing-sheet synchronization, and safe Markdown clipboard tables; 15 targeted regression assertions including genuine multi-sheet XLSX save/reopen. See [PR #14](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/14) for **live** CI and merge status; this ledger must not be used to assume a pending PR passed.

---

**System Environment:**
- **Framework:** React 19, TypeScript, Vite 7, Tailwind CSS v4
- **Runtime:** Node.js Express server on port 3000
- **Catalog Scale:** 61 registered utility tools, 18 game catalog entries (including Logic Lab)
- **Deployment Target:** Hostinger static and node full-stack hosting

---

## 1. Historical Tool Tracking Table (61 Tools — Browser/E2E Not Fully Verified)

| # | Tool Name | Source Files | Original Defect / State | Fix Implemented | Unit / CLI Tests | Historical UI / Browser Notes (not reverified) | Remaining Limitations | Status |
|---|-----------|--------------|-------------------------|-----------------|------------------|---------------------|-----------------------|--------|
| 1 | Simple Calculator | `client/src/pages/ToolWorkspace.tsx` | Standard precision edge cases | Safe float evaluation | Node math test | Evaluated in workspace | Standard JS 64-bit float | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 2 | Percentage Calculator | `client/src/pages/ToolWorkspace.tsx` | Missing 0-denominator guard | Added `b !== 0` check | Node assertion | Checked input feedback | Range limit 1e12 | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 3 | Unit Converter | `client/src/pages/ToolWorkspace.tsx` | Dangling decimal point bug (`.replace(/0+$/, "")`) | Replaced with `Number(val.toFixed(6)).toString()` | Tested in workspace | Formatted string output | Metric / Imperial subsets | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 4 | Base64 Encoder/Decoder | `client/src/pages/ToolWorkspace.tsx` | UTF-8 non-ASCII btoa throwing error | Added `TextEncoder`/`TextDecoder` Base64 handler | Tested with accented characters | Verified round-trip | Binary cap 5MB | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 5 | JSON Formatter & Validator | `client/src/pages/ToolWorkspace.tsx` | Error line/col reporting clarity | Detailed parse error feedback | Tested with invalid JSON | UI shows syntax error banner | None | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 6 | Password Generator | `client/src/pages/ToolWorkspace.tsx` | Non-crypto pseudo-randomness | Upgraded to `crypto.getRandomValues` | Verified character distribution | Tested copy-to-clipboard | Length 8-128 | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 7 | Text Statistics & Word Count | `client/src/pages/ToolWorkspace.tsx` | Naive whitespace split | Unicode word regex count | Tested with multilingual text | Real-time counter tested | Large documents >10MB capped | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 8 | Color Converter & Palette | `client/src/pages/ToolWorkspace.tsx` | RGB/HEX out-of-bound overflow | Strict clamping [0, 255] and hex sanitization | Unit verified | Palette click tested | sRGB color space | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 9 | BMI Health Calculator | `client/src/pages/ToolWorkspace.tsx` | Negative height/weight values | Added non-negative / non-zero validation | Boundary testing | Visual gauge rendered | Metric & Imperial | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 10 | Discount & Sale Calculator | `client/src/pages/ToolWorkspace.tsx` | Discount > 100% negative price | Clamped discount rate [0, 100]% | Calculation test | Real-time breakdown | Currency agnostic | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 11 | Age Calculator | `client/src/components/AdvancedToolRunners.tsx` | Calendar negative-day leap bug (e.g. Jan 31 -> Mar 1) | Rebuilt with date anchor after full year/month subtraction | CLI test Jan 31 to Mar 1 -> 1 mo 1 day | Day / Month / Year breakdown tested | Gregorian calendar only | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 12 | Date Difference Calculator | `client/src/components/AdvancedToolRunners.tsx` | Timezone DST shifts causing off-by-one day | UTC normalization across date boundaries | CLI test | Date picker tested | Up to year 9999 | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 13 | URL Encoder & Decoder | `client/src/components/AdvancedToolRunners.tsx` | Malformed URI component crash (`decodeURIComponent`) | Wrapped in safe `try/catch` with inline feedback | Tested with `%E0%A4%A` malformed string | Error state displayed | None | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 14 | HTML Entity Encoder | `client/src/components/AdvancedToolRunners.tsx` | Unescaped control characters | Robust entity mapping table | Unit test | Preview tested | Standard HTML5 entities | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 15 | Text Case Converter | `client/src/components/AdvancedToolRunners.tsx` | ASCII-only regex dropping accented Latin/Hindi/Arabic; TS1501 | Dynamic `new RegExp("[^\\p{L}\\p{M}\\p{N}]+", "u")` & `new RegExp("^\\p{L}", "u")` | Tested with accented Latin and Hindi | Interactive case transforms | Standard Unicode regex | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 16 | UUID Generator | `client/src/components/AdvancedToolRunners.tsx` | v4 randomness collision | `crypto.randomUUID()` with fallback | Tested uniqueness | Bulk generation tested | Version 4 UUIDs | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 17 | CSS Gradient Generator | `client/src/components/AdvancedToolRunners.tsx` | Angle string parsing errors | Clamped angle [0, 360] deg | Preview test | Canvas rendering | Linear & Radial | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 18 | QR Code Generator | `client/src/components/AdvancedToolRunners.tsx` | Third party dependency leak | 100% local canvas QR rendering | Local script test | Download PNG/SVG tested | Max 2000 chars | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 19 | Image Resizer | `client/src/components/AdvancedToolRunners.tsx` | Aspect ratio skewing on manual input | Aspect lock toggle with canvas resample | Tested with high-res image | Blob export tested | Client memory bounded | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 20 | Favicon Generator | `client/src/components/AdvancedToolRunners.tsx` | Multi-size ICO missing sizes | Generates 16x16, 32x32, 48x48, 180x180 | Canvas downscaling tested | ZIP/PNG download tested | Standard square crops | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 21 | Hash Generator (SHA/MD5) | `client/src/components/AdvancedToolRunners.tsx` | Blocking large string hashing | Web Crypto API `subtle.digest` async | SHA-256 / SHA-512 / SHA-1 verified | Hash matching verified | Async browser crypto | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 22 | Password Strength Auditor | `client/src/components/AdvancedToolRunners.tsx` | Overly simplistic entropy score | Shannon entropy + dictionary check | Verified scoring | Visual meter verified | Client-side only | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 23 | Markdown Editor & Preview | `client/src/components/AdvancedToolRunners.tsx` | XSS vulnerability in raw HTML | Strict sanitization in preview parser | Tested script tag injection | Live split-pane rendering | Standard CommonMark | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 24 | Contrast Ratio Checker | `client/src/components/AdvancedToolRunners.tsx` | WCAG 2.1 luminance math rounding error | Exact relative luminance formula (sRGB gamma expansion) | Tested #000000 on #ffffff -> 21:1 | AA / AAA rating badge tested | RGB color space | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 25 | Business Days Calculator | `client/src/components/AdvancedToolRunners.tsx` | Weekend off-by-one loop | Calendar day iteration skipping Saturday/Sunday | Tested Friday-to-Monday -> 1 day | Holiday toggles tested | Custom holidays manual | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 26 | Time Zone Converter | `client/src/components/AdvancedToolRunners.tsx` | Ambiguous daylight savings offsets | `Intl.DateTimeFormat` with IANA timezone strings | Tested EST / IST / UTC | Real-time clock clocks | IANA supported zones | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 27 | Unix Timestamp Converter | `client/src/components/AdvancedToolRunners.tsx` | Milliseconds vs Seconds confusion | Automatic detection of 10-digit vs 13-digit | Tested epoch conversions | Interactive date-picker | 1970 to 2038+ | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 28 | Text Diff Checker | `client/src/components/AdvancedToolRunners.tsx` | Large text freeze on Myers diff | Chunked diff algorithm with line limit | Tested 1000 lines diff | Side-by-side highlighting | Text lines <5000 | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 29 | Find and Replace Tool | `client/src/components/AdvancedToolRunners.tsx` | Unescaped regex characters in find string | Safe regex escape or literal match option | Tested with brackets & dots | Replace count banner | Case-sensitive toggle | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 30 | Split Bill & Tip Calculator | `client/src/components/AdvancedToolRunners.tsx` | Rounding discrepancy in per-person cents | Cent-balanced integer distribution | Tested 3-way split of $10 | Per-person total tested | Max 100 people | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 31 | Loan EMI Calculator | `client/src/components/AdvancedToolRunners.tsx` | Interest rate 0% division by zero | Added zero-interest flat amortisation fallback | Tested 0% interest rate | Amortization schedule tested | Standard compounding | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 32 | Work Shift & Overtime Calculator | `client/src/components/AdvancedToolRunners.tsx` | Overnight shift negative duration | Handled overnight transition (`end < start`) | Tested 22:00 to 06:00 -> 8 hours | Overtime rate multiplier tested | 24-hour cycle | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 33 | JSON to CSV Converter | `client/src/lib/structuredDataEngines.ts` | Signed numbers `-1` mangled into `'-1` | Preserved pure numbers `/^[+\-]?\d+/` while guarding formula injection | Tested `-1`, `+123`, `=SUM()` | Download CSV verified | Max 2000 rows | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 34 | CSV Viewer & Editor | `client/src/lib/structuredDataEngines.ts` | Malformed quote parsing | Strict RFC 4180 parsing with double quote escapes | Tested unclosed quote handling | Interactive table editor | 60 columns max | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 35 | Image Transformer & Filter | `client/src/lib/localImageTransform.ts` | Orientation EXIF rotation mismatch | Automatic canvas rotation matching EXIF tags | Test suite `verify-image-transform.ts` passed | Brightness, contrast, crop tested | Canvas memory bounds | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 36 | Line Sorter & Deduplicator | `client/src/lib/lineToolEngine.ts` | Case-insensitive deduplication loss | Configurable case sensitivity & natural sort | Test suite `verify-line-tool.ts` passed | Sort direction & trim options | Lines < 50,000 | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 37 | Image Metadata & EXIF Viewer | `client/src/lib/localImageMetadata.ts` | Corrupted metadata buffer crash | Safe EXIF parser catching malformed headers | Test suite `verify-image-metadata.ts` passed | Clean privacy strip option | JPEG, PNG, WebP | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 38 | PDF Page Editor | `client/src/components/PdfToolsRunner.tsx` | Missing worker synchronization | `ensure-pdf-worker.js` syncs worker script | Verified worker setup | Rotate, reorder, delete pages | Client memory limit | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 39 | PDF Compressor | `client/src/components/PdfToolsRunner.tsx` | Downsampling quality artifacts | Canvas downsampling with quality presets | Verified output size reduction | Download compressed PDF | Raster downsampling | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 40 | Enterprise PDF Redaction | `client/src/lib/pdfRedaction.ts` | Overlay fake black boxes (extractable text) | True destructive vector & text redaction | Test suite `verify-pdf-redaction.ts` passed | Interactive redaction box | Standard PDF fonts | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 41 | PDF Merge & Split | `client/src/components/PdfToolsRunner.tsx` | Corrupted file dropped silently; malformed ranges | Added user alert; strict regex validation (`/^\d+$/`, `/^\d+\s*-\s*\d+$/`) | Verified page range extraction | Multi-file merge tested | Encrypted files require password | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 42 | Images to PDF Converter | `client/src/components/PdfToolsRunner.tsx` | WebP image embedding throwing fatal error | Added `renderImageToPngBytes` rasterization | Verified with WebP/PNG/JPEG | Export multi-page PDF | Portrait/Landscape options | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 43 | Excel Studio (XLSX Editor) | `client/src/components/ExcelStudioTool.tsx` | Sheet switch discarded edits; export saved only active sheet | Persist edits to `workbook.Sheets`; export full `workbook` with all sheets | Real workbook round-trip, formula integrity and pending edits regression; Batch 14 | Historical UI note (not reverified) | Browser upload/clean/export/reopen still pending | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 44 | Word DOCX Studio | `client/src/components/WordDocxTool.tsx` | Fake `.doc` HTML fallback; regex parser dropped formatting | True `docx` Packer generation; DOMParser for rich text | Verified `.docx` binary zip | Formatting preserved | Advanced tables text-based | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 45 | WhatsApp Direct Chat | `client/src/components/RegionalHighDemandTools.tsx` | Duplicate country code bug (e.g. +91 91...) | Normalized phone string stripping leading country prefix | Tested `+91 919876543210` -> `919876543210` | Click to open wa.me tested | International formats | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 46 | GST Tax Calculator | `client/src/components/RegionalHighDemandTools.tsx` | Division-by-zero on negative rate; rounding discrepancies | Added finite non-negative checks and 2-decimal currency rounding | Tested 0% and 18% slab | Exclusive/Inclusive mode | Indian GST standard slabs | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 47 | Passport Photo Maker | `client/src/components/RegionalHighDemandTools.tsx` | Inexact aspect ratios for international standards | Strict dimension presets (35x45mm, 2x2in, 35x35mm) | Canvas crop test | 300 DPI export tested | Single photo framing | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 48 | Land Area Converter | `client/src/components/RegionalHighDemandTools.tsx` | Regional Indian land units missing conversion factors | Authored precise conversion table (Bigha, Guntha, Acre, Sq Ft) | Verified Acre <-> Guntha math | Interactive unit picker | State-level bigha variations | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 49 | Number to Words (Rupees) | `client/src/lib/regionalTranslations.ts` | Paise rounding bug (e.g. `100.999` -> `100 paise`) | Exact 2-decimal paise rounding to next rupee | Tested `100.999` -> `One Hundred One Rupees Only` | English and Hindi output | Up to 999 Crores | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 50 | JSON to Zod & TypeScript | `client/src/components/JsonToZodTool.tsx` | Root `null`/`0`/`false` failed; invalid identifiers; missing unions | Sanitized identifiers; handles falsy roots; generates heterogeneous unions | CLI test suite | Live editor preview | Primitive & complex schemas | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 51 | Tracking URL Cleaner | `client/src/components/TrackingUrlCleanerTool.tsx` | Third party `api.qrserver.com` privacy leak | Replaced with 100% local `qrcode` library | Offline network audit | Cleaned URL & QR code | Strips UTM/FB/TikTok tags | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 52 | JWT Token Debugger | `client/src/pages/ToolWorkspace.tsx` | Malformed base64url crash | Safe base64url decoding with expiration time audit | Tested with standard JWT | Claims inspection tested | Verification requires public key | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 53 | Cron Schedule Expression | `client/src/components/CronScheduleTool.tsx` | Loose numeric parsing (`5abc` parsed as 5) | Enforced strict `/^\d+$/` validation on cron tokens | CLI cron parser tests | Next 8 runs timeline tested | Standard 5-field cron | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 54 | Regex Tester & Debugger | `client/src/components/RegexTesterTool.tsx` | Catastrophic backtracking freeze (ReDoS) | Added 1000ms execution timeout guard | Tested ReDoS pattern | Match group table & replace | Standard JS RegExp engine | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 55 | cURL to Code Converter | `client/src/components/CurlToCodeTool.tsx` | Quoted header shell parsing | Robust shlex-style shell argument parser | Tested multi-header cURL | Python/JS/Go output | Method, header, body options | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 56 | Lorem Ipsum Generator | `client/src/components/GenerativeToolRunners.tsx` | Uniform sentence length | Dynamic clause and comma insertion | Output verification | Paragraph/Sentence options | Standard Latin vocabulary | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 57 | Random Number & Dice | `client/src/components/GenerativeToolRunners.tsx` | Potential 0-range division | Crypto random integers with bounds validation | Verified bounds [min, max] | Dice & coin toss tested | Integers and Decimals | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 58 | SEO Meta Tag Generator | `client/src/components/GenerativeToolRunners.tsx` | Unescaped quotes in HTML attributes | Added `escapeHtmlAttr` sanitization | Verified tag output | Next.js and HTML snippet | OpenGraph & Twitter | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 59 | Username & Handle Generator | `client/src/components/GenerativeToolRunners.tsx` | Inflexible length constraints | Curated prefix/suffix word lists with length filters | Tested handle formats | Copy all options tested | ASCII alphanumeric | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 60 | OpenGraph Card Builder | `client/src/components/GenerativeToolRunners.tsx` | Canvas export dimensions | Strict 1200x630 pixel rendering | Visual canvas render | PNG download tested | Predefined templates | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |
| 61 | Fake Data Generator | `client/src/components/GenerativeToolRunners.tsx` | Schema type generation inconsistency | Typed schema builder (Name, Email, Address, Phone, UUID) | Generated 100 rows JSON/CSV | Table view tested | Synthetic mock data | HISTORICAL UNIT/SOURCE NOTE; BROWSER E2E PENDING |

---

## 2. Historical Game Tracking Table (18 Games — Browser/Device Not Fully Verified)

| # | Game Name | Source Files | Rules Validated | Puzzle Bank Validated | Historical Input Notes | Historical Gameplay Notes | Historical Performance Notes | Remaining Limitations | Status |
|---|-----------|--------------|-----------------|-----------------------|------------------------|-----------------|---------------------|-----------------------|--------|
| 1 | Strands (Theme Threads) | `client/src/game/logicPuzzles/strands.ts`, `strandsBank.ts` | Spangram & theme word adjacency | 7 daily authored editions verified | Drag & touch path select | Word found animations | Unmeasured | 8x6 grid standard | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 2 | The Hive (Spelling Bee) | `client/src/game/logicPuzzles/hive.ts`, `hiveBank.ts` | Center letter required, min 4 letters | 7 daily pangram editions verified | Hex grid & keyboard | Rank progress bar | Unmeasured | 7-letter honeycomb | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 3 | Connections | `client/src/game/logicPuzzles/connections.ts`, `connectionsBank.ts` | 4 groups of 4 by difficulty | 7 daily editions verified | Multi-select & submit | Mistake counter & shuffle | Unmeasured | 4x4 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 4 | Wordle (Lexicon) | `client/src/game/logicPuzzles/wordleBank.ts`, `wordle.ts` | 5-letter words only, 6 attempts | Eliminated 4/6-letter bugs; all 16 bank words strictly 5 letters & in dictionary | Virtual & physical keyboard | Letter color flips (Green/Yellow/Gray) | Instant render | 5-letter vocabulary | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 5 | Queens | `client/src/game/logicPuzzles/queens.ts`, `queensBank.ts` | 1 queen per row/col/color, no touching | 7 daily connected editions verified by solver | Tap to crown / cross | Win celebration modal | <10ms solve verification | 6x6 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 6 | Mini Sudoku | `client/src/game/logicPuzzles/miniSudoku.ts`, `miniSudokuBank.ts` | 1-6 per row, col, 2x3 box | 7 daily editions uniquely solvable (count=1) | Numpad & keyboard | Duplicate conflict highlight | Immediate validation | 6x6 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 7 | Tango | `client/src/game/logicPuzzles/tango.ts`, `tangoBank.ts` | Sun/Moon balance, max 2 consecutive, =/x | 7 daily editions uniquely solvable (count=1) | Click to toggle Sun/Moon | Rule violation markers | Immediate validation | 6x6 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 8 | Patches | `client/src/game/logicPuzzles/patches.ts`, `patchesBank.ts` | Exact rectangular cover matching clues | 7 daily editions uniquely solvable (count=1) | Drag to size rectangles | Overlap and boundary guards | Instant evaluation | 6x6 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 9 | Zip | `client/src/game/logicPuzzles/zip.ts`, `zipBank.ts` | Ordered wall path visiting all numbered checkpoints | 7 daily 6x6 editions uniquely solvable (count=1); metadata corrected | Path drag & arrow keys | Wall collision detection | Immediate check | 6x6 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 10 | Wend | `client/src/game/logicPuzzles/wend.ts`, `wendBank.ts` | Orthogonal word exact cover | 7 daily 5x5 editions uniquely solvable (count=1) | Letter path trace | Exact cover check | Instant check | 5x5 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 11 | Chess Puzzles | `client/src/game/logicPuzzles/chessBank.ts`, `ChessPuzzle.tsx` | Real chess rules engine (`chess.js`) | 7 daily tactical editions (FEN, player move, reply) verified checkmate & legality | Click/drag piece to square | Legal move dots, illegal alerts, notation bar | Sub-millisecond `chess.js` | 7 daily editions | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 12 | Nonogram Griddlers | `client/src/game/logicPuzzles/nonogramBank.ts`, `LogicPuzzle.tsx` | Row & column run clues | 7 daily picture editions verified | Click to fill / right-click cross | Victory pixel art reveal | Instant line check | 10x10 / 15x15 grids | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 13 | Orbit Dash | `client/src/pages/OrbitDash.tsx`, `client/src/game/` | 3D cyber dodge physics & speed | Procedural obstacle lanes | Arrow keys & touch lanes | Score multiplier & collision | Unmeasured FPS | WebGL required | SOURCE REVIEW; BROWSER PENDING |
| 14 | Diep Tank Arena | `client/src/pages/DiepArena.tsx`, `client/src/game/diep/` | 2D tank shooter, stat upgrades, 4-tier tree | Authoritative engine loop & shape spawning | WASD movement + mouse aim | AI bot combat & bullet collisions | Unmeasured FPS | Local bot AI | PARTIAL ENGINE TESTS; BROWSER PENDING |
| 15 | Surviv Battle Royale | `client/src/pages/SurvivBattleRoyale.tsx`, `client/src/game/surviv/` | Shrinking toxic circle, loot, obstacles | Procedural map & loot drop tables | WASD + mouse aim + reload | 30 bot battle royale simulation | Unmeasured FPS | Local bot simulation | PARTIAL ENGINE TESTS; BROWSER PENDING |
| 16 | Krunker Voxel FPS | `client/src/pages/KrunkerArena.tsx`, `client/src/game/krunker/` | 3D slide-hopping physics, hitscan raycasts | 5 combat classes, block voxel map | PointerLock FPS mouse + keyboard | Enemy bots & health bars | Unmeasured FPS | WebGL & PointerLock | PARTIAL ENGINE TESTS; BROWSER PENDING |
| 17 | Mini Crossword | `client/src/game/logicPuzzles/miniCrosswordBank.ts`, `miniCrossword.ts` | 5x5 symmetric English word squares | All 7 editions rebuilt with 100% genuine dictionary words; across=down | Arrow keys, click cell, backspace | Real-time letter verification | Instant render | 5x5 grid | AUTOMATED RULE/BANK CHECKS; BROWSER PENDING |
| 18 | Logic Lab | `client/src/pages/LogicLab.tsx` | Sandbox puzzle generation & solver playground | Custom generator across logic rulesets | Interactive parameter sliders | Instant solve & test play | Unmeasured | Generator presets | SOURCE REVIEW; BROWSER PENDING |

---

## 3. Critical Issue Tracker

| Issue ID | Priority | Target File | Root Cause | Fix Implemented | Regression Test | Result |
|----------|----------|-------------|------------|-----------------|-----------------|--------|
| ISS-001 | P0 | `client/src/game/logicPuzzles/wordleBank.ts` | Invalid word lengths ("NOVA"=4, "ZENITH"=6) and invalid guess vocabulary ("DIRT"=4) | Replaced with "COMET", "CREST", "ALPHA", "GAMMA"; cleaned vocabulary | `scripts/verify-logic-puzzles.ts` | AUTOMATED TEST PASSED |
| ISS-002 | P0 | `client/src/game/logicPuzzles/chessBank.ts` | Puzzles lacked chess rule engine; pawn/knight/rook moves were illegal; FENs misaligned | Rebuilt 7 editions with verified FENs and moves tested via `chess.js` | Automated `Chess` move legality test in `verify-logic-puzzles.ts` | AUTOMATED TEST PASSED |
| ISS-003 | P0 | `client/src/components/puzzles/ChessPuzzle.tsx` | No legal move validation; pieces moved to any arbitrary square | Integrated `chess.js` engine, legal target dot indicators, move notation | Interactive move test & engine verification | HISTORICAL REPORT; BROWSER NOT REVERIFIED |
| ISS-004 | P0 | `client/src/game/logicPuzzles/miniCrosswordBank.ts` | Bank contained fake gibberish words ("REOPT", "RVGLP", "SCESS", etc.) | Authored 7 verified 5x5 symmetric English word squares with accurate clues | Automated grid row/col answer match test in `verify-logic-puzzles.ts` | AUTOMATED TEST PASSED |
| ISS-005 | P0 | `client/src/components/PdfToolsRunner.tsx` | `pdf-lib` does not support WebP, throwing fatal unhandled exception on image upload | Added `renderImageToPngBytes` canvas rasterization to PNG before embedding | Tested WebP conversion to PNG buffer | AUTOMATED TEST PASSED |
| ISS-006 | P1 | `client/src/lib/pdfExtraction.ts` | Exported fake `.ppt` HTML file instead of real PowerPoint binary | Integrated `pptxgenjs` to generate genuine `.pptx` presentation files | Production build & binary export test | FIX IMPLEMENTED |
| ISS-007 | P1 | `client/src/components/ExcelStudioTool.tsx` | Switching sheets discarded edits; exporting only wrote active sheet | Edits saved back to `workbook.Sheets`; full multi-sheet `workbook` exported | Tested multi-sheet workbook round-trip | FIX IMPLEMENTED |
| ISS-008 | P1 | `client/src/components/WordDocxTool.tsx` | HTML download fallback masked DOCX failure; fragile regex parser dropped formatting | Replaced fallback with honest error reporting; used `DOMParser` for DOCX | Production build test & DOCX export | FIX IMPLEMENTED |
| ISS-009 | P1 | `client/src/components/AdvancedToolRunners.tsx` | Age calculator produced negative days across month boundaries (e.g. Jan 31 -> Mar 1) | Rebuilt calculation using calendar anchor date after subtracting years/months | Verified Jan 31 to Mar 1 = 1 month, 1 day | AUTOMATED TEST PASSED |
| ISS-010 | P1 | `client/src/components/RegionalHighDemandTools.tsx` | WhatsApp direct chat duplicated country code prefix (`+91 91...`) | Normalized phone string stripping leading country prefix | Tested with `+91` input | HISTORICAL REPORT; BROWSER NOT REVERIFIED |
| ISS-011 | P1 | `client/src/components/RegionalHighDemandTools.tsx` | GST calculator lacked finite non-negative checks and division-by-zero protection | Added `1 + rateDecimal > 0` validation and 2-decimal rounding | Tested 0% and boundary values | AUTOMATED TEST PASSED |
| ISS-012 | P1 | `client/src/lib/regionalTranslations.ts` | Rupees to Words paise rounding bug (e.g. `100.999` produced `100 paise`) | Exact 2-decimal paise rounding to next rupee | Tested `100.999` -> `One Hundred One Rupees Only` | AUTOMATED TEST PASSED |
| ISS-013 | P1 | `client/src/pages/ToolWorkspace.tsx` | Unit converter left dangling decimal points (e.g. `100.`) | Replaced regex with `Number(val.toFixed(6)).toString()` | Unit conversion tests | AUTOMATED TEST PASSED |
| ISS-014 | P1 | `client/src/components/JsonToZodTool.tsx` | Falsy JSON roots (`null`, `0`, `false`, `""`) failed; identifiers with digits/keywords crashed; unions missing | Sanitized identifiers, accepted falsy roots, added `z.union` for heterogeneous arrays | Comprehensive JSON to Zod tests | AUTOMATED TEST PASSED |
| ISS-015 | P1 | `client/src/components/TrackingUrlCleanerTool.tsx` | Leaked user URLs to remote third-party `api.qrserver.com` | Replaced with 100% local `qrcode` canvas generator | Verified zero external network requests | HISTORICAL REPORT; BROWSER NOT REVERIFIED |
| ISS-016 | P1 | `shared/gamesData.ts` | Zip game metadata stated "5×5 ordered wall path" while board bank is 6×6 | Updated metadata to "6×6 ordered wall path" | Verified against `zipBank.ts` | AUTOMATED TEST PASSED |
| ISS-017 | P1 | `client/src/components/RegexTesterTool.tsx` | Catastrophic backtracking patterns could hang the browser tab | Added 1000ms performance timeout guard | Tested ReDoS pattern | AUTOMATED TEST PASSED |
| ISS-018 | P1 | `client/src/components/CronScheduleTool.tsx` | Non-numeric tokens (e.g. `5abc`) were loosely parsed by `parseInt` | Enforced strict `/^\d+$/` token regex validation | Tested cron field parser | AUTOMATED TEST PASSED |
| ISS-019 | P1 | `client/src/lib/structuredDataEngines.ts` | Pure negative numbers (`-1`) were treated as CSV formula injection | Allowed valid signed numbers `/^[+\-]?\d+/` while keeping formula security | Tested `-1`, `+100`, `=CMD` | AUTOMATED TEST PASSED |
| ISS-020 | P0 | `scripts/verify-logic-puzzles.ts` | Test script only verified Mini Sudoku, Tango, Queens, Patches, Zip, Wend | Added Wordle 5-letter, Chess FEN/move legality, and Mini Crossword 5x5 validations | `npx tsx scripts/verify-logic-puzzles.ts` | AUTOMATED TEST PASSED |
| ISS-021 | P0 | `client/src/workers/regexWorker.ts`, `client/src/components/RegexTesterTool.tsx` | Main thread ReDoS hang risk; no execution bounds | Moved regex execution to Web Worker with 20k char limit, 300 match cap, and 800ms termination | Automated test & ReDoS timeout test | AUTOMATED TEST PASSED |
| ISS-022 | P0 | `client/src/lib/telegramAlerts.ts` | `VITE_TELEGRAM_BOT_TOKEN` in client bundle exposed bot credentials to browser | Removed bot token from client code; replaced with safe server relay check | Bundle inspection & test audit | FIX IMPLEMENTED |
| ISS-023 | P1 | `client/src/pages/Contact.tsx` | Displayed false "Message dispatched!" banner when API was unconfigured | Added distinct success, error, and unconfigured feedback states with Email/LinkedIn fallbacks | UI feedback state verification | HISTORICAL REPORT; BROWSER NOT REVERIFIED |
| ISS-024 | P1 | `client/src/components/ExcelStudioTool.tsx` | `XLSX.utils.aoa_to_sheet` wholesale sheet replacement destroyed cell formulas and sheet metadata | Added `syncDataToWorksheet` using targeted cell encoding to preserve formulas and metadata | Workbook round-trip verification | FIX IMPLEMENTED |
| ISS-025 | P1 | `client/src/components/PdfCompressTool.tsx` | Misleading percentage reduction guarantees and lack of image rasterization disclosure | Added explicit Image-Based Compression disclosure and honest size delta reporting | UI & compression result verification | HISTORICAL REPORT; BROWSER NOT REVERIFIED |
| ISS-026 | P1 | `client/src/lib/pdfExtraction.ts` | Presentation export silently truncated text at 12 lines (`lines.slice(0, 12)`) | Implemented continuation slides chunking text across slides preserving 100% of text | PPTX generation test | FIX IMPLEMENTED |
| ISS-027 | P1 | `client/src/lib/pdfOcr.ts` | Destructive ASCII regex (`[^\x20-\x7E]`) erased accented and multilingual characters | Replaced with `sanitizeWinAnsiText` character mapping and documented WinAnsi charset limitation | OCR character preservation test | FIX IMPLEMENTED |
| ISS-028 | P1 | `client/src/components/JsonToZodTool.tsx` | Root-level object arrays omitted item interface declarations, causing type errors | Included both item interfaces and root type alias in generated TypeScript output | TypeScript type generation test | AUTOMATED TEST PASSED |
| ISS-029 | P1 | `client/src/components/GenerativeToolRunners.tsx` | Modulo bias (`array[0] % range`) and non-crypto `Math.random` fallback in secure RNG | Implemented rejection sampling eliminating modulo bias and removed Math.random fallback | RNG uniform distribution test | AUTOMATED TEST PASSED |
| ISS-030 | P1 | `client/src/components/GenerativeToolRunners.tsx` | Fragile string escaping (`.replace(/'/g, "\\'")`) broke Next.js SEO metadata generation | Used `JSON.stringify()` for all metadata string attributes | Next.js metadata format test | AUTOMATED TEST PASSED |
| ISS-031 | P1 | `client/src/lib/structuredDataEngines.ts` | CSV generator lacked mode separation between exact raw values and spreadsheet-safe escaping | Implemented dedicated `tableToRawCsv` and `tableToSpreadsheetCsv` functions | CSV export test suite | AUTOMATED TEST PASSED |
| ISS-032 | P1 | `client/index.html`, `client/src/lib/analytics.ts` | GTM loaded before consent; `respectDNT: false` on GA4 conflicted with Privacy policy | Added DNT/GPC guard to GTM snippet and enforced `respectDNT: true` across all providers | Analytics verification script | AUTOMATED TEST PASSED |
| ISS-033 | P0 | `client/src/components/ExcelStudioTool.tsx` | Stale cell entries and unadjusted `!ref` remained in SheetJS worksheet after row deletion / deduplication | Pruned all cells outside active data boundaries and recalculated `!ref` in `syncDataToWorksheet` | Real XLSX fixture deduplication and round-trip reopen in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-034 | P0 | `client/src/lib/secureRandom.ts`, `GenerativeToolRunners.tsx` | Rejection sampling limit could reach 0 on 2^32 range causing infinite loop; decimal uniqueness had no domain guard | Extracted standalone `secureRandom.ts` with uint32 range support, non-replacement sampling, and domain checks | `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-035 | P0 | `client/src/components/AdvancedToolRunners.tsx` | `toISOString().slice(0, 10)` drifted date backward in IST/Asian timezones; 86400000ms division drifted on DST | Added `formatLocalDate` and UTC calendar-date ordinal difference (`calendarDaysDifference`) | Date timezone and boundary test in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-036 | P1 | `client/src/pages/ToolWorkspace.tsx` | Password generator selected character indices using modulo arithmetic (`byte % alphabet.length`) | Selected character indices using cryptographically secure rejection sampling without modulo bias | `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-037 | P1 | `client/src/pages/ToolWorkspace.tsx` | Text statistics used whitespace splitting, undercounting CJK and complex Unicode scripts | Implemented `countWordsUnicode` using `Intl.Segmenter` with `granularity: 'word'` | Multilingual word count tests (Hindi, French, English) | AUTOMATED TEST PASSED |
| ISS-038 | P0 | `client/src/lib/pdfTextSanitizer.ts`, `pdfOcr.ts`, `PdfEditorTool.tsx` | Searchable PDF invisible text layer silently deleted Hindi / non-WinAnsi text with spaces | Added `detectUnsupportedWinAnsi`, labeled English OCR text layer explicitly, audited characters, and warned user without silent dropping | Automated character detection & PDF creation in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-039 | P1 | `client/src/components/PdfCompressTool.tsx` | False "100% Vector Intact" claims; scale mismatched advertised DPI; lossless mode wiped document metadata | Corrected DPI to exact viewport scales (72, 108, 144 DPI), preserved metadata in lossless mode, added encryption detection | Profile and metadata preservation test in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-040 | P1 | `client/src/lib/pdfExtraction.ts` | PPTX export grouped arbitrary 12 source lines, overflowing text boxes on wrapped lines | Implemented `estimateVisualLines` and `chunkLinesForSlides` by visual line weight with `wrap: true` | 40-line + long-line PPTX generation and JSZip XML inspection in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-041 | P0 | `package.json`, `package-lock.json`, `.github/workflows/ci.yml` | `npm ci` failed in GitHub Actions due to missing chess.js, pptxgenjs and vitest peer conflicts | Removed unused vitest, regenerated lockfile with exact sync, and verified clean `npm ci` passing | Local `npm ci` exit code 0 | AUTOMATED TEST PASSED |
| ISS-042 | P0 | `client/src/components/ExcelStudioTool.tsx` | Deleting duplicate/empty rows removed `f` formula properties, corrupting references | Blocked structural changes on formula workbooks, added `workbookHasFormulas`, per-sheet dirty tracking, and values-only export | Reopen & formula preservation test in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-043 | P1 | `client/src/lib/secureRandom.ts`, `GenerativeToolRunners.tsx` | Decimal generator rounded lower/upper bounds, selecting out-of-interval numbers | Implemented representable decimal grid steps (`ceil(lower*factor)`, `floor(upper*factor)`) with domain validation | Exact interval boundary test in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-044 | P0 | `client/src/pages/Tools.tsx`, `client/src/lib/analytics.ts`, `client/index.html` | Raw search terms transmitted in telemetry; dynamic referral query embedded in page titles; unconditional GTM iframe bypassed DNT | Stripped `search_term` in favor of `query_length`, added blocklist filter, sanitized titles, removed noscript GTM iframe | Automated privacy & PII filter tests in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-045 | P1 | `client/src/lib/telegramAlerts.ts`, `client/src/pages/Contact.tsx` | Telegram dispatch attempted without relay endpoint; misleading delivery confirmation | Gated dispatch behind `isTelegramAlertsConfigured()`, handled unconfigured status honestly with direct fallback channels | Automated relay check in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-046 | P1 | `client/public/service-worker.js` | Service worker cached dynamic endpoints and private requests indiscriminately | Restricted caching to static asset extension allowlist (`.js`, `.css`, etc.), bypassed `/api/*`, `/contact/*`, `Authorization`, and `no-store` | Automated SW allowlist tests in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |
| ISS-047 | P1 | `client/index.html`, `client/src/pages/Home.tsx`, `client/src/lib/webMcp.ts`, `server/index.ts` | Exaggerated '120+ utilities' claims contradicted 61 verified catalog entries; unimplemented `/api/mcp` endpoint | Corrected claims to 61 verified utilities, implemented live JSON-RPC 2.0 `/api/mcp` handler supporting 4 declared tools | Automated catalog count & MCP endpoint test in `verify-precision-repairs.ts` | AUTOMATED TEST PASSED |

---

## 4. Recent focused tools-and-games repair batches

These are **merged code changes with targeted automated regression checks**. Do not interpret them as browser/device certification.

| Batch / PR | Primary tool or game behavior corrected | Verification boundary |
|---|---|---|
| [#1](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/1) | Chess/Nonogram stale timers; Excel workbook dirty-state leakage; cURL generator escaping | PR and main CI; no complete browser matrix |
| [#2](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/2) | Unique Nonogram clues, Connections/Strands input validation, GST and PDF-to-PPTX edge cases | Puzzle-bank solvers and conversion checks |
| [#3](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/3) | Cron validation, Fake Data SQL identifiers, image resize limits | Production-helper assertions |
| [#4](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/4) | Diep/Surviv high-DPI canvas coordinates; Krunker teardown | Math/coordinate tests; not real touch/FPS measurement |
| [#5](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/5) | Word/Excel PDF overflow and Bates page-range validation | Actual PDF output creation and reopen tests |
| [#6](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/6) | Actual image MIME checks, Images-to-PDF selection order, Krunker replay | Format, geometry, engine-state tests |
| [#7](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/7) | Focused arcade controls, Krunker hitscan ray geometry, Surviv game-over stop | Collision assertions; not browser gameplay |
| [#8](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/8) | Surviv projectile tunneling through walls and targets | Actual bullet-engine integration tests |
| [#9](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/9) | Surviv player/bot separation from walls and rocks | Movement resolver and engine integration tests |
| [#10](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/10) | Surviv ammo/medicine partial pickups and stack caps | Real loot engine tests |
| [#11](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/11) | Surviv shrinking gas zone, one-time deaths, overkill stats | Real zone/damage engine tests |
| [#12](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/12) | Surviv reload slot tracking, auto-weapon pickup cancellation, non-damaging bandages and medical-use guards | Targeted reload/medical engine tests; consult PR for actual CI result |
| [#13](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/13) | Surviv shot-time weapon attribution; Diep Arena single-death and exhausted projectile collision handling | Direct real engine firing, bullet impact and same-frame elimination assertions; browser E2E pending |
| [#14](https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/14) | Excel Studio values-only XLSX reflects pending cleaning edits; trims synchronize workbook; Markdown copy preserves pipes, backslashes and multiline cells | 15 real-function assertions including multi-sheet XLSX save/reopen; browser E2E pending; check PR for CI/merge status |

### Open functional verification work

- **Tools:** perform authentic browser input → processing → output → download/reopen → edge-case → mobile checks, especially PDF, Word/DOCX, Excel/XLSX and image export workflows. Unit-verified helpers do not prove every UI export path.
- **Puzzle games:** check start, controls, rules, mistakes, victory/loss, daily selection and restart on desktop and touch devices. Bank solver results are only part of gameplay verification.
- **Arcade/3D games:** check live movement, collision, shooting, inventory, game-over/restart, pointer lock, touch joysticks and frame-rate behavior in actual browsers/devices. Existing engine tests are partial coverage.
- **Evidence:** mark an entry browser-verified only after a reproducible run records the platform, steps, expected/actual outcome, and any artifact/screenshots.

