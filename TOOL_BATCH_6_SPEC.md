# Image Tools — Batch 6 Contract

## Scope and non-overlap

Batch 6 adds **Image Metadata Remover** at `/tools/image-metadata-remover`, bringing the typed Tool Foundry to **37 verified browser-local modules**. It creates a clean native-dimension re-export of one visitor-selected still image. The module is intentionally re-export-only: it does not crop, rotate, resize, or offer a format conversion control.

| Existing module | Its purpose | Batch 6 distinction |
| --- | --- | --- |
| Image Resizer | Resizes the complete source image | Batch 6 keeps the source raster dimensions unchanged |
| Image Crop / Rotate / Convert | Explicit crop window, right-angle rotation, and output format choices | Batch 6 provides no crop, rotation, resizing, or conversion controls |
| Favicon Generator | Fixed square icon crop and predefined icon outputs | Batch 6 preserves the source aspect ratio and native dimensions |

> The clean output is a new browser-generated canvas file. The tool makes a careful re-export claim: common embedded metadata is not carried into the new canvas output, but this route is not a forensic metadata scanner or a guarantee about every format-specific chunk.

## Local input and re-export rules

The visitor selects one PNG, JPG, or WebP through the browser file picker. The tool rejects unsupported file types before decode, files above 20 MB, decoded sources above 8,192 pixels on either edge, and decoded sources above 20 million pixels. These are bounded browser-workload limits, not upload limits.

The output uses the source’s native decoded width and height. It is rendered onto a fresh canvas at that same size and exported as a PNG by default. No output quality, crop, rotation, resize, or format selector is exposed. Transparent pixels remain transparent in PNG output. A visitor may explicitly download the generated clean output; the original selected file is never changed.

| State | Visitor-visible behavior |
| --- | --- |
| No source selected | Shows a clear choose-image state and local processing explanation |
| Supported source selected | Shows source type, native pixel dimensions, bounded size, and a clean-output action |
| Output created | Shows output dimensions/format and explicit download control |
| Unsupported/oversized/decode failure | Shows a specific local error and keeps the workspace usable |
| Reset | Releases current object URLs and returns to the empty chooser state |

## Privacy and static-hosting boundary

The selected `File`, source object URL, decoded image, canvas pixels, and output blob remain in current browser memory. Object URLs are revoked when replaced, reset, or unmounted. No image bytes, metadata, filename, crop state, or output enters local storage, a network request, an account, an API, a server route, a background job, or a remote image service. The static Vite output needs no Hostinger PHP endpoint, database, secret, storage bucket, or runtime process.

## Verification

Run `pnpm exec tsx scripts/verify-image-metadata.ts` for the pure bounds, native-dimension, supported-type, output-format, and 37-entry uniqueness contract. Run `pnpm exec tsx scripts/playtest-image-metadata.ts` for real Chromium direct routing, local file selection, native clean re-export, pointer download, keyboard clear, unsupported-file handling, and unchanged storage/network state. Preserve all previous tool, image, puzzle, calendar, share, public-route, static build, PWA, and current-log release gates.

## Honest limitation

Canvas re-export is a practical privacy-preserving cleanup path for common raster metadata, not a complete metadata audit. Visitors requiring a forensic guarantee should use a dedicated offline metadata inspection/removal application that documents format-by-format coverage.

> No image is uploaded by this module.

## References

This contract describes the implemented browser behavior and does not rely on a remote service or external data source.
