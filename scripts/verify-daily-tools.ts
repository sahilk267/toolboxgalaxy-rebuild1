import { businessDaysBetween, calculateWorkShift, convertEpoch, diffTextLines, estimateLoanEmi, findAndReplace, planMeetingTime, splitBillAndTip } from "../client/src/lib/dailyToolEngines";
import { tools } from "../client/src/data/toolRegistry";

let failures = 0;
function assert(condition: unknown, name: string) { if (!condition) { failures += 1; console.error(`FAIL · ${name}`); } else console.log(`PASS · ${name}`); }
const valueOf = <T>(result: { value?: T; error?: string }) => result.value;
const unique = (values: string[]) => new Set(values).size === values.length;

const batchSlugs = ["business-days-calculator", "time-zone-meeting-planner", "timestamp-converter", "text-diff-checker", "find-replace-workspace", "split-bill-tip-calculator", "loan-emi-estimate", "work-shift-duration", "json-csv-converter", "csv-viewer-cleaner"];
assert(tools.length >= 37 && unique(tools.map((tool) => tool.slug)) && unique(tools.map((tool) => tool.name)) && unique(tools.map((tool) => tool.kind)) && batchSlugs.every((slug) => tools.some((tool) => tool.slug === slug)), "Daily tools extend a unique registry without duplicate slug, name, or runner kind");

const weekdays = businessDaysBetween("2026-08-24", "2026-08-30", true);
assert(valueOf(weekdays)?.businessDays === 5 && valueOf(weekdays)?.calendarDays === 7, "Business Days counts Monday–Friday and retains the selected end date");
assert(valueOf(businessDaysBetween("2026-08-24", "2026-08-28", false))?.businessDays === 4, "Business Days can exclude the end date without duplicating Date Difference");
assert(Boolean(businessDaysBetween("2026-08-31", "2026-08-24", true).error), "Business Days rejects reversed ranges");
assert(Boolean(businessDaysBetween("2026-02-30", "2026-03-01", true).error), "Business Days rejects invalid calendar dates");

const meeting = planMeetingTime("2026-01-15T09:00", "Asia/Kolkata", "America/New_York");
assert(valueOf(meeting)?.source.includes("09:00") && valueOf(meeting)?.target.includes("22:30") && valueOf(meeting)?.target.includes("Wed, 14 Jan"), "Time Zone Planner converts a local India meeting time to the correct prior-evening US East slot using local browser rules");
assert(Boolean(planMeetingTime("2026-03-08T02:30", "America/New_York", "Asia/Kolkata").error), "Time Zone Planner rejects a nonexistent daylight-saving local time");
assert(Boolean(planMeetingTime("2026-13-01T09:00", "Asia/Kolkata", "Europe/London").error), "Time Zone Planner rejects invalid local date/time input");

const timestamp = convertEpoch("0", "seconds");
assert(valueOf(timestamp)?.iso === "1970-01-01T00:00:00.000Z" && valueOf(timestamp)?.milliseconds === 0, "Timestamp Converter returns ISO/UTC-local data from Unix seconds");
assert(valueOf(convertEpoch("1000", "milliseconds"))?.iso === "1970-01-01T00:00:01.000Z", "Timestamp Converter respects the selected millisecond unit");
assert(Boolean(convertEpoch("1.5", "seconds").error), "Timestamp Converter rejects non-integer values");

const diff = diffTextLines("alpha\nbeta", "alpha\ngamma\nbeta");
assert(valueOf(diff)?.added === 1 && valueOf(diff)?.removed === 0 && valueOf(diff)?.unchanged === 2, "Text Diff retains unchanged lines and reports a line insertion");
assert(valueOf(diff)?.lines.map((line) => `${line.kind}:${line.text}`).join("|") === "same:alpha|added:gamma|same:beta", "Text Diff returns stable semantic line ordering");
assert(Boolean(diffTextLines("a\n".repeat(301), "b\n".repeat(301)).error), "Text Diff bounds expensive local comparisons clearly");

const literal = findAndReplace("Signal signal signal", "signal", "Beacon", { regex: false, caseSensitive: false, replaceAll: true });
assert(valueOf(literal)?.output === "Beacon Beacon Beacon" && valueOf(literal)?.replacements === 3, "Find / Replace performs literal case-insensitive global replacements");
assert(valueOf(findAndReplace("one one", "one", "two", { regex: false, caseSensitive: true, replaceAll: false }))?.output === "two one", "Find / Replace can replace only the first literal match");
assert(valueOf(findAndReplace("id-42", "id-(\\d+)", "ref-$1", { regex: true, caseSensitive: true, replaceAll: true }))?.output === "ref-42", "Find / Replace supports explicit local regex capture references");
assert(Boolean(findAndReplace("text", "[", "x", { regex: true, caseSensitive: true, replaceAll: true }).error), "Find / Replace protects the workspace from invalid regex input");

const split = splitBillAndTip("2400", "10", "4");
assert(valueOf(split)?.tip === 240 && valueOf(split)?.total === 2640 && valueOf(split)?.perPerson === 660, "Split Bill computes a chosen tip, group total, and exact per-person share");
assert(Boolean(splitBillAndTip("100", "150", "2").error) && Boolean(splitBillAndTip("100", "10", "2.5").error), "Split Bill rejects an unrealistic tip or fractional people count");

const emi = estimateLoanEmi("100000", "12", "12");
assert(Math.abs((valueOf(emi)?.monthlyPayment ?? 0) - 8884.878867834166) < 0.000001 && Math.abs((valueOf(emi)?.totalInterest ?? 0) - 6618.546414009999) < 0.00001, "Loan / EMI uses the fixed-rate monthly-payment formula with a transparent interest total");
assert(valueOf(estimateLoanEmi("120000", "0", "12"))?.monthlyPayment === 10000, "Loan / EMI handles a zero annual rate without division by zero");
assert(Boolean(estimateLoanEmi("0", "9", "60").error) && Boolean(estimateLoanEmi("500000", "9", "0").error), "Loan / EMI rejects invalid amounts and repayment terms");

const overnight = calculateWorkShift("22:00", "06:00", "30");
assert(valueOf(overnight)?.grossMinutes === 480 && valueOf(overnight)?.paidMinutes === 450 && valueOf(overnight)?.crossesMidnight, "Work Shift calculates an overnight gross and paid duration after an unpaid break");
assert(valueOf(calculateWorkShift("09:00", "17:30", "30"))?.paidMinutes === 480, "Work Shift calculates a same-day paid duration separately from Business Days");
assert(Boolean(calculateWorkShift("09:00", "09:00", "0").error) && Boolean(calculateWorkShift("09:00", "10:00", "60").error), "Work Shift rejects zero-length shifts and breaks equal to the full shift");

if (failures) { console.error(`\n${failures} daily-tool regression(s) failed.`); process.exit(1); }
console.log("\nAll five daily-tool engine regressions passed.");
