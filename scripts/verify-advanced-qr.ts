/**
 * Real production QR payload validator and encoder regression suite.
 * No reimplementing production formatting or QR metadata logic.
 */
import QRCode from "qrcode";
import {
  QR_DEFAULTS, QR_LIMITS, makeQrPayload, qrLogoFileError,
  qrStyleError, qrContrastRatio, hexRgb, type QrFields, type QrMode,
} from "../client/src/lib/qrPayloads";

let count = 0;
function check(value: unknown, message: string) {
  if (!value) throw new Error("Advanced QR regression failure: " + message);
  count++;
}
function payload(mode: QrMode, fields: Partial<QrFields> = {}): string {
  const result = makeQrPayload(mode, { ...QR_DEFAULTS, ...fields });
  if (!result.value) throw new Error("Expected valid payload but got: " + result.error);
  return result.value;
}
function reject(mode: QrMode, fields: Partial<QrFields>, caseName: string) {
  check(Boolean(makeQrPayload(mode, { ...QR_DEFAULTS, ...fields }).error), caseName);
}

check(payload("text") === "https://toolboxgalaxy.com", "original text URL preserved");
check(payload("text", { text: " Hello " }) === " Hello ", "raw text whitespace maintained");
check(payload("text", { text: "日本語 😀" }) === "日本語 😀", "Unicode/emoji retained");
reject("text", { text: "  " }, "reject blank QR");
reject("text", { text: "x".repeat(1501) }, "reject overlong data");
reject("text", { text: "😃".repeat(376) }, "enforce UTF-8 not code-unit byte size");
check(new TextEncoder().encode(payload("text", { text: "a".repeat(1500) })).length === 1500, "1500 UTF-8 bytes allowed");
reject("wifi", { ssid: "" }, "Wi-Fi SSID mandatory");
reject("wifi", { ssid: "a".repeat(65) }, "Wi-Fi SSID bounded");
reject("wifi", { wifiSecurity: "WPA", wifiPassword: "" }, "Wi-Fi password mandatory unless open");
check(payload("wifi", { wifiSecurity: "nopass", wifiPassword: "" }) === "WIFI:T:nopass;S:My Wi-Fi;;", "open Wi-Fi payload");
check(payload("wifi", { wifiPassword: "Secret1234" }).includes("P:Secret1234;"), "Wi-Fi WPA password");
check(payload("wifi", { wifiSecurity: "WEP", wifiPassword: "secret" }).startsWith("WIFI:T:WEP;"), "WEP payload labeled");
check(payload("wifi", { ssid: "Home;Office", wifiPassword: "hello:there,ok\"!" }).includes("S:Home\\;Office;"), "Wi-Fi semicolon escaped");
check(payload("wifi", { ssid: "Home;Office", wifiPassword: "hello:there,ok\"!" }).includes("P:hello\\:there\\,ok\\\"!;"), "Wi-Fi password special characters escaped");
check(payload("wifi", { ssid: "Office", wifiSecurity: "nopass", wifiHidden: true }).includes("H:true;"), "Wi-Fi hidden network");
reject("wifi", { wifiSecurity: "WPA", wifiPassword: "p".repeat(129) }, "Wi-Fi long password rejected");
check(payload("contact").startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"), "vCard 3.0 format");
check(payload("contact").endsWith("\r\nEND:VCARD"), "vCard ending");
check(payload("contact", { contactName: "Alex, Example; Jr." }).includes("FN:Alex\\, Example\\; Jr."), "vCard escaped name");
check(payload("contact", { contactName: "Alex\nBob" }).includes("FN:Alex\\nBob"), "vCard newline escaped");
check(payload("contact", { contactOrganization: "Acme, LLC" }).includes("ORG:Acme\\, LLC"), "vCard organization escaped");
reject("contact", { contactName: "" }, "name required");
reject("contact", { contactName: "x".repeat(121) }, "name bounded");
reject("contact", { contactEmail: "not-email" }, "invalid contact email rejected");
reject("contact", { contactPhone: "wrong!" }, "invalid contact phone rejected");
check(payload("contact", { contactPhone: "", contactEmail: "" }).includes("FN:Alex Example"), "valid name-only contact");
check(payload("email").startsWith("mailto:hello@example.com"), "mailto scheme");
check(payload("email", { emailSubject: "Hi & welcome!" }).includes("subject=Hi+%26+welcome%21"), "email subject URL encoding");
check(payload("email", { emailBody: "Line one\nLine two" }).includes("body=Line+one%0ALine+two"), "email newline encoding");
reject("email", { emailAddress: "" }, "email required");
reject("email", { emailAddress: "invalid" }, "invalid email syntax rejected");
check(payload("sms").startsWith("sms:+15551234567?body="), "SMS URI");
check(payload("sms", { smsBody: "Meet @ 5?" }).includes("body=Meet%20%40%205%3F"), "SMS URI encoding");
reject("sms", { smsNumber: "Invalid!" }, "reject invalid SMS phone");
check(payload("phone") === "tel:+15551234567", "tel URI");
check(payload("phone", { phoneNumber: "(555) 123-4567" }) === "tel:5551234567", "phone punctuation stripped");
reject("phone", { phoneNumber: "" }, "phone required");
reject("phone", { phoneNumber: "script:hello" }, "phone URI injection rejected");
check(Boolean(makeQrPayload("nonsense" as QrMode, QR_DEFAULTS).error), "reject unknown QR mode");
check(QR_LIMITS.maxLogoPixels === 4_000_000, "logo pixel budget");
check(qrLogoFileError("image/png", 100) === null, "PNG logo allowed");
check(qrLogoFileError("image/jpeg", 100) === null, "JPEG logo allowed");
check(qrLogoFileError("image/webp", 100) === null, "WebP logo allowed");
check(Boolean(qrLogoFileError("image/svg+xml", 100)), "SVG logo rejected");
check(Boolean(qrLogoFileError("image/gif", 100)), "GIF logo rejected");
check(Boolean(qrLogoFileError("image/png", 0)), "empty logo rejected");
check(Boolean(qrLogoFileError("image/png", QR_LIMITS.maxLogoBytes + 1)), "oversize logo rejected");
check(Boolean(qrLogoFileError("image/png", 100, 2001, 2000)), "oversize decoded logo rejected");
check(Boolean(qrLogoFileError("image/png", 100, -1, 100)), "negative decoded pixels rejected");
check(qrLogoFileError("image/png", 100, 512, 512) === null, "valid decoded logo accepted");
check(qrContrastRatio("#000000", "#ffffff") === 21, "black-on-white contrast 21");
check(qrContrastRatio("#gg0000", "#ffffff") === null, "invalid color");
check(hexRgb("#112233")?.join(",") === "17,34,51", "hex parser");
check(qrStyleError(320, 2, "#0b1020", "#f4f2ea") === null, "preserve legacy default styling");
check(qrStyleError(1024, 4, "#000000", "#ffffff") === null, "high-resolution quiet-zone 4 accepted");
check(Boolean(qrStyleError(100, 2, "#000000", "#ffffff")), "tiny output rejected");
check(Boolean(qrStyleError(1201, 2, "#000000", "#ffffff")), "huge output rejected");
check(Boolean(qrStyleError(320, 1, "#000000", "#ffffff")), "quiet zone 1 rejected");
check(Boolean(qrStyleError(320, 9, "#000000", "#ffffff")), "quiet zone 9 rejected");
check(Boolean(qrStyleError(320, 2, "#ffffff", "#000000")), "inverted QR colors rejected");
check(Boolean(qrStyleError(320, 2, "#aaaaaa", "#dddddd")), "poor contrast rejected");

for (const [mode, fields] of [
  ["text", QR_DEFAULTS],
  ["wifi", { ...QR_DEFAULTS, wifiPassword: "correct horse battery staple" }],
  ["contact", QR_DEFAULTS],
  ["email", QR_DEFAULTS],
  ["sms", QR_DEFAULTS],
  ["phone", QR_DEFAULTS],
] as [QrMode, QrFields][]) {
  const encoded = payload(mode, fields);
  const matrix = QRCode.create(encoded, { errorCorrectionLevel: "M" });
  check(matrix.modules.size >= 21, mode + " real QR matrix created");
  check(matrix.modules.data.length === matrix.modules.size ** 2, mode + " matrix modules complete");
}

const svg = await QRCode.toString(payload("text"), {
  type: "svg", width: 320, margin: 2, errorCorrectionLevel: "M",
  color: { dark: "#0b1020", light: "#f4f2ea" },
});
check(svg.includes("<svg") && svg.includes("</svg>"), "actual SVG encoder output");
check(svg.includes("path"), "SVG contains encoded QR path");
console.log("PASS: " + count + " advanced QR production-engine assertions.");
