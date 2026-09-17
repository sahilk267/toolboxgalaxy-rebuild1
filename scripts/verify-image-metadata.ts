import { tools } from "../client/src/data/toolRegistry";
import { imageMetadataLimits, metadataDimensionError, metadataFileError, metadataFormatExtension, metadataFormatLabel } from "../client/src/lib/localImageMetadata";

let failures = 0;
function assert(condition: unknown, name: string) { if (condition) console.log(`PASS · ${name}`); else { failures += 1; console.error(`FAIL · ${name}`); } }
assert(tools.length >= 37 && new Set(tools.map((tool) => tool.slug)).size === tools.length && new Set(tools.map((tool) => tool.name)).size === tools.length && new Set(tools.map((tool) => tool.kind)).size === tools.length && tools.some((tool) => tool.slug === "image-metadata-remover" && tool.kind === "imageMetadata"), "Image Metadata Remover extends the unique registry without duplicate slug, name, or runner kind");
assert(metadataFileError({ type: "image/png", size: 123 }) === null && metadataFileError({ type: "image/jpeg", size: imageMetadataLimits.maxBytes }) === null && metadataFileError({ type: "image/webp", size: 123 }) === null, "The local clean re-export accepts only bounded PNG, JPG, and WebP still-image inputs");
assert(Boolean(metadataFileError({ type: "image/gif", size: 123 })) && Boolean(metadataFileError({ type: "image/svg+xml", size: 123 })) && Boolean(metadataFileError({ type: "image/png", size: imageMetadataLimits.maxBytes + 1 })), "The local clean re-export rejects unsupported formats and oversized files before decoding");
assert(metadataDimensionError({ width: 1600, height: 900 }) === null && Boolean(metadataDimensionError({ width: imageMetadataLimits.maxEdge + 1, height: 400 })) && Boolean(metadataDimensionError({ width: 5000, height: 5000 })) && Boolean(metadataDimensionError({ width: 0, height: 20 })), "Decoded dimensions remain bounded to one valid native raster frame");
assert(metadataFormatLabel("image/png") === "PNG" && metadataFormatLabel("image/jpeg") === "JPG" && metadataFormatLabel("image/webp") === "WebP" && metadataFormatExtension("image/png") === "png" && metadataFormatExtension("image/jpeg") === "jpg" && metadataFormatExtension("image/webp") === "webp", "Native output labels and filename extensions are unambiguous for every allowed re-export format");
if (failures) { console.error(`\n${failures} image-metadata regression(s) failed.`); process.exit(1); }
console.log("\nAll Image Tools Batch 6 boundary regressions passed.");
