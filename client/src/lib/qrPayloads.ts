/** Browser-local QR payload builders and scan-safety validation.
 * No analytics, network, storage, secrets or paid QR endpoints.
 */
export type QrMode = "text" | "wifi" | "contact" | "email" | "sms" | "phone";
export type QrCorrection = "L" | "M" | "Q" | "H";

export type QrFields = {
  text: string;
  ssid: string;
  wifiPassword: string;
  wifiSecurity: "WPA" | "WEP" | "nopass";
  wifiHidden: boolean;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactOrganization: string;
  emailAddress: string;
  emailSubject: string;
  emailBody: string;
  smsNumber: string;
  smsBody: string;
  phoneNumber: string;
};

export const QR_DEFAULTS: QrFields = {
  text: "https://toolboxgalaxy.com",
  ssid: "My Wi-Fi",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  contactName: "Alex Example",
  contactPhone: "+15551234567",
  contactEmail: "alex@example.com",
  contactOrganization: "",
  emailAddress: "hello@example.com",
  emailSubject: "Hello",
  emailBody: "",
  smsNumber: "+15551234567",
  smsBody: "Hello!",
  phoneNumber: "+15551234567",
};

const QR_MAX_PAYLOAD_BYTES = 1500;
export const QR_LIMITS = {
  maxPayloadBytes: QR_MAX_PAYLOAD_BYTES,
  minSize: 160,
  maxSize: 1200,
  maxLogoBytes: 2 * 1024 * 1024,
  maxLogoPixels: 4_000_000,
} as const;

const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
const escapeVcard = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r\n?|\n/g, "\\n")
  .replace(/;/g, "\\;").replace(/,/g, "\\,");
const emailValid = (email: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email) && email.length <= 254;
const phoneValid = (phone: string) => /^\+?[0-9()\s.-]{3,25}$/.test(phone);

export function makeQrPayload(mode: QrMode, values: QrFields):
  { value?: string; error?: string } {
  let payload = "";
  switch (mode) {
    case "text":
      payload = values.text;
      if (!payload.trim()) return { error: "Enter text or a URL." };
      break;
    case "wifi": {
      const ssid = values.ssid.trim();
      if (!ssid || ssid.length > 64) return { error: "Enter a network name (up to 64 characters)." };
      if (values.wifiSecurity !== "nopass" && !values.wifiPassword) {
        return { error: "Enter the Wi-Fi password, or choose an open network." };
      }
      if (values.wifiPassword.length > 128) return { error: "Wi-Fi password is too long." };
      payload = "WIFI:T:" + values.wifiSecurity + ";S:" + escapeWifi(ssid) +
        (values.wifiSecurity === "nopass" ? ";" : ";P:" + escapeWifi(values.wifiPassword) + ";") +
        (values.wifiHidden ? "H:true;" : "") + ";";
      break;
    }
    case "contact": {
      const name = values.contactName.trim();
      if (!name || name.length > 120) return { error: "Enter a contact name (up to 120 characters)." };
      const phone = values.contactPhone.trim();
      const email = values.contactEmail.trim();
      if (phone && !phoneValid(phone)) return { error: "Enter a valid contact phone number." };
      if (email && !emailValid(email)) return { error: "Enter a valid contact email address." };
      const nameParts = name.split(/\s+/);
      const family = nameParts.length > 1 ? nameParts.pop()! : "";
      const given = nameParts.join(" ");
      const parts = ["BEGIN:VCARD", "VERSION:3.0",
        "N:" + escapeVcard(family) + ";" + escapeVcard(given) + ";;;",
        "FN:" + escapeVcard(name)];
      if (phone) parts.push("TEL;TYPE=CELL:" + escapeVcard(phone));
      if (email) parts.push("EMAIL:" + escapeVcard(email));
      if (values.contactOrganization.trim()) parts.push("ORG:" + escapeVcard(values.contactOrganization.trim()));
      parts.push("END:VCARD");
      payload = parts.join("\r\n");
      break;
    }
    case "email": {
      const address = values.emailAddress.trim();
      if (!emailValid(address)) return { error: "Enter a valid email address." };
      const query = new URLSearchParams();
      if (values.emailSubject) query.set("subject", values.emailSubject);
      if (values.emailBody) query.set("body", values.emailBody);
      payload = "mailto:" + address + (query.toString() ? "?" + query.toString() : "");
      break;
    }
    case "sms": {
      const phone = values.smsNumber.trim();
      if (!phoneValid(phone)) return { error: "Enter a valid SMS phone number." };
      payload = "sms:" + phone.replace(/[\s().-]/g, "") + (values.smsBody ? "?body=" + encodeURIComponent(values.smsBody) : "");
      break;
    }
    case "phone": {
      const phone = values.phoneNumber.trim();
      if (!phoneValid(phone)) return { error: "Enter a valid phone number." };
      payload = "tel:" + phone.replace(/[\s().-]/g, "");
      break;
    }
    default:
      return { error: "Unsupported QR code type." };
  }
  if (new TextEncoder().encode(payload).length > QR_MAX_PAYLOAD_BYTES)
    return { error: "QR payload exceeds 1,500 UTF-8 bytes. Shorten the data for reliable scanning." };
  return { value: payload };
}

export function hexRgb(hex: string): [number, number, number] | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(rgb: [number, number, number]): number {
  const channels = rgb.map(x => {
    const normalized = x / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function qrContrastRatio(foreground: string, background: string): number | null {
  const fg = hexRgb(foreground), bg = hexRgb(background);
  if (!fg || !bg) return null;
  const f = luminance(fg), b = luminance(bg);
  return (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
}

export function qrStyleError(size: number, margin: number, dark: string, light: string): string | null {
  if (!Number.isSafeInteger(size) || size < QR_LIMITS.minSize || size > QR_LIMITS.maxSize)
    return "QR image size must be 160–1,200 pixels.";
  if (!Number.isSafeInteger(margin) || margin < 2 || margin > 8)
    return "Keep a quiet-zone margin of 2–8 modules.";
  const contrast = qrContrastRatio(dark, light);
  if (contrast === null) return "Choose two valid six-digit HEX colors.";
  if (contrast < 4.5 || luminance(hexRgb(dark)!) >= luminance(hexRgb(light)!))
    return "Use a dark foreground on a light background with at least 4.5:1 contrast.";
  return null;
}

export function qrLogoFileError(mime: string, bytes: number, width?: number, height?: number): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime))
    return "Choose a PNG, JPG or WebP logo.";
  if (!Number.isFinite(bytes) || bytes < 1 || bytes > QR_LIMITS.maxLogoBytes)
    return "Choose a non-empty logo smaller than 2 MB.";
  if (width !== undefined && height !== undefined &&
      (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
        width < 1 || height < 1 || width * height > QR_LIMITS.maxLogoPixels))
    return "Logo must be smaller than four megapixels.";
  return null;
}
