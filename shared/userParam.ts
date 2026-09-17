// Shared parameter sanitization and validation for viral challenges and share links
// 100% identical rules across client-side builders and server-side meta-tag SSR.

/**
 * Strips any characters except standard alphanumeric, spaces, dots, underscores, and dashes.
 * Enforces a maximum length of 30 characters.
 */
export function cleanUserName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[^a-zA-Z0-9 _.-]/g, "").trim().slice(0, 30);
}

/**
 * HTML entity escaping for XSS prevention in server-rendered templates, meta tags, and titles.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strict whitelist sanitizer for user-provided query parameters (e.g. challenge author, tool sharer).
 * First removes banned characters, limits length, trims whitespace, then HTML-escapes.
 */
export function sanitizeUserParam(raw: unknown): string {
  const cleaned = cleanUserName(raw);
  return escapeHtml(cleaned);
}
