# Browser AI Background Remover — Release & Evidence Ledger

Status: **feature branch / partial browser QA** (10 November 2026). Do not claim device-browser certification or merge merely because TypeScript/build passes.

## Scope
- Adds Tool #62 candidate at `/tools/background-remover`.
- Browsers process one JPG/PNG/WebP locally. Strict 10 MiB, 8 MP, 8192 px edge limits.
- AI inference analyzes an image at <= 1024 px long edge, then composites the AI alpha matte onto the original source pixels (up to 8 MP).
- Output: transparent PNG; white, black, and custom solid background PNGs; accessible comparison slider; cancel and retry; no photo transmitted to a remote inference service.
- Heavy runtime loads through a separate web worker when the visitor presses the action.
- Model and ONNX WASM runtime files must be provisioned during build from pinned upstream references. Model file bytes are not committed to git.

## Third-party provenance
- Runtime: `@huggingface/transformers@3.8.1` — Apache-2.0, https://github.com/huggingface/transformers.js
- Model: `onnx-community/ormbg-ONNX` — Apache-2.0 per published model card, pinned to revision `034e2d884afbab897e10e78fc5bb566b29533fd6`, https://huggingface.co/onnx-community/ormbg-ONNX
- ONNX WASM files: distributed with the installed `onnxruntime-web` npm dependency; verify transitive licenses / NOTICE files before release.
- `scripts/prepare-background-model.ts` downloads pinned assets and creates an observed SHA256 manifest. An independently reviewed expected SHA256 of model weights is still recommended before production approval.
- **Do not** silently substitute BRIA RMBG-2.0 or AGPL libraries.

## Performance & operational boundaries
- First visit downloads roughly 44 MB of quantized model weights plus runtime; downstream browser cache may reuse those assets. This is not a mobile speed guarantee.
- The build needs external network access to download model weights. If Hostinger deployment cannot run npm prebuild, build in CI and deploy the generated dist assets.
- Service worker deliberately bypasses AI runtime and model requests to avoid double caching; Transformers.js may use the browser Cache API for model assets.
- Model output is approximate: fine hair, glass, pets and complex backgrounds may yield poor cutouts.
- No fallback is advertised if model loading or inference fails; show explicit error and retry.

## Automated gates
- `npm ci`: pinned npm dependency and regenerated lockfile.
- `npm run verify:background`: twenty deterministic tests against production validators.
- `npm run check`: full suite including the new regression test.
- `npm run build`: verifies Vite worker bundling and same-origin asset provisioning.

## Browser/device release gates — PARTIALLY VERIFIED
1. Chrome, Firefox, Safari, Android Chrome and iOS Safari: real image upload, model load, output, cancel/retry.
2. Reopen actual PNG and inspect nontrivial alpha pixels; verify white/black/custom compositions.
3. Check front-facing portrait, product, pet and busy background with consent-cleared fixtures.
4. Measure cold-start (including download), warm inference time, peak memory, and repeated processing.
5. Validate no remote photo requests using browser Network tab, and correctly cache model files.
6. Verify release packaging serves `/models/onnx-community/ormbg-ONNX/{config.json,preprocessor_config.json,onnx/model_uint8.onnx}` and `/ai-runtime/` assets with correct MIME/Cache-Control.
7. Run checks on actual Hostinger deployment, including byte-range/large asset delivery and CDN behavior.

Only mark Tool #62 Verified after the above evidence is recorded and approval is explicit.

## Verified PR evidence
- PR #15: https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/15 (draft; not merged)
- Main CI run #42714460236 passed `npm ci`, `npm run check`, `npm run build`.
- Chromium smoke run #42715470051 passed: localhost browser upload, AI inference, genuine PNG download, original output dimensions and opaque solid-color export. A stricter alpha segmentation assertion is being added in follow-up CI.
- Remaining: Safari, Android, iOS, performance profiling, authentic photo quality and production Hostinger deployment.
- License copies and model/runtime attribution are published under `/licenses/`.
