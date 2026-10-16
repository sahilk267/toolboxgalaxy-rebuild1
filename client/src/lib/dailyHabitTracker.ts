// Orbital Workbench: Daily Habit Tracker & Streak Engine
// Manages the Daily Quest Trio (1 Logic Puzzle, 1 Word Puzzle, 1 Tool of the Day),
// streaks, and local persistence without server accounts or external analytics.
import { isPuzzleFieldComplete, readPuzzleCompletionMap } from "@/lib/puzzleCompletion";
import { getToolOfTheDay, getLocalDateKey, getDayNumberSinceEpoch } from "@/lib/toolOfTheDay";

export type DailyQuest = {
  id: string;
  category: "logic" | "word" | "tool";
  title: string;
  subtitle: string;
  href: string;
  badge: string;
  completed: boolean;
};

export type DailyHabitStatus = {
  dateKey: string;
  dateLabel: string;
  streak: number;
  isStreakAtRisk: boolean;
  shields: number;
  shieldEngaged: boolean;
  quests: DailyQuest[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
};

const HABIT_EVENT = "toolboxgalaxy:daily-habit-updated";
const TOOL_VISIT_PREFIX = "toolboxgalaxy:daily-tool-visited:";

export function dailyHabitEventName(): string {
  return HABIT_EVENT;
}

export function notifyHabitUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(HABIT_EVENT));
  }
}

export function markDailyToolVisited(dateKey = getLocalDateKey()) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${TOOL_VISIT_PREFIX}${dateKey}`, "true");
    notifyHabitUpdated();
  } catch {}
}

export function isDailyToolVisited(dateKey = getLocalDateKey()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${TOOL_VISIT_PREFIX}${dateKey}`) === "true";
  } catch {
    return false;
  }
}

/**
 * Deterministically chooses today's 3 quests:
 * 1. Logic puzzle (Queens, Tango, or Mini-Sudoku)
 * 2. Word puzzle (The Hive, Wordle, or Connections)
 * 3. Daily Tool (Tool of the Day)
 */
export function getDailyQuests(date = new Date()): DailyQuest[] {
  const dateKey = getLocalDateKey(date);
  const dayNumber = getDayNumberSinceEpoch(date);

  // 1. Logic Puzzle of the day
  const logicRotation = [
    { id: "queens", title: "Queens", subtitle: "Region Crown Puzzle", href: "/games/queens", badge: "Crowns", slugMatch: "queens" },
    { id: "tango", title: "Tango", subtitle: "Sun & Moon Balance", href: "/games/tango", badge: "Balance", slugMatch: "tango" },
    { id: "mini-sudoku", title: "Mini Sudoku", subtitle: "6×6 Logic Regions", href: "/games/mini-sudoku", badge: "6×6", slugMatch: "mini-sudoku" },
    { id: "patches", title: "Patches", subtitle: "Rectangle Partition", href: "/games/patches", badge: "Grids", slugMatch: "patches" },
  ];
  const logicChoice = logicRotation[((dayNumber % logicRotation.length) + logicRotation.length) % logicRotation.length];

  // 2. Word / Theme Puzzle of the day
  const wordRotation = [
    { id: "the-hive", title: "The Hive", subtitle: "Spelling Bee Genius", href: "/games/the-hive", badge: "Bee", slugMatch: "hive" },
    { id: "orbit-lexicon", title: "Wordle Plus", subtitle: "5-Letter Daily Word", href: "/games/orbit-lexicon", badge: "Wordle", slugMatch: "wordle" },
    { id: "connections", title: "Connections", subtitle: "4 Common Themes", href: "/games/connections", badge: "Themes", slugMatch: "connections" },
    { id: "strands", title: "Strands", subtitle: "Theme Word Search", href: "/games/strands", badge: "Search", slugMatch: "strands" },
  ];
  const wordChoice = wordRotation[(((dayNumber + 1) % wordRotation.length) + wordRotation.length) % wordRotation.length];

  // 3. Tool of the Day
  const tool = getToolOfTheDay(undefined, date);
  const toolTitle = tool ? tool.name : "JSON Validator";
  const toolHref = tool ? `/tools/${tool.slug}` : "/tools/json-to-zod";
  const toolCategory = tool ? tool.category : "Utility";

  // Check completions
  const completions = readPuzzleCompletionMap();
  
  // Logic completion check
  const isLogicComplete = Object.keys(completions).some((key) => {
    return (
      (key.startsWith(`${logicChoice.slugMatch}:`) || key.includes(`-${logicChoice.slugMatch}-`)) &&
      key.includes(dateKey)
    );
  }) || isPuzzleFieldComplete(logicChoice.slugMatch, dateKey);

  // Word completion check
  const isWordComplete = Object.keys(completions).some((key) => {
    return (
      (key.startsWith(`${wordChoice.slugMatch}:`) || key.includes(`-${wordChoice.slugMatch}-`)) &&
      key.includes(dateKey)
    );
  }) || isPuzzleFieldComplete(wordChoice.slugMatch, dateKey);

  // Tool visited check
  const isToolComplete = isDailyToolVisited(dateKey);

  return [
    {
      id: logicChoice.id,
      category: "logic",
      title: logicChoice.title,
      subtitle: logicChoice.subtitle,
      href: logicChoice.href,
      badge: logicChoice.badge,
      completed: isLogicComplete,
    },
    {
      id: wordChoice.id,
      category: "word",
      title: wordChoice.title,
      subtitle: wordChoice.subtitle,
      href: wordChoice.href,
      badge: wordChoice.badge,
      completed: isWordComplete,
    },
    {
      id: "tool-of-the-day",
      category: "tool",
      title: toolTitle,
      subtitle: `${toolCategory} · Daily Pick`,
      href: toolHref,
      badge: "Tool",
      completed: isToolComplete,
    },
  ];
}

const SHIELD_STORAGE_KEY = "toolboxgalaxy:streak-shields";
const SHIELD_USED_PREFIX = "toolboxgalaxy:shield-used:";

export function getStreakShields(): number {
  if (typeof window === "undefined") return 1;
  try {
    const val = localStorage.getItem(SHIELD_STORAGE_KEY);
    if (val === null) {
      localStorage.setItem(SHIELD_STORAGE_KEY, "1");
      return 1;
    }
    return Math.max(0, Number(val) || 0);
  } catch {
    return 1;
  }
}

export function awardStreakShield(): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStreakShields();
    if (current < 2) {
      localStorage.setItem(SHIELD_STORAGE_KEY, String(current + 1));
      notifyHabitUpdated();
    }
  } catch {}
}

/**
 * Calculates continuous day streaks where at least 1 daily activity was performed.
 * Automatically engages a Streak Shield if a single day was missed.
 */
export function calculateDailyHabitStreak(reference = new Date()): {
  streak: number;
  isAtRisk: boolean;
  shieldEngaged: boolean;
} {
  if (typeof window === "undefined") return { streak: 0, isAtRisk: false, shieldEngaged: false };

  const completions = readPuzzleCompletionMap();
  const formatKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const hasActivityOnDate = (dateKey: string): boolean => {
    if (localStorage.getItem(`${TOOL_VISIT_PREFIX}${dateKey}`) === "true") return true;
    if (localStorage.getItem(`${SHIELD_USED_PREFIX}${dateKey}`) === "true") return true;

    return Object.keys(completions).some((key) => {
      const idx = key.lastIndexOf(":");
      if (idx >= 0 && key.slice(idx + 1) === dateKey) return true;
      return key.includes(dateKey);
    });
  };

  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const todayKey = formatKey(today);
  const todayHasActivity = hasActivityOnDate(todayKey);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatKey(yesterday);
  const yesterdayHasActivity = hasActivityOnDate(yesterdayKey);

  let shieldEngaged = false;

  // Auto-shield rescue: If yesterday had no activity, but 2 days ago did, and shields > 0
  if (!yesterdayHasActivity) {
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    if (hasActivityOnDate(formatKey(twoDaysAgo)) && getStreakShields() > 0) {
      try {
        const remaining = getStreakShields() - 1;
        localStorage.setItem(SHIELD_STORAGE_KEY, String(remaining));
        localStorage.setItem(`${SHIELD_USED_PREFIX}${yesterdayKey}`, "true");
        shieldEngaged = true;
      } catch {}
    }
  }

  let count = 0;
  let cursor = new Date(today);

  if (todayHasActivity) {
    while (hasActivityOnDate(formatKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { streak: count, isAtRisk: false, shieldEngaged };
  } else {
    cursor.setDate(cursor.getDate() - 1);
    while (hasActivityOnDate(formatKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { streak: count, isAtRisk: count > 0, shieldEngaged };
  }
}

export function getDailyHabitStatus(reference = new Date()): DailyHabitStatus & {
  shields: number;
  shieldEngaged: boolean;
} {
  const dateKey = getLocalDateKey(reference);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(reference);

  const quests = getDailyQuests(reference);
  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;
  const allDone = completedCount === totalCount;
  const { streak, isAtRisk, shieldEngaged } = calculateDailyHabitStreak(reference);
  const shields = getStreakShields();

  return {
    dateKey,
    dateLabel,
    streak,
    isStreakAtRisk: isAtRisk,
    quests,
    completedCount,
    totalCount,
    allDone,
    shields,
    shieldEngaged,
  };
}
