// Orbital Workbench: Zero-dependency Mock & Fake Data Generator (JSON, CSV, SQL, Markdown)
import React, { useState, useMemo, useCallback } from "react";
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  Database,
  FileCode,
  Table,
  CheckSquare,
  Square,
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";

type ExportFormat = "json" | "csv" | "sql" | "markdown";
type DataLocale = "global" | "us" | "india" | "uk";

interface FieldDef {
  key: string;
  label: string;
  category: "identity" | "contact" | "employment" | "location" | "finance" | "tech";
}

const AVAILABLE_FIELDS: FieldDef[] = [
  { key: "id", label: "Row ID (Integer)", category: "identity" },
  { key: "uuid", label: "UUID v4", category: "identity" },
  { key: "fullName", label: "Full Name", category: "identity" },
  { key: "email", label: "Email Address", category: "contact" },
  { key: "phone", label: "Phone Number", category: "contact" },
  { key: "company", label: "Company Name", category: "employment" },
  { key: "jobTitle", label: "Job Title", category: "employment" },
  { key: "city", label: "City", category: "location" },
  { key: "country", label: "Country", category: "location" },
  { key: "balance", label: "Account Balance", category: "finance" },
  { key: "creditCard", label: "Masked Card", category: "finance" },
  { key: "ipAddress", label: "IPv4 Address", category: "tech" },
  { key: "status", label: "User Status", category: "tech" },
  { key: "createdAt", label: "Created Timestamp", category: "tech" },
];

const FIRST_NAMES: Record<DataLocale, string[]> = {
  global: ["Alex", "Elena", "Liam", "Sofia", "Marcus", "Chloe", "Kai", "Zara", "Lucas", "Maya", "Noah", "Emma"],
  us: ["James", "Emma", "Michael", "Olivia", "William", "Sophia", "David", "Ava", "Joseph", "Isabella", "Ethan", "Mia"],
  india: ["Aarav", "Pooja", "Rohan", "Ananya", "Vikram", "Sneha", "Aditya", "Priya", "Rahul", "Neha", "Arjun", "Kavita"],
  uk: ["Oliver", "Amelia", "George", "Isla", "Harry", "Emily", "Jack", "Lily", "Charlie", "Grace", "Freddie", "Poppy"],
};

const LAST_NAMES: Record<DataLocale, string[]> = {
  global: ["Smith", "Novak", "Silva", "Kowalski", "Kim", "Tanaka", "Muller", "Rossi", "Santos", "Larsen", "Chen", "Dubois"],
  us: ["Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson"],
  india: ["Sharma", "Verma", "Patel", "Mehta", "Singh", "Reddy", "Gupta", "Nair", "Deshmukh", "Iyer", "Chopra", "Joshi"],
  uk: ["Davies", "Evans", "Clarke", "Wright", "Walker", "Wood", "Robinson", "Hall", "Lewis", "Edwards", "Hughes", "Green"],
};

const CITIES: Record<DataLocale, { city: string; country: string }[]> = {
  global: [
    { city: "Toronto", country: "Canada" },
    { city: "Berlin", country: "Germany" },
    { city: "Sydney", country: "Australia" },
    { city: "Tokyo", country: "Japan" },
    { city: "Stockholm", country: "Sweden" },
    { city: "Singapore", country: "Singapore" },
  ],
  us: [
    { city: "San Francisco", country: "United States" },
    { city: "Austin", country: "United States" },
    { city: "Seattle", country: "United States" },
    { city: "New York", country: "United States" },
    { city: "Denver", country: "United States" },
    { city: "Boston", country: "United States" },
  ],
  india: [
    { city: "Bengaluru", country: "India" },
    { city: "Mumbai", country: "India" },
    { city: "Delhi NCR", country: "India" },
    { city: "Hyderabad", country: "India" },
    { city: "Pune", country: "India" },
    { city: "Chennai", country: "India" },
  ],
  uk: [
    { city: "London", country: "United Kingdom" },
    { city: "Manchester", country: "United Kingdom" },
    { city: "Edinburgh", country: "United Kingdom" },
    { city: "Bristol", country: "United Kingdom" },
    { city: "Cambridge", country: "United Kingdom" },
    { city: "Oxford", country: "United Kingdom" },
  ],
};

const COMPANIES = [
  "Nexus Tech", "CloudScale", "Vortex Labs", "Apex Dynamics", "Starlight AI",
  "InfraWave", "Hyperion Core", "Solstice Media", "Prism Interactive", "Zenith Global",
  "Aether Security", "Beacon Analytics", "Catalyst Digital", "Quantum Flow", "Orbit Systems"
];

const JOB_TITLES = [
  "Senior Full Stack Engineer", "Product Manager", "DevOps Architect", "Data Scientist",
  "UI/UX Designer", "Security Auditor", "Engineering Manager", "Technical Writer",
  "Cloud Solutions Engineer", "Backend Developer", "Growth Marketer", "QA Automation Lead"
];

const DOMAINS = ["example.com", "mailbox.org", "orbit.dev", "techcorp.io", "cloudmail.net", "apex.co"];
const STATUSES = ["active", "pending", "verified", "suspended"];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePseudoUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateRandomPhone(locale: DataLocale): string {
  if (locale === "india") {
    const prefixes = ["98", "97", "99", "91", "88", "87"];
    return `+91 ${getRandomItem(prefixes)}${getRandomInt(100, 999)} ${getRandomInt(10000, 99999)}`;
  }
  if (locale === "uk") {
    return `+44 79${getRandomInt(10, 99)} ${getRandomInt(100000, 999999)}`;
  }
  return `+1 (${getRandomInt(200, 899)}) ${getRandomInt(200, 999)}-${getRandomInt(1000, 9999)}`;
}

export function FakeDataGeneratorTool() {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [locale, setLocale] = useState<DataLocale>("global");
  const [recordCount, setRecordCount] = useState(10);
  const [sqlTableName, setSqlTableName] = useState("users");
  const [jsonIndent, setJsonIndent] = useState(true);
  const [seed, setSeed] = useState(1);
  const [copied, setCopied] = useState(false);

  // Field selection state
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    id: true,
    uuid: true,
    fullName: true,
    email: true,
    phone: true,
    company: true,
    jobTitle: true,
    city: true,
    country: true,
    balance: false,
    creditCard: false,
    ipAddress: false,
    status: true,
    createdAt: true,
  });

  const toggleField = (key: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyPreset = (presetType: "users" | "business" | "minimal" | "all") => {
    const next: Record<string, boolean> = {};
    AVAILABLE_FIELDS.forEach((f) => {
      next[f.key] = false;
    });

    if (presetType === "users") {
      next.id = true;
      next.fullName = true;
      next.email = true;
      next.phone = true;
      next.city = true;
      next.status = true;
    } else if (presetType === "business") {
      next.id = true;
      next.fullName = true;
      next.email = true;
      next.company = true;
      next.jobTitle = true;
      next.balance = true;
      next.createdAt = true;
    } else if (presetType === "minimal") {
      next.id = true;
      next.fullName = true;
      next.email = true;
    } else if (presetType === "all") {
      AVAILABLE_FIELDS.forEach((f) => {
        next[f.key] = true;
      });
    }

    setSelectedFields(next);
  };

  // Generate data rows
  const rawRecords = useMemo(() => {
    // depend on seed to recalculate
    const _ = seed;
    const records: Record<string, any>[] = [];

    const activeKeys = AVAILABLE_FIELDS.filter((f) => selectedFields[f.key]).map((f) => f.key);
    if (activeKeys.length === 0) return records;

    const firsts = FIRST_NAMES[locale];
    const lasts = LAST_NAMES[locale];
    const locations = CITIES[locale];

    for (let i = 1; i <= recordCount; i++) {
      const fName = getRandomItem(firsts);
      const lName = getRandomItem(lasts);
      const loc = getRandomItem(locations);
      const domain = getRandomItem(DOMAINS);
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${getRandomInt(10, 99)}@${domain}`;

      const row: Record<string, any> = {};

      if (selectedFields.id) row.id = i;
      if (selectedFields.uuid) row.uuid = generatePseudoUuid();
      if (selectedFields.fullName) row.fullName = `${fName} ${lName}`;
      if (selectedFields.email) row.email = email;
      if (selectedFields.phone) row.phone = generateRandomPhone(locale);
      if (selectedFields.company) row.company = getRandomItem(COMPANIES);
      if (selectedFields.jobTitle) row.jobTitle = getRandomItem(JOB_TITLES);
      if (selectedFields.city) row.city = loc.city;
      if (selectedFields.country) row.country = loc.country;
      if (selectedFields.balance) {
        const amt = (Math.random() * 9500 + 500).toFixed(2);
        row.balance = Number(amt);
      }
      if (selectedFields.creditCard) {
        row.creditCard = `4532-••••-••••-${getRandomInt(1000, 9999)}`;
      }
      if (selectedFields.ipAddress) {
        row.ipAddress = `${getRandomInt(50, 192)}.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`;
      }
      if (selectedFields.status) row.status = getRandomItem(STATUSES);
      if (selectedFields.createdAt) {
        const d = new Date(Date.now() - getRandomInt(1, 180) * 86400000);
        row.createdAt = d.toISOString();
      }

      records.push(row);
    }

    return records;
  }, [seed, recordCount, locale, selectedFields]);

  // Formatted Output String
  const outputString = useMemo(() => {
    if (rawRecords.length === 0) {
      return "// Please select at least one field above to generate mock data.";
    }

    if (format === "json") {
      return jsonIndent
        ? JSON.stringify(rawRecords, null, 2)
        : JSON.stringify(rawRecords);
    }

    if (format === "csv") {
      const keys = Object.keys(rawRecords[0]);
      const header = keys.join(",");
      const lines = rawRecords.map((row) =>
        keys
          .map((k) => {
            const val = row[k] ?? "";
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      );
      return [header, ...lines].join("\n");
    }

    if (format === "sql") {
      const keys = Object.keys(rawRecords[0]);
      const colList = keys.join(", ");
      const statements = rawRecords.map((row) => {
        const values = keys
          .map((k) => {
            const val = row[k];
            if (typeof val === "number") return val;
            return `'${String(val).replace(/'/g, "''")}'`;
          })
          .join(", ");
        return `INSERT INTO ${sqlTableName} (${colList}) VALUES (${values});`;
      });
      return `-- Mock SQL dataset generated by Toolbox Galaxy\n${statements.join("\n")}`;
    }

    if (format === "markdown") {
      const keys = Object.keys(rawRecords[0]);
      const header = `| ${keys.join(" | ")} |`;
      const separator = `| ${keys.map(() => "---").join(" | ")} |`;
      const rows = rawRecords.map((row) => `| ${keys.map((k) => row[k] ?? "").join(" | ")} |`);
      return [header, separator, ...rows].join("\n");
    }

    return "";
  }, [rawRecords, format, jsonIndent, sqlTableName]);

  // Actions
  const handleRegenerate = () => {
    setSeed((s) => s + 1);
  };

  const handleCopy = async () => {
    if (!outputString) return;
    try {
      await navigator.clipboard.writeText(outputString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    if (!outputString) return;
    const blob = new Blob([outputString], {
      type: format === "json" ? "application/json" : "text/plain;charset=utf-8",
    });
    const ext = format === "markdown" ? "md" : format;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-dataset-${recordCount}-rows.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedCount = Object.values(selectedFields).filter(Boolean).length;

  return (
    <div className="runner-stack space-y-6">
      {/* Top Configuration Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#070b14] p-4 sm:p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Format Selector */}
          <div>
            <label className="text-xs font-mono text-white/70 mb-1.5 block">Export Format</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "json", label: "JSON" },
                { id: "csv", label: "CSV" },
                { id: "sql", label: "SQL" },
                { id: "markdown", label: "Markdown" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as ExportFormat)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-mono transition text-center ${
                    format === fmt.id
                      ? "border-[#c7f36b] bg-[#c7f36b]/15 text-[#c7f36b] font-bold"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Locale Selector */}
          <div>
            <label className="text-xs font-mono text-white/70 mb-1.5 block">Locale / Region</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as DataLocale)}
              className="w-full text-xs font-mono p-2 rounded-lg bg-white/5 border border-white/15 text-white"
            >
              <option value="global">Global / International</option>
              <option value="us">United States (US)</option>
              <option value="india">India (IN)</option>
              <option value="uk">United Kingdom (UK)</option>
            </select>
          </div>

          {/* Row Count */}
          <div>
            <div className="flex justify-between text-xs font-mono text-white/70 mb-1.5">
              <span>Record Count</span>
              <strong className="text-[#c7f36b]">{recordCount} rows</strong>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={recordCount}
              onChange={(e) => setRecordCount(Number(e.target.value))}
              className="w-full accent-[#c7f36b]"
            />
            <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1">
              <span>1</span>
              <span>10</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Action Button: Regenerate */}
          <div className="flex items-end">
            <button
              onClick={handleRegenerate}
              className="signal-button w-full flex items-center justify-center gap-2 py-2 text-xs"
            >
              <RefreshCw size={14} />
              <span>Regenerate ({recordCount})</span>
            </button>
          </div>
        </div>

        {/* Secondary options for JSON / SQL */}
        {format === "sql" && (
          <div className="border-t border-white/10 pt-3 flex items-center gap-3">
            <span className="text-xs font-mono text-white/70">SQL Table Name:</span>
            <input
              value={sqlTableName}
              onChange={(e) => setSqlTableName(e.target.value || "users")}
              className="text-xs font-mono py-1 px-2.5 rounded bg-white/5 border border-white/15 text-white w-48"
              placeholder="users"
            />
          </div>
        )}

        {format === "json" && (
          <div className="border-t border-white/10 pt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-mono text-white/80 cursor-pointer">
              <input
                type="checkbox"
                checked={jsonIndent}
                onChange={(e) => setJsonIndent(e.target.checked)}
                className="rounded accent-[#c7f36b]"
              />
              <span>Pretty Print (2-space indent)</span>
            </label>
          </div>
        )}
      </div>

      {/* Field Selector Grid */}
      <div className="rounded-2xl border border-white/10 bg-[#070b14] p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-xs font-mono text-white/70 flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#c7f36b]" />
            <span>SCHEMA ATTRIBUTES ({selectedCount}/{AVAILABLE_FIELDS.length} SELECTED)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-white/40">Presets:</span>
            <button
              onClick={() => applyPreset("users")}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
            >
              User Profiles
            </button>
            <button
              onClick={() => applyPreset("business")}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
            >
              E-Commerce
            </button>
            <button
              onClick={() => applyPreset("minimal")}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
            >
              Minimal
            </button>
            <button
              onClick={() => applyPreset("all")}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
            >
              All Fields
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {AVAILABLE_FIELDS.map((field) => {
            const isChecked = selectedFields[field.key];
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => toggleField(field.key)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition text-xs font-mono ${
                  isChecked
                    ? "border-[#c7f36b] bg-[#c7f36b]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                }`}
              >
                {isChecked ? (
                  <CheckSquare size={14} className="text-[#c7f36b] flex-shrink-0" />
                ) : (
                  <Square size={14} className="text-white/30 flex-shrink-0" />
                )}
                <span className="truncate">{field.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Console Deck */}
      <div className="rounded-2xl border border-white/10 bg-[#070b14] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3 sm:px-5 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-mono text-white/70">
            <FileCode size={14} className="text-[#c7f36b]" />
            <span>OUTPUT BUFFER ({rawRecords.length} RECORDS · {format.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="quiet-button text-xs flex items-center gap-1.5 px-3 py-1.5"
            >
              {copied ? <Check size={14} className="text-[#c7f36b]" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={handleDownload}
              className="signal-button text-xs flex items-center gap-1.5 px-3.5 py-1.5"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>
        </div>

        <pre
          className="p-4 sm:p-6 font-mono text-xs text-white/90 overflow-x-auto max-h-[460px] leading-relaxed select-all"
          aria-live="polite"
        >
          {outputString}
        </pre>
      </div>

      {/* Safety Notice */}
      <div className="flex items-center justify-between text-xs font-mono text-white/40 pt-1">
        <span>COMPLIANCE: SYNTHETIC DATA · 100% CLIENT GENERATED</span>
        <span>ZERO NETWORK CALLS</span>
      </div>
    </div>
  );
}
