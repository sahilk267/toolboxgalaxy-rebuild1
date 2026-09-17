import { useState, useMemo } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  Code2, 
  FileJson, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  ArrowRight
} from "lucide-react";

// Preset JSON examples
const PRESETS: Record<string, { label: string; name: string; json: string }> = {
  user: {
    label: "User Profile",
    name: "UserProfile",
    json: JSON.stringify({
      id: "usr_94829",
      username: "alex_coder",
      email: "alex@example.com",
      isActive: true,
      age: 28,
      website: "https://alex.dev",
      createdAt: "2026-03-01T14:30:00.000Z",
      roles: ["admin", "developer"],
      address: {
        street: "123 Innovation Way",
        city: "San Francisco",
        state: "CA",
        postalCode: "94107",
        country: "USA"
      },
      metadata: null
    }, null, 2)
  },
  apiResponse: {
    label: "API Response (Paginated)",
    name: "PaginatedResponse",
    json: JSON.stringify({
      status: "success",
      statusCode: 200,
      timestamp: "2026-09-07T10:15:00Z",
      pagination: {
        page: 1,
        perPage: 20,
        totalCount: 450,
        totalPages: 23,
        hasNextPage: true
      },
      items: [
        {
          id: "item_01",
          sku: "PROD-A100",
          title: "Mechanical Wireless Keyboard",
          price: 149.99,
          inStock: true,
          tags: ["hardware", "ergonomic", "wireless"]
        }
      ]
    }, null, 2)
  },
  checkout: {
    label: "E-Commerce Checkout",
    name: "OrderPayload",
    json: JSON.stringify({
      orderId: "ord_881923",
      customerEmail: "sarah.smith@example.org",
      amountSubtotal: 299.50,
      taxAmount: 24.50,
      totalAmount: 324.00,
      currency: "USD",
      paymentMethod: {
        type: "card",
        brand: "visa",
        last4: "4242",
        isDefault: true
      },
      lineItems: [
        {
          productId: "p_12",
          quantity: 2,
          unitPrice: 149.75
        }
      ],
      shippingAddress: {
        recipient: "Sarah Smith",
        line1: "45 Market Street",
        line2: null,
        city: "London",
        postalCode: "EC1A 1BB",
        country: "GB"
      }
    }, null, 2)
  }
};

// Detection helpers
const isIsoDate = (val: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(val);
const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isUrl = (val: string) => /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(val);

function capitalize(str: string): string {
  if (!str) return "Item";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generates Zod schema definitions recursively
function jsonToZodSchema(value: any, keyName = "root", indent = 2, detectFormats = true): string {
  const pad = " ".repeat(indent);
  const padInner = " ".repeat(indent + 2);

  if (value === null) {
    return `z.any().nullable()`;
  }

  if (typeof value === "string") {
    if (detectFormats) {
      if (isIsoDate(value)) return `z.string().datetime()`;
      if (isEmail(value)) return `z.string().email()`;
      if (isUrl(value)) return `z.string().url()`;
    }
    return `z.string()`;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? `z.number().int()` : `z.number()`;
  }

  if (typeof value === "boolean") {
    return `z.boolean()`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `z.array(z.unknown())`;
    }
    const elemSchema = jsonToZodSchema(value[0], `${keyName}Item`, indent, detectFormats);
    return `z.array(${elemSchema})`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return `z.record(z.string(), z.unknown())`;
    }

    const lines = keys.map((k) => {
      const sanitizedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      const val = value[k];
      const valSchema = jsonToZodSchema(val, k, indent + 2, detectFormats);
      return `${padInner}${sanitizedKey}: ${valSchema}`;
    });

    return `z.object({\n${lines.join(",\n")}\n${pad}})`;
  }

  return `z.unknown()`;
}

// Generates pure TypeScript interfaces recursively
function jsonToTsInterface(value: any, rootName = "Root", detectFormats = true): string {
  const interfaces: string[] = [];
  const visitedNames = new Set<string>();

  function helper(val: any, typeName: string, indent = 2): string {
    const pad = " ".repeat(indent);
    const padInner = " ".repeat(indent + 2);

    if (val === null) return "null | any";
    if (typeof val === "string") return "string";
    if (typeof val === "number") return "number";
    if (typeof val === "boolean") return "boolean";

    if (Array.isArray(val)) {
      if (val.length === 0) return "any[]";
      const itemType = helper(val[0], `${typeName}Item`, indent);
      return itemType.includes(" | ") ? `(${itemType})[]` : `${itemType}[]`;
    }

    if (typeof val === "object") {
      const keys = Object.keys(val);
      if (keys.length === 0) return "Record<string, unknown>";

      const currentInterfaceName = typeName;
      let finalName = currentInterfaceName;
      let counter = 1;
      while (visitedNames.has(finalName)) {
        finalName = `${currentInterfaceName}_${counter++}`;
      }
      visitedNames.add(finalName);

      const fields = keys.map((k) => {
        const sanitizedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        const childVal = val[k];
        const isNull = childVal === null;
        const subTypeName = capitalize(k);
        const subType = helper(childVal, subTypeName, indent + 2);
        return `${padInner}${sanitizedKey}${isNull ? "?" : ""}: ${subType};`;
      });

      interfaces.unshift(`export interface ${finalName} {\n${fields.join("\n")}\n}`);
      return finalName;
    }

    return "unknown";
  }

  helper(value, rootName);
  return interfaces.join("\n\n");
}

export default function JsonToZodTool() {
  const [jsonInput, setJsonInput] = useState<string>(PRESETS.user.json);
  const [rootName, setRootName] = useState<string>(PRESETS.user.name);
  const [detectFormats, setDetectFormats] = useState<boolean>(true);
  const [outputTab, setOutputTab] = useState<"zod" | "ts">("zod");
  const [copied, setCopied] = useState<boolean>(false);

  // Parse JSON with error location
  const parseResult = useMemo(() => {
    if (!jsonInput.trim()) {
      return { parsed: null, error: "Please enter or paste valid JSON." };
    }
    try {
      const parsed = JSON.parse(jsonInput);
      return { parsed, error: null };
    } catch (err: any) {
      return { parsed: null, error: err.message || "Invalid JSON syntax." };
    }
  }, [jsonInput]);

  // Clean schema / type name
  const cleanName = useMemo(() => {
    const raw = rootName.trim().replace(/[^a-zA-Z0-9_$]/g, "");
    return raw ? capitalize(raw) : "DataModel";
  }, [rootName]);

  // Generated code outputs
  const generatedCode = useMemo(() => {
    if (!parseResult.parsed) return "";

    if (outputTab === "zod") {
      const schemaName = `${cleanName.charAt(0).toLowerCase() + cleanName.slice(1)}Schema`;
      const typeName = cleanName;
      const zodDef = jsonToZodSchema(parseResult.parsed, cleanName, 0, detectFormats);

      return `import { z } from "zod";

export const ${schemaName} = ${zodDef};

export type ${typeName} = z.infer<typeof ${schemaName}>;
`;
    } else {
      return jsonToTsInterface(parseResult.parsed, cleanName, detectFormats);
    }
  }, [parseResult.parsed, outputTab, cleanName, detectFormats]);

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = outputTab === "zod" ? `${cleanName.toLowerCase()}.schema.ts` : `${cleanName.toLowerCase()}.types.ts`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setJsonInput(PRESETS[key].json);
    setRootName(PRESETS[key].name);
  };

  return (
    <div className="space-y-6">
      {/* Preset pills & header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0e1628] border border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-lime-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-white/70">SAMPLE SCHEMAS:</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadPreset(key as any)}
                className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={detectFormats}
              onChange={(e) => setDetectFormats(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-lime-400 focus:ring-0"
            />
            <span>Detect Email, URL & Dates</span>
          </label>
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: JSON Input */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase">
              <FileJson size={15} className="text-sky-400" />
              <span>PASTE RAW JSON PAYLOAD</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/50">Model Name:</span>
              <input
                type="text"
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="ModelName"
                className="px-2.5 py-1 text-xs font-mono bg-black/40 border border-white/15 rounded text-white focus:outline-none focus:border-lime-400 w-36"
              />
            </div>
          </div>

          <div className="relative flex-1 min-h-[380px]">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON object or array here..."
              spellCheck={false}
              className="w-full h-full min-h-[380px] p-3 text-xs font-mono bg-[#090d18] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-sky-400 resize-y leading-relaxed"
            />
            {parseResult.error && (
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-start gap-2 backdrop-blur">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
                <span>{parseResult.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Generated Code Output */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#090d18] p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setOutputTab("zod")}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  outputTab === "zod"
                    ? "bg-lime-400 text-black font-bold shadow"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Zod Schema (.schema.ts)
              </button>
              <button
                type="button"
                onClick={() => setOutputTab("ts")}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  outputTab === "ts"
                    ? "bg-lime-400 text-black font-bold shadow"
                    : "text-white/60 hover:text-white"
                }`}
              >
                TypeScript Interface (.ts)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!generatedCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-medium text-white transition-all disabled:opacity-40"
              >
                {copied ? <Check size={14} className="text-lime-400" /> : <Copy size={14} />}
                <span>{copied ? "COPIED" : "COPY CODE"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!generatedCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-black text-xs font-mono font-bold transition-all disabled:opacity-40"
              >
                <Download size={14} />
                <span>DOWNLOAD</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[380px]">
            <pre className="w-full h-full min-h-[380px] p-3 text-xs font-mono bg-[#090d18] border border-white/10 rounded-xl text-lime-300 overflow-auto leading-relaxed selection:bg-lime-400 selection:text-black">
              <code>{generatedCode || "// Valid code will appear here once valid JSON is provided."}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-white/60 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
          <CheckCircle2 size={16} className="text-lime-400 shrink-0" />
          <span>Infer Types (`z.infer&lt;typeof ...&gt;`)</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
          <CheckCircle2 size={16} className="text-lime-400 shrink-0" />
          <span>Zero Server Uploads (100% Local)</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
          <CheckCircle2 size={16} className="text-lime-400 shrink-0" />
          <span>Strict ISO Date, Email & URL Sanitization</span>
        </div>
      </div>
    </div>
  );
}
