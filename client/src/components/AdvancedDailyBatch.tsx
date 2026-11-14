import { useMemo, useState } from "react";
import { Check, Clipboard, Download, RotateCcw } from "lucide-react";
import {
  calculateDiscount, projectLoan, countBusinessDays, shiftBusinessDays,
  planMultiZone, WORLD_ZONES,
  type WeekendPolicy, type HolidayPreset,
} from "@/lib/advancedDailyBatch";

type Currency = "INR" | "USD" | "GBP" | "EUR" | "AED";
const currencyOptions: Currency[] = ["INR","USD","GBP","EUR","AED"];
const money = (n: number, c: Currency) =>
  new Intl.NumberFormat(undefined,{style:"currency",currency:c,maximumFractionDigits:2}).format(n);

function CopyOutput({ text }: { text: string }) {
  const [copied,setCopied] = useState(false);
  return <button type="button" disabled={!text} className="copy-button" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(()=>setCopied(false),1200); } catch {}
  }}>{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy"}</button>;
}
function Output({ text,error,label="RESULT" }: {text:string;error?:string;label?:string}) {
  return <div className={"result-block"+(error ? " result-block--error" : "")}>
    <div className="telemetry-strip"><span>{label}</span><CopyOutput text={error ? "" : text}/></div>
    <pre data-tool-output aria-live="polite">{error || text || "Choose valid inputs to view the result."}</pre>
  </div>;
}
function Reset({onClick}:{onClick:()=>void}){return <button type="button" className="reset-button" onClick={onClick}><RotateCcw size={15}/> Reset</button>;}
function saveCsv(rows: readonly (readonly (number|string)[])[],name: string) {
  const csv = rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download=name;
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1200);
}

export function AdvancedDiscountTool() {
  const [price,setPrice] = useState("89.99");
  const [first,setFirst] = useState("20");
  const [second,setSecond] = useState("0");
  const [tax,setTax] = useState("0");
  const [reverse,setReverse] = useState(false);
  const [currency,setCurrency] = useState<Currency>("USD");
  const result = useMemo(()=>calculateDiscount(price,first,second,tax,reverse),[price,first,second,tax,reverse]);
  const value = result.value;
  const summary = value ?
    (reverse ? "Calculated original price " + money(value.original,currency) : "Final price " + money(value.finalPrice,currency))+
    "\nOriginal: "+money(value.original,currency)+
    "\nFirst discount: −"+money(value.firstSavings,currency)+
    "\nSecond discount: −"+money(value.secondSavings,currency)+
    "\nDiscounted subtotal: "+money(value.discounted,currency)+
    "\nTax on discounted price: +"+money(value.tax,currency)+
    "\nYou save: "+money(value.saved,currency)+
    "\nEffective discount: "+value.effectiveDiscount.toFixed(2)+"%" +
    "\nFinal price: "+money(value.finalPrice,currency) : "";
  return <div className="runner-stack" data-tool="advanced-discount">
    <div className="math-row">
      <label>{reverse ? "Known final price" : "Original price"}
        <input data-field="discount-price" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)}/>
      </label>
      <label>First discount (%)<input data-field="discount-first" inputMode="decimal" value={first} onChange={e=>setFirst(e.target.value)}/></label>
      <label>Second discount (%)<input data-field="discount-second" inputMode="decimal" value={second} onChange={e=>setSecond(e.target.value)}/></label>
      <label>Tax / GST (%)<input data-field="discount-tax" inputMode="decimal" value={tax} onChange={e=>setTax(e.target.value)}/></label>
      <label>Currency<select data-field="discount-currency" value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>
        {currencyOptions.map(c=><option key={c} value={c}>{c}</option>)}
      </select></label>
    </div>
    <label className="check-field"><input data-field="discount-reverse" type="checkbox" checked={reverse} onChange={e=>setReverse(e.target.checked)}/>
      Work backwards from a known tax-inclusive final price
    </label>
    <p className="tool-disclaimer">Discounts are applied sequentially; tax is added after both discounts. Example defaults preserve the original 20% off $89.99 calculation. Amounts are estimates rounded for display.</p>
    <Reset onClick={()=>{setPrice("89.99");setFirst("20");setSecond("0");setTax("0");setReverse(false);setCurrency("USD");}}/>
    <Output text={summary} error={result.error} label="DISCOUNT BREAKDOWN"/>
  </div>;
}

export function AdvancedLoanTool() {
  const [principal,setPrincipal]=useState("500000");
  const [rate,setRate]=useState("9");
  const [months,setMonths]=useState("60");
  const [extra,setExtra]=useState("0");
  const [lumpMonth,setLumpMonth]=useState("0");
  const [lumpAmount,setLumpAmount]=useState("0");
  const [otherRate,setOtherRate]=useState("");
  const [currency,setCurrency]=useState<Currency>("INR");
  const [showSchedule,setShowSchedule]=useState(false);
  const result=useMemo(()=>projectLoan(principal,rate,months,extra,lumpMonth,lumpAmount),[principal,rate,months,extra,lumpMonth,lumpAmount]);
  const compare=useMemo(()=>otherRate.trim()?projectLoan(principal,otherRate,months):null,[principal,otherRate,months]);
  const v=result.value;
  const summary=v? "Monthly EMI: "+money(v.monthlyPayment,currency)+
    "\nTotal paid: "+money(v.totalPaid,currency)+
    "\nTotal interest: "+money(v.totalInterest,currency)+
    "\nActual payoff: "+v.months+" months"+
    "\nMonths saved: "+v.monthsSaved+
    "\nInterest saved vs no prepayment: "+money(v.interestSaved,currency)+
    (compare?.value?"\n\nAlternative rate "+otherRate+"% → EMI "+money(compare.value.monthlyPayment,currency)+
    "\nAlternative total interest (no extras): "+money(compare.value.totalInterest,currency):"") : "";
  const reset=()=>{setPrincipal("500000");setRate("9");setMonths("60");setExtra("0");setLumpMonth("0");setLumpAmount("0");setOtherRate("");setCurrency("INR");setShowSchedule(false);};
  return <div className="runner-stack" data-tool="advanced-loan">
    <div className="math-row">
      <label>Loan amount<input data-field="emi-principal" inputMode="decimal" value={principal} onChange={e=>setPrincipal(e.target.value)}/></label>
      <label>Annual rate (%)<input data-field="emi-rate" inputMode="decimal" value={rate} onChange={e=>setRate(e.target.value)}/></label>
      <label>Term (months)<input data-field="emi-months" inputMode="numeric" value={months} onChange={e=>setMonths(e.target.value)}/></label>
      <label>Currency<select data-field="emi-currency" value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>{currencyOptions.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Extra payment each month<input data-field="emi-extra" inputMode="decimal" value={extra} onChange={e=>setExtra(e.target.value)}/></label>
      <label>One-time extra payment in month<input data-field="emi-lump-month" inputMode="numeric" value={lumpMonth} onChange={e=>setLumpMonth(e.target.value)}/></label>
      <label>One-time extra amount<input data-field="emi-lump-amount" inputMode="decimal" value={lumpAmount} onChange={e=>setLumpAmount(e.target.value)}/></label>
      <label>Compare another annual rate (%)<input data-field="emi-compare-rate" inputMode="decimal" placeholder="Optional" value={otherRate} onChange={e=>setOtherRate(e.target.value)}/></label>
    </div>
    <p className="tool-disclaimer">Fixed annual rate, monthly compounding, unchanged EMI and extra payments applied after each normal EMI. No lender fees, floating rates, taxes or insurance. Not financial advice.</p>
    <div className="flex flex-wrap gap-3">
      <Reset onClick={reset}/>
      <button type="button" className="quiet-button" disabled={!v} onClick={()=>setShowSchedule(s=>!s)}>
        {showSchedule?"Hide":"Show"} amortization schedule
      </button>
      <button type="button" className="quiet-button" disabled={!v} onClick={()=>v&&saveCsv([
        ["Month","Principal Paid","Interest Paid","Scheduled Payment","Extra Payment","Closing Balance"],
        ...v.schedule.map(row=>[row.month,row.principal.toFixed(2),row.interest.toFixed(2),row.regularPayment.toFixed(2),row.extraPayment.toFixed(2),row.balance.toFixed(2)])
      ],"toolboxgalaxy-loan-schedule.csv")}><Download size={15}/> Export CSV</button>
    </div>
    <Output text={summary} error={result.error||compare?.error} label="LOAN / EMI ESTIMATE"/>
    {v && showSchedule && <div className="max-h-[480px] overflow-auto rounded-xl border border-white/15" aria-label="Loan amortization schedule">
      <table className="w-full text-left text-xs">
        <thead><tr><th>Month</th><th>Principal</th><th>Interest</th><th>Extra</th><th>Balance</th></tr></thead>
        <tbody>{v.schedule.map(row=><tr key={row.month}><td>{row.month}</td><td>{money(row.principal,currency)}</td><td>{money(row.interest,currency)}</td><td>{money(row.extraPayment,currency)}</td><td>{money(row.balance,currency)}</td></tr>)}</tbody>
      </table>
    </div>}
  </div>;
}

export function AdvancedBusinessDaysTool() {
  const [start,setStart]=useState("2026-08-24");
  const [end,setEnd]=useState("2026-08-28");
  const [includeEnd,setIncludeEnd]=useState(true);
  const [weekend,setWeekend]=useState<WeekendPolicy>("sat-sun");
  const [preset,setPreset]=useState<HolidayPreset>("none");
  const [holidays,setHolidays]=useState("");
  const [shift,setShift]=useState("5");
  const [mode,setMode]=useState<"count"|"shift">("count");
  const count=useMemo(()=>countBusinessDays(start,end,includeEnd,weekend,holidays,preset),[start,end,includeEnd,weekend,holidays,preset]);
  const moved=useMemo(()=>shiftBusinessDays(start,shift,weekend,holidays,preset),[start,shift,weekend,holidays,preset]);
  const output=mode==="count"&&count.value
    ? count.value.count+" business days\n"+count.value.calendarDays+" calendar days counted\n"+
    count.value.weekendDays+" weekend days excluded\n"+count.value.holidayDays+" weekdays excluded as holidays\n"+
    start+" → "+end
    : mode==="shift"&&moved.value ? "Shifted date: "+moved.value.resultDate+
      "\nCalendar days traversed: "+moved.value.traversedDays : "";
  return <div className="runner-stack" data-tool="advanced-business-days">
    <div className="toggle-row">
      <button type="button" className={mode==="count"?"toggle-button toggle-button--active":"toggle-button"} onClick={()=>setMode("count")}>Count business days</button>
      <button type="button" className={mode==="shift"?"toggle-button toggle-button--active":"toggle-button"} onClick={()=>setMode("shift")}>Add / subtract working days</button>
    </div>
    <div className="math-row">
      <label>Start date<input data-field="business-start" type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
      {mode==="count"?<label>End date<input data-field="business-end" type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
      :<label>Days to add or subtract<input data-field="business-shift" inputMode="numeric" value={shift} onChange={e=>setShift(e.target.value)}/></label>}
      <label>Weekend pattern<select data-field="business-weekend" value={weekend} onChange={e=>setWeekend(e.target.value as WeekendPolicy)}>
        <option value="sat-sun">Saturday + Sunday</option><option value="fri-sat">Friday + Saturday</option>
        <option value="sun">Sunday only</option><option value="none">No weekends</option>
      </select></label>
      <label>Fixed-date holiday examples<select data-field="business-preset" value={preset} onChange={e=>setPreset(e.target.value as HolidayPreset)}>
        <option value="none">None</option>
        <option value="india-fixed">India: 26 Jan / 15 Aug / 2 Oct</option>
        <option value="us-fixed">US: 1 Jan / 4 Jul / 25 Dec</option>
        <option value="uk-fixed">UK: 1 Jan / 25 Dec / 26 Dec</option>
      </select></label>
    </div>
    {mode==="count"&&<label className="check-field"><input data-field="business-include-end" type="checkbox" checked={includeEnd} onChange={e=>setIncludeEnd(e.target.checked)}/> Include end date if it is a working day</label>}
    <label className="wide-field">Additional holidays (YYYY-MM-DD, one per line)
      <textarea data-field="business-holidays" value={holidays} rows={4} onChange={e=>setHolidays(e.target.value)} placeholder={"2026-12-25\n2026-12-31"}/>
    </label>
    <p className="tool-disclaimer">Country presets show selected *fixed dates only* — not official or exhaustive public-holiday calendars. Manually add observed, state/regional and floating holidays. Dates are calculated in calendar days without network access.</p>
    <Reset onClick={()=>{setStart("2026-08-24");setEnd("2026-08-28");setIncludeEnd(true);setWeekend("sat-sun");setPreset("none");setHolidays("");setShift("5");setMode("count");}}/>
    <Output text={output} error={mode==="count"?count.error:moved.error} label="WORKING DATE CALCULATION"/>
  </div>;
}

export function AdvancedTimeZoneTool() {
  const [local,setLocal]=useState("2026-08-24T09:00");
  const [source,setSource]=useState("Asia/Kolkata");
  const [zones,setZones]=useState<string[]>(["America/New_York","Europe/London"]);
  const result=useMemo(()=>planMultiZone(local,source,[source,...zones.filter(z=>z!==source)]),[local,source,zones]);
  const display=result.value;
  const summary=display?display.rows.map(row=>row.zone+"\n"+row.local).join("\n\n"):"";
  const toggle=(zone:string, checked:boolean)=>{
    setZones(current=>checked?[...current.filter(x=>x!==zone),zone].slice(-5):current.filter(x=>x!==zone));
  };
  return <div className="runner-stack" data-tool="advanced-timezone">
    <div className="math-row">
      <label>Source local date and time<input data-field="timezone-local" type="datetime-local" value={local} onChange={e=>setLocal(e.target.value)}/></label>
      <label>Original zone<select data-field="timezone-source" value={source} onChange={e=>setSource(e.target.value)}>
        {WORLD_ZONES.map(zone=><option value={zone} key={zone}>{zone}</option>)}
      </select></label>
    </div>
    <p className="text-sm">Compare up to five additional time zones:</p>
    <div className="grid grid-cols-2 gap-2 text-xs" data-field="timezone-targets">
      {WORLD_ZONES.filter(z=>z!==source).map(zone=><label className="check-field" key={zone}><input type="checkbox" checked={zones.includes(zone)}
        onChange={e=>toggle(zone,e.target.checked)} />{zone}</label>)}
    </div>
    <p className="tool-disclaimer">DST-aware via Intl browser time-zone rules. Invalid spring-forward times are rejected; repeated fall-back times are flagged. Confirm ambiguous local times before sending invites.</p>
    <div className="flex flex-wrap gap-2"><Reset onClick={()=>{setLocal("2026-08-24T09:00");setSource("Asia/Kolkata");setZones(["America/New_York","Europe/London"]);}}/></div>
    {display&&<p className="text-xs text-amber-200" role="status">{display.warning}</p>}
    <Output text={summary} error={result.error} label="MULTI-ZONE MEETING"/>
  </div>;
}
