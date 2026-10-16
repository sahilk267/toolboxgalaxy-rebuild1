// Orbital Workbench: 100% Local Achievement Badges Engine
// Evaluates player milestones, streaks, and privacy tool actions entirely in-browser.

export type BadgeId =
  | "night-owl"
  | "early-bird"
  | "privacy-purist"
  | "first-win"
  | "streak-warrior"
  | "lightning-solver"
  | "studio-artisan"
  | "workbench-architect"
  | "the-scribe"
  | "community-voice";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  category: "Puzzles" | "Habit" | "Tools" | "Community";
  description: string;
  icon: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-win",
    title: "First Spark",
    category: "Puzzles",
    description: "Solve any daily logic edition or word puzzle in the browser.",
    icon: "🧩",
    rarity: "Common",
  },
  {
    id: "streak-warrior",
    title: "Streak Warrior",
    category: "Habit",
    description: "Maintain a 3-day active daily workbench streak.",
    icon: "🔥",
    rarity: "Rare",
  },
  {
    id: "lightning-solver",
    title: "Lightning Solver",
    category: "Puzzles",
    description: "Solve any logic puzzle in under 90 seconds without guessing.",
    icon: "⚡",
    rarity: "Epic",
  },
  {
    id: "privacy-purist",
    title: "Privacy Purist",
    category: "Tools",
    description: "Clean tracking parameters, strip photo EXIF, or redact a PDF.",
    icon: "🛡️",
    rarity: "Common",
  },
  {
    id: "studio-artisan",
    title: "Studio Artisan",
    category: "Tools",
    description: "Open and use the PDF, Word DOCX, or Excel Document Studio.",
    icon: "🗂️",
    rarity: "Common",
  },
  {
    id: "workbench-architect",
    title: "Workbench Architect",
    category: "Tools",
    description: "Pin 3 or more favorite tools to your personalized Quick Dock.",
    icon: "⭐",
    rarity: "Common",
  },
  {
    id: "the-scribe",
    title: "The Scribe",
    category: "Tools",
    description: "Save a temporary note or JSON snippet in your Quick Scratchpad.",
    icon: "📝",
    rarity: "Common",
  },
  {
    id: "community-voice",
    title: "Community Voice",
    category: "Community",
    description: "Cast a vote in the Next Friday Tool Drop ballot.",
    icon: "🗳️",
    rarity: "Rare",
  },
  {
    id: "night-owl",
    title: "Night Owl",
    category: "Habit",
    description: "Use a tool or solve a puzzle late at night (after 10:00 PM).",
    icon: "🦉",
    rarity: "Rare",
  },
  {
    id: "early-bird",
    title: "Early Riser",
    category: "Habit",
    description: "Complete a daily edition early in the morning (before 8:00 AM).",
    icon: "🌅",
    rarity: "Epic",
  },
];

const STORAGE_KEY = "toolboxgalaxy:achievements-v1";
const BADGE_EVENT = "toolboxgalaxy:badge-unlocked";

export type UnlockedRecord = Record<string, string>; // badgeId -> ISO string date

export function getUnlockedBadges(): UnlockedRecord {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function unlockBadge(id: BadgeId): boolean {
  if (typeof window === "undefined") return false;
  const current = getUnlockedBadges();
  if (current[id]) return false; // Already unlocked

  current[id] = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    const badge = BADGE_DEFINITIONS.find((b) => b.id === id);
    if (badge) {
      window.dispatchEvent(
        new CustomEvent(BADGE_EVENT, { detail: { badge, date: current[id] } })
      );
    }
    return true;
  } catch {
    return false;
  }
}

export function checkTimeBasedBadges() {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) {
    unlockBadge("night-owl");
  } else if (hour >= 5 && hour < 8) {
    unlockBadge("early-bird");
  }
}

export function badgeUnlockedEventName(): string {
  return BADGE_EVENT;
}
