import { useMemo, useState } from "react";
import { Check, Clipboard, Eye, EyeOff, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";
import {
  PASSWORD_DEFAULTS, passwordConfigError, generatePasswords, generatedPasswordEntropy,
  generatePassphrases, generatedPassphraseEntropy, PASSPHRASE_WORDLIST_SIZE,
  assessPassword, type PasswordOptions,
} from "@/lib/passwordWorkbench";

export function AdvancedPasswordGenerator() {
  const [mode, setMode] = useState<"characters" | "passphrase">("characters");
  const [config, setConfig] = useState<PasswordOptions>({ ...PASSWORD_DEFAULTS });
  const [words, setWords] = useState(8);
  const [separator, setSeparator] = useState<"-" | " " | ".">("-");
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true); // Original generator showed its output.
  const [copied, setCopied] = useState(false);
  const validation = mode === "characters" ? passwordConfigError(config) : null;
  const estimate = mode === "characters" ? generatedPasswordEntropy(config) : generatedPassphraseEntropy(words);
  const update = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    setConfig(current => ({ ...current, [key]: value }));
    setValues([]); setError("");
  };
  const reset = () => {
    setConfig({ ...PASSWORD_DEFAULTS }); setWords(8); setSeparator("-");
    setMode("characters"); setValues([]); setError(""); setVisible(true);
  };
  function generate() {
    setError("");
    try {
      setValues(mode === "characters" ? generatePasswords(config) :
        generatePassphrases(words, config.count, separator));
    } catch (reason) {
      setValues([]);
      setError(reason instanceof Error ? reason.message : "Unable to create secure passwords.");
    }
  }
  async function copyAll() {
    if (!values.length) return;
    try {
      await navigator.clipboard.writeText(values.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { setError("Clipboard not available. Select a password manually."); }
  }

  return <div className="runner-stack" data-tool="advanced-password">
    <p className="tool-disclaimer"><ShieldCheck size={15} className="inline"/> Generated locally using the browser's cryptographic random-number generator. Passwords are not uploaded or stored by this tool.</p>
    <label className="wide-field">Generate
      <select data-field="password-mode" value={mode} onChange={event => { setMode(event.target.value as "characters" | "passphrase"); setValues([]); setError(""); }}>
        <option value="characters">Random password</option><option value="passphrase">Random word passphrase</option>
      </select>
    </label>
    {mode === "characters" ? <>
      <label className="range-field">Length <strong>{config.length}</strong>
        <input data-field="password-length" type="range" min={12} max={128} value={config.length} onChange={event => update("length", Number(event.target.value))} />
      </label>
      <div className="math-row">
        {([
          ["uppercase", "Uppercase A–Z"], ["lowercase", "Lowercase a–z"],
          ["numbers", "Digits 0–9"], ["symbols", "Symbols"],
          ["excludeAmbiguous", "Avoid ambiguous O/0/I/l/1"],
        ] as const).map(([key, label]) =>
          <label key={key} className="check-field"><input data-field={"password-" + key} type="checkbox" checked={config[key]}
            onChange={event => update(key, event.target.checked)} /> {label}</label>)}
      </div>
    </> : <>
      <label className="range-field">Random words <strong>{words}</strong>
        <input data-field="passphrase-words" type="range" min={6} max={12} value={words} onChange={event => { setWords(Number(event.target.value)); setValues([]); }} />
      </label>
      <label className="wide-field">Separator
        <select value={separator} onChange={event => { setSeparator(event.target.value as "-" | " " | "."); setValues([]); }}>
          <option value="-">Hyphen (-)</option><option value=" ">Space</option><option value=".">Period (.)</option>
        </select>
      </label>
      <p className="tool-disclaimer">Words are sampled independently from {PASSPHRASE_WORDLIST_SIZE} short everyday words; use 8+ words for higher unpredictability.</p>
    </>}
    <label className="wide-field">How many?
      <select data-field="password-count" value={config.count} onChange={event => update("count", Number(event.target.value))}>
        {[1,3,5,10,20].map(count => <option key={count} value={count}>{count}</option>)}
      </select>
    </label>
    <p className="tool-disclaimer">Estimated random-choice entropy: {Number.isFinite(estimate) ? estimate.toFixed(0) : "—"} bits. Only applies to this secure generator under its selection assumptions; it is not a cracking-time or security guarantee.</p>
    {validation && <p className="text-sm text-red-300" role="alert">{validation}</p>}
    <div className="tool-action-row flex flex-wrap gap-2">
      <button type="button" className="signal-button" data-action="generate-passwords" onClick={generate} disabled={Boolean(validation)}>
        <LockKeyhole size={16}/> Generate {mode === "characters" ? "passwords" : "passphrases"}
      </button>
      <button type="button" className="reset-button" onClick={reset}><RotateCcw size={15}/> Reset</button>
      {values.length > 0 && <>
        <button type="button" className="quiet-button" onClick={() => setVisible(current => !current)}>
          {visible ? <EyeOff size={15}/> : <Eye size={15}/>} {visible ? "Hide" : "Show"}
        </button>
        <button type="button" className="quiet-button" onClick={() => void copyAll()}>
          {copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy all"}
        </button>
      </>}
    </div>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {values.length > 0 && <section className="result-block" aria-label="Generated passwords">
      <div className="telemetry-strip"><span>LOCAL GENERATED RESULT</span><strong>{values.length} {values.length === 1 ? "item" : "items"}</strong></div>
      <ol className="space-y-2 p-3" data-generated-passwords>
        {values.map((value, index) => <li key={index} className="break-all rounded-lg border border-white/10 p-2 font-mono text-sm">
          <span className="mr-2 text-white/40">{index + 1}.</span>
          {visible ? value : "•".repeat(Math.min(64, value.length))}
        </li>)}
      </ol>
    </section>}
    <p className="tool-disclaimer">Avoid reusing passwords. Copying places them in your device clipboard, which other software may access. For sensitive accounts, store new passwords in a trusted password manager.</p>
  </div>;
}

export function AdvancedPasswordAuditor() {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const audit = useMemo(() => assessPassword(value), [value]);
  const reset = () => { setValue(""); setVisible(false); };
  return <div className="runner-stack password-audit" data-tool="advanced-password-audit">
    <div className="password-audit__top">
      <label className="wide-field">Password to evaluate
        <input data-field="audit-password" type={visible ? "text" : "password"} autoComplete="off"
          value={value} onChange={event => setValue(event.target.value)} placeholder="Type a password locally" />
      </label>
      <button type="button" className="toggle-button" onClick={() => setVisible(current => !current)}>{visible ? "Hide" : "Show"}</button>
      <button type="button" className="reset-button" onClick={reset}>Clear</button>
    </div>
    <section className="rounded-xl border border-white/15 p-4" aria-label="Password strength assessment">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <strong>{audit.label}</strong><span>{audit.length} characters</span>
      </div>
      <div className="password-meter mt-3" aria-label={"Heuristic rating " + audit.label}>
        <div className={"password-meter__fill password-meter__fill--" + Math.min(6, audit.score + 1)}
          style={{ width: (audit.score / 4 * 100) + "%" }} />
        <span>{audit.label}</span>
      </div>
      {audit.issues.length > 0 && <div className="mt-3">
        <h2 className="font-semibold">Potential issues</h2>
        <ul className="mt-1 list-disc pl-5 text-sm">{audit.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>
      </div>}
      <h2 className="mt-3 font-semibold">Guidance</h2>
      <ul className="mt-1 list-disc pl-5 text-sm">{audit.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>
    </section>
    <p className="tool-disclaimer"><LockKeyhole size={15} className="inline" /> Local length/pattern heuristics only. No breach database lookup, password storage, network request or security guarantee. Unique long random passwords matter more than mandatory character composition.</p>
  </div>;
}
