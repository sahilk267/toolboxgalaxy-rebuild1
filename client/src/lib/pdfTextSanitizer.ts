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
