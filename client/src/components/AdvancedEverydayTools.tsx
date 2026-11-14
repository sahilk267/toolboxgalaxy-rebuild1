import { useMemo, useState } from "react";
import { Check, Clipboard, Download, RotateCcw, ArrowLeftRight } from "lucide-react";
import {
  calculatePercentage, convertUnit, UNIT_CATEGORIES, UNITS,
  analyzeTextStatistics, TEXT_STATS_MAX_CHARS, displayNumber,
  type PercentMode, type UnitCategory,
} from "@/lib/advancedEverydayEngines";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError("");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard unavailable; select the output text instead.");
    }
  };
  return <span className="inline-flex flex-wrap items-center gap-2">
    <button type="button" className="copy-button" disabled={!text} onClick={copy}>
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? "Copied" : "Copy"}
    </button>
    {error && <small role="alert">{error}</small>}
  </span>;
}

function CalculationResult({ result, error, detail }: { result: string; error?: string; detail?: string }) {
  return <section className="result-block" aria-label="Calculation result">
    <div className="telemetry-strip"><span>LOCAL RESULT</span><CopyButton text={error ? "" : result + (detail ? "\n" + detail : "")} /></div>
    {error ? <p role="alert" className="p-3 text-red-300">{error}</p> :
      <><p role="status" aria-live="polite" className="break-words p-3 text-lg font-semibold">{result}</p>
        {detail && <p className="px-3 pb-3 text-sm text-white/60">{detail}</p>}</>}
  </section>;
}

const percentageModes: Record<PercentMode, {
  label: string; firstLabel: string; secondLabel: string; first: string; second: string; hint: string;
}> = {
  partOfTotal: { label: "What percent is X of Y?", firstLabel: "Part", secondLabel: "Total", first: "18", second: "120", hint: "Original calculator mode: part ÷ total × 100." },
  percentOf: { label: "Calculate X% of Y", firstLabel: "Percent (%)", secondLabel: "Amount", first: "20", second: "150", hint: "Find an exact portion of any amount." },
  change: { label: "Percentage increase / decrease", firstLabel: "Original value", secondLabel: "New value", first: "80", second: "100", hint: "Positive means increase, negative means decrease; original must not be zero." },
  difference: { label: "Symmetric percentage difference", firstLabel: "First value", secondLabel: "Second value", first: "80", second: "100", hint: "Uses average absolute magnitude, independent of the order of inputs." },
  reverseIncrease: { label: "Original before an increase", firstLabel: "Final amount", secondLabel: "Increase rate (%)", first: "120", second: "20", hint: "Find the amount before a percentage increase." },
  reverseDiscount: { label: "Original before a discount", firstLabel: "Sale price", secondLabel: "Discount rate (%)", first: "80", second: "20", hint: "A complete 100% discount cannot be reversed." },
  points: { label: "Percentage-point difference", firstLabel: "Old percentage (%)", secondLabel: "New percentage (%)", first: "12.5", second: "15", hint: "Percentage points are not the same as relative percentage change." },
};

export function AdvancedPercentageTool() {
  const [mode, setMode] = useState<PercentMode>("partOfTotal");
  const [first, setFirst] = useState("18");
  const [second, setSecond] = useState("120");
  const selected = percentageModes[mode];
  const calculation = useMemo(() => calculatePercentage(mode, first, second), [mode, first, second]);
  const reset = () => { setFirst(selected.first); setSecond(selected.second); };
  const updateMode = (next: PercentMode) => {
    setMode(next);
    setFirst(percentageModes[next].first);
    setSecond(percentageModes[next].second);
  };
  return <div className="runner-stack" data-tool="advanced-percentage">
    <label className="wide-field">Calculation type
      <select value={mode} onChange={event => updateMode(event.target.value as PercentMode)} data-field="percentage-mode">
        {(Object.keys(percentageModes) as PercentMode[]).map(key =>
          <option key={key} value={key}>{percentageModes[key].label}</option>)}
      </select>
    </label>
    <div className="math-row">
      <label>{selected.firstLabel}<input inputMode="decimal" value={first} onChange={event => setFirst(event.target.value)} data-field="percentage-first" /></label>
      <label>{selected.secondLabel}<input inputMode="decimal" value={second} onChange={event => setSecond(event.target.value)} data-field="percentage-second" /></label>
    </div>
    <p className="tool-disclaimer">{selected.hint}</p>
    <div className="tool-action-row"><button type="button" className="reset-button" onClick={reset}><RotateCcw size={15} /> Reset</button></div>
    <CalculationResult
      result={calculation.value?.explanation ?? ""}
      error={calculation.error}
      detail={calculation.value ? "Formula: " + calculation.value.formula : undefined}
    />
  </div>;
}

export function AdvancedUnitConverterTool() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("km");
  const [to, setTo] = useState("mi");
  const available = UNITS[category];
  const converted = useMemo(() => convertUnit(category, amount, from, to), [category, amount, from, to]);
  const changeCategory = (next: UnitCategory) => {
    setCategory(next);
    setFrom(UNITS[next][0].id);
    setTo(UNITS[next][1].id);
  };
  const reset = () => { setCategory("length"); setAmount("1"); setFrom("km"); setTo("mi"); };
  return <div className="runner-stack" data-tool="advanced-unit-converter">
    <label className="wide-field">Measurement category
      <select value={category} onChange={event => changeCategory(event.target.value as UnitCategory)} data-field="unit-category">
        {UNIT_CATEGORIES.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
      </select>
    </label>
    <div className="math-row">
      <label>Value<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} data-field="unit-value" /></label>
      <label>From
        <select value={from} onChange={event => setFrom(event.target.value)} data-field="unit-from">
          {available.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>To
        <select value={to} onChange={event => setTo(event.target.value)} data-field="unit-to">
          {available.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    </div>
    <div className="tool-action-row">
      <button type="button" className="reset-button" onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight size={15} /> Swap</button>
      <button type="button" className="reset-button" onClick={reset}><RotateCcw size={15} /> Reset</button>
    </div>
    <p className="tool-disclaimer">
      US customary volume measurements (not UK imperial). KB/MB/GB are decimal; KiB/MiB/GiB are binary.
      Physical quantities cannot be negative, except temperatures above absolute zero. No currency rates or network requests.
    </p>
    <CalculationResult
      result={converted.value?.detail ?? ""}
      detail={converted.value ? "Exact factors are used; displayed results are rounded." : undefined}
      error={converted.error}
    />
  </div>;
}

function downloadReport(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "toolboxgalaxy-text-report.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdvancedTextStatisticsTool() {
  const [input, setInput] = useState("Write something useful. Then take a quick break.");
  const stats = useMemo(() => analyzeTextStatistics(input), [input]);
  const figures = [
    ["Words", stats.words],
    ["Characters", stats.characters],
    ["Without spaces", stats.withoutWhitespace],
    ["Lines", stats.lines],
    ["Sentences", stats.sentences],
    ["Paragraphs", stats.paragraphs],
    ["Unique words", stats.uniqueWords],
    ["Reading time", stats.readingMinutes + " min"],
    ["Speaking time", stats.speakingMinutes + " min"],
  ] as const;
  const report = figures.map(([name, number]) => name + ": " + number).join("\n") +
    "\n\nMost frequent words:\n" +
    stats.keywords.map(item => item.word + ": " + item.count).join("\n");
  return <div className="runner-stack" data-tool="advanced-text-statistics">
    <label className="wide-field">Your text
      <textarea rows={9} spellCheck={false} maxLength={TEXT_STATS_MAX_CHARS} value={input}
        onChange={event => setInput(event.target.value)} data-field="text-stats-input" />
    </label>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-white/60">{displayNumber(input.length)} / {displayNumber(TEXT_STATS_MAX_CHARS)} characters</p>
      <div className="tool-action-row">
        <button type="button" className="reset-button" onClick={() => setInput("")}><RotateCcw size={15} /> Clear</button>
        <CopyButton text={report} />
        <button type="button" className="copy-button" onClick={() => downloadReport(report)}><Download size={15} /> Export TXT</button>
      </div>
    </div>
    <div className="stats-grid" aria-live="polite">
      {figures.map(([name, number]) => <div className="stat-tile" key={name}><span>{name}</span><strong>{number}</strong></div>)}
    </div>
    <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4" aria-label="Most frequent words">
      <h2 className="font-semibold">Most frequent words</h2>
      {stats.keywords.length ? <ol className="mt-2 space-y-1 text-sm">
        {stats.keywords.map(item => <li key={item.word} className="flex justify-between gap-4">
          <span className="break-all">{item.word}</span><strong>{item.count}</strong>
        </li>)}
      </ol> : <p className="text-sm text-white/60">Start typing to see word frequencies.</p>}
    </section>
    <p className="tool-disclaimer">
      Live local statistics. Reading time assumes 200 words/minute and speaking time 130 words/minute.
      Unicode word and sentence segmentation depend on your browser; counts are estimates, not linguistic guarantees.
      Input is not uploaded or stored.
    </p>
  </div>;
}
