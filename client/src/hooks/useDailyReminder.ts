import { useState, useEffect, useCallback } from "react";
import {
  getDailyReminderStatus,
  enableDailyReminder,
  disableDailyReminder,
  dismissDailyReminderPrompt,
  checkAndTriggerLocalDailyReminder,
  type DailyReminderStatus,
} from "@/lib/dailyReminder";

export function useDailyReminder() {
  const [status, setStatus] = useState<DailyReminderStatus>(getDailyReminderStatus);
  const [isRequesting, setIsRequesting] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setStatus(getDailyReminderStatus());
  }, []);

  useEffect(() => {
    refresh();

    // Check on startup if a local daily reminder should be shown today
    checkAndTriggerLocalDailyReminder().catch(() => undefined);

    const handleStateChange = () => refresh();
    window.addEventListener("toolboxgalaxy:reminder-state-change", handleStateChange);
    window.addEventListener("storage", handleStateChange);

    return () => {
      window.removeEventListener("toolboxgalaxy:reminder-state-change", handleStateChange);
      window.removeEventListener("storage", handleStateChange);
    };
  }, [refresh]);

  const optIn = useCallback(async () => {
    setIsRequesting(true);
    setNotificationFeedback(null);
    try {
      const result = await enableDailyReminder();
      refresh();
      if (result.message) {
        setNotificationFeedback(result.message);
      }
      return result;
    } finally {
      setIsRequesting(false);
    }
  }, [refresh]);

  const optOut = useCallback(async () => {
    setIsRequesting(true);
    try {
      await disableDailyReminder();
      refresh();
      setNotificationFeedback("Daily reminders disabled.");
    } finally {
      setIsRequesting(false);
    }
  }, [refresh]);

  const dismiss = useCallback(() => {
    dismissDailyReminderPrompt();
    refresh();
  }, [refresh]);

  return {
    ...status,
    isRequesting,
    notificationFeedback,
    optIn,
    optOut,
    dismiss,
    refresh,
  };
}
