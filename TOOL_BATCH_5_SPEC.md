# Text Utilities — Batch 5 Contract

## Scope and non-overlap

Batch 5 adds **Line Sorter & De-duplicator** at `/tools/line-sorter-deduplicator`, bringing the typed Tool Foundry to **36 verified browser-local modules**. It transforms one pasted list of lines using only explicit local choices: ordering, duplicate removal, edge trimming, blank-line retention, and duplicate-case matching.

| Existing tool | Its purpose | Batch 5 distinction |
| --- | --- | --- |
| Text Case Tool | Changes the casing and word form of a text value | Batch 5 preserves case/content unless the visitor selects trim, and only changes line order or removes matching lines |
| Text Diff Checker | Compares two text versions and shows additions/removals | Batch 5 processes one list and does not compare documents |
| Find / Replace Workspace | Replaces chosen literal or regular-expression matches | Batch 5 neither searches patterns nor substitutes content |
| CSV Viewer & Cleaner | Validates comma-delimited tables and cleans table cells/rows | Batch 5 treats content as line-oriented plain text, with no header/table semantics |
| JSON Station | Formats and validates JSON | Batch 5 does not parse, format, or validate structured data |

## Current-tab processing rules

The workspace accepts up to 250,000 characters and 20,000 lines. Line endings are normalized in memory. An empty input produces an empty local output; oversized input receives a visible error before a result is created.

| Setting | Default | Local behavior |
| --- | --- | --- |
| Sort order | A → Z | Sorts the retained lines alphabetically using normalized duplicate-match values; Z → A and Keep first-seen order are explicit alternatives |
| Remove repeated lines | On | Retains the first matching line before sorting and removes later matching lines |
| Trim line edges | On | Removes leading/trailing whitespace from every output line before blank and duplicate checks |
| Keep blank lines | Off | Removes blank/whitespace-only lines under the active trimming policy |
| Case-sensitive duplicates | Off | Treats `Signal` and `signal` as matching by default; the visitor may retain case-distinct lines explicitly |

Counters show input lines, repeated lines removed, blank lines removed, and output lines. Copy and named `.txt` download are visitor-triggered browser actions. Reset restores only the bundled example and options in the open workspace.

## Privacy and hosting boundary

The pasted text, settings, output, counters, clipboard result, and download blob remain in current page memory. The module does not upload, save a draft, edit another document, inspect a file, create a remote history, call a text-processing API, use an account, start a background task, or add browser storage. The static Vite output needs no Hostinger PHP, database, secret, cron job, or server runtime.

## Verification

Run `pnpm exec tsx scripts/verify-line-tool.ts` for registry uniqueness, default sort/de-dup/trim policy, original ordering, case-sensitive matching, blank retention, and input limits. Run `pnpm exec tsx scripts/playtest-line-tool.ts` for real Chromium direct-route, keyboard text input, pointer controls, copy/download/reset feedback, bound error, and unchanged storage/network state. Preserve the complete previous tool/game/calendar/share, browser, build, PWA, and current-log release gates.
