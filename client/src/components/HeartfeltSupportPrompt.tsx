import { useState } from "react";
import { Coffee, Heart, Sparkles, X, ExternalLink } from "lucide-react";
import SupportModal from "@/components/SupportModal";

interface Props {
  toolName?: string;
  className?: string;
}

export default function HeartfeltSupportPrompt({ toolName, className = "" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div
        className={`relative mt-8 overflow-hidden rounded-2xl border border-[#c7f36b]/30 bg-gradient-to-br from-[#0e1628]/95 via-[#131d35]/90 to-[#0e1628]/95 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all ${className}`}
        role="region"
        aria-label="Support the developer"
      >
        {/* Glow Accent */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#c7f36b]/10 blur-2xl"
          aria-hidden="true"
        />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Dismiss note"
          title="Dismiss note"
        >
          <X size={15} />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">
            <Heart size={24} className="fill-[#c7f36b]/20" />
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-[#c7f36b]">
                <Sparkles size={12} /> INDIE DEVELOPER CRAFT
              </span>
              <span className="text-[10px] font-mono text-white/40">· 100% Ad-Free & Private</span>
            </div>

            <h3 className="font-display mt-1 text-base sm:text-lg font-semibold tracking-tight text-white">
              Saved you a $20/month SaaS subscription today?
            </h3>

            <p className="mt-1 text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
              Hi, I&apos;m an independent solo developer building <b>Toolbox Galaxy</b> to keep essential tools
              100% free, private, and subscription-free in your browser. If{" "}
              <span className="text-white font-medium">{toolName || "this tool"}</span> saved you time or money,
              consider fueling the project with a $3 coffee. It keeps our servers alive and free for everyone!
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <a
                href="https://buymeacoffee.com/mohdaziz"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#c7f36b] px-4 py-2 text-xs font-semibold text-[#090d18] shadow-md hover:bg-[#b5e358] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Coffee size={15} />
                <span>Buy Me a Coffee ($3)</span>
                <ExternalLink size={13} className="opacity-70" />
              </a>

              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
              >
                <span>UPI / Global Options</span>
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-xs text-white/40 hover:text-white/70 px-2 py-1 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>

      <SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </>
  );
}
