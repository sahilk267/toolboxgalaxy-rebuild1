// Orbital Workbench: client-side daily puzzle reminder opt-in and local scheduling.
// 100% private and device-local: zero network push servers, zero telemetry, zero cookies.

import { logicPersonalBests } from "@/lib/logicPersonalBest";
import { readPuzzleCompletionMap } from "@/lib/puzzleCompletion";

const STORAGE_KEY_ENABLED = "toolboxgalaxy:daily-reminder-enabled";
const STORAGE_KEY_DISMISSED = "toolboxgalaxy:daily-reminder-dismissed";
const STORAGE_KEY_LAST_NOTIFIED = "toolboxgalaxy:daily-reminder-last-notified";
export const REMINDER_PERIODIC_TAG = "daily-puzzle-reminder";

export type DailyReminderStatus = {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isEnabled: boolean;
  isDismissed: boolean;
  hasPeriodicSync: boolean;
  completedDailyCount: number;
  isEligibleForPrompt: boolean;
};

/**
 * Checks if the browser supports notifications and service worker.
 */
export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Gets the current Notification permission state.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  try {
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

/**
 * Checks whether the user has opted in to daily reminders.
 */
export function isDailyReminderEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY_ENABLED) === "true";
  } catch {
    return false;
  }
}

/**
 * Checks whether the user has dismissed the reminder opt-in banner.
 */
export function isDailyReminderDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
  } catch {
    return false;
  }
}

/**
 * Sets the dismissed flag so the user is not badgered again.
 */
export function dismissDailyReminderPrompt(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    window.dispatchEvent(new CustomEvent("toolboxgalaxy:reminder-state-change"));
  } catch {}
}

/**
 * Calculates how many daily puzzle editions the user has completed.
 * Checks both logicPersonalBests and raw puzzleCompletion records to reliably
 * count completions regardless of key format.
 */
export function countCompletedDailyPuzzles(): { distinctGames: number; totalEditions: number } {
  let pbDistinctGames = 0;
  let pbTotalEditions = 0;

  try {
    const records = logicPersonalBests();
    pbDistinctGames = records.filter((r) => r.completedEditions > 0).length;
    pbTotalEditions = records.reduce((sum, r) => sum + r.completedEditions, 0);
  } catch {
    // Graceful fallback to raw map
  }

  try {
    // Also scan raw puzzle completion map for direct entries (e.g. "queens:2026-09-14")
    const rawMap = readPuzzleCompletionMap();
    const rawCompletedKeys = Object.entries(rawMap).filter(([_, v]) => v === true).map(([k]) => k);
    const rawDistinctGames = new Set<string>();
    for (const key of rawCompletedKeys) {
      const separator = key.indexOf(":");
      const slugOrPrefix = separator > 0 ? key.slice(0, separator) : key;
      rawDistinctGames.add(slugOrPrefix);
    }

    const distinctGames = Math.max(pbDistinctGames, rawDistinctGames.size);
    const totalEditions = Math.max(pbTotalEditions, rawCompletedKeys.length);

    return { distinctGames, totalEditions };
  } catch {
    return { distinctGames: pbDistinctGames, totalEditions: pbTotalEditions };
  }
}

/**
 * Checks if the user is eligible to be shown the daily reminder prompt:
 * - Notification API supported
 * - Not already enabled
 * - Not dismissed
 * - Browser permission not previously denied
 * - Has completed at least 2 daily puzzles
 */
export function shouldShowDailyReminderPrompt(): boolean {
  if (!isNotificationSupported()) return false;
  if (isDailyReminderEnabled()) return false;
  if (isDailyReminderDismissed()) return false;
  if (getNotificationPermission() === "denied") return false;

  const { distinctGames, totalEditions } = countCompletedDailyPuzzles();
  // Eligible if completed >= 2 distinct games or >= 2 total puzzle editions
  return distinctGames >= 2 || totalEditions >= 2;
}

/**
 * Registers Periodic Background Sync if available on the platform (e.g. Chrome/Edge PWA).
 */
async function registerPeriodicSync(registration: ServiceWorkerRegistration): Promise<boolean> {
  if (!("periodicSync" in registration)) {
    return false;
  }

  try {
    const periodicSync = (registration as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } }).periodicSync;
    // 24-hour interval in milliseconds
    await periodicSync.register(REMINDER_PERIODIC_TAG, {
      minInterval: 24 * 60 * 60 * 1000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Unregisters Periodic Background Sync if present.
 */
async function unregisterPeriodicSync(registration: ServiceWorkerRegistration): Promise<void> {
  if (!("periodicSync" in registration)) return;
  try {
    const periodicSync = (registration as unknown as { periodicSync: { unregister: (tag: string) => Promise<void> } }).periodicSync;
    await periodicSync.unregister(REMINDER_PERIODIC_TAG);
  } catch {}
}

/**
 * Requests Notification permission and enables daily reminders locally.
 */
export async function enableDailyReminder(): Promise<{
  success: boolean;
  permission: NotificationPermission | "unsupported";
  hasPeriodicSync: boolean;
  message?: string;
}> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      permission: "unsupported",
      hasPeriodicSync: false,
      message: "Notifications are not supported in this browser environment.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      try {
        window.localStorage.setItem(STORAGE_KEY_ENABLED, "false");
        window.dispatchEvent(new CustomEvent("toolboxgalaxy:reminder-state-change"));
      } catch {}

      return {
        success: false,
        permission,
        hasPeriodicSync: false,
        message: permission === "denied"
          ? "Notification permission was blocked in browser settings."
          : "Notification permission was dismissed.",
      };
    }

    // Save opt-in flag locally
    try {
      window.localStorage.setItem(STORAGE_KEY_ENABLED, "true");
      window.localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
      window.dispatchEvent(new CustomEvent("toolboxgalaxy:reminder-state-change"));
    } catch {}

    // Register with service worker if available
    let hasPeriodicSync = false;
    if ("serviceWorker" in navigator) {
      try {
        // Ensure service worker is registered or get existing registration
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register("/service-worker.js");
        }
        if (registration) {
          hasPeriodicSync = await registerPeriodicSync(registration);
        }
      } catch {
        // Best effort service worker registration
      }
    }

    return {
      success: true,
      permission: "granted",
      hasPeriodicSync,
      message: hasPeriodicSync
        ? "Daily reminder enabled with Periodic Background Sync!"
        : "Daily reminder enabled! (Best-effort local device reminder)",
    };
  } catch (error) {
    return {
      success: false,
      permission: getNotificationPermission(),
      hasPeriodicSync: false,
      message: error instanceof Error ? error.message : "Failed to enable notifications.",
    };
  }
}

/**
 * Disables daily reminders locally.
 */
export async function disableDailyReminder(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_ENABLED, "false");
    window.dispatchEvent(new CustomEvent("toolboxgalaxy:reminder-state-change"));

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await unregisterPeriodicSync(registration);
      }
    }
  } catch {}
}

/**
 * Retrieves a full summary of daily reminder status for UI components.
 */
export function getDailyReminderStatus(): DailyReminderStatus {
  const isSupported = isNotificationSupported();
  const permission = getNotificationPermission();
  const isEnabled = isDailyReminderEnabled();
  const isDismissed = isDailyReminderDismissed();
  const { distinctGames, totalEditions } = countCompletedDailyPuzzles();
  const completedDailyCount = totalEditions;
  const isEligibleForPrompt = shouldShowDailyReminderPrompt();

  const hasPeriodicSync =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PeriodicSyncManager" in window;

  return {
    isSupported,
    permission,
    isEnabled,
    isDismissed,
    hasPeriodicSync,
    completedDailyCount,
    isEligibleForPrompt,
  };
}

/**
 * If reminders are enabled and today is a fresh calendar day where the user
 * hasn't yet been notified, trigger a local service worker notification on tab visit.
 */
export async function checkAndTriggerLocalDailyReminder(): Promise<boolean> {
  if (!isDailyReminderEnabled() || getNotificationPermission() !== "granted") {
    return false;
  }

  const today = new Date();
  const todayId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  try {
    const lastNotified = window.localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);
    if (lastNotified === todayId) {
      return false; // Already notified today
    }

    // Check if the user already completed any puzzle today
    const { totalEditions } = countCompletedDailyPuzzles();
    if (totalEditions >= 1) {
      // Record today as notified so we don't alert them after they already played
      window.localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, todayId);
      return false;
    }

    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification("Daily Logic Puzzle Ready! 🧩", {
          body: "Today's fresh set of logic puzzles (Queens, Hive, Wordle & more) is waiting for you!",
          icon: "/orbit-mark.svg",
          badge: "/orbit-mark.svg",
          tag: "daily-puzzle-reminder",
          data: { url: "/games" },
        });
        window.localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, todayId);
        return true;
      }
    }
  } catch {
    // Graceful fallback
  }

  return false;
}
