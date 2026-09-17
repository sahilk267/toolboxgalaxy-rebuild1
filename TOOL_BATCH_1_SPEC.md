# Daily Tools Batch 1 — Local Contract

This batch adds five **distinct** browser-local utilities to the existing tool foundry. It intentionally does not overlap the basic calculator, calendar-date difference, text statistics, URL/HTML/Base64 transforms, or text-case tool. Each runner derives output from the current visible form state only; it stores no input, calls no API, and makes no provider, account, or live-data claim.

| Module | Distinct contract | Inputs | Outputs | Explicit exclusions |
| --- | --- | --- | --- | --- |
| Business Days Calculator | Counts weekdays in a range, unlike Date Difference’s plain elapsed calendar distance. | Start date, end date, include-end setting | Monday–Friday count and counted calendar days | Holidays, regional workweeks, remote calendar feeds |
| Time Zone Meeting Planner | Converts one scheduled local meeting slot across bundled browser time zones. | Local datetime, source zone, target zone | Source and target labelled local datetimes | Accounts, invitations, calendar sync, remote clocks |
| Timestamp Converter | Decodes whole Unix seconds or milliseconds. | Numeric timestamp and selected unit | ISO 8601, UTC, and browser-local representation | Time-zone planning, persisted history, network lookup |
| Text Diff Checker | Shows semantic line additions/removals between two visible texts. | Original and revised text | Added, removed, unchanged counts and line diff | Cloud comparison, document storage, semantic/AI rewriting |
| Find / Replace Workspace | Applies literal or explicit regex replacement to one visible text block. | Text, find pattern, replacement, options | Replaced text and replacement count | Background file mutation, stored drafts, server regex execution |

## Safety and quality boundary

All five modules have a pure deterministic engine in `client/src/lib/dailyToolEngines.ts`. The engine rejects invalid date ranges, nonexistent daylight-saving local times, unsafe timestamps, oversized diff work, and invalid regular expressions with a visible user-facing message. The Time Zone Planner relies only on the browser’s bundled `Intl` time-zone implementation; it is not a scheduling or calendar service. The Business Days Calculator explicitly counts Monday–Friday only and does not imply holiday awareness.

`scripts/verify-daily-tools.ts` proves engine behavior and registry uniqueness. `scripts/playtest-daily-tools.ts` uses real Chromium routes, pointer actions, keyboard entry, native date/datetime change events, reset, copy feedback, and error paths for all five workspaces. The registry must remain duplicate-free by **slug**, **display name**, and **runner kind**.

## References

[1] [MDN — File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API): selected local files can be processed by web applications without a server upload.

[2] [MDN — Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API): browser visual processing is available locally, with semantic HTML required for meaningful accessible content.

[3] [MDN — `getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia): camera and microphone access require HTTPS and explicit visitor permission.
