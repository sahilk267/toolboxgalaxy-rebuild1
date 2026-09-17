import React, { useState, useMemo } from "react";
import {
  Code2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Play,
  Terminal,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  data: string | null;
  auth: { user: string; pass: string } | null;
  cookies: string | null;
}

const PRESETS = [
  {
    name: "POST JSON with Bearer Token",
    curl: `curl -X POST https://api.example.com/v1/deployments \\
  -H "Authorization: Bearer sec_tok_89a3f4e19" \\
  -H "Content-Type: application/json" \\
  -d '{"service": "workbench-core", "replicas": 3, "environment": "production"}'`,
  },
  {
    name: "GET GitHub Repositories",
    curl: `curl -X GET "https://api.github.com/users/octocat/repos?sort=updated&per_page=5" \\
  -H "Accept: application/vnd.github.v3+json" \\
  -H "User-Agent: OrbitalWorkbench/1.0"`,
  },
  {
    name: "POST Form URL-Encoded",
    curl: `curl -X POST https://httpbin.org/post \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials&client_id=orbit_cli&client_secret=secret_xyz"`,
  },
  {
    name: "Basic Auth Protected API",
    curl: `curl -u "admin:supersecret42" \\
  -X DELETE https://api.example.com/v1/sessions/ses_99812 \\
  -H "X-Requested-With: XMLHttpRequest"`,
  },
];

function parseCurl(rawCurl: string): ParsedCurl {
  const clean = rawCurl
    .replace(/\\\r?\n/g, " ")
    .replace(/\^\r?\n/g, " ")
    .trim();

  let url = "";
  let method = "GET";
  const headers: Record<string, string> = {};
  let data: string | null = null;
  let auth: { user: string; pass: string } | null = null;
  let cookies: string | null = null;

  // Tokenize preserving quotes
  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if ((char === " " || char === "\t") && !inSingleQuote && !inDoubleQuote) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);

  // Scan tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "-X" || token === "--request") {
      if (tokens[i + 1]) {
        method = tokens[++i].toUpperCase();
      }
    } else if (token === "-H" || token === "--header") {
      if (tokens[i + 1]) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(":");
        if (colonIdx > 0) {
          const key = headerStr.slice(0, colonIdx).trim();
          const val = headerStr.slice(colonIdx + 1).trim();
          headers[key] = val;
        }
      }
    } else if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--json"
    ) {
      if (token === "--json") {
        headers["Content-Type"] = "application/json";
        headers["Accept"] = "application/json";
      }
      if (tokens[i + 1]) {
        data = tokens[++i];
        if (method === "GET") method = "POST";
      }
    } else if (token === "-u" || token === "--user") {
      if (tokens[i + 1]) {
        const authStr = tokens[++i];
        const [user, pass] = authStr.split(":");
        auth = { user: user || "", pass: pass || "" };
      }
    } else if (token === "-b" || token === "--cookie") {
      if (tokens[i + 1]) {
        cookies = tokens[++i];
      }
    } else if (token.startsWith("http://") || token.startsWith("https://")) {
      url = token;
    } else if (token.startsWith('"http') || token.startsWith("'http")) {
      url = token.replace(/^['"]|['"]$/g, "");
    }
  }

  // Fallback URL detection if positional
  if (!url) {
    for (const t of tokens) {
      if (t !== "curl" && !t.startsWith("-") && (t.includes(".") || t.includes("localhost"))) {
        url = t.replace(/^['"]|['"]$/g, "");
        if (!url.startsWith("http")) url = "https://" + url;
        break;
      }
    }
  }

  if (cookies) {
    headers["Cookie"] = cookies;
  }

  if (auth) {
    try {
      const encoded = btoa(`${auth.user}:${auth.pass}`);
      headers["Authorization"] = `Basic ${encoded}`;
    } catch {
      // ignore
    }
  }

  return { url: url || "https://api.example.com", method, headers, data, auth, cookies };
}

function generateFetch(parsed: ParsedCurl): string {
  const hasHeaders = Object.keys(parsed.headers).length > 0;
  const hasBody = Boolean(parsed.data);

  let code = `async function makeRequest() {\n`;
  code += `  const response = await fetch("${parsed.url}", {\n`;
  code += `    method: "${parsed.method}",\n`;

  if (hasHeaders) {
    code += `    headers: {\n`;
    for (const [k, v] of Object.entries(parsed.headers)) {
      code += `      "${k}": "${v.replace(/"/g, '\\"')}",\n`;
    }
    code += `    },\n`;
  }

  if (hasBody && parsed.method !== "GET" && parsed.method !== "HEAD") {
    try {
      JSON.parse(parsed.data!);
      code += `    body: JSON.stringify(${parsed.data}),\n`;
    } catch {
      code += `    body: ${JSON.stringify(parsed.data)},\n`;
    }
  }

  code += `  });\n\n`;
  code += `  if (!response.ok) {\n`;
  code += `    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);\n`;
  code += `  }\n\n`;
  code += `  const data = await response.json();\n`;
  code += `  return data;\n`;
  code += `}\n\nmakeRequest().then(console.log).catch(console.error);`;

  return code;
}

function generateAxios(parsed: ParsedCurl): string {
  const hasHeaders = Object.keys(parsed.headers).length > 0;
  const hasBody = Boolean(parsed.data);

  let code = `import axios from 'axios';\n\n`;
  code += `const config = {\n`;
  code += `  method: '${parsed.method.toLowerCase()}',\n`;
  code += `  url: '${parsed.url}',\n`;

  if (hasHeaders) {
    code += `  headers: {\n`;
    for (const [k, v] of Object.entries(parsed.headers)) {
      code += `    '${k}': '${v.replace(/'/g, "\\'")}',\n`;
    }
    code += `  },\n`;
  }

  if (hasBody && parsed.method !== "GET" && parsed.method !== "HEAD") {
    try {
      const obj = JSON.parse(parsed.data!);
      code += `  data: ${JSON.stringify(obj, null, 2).replace(/\n/g, "\n  ")},\n`;
    } catch {
      code += `  data: ${JSON.stringify(parsed.data)},\n`;
    }
  }

  code += `};\n\n`;
  code += `axios(config)\n`;
  code += `  .then((response) => {\n`;
  code += `    console.log(JSON.stringify(response.data));\n`;
  code += `  })\n`;
  code += `  .catch((error) => {\n`;
  code += `    console.error(error);\n`;
  code += `  });`;

  return code;
}

function generatePython(parsed: ParsedCurl): string {
  let code = `import requests\n`;
  const isJson =
    parsed.headers["Content-Type"]?.includes("json") ||
    parsed.headers["content-type"]?.includes("json");

  let parsedJsonObj: unknown = null;
  if (parsed.data) {
    try {
      parsedJsonObj = JSON.parse(parsed.data);
    } catch {
      parsedJsonObj = null;
    }
  }

  if (parsedJsonObj) {
    code += `import json\n\n`;
  } else {
    code += `\n`;
  }

  code += `url = "${parsed.url}"\n\n`;

  if (Object.keys(parsed.headers).length > 0) {
    code += `headers = {\n`;
    for (const [k, v] of Object.entries(parsed.headers)) {
      code += `    "${k}": "${v.replace(/"/g, '\\"')}",\n`;
    }
    code += `}\n\n`;
  }

  if (parsed.data && parsed.method !== "GET") {
    if (parsedJsonObj) {
      code += `payload = ${JSON.stringify(parsedJsonObj, null, 4)
        .replace(/true/g, "True")
        .replace(/false/g, "False")
        .replace(/null/g, "None")}\n\n`;
    } else {
      code += `payload = ${JSON.stringify(parsed.data)}\n\n`;
    }
  }

  const methodCall = parsed.method.toLowerCase();
  const args = [`url`];
  if (Object.keys(parsed.headers).length > 0) args.push(`headers=headers`);
  if (parsed.data && parsed.method !== "GET") {
    if (parsedJsonObj && isJson) {
      args.push(`json=payload`);
    } else {
      args.push(`data=payload`);
    }
  }

  code += `response = requests.${methodCall}(${args.join(", ")})\n\n`;
  code += `print(response.status_code)\n`;
  code += `print(response.text)`;

  return code;
}

function generateGo(parsed: ParsedCurl): string {
  let code = `package main\n\n`;
  code += `import (\n`;
  code += `\t"fmt"\n`;
  code += `\t"io"\n`;
  code += `\t"net/http"\n`;
  if (parsed.data && parsed.method !== "GET") {
    code += `\t"strings"\n`;
  }
  code += `)\n\n`;
  code += `func main() {\n`;
  code += `\turl := "${parsed.url}"\n`;

  if (parsed.data && parsed.method !== "GET") {
    code += `\tpayload := strings.NewReader(${JSON.stringify(parsed.data)})\n`;
    code += `\treq, err := http.NewRequest("${parsed.method}", url, payload)\n`;
  } else {
    code += `\treq, err := http.NewRequest("${parsed.method}", url, nil)\n`;
  }

  code += `\tif err != nil {\n\t\tpanic(err)\n\t}\n\n`;

  for (const [k, v] of Object.entries(parsed.headers)) {
    code += `\treq.Header.Add("${k}", "${v.replace(/"/g, '\\"')}")\n`;
  }

  code += `\n\tres, err := http.DefaultClient.Do(req)\n`;
  code += `\tif err != nil {\n\t\tpanic(err)\n\t}\n`;
  code += `\tdefer res.Body.Close()\n\n`;
  code += `\tbody, err := io.ReadAll(res.Body)\n`;
  code += `\tif err != nil {\n\t\tpanic(err)\n\t}\n\n`;
  code += `\tfmt.Println(res.Status)\n`;
  code += `\tfmt.Println(string(body))\n`;
  code += `}\n`;

  return code;
}

function generateNode(parsed: ParsedCurl): string {
  const isHttps = parsed.url.startsWith("https");
  let code = `const ${isHttps ? "https" : "http"} = require('${isHttps ? "https" : "http"}');\n\n`;
  code += `const options = {\n`;
  code += `  method: '${parsed.method}',\n`;
  code += `  headers: {\n`;
  for (const [k, v] of Object.entries(parsed.headers)) {
    code += `    '${k}': '${v.replace(/'/g, "\\'")}',\n`;
  }
  code += `  }\n`;
  code += `};\n\n`;
  code += `const req = ${isHttps ? "https" : "http"}.request('${parsed.url}', options, (res) => {\n`;
  code += `  const chunks = [];\n\n`;
  code += `  res.on('data', (chunk) => chunks.push(chunk));\n`;
  code += `  res.on('end', () => {\n`;
  code += `    const body = Buffer.concat(chunks);\n`;
  code += `    console.log(body.toString());\n`;
  code += `  });\n`;
  code += `});\n\n`;
  code += `req.on('error', (error) => console.error(error));\n`;
  if (parsed.data && parsed.method !== "GET") {
    code += `req.write(${JSON.stringify(parsed.data)});\n`;
  }
  code += `req.end();`;

  return code;
}

function generatePhp(parsed: ParsedCurl): string {
  let code = `<?php\n\n`;
  code += `$curl = curl_init();\n\n`;
  code += `curl_setopt_array($curl, array(\n`;
  code += `  CURLOPT_URL => '${parsed.url}',\n`;
  code += `  CURLOPT_RETURNTRANSFER => true,\n`;
  code += `  CURLOPT_ENCODING => '',\n`;
  code += `  CURLOPT_MAXREDIRS => 10,\n`;
  code += `  CURLOPT_TIMEOUT => 30,\n`;
  code += `  CURLOPT_FOLLOWLOCATION => true,\n`;
  code += `  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n`;
  code += `  CURLOPT_CUSTOMREQUEST => '${parsed.method}',\n`;

  if (parsed.data && parsed.method !== "GET") {
    code += `  CURLOPT_POSTFIELDS => ${JSON.stringify(parsed.data)},\n`;
  }

  if (Object.keys(parsed.headers).length > 0) {
    code += `  CURLOPT_HTTPHEADER => array(\n`;
    for (const [k, v] of Object.entries(parsed.headers)) {
      code += `    '${k}: ${v.replace(/'/g, "\\'")}',\n`;
    }
    code += `  ),\n`;
  }

  code += `));\n\n`;
  code += `$response = curl_exec($curl);\n`;
  code += `curl_close($curl);\n`;
  code += `echo $response;\n`;

  return code;
}

export default function CurlToCodeTool() {
  const [curlInput, setCurlInput] = useState(PRESETS[0].curl);
  const [selectedLang, setSelectedLang] = useState<"fetch" | "axios" | "python" | "go" | "node" | "php">("fetch");
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  const parsed = useMemo(() => parseCurl(curlInput), [curlInput]);

  const generatedCode = useMemo(() => {
    switch (selectedLang) {
      case "fetch":
        return generateFetch(parsed);
      case "axios":
        return generateAxios(parsed);
      case "python":
        return generatePython(parsed);
      case "go":
        return generateGo(parsed);
      case "node":
        return generateNode(parsed);
      case "php":
        return generatePhp(parsed);
      default:
        return "";
    }
  }, [parsed, selectedLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const languages = [
    { id: "fetch", label: "JS Fetch", badge: "Browser & Node" },
    { id: "axios", label: "Axios", badge: "Promise HTTP" },
    { id: "python", label: "Python", badge: "Requests" },
    { id: "go", label: "Go", badge: "net/http" },
    { id: "node", label: "Node.js", badge: "Native" },
    { id: "php", label: "PHP", badge: "cURL" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <Terminal size={15} className="text-[#c7f36b]" />
          <span>Paste any terminal cURL command to generate clean, production-ready code.</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#6fd5ff]">
          <ShieldCheck size={14} />
          <span>100% In-Memory · Tokens Never Sent Over Network</span>
        </div>
      </div>

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-white/50">PRESETS:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => setCurlInput(preset.curl)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 hover:border-[#c7f36b]/40 hover:bg-[#c7f36b]/10 hover:text-[#c7f36b] transition-all"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input cURL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="curl-input" className="font-mono text-xs uppercase tracking-wider text-white/70 flex items-center gap-2">
              <span>cURL Command Input</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#c7f36b]">
                {parsed.method}
              </span>
            </label>
            <button
              type="button"
              onClick={() => setCurlInput("")}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              id="curl-input"
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="curl -X POST https://api.example.com/v1/... -H 'Authorization: Bearer ...' -d '{...}'"
              rows={12}
              className="w-full rounded-xl border border-white/15 bg-[#0a0f1d] p-4 font-mono text-xs text-[#6fd5ff] placeholder-white/20 focus:border-[#c7f36b] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Parsed Telemetry Breakdown */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex w-full items-center justify-between p-3 text-xs font-mono text-white/70 hover:bg-white/[0.03] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers size={14} className="text-[#c7f36b]" />
                <span>PARSED AUDIT & HEADERS ({Object.keys(parsed.headers).length})</span>
              </span>
              {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showBreakdown && (
              <div className="border-t border-white/5 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-white/40 w-16 shrink-0">ENDPOINT:</span>
                  <span className="font-mono text-white break-all">{parsed.url || "None"}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-mono text-white/40 w-16 shrink-0">METHOD:</span>
                  <span className="font-mono font-bold text-[#c7f36b]">{parsed.method}</span>
                </div>

                {Object.keys(parsed.headers).length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-mono text-white/40 block">HEADERS:</span>
                    <div className="max-h-36 overflow-y-auto rounded-lg bg-black/40 p-2 space-y-1 font-mono text-[11px]">
                      {Object.entries(parsed.headers).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-white/5 pb-0.5">
                          <span className="text-[#6fd5ff]">{k}:</span>
                          <span className="text-white/80 truncate max-w-[240px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.data && (
                  <div className="space-y-1 pt-1">
                    <span className="font-mono text-white/40 block">PAYLOAD (BODY):</span>
                    <pre className="max-h-28 overflow-y-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] text-amber-200/90 whitespace-pre-wrap">
                      {parsed.data}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Generator Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/70">
              Generated Code Output
            </span>
            <button
              id="copy-code-btn"
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-3 py-1 text-xs font-mono font-semibold text-[#c7f36b] hover:bg-[#c7f36b]/20 hover:border-[#c7f36b] transition-all"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? "Copied to Clipboard" : "Copy Code"}</span>
            </button>
          </div>

          {/* Language Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2">
            {languages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLang(lang.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
                  selectedLang === lang.id
                    ? "bg-[#c7f36b] text-[#0b1020] font-bold shadow-md"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{lang.label}</span>
                <span
                  className={`text-[9px] uppercase px-1 py-0.2 rounded ${
                    selectedLang === lang.id ? "bg-black/20 text-black" : "bg-white/10 text-white/50"
                  }`}
                >
                  {lang.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Code Viewer Container */}
          <div className="relative rounded-xl border border-white/15 bg-[#0a0f1d] p-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 text-[11px] font-mono text-white/40">
              <span>LANGUAGE: {selectedLang.toUpperCase()}</span>
              <span>SYNTAX: COMPILED</span>
            </div>
            <pre className="overflow-x-auto font-mono text-xs text-[#f4f2ea] leading-relaxed max-h-[440px] whitespace-pre">
              {generatedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
