# Enterprise PDF Suite: Zero-Duplication Implementation Plan

## 1. Architectural Baseline & Existing Assets

To prevent code duplication, naming collisions, or regression across existing tools:
- **Core PDF Engines Already In Place**:
  - `client/src/components/PdfEditorTool.tsx`: Canvas rendering (`pdfjs-dist`), live annotations (text, whiteout, draw, stamp), permanent rasterization (`replacePageWithRasterImage`), live Bates numbering preview, deep metadata purge, SHA-256 audit certificate.
  - `client/src/components/PdfToolsRunner.tsx`: Multi-file `PdfMergeSplitTool` and batch `ImagesToPdfTool`.
  - `client/src/lib/enterprisePdf.ts`: WebCrypto SHA-256 digests, catalog metadata stripper, Bates calculation matrix, AcroForm summary & flattener, QR audit sheet generator.
  - `client/src/lib/pdfRedaction.ts`: Canvas rasterization utilities.
  - Existing dependencies: `pdf-lib` (v1.17.1), `pdfjs-dist` (v6.3.289), `xlsx` (v0.18.5), `mammoth` (v1.12.2), `qrcode` (v1.5.4).
- **Core Architecture Constraint**: All operations execute strictly in ephemeral client-side browser memory (zero server uploads, zero privacy leakage).

---

## 2. Implementation Phases

```
+----------------------------------------------------------------------------------+
|                              IMPLEMENTATION ROADMAP                               |
+--------------------------+----------------------------+--------------------------+
| PHASE 1: PAGE MGMT       | PHASE 2: RICH ANNOTATIONS  | PHASE 3: CONVERTERS &    |
| - Thumbnail Strip        | - Image / Logo Placement   |   EXTRACTION             |
| - Drag-and-Drop Reorder  | - Clickable URI Links      | - PDF to Plain Text      |
| - Insert Blank Page      | - Native Text Highlighter  | - PDF to DOCX Reflow     |
| - Batch Page Rotation    | - Freehand Shape Presets   | - PDF to XLSX Table Grids|
+--------------------------+----------------------------+--------------------------+
| PHASE 4: TESSERACT WASM OCR                           | PHASE 5: VERIFICATION   |
| - Dedicated WebWorker Pipeline                        | - Regression Tests       |
| - Page-by-Page Progress Telemetry                     | - Memory Leak Audit      |
| - Searchable Invisible Text Layer Embedding           | - Lint & Production Build|
+-------------------------------------------------------+--------------------------+
```

---

### Phase 1: Document Management (Page Organization & Thumbnail Strip)
*Target File*: `client/src/components/PdfEditorTool.tsx`

1. **Thumbnail Strip & Reorder Component**:
   - Render a collapsible bottom/left thumbnail carousel using `pdfjs-dist` low-resolution page viewports.
   - Support intra-document drag-and-drop page reordering using standard HTML5 drag events or lightweight pointer tracking.
   - Array state mutation: `pageOrder = [0, 1, 2, ...]` to dynamically remap `pdfDoc.copyPages()` on export.
2. **Page Insertion & Deletion**:
   - Add explicit "Insert Blank Page (A4)" button: `doc.insertPage(targetIndex, [595.28, 841.89])`.
   - Add "Duplicate Page" and "Delete Page" triggers directly from each thumbnail card.
3. **Batch Rotation Controls**:
   - Allow rotating all pages or odd/even pages at once (0°, 90°, 180°, 270°).

---

### Phase 2: Rich Annotations & Interactive Overlays
*Target Files*: `client/src/components/PdfEditorTool.tsx`, `client/src/lib/enterprisePdf.ts`

1. **Image & Logo Placement Tool (`image` annotation type)**:
   - Add file picker to insert company logos, initials, or verification seals directly onto the canvas overlay.
   - Support dragging, scaling, and opacity controls.
   - Export pipeline: Embed via `doc.embedPng(imageBytes)` or `doc.embedJpg(imageBytes)` and draw at calculated coordinates.
2. **Clickable Hyperlink Annotation (`link` annotation type)**:
   - Place a bounding box on the canvas associated with a target URI (e.g. `https://company.com/verify`).
   - Export pipeline: Add low-level PDF Link Annotation dictionary (`/Type /Annot /Subtype /Link /Rect [...] /A << /S /URI /URI (...) >>`).
3. **True Text Highlight & Underline Primitives**:
   - Dedicated highlighter with translucent blend-mode overlay (`rgba(250, 204, 21, 0.4)`).
   - Draws vector rectangle with semi-transparent opacity to ensure underlying text remains legible.

---

### Phase 3: Client-Side Layout & Table Extraction (PDF to Text / DOCX / XLSX)
*Target Files*: `client/src/lib/pdfExtraction.ts` (NEW), `client/src/components/PdfToolsRunner.tsx`

1. **PDF to Clean Text (`.txt`)**:
   - Iterate over pages using `page.getTextContent()`.
   - Reconstruct reading order using vertical coordinates ($y$) and horizontal offsets ($x$).
   - Provide one-click copy and `.txt` file download.
2. **PDF to Word (`.docx`) Structured Reflow**:
   - Group text items into paragraphs by analyzing baseline proximity and font sizing differences (headings vs body).
   - Map font weights (`bold`, `italic`) based on font name descriptors.
   - Generate formatted `.docx` file entirely in browser using existing Word generation pipelines.
3. **PDF to Excel (`.xlsx`) Tabular Extraction**:
   - Coordinate-based tabular clustering: Group text fragments sharing horizontal baselines into rows and vertical alignment channels into columns.
   - Clean empty cells and export directly via installed `xlsx` library (`XLSX.utils.aoa_to_sheet` -> `.xlsx` download).

---

### Phase 4: Client-Side WebWorker OCR (Tesseract WASM)
*Target Files*: `client/public/workers/ocr-worker.js` (NEW), `client/src/lib/pdfOcr.ts` (NEW)

1. **WebWorker Architecture**:
   - Offload `tesseract.js` worker so OCR processing never blocks the 60fps React main UI thread.
   - Dynamically load trained language data with cached IndexedDB storage to avoid re-downloading.
2. **Progress & Page Chunking**:
   - Provide real-time page progress telemetry (e.g. "Processing Page 2 of 5: 68% recognized").
3. **Searchable PDF Injection**:
   - Inject recognized character bounding boxes as an invisible text layer (opacity 0, text rendering mode 3) positioned over the page raster image, making scanned PDFs fully selectable and searchable.

---

### Phase 5: Verification & Safety Guardrails

1. **Memory & Blob Lifecycle**:
   - Revoke all `URL.createObjectURL` references to prevent browser memory leaks on multi-page operations.
2. **Deterministic Checksum Integrity**:
   - Verify that all transformation steps update the SHA-256 Audit Trail and Action Ledger.
3. **Lint & Build Gates**:
   - Run `npm run lint` and `npm run build` after each phase. Zero warnings, zero TypeScript errors.
