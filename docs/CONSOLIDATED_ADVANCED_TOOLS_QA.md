# Consolidated Advanced Tools Batch — Release & Manual QA

**Status (11 November 2026):** PR #18 and PR #19 were both merged into `feat/browser-ai-background-remover` on explicit user request. Automated head CI/Chromium passed; live deployment and joint iOS/Android/manual QA remain unverified.

- QR / parent PR #18: https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/18
- Favicon + password + JSON / PR #19: https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/19
- Current integrated branch for **one manual QA session**: feat/browser-ai-background-remover
- PR #18 merged at `d529e0ba4961`; PR #19 was retargeted and merged at `04957e1c49c5`. PR #17 had already merged. `main` remains unchanged.
- Tool count/slug registry **unchanged**. No new games or unrelated site features.

## Implemented upgrades
1. **QR Generator:** URL/text, Wi-Fi, vCard, SMS/email/phone, logo + color/error-correction controls, real PNG and SVG, scan check when supported. Static codes only.
2. **Favicon Generator:** Local PNG/JPEG/WebP source; crop/contain, background, true PNG-embedded multiframe ICO (16/32/48), 16/32/48/180/192/512 PNG exports, Apple/Android icons, site.webmanifest, HTML snippet and ZIP.
3. **Password Generator:** Keep original 18-character default, secure unbiased sampling, configurable character classes and length, 1–20 unique random-output attempts, length-first guidance, 6–12 random-word passphrases and safe copy controls.
4. **Password Strength Auditor:** Local length/pattern evaluation; does not claim to know breaches, reuse or cracking time. NIST-style longer, unique passwords emphasized.
5. **JSON Station:** Default formatting/minification preserved; add Unicode input, sorted object keys, inspectable tree, safe $ property/index paths, comparison, local file import and downloadable JSON. No JS evaluation.
6. **Percentage Calculator, Unit Converter, Text Statistics:** Upgrades from PR #17 are already merged into the deployed branch and are included in combined release QA.

## Automated checks (passed before merge)
- Full repo npm ci, npm run check (existing tools/games + extended pure regression) and npm run build.
- QR Chromium production build smoke: actual PNG/SVG, logo, ECC, input validation.
- Core Chromium production build smoke: real downloaded favicon ZIP/ICO assets, password/phrase generation, auditor, JSON formatting/path/compare/exports.
- Regression tests deliberately invoke production engines, not duplicated test-only implementations.
- No manual phone/device tests or live-hosting deployment verification has been performed. Branch merges may trigger external auto-deployment depending on hosting configuration.

## One-shot manual QA checklist for user (after coding)
1. On Android and iPhone, scan regular QR, Wi-Fi QR and QR with logo. Check offline QR generation and no uploaded data.
2. Upload real square and landscape icon photos; create favicon ZIP and inspect favicon.ico, Apple icons and webmanifest. Test browser-tab icon on a staging website.
3. Generate 18-character default password, 128-char password, 20-password batch and an 8-word passphrase. Copy and show/hide. Audit short/common/long passphrases. Do not enter any real login passwords for testing.
4. JSON: format/minify, sort keys, navigate arrays and quoted paths, compare added/removed/changed properties, import/export a local JSON file. Test invalid JSON and 250k-character input cap.
5. Percentage: part/total 18/120 = 15%, reverse discount and signed relative change.
6. Unit converter: 1 km to mile, 100°C to 212°F, US cup to millilitres, MB vs MiB.
7. Text statistics: English, Hindi/Unicode, CRLF paragraph breaks, word-frequency and TXT download.
8. AI Background Remover: known-good photo and transparent export. Check no regression from the tool-workspace imports.
9. Desktop Chromium/Firefox/Safari and phone tap/keyboard interactions; check actual mobile performance and downloads.
10. Look at browser console/network errors; test with limited memory or slow connection where practical.

## Completed merges and remaining release gates
A. DONE: PR #18 merged into feat/browser-ai-background-remover (`d529e0ba4961`).
B. DONE: PR #19 retargeted and merged into feat/browser-ai-background-remover (`04957e1c49c5`).
C. PENDING: Confirm whether hosting auto-deployed the updated branch; perform one combined phone/desktop/manual smoke after a staging or production build is available.
D. PENDING: Separately review PR #15 and synchronize the deployed branch with main when safe. Main is unchanged.

## Important limitations
- No universal phone QR scanning guarantee. QR logos impair robustness; print tests still needed.
- Password entropy is an *estimated random-choice* measure for secure generator outputs only, not a personal password strength measurement.
- Local auditor does not perform breach or reuse checks. Clipboard copies are visible to the operating system.
- PNG-compressed ICO frames are for modern browsers/Windows. Real old-browser support is not certified.
- JSON paths intentionally do not run expressions or arbitrary functions. Tree/diff views have safety limits.
- Passing headless Chromium or TypeScript does not equal full iPhone/Android/Safari/Firefox certification.
