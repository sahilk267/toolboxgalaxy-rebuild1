/**
 * Sanitizes arbitrary Unicode text so it can be safely encoded by pdf-lib's standard fonts (WinAnsi).
 * Maps non-WinAnsi symbols (arrows, em-dashes, smart quotes, bullets, mathematical symbols) to clean ASCII equivalents.
 */
export function sanitizeWinAnsiText(str: string | null | undefined): string {
  if (!str) return "";
  
  const mapped = String(str)
    // Arrows
    .replace(/[→➔➜➝➞►▶]/g, "->")
    .replace(/[←⬅◄◀]/g, "<-")
    .replace(/[↔⟷]/g, "<->")
    .replace(/[⇒⟹]/g, "=>")
    .replace(/[⇐⟸]/g, "<=")
    .replace(/[⇔⟺]/g, "<=>")
    .replace(/[↑⬆]/g, "^")
    .replace(/[↓⬇]/g, "v")
    // Bullets and list markers
    .replace(/[•●◦·⦿⦾]/g, "*")
    // Dashes & hyphens
    .replace(/[–—―‐‑]/g, "-")
    // Quotes
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’‚‛`]/g, "'")
    // Ellipsis
    .replace(/[…]/g, "...")
    // Currency & symbols
    .replace(/[™]/g, "(TM)")
    .replace(/[©]/g, "(C)")
    .replace(/[®]/g, "(R)")
    .replace(/[±]/g, "+/-")
    .replace(/[×]/g, "x")
    .replace(/[÷]/g, "/")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[≠]/g, "!=")
    .replace(/[≈]/g, "~")
    .replace(/[✓✔☑]/g, "[x]")
    .replace(/[✗✘☒]/g, "[ ]")
    .replace(/[★☆✦✧]/g, "*")
    .replace(/[₹]/g, "INR ")
    .replace(/[€]/g, "EUR ")
    .replace(/[£]/g, "GBP ")
    .replace(/[¥]/g, "JPY ");

  // Decompose accented characters to base Latin letters + combining marks, then strip combining marks
  // This maps café -> cafe, résumé -> resume, Zürich -> Zurich without deleting the letters
  const unaccented = mapped.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Retain only valid ASCII characters (0x20 through 0x7E, plus tab and newline) to prevent WinAnsi throw
  return unaccented.replace(/[^\x20-\x7E\t\n]/g, " ");
}

/**
 * Detects characters in a string that cannot be mapped to WinAnsi standard PDF fonts.
 * Detects non-Latin scripts (Devanagari/Hindi, CJK, Arabic, etc.) and unmapped symbols.
 */
export function detectUnsupportedWinAnsi(str: string | null | undefined): string[] {
  if (!str) return [];
  const unsupported = new Set<string>();

  // Check original characters: if normalizing and stripping combining marks leaves non-ASCII
  // outside the standard mapped symbols
  for (const char of str) {
    if (char === "\n" || char === "\r" || char === "\t") continue;
    const code = char.charCodeAt(0);
    // Standard ASCII printable
    if (code >= 0x20 && code <= 0x7e) continue;

    // Check if it is a handled accent or symbol
    const sanitized = sanitizeWinAnsiText(char).trim();
    if (sanitized.length === 0) {
      unsupported.add(char);
    }
  }

  return Array.from(unsupported);
}

export interface SanitizationAuditResult {
  sanitized: string;
  hasUnsupported: boolean;
  unsupportedCharacters: string[];
}

export function sanitizeWinAnsiTextWithAudit(str: string | null | undefined): SanitizationAuditResult {
  if (!str) {
    return { sanitized: "", hasUnsupported: false, unsupportedCharacters: [] };
  }
  const unsupported = detectUnsupportedWinAnsi(str);
  const sanitized = sanitizeWinAnsiText(str);
  return {
    sanitized,
    hasUnsupported: unsupported.length > 0,
    unsupportedCharacters: unsupported,
  };
}
