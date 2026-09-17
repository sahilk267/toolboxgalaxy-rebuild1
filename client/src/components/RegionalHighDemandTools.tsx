import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  QrCode, 
  Copy, 
  Check, 
  Receipt, 
  Building2, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  Scale, 
  FileCheck, 
  MapPin, 
  Languages, 
  RotateCcw,
  Percent,
  Sliders,
  Maximize2
} from "lucide-react";
import QRCodeLib from "qrcode";

// -------------------------------------------------------------
// 1. WhatsApp Direct Chat & Template Generator
// -------------------------------------------------------------
const COUNTRY_CODES = [
  { code: "+91", country: "India (भारत)", flag: "🇮🇳", defaultDigits: 10 },
  { code: "+92", country: "Pakistan (پاکستان)", flag: "🇵🇰", defaultDigits: 10 },
  { code: "+880", country: "Bangladesh (বাংলাদেশ)", flag: "🇧🇩", defaultDigits: 10 },
  { code: "+971", country: "UAE (دولة الإمارات)", flag: "🇦🇪", defaultDigits: 9 },
  { code: "+966", country: "Saudi Arabia (السعودية)", flag: "🇸🇦", defaultDigits: 9 },
  { code: "+974", country: "Qatar (قطر)", flag: "🇶🇦", defaultDigits: 8 },
  { code: "+968", country: "Oman (عُمان)", flag: "🇴🇲", defaultDigits: 8 },
  { code: "+965", country: "Kuwait (الكويت)", flag: "🇰🇼", defaultDigits: 8 },
  { code: "+44", country: "UK", flag: "🇬🇧", defaultDigits: 10 },
  { code: "+1", country: "USA / Canada", flag: "🇺🇸", defaultDigits: 10 },
];

const QUICK_TEMPLATES = [
  { title: "👋 Salam / Greetings", text: "Assalamu Alaikum / Namaste! I hope you are having a wonderful day." },
  { title: "💼 Business Enquiry", text: "Hello! I saw your listing/services and would like to know the pricing and details." },
  { title: "📍 Location Request", text: "Hi! Could you please share your current Google Maps location with me?" },
  { title: "💳 Payment Reminder", text: "Gentle reminder regarding the pending invoice/payment. Please let me know once transferred." },
  { title: "📄 Resume / Job Note", text: "Hello! I am sharing my CV/details for the open vacancy. Looking forward to your response." },
];

export function WhatsappDirectTool() {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const cleanNumber = useMemo(() => {
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    const codeDigits = countryCode.replace("+", "");
    if (!digitsOnly) return "";
    return `${codeDigits}${digitsOnly}`;
  }, [countryCode, phoneNumber]);

  const waLink = useMemo(() => {
    if (!cleanNumber) return "";
    const encodedMsg = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
    return `https://wa.me/${cleanNumber}${encodedMsg}`;
  }, [cleanNumber, message]);

  useEffect(() => {
    if (waLink) {
      QRCodeLib.toDataURL(waLink, { width: 220, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    } else {
      setQrDataUrl("");
    }
  }, [waLink]);

  const copyLink = async () => {
    if (!waLink) return;
    await navigator.clipboard.writeText(waLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    if (!waLink) return;
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2">
        <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <span>
          <strong>100% Private & Direct:</strong> Send WhatsApp messages to any unsaved contact number without adding them to your phone address book.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Country Code */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
            Country Code
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.country} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
            Phone Number (Bina 0 ya country code ke)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400 font-mono font-bold text-sm">
              {countryCode}
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder="e.g. 98765 43210"
              className="w-full h-11 pl-16 pr-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-semibold focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Message & Templates */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase text-slate-300 font-mono">
            Message (Optional / Pre-filled)
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {message.length} chars
          </span>
        </div>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message or pick a quick template below..."
          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />

        {/* Quick template chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.title}
              type="button"
              onClick={() => setMessage(tmpl.text)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:border-emerald-500/50"
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons & QR Code */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={!cleanNumber}
            onClick={openWhatsApp}
            className="w-full sm:flex-1 h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98"
          >
            <Send size={16} />
            <span>Open in WhatsApp</span>
          </button>

          <button
            type="button"
            disabled={!cleanNumber}
            onClick={copyLink}
            className="w-full sm:w-auto h-12 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            <span>{copied ? "Link Copied!" : "Copy Chat Link"}</span>
          </button>
        </div>

        {cleanNumber && (
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-mono text-slate-300">
                Direct URL: <span className="text-emerald-400">{waLink}</span>
              </p>
              <p className="text-[11px]">Scan QR code with another phone camera or WhatsApp scanner to start chatting immediately.</p>
            </div>
            {qrDataUrl && (
              <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-24 h-24" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. GST / VAT & Tax Invoice Calculator
// -------------------------------------------------------------
export function GstCalculatorTool() {
  const [amount, setAmount] = useState("10000");
  const [gstRate, setGstRate] = useState<number>(18);
  const [customRate, setCustomRate] = useState("");
  const [isInclusive, setIsInclusive] = useState(false); // Exclusive (add GST) vs Inclusive (reverse GST)
  const [isInterState, setIsInterState] = useState(false); // IGST vs CGST+SGST
  const [copied, setCopied] = useState(false);

  const activeRate = customRate !== "" ? Number(customRate) || 0 : gstRate;
  const numAmount = Number(amount) || 0;

  const result = useMemo(() => {
    const rateDecimal = activeRate / 100;
    if (isInclusive) {
      // Amount includes GST -> Base = Amount / (1 + rate)
      const baseAmount = numAmount / (1 + rateDecimal);
      const totalTax = numAmount - baseAmount;
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      return {
        baseAmount,
        totalTax,
        cgst,
        sgst,
        igst: totalTax,
        finalTotal: numAmount,
      };
    } else {
      // Amount excludes GST -> Tax = Amount * rate
      const totalTax = numAmount * rateDecimal;
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      const finalTotal = numAmount + totalTax;
      return {
        baseAmount: numAmount,
        totalTax,
        cgst,
        sgst,
        igst: totalTax,
        finalTotal,
      };
    }
  }, [numAmount, activeRate, isInclusive]);

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const copyInvoice = async () => {
    const text = `🧾 GST TAX INVOICE BREAKDOWN\n------------------------------\nType: ${isInclusive ? "GST Inclusive (Tax Included)" : "GST Exclusive (Tax Added)"}\nBase Price: ${formatCurr(result.baseAmount)}\nGST Rate: ${activeRate}%\nTotal GST Tax: ${formatCurr(result.totalTax)}\n${isInterState ? `IGST (${activeRate}%): ${formatCurr(result.igst)}` : `CGST (${activeRate / 2}%): ${formatCurr(result.cgst)}\nSGST (${activeRate / 2}%): ${formatCurr(result.sgst)}`}\n------------------------------\nTOTAL AMOUNT: ${formatCurr(result.finalTotal)}\nGenerated via Toolbox Galaxy`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Calculation Mode Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setIsInclusive(false)}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            !isInclusive
              ? "bg-emerald-500 text-slate-950 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ➕ GST Exclusive (Add GST to Amount)
        </button>
        <button
          type="button"
          onClick={() => setIsInclusive(true)}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            isInclusive
              ? "bg-emerald-500 text-slate-950 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🔄 GST Inclusive (Extract GST from Price)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
            {isInclusive ? "Total Price (Including GST)" : "Base Amount (Excluding GST)"}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-base">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full h-12 pl-9 pr-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-lg font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* GST Slab Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
            GST Slab Rate (%)
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[3, 5, 12, 18, 28].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setGstRate(rate);
                  setCustomRate("");
                }}
                className={`h-12 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all border ${
                  customRate === "" && gstRate === rate
                    ? "bg-blue-600 border-blue-400 text-white shadow-md"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* State / IGST Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <span className="text-slate-300 font-medium">
          Tax Jurisdiction: {isInterState ? "Inter-State (IGST 100%)" : "Intra-State (CGST 50% + SGST 50%)"}
        </span>
        <button
          type="button"
          onClick={() => setIsInterState(!isInterState)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold"
        >
          Switch to {isInterState ? "CGST + SGST" : "IGST"}
        </button>
      </div>

      {/* Results Matrix */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Receipt size={18} />
            <span>Tax & Price Breakdown ({activeRate}% GST)</span>
          </div>
          <button
            type="button"
            onClick={copyInvoice}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Invoice Copied!" : "Copy Receipt"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] uppercase font-mono text-slate-400 block mb-1">Base Price</span>
            <strong className="text-base sm:text-lg text-white font-mono font-bold">
              {formatCurr(result.baseAmount)}
            </strong>
          </div>

          {!isInterState ? (
            <>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] uppercase font-mono text-sky-400 block mb-1">
                  CGST ({activeRate / 2}%)
                </span>
                <strong className="text-base sm:text-lg text-sky-300 font-mono font-bold">
                  {formatCurr(result.cgst)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] uppercase font-mono text-amber-400 block mb-1">
                  SGST ({activeRate / 2}%)
                </span>
                <strong className="text-base sm:text-lg text-amber-300 font-mono font-bold">
                  {formatCurr(result.sgst)}
                </strong>
              </div>
            </>
          ) : (
            <div className="col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] uppercase font-mono text-purple-400 block mb-1">
                IGST ({activeRate}%)
              </span>
              <strong className="text-base sm:text-lg text-purple-300 font-mono font-bold">
                {formatCurr(result.igst)}
              </strong>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] uppercase font-mono text-rose-400 block mb-1">Total Tax</span>
            <strong className="text-base sm:text-lg text-rose-300 font-mono font-bold">
              {formatCurr(result.totalTax)}
            </strong>
          </div>
        </div>

        {/* Final Total Banner */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-emerald-400 font-bold block">
              FINAL INVOICE TOTAL
            </span>
            <span className="text-xs text-white/60">Includes all taxes and base goods/services charge</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {formatCurr(result.finalTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. Govt Job / Passport Photo & Signature Resizer (Exact KB target)
// -------------------------------------------------------------
export function PassportPhotoResizerTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("photo.jpg");
  const [preset, setPreset] = useState<"sarkariPhoto" | "signature" | "passport" | "custom">("sarkariPhoto");
  const [targetKb, setTargetKb] = useState(40); // 40KB default
  const [targetWidth, setTargetWidth] = useState(350);
  const [targetHeight, setTargetHeight] = useState(450);
  const [quality, setQuality] = useState(0.85);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputSizeKb, setOutputSizeKb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }
    };
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name.replace(/\.[^/.]+$/, "") + "-compressed.jpg");
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const setPresetMode = (mode: "sarkariPhoto" | "signature" | "passport" | "custom") => {
    setPreset(mode);
    if (mode === "sarkariPhoto") {
      setTargetWidth(350);
      setTargetHeight(450);
      setTargetKb(45);
      setQuality(0.85);
    } else if (mode === "signature") {
      setTargetWidth(300);
      setTargetHeight(120);
      setTargetKb(18);
      setQuality(0.80);
    } else if (mode === "passport") {
      setTargetWidth(413); // 35mm at 300dpi
      setTargetHeight(531); // 45mm at 300dpi
      setTargetKb(80);
      setQuality(0.90);
    }
  };

  // Live Canvas Resize & Target KB Iteration with real binary search
  useEffect(() => {
    if (!imageSrc) return;

    let isCurrent = true;
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx || !isCurrent) return;

      // Fill white background for passport transparency safety
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw aspect-fill centered
      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;
      let renderW = targetWidth;
      let renderH = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > canvasAspect) {
        renderW = targetHeight * imgAspect;
        offsetX = (targetWidth - renderW) / 2;
      } else {
        renderH = targetWidth / imgAspect;
        offsetY = (targetHeight - renderH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

      // Real binary search to compress as close to targetKb as possible
      const targetBytes = targetKb * 1024;
      const toBlob = (q: number) =>
        new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", q));

      let minQ = 0.05;
      let maxQ = 0.98;
      let bestBlob: Blob | null = null;

      // 6 binary search iterations gives ~1.5% precision
      for (let i = 0; i < 6; i++) {
        const midQ = (minQ + maxQ) / 2;
        const b = await toBlob(midQ);
        if (!b) break;
        if (b.size <= targetBytes) {
          bestBlob = b;
          minQ = midQ; // Try higher quality while staying within target
        } else {
          maxQ = midQ; // File too large, reduce quality
        }
      }

      if (!bestBlob) {
        bestBlob = (await toBlob(minQ)) || (await toBlob(quality));
      }

      if (!isCurrent || !bestBlob) return;

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }

      const newUrl = URL.createObjectURL(bestBlob);
      outputUrlRef.current = newUrl;

      setOutputBlob(bestBlob);
      setOutputSizeKb(Math.round((bestBlob.size / 1024) * 10) / 10);
      setOutputUrl(newUrl);
    };

    return () => {
      isCurrent = false;
    };
  }, [imageSrc, targetWidth, targetHeight, targetKb, quality]);

  const downloadFile = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Informational Guidance */}
      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2">
        <FileCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <span>
          <strong>Government & Exam Portal Standards:</strong> Meets strict size constraints for UPSC, SSC, Railways, State PSC, NTA, Nadra & College online admission forms (e.g. Photo 20KB-50KB, Signature 10KB-20KB).
        </span>
      </div>

      {/* Preset Pickers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setPresetMode("sarkariPhoto")}
          className={`p-3 rounded-xl border text-left transition-all ${
            preset === "sarkariPhoto"
              ? "bg-blue-600/20 border-blue-500 text-white shadow-lg"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <b className="block text-xs text-white">📸 Sarkari Photo</b>
          <span className="text-[11px] text-slate-400 font-mono">20KB – 50KB • 3.5×4.5 cm</span>
        </button>

        <button
          type="button"
          onClick={() => setPresetMode("signature")}
          className={`p-3 rounded-xl border text-left transition-all ${
            preset === "signature"
              ? "bg-blue-600/20 border-blue-500 text-white shadow-lg"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <b className="block text-xs text-white">✍️ Signature Box</b>
          <span className="text-[11px] text-slate-400 font-mono">10KB – 20KB • 3:1 Ratio</span>
        </button>

        <button
          type="button"
          onClick={() => setPresetMode("passport")}
          className={`p-3 rounded-xl border text-left transition-all ${
            preset === "passport"
              ? "bg-blue-600/20 border-blue-500 text-white shadow-lg"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <b className="block text-xs text-white">🛂 Passport 2×2"</b>
          <span className="text-[11px] text-slate-400 font-mono">50KB – 100KB • 300 DPI</span>
        </button>

        <button
          type="button"
          onClick={() => setPresetMode("custom")}
          className={`p-3 rounded-xl border text-left transition-all ${
            preset === "custom"
              ? "bg-blue-600/20 border-blue-500 text-white shadow-lg"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <b className="block text-xs text-white">⚙️ Custom Pixels</b>
          <span className="text-[11px] text-slate-400 font-mono">Set exact W × H & Quality</span>
        </button>
      </div>

      {/* Upload Zone */}
      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 mb-3">
            <ImageIcon size={24} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Select Photo or Signature to Resize</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Drag & drop or tap to choose JPG, PNG, or WebP. Processed 100% inside your device memory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">JPEG Quality / Compression</span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.98"
                step="0.02"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Output Size:</span>
                <b className={`font-mono text-sm ${outputSizeKb && outputSizeKb <= 50 ? "text-emerald-400" : "text-amber-400"}`}>
                  {outputSizeKb} KB
                </b>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Dimensions:</span>
                <span>{targetWidth} × {targetHeight} px</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadFile}
                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
              >
                <Download size={15} />
                <span>Download ({outputSizeKb} KB)</span>
              </button>
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="px-3 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                title="Choose new photo"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-500 mb-2 uppercase">Exact Scale Preview</span>
            {outputUrl && (
              <div className="p-2 bg-white rounded-lg shadow-xl border border-slate-300 flex items-center justify-center">
                <img
                  src={outputUrl}
                  alt="Processed Photo Preview"
                  style={{ maxHeight: "240px", maxWidth: "100%", objectFit: "contain" }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. Land & Plot Area Unit Converter (Bigha, Marla, Kanal, Gaj, Guntha)
// -------------------------------------------------------------
const LAND_UNITS = [
  { id: "sqft", name: "Square Feet (Sq. Ft)", factorToSqFt: 1, region: "Standard" },
  { id: "gaj", name: "Square Gaj / Yard (Guz)", factorToSqFt: 9, region: "North & Central India" },
  { id: "bigha_up", name: "Bigha (UP / North standard)", factorToSqFt: 27000, region: "UP / Bihar" },
  { id: "bigha_punjab", name: "Bigha (Punjab / Haryana)", factorToSqFt: 9075, region: "Punjab / Haryana" },
  { id: "bigha_bengal", name: "Bigha (Bengal / East)", factorToSqFt: 14400, region: "West Bengal / Assam" },
  { id: "marla", name: "Marla", factorToSqFt: 272.25, region: "Punjab / Pakistan / Haryana" },
  { id: "kanal", name: "Kanal (20 Marla)", factorToSqFt: 5445, region: "Punjab / Pakistan / J&K" },
  { id: "guntha", name: "Guntha / Gunta", factorToSqFt: 1089, region: "Maharashtra / Gujarat / South" },
  { id: "cent", name: "Cent / Decimal", factorToSqFt: 435.6, region: "Kerala / TN / Andhra / Bengal" },
  { id: "acre", name: "Acre (43,560 sq ft)", factorToSqFt: 43560, region: "Universal Standard" },
  { id: "hectare", name: "Hectare (10,000 sq m)", factorToSqFt: 107639.1, region: "International" },
  { id: "sqm", name: "Square Metres (Sq. M)", factorToSqFt: 10.7639, region: "Metric" },
];

export function LandAreaConverterTool() {
  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("bigha_up");

  const numVal = Number(value) || 0;
  const currentUnit = LAND_UNITS.find((u) => u.id === fromUnit) || LAND_UNITS[0];
  const totalSqFt = numVal * currentUnit.factorToSqFt;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
        <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>South Asian Regional Land Calculator:</strong> Instantly converts plot, field, and real estate measurements across Bigha, Marla, Kanal, Guntha, Gaj, Cent, Acre, and Square Feet.
        </span>
      </div>

      {/* Input Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
            Land Area Amount
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="1"
            className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-lg font-bold focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
            Selected Measurement Unit
          </label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full h-12 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-amber-500 focus:outline-none"
          >
            {LAND_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — ({u.region})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversion Grid Matrix */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
          Complete Multi-Unit Conversion Matrix:
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LAND_UNITS.map((u) => {
            const convertedVal = totalSqFt / u.factorToSqFt;
            const formatted = convertedVal >= 1000 ? convertedVal.toLocaleString("en-IN", { maximumFractionDigits: 4 }) : convertedVal.toFixed(4).replace(/\.?0+$/, "");
            const isSelected = u.id === fromUnit;

            return (
              <div
                key={u.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-400"
                    : "bg-slate-900/80 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>{u.name}</span>
                  <span className="font-mono text-[10px] text-amber-300/80">{u.region}</span>
                </div>
                <div className="text-lg font-mono font-bold text-white tracking-tight">
                  {formatted} <small className="text-xs font-normal text-slate-400">{u.name.split(" ")[0]}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. Number to Words & Cheque Amount Formatter (Rupees / Lakhs / Crores)
// -------------------------------------------------------------
const ONES_EN = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS_EN = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertTwoDigits(n: number): string {
  if (n < 20) return ONES_EN[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return TENS_EN[ten] + (one ? " " + ONES_EN[one] : "");
}

function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const str = Math.floor(num).toString();
  if (str.length > 9) return "Amount exceeds Indian standard converter limit (99 Crores).";

  const parts: string[] = [];
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  const rest = Math.floor(num % 100);

  if (crores > 0) parts.push(`${convertTwoDigits(crores)} Crore`);
  if (lakhs > 0) parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  if (thousands > 0) parts.push(`${convertTwoDigits(thousands)} Thousand`);
  if (hundreds > 0) parts.push(`${ONES_EN[hundreds]} Hundred`);
  if (rest > 0) parts.push(convertTwoDigits(rest));

  const paise = Math.round((num - Math.floor(num)) * 100);
  const paiseStr = paise > 0 ? ` and ${convertTwoDigits(paise)} Paise` : "";

  return `${parts.join(" ")} Rupees${paiseStr} Only`;
}

export function NumberToWordsTool() {
  const [amount, setAmount] = useState("145250.50");
  const [copied, setCopied] = useState(false);

  const num = Number(amount) || 0;
  const englishWords = useMemo(() => numberToIndianWords(num), [num]);

  const copyWords = async () => {
    await navigator.clipboard.writeText(englishWords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 text-violet-200 text-xs flex items-start gap-2">
        <Languages size={16} className="text-violet-400 shrink-0 mt-0.5" />
        <span>
          <strong>Banking & Cheque Slip Generator:</strong> Converts numerical amounts to Indian numbering words (Lakhs & Crores) formatted for Bank Cheques, Invoices, Slips, and Legal Agreements.
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
          Enter Amount in Numerals (₹ / Rs)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 font-mono font-bold text-lg">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="145250.50"
            className="w-full h-12 pl-9 pr-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xl font-bold focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Cheque Simulation Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121927] border border-violet-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-violet-400 font-bold">
              BANK CHEQUE / SLIP FORMAT
            </span>
          </div>
          <button
            type="button"
            onClick={copyWords}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500 hover:text-slate-950 font-bold text-xs transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Words"}</span>
          </button>
        </div>

        {/* Cheque Words Display */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Rupees in Words:</span>
          <p className="text-base sm:text-lg text-emerald-300 font-semibold leading-relaxed">
            "{englishWords}"
          </p>
        </div>

        {/* Lakhs / Crores Formatted Numeral */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <span className="text-slate-400">
            Indian Numbering:{" "}
            <strong className="text-white font-mono">
              ₹ {num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            Verified Local Math
          </span>
        </div>
      </div>
    </div>
  );
}
