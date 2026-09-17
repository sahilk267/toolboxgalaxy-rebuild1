import { useState, useMemo } from "react";
import { 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Code2, 
  Layers, 
  Replace, 
  HelpCircle,
  Hash,
  Terminal,
  Clock
} from "lucide-react";

// Curated Regex presets
const REGEX_PRESETS = [
  {
    label: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    sample: "Contact us at support@orbital.io, dev.lead@tech.co.uk or test.fake@invalid."
  },
  {
    label: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    sample: "Server gateway: 192.168.1.1, DNS: 8.8.8.8, invalid: 999.12.3.4"
  },
  {
    label: "Web URL (HTTP/S)",
    pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)",
    flags: "g",
    sample: "Docs at https://docs.orbital-workbench.dev/api/v1?token=4819 and http://example.org/page#section"
  },
  {
    label: "Hex Color Code",
    pattern: "#(?:[0-9a-fA-F]{3,4}){1,2}\\b",
    flags: "g",
    sample: "Palette: #c7f36b (lime), #0e1628 (slate), #fff, #ff9b54, #123456aa"
  },
  {
    label: "ISO Date (YYYY-MM-DD)",
    pattern: "\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    sample: "Milestones: Launch on 2026-09-07, Release v2 on 2026-12-31, Invalid: 2026-15-40"
  },
  {
    label: "UUID v4",
    pattern: "\\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b",
    flags: "gi",
    sample: "Session: 7889d5fd-2bca-4b77-8e80-f7305da2598f and tracking: c9b8e1f0-4a87-4318-9182-3bf9e1201948"
  }
];

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState<string>(REGEX_PRESETS[0].pattern);
  const [flags, setFlags] = useState<{ g: boolean; i: boolean; m: boolean; s: boolean; u: boolean }>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false
  });
  const [testString, setTestString] = useState<string>(REGEX_PRESETS[0].sample);
  const [replacement, setReplacement] = useState<string>("[REDACTED]");
  const [enableReplace, setEnableReplace] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const flagString = useMemo(() => {
    let res = "";
    if (flags.g) res += "g";
    if (flags.i) res += "i";
    if (flags.m) res += "m";
    if (flags.s) res += "s";
    if (flags.u) res += "u";
    return res;
  }, [flags]);

  const evaluation = useMemo(() => {
    if (!pattern) {
      return { matches: [], error: null, count: 0, executionTimeMs: 0 };
    }

    const startTime = performance.now();
    try {
      const regex = new RegExp(pattern, flagString);
      const matches: {
        index: number;
        length: number;
        fullMatch: string;
        groups: string[];
      }[] = [];

      if (flags.g) {
        let match: RegExpExecArray | null;
        let count = 0;
        const maxMatches = 500;
        while ((match = regex.exec(testString)) !== null && count < maxMatches) {
          count++;
          matches.push({
            index: match.index,
            length: match[0].length,
            fullMatch: match[0],
            groups: match.slice(1)
          });
          if (match[0].length === 0) {
            regex.lastIndex++; // Prevent infinite loop on zero-length matches
          }
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          matches.push({
            index: match.index,
            length: match[0].length,
            fullMatch: match[0],
            groups: match.slice(1)
          });
        }
      }

      let replacedResult = "";
      if (enableReplace) {
        try {
          replacedResult = testString.replace(regex, replacement);
        } catch {
          replacedResult = testString;
        }
      }

      const executionTimeMs = +(performance.now() - startTime).toFixed(2);

      return {
        matches,
        count: matches.length,
        error: null,
        executionTimeMs,
        replacedResult
      };
    } catch (e: any) {
      return {
        matches: [],
        count: 0,
        error: e.message || "Invalid regular expression syntax.",
        executionTimeMs: 0,
        replacedResult: ""
      };
    }
  }, [pattern, flagString, testString, flags.g, enableReplace, replacement]);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadPreset = (preset: typeof REGEX_PRESETS[0]) => {
    setPattern(preset.pattern);
    setTestString(preset.sample);
    setFlags({
      g: preset.flags.includes("g"),
      i: preset.flags.includes("i"),
      m: preset.flags.includes("m"),
      s: preset.flags.includes("s"),
      u: preset.flags.includes("u")
    });
  };

  return (
    <div className="space-y-6" id="regex-tester-root">
      {/* Preset Library Strip */}
      <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-[#0e1628] border border-white/10 text-xs font-mono">
        <Sparkles size={16} className="text-lime-400 shrink-0" />
        <span className="text-white/60 uppercase">QUICK PRESETS:</span>
        <div className="flex flex-wrap gap-1.5">
          {REGEX_PRESETS.map((p) => (
            <button
              key={p.label}
              id={`preset-${p.label.toLowerCase().replace(/\W+/g, "-")}`}
              type="button"
              onClick={() => loadPreset(p)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern & Flags Bar */}
      <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-white/70">
          <span className="flex items-center gap-2 uppercase">
            <Code2 size={16} className="text-lime-400" />
            <span>REGULAR EXPRESSION &amp; FLAGS</span>
          </span>
          <div className="flex items-center gap-3">
            {evaluation.error ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> Syntax Error
              </span>
            ) : (
              <span className="text-lime-400 flex items-center gap-1">
                <CheckCircle2 size={14} /> {evaluation.count} Match{evaluation.count === 1 ? "" : "es"} ({evaluation.executionTimeMs}ms)
              </span>
            )}
          </div>
        </div>

        {/* Input with / delimiters and flag toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 flex items-center bg-[#090d18] border border-white/15 rounded-xl px-3 py-2 text-sm font-mono focus-within:border-lime-400">
            <span className="text-white/40 text-base select-none mr-2 font-bold">/</span>
            <input
              id="regex-pattern-input"
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. [a-zA-Z0-9]+"
              spellCheck={false}
              className="w-full bg-transparent text-lime-300 font-bold focus:outline-none"
            />
            <span className="text-white/40 text-base select-none ml-2 font-bold">/{flagString}</span>
          </div>

          {/* Interactive Flags */}
          <div className="flex items-center gap-1 bg-[#090d18] border border-white/10 p-1 rounded-xl">
            {(["g", "i", "m", "s", "u"] as const).map((flag) => (
              <button
                key={flag}
                id={`flag-toggle-${flag}`}
                type="button"
                onClick={() => setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }))}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                  flags[flag]
                    ? "bg-lime-400 text-black shadow"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
                title={`Toggle flag: ${flag}`}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>

        {/* Error readout if invalid */}
        {evaluation.error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {evaluation.error}
          </div>
        )}
      </div>

      {/* Test String Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-white/70">
          <label htmlFor="regex-test-input" className="uppercase flex items-center gap-1.5">
            <Terminal size={15} className="text-sky-400" />
            <span>TEST STRINGS &amp; LIVE INPUT</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              id="toggle-replace-btn"
              type="button"
              onClick={() => setEnableReplace(!enableReplace)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                enableReplace ? "bg-sky-400 text-black font-bold" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Replace size={13} />
              <span>Replace Mode</span>
            </button>
            {testString && (
              <button
                type="button"
                onClick={() => setTestString("")}
                className="text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          id="regex-test-input"
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter text to match against regex..."
          rows={6}
          spellCheck={false}
          className="w-full p-4 text-xs sm:text-sm font-mono bg-[#090d18] border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400 leading-relaxed"
        />
      </div>

      {/* Replace Mode Input */}
      {enableReplace && (
        <div className="p-4 rounded-xl bg-[#0e1628] border border-sky-400/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-sky-300 uppercase flex items-center gap-1.5 font-bold">
              <Replace size={15} />
              <span>SUBSTITUTION STRING ($1, $2, $&amp; SUPPORTED)</span>
            </span>
            <button
              id="copy-replace-btn"
              type="button"
              onClick={() => handleCopy(evaluation.replacedResult || "", "replaced")}
              className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
            >
              {copiedKey === "replaced" ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
              <span>{copiedKey === "replaced" ? "Copied" : "Copy Result"}</span>
            </button>
          </div>

          <input
            id="regex-replace-input"
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replacement string (e.g. [REDACTED] or $1)"
            className="w-full px-3 py-2 text-xs font-mono bg-[#090d18] border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
          />

          <div className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-sky-200 break-all select-all">
            {evaluation.replacedResult || "(Empty output)"}
          </div>
        </div>
      )}

      {/* Match Breakdown & Capture Groups */}
      <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/10 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white/70 uppercase flex items-center gap-1.5">
            <Layers size={15} className="text-lime-400" />
            <span>MATCH DETAILS &amp; CAPTURE GROUPS ({evaluation.matches.length})</span>
          </span>
          <button
            id="copy-all-matches-btn"
            type="button"
            onClick={() => handleCopy(evaluation.matches.map(m => m.fullMatch).join("\n"), "all-matches")}
            className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white"
          >
            {copiedKey === "all-matches" ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
            <span>{copiedKey === "all-matches" ? "Copied" : "Copy All Matches"}</span>
          </button>
        </div>

        {evaluation.matches.length > 0 ? (
          <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
            {evaluation.matches.map((m, idx) => (
              <div key={`${m.index}-${idx}`} className="p-3 bg-black/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-lime-400/20 text-lime-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-slate-100 font-bold select-all inline-block break-all">
                      {m.fullMatch}
                    </span>
                    {m.groups.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {m.groups.map((g, gIdx) => (
                          <span key={gIdx} className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px]">
                            Group {gIdx + 1}: <b className="text-white">{g || "(empty)"}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] text-white/40">
                  <span>Pos: {m.index}–{m.index + m.length}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(m.fullMatch, `m-${idx}`)}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                    title="Copy this match"
                  >
                    {copiedKey === `m-${idx}` ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-white/5 text-center text-xs font-mono text-white/40">
            No matches found for the given pattern in the test string.
          </div>
        )}
      </div>
    </div>
  );
}
