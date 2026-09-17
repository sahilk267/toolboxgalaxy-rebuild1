# Image Tools — Batch 4 Contract

## Scope and non-overlap

Batch 4 adds **Image Crop / Rotate / Convert** at `/tools/image-crop-rotate-convert`, bringing the typed Tool Foundry to **35 verified browser-local modules**. It is a general-purpose, visitor-directed still-image editor: the visitor chooses one source image, can explicitly define a source-pixel crop window, rotate it in 90° steps, and download a newly rendered PNG, JPG, or WebP copy.

| Existing module | Its purpose | Batch 4 distinction |
| --- | --- | --- |
| Image Resizer | Changes a whole image’s dimensions with no crop | Batch 4 preserves the source’s original dimensions except for a visitor-selected crop and right-angle rotation |
| Favicon Generator | Center-crops one image to predefined square PNG icon sizes | Batch 4 offers a general source-pixel crop window, rectangular output, rotation, and PNG/JPG/WebP output |
| Image Metadata Remover | Not present | No EXIF or metadata-removal claim is made in this batch |

> Crop can discard edges, so the editor begins with the complete source frame and clearly states that crop presets discard edges only after a visitor chooses them.

## Local input and processing contract

The visitor selects one still PNG, JPG, or WebP file through the browser’s file picker. The module rejects unsupported types, including GIF/SVG, before decoding. It also rejects files larger than 20 MB, decoded sources over 8,192 pixels on either edge, and decoded sources over 20 million pixels. These limits support a responsive, bounded browser-canvas workflow; they are not upload limits because no upload occurs.

| Control | Local behavior |
| --- | --- |
| Crop window | Precise X/Y/width/height source-pixel fields clamp inside the decoded source; Full source is the default |
| Crop presets | Explicit center-framed Square, 4:5 portrait, and 16:9 landscape choices; they are never automatic |
| Rotation | Left or right 90° increments, with the output dimensions swapped for 90°/270° |
| Formats | PNG preserves transparency; JPG fills transparent canvas areas white; WebP uses browser-supported lossy encoding |
| Quality | 40–100 control applies to JPG/WebP only; PNG has no lossy quality setting |
| Output | Create local export renders to an in-memory canvas/blob; Download is a visitor-triggered browser download |

The tool renders a decoded source preview and output preview only after the visitor picks a file or requests an export. Reset edit restores the original full-source frame and export defaults for the selected source; it does not write a saved edit or alter the underlying file.

## Privacy and static-hosting boundary

The source `File`, object URLs, canvas pixels, and generated blob stay in current React/browser memory. Object URLs are revoked when a source or output is superseded and when the workspace unmounts. There is no account, upload endpoint, API, server route, cloud processing, analytics payload, browser storage entry for image pixels or crop settings, background task, or file retention. The static Vite output needs no Hostinger PHP, secret, database, cron job, or special hosting configuration.

The tested browser flow uses a visitor-selected local PNG, changes crop X/Y/width/height with real input events, rotates right 90°, selects JPG/quality, creates a 60×80 local output from an 80×60 crop, downloads it, resets, and validates an unsupported-file error without adding a `localStorage` record.

## Verification

Run `pnpm exec tsx scripts/verify-image-transform.ts` for pure crop clamping, rotation dimensions, format extensions, source limits, unsupported-type handling, and 35-entry registry uniqueness. Run `pnpm exec tsx scripts/playtest-image-transform.ts` for real Chromium direct-route, local file selection, keyboard/pointer controls, canvas export geometry, download, reset, invalid-file, and no-persistence coverage. The complete release gate also retains all earlier deterministic tool/game/calendar/share suites, browser regression modes, static Vite build, PWA asset check, and current-log review.
