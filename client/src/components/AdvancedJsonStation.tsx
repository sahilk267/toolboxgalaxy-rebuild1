import { useMemo, useState, type ChangeEvent } from "react";
import { Check, Clipboard, Download, RotateCcw, ShieldCheck } from "lucide-react";
import {
  MAX_JSON_CHARS, MAX_DIFFS, readJson, formatJson, queryJson, compareJson,
  type JsonValue,
} from "@/lib/jsonWorkspaceEngine";
import { trackPageView } from "@/lib/analytics";

type View = "format" | "minify" | "tree" | "query" | "compare";
const views: readonly { mode: View; label: string }[] = [
  { mode: "format", label: "Format" }, { mode: "minify", label: "Minify" },
  { mode: "tree", label: "Tree Explorer" }, { mode: "query", label: "JSON Path" },
  { mode: "compare", label: "Compare JSON" },
];
function saveJson(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = "toolboxgalaxy-json.json";
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function JsonTree({ value, label, depth = 0 }: { value: JsonValue; label: string; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  if (value === null || typeof value !== "object")
    return <div className="break-all font-mono text-sm"><span className="text-white/60">{label}: </span>
      <span>{JSON.stringify(value)}</span>
    </div>;
  const names = Object.keys(value);
  const prefix = Array.isArray(value) ? "Array" : "Object";
  return <section className="ml-2 border-l border-white/20 pl-3" data-json-node>
    <button type="button" className="text-left text-sm font-mono" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      {open ? "▾" : "▸"} {label}: {prefix} ({names.length})
    </button>
    {open && <div className="ml-1 space-y-1 py-1">
      {depth >= 8 ? <p className="text-xs text-white/60">Nested data continues; use JSON Path to inspect deeper.</p> :
        names.slice(0, 75).map(key => <JsonTree key={key}
          label={Array.isArray(value) ? "[" + key + "]" : key}
          value={(value as Record<string, JsonValue>)[key]} depth={depth + 1} />)}
      {names.length > 75 && <p className="text-xs text-white/60">{names.length - 75} more entries. Use JSON Path for the full value.</p>}
    </div>}
  </section>;
}

export default function AdvancedJsonStation() {
  const [input, setInput] = useState('{"mission":"tools","status":"verified"}');
  const [mode, setMode] = useState<View>("format");
  const [sortKeys, setSortKeys] = useState(false);
  const [path, setPath] = useState("$.mission");
  const [other, setOther] = useState('{"mission":"tools","status":"complete"}');
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(() => readJson(input), [input]);
  const formatted = useMemo(() => formatJson(input, mode === "minify", sortKeys), [input, mode, sortKeys]);
  const query = useMemo(() => mode === "query" ? queryJson(input, path) : null, [input, path, mode]);
  const comparison = useMemo(() => mode === "compare" ? compareJson(input, other) : null, [input, other, mode]);
  const output = mode === "query" ? query?.output :
    mode === "format" || mode === "minify" ? formatted.output : undefined;
  const modeError = mode === "compare" ? comparison?.error :
    mode === "query" ? query?.error : parsed.error;
  const selectMode = (next: View) => {
    setMode(next); setError("");
    if (next === "format" || next === "minify")
      trackPageView(undefined, undefined, "text-formatted",
        { format: next === "format" ? "json-beautify" : "json-minify", tool_slug: "json" });
  };
  async function copyOutput() {
    if (output === undefined) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true); window.setTimeout(() => setCopied(false), 1500);
    } catch { setError("Clipboard unavailable; select the output text manually."); }
  }
  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_JSON_CHARS * 4) { setError("JSON file is too large."); return; }
    try {
      const content = await file.text();
      if (content.length > MAX_JSON_CHARS) { setError("JSON exceeds 250,000 characters."); return; }
      setInput(content); setError("");
    } catch { setError("Could not read the selected JSON file."); }
  }

  return <div className="runner-stack" data-tool="advanced-json">
    <div className="flex flex-wrap gap-2" role="group" aria-label="JSON workspace mode">
      {views.map(item => <button type="button" key={item.mode} data-json-mode={item.mode}
        className={mode === item.mode ? "toggle-button toggle-button--active" : "toggle-button"}
        aria-pressed={mode === item.mode} onClick={() => selectMode(item.mode)}>{item.label}</button>)}
    </div>
    <label className="wide-field">JSON input
      <textarea data-field="json-input" rows={10} maxLength={MAX_JSON_CHARS} spellCheck={false}
        value={input} onChange={event => { setInput(event.target.value); setError(""); }} />
    </label>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-white/60">{input.length.toLocaleString()} / {MAX_JSON_CHARS.toLocaleString()} characters</p>
      <label className="quiet-button cursor-pointer">Import .json
        <input data-field="json-file" className="sr-only" type="file" accept=".json,application/json" onChange={event => void chooseFile(event)} />
      </label>
      <button type="button" className="reset-button" onClick={() => { setInput('{"mission":"tools","status":"verified"}'); setOther('{"mission":"tools","status":"complete"}'); setSortKeys(false); setMode("format"); setError(""); }}><RotateCcw size={15}/> Reset</button>
    </div>
    {(mode === "format" || mode === "minify") && <label className="check-field">
      <input type="checkbox" data-field="json-sort" checked={sortKeys} onChange={event => setSortKeys(event.target.checked)} /> Alphabetically sort object keys (optional)
    </label>}
    {mode === "query" && <label className="wide-field">JSON path (root $, dot properties, array indices, or quoted keys)
      <input data-field="json-path" value={path} onChange={event => setPath(event.target.value)} placeholder={'$.items[0].name'} />
    </label>}
    {mode === "compare" && <label className="wide-field">Compare with JSON
      <textarea data-field="json-compare" value={other} rows={8} maxLength={MAX_JSON_CHARS}
        spellCheck={false} onChange={event => setOther(event.target.value)} />
    </label>}
    {!parsed.valid && <p role="alert" className="text-sm text-red-300">
      {parsed.error}{parsed.line !== undefined ? " (line " + parsed.line + ", column " + parsed.column + ")" : ""}
    </p>}
    {parsed.valid && modeError && <p role="alert" className="text-sm text-red-300">{modeError}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {parsed.valid && mode === "tree" && <section className="rounded-xl border border-white/15 p-4" aria-label="JSON tree explorer">
      <h2 className="mb-2 font-semibold">Explore JSON properties</h2>
      <div className="max-h-[600px] overflow-auto"><JsonTree label="$" value={parsed.value!} /></div>
    </section>}
    {mode === "compare" && comparison?.changes && <section className="rounded-xl border border-white/15 p-4" aria-label="JSON differences">
      <h2 className="font-semibold">{comparison.changes.length ? "JSON differences" : "No structural differences"}</h2>
      <p className="text-xs text-white/60">Changes are compared by path, not object-key order. Display limited to the first {MAX_DIFFS} differences.</p>
      <ol className="mt-3 max-h-[550px] space-y-2 overflow-auto" data-json-diffs>
        {comparison.changes.map((change, i) => <li key={i} className="rounded-lg border border-white/10 p-2 text-sm">
          <strong className="break-all">{change.path}</strong> <span className="text-white/60">({change.kind})</span>
          <div className="mt-1 break-all font-mono text-xs">From: {change.left}</div>
          <div className="break-all font-mono text-xs">To: {change.right}</div>
        </li>)}
      </ol>
    </section>}
    {output !== undefined && <section className="result-block" aria-label="JSON output">
      <div className="telemetry-strip"><span>VALID JSON OUTPUT</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="copy-button" onClick={() => void copyOutput()}>
            {copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="copy-button" onClick={() => saveJson(output)}><Download size={15}/> Download JSON</button>
        </div>
      </div>
      <pre data-json-output className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words p-3 text-sm">{output}</pre>
    </section>}
    <p className="tool-disclaimer"><ShieldCheck size={15} className="inline"/> All processing stays in this browser tab. Queries support safe property/index navigation (not executable expressions). Tree view limits on-screen entries/depth to stay responsive. No schema inference, remote API or network upload.</p>
  </div>;
}
