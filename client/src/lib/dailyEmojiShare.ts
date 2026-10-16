// Orbital Workbench: Viral Spoiler-Free Emoji Share Generator
// Formats high-engagement emoji score cards for Wordle, Queens, Tango, and Daily Quests
// that users can share on WhatsApp, X (Twitter), Slack, or LinkedIn.

export type EmojiSharePayload = {
  title: string;
  subtitle?: string;
  scoreText?: string;
  gridLines?: string[];
  url?: string;
};

export function buildEmojiShareCard(payload: EmojiSharePayload): string {
  const lines: string[] = [];
  lines.push(`${payload.title}`);
  if (payload.subtitle) lines.push(payload.subtitle);
  if (payload.scoreText) lines.push(payload.scoreText);
  if (payload.gridLines && payload.gridLines.length > 0) {
    lines.push("");
    lines.push(...payload.gridLines);
  }
  lines.push("");
  lines.push(`Play free in browser (zero ads):`);
  lines.push(payload.url || "https://toolboxgalaxy.com");
  return lines.join("\n");
}

export function buildQueensEmojiGrid(size: number, queenCols: number[]): string[] {
  // queenCols[row] = col index where queen was placed
  return queenCols.map((col) => {
    return Array.from({ length: size }, (_, c) => (c === col ? "👑" : "🟩")).join("");
  });
}

export function buildTangoEmojiGrid(grid: ("S" | "M" | "")[][]): string[] {
  return grid.map((row) =>
    row.map((cell) => (cell === "S" ? "☀️" : cell === "M" ? "🌙" : "▫️")).join("")
  );
}

export function buildDailyHabitStreakShare(streak: number, completedCount: number, totalCount: number): string {
  const flame = streak > 0 ? "🔥".repeat(Math.min(streak, 5)) : "⚡";
  const progressEmoji = completedCount === totalCount ? "🏆 100% Complete" : `⚡ ${completedCount}/${totalCount} Quests Done`;

  return [
    `Toolbox Galaxy Daily Habit ${flame}`,
    `Streak: ${streak} ${streak === 1 ? "day" : "days"} · ${progressEmoji}`,
    "",
    completedCount === totalCount
      ? "🟩🟩🟩 Perfect Daily Clean Sweep!"
      : "🟩".repeat(completedCount) + "⬜".repeat(totalCount - completedCount) + " Today's Progress",
    "",
    "100% private, zero-tracking daily workbench:",
    "https://toolboxgalaxy.com",
  ].join("\n");
}

export async function copyEmojiShareText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}
