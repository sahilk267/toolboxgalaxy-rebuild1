import { useState, useMemo } from "react";
import { 
  Link2, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Sparkles, 
  EyeOff, 
  QrCode
} from "lucide-react";

// Known tracking / telemetry parameters
const TRACKING_PARAM_DESCRIPTIONS: Record<string, string> = {
  utm_source: "Google Analytics / Campaign source origin",
  utm_medium: "Marketing medium (email, social, cpc)",
  utm_campaign: "Ad / Marketing campaign identifier",
  utm_term: "Paid search keyword tag",
  utm_content: "A/B test creative / ad version",
  utm_id: "Campaign ID",
  fbclid: "Meta / Facebook user click tracking identifier",
  gclid: "Google Ads click tracker",
  gclsrc: "Google Ads source parameter",
  dclid: "Google Display Network click ID",
  wbraid: "Google Web to App attribution token",
  gbraid: "Google App to Web attribution token",
  msclkid: "Microsoft / Bing Ads tracking token",
  mc_cid: "Mailchimp campaign identifier",
  mc_eid: "Mailchimp recipient tracking token",
  igshid: "Instagram user profile share token",
  si: "Spotify / YouTube user profile session tracker",
  ref: "Referrer tracking identifier",
  ref_src: "Twitter / X referrer source token",
  ref_url: "Referrer URL tracker",
  ttclid: "TikTok ad tracking click ID",
  yclid: "Yandex click identifier",
  twclid: "Twitter / X click identifier",
  sc_lid: "Snapchat ad tracking token",
  sc_cid: "Snapchat campaign token",
  vero_id: "Vero marketing user identifier",
  _hsenc: "HubSpot user tracking token",
  _hsmi: "HubSpot campaign message token",
};

const SAMPLE_URLS = [
  {
    label: "Google/UTM Campaign",
    url: "https://example.org/article/breaking-news?utm_source=newsletter&utm_medium=email&utm_campaign=summer_sale&utm_term=tech&id=48291"
  },
  {
    label: "Meta / Facebook Click",
    url: "https://shop.example.com/product/shoes?fbclid=IwAR3xQ9zL6M5k8P1_fakeToken12345&size=10&color=black"
  },
  {
    label: "YouTube / Spotify Share",
    url: "https://youtu.be/dQw4w9WgXcQ?si=abcdef1234567890&t=42"
  },
  {
    label: "Twitter / Instagram Share",
    url: "https://news.ycombinator.com/item?id=381920&ref_src=twsrc%5Etfw&igshid=NzAzN2Q1NTEm"
  }
];

export type CleanSuccess = {
  success: true;
  cleanUrl: string;
  originalUrl: string;
  removedParams: { key: string; value: string; reason: string }[];
  preservedParams: { key: string; value: string }[];
  domain: string;
  protocol: string;
  pathname: string;
  bytesSaved: number;
  hasTrackers: boolean;
};

export type CleanFailure = {
  success: false;
  error: string;
};

export type CleanResult = CleanSuccess | CleanFailure;

export default function TrackingUrlCleanerTool() {
  const [inputUrl, setInputUrl] = useState<string>(SAMPLE_URLS[0].url);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Parse and strip trackers
  const cleanResult = useMemo<CleanResult | null>(() => {
    const raw = inputUrl.trim();
    if (!raw) return null;

    let parsedUrl: URL;
    try {
      // Add https:// protocol if missing for parsing
      const urlToParse = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      parsedUrl = new URL(urlToParse);
    } catch {
      return { success: false, error: "Please enter a valid web URL." };
    }

    const removedParams: { key: string; value: string; reason: string }[] = [];
    const preservedParams: { key: string; value: string }[] = [];
    const keysToDelete: string[] = [];

    parsedUrl.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      const isKnownTracker = lowerKey in TRACKING_PARAM_DESCRIPTIONS;
      const isUtm = lowerKey.startsWith("utm_");
      const isAffiliateTracker = /^(aff_|affiliate|partner_id|click_id|sub_id)/i.test(lowerKey);

      if (isKnownTracker || isUtm || isAffiliateTracker) {
        keysToDelete.push(key);
        removedParams.push({
          key,
          value: val,
          reason: TRACKING_PARAM_DESCRIPTIONS[lowerKey] || "Advertising / attribution parameter"
        });
      } else {
        preservedParams.push({ key, value: val });
      }
    });

    // Remove them from URL searchParams
    keysToDelete.forEach(k => parsedUrl.searchParams.delete(k));

    const cleanUrlString = parsedUrl.toString();
    const originalLength = raw.length;
    const cleanLength = cleanUrlString.length;
    const bytesSaved = Math.max(0, originalLength - cleanLength);

    return {
      success: true,
      cleanUrl: cleanUrlString,
      originalUrl: raw,
      removedParams,
      preservedParams,
      domain: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      pathname: parsedUrl.pathname,
      bytesSaved,
      hasTrackers: removedParams.length > 0
    };
  }, [inputUrl]);

  const handleCopy = async () => {
    if (!cleanResult || !cleanResult.success) return;
    await navigator.clipboard.writeText(cleanResult.cleanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sample Presets */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#0e1628] border border-white/10 text-xs font-mono">
        <Sparkles size={16} className="text-sky-400" />
        <span className="text-white/60 uppercase">TEST WITH TRACKED SAMPLES:</span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_URLS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setInputUrl(s.url)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input URL Box */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs font-mono text-white/70">
          <span className="flex items-center gap-1.5">
            <Link2 size={15} className="text-sky-400" />
            <span>DIRTY / TRACKED SOURCE URL</span>
          </span>
          {inputUrl && (
            <button
              type="button"
              onClick={() => setInputUrl("")}
              className="text-white/40 hover:text-white"
            >
              Clear
            </button>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste any link with tracking parameters (UTM, fbclid, gclid, etc.)..."
            className="w-full px-4 py-3 text-xs sm:text-sm font-mono bg-[#090d18] border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* Output Results */}
      {cleanResult && !cleanResult.success ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{cleanResult.error}</span>
        </div>
      ) : cleanResult && cleanResult.success ? (
        <div className="space-y-4 animate-fade-in">
          {/* Clean Output Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#0a1020] border border-sky-400/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                <ShieldCheck size={18} />
                <span className="font-bold tracking-wider uppercase">CLEAN SANITIZED URL</span>
                {cleanResult.bytesSaved > 0 && (
                  <span className="px-2 py-0.5 rounded bg-sky-400/10 border border-sky-400/30 text-sky-300 text-[10px]">
                    -{cleanResult.bytesSaved} characters stripped
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 flex items-center gap-1.5"
                >
                  <QrCode size={14} />
                  <span>{showQr ? "Hide QR" : "Show QR"}</span>
                </button>
              </div>
            </div>

            {/* Clean URL display */}
            <div className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs sm:text-sm text-sky-200 break-all select-all leading-relaxed">
              {cleanResult.cleanUrl}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "COPIED TO CLIPBOARD" : "COPY CLEAN LINK"}</span>
              </button>

              <a
                href={cleanResult.cleanUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <span>VISIT</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Optional QR Code */}
            {showQr && (
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center justify-center space-y-2">
                <p className="text-xs font-mono text-white/60">Scan to open clean URL on mobile device:</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(cleanResult.cleanUrl)}`}
                  alt="QR Code for Clean Link"
                  className="w-40 h-40 rounded-lg bg-white p-2"
                />
              </div>
            )}
          </div>

          {/* Privacy Telemetry Breakdown */}
          <div className="p-4 rounded-xl bg-[#090d18] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white/60 flex items-center gap-1.5">
                <EyeOff size={15} className="text-amber-400" />
                <span>STRIPPED TELEMETRY &amp; SURVEILLANCE PARAMETERS ({cleanResult.removedParams.length})</span>
              </span>
              {cleanResult.hasTrackers ? (
                <span className="text-rose-400 font-bold">Privacy Risks Neutralized</span>
              ) : (
                <span className="text-lime-400">No Trackers Detected</span>
              )}
            </div>

            {cleanResult.removedParams.length > 0 ? (
              <div className="divide-y divide-white/5 border border-white/10 rounded-lg overflow-hidden text-xs font-mono">
                {cleanResult.removedParams.map((p) => (
                  <div key={p.key} className="p-2.5 bg-black/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        {p.key}
                      </span>
                      <span className="text-white/50 text-[11px] truncate max-w-[180px] sm:max-w-[280px]">
                        ={p.value}
                      </span>
                    </div>
                    <span className="text-amber-300/80 text-[11px] italic">
                      {p.reason}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-white/40 p-2">
                This URL had no invasive UTM, Facebook, or Google telemetry parameters.
              </p>
            )}

            {cleanResult.preservedParams.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-mono text-white/50 mb-1">
                  Legitimate Functional Parameters Retained ({cleanResult.preservedParams.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cleanResult.preservedParams.map(p => (
                    <span key={p.key} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 text-[11px] font-mono">
                      {p.key}={p.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
