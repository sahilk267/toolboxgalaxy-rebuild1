/** Deterministic checks for the real production upload/memory validation helpers. */
import {
  BACKGROUND_LIMITS, backgroundFileError, backgroundDimensionError, inferenceSize,
  safeOutputFilename, validHexColor,
} from "../client/src/lib/backgroundRemovalValidation";

let assertions = 0;
function check(test: boolean, label: string) {
  assertions++;
  if (!test) throw new Error("Background-removal test failed: " + label);
}

check(BACKGROUND_LIMITS.maxBytes === 10 * 1024 * 1024, "10 MB upload bound");
check(backgroundFileError("image/jpeg", 3) === null, "JPEG allowed");
check(backgroundFileError("image/png", 3) === null, "PNG allowed");
check(backgroundFileError("image/webp", 3) === null, "WebP allowed");
check(Boolean(backgroundFileError("image/svg+xml", 30)), "SVG rejected");
check(Boolean(backgroundFileError("image/gif", 30)), "animated image rejected");
check(Boolean(backgroundFileError("image/png", 0)), "empty image rejected");
check(Boolean(backgroundFileError("image/png", 10 * 1024 * 1024 + 1)), "oversized file rejected");
check(backgroundDimensionError({ width: 4096, height: 1024 }) === null, "allowed dimensions");
check(Boolean(backgroundDimensionError({ width: 4096, height: 3000 })), "oversized pixels rejected");
check(Boolean(backgroundDimensionError({ width: 8193, height: 1 })), "oversized edge rejected");
check(Boolean(backgroundDimensionError({ width: NaN, height: 5 })), "NaN rejected");
check(Boolean(backgroundDimensionError({ width: 0, height: 4 })), "zero dimension rejected");
check(JSON.stringify(inferenceSize({ width: 4000, height: 2000 })) === JSON.stringify({ width: 1024, height: 512 }), "preserves landscape aspect");
check(JSON.stringify(inferenceSize({ width: 100, height: 200 })) === JSON.stringify({ width: 100, height: 200 }), "small image never upscaled");
check(JSON.stringify(inferenceSize({ width: 800, height: 2000 })) === JSON.stringify({ width: 410, height: 1024 }), "portrait scaling bounded");
check(safeOutputFilename("../hi #there.JPG") === "hi-there-no-background.png", "safe names and extension");
check(safeOutputFilename("????") === "image-no-background.png", "empty sanitized name");
check(validHexColor("#12aBcF"), "six-digit hex supported");
check(!validHexColor("#fff") && !validHexColor("red"), "only valid six-digit colors");
console.log("PASS: " + assertions + " background removal validation assertions.");
