import { strict as assert } from "node:assert";
import {
  BACKGROUND_MAX_BYTES, validateBackgroundDimensions,
  validateBackgroundFile, safeHexColor, backgroundFileName,
} from "../client/src/lib/backgroundRemovalValidation";

assert.equal(validateBackgroundFile({ type: "image/png", size: 100 }), null);
assert.equal(validateBackgroundFile({ type: "image/jpeg", size: BACKGROUND_MAX_BYTES }), null);
assert.equal(validateBackgroundFile({ type: "image/webp", size: 200 }), null);
assert.match(validateBackgroundFile({ type: "image/svg+xml", size: 30 }) || "", /not supported/i);
assert.match(validateBackgroundFile({ type: "image/png", size: 0 }) || "", /non-empty/i);
assert.match(validateBackgroundFile({ type: "image/png", size: BACKGROUND_MAX_BYTES + 1 }) || "", /10 MB/);
assert.equal(validateBackgroundDimensions(2000, 4000), null);
assert.equal(validateBackgroundDimensions(8192, 976), null);
assert.ok(validateBackgroundDimensions(8192, 8192));
assert.ok(validateBackgroundDimensions(0, 100));
assert.ok(validateBackgroundDimensions(NaN, 100));
assert.ok(validateBackgroundDimensions(100.1, 100));
assert.equal(safeHexColor("#aBc123"), "#aBc123");
assert.equal(safeHexColor("red"), null);
assert.equal(safeHexColor("#abcd"), null);
assert.equal(backgroundFileName("Portrait photo.jpg"), "Portrait-photo-no-background.png");
assert.equal(backgroundFileName(""), "image-no-background.png");
console.log("Background removal validation: 17 assertions passed (not a browser/model E2E test).");
