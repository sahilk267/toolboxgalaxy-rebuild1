# Advanced QR Generator — Release Evidence & Manual Gates

**Feature branch:** feat/advanced-qr-generator
**Review PR:** https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/18
**Target:** feat/browser-ai-background-remover (user-reported production deployment)
**State (11 November 2026):** PR #18 merged into `feat/browser-ai-background-remover` at commit `d529e0ba4961`; live hosting deployment not independently verified. User-requested joint manual/device QA is pending.

## Implemented
- Preserves /tools/qr-code-generator, the original URL input, 320px styling, and PNG filename.
- Payloads: text/URL, Wi-Fi, vCard 3.0, email, SMS, telephone. Input validated; QR content capped at 1500 UTF-8 bytes.
- Foreground/background colors with at least 4.5:1 contrast; 160–1200px size, 2–8 quiet-zone modules; L/M/Q/H error correction.
- Optional PNG/JPEG/WebP center logo limited to 2 MiB and 4 MP; H error correction forced. SVG download disabled when logo selected (do not silently omit artwork).
- Real PNG and SVG exports, optional browser-native BarcodeDetector comparison when supported. Scanning result is not a guarantee of success across phones.
- No image/network uploads, QR tracking, QR redirects, new package dependencies, or storage of QR contents. Uses the existing qrcode npm library.

## Automated evidence
- npm run check includes scripts/verify-advanced-qr.ts, which imports actual production payload validation and QR encoders.
- npm run verify:qr runs focused tests.
- .github/workflows/advanced-qr-browser.yml runs Chromium against the production build: QR route, real downloaded PNG/SVG, 512px output, Wi-Fi input, weak color contrast, branded PNG, H correction, SVG restrictions and reset.
- Initial CI https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42839598651 passed: 76 QR assertions, 153 earlier everyday assertions and production build.
- Initial browser QA https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42839598924 passed: 25 Chromium UI/export assertions.
- Final PR-head checks passed: CI https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42840350864 (80 QR regression assertions); QR Chromium https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42840350865; everyday tools Chromium https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42840350824. The parent PR is now merged.

## Manual release approval gates
1. Scan static QR codes on physical iOS and Android devices for URL, test Wi-Fi, vCard, email and SMS.
2. Scan printed QR codes (with and without logo) at reasonable print size and quiet-zone margins.
3. Test Safari/iOS logo composition, exported PNG and SVG in current browsers.
4. Confirm with browser Network tab that no selected passwords, contact info, logos or QR payloads are uploaded.
5. Check accessibility, keyboard interaction, reset and performance on low-memory phones.

Do not advertise static codes as editable/dynamic, or browser decode as a universal scan guarantee.
