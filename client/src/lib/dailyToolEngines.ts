// Orbital Workbench: pure browser-local engines for five distinct daily utilities; no storage, network, provider, or implicit current-date dependency.

export type EngineResult<T> = { value: T; error?: never } | { value?: never; error: string };

const dayMs = 86_400_000;
const strictDate = /^\d{4}-\d{2}-\d{2}$/;
const strictDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseCalendarDate(value: string): Date | null {
  if (!strictDate.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function businessDaysBetween(startValue: string, endValue: string, includeEnd: boolean): EngineResult<{ businessDays: number; calendarDays: number; startLabel: string; endLabel: string }> {
  const start = parseCalendarDate(startValue); const end = parseCalendarDate(endValue);
  if (!start || !end) return { error: "Choose two valid calendar dates." };
  if (end < start) return { error: "End date must be on or after start date." };
  const finalTime = end.getTime() - (includeEnd ? 0 : dayMs);
  let businessDays = 0;
  for (let cursor = start.getTime(); cursor <= finalTime; cursor += dayMs) { const weekday = new Date(cursor).getUTCDay(); if (weekday !== 0 && weekday !== 6) businessDays += 1; }
  return { value: { businessDays, calendarDays: Math.max(0, Math.floor((finalTime - start.getTime()) / dayMs) + 1), startLabel: start.toLocaleDateString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }), endLabel: end.toLocaleDateString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) } };
}

export const meetingTimeZones = [
  { id: "Asia/Kolkata", label: "India · Kolkata" }, { id: "Europe/London", label: "United Kingdom · London" },
  { id: "Europe/Berlin", label: "Europe · Berlin" }, { id: "America/New_York", label: "US East · New York" },
  { id: "America/Los_Angeles", label: "US West · Los Angeles" }, { id: "America/Sao_Paulo", label: "Brazil · São Paulo" },
  { id: "Asia/Singapore", label: "Singapore" }, { id: "Asia/Tokyo", label: "Japan · Tokyo" }, { id: "Australia/Sydney", label: "Australia · Sydney" },
] as const;

type DateParts = { year: number; month: number; day: number; hour: number; minute: number };
function datePartsAt(epoch: number, timeZone: string): DateParts | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(epoch));
    const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const value = { year: pick("year"), month: pick("month"), day: pick("day"), hour: pick("hour"), minute: pick("minute") };
    return Object.values(value).every(Number.isFinite) ? value : null;
  } catch { return null; }
}
function sameParts(left: DateParts, right: DateParts) { return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute; }
function localDateTimeToEpoch(value: string, timeZone: string): EngineResult<number> {
  if (!strictDateTime.test(value)) return { error: "Choose a valid local date and time." };
  const [date, clock] = value.split("T"); const parsed = parseCalendarDate(date); if (!parsed) return { error: "Choose a valid local date and time." };
  const [hour, minute] = clock.split(":").map(Number); if (hour > 23 || minute > 59) return { error: "Choose a valid local date and time." };
  const desired = { year: parsed.getUTCFullYear(), month: parsed.getUTCMonth() + 1, day: parsed.getUTCDate(), hour, minute };
  let epoch = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute);
  for (let attempt = 0; attempt < 4; attempt += 1) { const observed = datePartsAt(epoch, timeZone); if (!observed) return { error: "This browser does not support the selected time zone." }; const offset = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute) - Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute); if (offset === 0) break; epoch += offset; }
  const final = datePartsAt(epoch, timeZone); if (!final || !sameParts(final, desired)) return { error: "That local time does not occur in the selected zone because of a daylight-saving change. Choose a nearby time." };
  return { value: epoch };
}
function displayZoned(epoch: number, timeZone: string) { return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(epoch)); }
export function planMeetingTime(localDateTime: string, sourceZone: string, targetZone: string): EngineResult<{ source: string; target: string; epoch: number }> {
  const epoch = localDateTimeToEpoch(localDateTime, sourceZone); if ("error" in epoch) return { error: epoch.error || "Choose a valid local date and time." };
  try { return { value: { source: displayZoned(epoch.value, sourceZone), target: displayZoned(epoch.value, targetZone), epoch: epoch.value } }; } catch { return { error: "This browser does not support one of the selected time zones." }; }
}

export function convertEpoch(value: string, unit: "seconds" | "milliseconds"): EngineResult<{ iso: string; utc: string; local: string; milliseconds: number }> {
  if (!/^-?\d+$/.test(value.trim())) return { error: "Enter a whole Unix timestamp in seconds or milliseconds." };
  const input = Number(value); const milliseconds = unit === "seconds" ? input * 1000 : input;
  if (!Number.isSafeInteger(input) || !Number.isSafeInteger(milliseconds)) return { error: "That timestamp is outside the safe local range." };
  const date = new Date(milliseconds); if (Number.isNaN(date.getTime())) return { error: "That timestamp is outside the supported date range." };
  return { value: { iso: date.toISOString(), utc: date.toUTCString(), local: date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }), milliseconds } };
}

export type DiffLine = { kind: "same" | "removed" | "added"; text: string };
export function diffTextLines(original: string, revised: string): EngineResult<{ lines: DiffLine[]; added: number; removed: number; unchanged: number }> {
  const before = original ? original.replace(/\r\n/g, "\n").split("\n") : []; const after = revised ? revised.replace(/\r\n/g, "\n").split("\n") : [];
  if (before.length * after.length > 90_000) return { error: "Use smaller text blocks (up to 90,000 line comparisons) for a readable local diff." };
  const table = Array.from({ length: before.length + 1 }, () => new Uint32Array(after.length + 1));
  for (let left = before.length - 1; left >= 0; left -= 1) for (let right = after.length - 1; right >= 0; right -= 1) table[left][right] = before[left] === after[right] ? table[left + 1][right + 1] + 1 : Math.max(table[left + 1][right], table[left][right + 1]);
  const lines: DiffLine[] = []; let left = 0; let right = 0;
  while (left < before.length || right < after.length) { if (left < before.length && right < after.length && before[left] === after[right]) { lines.push({ kind: "same", text: before[left] }); left += 1; right += 1; } else if (right < after.length && (left === before.length || table[left][right + 1] >= table[left + 1][right])) { lines.push({ kind: "added", text: after[right] }); right += 1; } else { lines.push({ kind: "removed", text: before[left] }); left += 1; } }
  return { value: { lines, added: lines.filter((line) => line.kind === "added").length, removed: lines.filter((line) => line.kind === "removed").length, unchanged: lines.filter((line) => line.kind === "same").length } };
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function findAndReplace(input: string, find: string, replacement: string, options: { regex: boolean; caseSensitive: boolean; replaceAll: boolean }): EngineResult<{ output: string; replacements: number }> {
  if (!find) return { error: "Enter text or a regular expression to find." };
  try {
    const flags = `${options.replaceAll ? "g" : ""}${options.caseSensitive ? "" : "i"}`;
    const matcher = new RegExp(options.regex ? find : escapeRegExp(find), flags);
    let replacements = 0; const output = input.replace(matcher, (...args) => { replacements += 1; return options.regex ? replacement.replace(/\$(\d+)/g, (_, token) => args[Number(token)] ?? "") : replacement; });
    return { value: { output, replacements } };
  } catch { return { error: "That regular expression is not valid. Turn off Regex mode to search for the exact text." }; }
}

const finiteNumber = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; };
export function splitBillAndTip(subtotalValue: string, tipPercentValue: string, peopleValue: string): EngineResult<{ subtotal: number; tip: number; total: number; perPerson: number; people: number }> {
  const subtotal = finiteNumber(subtotalValue); const tipPercent = finiteNumber(tipPercentValue); const people = finiteNumber(peopleValue);
  if (subtotal === null || subtotal < 0) return { error: "Enter a valid non-negative bill subtotal." };
  if (tipPercent === null || tipPercent < 0 || tipPercent > 100) return { error: "Enter a tip from 0% to 100%." };
  if (people === null || !Number.isInteger(people) || people < 1 || people > 1000) return { error: "Enter a whole number of people from 1 to 1,000." };
  const tip = subtotal * tipPercent / 100; const total = subtotal + tip;
  return { value: { subtotal, tip, total, perPerson: total / people, people } };
}

export function estimateLoanEmi(principalValue: string, annualRateValue: string, monthsValue: string): EngineResult<{ principal: number; annualRate: number; months: number; monthlyPayment: number; totalPaid: number; totalInterest: number }> {
  const principal = finiteNumber(principalValue); const annualRate = finiteNumber(annualRateValue); const months = finiteNumber(monthsValue);
  if (principal === null || principal <= 0) return { error: "Enter a loan amount greater than zero." };
  if (annualRate === null || annualRate < 0 || annualRate > 100) return { error: "Enter an annual interest rate from 0% to 100%." };
  if (months === null || !Number.isInteger(months) || months < 1 || months > 600) return { error: "Enter a whole repayment term from 1 to 600 months." };
  const monthlyRate = annualRate / 1200;
  const monthlyPayment = monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  const totalPaid = monthlyPayment * months;
  return { value: { principal, annualRate, months, monthlyPayment, totalPaid, totalInterest: totalPaid - principal } };
}

function minutesFromClock(value: string): number | null { const match = /^(\d{2}):(\d{2})$/.exec(value); if (!match) return null; const hour = Number(match[1]); const minute = Number(match[2]); return hour < 24 && minute < 60 ? hour * 60 + minute : null; }
export function calculateWorkShift(startValue: string, endValue: string, breakValue: string): EngineResult<{ grossMinutes: number; breakMinutes: number; paidMinutes: number; crossesMidnight: boolean }> {
  const start = minutesFromClock(startValue); const end = minutesFromClock(endValue); const breakMinutes = finiteNumber(breakValue);
  if (start === null || end === null) return { error: "Choose valid start and end times." };
  if (start === end) return { error: "Start and end cannot be the same time for one shift." };
  if (breakMinutes === null || breakMinutes < 0 || !Number.isInteger(breakMinutes)) return { error: "Enter a whole non-negative unpaid break in minutes." };
  const crossesMidnight = end < start; const grossMinutes = (end - start + (crossesMidnight ? 1440 : 0));
  if (breakMinutes >= grossMinutes) return { error: "The unpaid break must be shorter than the shift." };
  return { value: { grossMinutes, breakMinutes, paidMinutes: grossMinutes - breakMinutes, crossesMidnight } };
}

export function formatDuration(minutes: number) { const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return `${hours}h ${remainder}m`; }
