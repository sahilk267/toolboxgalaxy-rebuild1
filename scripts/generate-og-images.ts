/**
 * One-time build script to generate high-resolution, branded Open Graph / Twitter share PNGs (1200x630).
 * Produces 1 share image per tool category, 1 per game, tools hub, games bay, and site default.
 * Outputs to client/public/og/ for static hosting compatibility.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ALL_OG_DEFINITIONS, OgImageDefinition } from "../shared/ogCatalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../client/public/og");

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderVisualIllustration(visualType: string, accentColor: string): string {
  switch (visualType) {
    case "game-hive": {
      // Hexagonal honeycomb spelling bee cluster
      return `
        <!-- Center and surrounding hexagons -->
        <g transform="translate(205, 220)">
          <!-- Center Gold Hexagon -->
          <polygon points="0,-48 42,-24 42,24 0,48 -42,24 -42,-24" fill="#eab308" filter="drop-shadow(0 0 12px rgba(234, 179, 8, 0.5))"/>
          <text x="0" y="10" fill="#0b1020" font-family="system-ui, sans-serif" font-size="28" font-weight="900" text-anchor="middle">B</text>

          <!-- Top -->
          <g transform="translate(0, -84)">
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="0" y="8" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle">O</text>
          </g>
          <!-- Top Right -->
          <g transform="translate(73, -42)">
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="0" y="8" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle">R</text>
          </g>
          <!-- Bottom Right -->
          <g transform="translate(73, 42)">
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="0" y="8" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle">I</text>
          </g>
          <!-- Bottom -->
          <g transform="translate(0, 84)">
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="0" y="8" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle">T</text>
          </g>
          <!-- Bottom Left -->
          <g transform="translate(-73, 42)">
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="0" y="8" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle">A</text>
          </g>
          <!-- Top Left -->
          <g transform="translate(-73, -42)">
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="0" y="8" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="800" text-anchor="middle">L</text>
          </g>
        </g>
        <!-- Rank Pill -->
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(234, 179, 8, 0.18)" stroke="#eab308" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fef08a" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">👑 QUEEN BEE RANK</text>
      `;
    }
    case "game-wordle": {
      // Wordle 5x5 tile board
      return `
        <g transform="translate(55, 60)">
          <!-- Row 1 (Guesses) -->
          <rect x="0" y="0" width="54" height="54" rx="8" fill="#334155"/>
          <text x="27" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">P</text>
          <rect x="62" y="0" width="54" height="54" rx="8" fill="#eab308"/>
          <text x="89" y="36" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">L</text>
          <rect x="124" y="0" width="54" height="54" rx="8" fill="#334155"/>
          <text x="151" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">A</text>
          <rect x="186" y="0" width="54" height="54" rx="8" fill="#10b981"/>
          <text x="213" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">N</text>
          <rect x="248" y="0" width="54" height="54" rx="8" fill="#334155"/>
          <text x="275" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">T</text>

          <!-- Row 2 -->
          <rect x="0" y="62" width="54" height="54" rx="8" fill="#334155"/>
          <text x="27" y="98" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">C</text>
          <rect x="62" y="62" width="54" height="54" rx="8" fill="#10b981"/>
          <text x="89" y="98" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">L</text>
          <rect x="124" y="62" width="54" height="54" rx="8" fill="#10b981"/>
          <text x="151" y="98" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">O</text>
          <rect x="186" y="62" width="54" height="54" rx="8" fill="#334155"/>
          <text x="213" y="98" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">U</text>
          <rect x="248" y="62" width="54" height="54" rx="8" fill="#334155"/>
          <text x="275" y="98" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">D</text>

          <!-- Row 3 (Solved in Green) -->
          <rect x="0" y="124" width="54" height="54" rx="8" fill="#10b981" filter="drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))"/>
          <text x="27" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">S</text>
          <rect x="62" y="124" width="54" height="54" rx="8" fill="#10b981" filter="drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))"/>
          <text x="89" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">O</text>
          <rect x="124" y="124" width="54" height="54" rx="8" fill="#10b981" filter="drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))"/>
          <text x="151" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">L</text>
          <rect x="186" y="124" width="54" height="54" rx="8" fill="#10b981" filter="drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))"/>
          <text x="213" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">A</text>
          <rect x="248" y="124" width="54" height="54" rx="8" fill="#10b981" filter="drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))"/>
          <text x="275" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800" text-anchor="middle">R</text>

          <!-- Empty Rows -->
          <rect x="0" y="186" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="62" y="186" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="124" y="186" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="186" y="186" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="248" y="186" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>

          <rect x="0" y="248" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="62" y="248" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="124" y="248" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="186" y="248" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
          <rect x="248" y="248" width="54" height="54" rx="8" fill="#1e293b" stroke="#334155"/>
        </g>
        <rect x="110" y="380" width="190" height="34" rx="17" fill="rgba(16, 185, 129, 0.18)" stroke="#10b981" stroke-width="1.5"/>
        <text x="205" y="403" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🟩 SOLVED IN 3/6</text>
      `;
    }
    case "game-connections": {
      // 4 categorized colored rows
      return `
        <g transform="translate(30, 45)">
          <!-- Tier 1: Yellow -->
          <rect x="0" y="0" width="350" height="74" rx="10" fill="#fde047" filter="drop-shadow(0 4px 10px rgba(253, 224, 71, 0.25))"/>
          <text x="175" y="28" fill="#0b1020" font-family="system-ui, sans-serif" font-size="15" font-weight="800" text-anchor="middle">TYPES OF CLOUDS</text>
          <text x="175" y="54" fill="#1f2937" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">CIRRUS, CUMULUS, STRATUS, NIMBUS</text>

          <!-- Tier 2: Green -->
          <rect x="0" y="86" width="350" height="74" rx="10" fill="#4ade80" filter="drop-shadow(0 4px 10px rgba(74, 222, 128, 0.25))"/>
          <text x="175" y="114" fill="#0b1020" font-family="system-ui, sans-serif" font-size="15" font-weight="800" text-anchor="middle">THINGS THAT SHINE</text>
          <text x="175" y="140" fill="#1f2937" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">STAR, DIAMOND, SUN, GLITTER</text>

          <!-- Tier 3: Blue -->
          <rect x="0" y="172" width="350" height="74" rx="10" fill="#60a5fa" filter="drop-shadow(0 4px 10px rgba(96, 165, 250, 0.25))"/>
          <text x="175" y="200" fill="#0b1020" font-family="system-ui, sans-serif" font-size="15" font-weight="800" text-anchor="middle">WORDS WITH 'BOARD'</text>
          <text x="175" y="226" fill="#1f2937" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">CHALK, KEY, SURF, DASH</text>

          <!-- Tier 4: Purple -->
          <rect x="0" y="258" width="350" height="74" rx="10" fill="#c084fc" filter="drop-shadow(0 4px 10px rgba(192, 132, 252, 0.25))"/>
          <text x="175" y="286" fill="#0b1020" font-family="system-ui, sans-serif" font-size="15" font-weight="800" text-anchor="middle">SYNONYMS FOR BRILLIANT</text>
          <text x="175" y="312" fill="#1f2937" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">CLEVER, LUMINOUS, GENIUS, VIVID</text>
        </g>
        <rect x="110" y="390" width="190" height="34" rx="17" fill="rgba(192, 132, 252, 0.18)" stroke="#c084fc" stroke-width="1.5"/>
        <text x="205" y="413" fill="#e9d5ff" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🔠 4 PERFECT GROUPS</text>
      `;
    }
    case "game-queens": {
      // Queens board with crowns
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#1e293b" stroke="#475569" stroke-width="3"/>
          <!-- Checker cells -->
          <rect x="0" y="0" width="70" height="70" fill="#0284c7" opacity="0.4"/>
          <rect x="70" y="0" width="70" height="70" fill="#0284c7" opacity="0.4"/>
          <rect x="140" y="0" width="70" height="70" fill="#f59e0b" opacity="0.4"/>
          <rect x="210" y="0" width="70" height="70" fill="#f59e0b" opacity="0.4"/>

          <rect x="0" y="70" width="70" height="70" fill="#0284c7" opacity="0.4"/>
          <rect x="70" y="70" width="70" height="70" fill="#10b981" opacity="0.4"/>
          <rect x="140" y="70" width="70" height="70" fill="#f59e0b" opacity="0.4"/>
          <rect x="210" y="70" width="70" height="70" fill="#a855f7" opacity="0.4"/>

          <rect x="0" y="140" width="70" height="70" fill="#ec4899" opacity="0.4"/>
          <rect x="70" y="140" width="70" height="70" fill="#10b981" opacity="0.4"/>
          <rect x="140" y="140" width="70" height="70" fill="#10b981" opacity="0.4"/>
          <rect x="210" y="140" width="70" height="70" fill="#a855f7" opacity="0.4"/>

          <rect x="0" y="210" width="70" height="70" fill="#ec4899" opacity="0.4"/>
          <rect x="70" y="210" width="70" height="70" fill="#ec4899" opacity="0.4"/>
          <rect x="140" y="210" width="70" height="70" fill="#a855f7" opacity="0.4"/>
          <rect x="210" y="210" width="70" height="70" fill="#a855f7" opacity="0.4"/>

          <!-- Grid Lines -->
          <line x1="70" y1="0" x2="70" y2="280" stroke="#475569" stroke-width="2"/>
          <line x1="140" y1="0" x2="140" y2="280" stroke="#475569" stroke-width="2"/>
          <line x1="210" y1="0" x2="210" y2="280" stroke="#475569" stroke-width="2"/>
          <line x1="0" y1="70" x2="280" y2="70" stroke="#475569" stroke-width="2"/>
          <line x1="0" y1="140" x2="280" y2="140" stroke="#475569" stroke-width="2"/>
          <line x1="0" y1="210" x2="280" y2="210" stroke="#475569" stroke-width="2"/>

          <!-- Queens Placed -->
          <text x="35" y="47" font-size="36" text-anchor="middle">👑</text>
          <text x="175" y="117" font-size="36" text-anchor="middle">👑</text>
          <text x="105" y="187" font-size="36" text-anchor="middle">👑</text>
          <text x="245" y="257" font-size="36" text-anchor="middle">👑</text>

          <!-- Cross marks in empty cells -->
          <text x="105" y="45" fill="#64748b" font-size="22" font-weight="900" text-anchor="middle">×</text>
          <text x="175" y="45" fill="#64748b" font-size="22" font-weight="900" text-anchor="middle">×</text>
          <text x="35" y="115" fill="#64748b" font-size="22" font-weight="900" text-anchor="middle">×</text>
          <text x="245" y="115" fill="#64748b" font-size="22" font-weight="900" text-anchor="middle">×</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fde68a" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">👑 NO TOUCHING RULES</text>
      `;
    }
    case "game-sudoku": {
      // 6x6 Sudoku Grid
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
          <!-- Grid lines -->
          <line x1="46" y1="0" x2="46" y2="280" stroke="#334155" stroke-width="1"/>
          <line x1="93" y1="0" x2="93" y2="280" stroke="#334155" stroke-width="1"/>
          <line x1="140" y1="0" x2="140" y2="280" stroke="#38bdf8" stroke-width="3"/>
          <line x1="186" y1="0" x2="186" y2="280" stroke="#334155" stroke-width="1"/>
          <line x1="233" y1="0" x2="233" y2="280" stroke="#334155" stroke-width="1"/>

          <line x1="0" y1="46" x2="280" y2="46" stroke="#334155" stroke-width="1"/>
          <line x1="0" y1="93" x2="280" y2="93" stroke="#38bdf8" stroke-width="3"/>
          <line x1="0" y1="140" x2="280" y2="140" stroke="#334155" stroke-width="1"/>
          <line x1="0" y1="186" x2="280" y2="186" stroke="#38bdf8" stroke-width="3"/>
          <line x1="0" y1="233" x2="280" y2="233" stroke="#334155" stroke-width="1"/>

          <!-- Digits -->
          <text x="23" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">5</text>
          <text x="70" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">3</text>
          <text x="163" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">1</text>
          <text x="210" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">4</text>

          <text x="117" y="78" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">2</text>
          <text x="256" y="78" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">6</text>

          <text x="23" y="125" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">1</text>
          <text x="163" y="125" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">6</text>
          <text x="210" y="125" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">2</text>

          <text x="70" y="172" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">4</text>
          <text x="256" y="172" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">5</text>

          <text x="23" y="218" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">2</text>
          <text x="117" y="218" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">5</text>
          <text x="210" y="218" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">3</text>

          <text x="70" y="264" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">6</text>
          <text x="163" y="264" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">4</text>
          <text x="256" y="264" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">1</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="205" y="398" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🔢 6×6 LOGIC FIELD</text>
      `;
    }
    case "game-strands": {
      // Strands word path thread
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#162032" stroke="#06b6d4" stroke-width="2"/>
          <!-- Glowing thread path line -->
          <path d="M 35 35 L 105 35 L 175 105 L 175 175 L 245 245" fill="none" stroke="#eab308" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
          <path d="M 35 35 L 105 35 L 175 105 L 175 175 L 245 245" fill="none" stroke="#facc15" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Letter nodes -->
          <circle cx="35" cy="35" r="24" fill="#eab308"/>
          <text x="35" y="43" fill="#0b1020" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">S</text>

          <circle cx="105" cy="35" r="24" fill="#eab308"/>
          <text x="105" y="43" fill="#0b1020" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">P</text>

          <circle cx="175" cy="35" r="20" fill="#1e293b" stroke="#334155" stroke-width="2"/>
          <text x="175" y="42" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="18" font-weight="700" text-anchor="middle">A</text>

          <circle cx="245" cy="35" r="20" fill="#1e293b" stroke="#334155" stroke-width="2"/>
          <text x="245" y="42" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="18" font-weight="700" text-anchor="middle">C</text>

          <circle cx="175" cy="105" r="24" fill="#eab308"/>
          <text x="175" y="113" fill="#0b1020" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">A</text>

          <circle cx="175" cy="175" r="24" fill="#eab308"/>
          <text x="175" y="183" fill="#0b1020" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">N</text>

          <circle cx="245" cy="245" r="24" fill="#eab308"/>
          <text x="245" y="253" fill="#0b1020" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">G</text>
        </g>
        <rect x="90" y="375" width="230" height="34" rx="17" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fef08a" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">✨ SPANGRAM DISCOVERED</text>
      `;
    }
    case "game-tango": {
      // Sun & Moon binary logic
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#1e293b" stroke="#ec4899" stroke-width="2"/>
          <!-- Cells with Sun and Moon -->
          <circle cx="46" cy="46" r="26" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="2"/>
          <text x="46" y="55" font-size="26" text-anchor="middle">☀️</text>

          <text x="93" y="52" fill="#ec4899" font-family="system-ui, sans-serif" font-size="20" font-weight="900" text-anchor="middle">=</text>

          <circle cx="140" cy="46" r="26" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="2"/>
          <text x="140" y="55" font-size="26" text-anchor="middle">☀️</text>

          <text x="186" y="52" fill="#ec4899" font-family="system-ui, sans-serif" font-size="20" font-weight="900" text-anchor="middle">×</text>

          <circle cx="233" cy="46" r="26" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" stroke-width="2"/>
          <text x="233" y="55" font-size="26" text-anchor="middle">🌙</text>

          <!-- Row 2 -->
          <circle cx="46" cy="140" r="26" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" stroke-width="2"/>
          <text x="46" y="149" font-size="26" text-anchor="middle">🌙</text>

          <circle cx="140" cy="140" r="26" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="2"/>
          <text x="140" y="149" font-size="26" text-anchor="middle">☀️</text>

          <circle cx="233" cy="140" r="26" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" stroke-width="2"/>
          <text x="233" y="149" font-size="26" text-anchor="middle">🌙</text>

          <!-- Row 3 -->
          <circle cx="46" cy="233" r="26" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="2"/>
          <text x="46" y="242" font-size="26" text-anchor="middle">☀️</text>

          <circle cx="140" cy="233" r="26" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" stroke-width="2"/>
          <text x="140" y="242" font-size="26" text-anchor="middle">🌙</text>

          <circle cx="233" cy="233" r="26" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="2"/>
          <text x="233" y="242" font-size="26" text-anchor="middle">☀️</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(236, 72, 153, 0.18)" stroke="#ec4899" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fbcfe8" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">⚖️ EQUAL DUAL BALANCE</text>
      `;
    }
    case "game-patches": {
      // Geometric exact cover quilt
      return `
        <g transform="translate(65, 45)">
          <!-- Patch 1: Teal 2x3 -->
          <rect x="0" y="0" width="135" height="195" rx="8" fill="#14b8a6" stroke="#0d9488" stroke-width="2" opacity="0.85"/>
          <text x="67" y="105" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">6</text>

          <!-- Patch 2: Amber 2x1 -->
          <rect x="145" y="0" width="135" height="95" rx="8" fill="#f59e0b" stroke="#d97706" stroke-width="2" opacity="0.85"/>
          <text x="212" y="55" fill="#0b1020" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">2</text>

          <!-- Patch 3: Rose 2x1 -->
          <rect x="145" y="105" width="135" height="90" rx="8" fill="#f43f5e" stroke="#e11d48" stroke-width="2" opacity="0.85"/>
          <text x="212" y="155" fill="#0b1020" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">2</text>

          <!-- Patch 4: Violet 4x1 -->
          <rect x="0" y="205" width="280" height="75" rx="8" fill="#a855f7" stroke="#9333ea" stroke-width="2" opacity="0.85"/>
          <text x="140" y="250" fill="#0b1020" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">4</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(20, 184, 166, 0.18)" stroke="#14b8a6" stroke-width="1.5"/>
        <text x="205" y="398" fill="#99f6e4" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🧩 EXACT COVER QUILT</text>
      `;
    }
    case "game-zip": {
      // Zip labyrinth route
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
          <!-- Path -->
          <path d="M 40 40 L 140 40 L 140 140 L 40 140 L 40 240 L 240 240 L 240 140 L 240 40" fill="none" stroke="#818cf8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
          <path d="M 40 40 L 140 40 L 140 140 L 40 140 L 40 240 L 240 240 L 240 140 L 240 40" fill="none" stroke="#c7d2fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

          <circle cx="40" cy="40" r="18" fill="#6366f1"/>
          <text x="40" y="46" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">1</text>

          <circle cx="140" cy="40" r="18" fill="#6366f1"/>
          <text x="140" y="46" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">2</text>

          <circle cx="140" cy="140" r="18" fill="#6366f1"/>
          <text x="140" y="146" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">3</text>

          <circle cx="40" cy="240" r="18" fill="#6366f1"/>
          <text x="40" y="246" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">4</text>

          <circle cx="240" cy="40" r="20" fill="#10b981" filter="drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))"/>
          <text x="240" y="46" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">🏁</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(99, 102, 241, 0.18)" stroke="#6366f1" stroke-width="1.5"/>
        <text x="205" y="398" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">⚡ CONTINUOUS ROUTE</text>
      `;
    }
    case "game-wend": {
      // Wend orthogonal word trail
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#14230e" stroke="#84cc16" stroke-width="2"/>
          <path d="M 40 40 L 140 40 L 240 40 L 240 140 L 140 140 L 40 140 L 40 240 L 140 240 L 240 240" fill="none" stroke="#84cc16" stroke-width="10" stroke-linecap="round" opacity="0.3"/>

          <rect x="15" y="15" width="50" height="50" rx="10" fill="#84cc16"/>
          <text x="40" y="48" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">W</text>

          <rect x="115" y="15" width="50" height="50" rx="10" fill="#84cc16"/>
          <text x="140" y="48" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">O</text>

          <rect x="215" y="15" width="50" height="50" rx="10" fill="#84cc16"/>
          <text x="240" y="48" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">R</text>

          <rect x="215" y="115" width="50" height="50" rx="10" fill="#84cc16"/>
          <text x="240" y="148" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">D</text>

          <rect x="115" y="115" width="50" height="50" rx="10" fill="#84cc16"/>
          <text x="140" y="148" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">S</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(132, 204, 22, 0.18)" stroke="#84cc16" stroke-width="1.5"/>
        <text x="205" y="398" fill="#d9f99d" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🌱 ZERO LEFTOVER TILES</text>
      `;
    }
    case "game-chess": {
      // Chess tactical diagram
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#291404" stroke="#f97316" stroke-width="2"/>
          <rect x="0" y="0" width="140" height="140" fill="#431407" opacity="0.6"/>
          <rect x="140" y="140" width="140" height="140" fill="#431407" opacity="0.6"/>

          <text x="70" y="100" font-size="72" text-anchor="middle">♞</text>
          <text x="210" y="100" font-size="72" text-anchor="middle">♚</text>
          <text x="70" y="240" font-size="72" text-anchor="middle">♛</text>

          <!-- Attack Arrow -->
          <line x1="85" y1="85" x2="185" y2="85" stroke="#f97316" stroke-width="5" stroke-dasharray="6,4"/>
          <polygon points="195,85 180,78 180,92" fill="#f97316"/>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(249, 115, 22, 0.18)" stroke="#f97316" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fed7aa" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">⚔️ MATE IN 2 MOVES</text>
      `;
    }
    case "game-nonogram": {
      // Nonogram pixel logic
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#0c2338" stroke="#0ea5e9" stroke-width="2"/>
          <!-- Shaded Pixel Art: Heart shape -->
          <rect x="60" y="60" width="45" height="45" rx="6" fill="#0ea5e9"/>
          <rect x="115" y="60" width="45" height="45" rx="6" fill="#0ea5e9"/>
          <rect x="170" y="60" width="45" height="45" rx="6" fill="#0ea5e9"/>

          <rect x="60" y="115" width="45" height="45" rx="6" fill="#0ea5e9"/>
          <rect x="115" y="115" width="45" height="45" rx="6" fill="#0ea5e9"/>
          <rect x="170" y="115" width="45" height="45" rx="6" fill="#0ea5e9"/>

          <rect x="115" y="170" width="45" height="45" rx="6" fill="#0ea5e9"/>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(14, 165, 233, 0.18)" stroke="#0ea5e9" stroke-width="1.5"/>
        <text x="205" y="398" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🎨 PIXEL ART REVEAL</text>
      `;
    }
    case "game-orbit-dash": {
      // 3D cyber tunnel perspective
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#180c2e" stroke="#c084fc" stroke-width="2"/>
          <!-- Perspective tunnel lines -->
          <line x1="0" y1="0" x2="140" y2="140" stroke="#c084fc" stroke-width="2" opacity="0.6"/>
          <line x1="280" y1="0" x2="140" y2="140" stroke="#c084fc" stroke-width="2" opacity="0.6"/>
          <line x1="0" y1="280" x2="140" y2="140" stroke="#c084fc" stroke-width="2" opacity="0.6"/>
          <line x1="280" y1="280" x2="140" y2="140" stroke="#c084fc" stroke-width="2" opacity="0.6"/>

          <rect x="70" y="70" width="140" height="140" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.5"/>
          <rect x="105" y="105" width="70" height="70" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.8"/>

          <!-- Cyber Ship -->
          <polygon points="140,195 125,230 155,230" fill="#e879f9" filter="drop-shadow(0 0 10px #e879f9)"/>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(192, 132, 252, 0.18)" stroke="#c084fc" stroke-width="1.5"/>
        <text x="205" y="398" fill="#f5d0fe" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🚀 60 FPS ARCADE RUNNER</text>
      `;
    }
    case "game-crossword": {
      // 5x5 Crossword Mini Grid
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
          <!-- Grid lines -->
          <line x1="56" y1="0" x2="56" y2="280" stroke="#334155" stroke-width="2"/>
          <line x1="112" y1="0" x2="112" y2="280" stroke="#334155" stroke-width="2"/>
          <line x1="168" y1="0" x2="168" y2="280" stroke="#334155" stroke-width="2"/>
          <line x1="224" y1="0" x2="224" y2="280" stroke="#334155" stroke-width="2"/>

          <line x1="0" y1="56" x2="280" y2="56" stroke="#334155" stroke-width="2"/>
          <line x1="0" y1="112" x2="280" y2="112" stroke="#334155" stroke-width="2"/>
          <line x1="0" y1="168" x2="280" y2="168" stroke="#334155" stroke-width="2"/>
          <line x1="0" y1="224" x2="280" y2="224" stroke="#334155" stroke-width="2"/>

          <!-- Black cells -->
          <rect x="0" y="224" width="56" height="56" fill="#0b1020"/>
          <rect x="224" y="0" width="56" height="56" fill="#0b1020"/>
          <rect x="112" y="112" width="56" height="56" fill="#0b1020"/>

          <!-- Clue Numbers and letters -->
          <text x="8" y="18" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="700">1</text>
          <text x="28" y="42" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">S</text>

          <text x="64" y="18" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="700">2</text>
          <text x="84" y="42" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">T</text>

          <text x="120" y="18" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="700">3</text>
          <text x="140" y="42" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">A</text>

          <text x="176" y="18" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="700">4</text>
          <text x="196" y="42" fill="#0b1020" font-family="system-ui, sans-serif" font-size="26" font-weight="900" text-anchor="middle">R</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(199, 243, 107, 0.18)" stroke="#c7f36b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#ecfccb" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">📰 DAILY 5×5 SPEED RUN</text>
      `;
    }
    case "game-logic-lab": {
      // Circuit & logic nodes
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <!-- Circuit lines -->
          <circle cx="70" cy="70" r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <text x="70" y="78" font-size="24" text-anchor="middle">👑</text>

          <circle cx="210" cy="70" r="28" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
          <text x="210" y="78" font-size="24" text-anchor="middle">🐝</text>

          <circle cx="70" cy="210" r="28" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
          <text x="70" y="78" transform="translate(0, 140)" font-size="24" text-anchor="middle">🟩</text>

          <circle cx="210" cy="210" r="28" fill="#1e293b" stroke="#ec4899" stroke-width="2"/>
          <text x="210" y="78" transform="translate(0, 140)" font-size="24" text-anchor="middle">☀️</text>

          <!-- Interconnects -->
          <line x1="98" y1="70" x2="182" y2="70" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6,4"/>
          <line x1="70" y1="98" x2="70" y2="182" stroke="#10b981" stroke-width="3" stroke-dasharray="6,4"/>
          <line x1="210" y1="98" x2="210" y2="182" stroke="#ec4899" stroke-width="3" stroke-dasharray="6,4"/>
          <line x1="98" y1="210" x2="182" y2="210" stroke="#a855f7" stroke-width="3" stroke-dasharray="6,4"/>

          <!-- Central Core -->
          <circle cx="140" cy="140" r="32" fill="#38bdf8" filter="drop-shadow(0 0 15px rgba(56, 189, 248, 0.7))"/>
          <text x="140" y="148" font-size="26" text-anchor="middle">⚡</text>
        </g>
        <rect x="110" y="375" width="190" height="34" rx="17" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="205" y="398" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🧪 CUSTOM LOGIC SANDBOX</text>
      `;
    }
    case "games-hub": {
      // 4-tile bento showcase
      return `
        <g transform="translate(65, 45)">
          <!-- Tile 1: Hive -->
          <rect x="0" y="0" width="132" height="132" rx="12" fill="#1e293b" stroke="#eab308" stroke-width="2"/>
          <text x="66" y="55" font-size="36" text-anchor="middle">🐝</text>
          <text x="66" y="95" fill="#fef08a" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">The Hive</text>

          <!-- Tile 2: Wordle -->
          <rect x="148" y="0" width="132" height="132" rx="12" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
          <text x="214" y="55" font-size="36" text-anchor="middle">🟩</text>
          <text x="214" y="95" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">Wordle Plus</text>

          <!-- Tile 3: Queens -->
          <rect x="0" y="148" width="132" height="132" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
          <text x="66" y="203" font-size="36" text-anchor="middle">👑</text>
          <text x="66" y="243" fill="#fde68a" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">Queens</text>

          <!-- Tile 4: Connections -->
          <rect x="148" y="148" width="132" height="132" rx="12" fill="#1e293b" stroke="#a855f7" stroke-width="2"/>
          <text x="214" y="203" font-size="36" text-anchor="middle">🔠</text>
          <text x="214" y="243" fill="#e9d5ff" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">Connections</text>
        </g>
        <rect x="100" y="375" width="210" height="34" rx="17" fill="rgba(199, 243, 107, 0.18)" stroke="#c7f36b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#ecfccb" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🎮 15+ DAILY LOGIC GAMES</text>
      `;
    }
    case "developer": {
      // Developer Code & Terminal Window
      return `
        <g transform="translate(45, 45)">
          <rect x="0" y="0" width="320" height="280" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
          <!-- Window controls -->
          <circle cx="20" cy="18" r="5" fill="#ef4444"/>
          <circle cx="36" cy="18" r="5" fill="#f59e0b"/>
          <circle cx="52" cy="18" r="5" fill="#10b981"/>
          <text x="160" y="22" fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">terminal — dev tools</text>
          <line x1="0" y1="36" x2="320" y2="36" stroke="#1e293b" stroke-width="1.5"/>

          <!-- Code Snippet -->
          <text x="20" y="70" fill="#c7f36b" font-family="monospace" font-size="14" font-weight="700">&gt; jwt.verify(token, secret)</text>
          <text x="20" y="98" fill="#38bdf8" font-family="monospace" font-size="13">✓ Status: Signature Valid</text>
          <text x="20" y="125" fill="#e2e8f0" font-family="monospace" font-size="13">{ "role": "admin", "exp": 178920 }</text>

          <line x1="20" y1="150" x2="300" y2="150" stroke="#1e293b" stroke-width="1"/>

          <text x="20" y="180" fill="#c7f36b" font-family="monospace" font-size="14" font-weight="700">&gt; regex.match(/^[a-z0-9]+/)</text>
          <text x="20" y="208" fill="#facc15" font-family="monospace" font-size="13">3 matches · 0 backtracking</text>

          <line x1="20" y1="230" x2="300" y2="230" stroke="#1e293b" stroke-width="1"/>
          <text x="20" y="258" fill="#94a3b8" font-family="monospace" font-size="13">&gt; cron("0 0 * * 1") → "Every Mon"</text>
        </g>
        <rect x="100" y="375" width="210" height="34" rx="17" fill="rgba(199, 243, 107, 0.18)" stroke="#c7f36b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#ecfccb" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">💻 DEV TOOLS &amp; DECODERS</text>
      `;
    }
    case "pdf": {
      // PDF & Document Studio
      return `
        <g transform="translate(65, 45)">
          <!-- Document Stack -->
          <rect x="40" y="40" width="200" height="230" rx="10" fill="#1e293b" stroke="#334155" stroke-width="2"/>
          <rect x="20" y="20" width="200" height="230" rx="10" fill="#1e293b" stroke="#475569" stroke-width="2"/>
          <rect x="0" y="0" width="200" height="230" rx="10" fill="#0f172a" stroke="#f43f5e" stroke-width="2.5"/>

          <!-- PDF Badge -->
          <rect x="25" y="30" width="70" height="32" rx="6" fill="#f43f5e"/>
          <text x="60" y="52" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">PDF</text>

          <!-- Text lines representation -->
          <line x1="25" y1="90" x2="175" y2="90" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>
          <line x1="25" y1="115" x2="150" y2="115" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>
          <line x1="25" y1="140" x2="165" y2="140" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>

          <!-- Security Privacy Shield -->
          <circle cx="150" cy="180" r="32" fill="#0f172a" stroke="#10b981" stroke-width="3" filter="drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))"/>
          <text x="150" y="188" font-size="28" text-anchor="middle">🔒</text>
        </g>
        <rect x="80" y="375" width="250" height="34" rx="17" fill="rgba(244, 63, 94, 0.18)" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fecdd3" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🛡️ 100% IN-BROWSER PDF.JS</text>
      `;
    }
    case "regional": {
      // Regional & India Tools: Rupee, GST, Stamp, Photo
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#1c1917" stroke="#f59e0b" stroke-width="2"/>

          <!-- Rupee Coin Icon -->
          <circle cx="80" cy="80" r="45" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="3"/>
          <text x="80" y="98" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="52" font-weight="900" text-anchor="middle">₹</text>

          <!-- GST Badge Card -->
          <rect x="150" y="40" width="115" height="75" rx="10" fill="#292524" stroke="#f59e0b" stroke-width="1.5"/>
          <text x="207" y="70" fill="#fde68a" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">GST TAX</text>
          <text x="207" y="96" fill="#ca8a04" font-family="monospace" font-size="14" font-weight="800" text-anchor="middle">3% · 18% · 28%</text>

          <!-- Passport Resizer Card -->
          <rect x="25" y="150" width="110" height="105" rx="8" fill="#292524" stroke="#78716c" stroke-width="1.5"/>
          <circle cx="80" cy="188" r="18" fill="#44403c"/>
          <path d="M 55 235 Q 80 215 105 235" fill="#44403c"/>
          <text x="80" y="245" fill="#a8a29e" font-family="monospace" font-size="10" text-anchor="middle">3.5 × 4.5 cm</text>

          <!-- Land Area Card -->
          <rect x="150" y="150" width="115" height="105" rx="8" fill="#292524" stroke="#78716c" stroke-width="1.5"/>
          <text x="207" y="185" fill="#fef08a" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">LAND CONVERT</text>
          <text x="207" y="210" fill="#a8a29e" font-family="monospace" font-size="12" text-anchor="middle">Bigha • Guntha</text>
          <text x="207" y="232" fill="#a8a29e" font-family="monospace" font-size="12" text-anchor="middle">Sq. Feet • Acre</text>
        </g>
        <rect x="90" y="375" width="230" height="34" rx="17" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#fde68a" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🇮🇳 REGIONAL &amp; INDIA UTILITIES</text>
      `;
    }
    case "image": {
      // Image Studio: Crop, Color, EXIF
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#082f49" stroke="#38bdf8" stroke-width="2"/>

          <!-- Aperture / Camera Lens -->
          <circle cx="140" cy="120" r="60" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
          <circle cx="140" cy="120" r="40" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="6,4"/>
          <circle cx="140" cy="120" r="20" fill="#38bdf8"/>

          <!-- Crop Handles -->
          <path d="M 30 50 L 30 30 L 50 30" fill="none" stroke="#f8fafc" stroke-width="4"/>
          <path d="M 250 50 L 250 30 L 230 30" fill="none" stroke="#f8fafc" stroke-width="4"/>
          <path d="M 30 190 L 30 210 L 50 210" fill="none" stroke="#f8fafc" stroke-width="4"/>
          <path d="M 250 190 L 250 210 L 230 210" fill="none" stroke="#f8fafc" stroke-width="4"/>

          <!-- Palette Swatches -->
          <circle cx="70" cy="245" r="16" fill="#ef4444"/>
          <circle cx="115" cy="245" r="16" fill="#f59e0b"/>
          <circle cx="160" cy="245" r="16" fill="#10b981"/>
          <circle cx="205" cy="245" r="16" fill="#3b82f6"/>
        </g>
        <rect x="90" y="375" width="230" height="34" rx="17" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="205" y="398" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">📷 IMAGE TOOLS &amp; STRIP EXIF</text>
      `;
    }
    case "daily": {
      // Daily Utilities: Calculator & Converters
      return `
        <g transform="translate(65, 45)">
          <rect x="0" y="0" width="280" height="280" rx="14" fill="#2e1065" stroke="#a855f7" stroke-width="2"/>

          <!-- Calculator Display -->
          <rect x="30" y="25" width="220" height="60" rx="8" fill="#0f172a" stroke="#6b21a8" stroke-width="2"/>
          <text x="235" y="66" fill="#c084fc" font-family="monospace" font-size="28" font-weight="800" text-anchor="end">1,248.50 %</text>

          <!-- Buttons -->
          <rect x="30" y="105" width="45" height="45" rx="8" fill="#581c87"/>
          <text x="52" y="135" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">7</text>

          <rect x="88" y="105" width="45" height="45" rx="8" fill="#581c87"/>
          <text x="110" y="135" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">8</text>

          <rect x="146" y="105" width="45" height="45" rx="8" fill="#581c87"/>
          <text x="168" y="135" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">9</text>

          <rect x="205" y="105" width="45" height="45" rx="8" fill="#9333ea"/>
          <text x="227" y="135" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">÷</text>

          <rect x="30" y="165" width="45" height="45" rx="8" fill="#581c87"/>
          <text x="52" y="195" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">4</text>

          <rect x="88" y="165" width="45" height="45" rx="8" fill="#581c87"/>
          <text x="110" y="195" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">5</text>

          <rect x="146" y="165" width="45" height="45" rx="8" fill="#581c87"/>
          <text x="168" y="195" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">6</text>

          <rect x="205" y="165" width="45" height="45" rx="8" fill="#9333ea"/>
          <text x="227" y="195" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">×</text>

          <rect x="30" y="225" width="103" height="40" rx="8" fill="#c084fc"/>
          <text x="81" y="251" fill="#0b1020" font-family="system-ui, sans-serif" font-size="18" font-weight="900" text-anchor="middle">EMI / Tip</text>

          <rect x="146" y="225" width="104" height="40" rx="8" fill="#9333ea"/>
          <text x="198" y="251" fill="#ffffff" font-family="system-ui, sans-serif" font-size="18" font-weight="900" text-anchor="middle">=</text>
        </g>
        <rect x="100" y="375" width="210" height="34" rx="17" fill="rgba(168, 85, 247, 0.18)" stroke="#a855f7" stroke-width="1.5"/>
        <text x="205" y="398" fill="#e9d5ff" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">⚡ FAST EVERYDAY CALCULATORS</text>
      `;
    }
    case "tools-hub": {
      // 5-bay foundry grid
      return `
        <g transform="translate(45, 45)">
          <rect x="0" y="0" width="320" height="280" rx="14" fill="#0f172a" stroke="#c7f36b" stroke-width="2"/>
          <rect x="15" y="15" width="135" height="75" rx="8" fill="#1e293b"/>
          <text x="82" y="48" font-size="22" text-anchor="middle">💻</text>
          <text x="82" y="74" fill="#c7f36b" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">Developer Tools</text>

          <rect x="170" y="15" width="135" height="75" rx="8" fill="#1e293b"/>
          <text x="237" y="48" font-size="22" text-anchor="middle">📄</text>
          <text x="237" y="74" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">PDF &amp; Docs</text>

          <rect x="15" y="105" width="135" height="75" rx="8" fill="#1e293b"/>
          <text x="82" y="138" font-size="22" text-anchor="middle">📷</text>
          <text x="82" y="164" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">Image Studio</text>

          <rect x="170" y="105" width="135" height="75" rx="8" fill="#1e293b"/>
          <text x="237" y="138" font-size="22" text-anchor="middle">₹</text>
          <text x="237" y="164" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">India / GST</text>

          <rect x="15" y="195" width="290" height="70" rx="8" fill="#1e293b"/>
          <text x="160" y="228" font-size="22" text-anchor="middle">🧮</text>
          <text x="160" y="254" fill="#a855f7" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Daily Utilities &amp; Calculators</text>
        </g>
        <rect x="100" y="375" width="210" height="34" rx="17" fill="rgba(199, 243, 107, 0.18)" stroke="#c7f36b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#ecfccb" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🔧 50+ IN-BROWSER UTILITIES</text>
      `;
    }
    default: {
      // Default Galaxy orbital system
      return `
        <g transform="translate(205, 205)">
          <!-- Orbital rings -->
          <circle cx="0" cy="0" r="140" fill="none" stroke="#334155" stroke-width="1.5" opacity="0.6"/>
          <circle cx="0" cy="0" r="100" fill="none" stroke="#c7f36b" stroke-width="2" stroke-dasharray="8,6" opacity="0.8"/>
          <circle cx="0" cy="0" r="60" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>

          <!-- Glowing Central Star -->
          <circle cx="0" cy="0" r="28" fill="#c7f36b" filter="drop-shadow(0 0 20px #c7f36b)"/>
          <circle cx="0" cy="0" r="14" fill="#ffffff"/>

          <!-- Orbiting Satellites -->
          <circle cx="70" cy="-70" r="12" fill="#38bdf8" filter="drop-shadow(0 0 10px #38bdf8)"/>
          <circle cx="-90" cy="40" r="10" fill="#f59e0b" filter="drop-shadow(0 0 8px #f59e0b)"/>
          <circle cx="30" cy="135" r="14" fill="#a855f7" filter="drop-shadow(0 0 10px #a855f7)"/>
        </g>
        <rect x="90" y="375" width="230" height="34" rx="17" fill="rgba(199, 243, 107, 0.18)" stroke="#c7f36b" stroke-width="1.5"/>
        <text x="205" y="398" fill="#ecfccb" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">🪐 ORBITAL PRIVACY WORKBENCH</text>
      `;
    }
  }
}

function generateSvgForDefinition(def: OgImageDefinition): string {
  const safeTitle = escapeXml(def.title);
  const safeBadge = escapeXml(def.categoryBadge);
  const safeSubtitle = escapeXml(def.subtitle);

  const tagsMarkup = def.tags
    .slice(0, 4)
    .map((tag) => {
      const safeTag = escapeXml(tag);
      return `
      <g>
        <rect height="30" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" width="${safeTag.length * 9.5 + 24}"/>
        <text x="${(safeTag.length * 9.5 + 24) / 2}" y="19" fill="#f4f2ea" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" text-anchor="middle">${safeTag}</text>
      </g>
    `;
    });

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="glow-${def.id}" cx="80%" cy="30%" r="65%">
      <stop offset="0%" stop-color="${def.accentColor}" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#0b1020" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cardGrad-${def.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141c30" />
      <stop offset="100%" stop-color="#0d1424" />
    </linearGradient>
  </defs>

  <!-- Base Dark Canvas -->
  <rect width="1200" height="630" fill="#0b1020" />
  <rect width="1200" height="630" fill="url(#glow-${def.id})" />

  <!-- Subtle Ambient Grid Lines -->
  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    <line x1="100" y1="0" x2="100" y2="630" />
    <line x1="250" y1="0" x2="250" y2="630" />
    <line x1="400" y1="0" x2="400" y2="630" />
    <line x1="550" y1="0" x2="550" y2="630" />
    <line x1="700" y1="0" x2="700" y2="630" />
    <line x1="850" y1="0" x2="850" y2="630" />
    <line x1="1000" y1="0" x2="1000" y2="630" />
    <line x1="0" y1="120" x2="1200" y2="120" />
    <line x1="0" y1="240" x2="1200" y2="240" />
    <line x1="0" y1="360" x2="1200" y2="360" />
    <line x1="0" y1="480" x2="1200" y2="480" />
  </g>

  <!-- Outer Card Frame Border -->
  <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="rgba(255, 255, 255, 0.1)" stroke-width="2" />

  <!-- Top Navigation / Brand Header -->
  <g transform="translate(60, 62)">
    <!-- Orbital Mark Logo Icon -->
    <circle cx="16" cy="16" r="16" fill="${def.accentColor}" opacity="0.15" />
    <circle cx="16" cy="16" r="8" fill="${def.accentColor}" />
    <circle cx="27" cy="7" r="3.5" fill="#ffffff" />
    <ellipse cx="16" cy="16" rx="15" ry="6" fill="none" stroke="${def.accentColor}" stroke-width="1.5" transform="rotate(-25 16 16)" />

    <!-- Site Title -->
    <text x="44" y="23" fill="#f4f2ea" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" letter-spacing="2">TOOLBOX GALAXY</text>
  </g>

  <!-- Category Badge (Top Right) -->
  <g transform="translate(800, 52)">
    <rect x="0" y="0" width="340" height="38" rx="19" fill="${def.badgeBg}" stroke="${def.accentColor}" stroke-width="1.5" />
    <text x="170" y="24" fill="${def.accentColor}" font-family="monospace, system-ui, sans-serif" font-size="13" font-weight="800" letter-spacing="1.2" text-anchor="middle">${safeBadge}</text>
  </g>

  <!-- Left Main Content Column -->
  <g transform="translate(60, 160)">
    <!-- Eyebrow Sub-tag -->
    <text x="0" y="20" fill="rgba(244, 242, 234, 0.55)" font-family="monospace, sans-serif" font-size="13" font-weight="700" letter-spacing="2">IN-BROWSER WORKBENCH // 100% CLIENT-SIDE</text>

    <!-- Main Title -->
    <text x="0" y="80" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-0.5">${safeTitle}</text>

    <!-- Subtitle description (Split into 2 balanced lines if long) -->
    <foreignObject x="0" y="110" width="620" height="110">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; font-size: 20px; line-height: 1.5; color: rgba(244, 242, 234, 0.78); font-weight: 500;">
        ${safeSubtitle}
      </div>
    </foreignObject>

    <!-- Feature Tag Chips -->
    <g transform="translate(0, 235)">
      ${tagsMarkup.reduce(
        (acc, item, idx) => {
          const shiftX = acc.totalWidth;
          const estWidth = (def.tags[idx]?.length || 10) * 9.5 + 24;
          acc.markup += `<g transform="translate(${shiftX}, 0)">${item}</g>`;
          acc.totalWidth += estWidth + 12;
          return acc;
        },
        { markup: "", totalWidth: 0 }
      ).markup}
    </g>

    <!-- Footer URL watermark -->
    <g transform="translate(0, 310)">
      <circle cx="6" cy="-5" r="5" fill="${def.accentColor}" />
      <text x="22" y="0" fill="rgba(244, 242, 234, 0.65)" font-family="monospace, sans-serif" font-size="16" font-weight="600">toolboxgalaxy.com</text>
      <text x="220" y="0" fill="rgba(244, 242, 234, 0.35)" font-family="system-ui, sans-serif" font-size="15">• Zero cloud uploads • No tracking</text>
    </g>
  </g>

  <!-- Right Visual Illustration Panel -->
  <g transform="translate(730, 115)">
    <!-- Card Frame -->
    <rect x="0" y="0" width="410" height="445" rx="20" fill="url(#cardGrad-${def.id})" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2" filter="drop-shadow(0 20px 30px rgba(0, 0, 0, 0.5))" />
    
    <!-- Rendered SVG Illustration specific to this game/category -->
    ${renderVisualIllustration(def.visualType, def.accentColor)}
  </g>
</svg>
`;
}

export async function generateOgImages(): Promise<void> {
  console.log("Generating high-resolution Open Graph / Twitter share images...");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let generatedCount = 0;

  for (const def of ALL_OG_DEFINITIONS) {
    const svgContent = generateSvgForDefinition(def);
    const outputPath = path.join(OUTPUT_DIR, def.filename);

    // Convert SVG to PNG at exact 1200x630 resolution using sharp
    await sharp(Buffer.from(svgContent))
      .resize(1200, 630)
      .png({ quality: 90, compressionLevel: 8 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`[OG GENERATED] ${def.filename.padEnd(34)} (${(stats.size / 1024).toFixed(1)} KB) -> ${def.title}`);
    generatedCount++;
  }

  console.log(`\nSuccessfully generated all ${generatedCount} Open Graph images in:`);
  console.log(`  ${OUTPUT_DIR}\n`);
}

// Allow direct CLI execution: `tsx scripts/generate-og-images.ts`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateOgImages().catch((err) => {
    console.error("Error generating OG images:", err);
    process.exit(1);
  });
}
