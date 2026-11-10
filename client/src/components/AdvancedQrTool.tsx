import QRCode from "qrcode";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Check, Download, ImagePlus, RotateCcw, ShieldCheck, ScanLine, X } from "lucide-react";
import {
  QR_DEFAULTS, QR_LIMITS, makeQrPayload, qrLogoFileError, qrStyleError, qrContrastRatio,
  type QrMode, type QrFields, type QrCorrection,
} from "@/lib/qrPayloads";

const kinds: readonly { value: QrMode; label: string }[] = [
  { value: "text", label: "Text / URL" },
  { value: "wifi", label: "Wi-Fi access" },
  { value: "contact", label: "Contact / vCard" },
  { value: "email", label: "Email draft" },
  { value: "sms", label: "SMS draft" },
  { value: "phone", label: "Phone call" },
];
type ScanMessage = { status: "none" | "pass" | "fail" | "unavailable"; text: string };
type BarcodeResult = { rawValue?: string };
type BrowserBarcodeDetector = { detect(source: HTMLCanvasElement): Promise<BarcodeResult[]> };
type BrowserBarcodeConstructor = new (options: { formats: string[] }) => BrowserBarcodeDetector;

const encodeOptions = (width: number, margin: number, correction: QrCorrection, dark: string, light: string) => ({
  width, margin, errorCorrectionLevel: correction, color: { dark, light },
});

async function renderQrCanvas(
  payload: string,
  width: number,
  margin: number,
  correction: QrCorrection,
  dark: string,
  light: string,
  logo: File | null,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, encodeOptions(width, margin, logo ? "H" : correction, dark, light));
  if (logo) {
    const bitmap = await createImageBitmap(logo);
    try {
      if (qrLogoFileError(logo.type, logo.size, bitmap.width, bitmap.height))
        throw new Error("Logo could not be decoded within the supported size.");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("QR canvas is unavailable.");
      // High ECC, small central logo, white-safe quiet outline. The unmodified QR
      // uses exact official encoding; overlay changes no data outside the center.
      const imageSide = Math.round(canvas.width * 0.16);
      const whiteSide = Math.round(canvas.width * 0.21);
      const outer = Math.round((canvas.width - whiteSide) / 2);
      const inner = Math.round((canvas.width - imageSide) / 2);
      context.fillStyle = light;
      context.fillRect(outer, outer, whiteSide, whiteSide);
      const crop = Math.min(bitmap.width, bitmap.height);
      context.drawImage(bitmap,
        (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop,
        inner, inner, imageSide, imageSide);
    } finally {
      bitmap.close();
    }
  }
  return canvas;
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob || blob.type !== "image/png" || !blob.size)
        return reject(new Error("Browser PNG encoding is unavailable."));
      resolve(blob);
    }, "image/png");
  });
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1200);
}

export default function AdvancedQrTool() {
  const [mode, setMode] = useState<QrMode>("text");
  const [fields, setFields] = useState<QrFields>(QR_DEFAULTS);
  const [width, setWidth] = useState(320);
  const [margin, setMargin] = useState(2);
  const [correction, setCorrection] = useState<QrCorrection>("M");
  const [dark, setDark] = useState("#0b1020");
  const [light, setLight] = useState("#f4f2ea");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState("");
  const [png, setPng] = useState<Blob | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [generating, setGenerating] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [scan, setScan] = useState<ScanMessage>({ status: "none", text: "" });

  const payload = useMemo(() => makeQrPayload(mode, fields), [mode, fields]);
  const styleError = qrStyleError(width, margin, dark, light);
  const update = <K extends keyof QrFields>(key: K, value: QrFields[K]) =>
    setFields(current => ({ ...current, [key]: value }));
  const effectiveCorrection = logo ? "H" : correction;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    let active = true;
    setScan({ status: "none", text: "" });
    setPng(null);
    setSvg(null);
    setRenderError("");
    if (!payload.value || styleError || logoError) {
      setGenerating(false);
      return () => { active = false; };
    }
    setGenerating(true);
    void (async () => {
      try {
        const canvas = await renderQrCanvas(payload.value!, width, margin, correction, dark, light, logo);
        const blob = await canvasPng(canvas);
        const generatedSvg = logo ? null : await QRCode.toString(
          payload.value!, { ...encodeOptions(width, margin, correction, dark, light), type: "svg" });
        if (!active) return;
        setPng(blob);
        setSvg(generatedSvg);
        setPreview(URL.createObjectURL(blob));
      } catch (reason) {
        if (active) setRenderError(reason instanceof Error ? reason.message : "Could not encode QR.");
      } finally {
        if (active) setGenerating(false);
      }
    })();
    return () => { active = false; };
  }, [payload.value, width, margin, correction, dark, light, logo, styleError, logoError]);

  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = qrLogoFileError(file.type, file.size);
    if (problem) { setLogoError(problem); return; }
    try {
      const bitmap = await createImageBitmap(file);
      const error = qrLogoFileError(file.type, file.size, bitmap.width, bitmap.height);
      bitmap.close();
      if (error) { setLogoError(error); return; }
      setLogoError("");
      setLogo(file);
    } catch {
      setLogoError("Logo could not be decoded. Use a JPG, PNG or WebP image.");
    }
  }

  function reset() {
    setMode("text");
    setFields(QR_DEFAULTS);
    setWidth(320);
    setMargin(2);
    setCorrection("M");
    setDark("#0b1020");
    setLight("#f4f2ea");
    setLogo(null);
    setLogoError("");
    setScan({ status: "none", text: "" });
  }

  async function verifyScan() {
    if (!png || !payload.value) return;
    const Scanner = (window as unknown as { BarcodeDetector?: BrowserBarcodeConstructor }).BarcodeDetector;
    if (!Scanner) {
      setScan({ status: "unavailable", text: "QR camera/decoder validation is unavailable in this browser. Scan with a phone before printing." });
      return;
    }
    try {
      const canvas = await renderQrCanvas(payload.value, width, margin, correction, dark, light, logo);
      const decoded = await new Scanner({ formats: ["qr_code"] }).detect(canvas);
      const match = decoded.some(item => item.rawValue === payload.value);
      setScan({
        status: match ? "pass" : "fail",
        text: match
          ? "Browser scanner decoded the exact QR content. Verify with a second device before large-scale printing."
          : "Browser scanner could not confirm the QR content. Increase contrast or remove the logo.",
      });
    } catch {
      setScan({ status: "unavailable", text: "QR scanner API could not run. Manual phone-scan verification is recommended." });
    }
  }

  const ready = Boolean(png && payload.value && !styleError && !logoError && !generating);
  const contrast = qrContrastRatio(dark, light);
  return <div className="runner-stack" data-tool="advanced-qr">
    <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
      <label className="wide-field">QR code type
        <select value={mode} data-field="qr-mode" onChange={event => setMode(event.target.value as QrMode)}>
          {kinds.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      {mode === "text" && <label className="wide-field">Text or URL
        <textarea data-field="qr-text" rows={4} maxLength={QR_LIMITS.maxPayloadBytes} value={fields.text} onChange={event => update("text", event.target.value)} />
      </label>}
      {mode === "wifi" && <>
        <div className="math-row">
          <label>Network name (SSID)<input data-field="qr-ssid" value={fields.ssid} onChange={event => update("ssid", event.target.value)} /></label>
          <label>Security<select data-field="qr-security" value={fields.wifiSecurity} onChange={event => update("wifiSecurity", event.target.value as QrFields["wifiSecurity"])}>
            <option value="WPA">WPA / WPA2 / WPA3-Personal</option><option value="WEP">WEP (legacy)</option><option value="nopass">Open network</option>
          </select></label>
          {fields.wifiSecurity !== "nopass" && <label>Wi-Fi password
            <input data-field="qr-wifi-password" type="password" autoComplete="off" value={fields.wifiPassword} onChange={event => update("wifiPassword", event.target.value)} />
          </label>}
        </div>
        <label className="check-field"><input type="checkbox" checked={fields.wifiHidden} onChange={event => update("wifiHidden", event.target.checked)} /> Hidden network</label>
        <p className="text-xs text-white/60">Anyone with this QR image can read the Wi-Fi password. Use only on trusted networks. WEP is insecure.</p>
      </>}
      {mode === "contact" && <div className="math-row">
        <label>Full name<input data-field="qr-contact-name" value={fields.contactName} onChange={event => update("contactName", event.target.value)} /></label>
        <label>Phone (optional)<input value={fields.contactPhone} onChange={event => update("contactPhone", event.target.value)} /></label>
        <label>Email (optional)<input type="email" value={fields.contactEmail} onChange={event => update("contactEmail", event.target.value)} /></label>
        <label>Organization (optional)<input value={fields.contactOrganization} onChange={event => update("contactOrganization", event.target.value)} /></label>
      </div>}
      {mode === "email" && <div className="math-row">
        <label>Recipient email<input data-field="qr-email" type="email" value={fields.emailAddress} onChange={event => update("emailAddress", event.target.value)} /></label>
        <label>Subject<input value={fields.emailSubject} onChange={event => update("emailSubject", event.target.value)} /></label>
        <label>Message<input value={fields.emailBody} onChange={event => update("emailBody", event.target.value)} /></label>
      </div>}
      {mode === "sms" && <div className="math-row">
        <label>Recipient number<input data-field="qr-sms-number" inputMode="tel" value={fields.smsNumber} onChange={event => update("smsNumber", event.target.value)} /></label>
        <label>Message<input value={fields.smsBody} onChange={event => update("smsBody", event.target.value)} /></label>
      </div>}
      {mode === "phone" && <label className="wide-field">Phone number
        <input data-field="qr-phone" inputMode="tel" value={fields.phoneNumber} onChange={event => update("phoneNumber", event.target.value)} />
      </label>}
      {payload.error && <p className="mt-2 text-sm text-red-300" role="alert">{payload.error}</p>}
    </div>

    <div className="rounded-xl border border-white/15 p-4">
      <h2 className="mb-3 font-semibold">Customize your QR</h2>
      <div className="math-row">
        <label>Image resolution
          <select data-field="qr-size" value={width} onChange={event => setWidth(Number(event.target.value))}>
            {[320, 512, 768, 1024, 1200].map(n => <option key={n} value={n}>{n} × {n} px</option>)}
          </select>
        </label>
        <label>Error correction
          <select data-field="qr-ecc" disabled={Boolean(logo)} value={effectiveCorrection} onChange={event => setCorrection(event.target.value as QrCorrection)}>
            <option value="L">L · 7%</option><option value="M">M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option>
          </select>
        </label>
        <label>Quiet zone (modules)
          <select data-field="qr-margin" value={margin} onChange={event => setMargin(Number(event.target.value))}>
            {[2, 3, 4, 5, 6, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>Dark color
          <input data-field="qr-dark" type="color" value={dark} onChange={event => setDark(event.target.value)} />
        </label>
        <label>Light color
          <input data-field="qr-light" type="color" value={light} onChange={event => setLight(event.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="quiet-button cursor-pointer"><ImagePlus size={15} /> Optional center logo
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose center logo" onChange={chooseLogo} />
        </label>
        {logo && <button className="reset-button" type="button" onClick={() => { setLogo(null); setLogoError(""); }}>
          <X size={14}/> Remove logo
        </button>}
        {logo && <span className="text-xs text-white/60">Logo applied · high error correction forced · SVG export disabled</span>}
      </div>
      <p className="mt-2 text-xs text-white/60">
        Contrast: {contrast === null ? "Invalid" : contrast.toFixed(1) + ":1"} · Logos can reduce scan reliability even with high error correction.
      </p>
      {(styleError || logoError) && <p role="alert" className="mt-2 text-sm text-red-300">{styleError || logoError}</p>}
    </div>

    <section className="rounded-xl border border-white/15 p-4" aria-label="QR code preview">
      <div className="flex flex-wrap items-start gap-5">
        <div className="w-full max-w-[320px]">
          {preview && ready
            ? <img src={preview} className="w-full rounded-lg" alt="Generated QR code preview" data-qr-image />
            : <p className="flex min-h-48 items-center justify-center rounded-lg border border-white/15 p-4 text-sm text-white/60" role="status">
              {generating ? "Generating QR locally…" : "Enter valid data and choose readable colors to preview."}
            </p>}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-sm text-white/70">Your QR code is static: encoded data is not editable after export. Scanners may handle contact, SMS and Wi-Fi differently.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="signal-button" disabled={!ready} onClick={() => png && saveBlob(png, "toolbox-galaxy-qr.png")}><Download size={16} /> Download PNG</button>
            <button type="button" className="quiet-button" disabled={!ready || !svg} onClick={() => svg && saveBlob(new Blob([svg], { type: "image/svg+xml" }), "toolbox-galaxy-qr.svg")}><Download size={16} /> Download SVG</button>
            <button type="button" className="quiet-button" disabled={!ready} onClick={() => void verifyScan()}><ScanLine size={16} /> Check scan</button>
            <button type="button" className="reset-button" onClick={reset}><RotateCcw size={16} /> Reset</button>
          </div>
          {renderError && <p role="alert" className="text-sm text-red-300">{renderError}</p>}
          {scan.status !== "none" && <p role="status" className={scan.status === "pass" ? "text-sm text-green-300" : "text-sm text-amber-200"}>{scan.text}</p>}
          <p className="flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={15} /> Everything runs in your browser. QR contents and uploaded logos are never transmitted to a QR service.</p>
        </div>
      </div>
    </section>
  </div>;
}
