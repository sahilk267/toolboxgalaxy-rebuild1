/** Tests the real exported production engines; no duplicate implementations. */
import sharp from "sharp";
import JSZip from "jszip";
import {
  FAVICON_SIZES, FAVICON_MAX_BYTES, FAVICON_MAX_PIXELS,
  assertPngSize, encodePngIco, faviconFileError, faviconManifest, faviconHtmlSnippet,
} from "../client/src/lib/faviconPackage";
import {
  PASSWORD_DEFAULTS, passwordCharset, passwordConfigError, generatePasswords,
  generatePassphrases, generatedPassphraseEntropy, generatedPasswordEntropy,
  PASSPHRASE_WORDLIST_SIZE, assessPassword,
} from "../client/src/lib/passwordWorkbench";
import {
  readJson, formatJson, parseJsonPath, queryJson, compareJson,
  MAX_JSON_CHARS, MAX_DIFFS, jsonErrorPosition,
} from "../client/src/lib/jsonWorkspaceEngine";

let tests = 0;
function check(condition: unknown, description: string) {
  if (!condition) throw new Error("Advanced tool regression failure: " + description);
  tests++;
}
function equal(actual: unknown, expected: unknown, description: string) {
  check(actual === expected, description + " (actual: " + JSON.stringify(actual) +
    ", expected: " + JSON.stringify(expected) + ")");
}
function errorFrom(fn: () => unknown) {
  try { fn(); return false; } catch { return true; }
}

// Favicon engine: independently generated real PNG bytes, ICO directory and ZIP compatibility.
equal(FAVICON_SIZES.join(","), "16,32,48,180,192,512", "favicon size matrix");
equal(faviconFileError("image/png", 1024), null, "PNG accepted");
equal(faviconFileError("image/jpeg", 1024), null, "JPEG accepted");
equal(faviconFileError("image/webp", 1024), null, "WebP accepted");
check(Boolean(faviconFileError("image/svg+xml", 1024)), "SVG refused as input");
check(Boolean(faviconFileError("image/gif", 1024)), "GIF refused");
check(Boolean(faviconFileError("image/png", 0)), "empty image refused");
check(Boolean(faviconFileError("image/png", FAVICON_MAX_BYTES + 1)), "oversize file refused");
check(Boolean(faviconFileError("image/png", 1024, 6000, 4000)), "over 20MP refused");
equal(faviconFileError("image/png", 1024, 4000, 5000), null, "20MP boundary accepted");
check(Boolean(faviconFileError("image/png", 1024, -1, 5000)), "bad dimensions refused");
const png = await Promise.all(([16,32,48] as const).map(async size => ({
  size,
  png: new Uint8Array(await sharp({ create: { width: size, height: size, channels: 4,
    background: { r: 21, g: 43, b: 120, alpha: 1 } } }).png().toBuffer()),
})));
for (const frame of png) {
  assertPngSize(frame.png, frame.size);
  check(frame.png[0] === 137, "actual PNG signature " + frame.size);
}
check(errorFrom(() => assertPngSize(new Uint8Array(12), 16)), "short PNG rejected");
check(errorFrom(() => assertPngSize(png[0].png, 32)), "mismatched PNG dimension rejected");
check(errorFrom(() => encodePngIco([])), "empty ICO frame array rejected");
check(errorFrom(() => encodePngIco([png[0], png[0]])), "duplicate ICO frame size rejected");
const ico = encodePngIco(png);
const icoView = new DataView(ico.buffer);
equal(icoView.getUint16(0, true), 0, "ICO reserved header");
equal(icoView.getUint16(2, true), 1, "ICO icon type");
equal(icoView.getUint16(4, true), 3, "ICO multi-frame count");
let pointer = 6 + 3 * 16;
for (let i=0; i<3; i++) {
  const entry = 6 + i * 16;
  equal(ico[entry], png[i].size, "ICO frame width");
  equal(ico[entry + 1], png[i].size, "ICO frame height");
  equal(icoView.getUint16(entry + 6, true), 32, "ICO bit depth");
  equal(icoView.getUint32(entry + 8, true), png[i].png.length, "ICO frame data length");
  equal(icoView.getUint32(entry + 12, true), pointer, "ICO frame offset");
  check(png[i].png.every((byte, j) => byte === ico[pointer + j]), "ICO embeds real PNG bytes");
  pointer += png[i].png.length;
}
equal(pointer, ico.length, "ICO complete asset layout");
const manifest = JSON.parse(faviconManifest("Example Studio", "#00aa77"));
equal(manifest.name, "Example Studio", "webmanifest app name");
equal(manifest.icons.length, 2, "webmanifest required Android icon sizes");
equal(manifest.icons[0].sizes, "192x192", "webmanifest 192px icon");
equal(manifest.icons[1].sizes, "512x512", "webmanifest 512px icon");
check(Boolean(manifest.icons[0].src.includes("android-chrome")), "manifest filenames match download");
check(errorFrom(() => faviconManifest("test", "not-a-color")), "invalid theme rejected");
check(faviconManifest("<unsafe>", "#ffffff").includes("<unsafe>"), "JSON escapes generated names as data");
const html = faviconHtmlSnippet();
check(html.includes('href="/favicon.ico"'), "ICO HTML link");
check(html.includes('href="/site.webmanifest"'), "manifest HTML link");
check(html.includes('href="/apple-touch-icon.png"'), "Apple icon HTML link");
const zip = new JSZip();
zip.file("favicon.ico", ico);
zip.file("site.webmanifest", faviconManifest("Example", "#ffffff"));
const bytes = await zip.generateAsync({ type: "uint8array" });
const reopened = await JSZip.loadAsync(bytes);
check((await reopened.file("favicon.ico")!.async("uint8array")).byteLength === ico.byteLength, "ICO survives ZIP roundtrip");
check((await reopened.file("site.webmanifest")!.async("string")).includes('"name": "Example"'), "manifest survives ZIP roundtrip");

// Password generation: secure RNG, all character group guarantees and safe validation.
const defaults = PASSWORD_DEFAULTS;
equal(defaults.length, 18, "old password generator default 18");
equal(defaults.count, 1, "old password generator default count 1");
equal(passwordConfigError(defaults), null, "default password config valid");
const pw = generatePasswords(defaults)[0];
equal(pw.length, 18, "generated password exact default length");
check(/[A-Z]/.test(pw), "uppercase included");
check(/[a-z]/.test(pw), "lowercase included");
check(/\d/.test(pw), "number included");
check(/[!@#$%&*?]/.test(pw), "symbol included");
check(!/[O0Il1|]/.test(pw), "confusing glyphs excluded");
check(generatedPasswordEntropy(defaults) > 60, "theoretical entropy reasonable for defaults");
const noSymbols = { ...defaults, symbols: false, count: 5, length: 32 };
const pwList = generatePasswords(noSymbols);
equal(pwList.length, 5, "batch count");
check(pwList.every(s => s.length === 32 && !/[!@#$%&*?]/.test(s)), "symbol exclusion works");
const digitsOnly = { ...defaults, uppercase: false, lowercase: false, symbols: false, numbers: true };
check(generatePasswords(digitsOnly)[0].split("").every(char => /[2-9]/.test(char)), "digits-only unambiguous mode");
check(Boolean(passwordConfigError({ ...defaults, uppercase: false, lowercase: false, symbols: false, numbers: false })), "empty charset blocked");
check(Boolean(passwordConfigError({ ...defaults, length: 11 })), "short length blocked");
check(Boolean(passwordConfigError({ ...defaults, length: 129 })), "long length blocked");
check(Boolean(passwordConfigError({ ...defaults, count: 21 })), "batch cap enforced");
check(errorFrom(() => generatePasswords({ ...defaults, count: 0 })), "invalid batch actually throws");
check(passwordCharset(defaults).groups.length === 4, "default all character groups");
check(PASSPHRASE_WORDLIST_SIZE >= 150, "phrase list has adequate diversity");
const phrases = generatePassphrases(8, 3, "-");
equal(phrases.length, 3, "passphrase batch");
check(phrases.every(p => p.split("-").length === 8), "8 independent words per phrase");
check(generatedPassphraseEntropy(8) > 55, "wordlist-based entropy estimate");
check(generatePassphrases(6,1," ").length === 1, "space-separated phrase");
check(errorFrom(() => generatePassphrases(5,1,"-")), "short phrase refused");
check(errorFrom(() => generatePassphrases(13,1,"-")), "long phrase refused");
check(errorFrom(() => generatePassphrases(8,21,"-")), "huge phrase batch refused");
check(errorFrom(() => generatePassphrases(8,1,"_" as "-")), "unapproved separator refused");
equal(assessPassword("").label, "Waiting", "empty password state");
equal(assessPassword("password").score, 0, "common password rejected");
check(assessPassword("passwordpasswordpassword").score <= 1, "repeated common prefix warned");
check(assessPassword("AAAAAAAAAAAAAAAAAAAAAAAA").score <= 1, "repeated glyphs warned");
check(assessPassword("abc12345678").score <= 2, "common number pattern flagged");
check(assessPassword("a long and unusual sentence with multiple words").score >= 3, "long unique phrases not penalized for composition");
equal(assessPassword("🙂🙂🙂🙂").length, 4, "Unicode code-point length");
check(assessPassword("SecureRandomValueLength22!").tips.some(t => t.includes("breaches")), "transparent breach limitation");
check(assessPassword("hello").issues.some(i => i.includes("Shorter")), "short input guidance");

// JSON engine: default output, sorting, query isolation, compare, malformed JSON and bounded content.
const defaultJson = '{"mission":"tools","status":"verified"}';
equal(formatJson(defaultJson).output, '{\n  "mission": "tools",\n  "status": "verified"\n}', "old JSON format output");
equal(formatJson(defaultJson,true).output, defaultJson, "old JSON minify output");
equal(formatJson('{"z":1,"a":2}',false,true).output, '{\n  "a": 2,\n  "z": 1\n}', "optional key sorting");
equal(formatJson('{"items":[{"b":2,"a":1}]}',true,true).output, '{"items":[{"a":1,"b":2}]}', "deep sort in arrays");
equal(formatJson('null').output, "null", "JSON null valid");
equal(formatJson('false').output, "false", "boolean JSON valid");
equal(formatJson('"hello"').output, '"hello"', "string JSON valid");
equal(formatJson('0').output, "0", "zero JSON valid");
check(!readJson('{"a":').valid, "invalid JSON rejected");
check(Boolean(readJson('{"a":').error), "invalid JSON descriptive message");
check(!readJson("").valid, "blank input invalid");
check(!readJson("a".repeat(MAX_JSON_CHARS+1)).valid, "JSON input cap");
check(jsonErrorPosition("a\nb\nc", "Bad at position 4").line === 3, "error position line");
check(jsonErrorPosition("a\nb\nc", "Bad at position 4").column === 1, "error position column");
equal(queryJson(defaultJson,"$.mission").output, '"tools"', "dot notation query");
equal(queryJson('{"x":[{"z":5}]}', '$.x[0].z').output, "5", "array index query");
equal(queryJson('{"a.b":{"c":null}}', '$["a.b"].c').output, "null", "quoted unusual property");
equal(queryJson('{"a":true}', "$").output, '{\n  "a": true\n}', "root lookup");
equal(queryJson('{"__proto__":{"value":42}}','$["__proto__"].value').output, "42", "own prototype-looking key read safely");
check(Boolean(queryJson('{"a":1}', "$.constructor").error), "inherited constructor not exposed");
check(Boolean(queryJson('{"a":1}', "$.toString").error), "inherited function not exposed");
check(Boolean(queryJson(defaultJson, "$.missing").error), "missing key error");
check(Boolean(queryJson(defaultJson, "mission").error), "path requires root");
check(Boolean(queryJson(defaultJson, "$.a()").error), "function call syntax blocked");
check(Boolean(queryJson(defaultJson, "$[999999999999999999999]").error), "huge index blocked");
check(Boolean(parseJsonPath('$["unterminated]').error), "unterminated quoted key blocked");
check(Boolean(parseJsonPath("$..x").error), "recursive syntax blocked");
check(Boolean(parseJsonPath("$[*]").error), "wildcard unsupported intentionally");
const equalCompare = compareJson('{"a":1,"b":2}', '{"b":2,"a":1}');
equal(equalCompare.changes?.length, 0, "key order ignored in comparison");
const diff = compareJson('{"a":1,"nested":{"k":2},"gone":3}', '{"a":2,"nested":{"k":2},"new":4}');
equal(diff.changes?.length, 3, "changed/added/removed detection");
check(diff.changes?.some(d => d.path === "$.a" && d.kind === "changed"), "changed diff path");
check(diff.changes?.some(d => d.path === "$.gone" && d.kind === "removed"), "removed diff path");
check(diff.changes?.some(d => d.path === "$.new" && d.kind === "added"), "added diff path");
const longDiff = compareJson(JSON.stringify(Array(120).fill(0)),JSON.stringify(Array(120).fill(1)));
equal(longDiff.changes?.length, MAX_DIFFS, "diff result capped");
check(Boolean(compareJson("invalid", "[]").error), "malformed left diff handled");
check(Boolean(compareJson("{}", "invalid").error), "malformed right diff handled");
const sortedSpecial = formatJson('{"__proto__":{"x":2},"a":1}',true,true);
check(sortedSpecial.output?.includes('"__proto__"'), "sorting preserves reserved keys as data");

console.log("PASS: " + tests + " advanced favicon/password/JSON production-engine assertions.");
