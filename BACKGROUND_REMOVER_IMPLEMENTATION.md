# AI Background Remover — licensing, build, QA

Status: **new feature branch; not production-certified until browser E2E passes**.

## Licensed dependencies

- Browser runtime: `@huggingface/transformers` **3.8.1**, Apache-2.0.
  Upstream: https://github.com/huggingface/transformers.js
- Inference engine: `onnxruntime-web` (transitive, version matched to Transformers.js), MIT.
  Upstream: https://github.com/microsoft/onnxruntime
- Segmentation model: `onnx-community/ormbg-ONNX`, Apache-2.0.
  Upstream: https://huggingface.co/onnx-community/ormbg-ONNX
  Origin: https://huggingface.co/schirrmacher/ormbg
  Pinned revision: `034e2d884afbab897e10e78fc5bb566b29533fd6`
  Weight: `onnx/model_uint8.onnx`
  Pinned SHA256: `ffbcae62a7b675d616e64cb392ee028786c4cf74f83596590fba13733ef00171`.
- Apache-2.0 text: https://www.apache.org/licenses/LICENSE-2.0
- MIT license: https://opensource.org/license/mit

The build script downloads revision-pinned, checksum-verified model weights, copies version-matched runtime assets from local npm dependencies and publishes them under `/models/`. Generated multi-megabyte assets are gitignored. **Runtime makes no request to Hugging Face or any remote image-processing API**; the app code and model assets must be served from the Toolbox Galaxy domain. A deployment pipeline without model downloads enabled must upload the prebuilt `dist` output instead.

## Supported workflow

1. Upload one valid JPEG, PNG or WebP (10 MB and 8 MP limits).
2. Process in a dedicated browser worker (WebAssembly, uint8 model).
3. Preview transparent output and choose a solid background if desired.
4. Export a verified PNG, with AI output limited to 1,280 px along its longest edge.
5. Reset, cancel or close: active inference worker is terminated; temporary object URLs are revoked.

Model downloads and memory allocations can be significant; no guaranteed execution time. No signup, photos sent to servers, or local file retention by the tool. Browser Cache API may retain model/runtime assets.

## Local setup and verification

```bash
npm ci
npm run prepare:bg-model
npm run verify:bg
npm run check
npm run build
```

CI must run clean `npm ci` with matching package-lock.json, then TypeScript, existing regressions and production build.

### Required browser sign-off before merge

- Actual background removal of portrait, product, pet (not just synthetic tests)
- Output opens as genuine alpha PNG with transparent corners
- Input type validation for spoofed MIME and corrupted bytes
- Worker cancellation and repeated use/new file behavior
- Cache hit on repeat visit, first-use network failure path, offline cached revisit
- Desktop Chrome/Firefox/Safari, Android Chrome and iOS Safari behavior
- Memory/CPU, first-load model download, file download and touch layout
- CSP and ONNX WASM same-origin MIME loading on Hostinger
- Review Apache-2.0 and MIT redistribution/NOTICE obligations with the production artifact

Until completed, catalog addition is a **draft functionality under test**; passing CLI validation alone does not mean feature production ready.

## Confirmed Chromium proof (10 Nov 2026)

- GitHub Actions Chromium smoke: [Run 42716930151](https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42716930151) **SUCCESS**.
- Genuine portrait (360 × 450): model inference, transparent PNG download, inspected PNG alpha min=0.
- Corrupt-image rejection, same-origin AI asset requests, white-background opaque PNG export, and UI reset were exercised successfully.
- This confirms a **headless Linux Chromium smoke only**, not cross-browser, touch, accessibility, performance, or production-Hostinger certification. Feature PR #16 remains draft until remaining evidence is collected.
