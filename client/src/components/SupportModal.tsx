import { useState } from "react";
import { Coffee, Check, Copy, Shield, X, Smartphone, ArrowUpRight } from "lucide-react";

export default function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"global" | "india">("global");

  if (!open) return null;

  const upiId = "shaikhaziz267@okicici";
  const upiPayLink = `upi://pay?pa=${upiId}&pn=Mohd%20Aziz%20Shaikh&cu=INR`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e1628] p-5 sm:p-6 shadow-2xl text-[#f4f2ea] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">
            <Coffee size={22} />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#c7f36b]">SUPPORT COMMUNITY UTILITY</span>
            <h3 className="font-display text-xl font-semibold tracking-tight">Support Toolbox Galaxy</h3>
          </div>
        </div>

        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/70">
          Toolbox Galaxy is <b>100% free, private, and subscription-free</b>. If our in-browser tools or games saved you time and subscription fees today, consider sponsoring a coffee!
        </p>

        {/* Currency / Region Tabs: Global First (US / UK / EU / CA), India Second */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("global")}
            className={`py-2 rounded-lg transition-all ${tab === "global" ? "bg-[#c7f36b] text-[#0b1020] font-bold shadow-md" : "text-white/70 hover:text-white"}`}
          >
            🌍 Global / US / UK / CA ($)
          </button>
          <button
            type="button"
            onClick={() => setTab("india")}
            className={`py-2 rounded-lg transition-all ${tab === "india" ? "bg-[#c7f36b] text-[#0b1020] font-bold shadow-md" : "text-white/70 hover:text-white"}`}
          >
            🇮🇳 India (UPI / QR / ₹)
          </button>
        </div>

        {tab === "global" ? (
          <div className="mt-4 space-y-3">
            {/* Quick Sponsoring Tier Presets */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://buymeacoffee.com/mohdaziz"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#c7f36b]/50 hover:bg-[#c7f36b]/10 transition-all text-center group"
              >
                <span className="text-lg font-bold text-[#c7f36b]">$3</span>
                <span className="text-[11px] text-white/60 group-hover:text-white">Espresso</span>
              </a>
              <a
                href="https://buymeacoffee.com/mohdaziz"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#c7f36b]/30 bg-[#c7f36b]/5 hover:border-[#c7f36b] hover:bg-[#c7f36b]/15 transition-all text-center group"
              >
                <span className="text-lg font-bold text-[#c7f36b]">$5</span>
                <span className="text-[11px] text-white/60 group-hover:text-white">Coffee + Donut</span>
              </a>
              <a
                href="https://buymeacoffee.com/mohdaziz"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#c7f36b]/50 hover:bg-[#c7f36b]/10 transition-all text-center group"
              >
                <span className="text-lg font-bold text-[#c7f36b]">$10</span>
                <span className="text-[11px] text-white/60 group-hover:text-white">Server Sponsor</span>
              </a>
            </div>

            {/* Official Buy Me a Coffee Badge */}
            <div className="flex flex-col items-center justify-center pt-2 gap-2">
              <a 
                href="https://buymeacoffee.com/mohdaziz" 
                target="_blank" 
                rel="noreferrer"
                className="inline-block transition-transform hover:scale-105 active:scale-95"
              >
                <img 
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                  alt="Buy Me a Coffee" 
                  style={{ height: "60px", width: "217px" }}
                  className="rounded-xl shadow-lg"
                />
              </a>
              <p className="text-[11px] text-white/50 text-center">
                Supports Credit Cards, Debit Cards, Apple Pay, Google Pay & PayPal worldwide
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Google Pay / UPI Styled Card */}
            <div className="rounded-2xl bg-gradient-to-b from-[#f0f4f9] to-[#e6edf8] p-4 text-slate-900 shadow-xl border border-white/40">
              {/* Profile Header */}
              <div className="flex items-center justify-center gap-2.5 pb-3 border-b border-slate-300/60">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white">
                  MA
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-base text-slate-900 tracking-tight leading-tight">Mohd Aziz Shaikh</h4>
                  <p className="text-[11px] text-slate-600 font-medium">Verified Merchant / Creator</p>
                </div>
              </div>

              {/* QR Code Canvas Frame */}
              <div className="my-3 flex justify-center">
                <div className="relative p-2.5 bg-white rounded-2xl shadow-md border border-slate-200/80">
                  <img
                    src="/upi-qr-aziz.png"
                    alt="UPI QR Code - Mohd Aziz Shaikh"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                  />
                  {/* Google Pay Center Emblem */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-9 w-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center p-1">
                      <div className="flex items-center justify-center w-full h-full rounded-full bg-slate-50">
                        <span className="text-[11px] font-black tracking-tighter bg-gradient-to-r from-blue-600 via-red-500 to-amber-500 bg-clip-text text-transparent">
                          GPay
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UPI ID & Details */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300 font-mono text-xs font-semibold text-slate-800">
                  <span>UPI ID:</span>
                  <span className="text-blue-700 font-bold select-all">{upiId}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Scan to pay with any UPI app (GPay, PhonePe, Paytm, BHIM, Cred)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-all active:scale-95 shadow-sm"
                >
                  {copied ? <Check size={14} className="text-[#c7f36b]" /> : <Copy size={14} />}
                  <span>{copied ? "Copied UPI!" : "Copy UPI ID"}</span>
                </button>
                <a
                  href={upiPayLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-semibold transition-all active:scale-95 shadow-sm"
                >
                  <Smartphone size={14} />
                  <span>Open UPI App</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>

            <p className="text-center text-xs text-white/50">
              Any micro-donation (₹10, ₹20, ₹50) directly supports domain & server maintenance for <b>Toolbox Galaxy</b>.
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/10 text-[11px] text-white/50 font-mono">
          <span className="flex items-center gap-1"><Shield size={12} className="text-[#c7f36b]" /> 100% On-Device Privacy</span>
          <span>By Aaditech Solution</span>
        </div>
      </div>
    </div>
  );
}
