import { useState, useMemo, useEffect } from "react";
import { 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Layers, 
  Lock, 
  CheckCircle2, 
  XCircle,
  FileCode2,
  Calendar,
  User,
  ShieldAlert
} from "lucide-react";

// Safe Base64URL decoder supporting UTF-8
function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Invalid base64url encoding in token segment.");
  }
}

// Preset JWT samples
const PRESET_JWTS = {
  activeSession: {
    label: "Active User Session (HS256)",
    token: (() => {
      const now = Math.floor(Date.now() / 1000);
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      const payload = btoa(JSON.stringify({
        sub: "usr_94829104",
        name: "Devon Vance",
        email: "devon.vance@orbital.internal",
        roles: ["admin", "developer"],
        iat: now - 300,
        exp: now + 7200, // 2 hours from now
        iss: "https://auth.orbital-workbench.dev",
        aud: "https://api.orbital-workbench.dev"
      })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return `${header}.${payload}.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ`;
    })()
  },
  oauthOidc: {
    label: "OAuth 2.0 / OpenID Connect (RS256)",
    token: (() => {
      const now = Math.floor(Date.now() / 1000);
      const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "key_sec_2026_09" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      const payload = btoa(JSON.stringify({
        iss: "https://accounts.google.com",
        sub: "109283746192837461928",
        email: "engineer@enterprise.org",
        email_verified: true,
        name: "Jordan Rivera",
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        given_name: "Jordan",
        family_name: "Rivera",
        locale: "en",
        iat: now - 1800,
        exp: now + 1800,
        jti: "jwt_token_unique_99382"
      })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return `${header}.${payload}.c2lnbmF0dXJlX2J5dGVzX2hlcmVfZm9yX3JzMjU2X3ZhbGlkYXRpb24`;
    })()
  },
  expiredToken: {
    label: "Expired Token (For Verification)",
    token: (() => {
      const past = Math.floor(Date.now() / 1000) - 86400 * 3; // 3 days ago
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      const payload = btoa(JSON.stringify({
        sub: "usr_legacy_expired",
        email: "old.account@legacy.test",
        role: "guest",
        iat: past - 3600,
        exp: past,
        iss: "https://id.example.org"
      })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return `${header}.${payload}.ZXhwaXJlZF9zaWduYXR1cmVfaGFzaF9zYW1wbGU`;
    })()
  }
};

export default function JwtDebuggerTool() {
  const [tokenInput, setTokenInput] = useState<string>(PRESET_JWTS.activeSession.token);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Math.floor(Date.now() / 1000));

  // Keep time updated for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const parsedJwt = useMemo(() => {
    const raw = tokenInput.trim();
    if (!raw) return null;

    const parts = raw.split(".");
    if (parts.length !== 3) {
      return {
        error: `Invalid JWT format: A JSON Web Token must contain exactly 3 segments separated by dots (Header.Payload.Signature). Found ${parts.length} segment${parts.length === 1 ? "" : "s"}.`
      };
    }

    try {
      const headerRaw = base64UrlDecode(parts[0]);
      const payloadRaw = base64UrlDecode(parts[1]);

      const header = JSON.parse(headerRaw);
      const payload = JSON.parse(payloadRaw);
      const signature = parts[2];

      const exp = typeof payload.exp === "number" ? payload.exp : null;
      const iat = typeof payload.iat === "number" ? payload.iat : null;
      const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

      let expStatus: "active" | "expired" | "not_before_future" | "none" = "none";
      let timeRemaining = "";

      if (exp !== null) {
        const diff = exp - currentTime;
        if (diff <= 0) {
          expStatus = "expired";
          const ago = Math.abs(diff);
          if (ago < 60) timeRemaining = `Expired ${ago}s ago`;
          else if (ago < 3600) timeRemaining = `Expired ${Math.floor(ago / 60)}m ago`;
          else if (ago < 86400) timeRemaining = `Expired ${Math.floor(ago / 3600)}h ago`;
          else timeRemaining = `Expired ${Math.floor(ago / 86400)}d ago`;
        } else {
          expStatus = "active";
          if (diff < 60) timeRemaining = `Expires in ${diff}s`;
          else if (diff < 3600) {
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            timeRemaining = `Expires in ${m}m ${s}s`;
          } else {
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            timeRemaining = `Expires in ${h}h ${m}m`;
          }
        }
      }

      if (nbf !== null && nbf > currentTime) {
        expStatus = "not_before_future";
        timeRemaining = `Not valid yet (nbf active)`;
      }

      return {
        header,
        headerRaw,
        payload,
        payloadRaw,
        signature,
        exp,
        iat,
        nbf,
        expStatus,
        timeRemaining,
        alg: header.alg || "Unknown",
        typ: header.typ || "JWT",
        parts: {
          headerPart: parts[0],
          payloadPart: parts[1],
          signaturePart: parts[2]
        }
      };
    } catch (err: any) {
      return {
        error: `Could not parse JWT: ${err.message || "Invalid JSON or Base64 encoding."}`
      };
    }
  }, [tokenInput, currentTime]);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6" id="jwt-debugger-root">
      {/* Top Presets Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0e1628] border border-white/10 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-lime-400 shrink-0" />
          <span className="text-white/60 uppercase">SAMPLE TOKENS:</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESET_JWTS).map(([k, p]) => (
              <button
                key={k}
                id={`preset-${k}`}
                type="button"
                onClick={() => setTokenInput(p.token)}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
          <ShieldCheck size={14} />
          <span>100% In-Browser Memory · Never Sent to Any Server</span>
        </span>
      </div>

      {/* Main Dual-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Raw Encoded JWT (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="raw-jwt-input" className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase">
              <Lock size={15} className="text-amber-400" />
              <span>ENCODED TOKEN (HEADER.PAYLOAD.SIGNATURE)</span>
            </label>
            {tokenInput && (
              <button
                id="clear-jwt-btn"
                type="button"
                onClick={() => setTokenInput("")}
                className="text-xs font-mono text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative flex-1 min-h-[420px]">
            <textarea
              id="raw-jwt-input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste any Bearer token or JWT here (header.payload.signature)..."
              spellCheck={false}
              className="w-full h-full min-h-[420px] p-3.5 text-xs font-mono bg-[#090d18] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-lime-400 resize-y leading-relaxed"
            />
          </div>

          {/* Color Breakdown Key */}
          {parsedJwt && !parsedJwt.error && (
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-[11px] font-mono">
              <span className="text-white/40 block">TOKEN STRUCTURE MAP:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Header (Algorithm &amp; Type)
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Payload (Claims &amp; Data)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Signature (Verification)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Decoded Inspector (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {parsedJwt?.error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
              <div>
                <b className="block text-rose-300 mb-1">INVALID TOKEN FORMAT</b>
                <p>{parsedJwt.error}</p>
              </div>
            </div>
          ) : parsedJwt ? (
            <div className="space-y-4">
              {/* Token Status Banner */}
              <div className="p-3.5 rounded-xl bg-[#0e1628] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  {parsedJwt.expStatus === "active" ? (
                    <span className="flex items-center gap-1.5 text-lime-400 font-bold bg-lime-400/10 px-2.5 py-1 rounded border border-lime-400/30">
                      <CheckCircle2 size={15} />
                      <span>TOKEN ACTIVE</span>
                    </span>
                  ) : parsedJwt.expStatus === "expired" ? (
                    <span className="flex items-center gap-1.5 text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/30">
                      <XCircle size={15} />
                      <span>TOKEN EXPIRED</span>
                    </span>
                  ) : parsedJwt.expStatus === "not_before_future" ? (
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/30">
                      <Clock size={15} />
                      <span>NOT ACTIVE YET</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                      <Clock size={15} />
                      <span>NO EXPIRATION SET</span>
                    </span>
                  )}

                  {parsedJwt.timeRemaining && (
                    <span className="text-white/70 font-semibold">{parsedJwt.timeRemaining}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10 text-[11px]">
                    ALG: <b className="text-white">{parsedJwt.alg}</b>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10 text-[11px]">
                    TYP: <b className="text-white">{parsedJwt.typ}</b>
                  </span>
                </div>
              </div>

              {/* Claims Quick Card */}
              {(parsedJwt.payload.sub || parsedJwt.payload.iss || parsedJwt.payload.email || parsedJwt.exp) && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  {parsedJwt.payload.sub && (
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[10px]">SUBJECT (SUB)</span>
                      <span className="text-slate-200 truncate block">{String(parsedJwt.payload.sub)}</span>
                    </div>
                  )}
                  {parsedJwt.payload.email && (
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[10px]">EMAIL</span>
                      <span className="text-sky-300 truncate block">{String(parsedJwt.payload.email)}</span>
                    </div>
                  )}
                  {parsedJwt.payload.iss && (
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[10px]">ISSUER (ISS)</span>
                      <span className="text-slate-200 truncate block">{String(parsedJwt.payload.iss)}</span>
                    </div>
                  )}
                  {parsedJwt.exp && (
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <span className="text-white/40 block text-[10px]">EXPIRES AT (EXP)</span>
                      <span className="text-slate-200 block">
                        {new Date(parsedJwt.exp * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Header Block */}
              <div className="rounded-xl border border-rose-500/30 bg-[#090d18] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-rose-950/30 border-b border-rose-500/20 text-xs font-mono">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <KeyRound size={14} />
                    <span>HEADER: ALGORITHM &amp; TOKEN TYPE</span>
                  </div>
                  <button
                    id="copy-header-btn"
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(parsedJwt.header, null, 2), "header")}
                    className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
                  >
                    {copiedKey === "header" ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
                    <span>{copiedKey === "header" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-rose-200 overflow-x-auto">
                  <code>{JSON.stringify(parsedJwt.header, null, 2)}</code>
                </pre>
              </div>

              {/* Payload Block */}
              <div className="rounded-xl border border-sky-500/30 bg-[#090d18] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-sky-950/30 border-b border-sky-500/20 text-xs font-mono">
                  <div className="flex items-center gap-2 text-sky-300 font-bold">
                    <FileCode2 size={14} />
                    <span>PAYLOAD: DATA &amp; CLAIMS</span>
                  </div>
                  <button
                    id="copy-payload-btn"
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(parsedJwt.payload, null, 2), "payload")}
                    className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
                  >
                    {copiedKey === "payload" ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
                    <span>{copiedKey === "payload" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-sky-200 overflow-x-auto max-h-[280px]">
                  <code>{JSON.stringify(parsedJwt.payload, null, 2)}</code>
                </pre>
              </div>

              {/* Signature Block */}
              <div className="rounded-xl border border-amber-500/30 bg-[#090d18] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-amber-950/30 border-b border-amber-500/20 text-xs font-mono">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <ShieldAlert size={14} />
                    <span>SIGNATURE (VERIFY)</span>
                  </div>
                  <button
                    id="copy-sig-btn"
                    type="button"
                    onClick={() => handleCopy(parsedJwt.signature || "", "sig")}
                    className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
                  >
                    {copiedKey === "sig" ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
                    <span>{copiedKey === "sig" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="p-3 text-xs font-mono text-amber-200/90 break-all select-all">
                  {parsedJwt.signature || "(No signature attached)"}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-mono text-white/40 space-y-2">
              <KeyRound size={24} className="mx-auto text-white/20" />
              <p>Paste a token in the left pane or pick a sample above to view decoded claims.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
