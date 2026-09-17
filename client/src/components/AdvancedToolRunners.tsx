// Orbital Workbench: ten additional browser-only tool runners; each module avoids legacy endpoints and keeps user input local.
import QRCode from "qrcode";
import { Check, Clipboard, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function Output({ value, error }: { value: string; error?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`result-block ${error ? "result-block--error" : ""}`}>
      <div className="telemetry-strip">
        <span>OUTPUT</span>
        <button type="button" onClick={copy} disabled={!value} className="copy-button">
          {copied ? <Check size={15} /> : <Clipboard size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre aria-live="polite">{error || value || "Your result will appear here."}</pre>
    </div>
  );
}

const numberOr = (value: string) => (Number.isFinite(Number(value)) ? Number(value) : null);

export function BmiTool() {
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");

  const output = useMemo(() => {
    const cm = numberOr(height);
    const kg = numberOr(weight);
    if (!cm || !kg || cm <= 0 || kg <= 0) return "Enter a positive height and weight.";
    const bmi = kg / (cm / 100) ** 2;
    const status =
      bmi < 18.5
        ? "Below the standard adult range"
        : bmi < 25
        ? "Within the standard adult range"
        : bmi < 30
        ? "Above the standard adult range"
        : "Well above the standard adult range";
    return `BMI ${bmi.toFixed(1)}\n${status}`;
  }, [height, weight]);

  return (
    <div className="runner-stack">
      <div className="math-row">
        <label>
          Height (cm)
          <input
            inputMode="decimal"
            value={height}
            onChange={(event) => setHeight(event.target.value)}
          />
        </label>
        <label>
          Weight (kg)
          <input
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
      </div>
      <p className="tool-disclaimer">
        General adult screening reference only; it is not medical advice.
      </p>
      <Output value={output} />
    </div>
  );
}

export function DiscountTool() {
  const [price, setPrice] = useState("89.99");
  const [discount, setDiscount] = useState("20");

  const output = useMemo(() => {
    const base = numberOr(price);
    const percent = numberOr(discount);
    if (base === null || percent === null || base < 0 || percent < 0 || percent > 100) {
      return "Enter a valid price and a discount from 0–100.";
    }
    const saved = (base * percent) / 100;
    return `Final price ${new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(base - saved)}\nYou save ${new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(saved)}`;
  }, [price, discount]);

  return (
    <div className="runner-stack">
      <div className="math-row">
        <label>
          Original price
          <input
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>
        <label>
          Discount (%)
          <input
            inputMode="decimal"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
          />
        </label>
      </div>
      <Output value={output} />
    </div>
  );
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

function ageParts(start: Date, end: Date) {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function AgeTool() {
  const [birth, setBirth] = useState("1998-06-15");
  const [onDate, setOnDate] = useState(formatDate(new Date()));

  const output = useMemo(() => {
    const from = new Date(`${birth}T00:00:00`);
    const to = new Date(`${onDate}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
      return "Choose a valid date on or after the date of birth.";
    }
    const age = ageParts(from, to);
    const totalDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
    return `${age.years} years, ${age.months} months, ${age.days} days\n${totalDays.toLocaleString()} days elapsed`;
  }, [birth, onDate]);

  return (
    <div className="runner-stack">
      <div className="math-row">
        <label>
          Date of birth
          <input
            type="date"
            value={birth}
            onChange={(event) => setBirth(event.target.value)}
          />
        </label>
        <label>
          Calculate on
          <input
            type="date"
            value={onDate}
            onChange={(event) => setOnDate(event.target.value)}
          />
        </label>
      </div>
      <Output value={output} />
    </div>
  );
}

export function DateDifferenceTool() {
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-12-31");

  const output = useMemo(() => {
    const from = new Date(`${start}T00:00:00`);
    const to = new Date(`${end}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return "Choose two valid dates.";
    }
    const days = Math.abs(Math.round((to.getTime() - from.getTime()) / 86400000));
    return `${days.toLocaleString()} days\n${(days / 7).toFixed(2)} weeks`;
  }, [start, end]);

  return (
    <div className="runner-stack">
      <div className="math-row">
        <label>
          Start date
          <input
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
      </div>
      <Output value={output} />
    </div>
  );
}

function CombinedTransform({ mode }: { mode: "url" | "html" }) {
  const [operation, setOperation] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState(
    mode === "url"
      ? "https://toolboxgalaxy.com/tools?module=QR & mode=local"
      : '<section class="module">Toolbox & Galaxy</section>'
  );

  const { value, error } = useMemo(() => {
    try {
      if (mode === "url") {
        return {
          value: operation === "encode" ? encodeURIComponent(input) : decodeURIComponent(input),
          error: "",
        };
      }
      const textarea = document.createElement("textarea");
      if (operation === "encode") {
        textarea.textContent = input;
        return { value: textarea.innerHTML, error: "" };
      }
      textarea.innerHTML = input;
      return { value: textarea.value, error: "" };
    } catch {
      return {
        value: "",
        error: "This text is not valid for decoding. Check the encoded input and try again.",
      };
    }
  }, [input, operation, mode]);

  const inputLabel =
    mode === "url"
      ? operation === "encode"
        ? "Plain text or URL"
        : "Encoded URL component"
      : operation === "encode"
      ? "HTML or plain text"
      : "HTML entities";

  return (
    <div className="runner-stack">
      <div className="toggle-row" aria-label={`${mode.toUpperCase()} transform mode`}>
        <button
          type="button"
          onClick={() => setOperation("encode")}
          className={operation === "encode" ? "toggle-button toggle-button--active" : "toggle-button"}
        >
          Encode
        </button>
        <button
          type="button"
          onClick={() => setOperation("decode")}
          className={operation === "decode" ? "toggle-button toggle-button--active" : "toggle-button"}
        >
          Decode
        </button>
      </div>
      <label className="wide-field">
        {inputLabel}
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={7}
          spellCheck="false"
        />
      </label>
      <Output value={value} error={error} />
    </div>
  );
}

export function UrlTool() {
  return <CombinedTransform mode="url" />;
}

export function HtmlTool() {
  return <CombinedTransform mode="html" />;
}

const wordsFrom = (value: string) => value.trim().split(/[^A-Za-z0-9]+/).filter(Boolean);

export function TextCaseTool() {
  const [input, setInput] = useState("Toolbox Galaxy makes small things easy");
  const [mode, setMode] = useState("title");

  const output = useMemo(() => {
    const words = wordsFrom(input);
    if (!words.length) return "";
    const lower = words.map((word) => word.toLowerCase());
    if (mode === "upper") return input.toUpperCase();
    if (mode === "lower") return input.toLowerCase();
    if (mode === "sentence") return `${lower.join(" ").replace(/^./, (letter) => letter.toUpperCase())}.`;
    if (mode === "camel") return lower.map((word, index) => (index ? word[0].toUpperCase() + word.slice(1) : word)).join("");
    if (mode === "kebab") return lower.join("-");
    return lower.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  }, [input, mode]);

  return (
    <div className="runner-stack">
      <label>
        Case
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="title">Title Case</option>
          <option value="sentence">Sentence case</option>
          <option value="upper">UPPERCASE</option>
          <option value="lower">lowercase</option>
          <option value="camel">camelCase</option>
          <option value="kebab">kebab-case</option>
        </select>
      </label>
      <label className="wide-field">
        Text
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={7}
        />
      </label>
      <Output value={output} />
    </div>
  );
}

const fallbackUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    return (token === "x" ? random : (random & 3) | 8).toString(16);
  });

export function UuidTool() {
  const [value, setValue] = useState("");
  const generate = () => setValue(crypto.randomUUID ? crypto.randomUUID() : fallbackUuid());

  return (
    <div className="runner-stack">
      <p className="tool-disclaimer">Uses the browser cryptography API; nothing is sent to a server.</p>
      <div className="flex gap-3">
        <button type="button" onClick={generate} className="signal-button">
          <RefreshCw size={15} /> Generate UUID
        </button>
        <button type="button" onClick={() => setValue("")} className="reset-button">
          Clear
        </button>
      </div>
      <Output value={value} />
    </div>
  );
}

export function GradientTool() {
  const [from, setFrom] = useState("#c7f36b");
  const [to, setTo] = useState("#6fd5ff");
  const [angle, setAngle] = useState("125");
  const css = `linear-gradient(${angle || 0}deg, ${from}, ${to})`;

  return (
    <div className="runner-stack">
      <div
        className="gradient-preview"
        style={{ background: css }}
        aria-label="Gradient preview"
      />
      <div className="math-row">
        <label>
          Start
          <input
            type="color"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          End
          <input
            type="color"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <label>
          Angle
          <input
            inputMode="numeric"
            value={angle}
            onChange={(event) => setAngle(event.target.value)}
          />
        </label>
      </div>
      <Output value={`background: ${css};`} />
    </div>
  );
}

export function QrTool() {
  const [input, setInput] = useState("https://toolboxgalaxy.com");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!input.trim()) {
      setImage("");
      setError("");
      return () => {
        active = false;
      };
    }
    QRCode.toDataURL(input, {
      errorCorrectionLevel: "M",
      width: 320,
      margin: 2,
      color: { dark: "#0b1020", light: "#f4f2ea" },
    })
      .then((data) => {
        if (active) {
          setImage(data);
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setImage("");
          setError("Could not generate a QR image for that input.");
        }
      });
    return () => {
      active = false;
    };
  }, [input]);

  return (
    <div className="runner-stack">
      <label className="wide-field">
        Text or URL
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={4}
        />
      </label>
      {image ? (
        <div className="qr-output">
          <img src={image} alt="Generated QR code" />
          <a href={image} download="toolbox-galaxy-qr.png" className="quiet-button">
            Download PNG
          </a>
        </div>
      ) : (
        <Output value="" error={error} />
      )}
    </div>
  );
}
