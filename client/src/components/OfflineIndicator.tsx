import React from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, ShieldCheck } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline status banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-[#151c2e]/95 px-3.5 py-2 text-xs font-mono text-amber-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
      </div>
      <WifiOff size={14} className="text-amber-400" />
      <span className="font-semibold tracking-wide">OFFLINE MODE:</span>
      <span className="text-white/80">Running 100% locally from client cache</span>
      <span className="flex items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300">
        <ShieldCheck size={11} /> Zero network exposure
      </span>
    </aside>
  );
};
