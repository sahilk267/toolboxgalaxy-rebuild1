import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import { ShieldCheck, Cpu, Lock, Zap, ArrowRight, Mail, Phone, ExternalLink, Award, FileCode2 } from "lucide-react";

export default function About() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        {/* Header Breadcrumb & Tag */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#c7f36b] mb-4">
          <Link href="/" className="hover:underline">HOME</Link>
          <span>/</span>
          <span className="text-white/60">ABOUT</span>
        </div>

        {/* Hero Section */}
        <header className="mb-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f4f2ea]">
            About Toolbox Galaxy
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/70 max-w-3xl leading-relaxed">
            A high-performance, privacy-first technical workbench engineered by{" "}
            <span className="text-white font-semibold">Aaditech Solution</span>. All calculations, document conversions,
            and puzzle logic execute 100% inside your browser&apos;s local memory sandbox.
          </p>
        </header>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#6fd5ff]/10 flex items-center justify-center text-[#6fd5ff] mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Zero Cloud Uploads</h2>
            <p className="text-sm text-white/65 leading-relaxed">
              Your files, PDFs, images, and API keys never leave your machine. Every operation runs in local WebAssembly and Web Worker threads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#c7f36b]/10 flex items-center justify-center text-[#c7f36b] mb-4">
              <Zap size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Instant Execution</h2>
            <p className="text-sm text-white/65 leading-relaxed">
              No network roundtrips, no server queues, and no rate limits. Offline-capable Progressive Web App (PWA) with instant response times.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400 mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Zero Tracking & Ads</h2>
            <p className="text-sm text-white/65 leading-relaxed">
              No cross-site advertising pixels, third-party cookies, or invasive telemetry. An honest, clean utility suite built for developers.
            </p>
          </div>
        </div>

        {/* Mission & Organization Profile */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-[#121c33] to-[#0a1122] border border-white/10 mb-16">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#c7f36b] font-semibold">
              The Mission &amp; Team
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2 mb-4">
              Engineered by Aaditech Solution
            </h2>
            <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-6">
              Founded and maintained by <strong>Mohd Aziz Shaikh</strong>, Aaditech Solution builds privacy-preserving developer
              infrastructure and educational logic puzzles. Toolbox Galaxy was created to replace ad-ridden online converters
              with reliable, open, client-side tools that respect user autonomy.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="https://www.linkedin.com/in/mohdazizshaikh"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
              >
                Connect on LinkedIn <ExternalLink size={15} />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c7f36b] text-[#0b1020] font-semibold text-sm hover:bg-[#b6e855] transition-colors"
              >
                Contact &amp; Feedback <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Catalog Breakdown */}
        <section className="mb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6">
            Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/studio" className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#6fd5ff]/50 transition-all group">
              <div className="text-xs font-mono text-[#6fd5ff] mb-1">WORKBENCH</div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#6fd5ff] transition-colors">PDF &amp; Doc Studio</h3>
              <p className="text-xs text-white/60 mt-1">Merge, split, rotate, fill, and digitally sign documents in browser RAM.</p>
            </Link>

            <Link href="/tools" className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#c7f36b]/50 transition-all group">
              <div className="text-xs font-mono text-[#c7f36b] mb-1">UTILITIES</div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#c7f36b] transition-colors">61+ Developer Tools</h3>
              <p className="text-xs text-white/60 mt-1">JSON formatters, regex testers, JWT inspectors, timestamp converters.</p>
            </Link>

            <Link href="/games" className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-400/50 transition-all group">
              <div className="text-xs font-mono text-purple-400 mb-1">LOGIC HUB</div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">18 Daily Puzzles</h3>
              <p className="text-xs text-white/60 mt-1">The Hive, Wordle, Connections, Queens, Sudoku, and 3D arcade games.</p>
            </Link>

            <Link href="/guides" className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-400/50 transition-all group">
              <div className="text-xs font-mono text-amber-400 mb-1">DOCUMENTATION</div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Technical Guides</h3>
              <p className="text-xs text-white/60 mt-1">Authoritative tutorials on zero-upload client security and local tooling.</p>
            </Link>
          </div>
        </section>

        {/* Machine-readable Contact Box */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <h2 className="text-lg font-bold text-white mb-2">Direct Organization Details</h2>
          <address className="not-italic text-sm text-white/70 space-y-1">
            <p><strong>Entity:</strong> Aaditech Solution</p>
            <p><strong>Address:</strong> Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051, India</p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@toolboxgalaxy.com" className="text-[#6fd5ff] hover:underline">
                support@toolboxgalaxy.com
              </a>
            </p>
            <p>
              <strong>Telephone:</strong>{" "}
              <a href="tel:+919876543210" className="text-[#6fd5ff] hover:underline">
                +91-9876543210
              </a>
            </p>
            <p>
              <strong>Legal:</strong>{" "}
              <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/terms" className="text-white hover:underline">Terms of Service</Link>
            </p>
          </address>
        </section>
      </div>
    </AppShell>
  );
}
