// Orbital Workbench: calendar sharing formats only the values already visible in the local summary; no completion keys, puzzle contents, identity, history, or network request is included.
export type WeeklyLogicShareSummary = { weekLabel: string; scopeLabel: string; currentStreak: number; longestStreak: number; completedDays: number; totalCompletedFields: number };
type ShareNavigator = Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };

export function buildWeeklyLogicShareText(summary: WeeklyLogicShareSummary) {
  return `Toolbox Galaxy / Weekly Local Summary\n${summary.scopeLabel} · ${summary.weekLabel}\n${summary.currentStreak}-day current streak · ${summary.longestStreak}-day longest streak\n${summary.completedDays} verified days · ${summary.totalCompletedFields} fields complete\nBuilt only from completed daily editions in this browser.`;
}

export async function shareWeeklyLogicSummary(summary: WeeklyLogicShareSummary) {
  const navigatorWithShare = navigator as ShareNavigator; if (!navigatorWithShare.share) return false;
  try { await navigatorWithShare.share({ title: "Toolbox Galaxy weekly local summary", text: buildWeeklyLogicShareText(summary) }); return true; } catch { return false; }
}

export async function copyWeeklyLogicSummary(summary: WeeklyLogicShareSummary) {
  if (!navigator.clipboard?.writeText) return false;
  try { await navigator.clipboard.writeText(buildWeeklyLogicShareText(summary)); return true; } catch { return false; }
}

export function downloadWeeklyLogicSummary(summary: WeeklyLogicShareSummary) {
  const blob = new Blob([`${buildWeeklyLogicShareText(summary)}\n`], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "toolbox-galaxy-weekly-local-summary.txt"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
