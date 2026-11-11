# Next Priority Batch — Ten Existing Tools

**Branch:** feat/advanced-remaining-everyday-dev-tools
**PR:** https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/20
**Target:** feat/browser-ai-background-remover (the user's working/deployed branch)
**Status:** Implementation complete, automated CI/Chromium required on final head before ready-for-review. PR not merged; no manual/mobile/hosting QA performed. No changes to main, games or hosting.

## Scope
All original tool slugs, catalog identities and default demo values are preserved.

| Existing tool | Original default | Added behavior |
| --- | --- | --- |
| Discount Calculator | USD 89.99, 20% | Sequential second discount, post-discount tax/GST, currency, reverse price calculation, savings explanation |
| Loan / EMI Estimate | INR 500000, 9%, 60 months | Per-month amortization, extra monthly/lump payments, interest/term savings, alternative-rate comparison, CSV |
| Business Days Calculator | 24–28 Aug 2026, 5 business days | Customized weekend rules, 300 manually entered holiday dates, **selected fixed-date examples only**, working-day shift |
| Time Zone Meeting Planner | Kolkata → New York, 24 Aug 2026, 9AM | Up to six IANA time zones, daylight-saving gap rejection and repeated-hour warning |
| Color Signal | #C7F36B | RGB/HSL/HSV values, WCAG relative contrast, complementary/analogous palettes, tints |
| Gradient Forge | 125° #C7F36B → #6FD5FF | Linear/radial, 2–6 stops, presets, safe CSS, standalone HTML download |
| Text Case Tool | Title case | Punctuation-preserving title/sentence, camel, Pascal, snake, kebab, constant, alternating, Unicode |
| Base64 Workbench | Encode Hello, Galaxy. | Strict UTF-8/Base64, Base64URL, 2MB local binary file encoding/download, canonical decode guards |
| UUID Generator | Single v4 random UUID | Cryptographic v7 time-based UUID, 1–500 batch, validator, TXT export |
| Basic Calculator | 12 ÷ 3 = 4 | Safe non-executing expression parser, math functions, precedence, session-only history, keyboard Enter |

## Safety and explicit limitations
- Finance calculators are estimates, not lender-specific, tax/legal or investment advice. Fixed interest with monthly payments, and extra payment applied after scheduled EMI. Reverse discount uses tax-inclusive final known price.
- Holiday country presets are explicitly *partial fixed-date examples*, **not government holiday feeds** and no substitute/observed holiday inference is claimed. Enter real bank/state holidays manually. Untrusted holiday dates and long ranges are bounded.
- Time-zone conversion uses Intl browser's built-in database. DST "fold" hours can occur twice; tool warns instead of promising which event occurrence the user meant. "Gap" hours that do not occur are rejected. Time-zone rules can change in the future.
- Color contrast analysis isn't an accessibility audit of an entire page; exported gradients accept only strict HEX and numeric positions (no arbitrary injected CSS).
- Base64 is reversible encoding and not encryption; file operations stay local and bounded.
- UUIDv7 contains timestamp and cryptographic random bits, but generation is not a monotonic ordering guarantee.
- Calculator parser supports whitelisted operators and functions. Never eval, Function, or executing user-supplied JavaScript.
- Existing games were not modified: "gameplay improvements" is a separate unscoped roadmap item. A concrete bug or focused game selection should precede gameplay changes.
- Existing main vs deployed-branch divergence is unchanged to avoid silently losing existing game/Excel fixes.

## Automated quality gates
- npm ci, npm run check, npm run build on full CI.
- scripts/verify-next-priority-tools.ts exercises real imported engines, unsafe inputs and legacy defaults.
- scripts/verify-next-priority-browser.mjs uses Chromium to navigate all ten original slugs, exercise inputs and actual CSV/HTML/TXT downloads.
- Existing QR and Advanced Everyday Chromium workflows also run on PRs to the deployed branch.
- Automated checks do not certify mobile Safari/Firefox/real devices, production hosting or exhaustive games.

## Manual release follow-up (separate, later)
After automated checks succeed, test all ten tools on one staging/release build alongside existing eight advanced tools. On approval, merge PR #20 to deployed branch, then verify live deployment separately. Do not merge main or make Hostinger changes under this task.
