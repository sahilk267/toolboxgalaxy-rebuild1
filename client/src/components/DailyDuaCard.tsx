import { useState } from "react";
import { getDailyQuote } from "@/data/dailyDuas";
import { Sparkles, Heart, Share2, Check, Quote } from "lucide-react";

export default function DailyDuaCard() {
  const quote = getDailyQuote();
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"english" | "urdu" | "hindi">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tg_daily_dua_lang");
        if (saved === "urdu" || saved === "hindi" || saved === "english") {
          return saved;
        }
      } catch {
        // Storage access restricted
      }
    }
    return "english";
  });

  const handleSelectLang = (selected: "english" | "urdu" | "hindi") => {
    setLang(selected);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tg_daily_dua_lang", selected);
      } catch {
        // Storage write restricted
      }
    }
  };

  const currentBlessing = 
    lang === "english" ? (quote.blessingEnglish || quote.blessing) :
    lang === "urdu" ? (quote.blessingUrdu || quote.blessing) :
    (quote.blessingHindi || quote.blessing);

  const handleShare = () => {
    const text = `${currentBlessing}\n\n"${quote[lang]}"\n\n🕊️ Have a blessed and joyful day! Shared via Toolbox Galaxy:\n${window.location.origin}`;
    if (navigator.share) {
      navigator.share({
        title: "Daily Dua & Blessing",
        text: text,
        url: window.location.origin
      }).catch(() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#0e172a] to-teal-950/30 p-5 sm:p-6 shadow-xl shadow-emerald-950/20 backdrop-blur-md">
      {/* Decorative ambient ring */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />

      {/* Header with pill and language switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Heart size={14} className="fill-emerald-400/40" />
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-400 block">
              DAILY DUA & BLESSING
            </span>
            <span className="text-xs text-white/60 font-medium">{quote.theme}</span>
          </div>
        </div>

        {/* Language Toggles */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs font-semibold">
          <button
            onClick={() => handleSelectLang("english")}
            className={`px-2.5 py-1 rounded-md transition-all ${lang === "english" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-white/60 hover:text-white"}`}
          >
            Eng
          </button>
          <button
            onClick={() => handleSelectLang("urdu")}
            className={`px-2.5 py-1 rounded-md transition-all ${lang === "urdu" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-white/60 hover:text-white"}`}
          >
            اردو
          </button>
          <button
            onClick={() => handleSelectLang("hindi")}
            className={`px-2.5 py-1 rounded-md transition-all ${lang === "hindi" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-white/60 hover:text-white"}`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="my-4 space-y-3">
        {quote.arabic && (
          <p className="text-right text-lg sm:text-xl font-arabic text-amber-200/90 leading-loose tracking-wide dir-rtl" style={{ fontFamily: "Traditional Arabic, Scheherazade New, serif" }}>
            {quote.arabic}
          </p>
        )}

        <div className="relative pl-3 border-l-2 border-emerald-500/40">
          <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
            {quote[lang]}
          </p>
        </div>

        {/* Heartfelt blessing */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-300 flex items-start gap-2">
          <Sparkles size={16} className="text-amber-300 shrink-0 mt-0.5" />
          <span>{currentBlessing}</span>
        </div>
      </div>

      {/* Share / Copy Action */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-white/40 text-[11px] font-mono">
          {lang === "english" ? "🕊️ Daily Prayer & Blessings" : "🕊️ Dil se Dua, Har Roz"}
        </span>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-semibold text-xs transition-all active:scale-95"
          title="Share Dua to WhatsApp/Friends"
        >
          {copied ? (
            <>
              <Check size={13} />
              <span>{lang === "english" ? "Dua Copied with Link!" : "دعا کاپی ہو گئی!"}</span>
            </>
          ) : (
            <>
              <Share2 size={13} />
              <span>{lang === "english" ? "Share Dua" : "Dua Share Karein"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
