import React from "react";
import { 
  Activity, 
  Binary, 
  CheckCircle2, 
  CircuitBoard, 
  Cpu, 
  FileText, 
  Flame, 
  Gamepad2, 
  Gauge, 
  KeyRound, 
  Layers, 
  Lock, 
  Radio, 
  RefreshCw, 
  Route, 
  ShieldCheck, 
  Sparkles, 
  Terminal, 
  Wrench, 
  Zap 
} from "lucide-react";

export function HeroWorkbenchVisual() {
  return (
    <div className="relative w-full h-full min-h-[380px] bg-gradient-to-br from-[#0e1628] via-[#09101e] to-[#060b15] p-6 flex flex-col justify-between overflow-hidden">
      {/* Background Cosmic Grid & Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(111,213,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(111,213,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#c7f36b]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#6fd5ff]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#c7f36b]">
          <span className="w-2 h-2 rounded-full bg-[#c7f36b] animate-pulse" />
          <span className="tracking-wider">ORBITAL MATRIX v2.4</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-white/50">
          <span>LATENCY: 0ms (LOCAL)</span>
          <span className="text-white/20">|</span>
          <span className="text-[#6fd5ff]">ISOLATED SANDBOX</span>
        </div>
      </div>

      {/* Center Interactive System Matrix */}
      <div className="relative z-10 my-4 grid grid-cols-3 gap-3">
        {/* Module 1: Document Processing */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-[#c7f36b]/40 transition-colors group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-[#c7f36b]/10 text-[#c7f36b]">
              <FileText size={18} />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/60">PDF / DOC</span>
          </div>
          <p className="text-xs font-semibold text-white/90 group-hover:text-[#c7f36b] transition-colors">Doc Studio</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-[#c7f36b]">
            <CheckCircle2 size={11} /> 100% In-Memory
          </div>
        </div>

        {/* Module 2: Security & Hashes */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-[#6fd5ff]/40 transition-colors group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-[#6fd5ff]/10 text-[#6fd5ff]">
              <Lock size={18} />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/60">CRYPTO</span>
          </div>
          <p className="text-xs font-semibold text-white/90 group-hover:text-[#6fd5ff] transition-colors">Hash & Vault</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-[#6fd5ff]">
            <ShieldCheck size={11} /> Zero Leakage
          </div>
        </div>

        {/* Module 3: Games Bay Engine */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-[#ff9b54]/40 transition-colors group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-[#ff9b54]/10 text-[#ff9b54]">
              <Gamepad2 size={18} />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/60">ARCADE</span>
          </div>
          <p className="text-xs font-semibold text-white/90 group-hover:text-[#ff9b54] transition-colors">Games Bay</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-[#ff9b54]">
            <Zap size={11} /> Web Audio Synths
          </div>
        </div>
      </div>

      {/* Real-time Oscilloscope & Execution Stream */}
      <div className="relative z-10 p-3 rounded-lg bg-[#070c16] border border-white/10 font-mono text-xs text-white/70 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>REALTIME BUS FLOW</span>
          <span className="text-[#c7f36b]">EXECUTION: GREEN</span>
        </div>
        <div className="h-6 flex items-center gap-1 overflow-hidden">
          {[40, 65, 30, 85, 45, 90, 60, 75, 40, 95, 50, 70, 85, 60, 35, 80, 55, 90, 45, 75, 60, 85, 40, 70].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-gradient-to-t from-[#6fd5ff]/40 to-[#c7f36b] rounded-full transition-all duration-300"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoryToolsVisual() {
  return (
    <div className="relative w-full h-full min-h-[380px] bg-gradient-to-br from-[#0c1527] to-[#070d18] p-6 flex flex-col justify-between overflow-hidden">
      {/* Background Circuit Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#6fd5ff_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
      
      {/* Top Telemetry */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#6fd5ff]">
          <ShieldCheck size={16} />
          <span className="tracking-wider">LOCAL VALIDATION SUITE</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30">
          ALL PASS
        </span>
      </div>

      {/* Visual Diagnostic Stack */}
      <div className="relative z-10 my-4 space-y-2.5">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400">
              <CircuitBoard size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90">Circuit Diagnostics</p>
              <p className="text-[11px] text-white/50 font-mono">100% deterministic logic tree</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#c7f36b] font-bold">PASS 01</span>
        </div>

        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
              <Binary size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90">Data Partitioning</p>
              <p className="text-[11px] text-white/50 font-mono">Isolated client memory buffers</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#6fd5ff] font-bold">PASS 02</span>
        </div>

        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <KeyRound size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90">Key Generation & Hashes</p>
              <p className="text-[11px] text-white/50 font-mono">Web Crypto standard API</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">PASS 03</span>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-white/40 border-t border-white/10 pt-3">
        <span>SECURITY: AIR-GAPPED READY</span>
        <span className="text-[#c7f36b]">0 DATA EXFILTRATION</span>
      </div>
    </div>
  );
}

export function GameBayVisual() {
  return (
    <div className="relative w-full h-full min-h-[360px] bg-gradient-to-br from-[#161226] via-[#100d1e] to-[#090712] p-6 flex flex-col justify-between overflow-hidden">
      {/* Ambient Arcade Glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#ff9b54]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#a78bfa]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Arcade Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#ff9b54]">
          <Flame size={16} />
          <span className="tracking-wider">ARCADE FLIGHT BAY</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-[#ff9b54] border border-orange-500/30">
          60 FPS BABYLON.JS
        </span>
      </div>

      {/* Flight Radar & Module Vectors */}
      <div className="relative z-10 my-4 grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[#ff9b54] text-xs font-mono mb-2">
            <Gamepad2 size={16} />
            <span className="font-bold">ORBIT DASH</span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Physics-driven orbital runner with procedural obstacle gates.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[#c7f36b] text-xs font-mono mb-2">
            <Radio size={16} />
            <span className="font-bold">SIGNAL SWITCH</span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            High-speed signal router matching frequency nodes in real time.
          </p>
        </div>
      </div>

      {/* Dynamic Sound & Logic Footer */}
      <div className="relative z-10 p-3 rounded-lg bg-[#0c0817] border border-[#ff9b54]/20 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <Sparkles size={14} className="text-[#ff9b54]" />
          <span>Local scores & procedural synth audio</span>
        </div>
        <span className="text-[#ff9b54] font-bold">READY</span>
      </div>
    </div>
  );
}
