# Hostinger Shared Hosting Deployment

This project is designed to publish as a **static Vite build**. Hostinger does not need a permanent Node.js process to run the Tools and Games UI. The current thirty-six tools, three arcade games, and six Logic Lab modules are browser-local, so the core experience does not require an API or database.

## Build and upload

Run the following from the project directory:

```bash
# Using bun (recommended - lockfile present):
bun install
bun run check
bun run build

# Or using npm:
npm install
npm run check
npm run build
```

Upload the contents of `dist/` to the domain document root, usually `public_html/` in Hostinger File Manager or SFTP. Upload the **contents** of that folder rather than the folder itself. The generated `.htaccess` file is copied from `client/public/` into the output and ensures direct visits to routes such as `/tools/json-station` or `/games/orbit-dash` serve the React application.

## Hostinger checklist

| Check | Expected result |
|---|---|
| Root document | `public_html/index.html` exists after upload |
| SPA fallback | `/tools`, `/tools/image-resizer`, `/games/orbit-dash`, `/games/signal-switch`, `/games/circuit-shift`, `/games/mini-sudoku`, `/games/tango`, `/games/queens`, `/games/patches`, `/games/zip`, and `/games/wend` open directly without 404 errors |
| HTTPS | `https://toolboxgalaxy.com` is enabled and the HTTP version redirects to HTTPS |
| Assets | `/manus-storage/` URLs must be replaced by equivalent permanent image URLs if deploying outside Manus hosting |
| Headers | Confirm the `.htaccess` header directives work with the selected Hostinger server stack |
| PWA files | `manifest.webmanifest`, `service-worker.js`, and `offline.html` are present at the document root after upload |
| Offline fallback | After one successful load over HTTPS, temporarily disable the network and reload a recently visited route; the cached app shell or the explicit offline screen appears |
| Sitemap | `https://toolboxgalaxy.com/sitemap.xml` returns the new sitemap |
| Social share cards | Open Graph and Twitter share images exist in `public_html/og/` (generated during `npm run build` via `npm run generate:og`) |

## Important asset note

The current build uses Manus-hosted visual and audio asset URLs. Those URLs are suitable for the project preview. Before the Hostinger release, export the mapped generated assets, including `logic-puzzle-suite-reference.jpg` and `logic-lab-loop.mp3`, and upload them to the Hostinger site (for example, `public_html/assets/`), then replace the `/manus-storage/...` references with permanent HTTPS asset paths. Do not leave preview-only asset URLs in a production Hostinger upload.

The complete source-to-destination list is in [`HOSTINGER_ASSET_MAP.md`](./HOSTINGER_ASSET_MAP.md). Build production with `VITE_ASSET_BASE_URL=/assets` after the asset references have been moved to the Hostinger location.

## Offline and install behavior

The service worker is a small static file with no API dependency. It caches the app shell plus same-origin files that the browser has successfully visited, and it uses a network-first path for navigations so new releases are discovered whenever the visitor is online. A new worker waits for the user’s explicit **Refresh** action in the visible update-ready notice, avoiding an automatic reload during local tool work. The `.htaccess` file marks `service-worker.js` as non-cacheable so Hostinger clients can receive the next cache version promptly.

The native install button appears only in browsers that emit the standard install prompt and only after the manifest, HTTPS, and service worker meet that browser’s own requirements. The current manifest uses the preview Orbit Mark path; before production, replace its icon source with the permanent `/assets/orbit-mark.png` path alongside the other Manus-hosted image replacements.

## Browser-local recent tools

The Tools hub can retain up to six recently opened tool routes in the current browser’s `localStorage`. It stores only the public route metadata already present in the tool registry—tool slug, name, category, and visit timestamp. It does **not** store workspace inputs, outputs, uploaded files, generated content, passwords, hashes, or images. Visitors can clear that small log or export the metadata as JSON directly from the Tools page; neither action contacts a server.

## Browser-local favorite tools

Visitors can pin up to twelve verified tools for repeat access. The favorite feature stores only the tool route slug in the current browser’s `localStorage`, then resolves its visible title, category, and description from the already bundled registry. It never stores tool inputs, outputs, files, generated content, or account data. A visitor can remove any individual pin or clear all pins directly from the Tools hub; no favorite data is sent to Hostinger or any other service.

## Keyboard shortcut reference

The global shortcut reference is static UI only and has no persistence, API, or analytics dependency. It opens from the visible rail control or with `?` when focus is outside editable fields; it only documents the existing controls and does not create a global command system. All documented game keys retain a visible pointer/touch equivalent. For visual QA, append `?shortcuts=1` to a route to open the reference panel directly.

## Command palette

The command palette is also static UI only. It searches the already bundled route/module catalog and opens from the rail or Ctrl/Cmd+K only when a visitor is not typing and no dialog is open. It does not query an API, persist search terms, or inspect tool workspace content. For visual QA, append `?command=1` to a route to open it directly.

## Circuit Shift Daily Challenge

Circuit Shift’s Daily Challenge is also static and browser-local. Its 4×4 scramble is derived from the visitor device’s local calendar date, so it does not need a clock API, database, login, or leaderboard. The date-specific daily best remains in that browser’s local storage and is separate from normal practice best scores. A local Daily Streak stores only the completed local date plus current/longest consecutive counts; repeat solves on the same date cannot increase it. Confirm `/games/circuit-shift?daily=1` and `/games/circuit-shift?daily=1&demo=1` after Hostinger upload; the latter is a visual QA route only, keeps game sound disabled until a visible player action enables it, and does not write a streak.

## Circuit Shift local score summary

After a real solved practice or daily board, Circuit Shift can create a browser-local text summary with only the visible mode, difficulty or daily ID, score, moves, and daily streak. A compatible browser may open its native share sheet; otherwise the visitor can copy the plain text or download it. No share action calls a server or includes a player identity, local-storage keys, puzzle layout, browser history, or hidden game state. The deterministic `?demo` path intentionally never exposes a result-sharing control. During local development only, `?share-preview=1` displays a non-production sample panel for visual QA; the bundle excludes this route behavior in production.

## Logic Lab puzzle suite

Logic Lab exposes six direct, full-screen Games Bay routes: `/games/mini-sudoku`, `/games/tango`, `/games/queens`, `/games/patches`, `/games/zip`, and `/games/wend`. Legacy `/games/logic/:slug` links remain compatible. Their pure validators and authored test script are bundled with the frontend; they do not scrape LinkedIn, query a dictionary, fetch daily boards, send player input, or require an account.

Each route derives a reproducible visual orientation and Calm, Standard, or Dense presentation profile from the visitor device’s local date. Mini Sudoku, Tango, Queens, Patches, Zip, and Wend additionally select a genuine independently solver-checked bundled edition by that local date; each has its own completion key, Tango includes its edition-specific visible relation map, Queens includes its edition-specific connected region map, Patches includes its edition-specific clue-owned rectangle partition, and Wend includes its edition-specific target-word/path exact cover. The date is neither fetched nor transmitted. All six modules support pointer controls and focusable controls, a visible verified-next-move hint, reset action, and deterministic silent `?demo=1` visual QA state. The shared SOUND preference follows the visitor across all Games Bay routes in browser storage; optional Logic Lab MUSIC starts only from the visible user-controlled button, respecting autoplay policy. After upload, validate all six direct module routes and their `?demo=1` variants, then test all `?edition=tango-*`, `?edition=queens-*`, `?edition=patches-*`, and `?edition=wend-*` QA paths before treating the static bundle as ready.

The Games Bay route additionally renders a **Weekly Local Streak Calendar** and six-card **Personal Best** overview from existing `toolboxgalaxy:puzzle-completions` browser storage. They count only completed Mini Sudoku, Tango, Queens, Patches, Zip, and Wend authored-edition keys; the personal-card model additionally verifies each full edition ID exists in its bundled seven-field bank. Neither creates another storage record, sends a date to Hostinger, uses a clock service, or runs a background task. Personal cards show only completed editions out of seven plus current/longest valid local-date runs, never speed, score, account, or profile claims. The calendar’s `All fields`/individual-game and `Grid`/`Timeline` controls filter or rearrange only its derived day records in the current page session; they save no selection, view, completion, or preference. Both visual arrangements retain the same markers, metrics, range, scope, and share values. After at least one qualifying local completion, its explicit share card can invoke a browser-native share sheet, copy, or download a plain-text summary of only visible calendar range/scope/streak/day/field totals; it never emits completion keys, player identity, browser history, or puzzle layouts. Confirm empty personal cards and share-card suppression on a fresh browser, complete two genuine daily fields to confirm same-day aggregation plus each game’s card count, attempt an unknown/future key only in local QA to verify it does not change the card, switch Timeline by pointer and Grid by keyboard to confirm equivalent selected markers/metrics/share values, refresh `/games` to confirm Grid returns, use a game filter to confirm selected marker/metric/payload views and an empty prior-week message, verify keyboard activation for filters and a personal card plus prior-week/Today navigation, and ensure a `?demo=1` route does not light a day or expose a summary. Before upload run `npx tsx scripts/verify-weekly-logic-streak.ts`, `npx tsx scripts/verify-logic-personal-bests.ts`, `npx tsx scripts/verify-weekly-logic-share.ts`, and `CALENDAR_ONLY=1 npx tsx /home/ubuntu/games-bay-playtest.ts` alongside the existing puzzle checks.

## Future PHP APIs

When a tool genuinely needs server processing, expose it behind a single PHP API base such as `/api/v1/`. Keep the frontend request path in one environment-driven adapter instead of hard-coding endpoints in individual pages. The PHP endpoint should validate inputs, return consistent JSON errors, enforce file limits for uploads, and restrict cross-origin access to the production domain.

The contact form boundary and expected `/api/v1/contact` request/response shape are defined in [`API_CONTACT_CONTRACT.md`](./API_CONTACT_CONTRACT.md). The frontend remains in safe email-fallback mode until `VITE_CONTACT_ENDPOINT` is configured at build time.

The upload-ready PHP handoff archive lives outside this static project at `/home/ubuntu/hostinger-toolboxgalaxy-php-handoff.zip`. Copy its endpoint to `public_html/api/v1/contact.php`, copy and configure its secret config file outside `public_html` where the hosting layout allows it, then complete the HTTPS and origin tests described in its `INSTALL.md` before enabling the frontend endpoint variable.

## Before launch

The privacy and terms pages are initial product copy, not legal advice. Review them with the final analytics, advertising, form, file-upload, and retention configuration before publishing publicly.
## Final release-candidate QA

The static release candidate was checked through Home, Tools, Games Bay, Contact, Privacy, Terms, and the public fallback route at desktop and mobile breakpoints. The contact route now makes its delivery path explicit: until the optional same-origin Hostinger PHP endpoint is configured, a visitor-controlled `mailto:` relay opens their mail app with their current draft and does not save or automatically send it from Toolbox Galaxy. Privacy renders the same local-first facts as a readable evidence ledger; the tools catalogue retains only browser-run modules and category-bay readouts.

Before publication, repeat the documented `dist/` upload, test the live custom-domain routes directly, and decide whether to retain the email relay or configure the optional contact endpoint. The final candidate has no account, database, remote daily feed, analytics feature, or server requirement. The established `npm run check` (or `bun run check`), deterministic verifiers, public-route QA script, browser playtests, production build, `manifest.webmanifest`, `service-worker.js`, and `offline.html` checks passed in the development release gate.
## Daily tools Batch 1 QA

The Tool Foundry contains 29 browser-local modules after Batch 1. Business Days Calculator, Time Zone Meeting Planner, Timestamp Converter, Text Diff Checker, and Find / Replace Workspace remain static: they use no API key, provider, clock request, database, account, file upload, or server runtime. Business Days counts Monday–Friday only and does not model holidays. The Time Zone Planner relies on browser `Intl` zone support and should remain on HTTPS in the public deployment; it does not create calendar events or send invitations. Text Diff and Find / Replace process only the text held in the open tab.

Before uploading `dist/` to `public_html`, run `npx tsx scripts/verify-daily-tools.ts` and `npx tsx scripts/playtest-daily-tools.ts` as well as the established release gate. Manually spot-check all five direct tool URLs after deployment, including a reversed business range, a daylight-saving gap in New York, a malformed timestamp, a changed diff line, and an invalid regex. Confirm the Tools hub reports 29 local modules and the new routes remain visible in their correct category bays.

## Daily tools Batch 2 QA

Batch 2 raises the static Tool Foundry to 32 modules with Split Bill & Tip, Loan / EMI Estimate, and Work Shift Duration. It requires no Hostinger API, database, cron job, form endpoint, account, payment configuration, or environmental secret. The Loan / EMI view is a browser-only **estimate** for a manually entered fixed annual rate and term, not a loan application or offer. Its display-currency choice does not imply live exchange conversion. Work Shift is a duration helper, not a payroll or employment-compliance feature.

After the `dist/` upload, manually test all three routes: change group size/tip in Split Bill; verify a zero-rate and invalid-term path in Loan / EMI; and verify an overnight shift plus invalid break in Work Shift Duration. Check reset and copy feedback on each; inspect the mobile pages; and confirm the foundry telemetry reports 32 local modules. Continue to run `npx tsx scripts/verify-daily-tools.ts` and `npx tsx scripts/playtest-daily-tools.ts` with the regular release gate.

## Structured Data Tools Batch 3 QA

Batch 3 raises the static Tool Foundry to 34 modules with JSON ↔ CSV Converter and CSV Viewer & Cleaner. Both accept **pasted text only** and need no Hostinger file-upload handler, API, PHP endpoint, database, account, cron job, spreadsheet connection, or environment secret. Valid records remain in the current page state only. The viewer’s **Apply clean copy**, Copy, and Download controls are explicit browser actions; they do not change a source file or create a saved CSV. CSV previews render cells as text, and CSV exports prefix formula-looking cells so a spreadsheet receives text rather than a formula.

After uploading `dist/`, open `/tools/json-csv-converter` and `/tools/csv-viewer-cleaner` directly on the live custom domain. Paste a flat JSON array with a comma and a newline in a value; change direction and verify a quoted CSV cell becomes JSON; then test malformed JSON and duplicate CSV headers. In the cleaner, paste padded rows plus a blank row, switch each clean setting, use Apply clean copy, and confirm its bounded table preview, reset, copy, and download feedback. Inspect both routes on mobile, confirm the Tool Foundry and quick-open label report 34 local modules, and run `npx tsx scripts/verify-structured-data-tools.ts`, `npx tsx scripts/verify-daily-tools.ts`, and `npx tsx scripts/playtest-daily-tools.ts` with the established static release gate.

## Image Tools Batch 4 QA

Image Crop / Rotate / Convert raises the static Tool Foundry to 35 modules. It needs no Hostinger image-upload handler, PHP endpoint, API, database, storage bucket, secret, cron job, account, or image-processing service. The visitor explicitly selects a PNG, JPG, or WebP in browser memory; source pixels and generated canvas output remain local. The original file is not modified. Crop starts at the complete source and presets can discard edges only after a visitor selects one; PNG preserves transparency, while JPG fills transparent areas white.

After uploading `dist/`, open `/tools/image-crop-rotate-convert` on the live HTTPS custom domain. Choose a modest PNG/JPG/WebP, confirm the source dimensions, enter X/Y/width/height values, test Square/4:5/16:9 presets, rotate left/right, create a PNG and a JPG/WebP export, then check download and Reset edit. Test a GIF/SVG or other unsupported selection for the visible error state and inspect the route on mobile. Confirm the Tool Foundry and quick-open label show 35 modules. Run `npx tsx scripts/verify-image-transform.ts` and `npx tsx scripts/playtest-image-transform.ts` with all existing release checks before publication.

## Text Utilities Batch 5 QA

Line Sorter & De-duplicator raises the static Tool Foundry to 36 modules. It processes only pasted current-tab text and needs no Hostinger API, PHP endpoint, database, storage, account, secret, cron job, file handling, text-processing service, or server runtime. Copy and `.txt` download are explicit browser actions; Reset restores only the bundled example and choices in the open tab.

After uploading `dist/`, open `/tools/line-sorter-deduplicator` directly on the live HTTPS custom domain. Paste case variants, repeated lines, whitespace-padded lines, and blank rows. Test A→Z, Z→A, and Keep first-seen order; toggle duplicate removal, trim, blank retention, and case-sensitive matching; then verify counters, Copy, Download, Reset, oversized-input error, and mobile layout. Confirm the Tool Foundry and quick-open label show 36 modules. Run `npx tsx scripts/verify-line-tool.ts` and `npx tsx scripts/playtest-line-tool.ts` with the established full static release gate before publication.


## Image Tools Batch 6 QA

Image Metadata Remover raises the static Tool Foundry to 37 modules. It needs no Hostinger image-upload handler, PHP endpoint, API, database, storage bucket, account, secret, cron job, or server runtime. The visitor explicitly selects one PNG, JPG, or WebP through the browser; source bytes, decoded pixels, metadata, and output remain in current browser memory. The tool re-exports at native decoded dimensions through a fresh PNG canvas and does not claim to be a forensic metadata scanner. The original file is never modified.

After uploading `dist/`, open `/tools/image-metadata-remover` directly on the live HTTPS custom domain. Select a modest PNG/JPG/WebP, confirm its source type and native dimensions, use the visible clean re-export action, check the native-dimension output and named download, then press Reset. Test a GIF/SVG or other unsupported file for the visible type error and verify the route on mobile. Confirm the Tool Foundry and quick-open label show 37 modules. Run `npx tsx scripts/verify-image-metadata.ts` and `npx tsx scripts/playtest-image-metadata.ts` with the established complete static release gate before publication.
