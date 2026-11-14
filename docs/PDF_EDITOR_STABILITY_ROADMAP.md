# PDF Editor — Stability-First Repair Plan

## Glyph-aware editing preparation — 14 November 2026

**Implemented (read-only foundation):** `client/src/lib/pdfGlyphMapping.ts` enumerates active-page PDF font resources, detects embedded and subset fonts, distinguishes standard-font candidates, and inspects bounded `ToUnicode` `bfchar` and simple `bfrange` mappings. The PDF Editor shows the diagnostic in its native-edit panel; the original PDF bytes are never modified by this inspection.

**Why not yet enable embedded-font replacement:** `ToUnicode` is primarily an extraction mapping from encoded character codes to UTF-16BE, not a guarantee that requested replacement glyphs are present or have compatible outlines, CIDs, widths and positioning. Even a reversible mapping needs code-space validation, `CIDToGIDMap`/embedded font coverage, descendant `W`/`DW` metrics, text matrix, line layout and independent render comparisons. Approximating missing glyphs would silently corrupt user text.

**Next implementation gates:** model validated glyph-code inventories and widths for a demonstrably safe PDF subset; use a tokenizer rather than line regex to identify encoded operands; retain original resources, metadata and unrelated content; guard unsupported fonts and signed PDFs; introduce deterministic fixtures and independent PDF.js render/extraction comparison before permitting native writes.

**Verification/deployment:** not run in this checkpoint.


## Zero-kerning TJ and reference safety — 14 November 2026

- Added a restricted parser for multi-segment `TJ` operands with printable literal/hex text chunks and **zero-only** numeric spacing entries. Nonzero numeric kerning, escaped literals, custom fonts and arbitrary operators still fail closed. Replacements reduce accepted zero-kerning arrays to one equivalent text segment without changing target position or font.
- Native stream replacement now checks all reachable PDF dictionaries/arrays/streams for references to the old stream across *all indirect objects*, with a capped traversal budget. The original registered stream is deleted only when it is unreferenced by any other object.
- This does not make editing arbitrary embedded-font PDFs safe: custom character encodings, subset glyph IDs, per-glyph ToUnicode tables, RTL shaping and layout reflow still require a dedicated glyph-aware engine.
- Verification remains pending, including TypeScript compile, synthetic fixtures, real PDF open/edit/save/reopen, font appearance and coordinates, whole-page text equality, memory/cancellation, encrypted/signed documents and browser UX. No deployment.


## Native text engine expansion — 14 November 2026

Implementation updates in `client/src/lib/pdfNativeTextEditing.ts`:
- Parse one unambiguous selected text run among at most 20 **independently positioned** `BT ... Tm ... Tj/TJ ... ET` objects in a single page stream, preserving all unrelated operators.
- Support literal string `(text) Tj`, printable hex `<HEX> Tj` and a **single-element** array `[(text)] TJ`/`[<HEX>] TJ`; reject kerning-number arrays and multi-element arrays.
- Normalize PDFName values rather than confusing slash-prefixed names with raw identifiers.
- Compare the *entire* extracted page text before/after replacement; reject if unrelated extracted content changes or source text occurs ambiguously.
- Keep original font resource and position. Reject any replacement exceeding original font-measured width. Multiple text objects need absolute identity-geometry `Tm`, and signed/permission-controlled PDFs are unsupported.

**Still pending:** TypeScript/build and PDF fixture execution, real visual baseline comparison, font subset mappings, Unicode support, PDF text operator tokenizer supporting escaped literals and `TJ` kerning, multiple content streams, general transformation matrices, and paragraph reflow. No user-facing claims of general native editing or deployment readiness.


## Prototype checkpoint — Native single-run editing (13 November 2026)

The first native editing path is in `client/src/lib/pdfNativeTextEditing.ts`. It uses pdf-lib's low-level page content stream objects and PDF.js before/after text extraction, not whiteout masking.

### Supported source subset
- Single, unshared page content stream (plain or one FlateDecode filter) with exactly one simple `BT ... (text) Tj ... ET` text run, supported positioning/color operators and standard Type1 font.
- Printable ASCII text with no PDF escaped literal operands; same or shorter rendered width; no rotation, crop, page annotations, interactive forms or unsupported font encoding.
- Document size ≤12 MiB and decoded page stream ≤128 KiB; no unknown decompression parameters; browser must provide `DecompressionStream`.
- Reject on ambiguous source references, unexpected operators, unsupported glyphs or any PDF.js extracted-text mismatch. No overlay fallback when native editing is requested.

### Non-goals and known limits
Native editing is **not** guaranteed for normal PDFs with multiple `Tj/TJ` runs, subset/embedded fonts, graphics, Form XObjects, content-stream arrays, arbitrary transforms, clipping, kerning, long replacement requiring reflow or script shaping. Font appearance is retained by reusing the existing font resource and unchanged original position, with conservative width rejection. Page-text replacement is not a security redaction and does not guarantee the string is absent from unrelated metadata or attachments.

### Release blockers
TypeScript compile; synthetic PDF fixture passing; real single-run exported PDF round-trip; verify original content stream no longer serializes; inspect unchanged metadata and unaffected pages; verify Unicode and unsupported documents fail without mutations; browser memory testing; multi-stream / font-mapped engine and regression corpus. No tests or deployment executed in this checkpoint.


## Safety checkpoint — 13 November 2026

- Fail-fast WinAnsi fidelity: prevent the visual overlay exporter from silently changing unsupported Unicode, accents, currency and symbols; block a source-text overlay edit on Save if characters would be changed. This is a **temporary safety guard, not Unicode support**.
- Re-edits retain the true original-text provenance across multiple overlay modifications.
- Native AcroForm UI excludes editable and multiselect dropdowns and multiselect list boxes until their full value semantics can be preserved.
- Page duplicate and reorder are intentionally unavailable on documents containing interactive PDF form fields; lossless cross-page form/reference preservation is an unresolved feature gap.
- Next architecture milestone: evaluate true content-stream rewrite with embedded-font mapping, original glyph encoding, resource isolation, safe parser of content operators, and independent text/render comparison. Any unsupported encoding, scan, rotated glyph transformation or multiple-run match must be rejected rather than covered by whiteout while claiming native editing.
- Verification pending: build/typecheck, PDF.js UI, real PDF corpus and native form round trips.


## Phase 2 checkpoint — Native AcroForm editing (12 November 2026)

- **Implemented:** `client/src/lib/pdfNativeFormEditing.ts` now inspects existing AcroForm fields and applies true PDF field-value updates for text, checkbox, dropdown, radio and single-select list fields. It validates each saved value by reopening the resulting PDF and rejects failures without overwriting the source. Read-only/unsupported fields are preserved; multi-select lists are deliberately not rewritten by a single-value UI.
- **Implemented UI:** the PDF Editor displays an explicit **Native PDF Form Fields** panel when supported fields exist, with a separate Apply action. PDF byte updates enter document Undo/Redo history, and the existing page preview is invalidated on save.
- **Memory safety:** history retains at most 12 snapshots and prunes old PDF-buffer revisions above a 96 MiB unique buffer budget. Large PDFs can therefore have a shorter available Undo depth.
- **Truthful labeling:** ordinary page text editing is renamed to **Visual Text Replacement** and explicitly says the old PDF content remains. AcroForm editing is real underlying field editing; **this does not solve native paragraph/page text editing**.
- **Not validated:** no TypeScript/build execution, browser tests, real-form PDFs, signature preservation, accessibility or deployment. Existing signed PDFs may be invalidated by modifications.


Updated: 12 November 2026
Branch: `feat/browser-ai-background-remover`

## Product goal
Move from visual annotation/cover-and-replace toward a reliable PDF editing application without silently damaging original PDF content. **Do not claim native text editing until the original PDF text content is truly rewritten and export is validated.** Avoid copying proprietary competitor code.

## Source-confirmed architectural gap (P0)
`client/src/components/PdfEditorTool.tsx` models edited original text as `InPlaceEditAnnotation`, then draws a background rectangle and a new text run using pdf-lib. The original stream persists. This is **not** an edit to the source text. Font detection in `pdfFontDetector.ts` maps diverse fonts to standard Helvetica/Times/Courier families; `sanitizeWinAnsiText` is lossy for non-Latin scripts.

## Phase 1: Data-integrity implementation (unverified candidate)
- Complete editor snapshots now include current PDF bytes/page state and typed-array-safe annotations, so page deletion/insertion/duplication/reorder have Undo/Redo anchors.
- Page duplication copies pending annotations onto the new page and remaps later pages.
- Reopening an already edited overlay preserves it until Save, allowing Cancel without discarding the previous replacement; virtual edit blocks are rendered and kept when switching to Smart Edit.
- Superseded text extraction cannot overwrite the active document/page, PDF.js extraction documents and redaction export sessions are destroyed, and drag/resize history snapshots happen before movement.
- The current implementation has **not** been typechecked, manually exercised, visually compared or deployed in this work batch.

## Phase 2: Genuine existing-text modification (not implemented)
1. Model PDF text operators, glyph runs, encodings, font subsets, transforms, resource dictionaries, clipping and text-position operations. Record stable source references rather than approximate concatenated text blocks.
2. Support safe in-stream replacements for a constrained, proven subset of born-digital PDFs. Embed licensed compatible Unicode fonts, preserve untouched content and exact page geometry, and validate extraction after saving.
3. For unsupported PDFs (scans, outlines, unsupported encodings, heavily transformed text), clearly announce limitations or offer a separate labeled visual cover-and-add mode. Do not silently fall back and still call it native editing.
4. Handle empty replacement, whitespace, multiline text, RTL/complex scripts, kerning, ligatures, multi-column pages and copy/search/accessibility semantics.
5. Prove old replaced text is absent from the resulting logical PDF where true replacement was claimed.

## Phase 3: Feature reliability (not implemented)
- Reliable existing AcroForm field editing, links and annotations; independent page object identities and complete history.
- Text-aware highlighting and deletion; find/replace; accurate page crop/rotation transforms and consistent editing coordinates.
- Full pointer/touch/pen interactions, selection, drag/resize cancellation, and keyboard focus isolation.
- Explicit distinctions between visual signatures and cryptographically signed PDFs.
- Reject unexpected images/MIME formats before embedding; use safe object URL/bitmap lifecycle.
- Remove unnecessary per-page reparsing and batch processing on larger PDFs.

## Phase 4: Export fidelity and security gates (pending)
- Construct a corpus: standard text PDF, multiline, right-to-left, Hindi, CJK, embedded/subset fonts, scanned, mixed orientation, cropped/rotated, transparency, forms, clickable links, PDF/A, encrypted/signed, malformed, large, and annotation-heavy documents.
- For each supported edit: save/reopen; compare extracted text, unaffected content, bounding boxes, fonts, page order, links and form fields. Compare rendered outputs by pixel difference plus independent visual inspection.
- For redactions: assert prohibited text/images/metadata/attachments are absent from all retained objects, not only invisible behind masks. Rasterization alone is not a universal security guarantee.
- Measure peak memory, time and cancellation behavior during long sessions; ensure no orphan workers, URLs or bitmap backing.
- Require TypeScript/build, deterministic engine checks, browser workflow tests, real PDF open/save/reopen tests and user acceptance before release.

## Stop conditions
No claim of Sejda-equivalent native editing, multilingual accuracy, 100% security, or universal browser compatibility until each relevant gate has supporting evidence. No deployment performed in this batch.
