import { tools } from "../client/src/data/toolRegistry";
import { cropWithinSource, formatExtension, imageFileError, imageTransformLimits, nextQuarterTurn, outputDimensions, sourceDimensionError } from "../client/src/lib/localImageTransform";

let failures = 0;
function assert(condition: unknown, name: string) { if (condition) console.log(`PASS · ${name}`); else { failures += 1; console.error(`FAIL · ${name}`); } }

assert(tools.length >= 37 && new Set(tools.map((tool) => tool.slug)).size === tools.length && new Set(tools.map((tool) => tool.name)).size === tools.length && new Set(tools.map((tool) => tool.kind)).size === tools.length && tools.some((tool) => tool.slug === "image-crop-rotate-convert" && tool.kind === "imageTransform"), "Image Crop / Rotate / Convert remains a unique registry without duplicate slug, name, or runner kind");
const bounded = cropWithinSource({ width: 1200, height: 800 }, { x: -30, y: 790, width: 3000, height: 200 });
assert(bounded.x === 0 && bounded.y === 790 && bounded.width === 1200 && bounded.height === 10, "Crop geometry clamps coordinates and dimensions to the selected source without producing an empty frame");
assert(cropWithinSource({ width: 1200, height: 800 }, { x: 100, y: 50, width: 400, height: 300 }).width === 400, "An explicitly chosen in-bounds crop retains its exact source-pixel dimensions");
assert(outputDimensions({ x: 0, y: 0, width: 400, height: 300 }, 0).width === 400 && outputDimensions({ x: 0, y: 0, width: 400, height: 300 }, 1).width === 300 && outputDimensions({ x: 0, y: 0, width: 400, height: 300 }, 1).height === 400, "Quarter-turn output dimensions swap only for 90° and 270° rotations");
assert(nextQuarterTurn(0, -1) === 3 && nextQuarterTurn(3, 1) === 0, "Rotation controls wrap through the four right-angle orientations deterministically");
assert(formatExtension("image/png") === "png" && formatExtension("image/jpeg") === "jpg" && formatExtension("image/webp") === "webp", "Export formats receive unambiguous local filenames");
assert(Boolean(imageFileError({ type: "image/gif", size: 10 } as File)) && Boolean(imageFileError({ type: "image/png", size: imageTransformLimits.maxBytes + 1 } as File)) && !imageFileError({ type: "image/webp", size: 10 } as File), "The local editor accepts only supported still-image types and enforces its file-size limit before decoding");
assert(Boolean(sourceDimensionError({ width: imageTransformLimits.maxEdge + 1, height: 10 })) && Boolean(sourceDimensionError({ width: 5000, height: 5000 })) && !sourceDimensionError({ width: 4000, height: 3000 }), "The local editor rejects unsafe decoded edges/pixel counts while retaining bounded normal images");

if (failures) { console.error(`\n${failures} image-transform regression(s) failed.`); process.exit(1); }
console.log("\nAll Image Tools Batch 4 geometry and boundary regressions passed.");
