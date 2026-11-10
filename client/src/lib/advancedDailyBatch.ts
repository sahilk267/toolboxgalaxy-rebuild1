/** Advanced everyday pure engines: calculations are local, bounded, and testable. */
import { estimateLoanEmi, parseCalendarDate, planMeetingTime } from "./dailyToolEngines";
export type CalcResult<T> = { value: T; error?: never } | { value?: never; error: string };
const DAY_MS = 86_400_000;
const toNumber = (input: string) => input.trim() && Number.isFinite(Number(input)) ? Number(input) : NaN;
const roundCents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export type DiscountDetails = {
  original: number; firstSavings: number; secondSavings: number; discounted: number;
  tax: number; finalPrice: number; saved: number; effectiveDiscount: number;
};
export function calculateDiscount(
  priceText: string, firstText: string, secondText = "0", taxText = "0",
  reverse = false,
): CalcResult<DiscountDetails> {
  const raw = toNumber(priceText), first = toNumber(firstText), second = toNumber(secondText), taxRate = toNumber(taxText);
  if (![raw,first,second,taxRate].every(Number.isFinite) || raw < 0 || raw > 1e12)
    return { error: "Enter a valid nonnegative price up to one trillion." };
  if ([first,second].some(p => p < 0 || p > 100) || taxRate < 0 || taxRate > 100)
    return { error: "Each discount and tax rate must be between 0% and 100%." };
  const remaining = (1-first/100)*(1-second/100);
  if (reverse && remaining === 0) return { error: "Cannot reverse a 100% discount." };
  const original = reverse ? raw / (remaining * (1 + taxRate / 100)) : raw;
  if (!Number.isFinite(original) || original > 1e12) return { error: "Computed original price is outside the supported range." };
  const firstSavings = original * first/100;
  const secondSavings = (original - firstSavings) * second/100;
  const discounted = original - firstSavings - secondSavings;
  const tax = discounted * taxRate/100;
  const finalPrice = discounted + tax;
  return { value: {
    original, firstSavings, secondSavings, discounted, tax, finalPrice, saved: firstSavings + secondSavings,
    effectiveDiscount: original ? (firstSavings+secondSavings)/original*100 : 0,
  } };
}

export type LoanScheduleLine = {
  month: number; principal: number; interest: number; regularPayment: number;
  extraPayment: number; balance: number;
};
export type LoanProjection = {
  monthlyPayment: number; totalPaid: number; totalInterest: number; months: number;
  monthsSaved: number; interestSaved: number; originalInterest: number;
  schedule: LoanScheduleLine[];
};
export function projectLoan(
  principalText: string, annualText: string, monthsText: string,
  extraMonthlyText = "0", lumpMonthText = "0", lumpAmountText = "0",
): CalcResult<LoanProjection> {
  const base = estimateLoanEmi(principalText, annualText, monthsText);
  if (!base.value) return { error: base.error || "Invalid loan configuration." };
  const extraMonthly = toNumber(extraMonthlyText), lumpMonth = toNumber(lumpMonthText), lumpAmount = toNumber(lumpAmountText);
  if (!Number.isFinite(extraMonthly) || extraMonthly < 0 || extraMonthly > 1e12 ||
      !Number.isFinite(lumpMonth) || !Number.isInteger(lumpMonth) || lumpMonth < 0 || lumpMonth > base.value.months ||
      !Number.isFinite(lumpAmount) || lumpAmount < 0 || lumpAmount > 1e12)
    return { error: "Extra payments must be nonnegative; lump-sum month must be within the loan term." };
  if ((lumpMonth === 0) !== (lumpAmount === 0))
    return { error: "Enter both a lump-sum payment and its month, or leave both zero." };
  const schedule: LoanScheduleLine[] = [];
  let balance = base.value.principal, paid = 0, interestPaid = 0;
  const monthlyRate = base.value.annualRate / 1200;
  for (let month = 1; month <= base.value.months && balance > 0.000001; month++) {
    const interest = balance * monthlyRate;
    const regularPayment = Math.min(base.value.monthlyPayment, balance + interest);
    const principalPayment = Math.max(0, regularPayment - interest);
    const appliedExtra = Math.min(Math.max(0, balance - principalPayment),
      extraMonthly + (month === lumpMonth ? lumpAmount : 0));
    balance = Math.max(0, balance - principalPayment - appliedExtra);
    paid += regularPayment + appliedExtra;
    interestPaid += interest;
    schedule.push({
      month, principal: principalPayment + appliedExtra, interest,
      regularPayment, extraPayment: appliedExtra, balance,
    });
  }
  if (balance > 0.02) return { error: "Loan did not amortize within the chosen term." };
  const originalInterest = base.value.totalInterest;
  return { value: {
    monthlyPayment: base.value.monthlyPayment, totalPaid: paid,
    totalInterest: interestPaid, months: schedule.length,
    monthsSaved: base.value.months - schedule.length,
    interestSaved: Math.max(0, originalInterest - interestPaid),
    originalInterest, schedule,
  } };
}

export type WeekendPolicy = "sat-sun" | "fri-sat" | "sun" | "none";
export type HolidayPreset = "none" | "india-fixed" | "us-fixed" | "uk-fixed";
export type BusinessDayResult = {
  count: number; calendarDays: number; weekendDays: number; holidayDays: number;
  first: string; last: string;
};
const dayKey = (epoch: number) => new Date(epoch).toISOString().slice(0,10);
function weekend(day: number, rule: WeekendPolicy) {
  return rule === "sat-sun" ? day === 0 || day === 6 :
    rule === "fri-sat" ? day === 5 || day === 6 : rule === "sun" ? day === 0 : false;
}
function presetHoliday(date: string, preset: HolidayPreset): boolean {
  const mmdd = date.slice(5);
  if (preset === "india-fixed") return ["01-26","08-15","10-02"].includes(mmdd);
  if (preset === "us-fixed") return ["01-01","07-04","12-25"].includes(mmdd);
  if (preset === "uk-fixed") return ["01-01","12-25","12-26"].includes(mmdd);
  return false;
}
export function parseHolidays(text: string): CalcResult<Set<string>> {
  if (text.length > 20_000) return { error: "Holiday input exceeds 20,000 characters." };
  const result = new Set<string>();
  for (const line of text.split(/[,\n;]/).map(s => s.trim()).filter(Boolean)) {
    if (!parseCalendarDate(line)) return { error: "Invalid holiday date: " + line + ". Use YYYY-MM-DD." };
    result.add(line);
    if (result.size > 300) return { error: "Enter at most 300 holiday dates." };
  }
  return { value: result };
}
function eligible(epoch: number, rule: WeekendPolicy, holiday: Set<string>, preset: HolidayPreset) {
  const key = dayKey(epoch);
  return !weekend(new Date(epoch).getUTCDay(), rule) && !holiday.has(key) && !presetHoliday(key,preset);
}
export function countBusinessDays(
  startText: string, endText: string, includeEnd = true,
  rule: WeekendPolicy = "sat-sun", holidayInput = "", preset: HolidayPreset = "none",
): CalcResult<BusinessDayResult> {
  const start = parseCalendarDate(startText), end = parseCalendarDate(endText);
  if (!start || !end) return { error: "Choose valid start and end dates." };
  if (start > end) return { error: "End date must not precede start date." };
  const holidays = parseHolidays(holidayInput);
  if (!holidays.value) return { error: holidays.error || "Invalid holidays." };
  const duration = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  if (duration > 7305) return { error: "Date range must be 20 years or shorter." };
  const last = end.getTime() - (includeEnd ? 0 : DAY_MS);
  let count = 0, weekendDays = 0, holidayDays = 0, calendarDays = 0;
  for (let epoch = start.getTime(); epoch <= last; epoch += DAY_MS) {
    calendarDays++;
    const key = dayKey(epoch);
    if (weekend(new Date(epoch).getUTCDay(),rule)) weekendDays++;
    else if (holidays.value.has(key) || presetHoliday(key,preset)) holidayDays++;
    else count++;
  }
  return { value: { count, calendarDays, weekendDays, holidayDays, first: startText, last: endText } };
}
export function shiftBusinessDays(
  startText: string, countText: string, rule: WeekendPolicy = "sat-sun",
  holidayInput = "", preset: HolidayPreset = "none",
): CalcResult<{ resultDate: string; traversedDays: number }> {
  const date = parseCalendarDate(startText), count = toNumber(countText);
  if (!date) return { error: "Choose a valid starting date." };
  if (!Number.isSafeInteger(count) || Math.abs(count) > 5000)
    return { error: "Working-day shift must be a whole number between -5000 and 5000." };
  const parsed = parseHolidays(holidayInput);
  if (!parsed.value) return { error: parsed.error || "Invalid holidays." };
  let epoch = date.getTime(), remaining = Math.abs(count), traversed = 0;
  const step = Math.sign(count) * DAY_MS;
  while (remaining > 0 && traversed < 15_000) {
    epoch += step;
    traversed++;
    if (eligible(epoch, rule, parsed.value, preset)) remaining--;
  }
  if (remaining > 0) return { error: "Not enough working dates within 15,000 calendar days." };
  return { value: { resultDate: dayKey(epoch), traversedDays: traversed } };
}
export const WORLD_ZONES = [
  "Asia/Kolkata", "Europe/London", "Europe/Berlin", "America/New_York",
  "America/Los_Angeles","America/Sao_Paulo","Asia/Singapore","Asia/Tokyo",
  "Australia/Sydney","UTC","Asia/Dubai","Africa/Johannesburg","Pacific/Auckland",
  "America/Toronto","Europe/Paris",
] as const;
function localWall(epoch: number, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB",{timeZone:zone, year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(epoch);
  const pick = (type:string) => parts.find(part=>part.type === type)?.value || "";
  return pick("year")+"-"+pick("month")+"-"+pick("day")+"T"+pick("hour")+":"+pick("minute");
}
export function planMultiZone(localText: string, sourceZone: string, zones: readonly string[]):
  CalcResult<{ epoch: number; rows: { zone: string; local: string; offset: string }[]; warning: string }> {
  if (zones.length < 1 || zones.length > 6 || new Set(zones).size !== zones.length)
    return { error: "Select 1–6 different time zones." };
  const first = planMeetingTime(localText, sourceZone, sourceZone);
  if (!first.value) return { error: first.error || "Invalid meeting time." };
  const epoch = first.value.epoch;
  try {
    if (localWall(epoch,sourceZone) !== localText) return { error: "Selected local time does not exist." };
    const ambiguous = [30,60,90,120].some(delta =>
      [-1,1].some(sign => localWall(epoch + sign*delta*60_000,sourceZone) === localText));
    const fmt = (zone: string) => new Intl.DateTimeFormat("en-GB",{
      timeZone:zone,weekday:"short",day:"2-digit",month:"short",year:"numeric",
      hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZoneName:"short"
    }).format(epoch);
    const rows = zones.map(zone=>({zone,local:fmt(zone),offset:localWall(epoch,zone)}));
    return { value: { epoch,rows,warning:ambiguous
      ? "This local time repeats during a daylight-saving transition. Confirm which occurrence you intend."
      : "Offsets are computed using this browser's time-zone database; verify future rule changes." } };
  } catch { return { error: "An unsupported time zone was selected." }; }
}
