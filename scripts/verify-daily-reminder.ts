import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=======================================================");
console.log("  TOOLBOX GALAXY — DAILY REMINDER NOTIFICATION AUDIT  ");
console.log("=======================================================");

// 1. Verify service-worker.js includes periodicsync and notificationclick
const swPath = path.resolve(process.cwd(), "client/public/service-worker.js");
const swContent = fs.readFileSync(swPath, "utf-8");

assert(
  swContent.includes("periodicsync"),
  "service-worker.js must listen for 'periodicsync' event"
);
assert(
  swContent.includes("daily-puzzle-reminder"),
  "service-worker.js must handle 'daily-puzzle-reminder' tag"
);
assert(
  swContent.includes("notificationclick"),
  "service-worker.js must listen for 'notificationclick' event"
);
assert(
  swContent.includes("showNotification"),
  "service-worker.js must display a notification on periodic sync"
);
console.log("✓ Service Worker verification passed: periodicsync & notificationclick registered.");

// 2. Verify dailyReminder.ts implementation and logic
// Mock browser environment for testing dailyReminder logic
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
const mockNotification = {
  permission: "default" as NotificationPermission,
  requestPermission: async () => "granted" as NotificationPermission,
};

const mockWindow: any = {
  localStorage: mockStorage,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  Notification: mockNotification,
};

Object.defineProperty(globalThis, "window", {
  value: mockWindow,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "CustomEvent", {
  value: class CustomEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  },
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "navigator", {
  value: {
    serviceWorker: {
      getRegistration: async () => null,
      register: async () => ({}),
    },
  },
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Notification", {
  value: mockNotification,
  configurable: true,
  writable: true,
});

// Import modules dynamically after mocking environment
const {
  isNotificationSupported,
  getNotificationPermission,
  isDailyReminderEnabled,
  isDailyReminderDismissed,
  dismissDailyReminderPrompt,
  shouldShowDailyReminderPrompt,
  enableDailyReminder,
  disableDailyReminder,
  getDailyReminderStatus,
  countCompletedDailyPuzzles,
  REMINDER_PERIODIC_TAG,
} = await import("../client/src/lib/dailyReminder");

console.log("👉 Testing notification support detection...");
assert.strictEqual(isNotificationSupported(), true, "Should report supported when Notification and serviceWorker exist");
assert.strictEqual(getNotificationPermission(), "default");

console.log("👉 Testing 2-puzzle completion requirement for prompt...");
// Initially no puzzles completed
mockStorage.clear();
assert.strictEqual(
  shouldShowDailyReminderPrompt(),
  false,
  "Should NOT show prompt when 0 puzzles completed"
);

// With 1 completion
mockStorage.setItem(
  "toolboxgalaxy:puzzle-completions",
  JSON.stringify({ "queens-queens-1:2026-09-14": true })
);
assert.strictEqual(
  shouldShowDailyReminderPrompt(),
  false,
  "Should NOT show prompt when only 1 puzzle completed"
);

// With 2 distinct completed puzzles
mockStorage.setItem(
  "toolboxgalaxy:puzzle-completions",
  JSON.stringify({
    "queens-queens-1:2026-09-14": true,
    "hive-hive-1:2026-09-14": true,
  })
);
assert.strictEqual(
  shouldShowDailyReminderPrompt(),
  true,
  "Should show prompt when at least 2 daily puzzles completed"
);

console.log("👉 Testing prompt dismissal...");
dismissDailyReminderPrompt();
assert.strictEqual(isDailyReminderDismissed(), true, "Dismissed state must be true");
assert.strictEqual(
  shouldShowDailyReminderPrompt(),
  false,
  "Should NOT show prompt after dismissal"
);

console.log("👉 Testing reminder opt-in and toggle...");
mockStorage.removeItem("toolboxgalaxy:daily-reminder-dismissed");
const optInResult = await enableDailyReminder();
assert.strictEqual(optInResult.success, true);
assert.strictEqual(optInResult.permission, "granted");
assert.strictEqual(isDailyReminderEnabled(), true);

const statusAfterOptIn = getDailyReminderStatus();
assert.strictEqual(statusAfterOptIn.isEnabled, true);
assert.strictEqual(statusAfterOptIn.isEligibleForPrompt, false, "Prompt shouldn't show once enabled");

console.log("👉 Testing reminder opt-out...");
await disableDailyReminder();
assert.strictEqual(isDailyReminderEnabled(), false);

console.log("👉 Testing browser unsupported fallback...");
delete mockWindow.Notification;
delete (globalThis as any).Notification;
assert.strictEqual(isNotificationSupported(), false, "Should return false when Notification is missing");
const unsupportedOptIn = await enableDailyReminder();
assert.strictEqual(unsupportedOptIn.success, false);
assert.strictEqual(unsupportedOptIn.permission, "unsupported");

console.log("🎉 ALL DAILY REMINDER TESTS PASSED SUCCESSFULLY!");
