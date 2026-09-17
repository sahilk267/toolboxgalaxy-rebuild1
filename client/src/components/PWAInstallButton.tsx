import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Share2, PlusSquare, X, Smartphone, Laptop } from "lucide-react";

export const PWAInstallButton: React.FC<{ variant?: "compact" | "badge" | "rail" }> = ({
  variant = "rail",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, don't show the prompt
  if (isInstalled) {
    return null;
  }

  const handleTrigger = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback hint
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={handleTrigger}
          className="flex items-center gap-1.5 rounded-lg border border-[#c7f36b]/40 bg-[#c7f36b]/10 px-2.5 py-1 text-xs font-mono font-medium text-[#c7f36b] hover:bg-[#c7f36b]/20 hover:border-[#c7f36b] transition-all"
          title="Install Offline App"
        >
          <Download size={13} />
          <span>Install PWA</span>
        </button>
      ) : variant === "badge" ? (
        <button
          type="button"
          onClick={handleTrigger}
          className="inline-flex items-center gap-2 rounded-full border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-3.5 py-1.5 text-xs font-semibold text-[#c7f36b] hover:bg-[#c7f36b]/20 hover:border-[#c7f36b]/60 transition-all shadow-sm"
        >
          <Download size={14} />
          <span>Install Offline App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleTrigger}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:border-[#c7f36b]/40 hover:bg-[#c7f36b]/10 hover:text-[#c7f36b] transition-all group"
        >
          <span className="flex items-center gap-2">
            <Download size={15} className="text-[#c7f36b] group-hover:scale-110 transition-transform" />
            <span>Install Workbench</span>
          </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/60 group-hover:bg-[#c7f36b]/20 group-hover:text-[#c7f36b]">
            PWA
          </span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#12192c] p-6 shadow-2xl text-white">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-[#c7f36b] mb-3">
              {isIOS ? <Smartphone size={22} /> : <Laptop size={22} />}
              <h3 className="font-display font-bold text-base tracking-tight text-white">
                {isIOS ? "Install on iPhone / iPad" : "Install Toolbox Galaxy"}
              </h3>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-white/80 leading-relaxed">
                <p>Run all 45+ tools and daily puzzles offline without opening the browser address bar:</p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c7f36b]/20 text-[11px] font-bold text-[#c7f36b]">1</span>
                    <span>Tap the <strong>Share</strong> button in Safari toolbar</span>
                    <Share2 size={14} className="text-[#6fd5ff] ml-auto" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c7f36b]/20 text-[11px] font-bold text-[#c7f36b]">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                    <PlusSquare size={14} className="text-[#6fd5ff] ml-auto" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c7f36b]/20 text-[11px] font-bold text-[#c7f36b]">3</span>
                    <span>Tap <strong>Add</strong> in the top-right corner</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-white/80 leading-relaxed">
                <p>To install on Chrome / Edge / Brave:</p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <p>1. Look for the <strong>Install</strong> icon (computer with down arrow) in your browser URL address bar.</p>
                  <p>2. Click <strong>Install</strong> to add Orbital Workbench as a standalone native desktop app.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#c7f36b] py-2.5 text-xs font-bold text-[#0b1020] hover:bg-[#d8ff7a] transition-all"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}
    </>
  );
};
