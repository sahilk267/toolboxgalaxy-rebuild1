// Orbital Workbench: Zero-dependency generative tools (Lorem Ipsum, Random Number & Dice, SEO Meta Generator, Username Generator)
import { useState, useMemo, useCallback } from "react";
import {
  Check,
  Clipboard,
  RotateCcw,
  Sparkles,
  Dices,
  Globe,
  AtSign,
  Copy,
  Download,
  Share2,
  SlidersHorizontal,
  ExternalLink,
  Search,
  Eye,
  Hash,
  Coins,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

// ==========================================
// 1. LOREM IPSUM GENERATOR
// ==========================================

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
  "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
  "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
  "est", "laborum", "at", "vero", "eos", "accusamus", "iusto", "odio", "dignissimos", "ducimus",
  "blanditiis", "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores", "quas", "molestias",
  "excepturi", "sint", "obcaecati", "cupiditate", "provident", "similique", "militia", "fuga", "harum", "quidem",
  "rerum", "facilis", "expedita", "distinctio", "nam", "libero", "tempore", "soluta", "nobis", "eligendi",
  "optio", "cumque", "nihil", "impedit", "quo", "minus", "quod", "maxime", "placeat", "facere",
  "possimus", "omnis", "voluptas", "assumenda", "repellendus", "temporibus", "autem", "quibusdam", "officiis", "debitis",
  "saepe", "eveniet", "voluptates", "repudiandae", "sint", "molestiae", "recusandae", "itaque", "earum", "hic",
  "tenetur", "sapiente", "delectus", "reiciendis", "maiores", "alias", "perferendis", "doloribus", "asperiores", "repellat"
];

function getRandomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function generateSentence(minWords = 8, maxWords = 16): string {
  const count = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(getRandomWord());
  }
  // Add occasional comma
  if (count > 8 && Math.random() > 0.4) {
    const commaIdx = Math.floor(count / 2);
    words[commaIdx] += ",";
  }
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function generateParagraph(sentenceCount = 5): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(" ");
}

export function LoremIpsumTool() {
  const [type, setType] = useState<"paragraphs" | "sentences" | "words" | "lists">("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [wrapTags, setWrapTags] = useState(false);
  const [copied, setCopied] = useState(false);

  const textOutput = useMemo(() => {
    if (type === "paragraphs") {
      const paras: string[] = [];
      for (let i = 0; i < count; i++) {
        let p = generateParagraph(4 + (i % 3));
        if (i === 0 && startWithLorem) {
          p = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " + p;
        }
        paras.push(wrapTags ? `<p>${p}</p>` : p);
      }
      return paras.join(wrapTags ? "\n\n" : "\n\n");
    }

    if (type === "sentences") {
      const sents: string[] = [];
      for (let i = 0; i < count; i++) {
        let s = generateSentence();
        if (i === 0 && startWithLorem) {
          s = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
        }
        sents.push(wrapTags ? `<p>${s}</p>` : s);
      }
      return sents.join(" ");
    }

    if (type === "words") {
      const words: string[] = [];
      if (startWithLorem && count >= 5) {
        words.push("Lorem", "ipsum", "dolor", "sit", "amet");
      }
      while (words.length < count) {
        words.push(getRandomWord());
      }
      return words.slice(0, count).join(" ");
    }

    if (type === "lists") {
      const items: string[] = [];
      for (let i = 0; i < count; i++) {
        const item = generateSentence(4, 9).replace(/\.$/, "");
        items.push(wrapTags ? `  <li>${item}</li>` : `• ${item}`);
      }
      return wrapTags ? `<ul>\n${items.join("\n")}\n</ul>` : items.join("\n");
    }

    return "";
  }, [type, count, startWithLorem, wrapTags]);

  const stats = useMemo(() => {
    const trimmed = textOutput.replace(/<[^>]*>/g, "").trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = trimmed.length;
    const paras = type === "paragraphs" ? count : textOutput.split(/\n\n+/).length;
    return { words, chars, paras };
  }, [textOutput, type, count]);

  const handleCopy = async () => {
    if (!textOutput) return;
    await navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([textOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorem-ipsum-${count}-${type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="runner-stack" data-tool="lorem-ipsum">
      {/* Controls Bar */}
      <div className="math-row">
        <label>
          Generate Type
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
            <option value="lists">Bullet List</option>
          </select>
        </label>
        <label>
          Quantity ({count})
          <input
            type="number"
            min={1}
            max={type === "words" ? 500 : 50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(type === "words" ? 500 : 50, Number(e.target.value) || 1)))}
          />
        </label>
        <label>
          Preset Quick Picks
          <div className="flex gap-1.5 pt-1">
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                className={`toggle-button flex-1 text-xs py-1.5 ${count === n ? "toggle-button--active" : ""}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </label>
      </div>

      {/* Option Toggles */}
      <div className="check-cluster flex flex-wrap gap-4 py-1">
        <label className="check-field flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
            className="w-4 h-4 accent-[#c7f36b]"
          />
          Start with &quot;Lorem ipsum dolor sit amet...&quot;
        </label>
        <label className="check-field flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={wrapTags}
            onChange={(e) => setWrapTags(e.target.checked)}
            className="w-4 h-4 accent-[#c7f36b]"
          />
          Wrap with HTML tags ({type === "lists" ? "<ul><li>" : "<p>"})
        </label>
      </div>

      {/* Live Text Area Output */}
      <div className="result-block">
        <div className="telemetry-strip flex justify-between items-center px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span>{stats.words} WORDS</span>
            <span>·</span>
            <span>{stats.chars} CHARACTERS</span>
            <span>·</span>
            <span>{stats.paras} PARAGRAPHS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="copy-button text-xs flex items-center gap-1 hover:text-white transition"
              title="Download text file"
            >
              <Download size={13} />
              TXT
            </button>
            <button
              onClick={handleCopy}
              className="copy-button text-xs flex items-center gap-1 text-[#c7f36b]"
            >
              {copied ? <Check size={13} /> : <Clipboard size={13} />}
              {copied ? "COPIED" : "COPY TEXT"}
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={textOutput}
          rows={10}
          className="w-full bg-transparent p-4 text-sm font-mono text-white/90 focus:outline-none resize-y border-none"
        />
      </div>
    </div>
  );
}

// ==========================================
// 2. RANDOM NUMBER & DICE GENERATOR
// ==========================================

export function RandomNumberTool() {
  const [tab, setTab] = useState<"numbers" | "dice" | "coin">("numbers");

  // Numbers State
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");
  const [isDecimal, setIsDecimal] = useState(false);
  const [precision, setPrecision] = useState(2);
  const [results, setResults] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  // Dice State
  const [diceSides, setDiceSides] = useState<number>(6);
  const [diceCount, setDiceCount] = useState<number>(2);
  const [diceRolls, setDiceRolls] = useState<number[]>([4, 6]);

  // Coin State
  const [coinHistory, setCoinHistory] = useState<("HEADS" | "TAILS")[]>([]);
  const [lastCoin, setLastCoin] = useState<"HEADS" | "TAILS" | null>(null);

  // Cryptographically secure random integer
  const generateSecureRandomInt = (minVal: number, maxVal: number): number => {
    const range = maxVal - minVal + 1;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return minVal + (array[0] % range);
  };

  const generateNumbers = useCallback(() => {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    const rangeSize = upper - lower + 1;

    if (!isDecimal && !allowDuplicates && count > rangeSize) {
      // Cannot generate more unique numbers than range
      const capped = rangeSize;
      const set = new Set<number>();
      while (set.size < capped) {
        set.add(generateSecureRandomInt(lower, upper));
      }
      let arr = Array.from(set);
      if (sortOrder === "asc") arr.sort((a, b) => a - b);
      if (sortOrder === "desc") arr.sort((a, b) => b - a);
      setResults(arr);
      return;
    }

    const output: number[] = [];
    const used = new Set<number>();

    for (let i = 0; i < count; i++) {
      if (isDecimal) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const factor = array[0] / (0xffffffff + 1);
        const val = lower + factor * (upper - lower);
        output.push(Number(val.toFixed(precision)));
      } else {
        if (!allowDuplicates) {
          let attempts = 0;
          let candidate = generateSecureRandomInt(lower, upper);
          while (used.has(candidate) && attempts < 1000) {
            candidate = generateSecureRandomInt(lower, upper);
            attempts++;
          }
          used.add(candidate);
          output.push(candidate);
        } else {
          output.push(generateSecureRandomInt(lower, upper));
        }
      }
    }

    if (sortOrder === "asc") output.sort((a, b) => a - b);
    if (sortOrder === "desc") output.sort((a, b) => b - a);
    setResults(output);
  }, [min, max, count, allowDuplicates, sortOrder, isDecimal, precision]);

  // Roll Dice
  const handleRollDice = () => {
    const rolls: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      rolls.push(generateSecureRandomInt(1, diceSides));
    }
    setDiceRolls(rolls);
  };

  // Flip Coin
  const handleFlipCoin = () => {
    const isHeads = generateSecureRandomInt(0, 1) === 0;
    const flip = isHeads ? "HEADS" : "TAILS";
    setLastCoin(flip);
    setCoinHistory((prev) => [flip, ...prev.slice(0, 19)]);
  };

  // Stats for numbers
  const numberStats = useMemo(() => {
    if (!results.length) return null;
    const sum = results.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / results.length;
    const minVal = Math.min(...results);
    const maxVal = Math.max(...results);
    return {
      sum: isDecimal ? sum.toFixed(2) : sum,
      avg: avg.toFixed(2),
      min: minVal,
      max: maxVal
    };
  }, [results, isDecimal]);

  const copyResults = async () => {
    const text = results.join(", ");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="runner-stack" data-tool="random-number">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 gap-2 pb-2">
        <button
          className={`toggle-button flex items-center gap-2 ${tab === "numbers" ? "toggle-button--active" : ""}`}
          onClick={() => setTab("numbers")}
        >
          <Hash size={14} />
          Random Numbers
        </button>
        <button
          className={`toggle-button flex items-center gap-2 ${tab === "dice" ? "toggle-button--active" : ""}`}
          onClick={() => setTab("dice")}
        >
          <Dices size={14} />
          Dice Roller
        </button>
        <button
          className={`toggle-button flex items-center gap-2 ${tab === "coin" ? "toggle-button--active" : ""}`}
          onClick={() => setTab("coin")}
        >
          <Coins size={14} />
          Coin Toss
        </button>
      </div>

      {/* NUMBERS TAB */}
      {tab === "numbers" && (
        <div className="space-y-4">
          <div className="math-row">
            <label>
              Minimum Value
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
              />
            </label>
            <label>
              Maximum Value
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
              />
            </label>
            <label>
              Quantity Count
              <input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
              />
            </label>
          </div>

          <div className="math-row">
            <label>
              Sort Sequence
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
                <option value="none">As Generated (Random)</option>
                <option value="asc">Ascending (Lowest First)</option>
                <option value="desc">Descending (Highest First)</option>
              </select>
            </label>
            <label>
              Number Format
              <select
                value={isDecimal ? "decimal" : "integer"}
                onChange={(e) => setIsDecimal(e.target.value === "decimal")}
              >
                <option value="integer">Whole Integers</option>
                <option value="decimal">Decimals / Floats</option>
              </select>
            </label>
            <label className="flex flex-col justify-end">
              <span className="text-xs text-white/60 mb-2">Duplicate Policy</span>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => setAllowDuplicates(e.target.checked)}
                  className="w-4 h-4 accent-[#c7f36b]"
                />
                Allow repeated numbers
              </label>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={generateNumbers}
              className="signal-button flex items-center gap-2 px-5 py-2.5"
            >
              <Sparkles size={15} />
              Generate Secure Random Numbers
            </button>
            {results.length > 0 && (
              <button
                onClick={copyResults}
                className="quiet-button flex items-center gap-2 px-4 py-2.5"
              >
                {copied ? <Check size={14} className="text-[#c7f36b]" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Values"}
              </button>
            )}
          </div>

          {/* Results Block */}
          {results.length > 0 && (
            <div className="result-block mt-4">
              <div className="telemetry-strip flex justify-between items-center px-4 py-2 border-b border-white/10">
                <span className="text-[#c7f36b] font-mono text-xs">
                  {results.length} VALUES GENERATED · CRYPTOGRAPHIC RNG
                </span>
                {numberStats && (
                  <span className="text-xs text-white/50 font-mono">
                    MIN: {numberStats.min} | MAX: {numberStats.max} | AVG: {numberStats.avg} | SUM: {numberStats.sum}
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {results.map((val, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded bg-white/5 border border-white/10 font-mono text-base text-[#c7f36b] font-bold"
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DICE TAB */}
      {tab === "dice" && (
        <div className="space-y-4">
          <div className="math-row">
            <label>
              Dice Type
              <select value={diceSides} onChange={(e) => setDiceSides(Number(e.target.value))}>
                <option value={4}>D4 (4-sided tetrahedron)</option>
                <option value={6}>D6 (Standard 6-sided)</option>
                <option value={8}>D8 (8-sided octahedron)</option>
                <option value={10}>D10 (10-sided percentile)</option>
                <option value={12}>D12 (12-sided dodecahedron)</option>
                <option value={20}>D20 (20-sided RPG die)</option>
                <option value={100}>D100 (100-sided percentile)</option>
              </select>
            </label>
            <label>
              Number of Dice ({diceCount})
              <input
                type="range"
                min={1}
                max={8}
                value={diceCount}
                onChange={(e) => setDiceCount(Number(e.target.value))}
                className="accent-[#c7f36b]"
              />
            </label>
            <label className="flex items-end">
              <button
                onClick={handleRollDice}
                className="signal-button w-full flex items-center justify-center gap-2 py-2.5"
              >
                <Dices size={16} />
                Roll {diceCount}d{diceSides}
              </button>
            </label>
          </div>

          <div className="result-block p-6 text-center">
            <div className="text-xs text-white/50 font-mono mb-4">
              ROLL RESULT · {diceCount}D{diceSides}
            </div>
            <div className="flex justify-center flex-wrap gap-4 items-center mb-4">
              {diceRolls.map((roll, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 rounded-xl border-2 border-[#c7f36b]/40 bg-[#c7f36b]/10 flex flex-col items-center justify-center font-display font-bold text-2xl text-white shadow-lg"
                >
                  <span>{roll}</span>
                  <span className="text-[10px] text-white/40 font-mono">D{diceSides}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 text-white/80 font-mono text-sm">
              Total Sum: <strong className="text-[#c7f36b] text-xl ml-1">{diceRolls.reduce((a, b) => a + b, 0)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* COIN TAB */}
      {tab === "coin" && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <button
              onClick={handleFlipCoin}
              className="signal-button text-base px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 mx-auto"
            >
              <Coins size={18} />
              Flip Coin (50/50)
            </button>
          </div>

          {lastCoin && (
            <div className="result-block p-8 text-center">
              <div
                className={`w-28 h-28 mx-auto rounded-full border-4 flex items-center justify-center font-display font-black text-2xl tracking-wider shadow-2xl mb-4 transition-all ${
                  lastCoin === "HEADS"
                    ? "border-amber-400 bg-amber-400/20 text-amber-300"
                    : "border-sky-400 bg-sky-400/20 text-sky-300"
                }`}
              >
                {lastCoin}
              </div>
              <p className="text-sm text-white/70 font-mono">
                {lastCoin === "HEADS" ? "🪙 Heads Up!" : "⚡ Tails Won!"}
              </p>
            </div>
          )}

          {coinHistory.length > 0 && (
            <div className="border border-white/10 rounded-lg p-3 bg-white/5">
              <div className="text-xs text-white/50 font-mono mb-2">RECENT FLIP HISTORY</div>
              <div className="flex flex-wrap gap-2">
                {coinHistory.map((flip, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 text-xs font-mono rounded ${
                      flip === "HEADS" ? "bg-amber-400/20 text-amber-300" : "bg-sky-400/20 text-sky-300"
                    }`}
                  >
                    {flip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. SEO META TAG GENERATOR
// ==========================================

export function SeoMetaTool() {
  const [title, setTitle] = useState("Toolbox Galaxy — Verified Local Browser Tools & Games");
  const [description, setDescription] = useState(
    "Explore 50+ privacy-first, zero-telemetry tools and offline web games. Convert files, calculate finance, edit images, and run developer utilities."
  );
  const [url, setUrl] = useState("https://toolboxgalaxy.com");
  const [siteName, setSiteName] = useState("Toolbox Galaxy");
  const [author, setAuthor] = useState("Aaditech Solution");
  const [ogImage, setOgImage] = useState("https://toolboxgalaxy.com/og/og-tools-foundry.png");
  const [twitterCard, setTwitterCard] = useState<"summary_large_image" | "summary">("summary_large_image");
  const [robots, setRobots] = useState("index, follow");
  const [keywords, setKeywords] = useState("free online tools, local-first utilities, developer tools, pdf editor, qr generator");
  const [activeTab, setActiveTab] = useState<"preview" | "html" | "nextjs">("preview");
  const [copied, setCopied] = useState(false);

  // Character length indicators
  const titleLen = title.length;
  const descLen = description.length;

  const htmlOutput = useMemo(() => {
    return `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">
<meta name="keywords" content="${keywords}">
<meta name="author" content="${author}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${url}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${ogImage}">
<meta property="og:site_name" content="${siteName}">

<!-- Twitter -->
<meta property="twitter:card" content="${twitterCard}">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">
<meta property="twitter:image" content="${ogImage}">`;
  }, [title, description, keywords, author, robots, url, ogImage, siteName, twitterCard]);

  const nextJsOutput = useMemo(() => {
    return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${title.replace(/'/g, "\\'")}',
  description: '${description.replace(/'/g, "\\'")}',
  keywords: ${JSON.stringify(keywords.split(",").map((s) => s.trim()))},
  authors: [{ name: '${author.replace(/'/g, "\\'")}' }],
  robots: '${robots}',
  alternates: {
    canonical: '${url}',
  },
  openGraph: {
    type: 'website',
    url: '${url}',
    title: '${title.replace(/'/g, "\\'")}',
    description: '${description.replace(/'/g, "\\'")}',
    siteName: '${siteName.replace(/'/g, "\\'")}',
    images: [
      {
        url: '${ogImage}',
        width: 1200,
        height: 630,
        alt: '${title.replace(/'/g, "\\'")}',
      },
    ],
  },
  twitter: {
    card: '${twitterCard}',
    title: '${title.replace(/'/g, "\\'")}',
    description: '${description.replace(/'/g, "\\'")}',
    images: ['${ogImage}'],
  },
};`;
  }, [title, description, keywords, author, robots, url, ogImage, siteName, twitterCard]);

  const copyActiveCode = async () => {
    const text = activeTab === "nextjs" ? nextJsOutput : htmlOutput;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="runner-stack" data-tool="seo-meta">
      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-white/80">
              Page Title ({titleLen} chars)
            </label>
            <span
              className={`text-[11px] font-mono ${
                titleLen >= 40 && titleLen <= 65 ? "text-[#c7f36b]" : "text-amber-400"
              }`}
            >
              {titleLen >= 40 && titleLen <= 65 ? "✓ Optimal (50-60 chars)" : "Optimal: 50-60 chars"}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Website — High Quality Web Apps"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-white/80">
              Meta Description ({descLen} chars)
            </label>
            <span
              className={`text-[11px] font-mono ${
                descLen >= 120 && descLen <= 165 ? "text-[#c7f36b]" : "text-amber-400"
              }`}
            >
              {descLen >= 120 && descLen <= 165 ? "✓ Optimal (150-160 chars)" : "Optimal: 150-160 chars"}
            </span>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A compelling 150-160 character summary of your webpage."
          />
        </div>

        <div className="math-row">
          <label>
            Canonical URL
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
            />
          </label>
          <label>
            Site Brand Name
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Brand Name"
            />
          </label>
          <label>
            Author / Company
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author Name"
            />
          </label>
        </div>

        <div className="math-row">
          <label className="col-span-2">
            OG Share Image URL (1200×630 recommended)
            <input
              type="url"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://example.com/og-image.png"
            />
          </label>
          <label>
            Twitter Card Format
            <select
              value={twitterCard}
              onChange={(e) => setTwitterCard(e.target.value as any)}
            >
              <option value="summary_large_image">Large Image Card (Recommended)</option>
              <option value="summary">Small Thumbnail Card</option>
            </select>
          </label>
        </div>
      </div>

      {/* Output / Preview Tabs */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2">
            <button
              className={`toggle-button flex items-center gap-1.5 text-xs ${
                activeTab === "preview" ? "toggle-button--active" : ""
              }`}
              onClick={() => setActiveTab("preview")}
            >
              <Eye size={13} />
              Live SERP & Social Preview
            </button>
            <button
              className={`toggle-button flex items-center gap-1.5 text-xs ${
                activeTab === "html" ? "toggle-button--active" : ""
              }`}
              onClick={() => setActiveTab("html")}
            >
              <Globe size={13} />
              HTML &lt;meta&gt; Tags
            </button>
            <button
              className={`toggle-button flex items-center gap-1.5 text-xs ${
                activeTab === "nextjs" ? "toggle-button--active" : ""
              }`}
              onClick={() => setActiveTab("nextjs")}
            >
              Next.js Metadata Object
            </button>
          </div>
          {activeTab !== "preview" && (
            <button
              onClick={copyActiveCode}
              className="copy-button text-xs flex items-center gap-1 text-[#c7f36b]"
            >
              {copied ? <Check size={13} /> : <Clipboard size={13} />}
              {copied ? "COPIED CODE" : "COPY CODE"}
            </button>
          )}
        </div>

        {/* PREVIEW TAB */}
        {activeTab === "preview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google SERP Preview */}
            <div className="border border-white/15 rounded-xl p-4 bg-[#1f2937]/30">
              <div className="flex items-center gap-2 text-xs text-white/40 font-mono mb-3">
                <Search size={12} />
                GOOGLE SEARCH RESULT PREVIEW
              </div>
              <div className="bg-[#202124] p-4 rounded-lg text-left shadow">
                <div className="flex items-center gap-2 mb-1 text-xs text-[#bdc1c6]">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    ●
                  </div>
                  <span className="truncate max-w-[200px]">{url.replace(/^https?:\/\//, "")}</span>
                </div>
                <h3 className="text-[#8ab4f8] text-base font-medium hover:underline cursor-pointer leading-tight mb-1 truncate">
                  {title || "Page Title"}
                </h3>
                <p className="text-[#bdc1c6] text-xs line-clamp-2 leading-relaxed">
                  {description || "Meta description snippet will appear here on search engine result pages."}
                </p>
              </div>
            </div>

            {/* Social Share Card Preview */}
            <div className="border border-white/15 rounded-xl p-4 bg-[#1f2937]/30">
              <div className="flex items-center gap-2 text-xs text-white/40 font-mono mb-3">
                <Share2 size={12} />
                SOCIAL OPEN GRAPH CARD PREVIEW
              </div>
              <div className="border border-white/20 rounded-lg overflow-hidden bg-[#111827] shadow">
                {ogImage ? (
                  <div className="h-32 bg-slate-800 overflow-hidden relative">
                    <img
                      src={ogImage}
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-slate-800 flex items-center justify-center text-xs text-white/40 font-mono">
                    1200 × 630 IMAGE PREVIEW
                  </div>
                )}
                <div className="p-3">
                  <div className="text-[11px] text-white/40 uppercase font-mono tracking-wider mb-0.5">
                    {siteName || "WEBSITE.COM"}
                  </div>
                  <div className="text-white font-semibold text-sm truncate mb-1">
                    {title || "Card Headline"}
                  </div>
                  <p className="text-white/60 text-xs line-clamp-2">
                    {description || "Social card summary description."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTML TAB */}
        {activeTab === "html" && (
          <div className="result-block">
            <pre className="p-4 text-xs font-mono text-[#c7f36b] overflow-x-auto whitespace-pre">
              {htmlOutput}
            </pre>
          </div>
        )}

        {/* NEXTJS TAB */}
        {activeTab === "nextjs" && (
          <div className="result-block">
            <pre className="p-4 text-xs font-mono text-[#c7f36b] overflow-x-auto whitespace-pre">
              {nextJsOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. USERNAME & GAMERTAG GENERATOR
// ==========================================

const THEMES = {
  tech: {
    adjectives: ["cyber", "binary", "quantum", "pixel", "byte", "neural", "hyper", "crypto", "matrix", "vector", "cloud", "logic"],
    nouns: ["coder", "runner", "hacker", "kernel", "dev", "daemon", "node", "craft", "pilot", "spark", "syntax", "pulse"]
  },
  gaming: {
    adjectives: ["shadow", "vortex", "apex", "ghost", "sniper", "titan", "venom", "storm", "silent", "lethal", "rapid", "phantom"],
    nouns: ["striker", "hunter", "blade", "slayer", "knight", "sniper", "reaper", "ranger", "fury", "havoc", "wraith", "reign"]
  },
  aesthetic: {
    adjectives: ["lunar", "velvet", "solar", "mystic", "cloud", "amber", "frost", "silent", "zenith", "golden", "violet", "celestial"],
    nouns: ["echo", "drift", "aura", "solace", "whisper", "haven", "bloom", "glow", "shade", "dawn", "dusk", "radiance"]
  },
  mythic: {
    adjectives: ["astral", "rune", "valkyrie", "chronos", "dragon", "arcane", "phoenix", "mystic", "ancient", "abyssal", "prime", "elder"],
    nouns: ["weaver", "forge", "nomad", "oracle", "walker", "sage", "guardian", "beast", "seeker", "sentinel", "monarch", "titan"]
  }
};

export function UsernameGeneratorTool() {
  const [theme, setTheme] = useState<"tech" | "gaming" | "aesthetic" | "mythic">("gaming");
  const [seedWord, setSeedWord] = useState("");
  const [separator, setSeparator] = useState<"" | "_" | "-" | ".">("_");
  const [numberSuffix, setNumberSuffix] = useState<"none" | "2digit" | "year">("2digit");
  const [caseStyle, setCaseStyle] = useState<"lower" | "camel" | "upper">("lower");
  const [leetspeak, setLeetspeak] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  // Leet converter
  const toLeet = (str: string): string => {
    return str
      .replace(/e/gi, "3")
      .replace(/a/gi, "4")
      .replace(/o/gi, "0")
      .replace(/i/gi, "1")
      .replace(/s/gi, "5");
  };

  const formatHandle = useCallback(
    (part1: string, part2: string): string => {
      let num = "";
      if (numberSuffix === "2digit") {
        num = String(Math.floor(Math.random() * 90) + 10);
      } else if (numberSuffix === "year") {
        num = "2026";
      }

      let combined = "";
      if (caseStyle === "camel") {
        const p1 = part1.charAt(0).toUpperCase() + part1.slice(1).toLowerCase();
        const p2 = part2.charAt(0).toUpperCase() + part2.slice(1).toLowerCase();
        combined = `${p1}${separator}${p2}${num}`;
      } else if (caseStyle === "upper") {
        combined = `${part1.toUpperCase()}${separator}${part2.toUpperCase()}${num}`;
      } else {
        combined = `${part1.toLowerCase()}${separator}${part2.toLowerCase()}${num}`;
      }

      return leetspeak ? toLeet(combined) : combined;
    },
    [separator, numberSuffix, caseStyle, leetspeak]
  );

  const [handles, setHandles] = useState<string[]>(() => {
    return [
      "shadow_striker88",
      "vortex_phantom24",
      "apex_hunter99",
      "ghost_blade07",
      "silent_wraith42",
      "lethal_reaper18",
      "storm_havoc73",
      "titan_slayer61",
      "rapid_ranger85",
      "phantom_fury12",
      "venom_knight33",
      "cyber_stalker90"
    ];
  });

  const generateNewBatch = useCallback(() => {
    const list: string[] = [];
    const currentTheme = THEMES[theme];
    const adjs = currentTheme.adjectives;
    const nouns = currentTheme.nouns;

    for (let i = 0; i < 12; i++) {
      if (seedWord.trim()) {
        const cleanSeed = seedWord.trim().replace(/\s+/g, "");
        if (i % 2 === 0) {
          const adj = adjs[Math.floor(Math.random() * adjs.length)];
          list.push(formatHandle(adj, cleanSeed));
        } else {
          const noun = nouns[Math.floor(Math.random() * nouns.length)];
          list.push(formatHandle(cleanSeed, noun));
        }
      } else {
        const adj = adjs[Math.floor(Math.random() * adjs.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        list.push(formatHandle(adj, noun));
      }
    }
    setHandles(list);
  }, [theme, seedWord, formatHandle]);

  const copySingleHandle = async (handle: string) => {
    await navigator.clipboard.writeText(handle);
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle(null), 1400);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(handles.join("\n"));
    setCopiedHandle("ALL");
    setTimeout(() => setCopiedHandle(null), 1400);
  };

  return (
    <div className="runner-stack" data-tool="username-generator">
      {/* Configuration Grid */}
      <div className="math-row">
        <label>
          Style & Vibe Archetype
          <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
            <option value="gaming">Gamer & Esports</option>
            <option value="tech">Tech & Developer</option>
            <option value="aesthetic">Aesthetic & Minimal</option>
            <option value="mythic">Fantasy & Mythic</option>
          </select>
        </label>
        <label>
          Custom Name / Seed Word (Optional)
          <input
            type="text"
            value={seedWord}
            onChange={(e) => setSeedWord(e.target.value)}
            placeholder="e.g. sahil, ninja, alex"
          />
        </label>
        <label>
          Separator
          <select value={separator} onChange={(e) => setSeparator(e.target.value as any)}>
            <option value="_">Underscore (user_name)</option>
            <option value="-">Hyphen (user-name)</option>
            <option value=".">Dot (user.name)</option>
            <option value="">None (username)</option>
          </select>
        </label>
      </div>

      <div className="math-row">
        <label>
          Number Suffix
          <select value={numberSuffix} onChange={(e) => setNumberSuffix(e.target.value as any)}>
            <option value="none">No Number</option>
            <option value="2digit">2 Digits (e.g. 88)</option>
            <option value="year">Current Year (2026)</option>
          </select>
        </label>
        <label>
          Case Styling
          <select value={caseStyle} onChange={(e) => setCaseStyle(e.target.value as any)}>
            <option value="lower">lowercase (user_name)</option>
            <option value="camel">CamelCase (User_Name)</option>
            <option value="upper">UPPERCASE (USER_NAME)</option>
          </select>
        </label>
        <label className="flex flex-col justify-end">
          <span className="text-xs text-white/60 mb-2">Leet Modifier</span>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={leetspeak}
              onChange={(e) => setLeetspeak(e.target.checked)}
              className="w-4 h-4 accent-[#c7f36b]"
            />
            1337speak (e→3, a→4, o→0)
          </label>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={generateNewBatch}
          className="signal-button flex items-center gap-2 px-5 py-2.5"
        >
          <RefreshCw size={15} />
          Generate New Handles
        </button>
        <button
          onClick={copyAll}
          className="quiet-button flex items-center gap-2 px-4 py-2.5"
        >
          {copiedHandle === "ALL" ? <Check size={14} className="text-[#c7f36b]" /> : <Copy size={14} />}
          {copiedHandle === "ALL" ? "All Copied" : "Copy All 12"}
        </button>
      </div>

      {/* Grid of Generated Handles */}
      <div className="mt-4">
        <div className="text-xs text-white/50 font-mono mb-2 flex justify-between">
          <span>CLICK ANY HANDLE CARD TO COPY TO CLIPBOARD</span>
          <span>12 UNIQUE HANDLES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {handles.map((handle, idx) => {
            const isThisCopied = copiedHandle === handle;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => copySingleHandle(handle)}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all group ${
                  isThisCopied
                    ? "border-[#c7f36b] bg-[#c7f36b]/15 shadow-md"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AtSign size={15} className={isThisCopied ? "text-[#c7f36b]" : "text-white/40"} />
                  <span className={`font-mono text-sm font-semibold truncate ${isThisCopied ? "text-[#c7f36b]" : "text-white"}`}>
                    {handle}
                  </span>
                </div>
                {isThisCopied ? (
                  <Check size={16} className="text-[#c7f36b] flex-shrink-0" />
                ) : (
                  <Copy size={14} className="text-white/30 group-hover:text-white/70 flex-shrink-0 transition" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Re-export modular zero-dependency generative tools
export { OgImageBuilderTool } from "./OgImageBuilderTool";
export { FakeDataGeneratorTool } from "./FakeDataGeneratorTool";
