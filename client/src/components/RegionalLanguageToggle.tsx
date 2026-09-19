import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

interface RegionalLanguageToggleProps {
  className?: string;
  variant?: "header" | "inline";
}

export default function RegionalLanguageToggle({
  className = "",
  variant = "header",
}: RegionalLanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs ${className}`}
        role="region"
        aria-label="Language options"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <Languages size={15} className="text-emerald-400 shrink-0" />
          <span className="font-medium text-[11px] sm:text-xs">
            {language === "hi" ? "भाषा चुनें (Language):" : "Regional Language:"}
          </span>
        </div>
        <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              language === "en"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            aria-pressed={language === "hi"}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              language === "hi"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-sm ${className}`}
      role="group"
      aria-label="Select tool language"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          language === "en"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        aria-pressed={language === "hi"}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          language === "hi"
            ? "bg-emerald-500 text-slate-950 shadow-sm font-bold"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="हिन्दी में उपयोग करें"
      >
        हिन्दी
      </button>
    </div>
  );
}
