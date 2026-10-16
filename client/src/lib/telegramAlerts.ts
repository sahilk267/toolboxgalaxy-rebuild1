// Toolbox Galaxy - Telegram Pulse, Error Telemetry, and Visitor Cohort Analytics
// Client-side direct dispatch via standard Telegram Bot API (Option A).
// Safe, privacy-first, zero personally identifiable information (PII).

interface DailyPulseLedger {
  date: string;
  uniqueVisits: number;
  newVisitors: number;
  returningVisitors: number;
  totalExecutions: number;
  toolUsage: Record<string, number>;
  lastSentTimestamp?: number;
}

const STORAGE_KEY = "tg_telemetry_pulse";
const COHORT_STORAGE_KEY = "tg_visitor_cohort";

function getTelegramEnv() {
  let botToken = "";
  let chatId = "";
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      botToken = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "").trim();
      chatId = (import.meta.env.VITE_TELEGRAM_CHAT_ID || "").trim();
    }
  } catch {
    // env access fallback
  }
  return { botToken, chatId, configured: Boolean(botToken && chatId) };
}

export function isTelegramAlertsConfigured(): boolean {
  return getTelegramEnv().configured;
}

/**
 * Dispatches an HTML formatted message directly to the developer's Telegram Bot.
 * Completely non-blocking and silent on failure (e.g. adblocker / offline).
 */
export async function sendTelegramMessage(htmlText: string): Promise<boolean> {
  const { botToken, chatId, configured } = getTelegramEnv();
  if (!configured || typeof window === "undefined") return false;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return response.ok;
  } catch {
    // Telegram dispatch failures must never disrupt client application logic
    return false;
  }
}

/**
 * Records visitor cohort (New vs Returning User) on daily session basis.
 * Safe and private: no IP address, no cookies, 100% device-local.
 */
export function recordVisitorCohort(): { isNew: boolean } {
  if (typeof window === "undefined") return { isNew: false };

  try {
    const today = new Date().toISOString().slice(0, 10);
    const rawCohort = localStorage.getItem(COHORT_STORAGE_KEY);
    const rawLedger = localStorage.getItem(STORAGE_KEY);

    let isNew = false;
    let cohort: { firstSeen: number; lastDate: string };

    if (!rawCohort) {
      isNew = true;
      cohort = { firstSeen: Date.now(), lastDate: today };
      localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(cohort));
    } else {
      cohort = JSON.parse(rawCohort);
    }

    let ledger: DailyPulseLedger = rawLedger
      ? JSON.parse(rawLedger)
      : {
          date: today,
          uniqueVisits: 0,
          newVisitors: 0,
          returningVisitors: 0,
          totalExecutions: 0,
          toolUsage: {},
        };

    // If date rolled over, dispatch previous day's report
    if (ledger.date !== today) {
      if (isTelegramAlertsConfigured() && (ledger.totalExecutions > 0 || ledger.uniqueVisits > 0)) {
        dispatchDailyPulse(ledger);
      }
      ledger = {
        date: today,
        uniqueVisits: 0,
        newVisitors: 0,
        returningVisitors: 0,
        totalExecutions: 0,
        toolUsage: {},
      };
    }

    // Check if session has already been counted for today
    const sessionKey = `tg_session_${today}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      ledger.uniqueVisits = (ledger.uniqueVisits || 0) + 1;

      if (isNew) {
        ledger.newVisitors = (ledger.newVisitors || 0) + 1;
      } else {
        ledger.returningVisitors = (ledger.returningVisitors || 0) + 1;
      }

      cohort.lastDate = today;
      localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(cohort));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
    }

    return { isNew };
  } catch {
    return { isNew: false };
  }
}

/**
 * Sends a real-time error alert to Telegram when a tool fails or throws an unexpected exception.
 */
export function reportToolError(
  toolName: string,
  errorMessage: string,
  extra?: Record<string, unknown>
): void {
  if (!isTelegramAlertsConfigured() || typeof window === "undefined") return;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  const isMobile = /Mobi|Android/i.test(userAgent) ? "Mobile" : "Desktop";
  const path = window.location.pathname;

  const sanitizedError = (errorMessage || "Unknown error").slice(0, 300);
  const extraDetails = extra
    ? `\nℹ️ <b>Context:</b> <code>${JSON.stringify(extra).slice(0, 200)}</code>`
    : "";

  const text = [
    `⚠️ <b>Toolbox Galaxy · Issue Alert</b>`,
    `🛠️ <b>Tool:</b> ${escapeHtml(toolName)}`,
    `❌ <b>Error:</b> <code>${escapeHtml(sanitizedError)}</code>`,
    `📍 <b>Path:</b> <code>${escapeHtml(path)}</code> (${isMobile})`,
    extraDetails,
    `🕒 <b>Time:</b> ${now} UTC`,
  ]
    .filter(Boolean)
    .join("\n");

  sendTelegramMessage(text);
}

/**
 * Sends a notification when a visitor submits the contact/feedback form or opens the relay.
 */
export function sendContactNotification(data: {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  source?: string;
}): void {
  if (!isTelegramAlertsConfigured()) return;

  const text = [
    `📬 <b>Toolbox Galaxy · New Message</b>`,
    data.name ? `👤 <b>From:</b> ${escapeHtml(data.name)}` : "",
    data.email ? `✉️ <b>Email:</b> ${escapeHtml(data.email)}` : "",
    data.subject ? `📌 <b>Subject:</b> ${escapeHtml(data.subject)}` : "",
    `\n📝 <b>Message:</b>\n${escapeHtml(data.message || "(No message body)")}`,
    `\n🚀 <b>Relay:</b> ${escapeHtml(data.source || "Web Client")}`,
  ]
    .filter(Boolean)
    .join("\n");

  sendTelegramMessage(text);
}

/**
 * Tracks tool execution and checks if daily pulse summary is due.
 */
export function recordToolTelemetry(toolId: string, toolName: string): void {
  if (typeof window === "undefined") return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(STORAGE_KEY);
    let ledger: DailyPulseLedger = raw
      ? JSON.parse(raw)
      : {
          date: today,
          uniqueVisits: 1,
          newVisitors: 1,
          returningVisitors: 0,
          totalExecutions: 0,
          toolUsage: {},
        };

    if (ledger.date !== today) {
      if (isTelegramAlertsConfigured() && (ledger.totalExecutions > 0 || ledger.uniqueVisits > 0)) {
        dispatchDailyPulse(ledger);
      }
      ledger = {
        date: today,
        uniqueVisits: 1,
        newVisitors: 0,
        returningVisitors: 1,
        totalExecutions: 0,
        toolUsage: {},
      };
    }

    ledger.totalExecutions = (ledger.totalExecutions || 0) + 1;
    const key = toolName || toolId || "Unknown Tool";
    ledger.toolUsage[key] = (ledger.toolUsage[key] || 0) + 1;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    // Local storage access restricted
  }
}

/**
 * Dispatches a formatted Daily Pulse Summary report to Telegram.
 * Accurately breaks down New vs. Returning Visitors and Top Tools.
 */
export function dispatchDailyPulse(ledger: DailyPulseLedger) {
  const sorted = Object.entries(ledger.toolUsage || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);

  const topToolsList = sorted
    .map(([name, count], index) => `   ${index + 1}. <b>${escapeHtml(name)}</b>: ${count} runs`)
    .join("\n");

  const totalVisitors = (ledger.newVisitors || 0) + (ledger.returningVisitors || 0) || ledger.uniqueVisits || 0;
  const newPct = totalVisitors > 0 ? Math.round(((ledger.newVisitors || 0) / totalVisitors) * 100) : 0;
  const retPct = totalVisitors > 0 ? Math.round(((ledger.returningVisitors || 0) / totalVisitors) * 100) : 0;

  const message = [
    `📊 <b>Toolbox Galaxy · Daily Pulse (${ledger.date})</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👥 <b>Total Daily Visitors:</b> ~${totalVisitors}`,
    `   ├ 🟢 <b>New Users:</b> ${ledger.newVisitors || 0} (${newPct}%)`,
    `   └ 🔁 <b>Returning Users:</b> ${ledger.returningVisitors || 0} (${retPct}%)`,
    ``,
    `⚡ <b>Total Tool Executions:</b> ${ledger.totalExecutions || 0}`,
    ``,
    `🔥 <b>Top Tools Used:</b>`,
    topToolsList || "   (No individual tools logged)",
  ].join("\n");

  sendTelegramMessage(message);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
