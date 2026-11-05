// Orbital Workbench: asymmetric overview route for reliable tools and lightweight games.
import AppShell from "@/components/AppShell";
import SectionHeading from "@/components/SectionHeading";
import ToolCard from "@/components/ToolCard";
import DailyDuaCard from "@/components/DailyDuaCard";
import ToolOfTheDayCard from "@/components/ToolOfTheDayCard";
import { PinnedQuickDock } from "@/components/PinnedQuickDock";
import { DailyHabitPulse } from "@/components/DailyHabitPulse";
import { CommunityToolBallot } from "@/components/CommunityToolBallot";
import { tools } from "@/data/toolRegistry";
import { GameBayVisual, HeroWorkbenchVisual, StoryToolsVisual } from "@/components/HomeVisuals";
import { ArrowRight, CheckCircle2, Gamepad2, ShieldCheck, Sparkles, Wrench, Globe, Lock, Cpu, Search, Mail, Phone, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return <AppShell>
    <section className="hero-section">
      <div className="hero-copy">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6fd5ff]/35 bg-[#6fd5ff]/10 px-3.5 py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(111,213,255,0.18)]">
          <span className="flex h-2 w-2 rounded-full bg-[#6fd5ff] animate-pulse" />
          <span className="font-mono text-xs font-semibold tracking-wide text-[#6fd5ff]">
            AIR-GAPPED PRIVACY ARCHITECTURE
          </span>
          <span className="text-white/30">|</span>
          <span className="text-xs text-white/80 font-medium">100% In-Browser Memory</span>
        </div>
        <h1 className="font-display mt-6 max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-[-0.05em] text-[#f4f2ea]">
          Toolbox Galaxy – Private In-Browser Tools &amp; Daily Logic Hub
        </h1>
        <p className="mt-4 text-xl sm:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#6fd5ff] via-[#a3e8ff] to-[#c7f36b]">
          Your files never leave your machine. Processed 100% in local memory.
        </p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
          Edit sensitive PDFs, clean spreadsheets, convert docs, and format code without trusting third-party servers. Everything runs inside your browser&apos;s isolated RAM sandbox—plus quick brain-clearing logic games when you need a mental break.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/studio" className="signal-button bg-[#c7f36b] text-[#0b1020]">
            Open PDF & Doc Studio <ArrowRight size={17} />
          </Link>
          <Link href="/tools" className="quiet-button">
            All tools <Wrench size={17} />
          </Link>
          <Link href="/games" className="quiet-button">
            Games <Gamepad2 size={17} />
          </Link>
        </div>

        {/* WebMCP Annotated In-Browser Agent Discovery Form */}
        <form
          action="/tools"
          method="GET"
          role="search"
          data-toolname="search_toolbox"
          {...{ toolname: "search_toolbox", tooldescription: "Search through 61 privacy-first in-browser developer utilities and daily logic puzzles on Toolbox Galaxy" }}
          className="mt-6 flex max-w-lg items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1.5 focus-within:border-[#6fd5ff]/60 transition-all"
        >
          <Search size={18} className="ml-2.5 text-white/50 shrink-0" />
          <input
            type="search"
            name="q"
            aria-label="Search tools and games"
            placeholder="Search 61 offline tools (PDF, JSON, Regex, Wordle)..."
            className="w-full bg-transparent px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-[#c7f36b] hover:text-[#0b1020] transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="hero-trust">
          <span><Globe size={15} className="text-[#c7f36b]" /> Instant Zero-Install Edge</span>
          <span className="rounded-full border border-[#6fd5ff]/30 bg-[#6fd5ff]/10 px-2.5 py-1 text-white shadow-[0_0_12px_rgba(111,213,255,0.15)]">
            <Lock size={15} className="text-[#6fd5ff]" /> <strong className="font-semibold text-[#6fd5ff]">Isolated RAM Sandbox</strong>
          </span>
          <span><Cpu size={15} className="text-[#ff9b54]" /> Zero Cloud Logs</span>
        </div>
      </div>
      <div className="hero-visual">
        <HeroWorkbenchVisual />
        <div className="hero-caption"><span className="status-dot" /><span>Signal received · version 01</span></div>
      </div>
    </section>

    {/* Daily Habit & Streak Pulse */}
    <section className="my-6 max-w-6xl mx-auto px-4">
      <DailyHabitPulse />
    </section>

    {/* Pinned Quick Dock for Personalized 1-Click Access */}
    <section className="my-6 max-w-6xl mx-auto px-4">
      <PinnedQuickDock />
    </section>

    {/* Daily Discovery: Tool of the Day */}
    <section className="my-6 max-w-4xl mx-auto px-4">
      <ToolOfTheDayCard />
    </section>

    {/* Soulful Daily Dua & Quote Card for Positivity & Blessings */}
    <section className="my-8 max-w-4xl mx-auto px-4">
      <DailyDuaCard />
    </section>

    {/* Community Vote: Next Friday's Tool Drop */}
    <section className="my-8 max-w-4xl mx-auto px-4">
      <CommunityToolBallot />
    </section>

    {/* Regional & Daily High-Demand Essentials */}
    <section className="page-section module-section pt-2">
      <SectionHeading 
        eyebrow="HIGH UTILITY / DAILY ESSENTIALS" 
        title="Most used everyday tools in your region." 
        copy="High-traffic utilities crafted for instant daily tasks: direct WhatsApp messaging without saving numbers, GST tax invoices, Sarkari exam photo resizers, regional land units, and banking cheque words." 
      />
      <div className="tool-grid tool-grid--featured">
        {tools.filter(t => t.tags.includes("Popular")).map((tool) => (
          <ToolCard key={tool.slug} tool={tool} compact />
        ))}
      </div>
    </section>

    <section className="page-section module-section">
      <SectionHeading eyebrow="TOOLS / READY NOW" title="A smaller set, built to hold up." copy="No mystery status. These first modules run entirely in your browser and are being rebuilt with consistent validation, accessibility, and clear privacy signals." />
      <div className="tool-grid tool-grid--featured">{tools.slice(0, 4).map((tool) => <ToolCard key={tool.slug} tool={tool} compact />)}</div>
      <Link href="/tools" className="inline-rail-link">See all verified modules <ArrowRight size={16} /></Link>
    </section>

    <section className="page-section story-split">
      <div className="story-image">
        <StoryToolsVisual />
        <p className="image-telemetry">EVIDENCE PANEL / LOCAL MODULE INSTRUMENTS</p>
      </div>
      <div className="story-copy"><p className="mono-label text-[#c7f36b]">THE REBUILD RULE</p><h2 className="font-display mt-4 text-4xl font-semibold tracking-[-0.055em] md:text-5xl">If it isn’t verified, it isn’t in the launch bay.</h2><p>Every tool is local-first wherever possible. That keeps the Hostinger deployment lighter, avoids broken inherited endpoints, and makes the expected behavior easier to test.</p><div className="story-list"><span><Wrench size={17} /> Typed tool registry</span><span><ShieldCheck size={17} /> Explicit privacy behavior</span><span><Sparkles size={17} /> Consistent interaction patterns</span></div></div>
    </section>

    <section className="page-section game-callout">
      <div className="game-art">
        <GameBayVisual />
        <p className="image-telemetry image-telemetry--ember">PLAYFIELD RECORD / ARCADE & LOGIC MODULES</p>
      </div>
      <div className="game-copy"><p className="mono-label text-[#ff9b54]">GAMES / READY NOW</p><h2 className="font-display mt-4 text-4xl font-semibold tracking-[-0.055em] md:text-5xl">A useful pause is part of the workbench.</h2><p>Games are intentionally separate from tools: lightweight, lazy-loaded, and designed for short browser breaks. Enjoy Orbit Dash along with daily logic puzzles including Mini Sudoku, Tango, and Queens.</p><Link href="/games" className="ember-button">Enter games bay <ArrowRight size={17} /></Link></div>
    </section>

    {/* Organization, Contact Details, and Legal Transparency Footer */}
    <footer className="mt-16 pt-12 pb-16 border-t border-white/10 max-w-6xl mx-auto px-4 text-white/80">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display text-xl font-bold tracking-tight text-[#f4f2ea]">Toolbox Galaxy</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#c7f36b]/15 text-[#c7f36b] border border-[#c7f36b]/30">Verified Local Workbench</span>
          </div>
          <p className="text-sm text-white/70 max-w-md leading-relaxed mb-4">
            A 100% client-side workbench providing private PDF tools, 61 developer utilities, and daily logic puzzles. Everything executes directly in your browser memory with zero cloud file storage.
          </p>
          <div className="text-xs text-white/60 space-y-1">
            <p>Developed &amp; Maintained by <strong className="text-white">Aaditech Solution</strong></p>
            <p>Operating Address: Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051, India</p>
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider text-[#c7f36b] font-semibold mb-3">Direct Contact</h3>
          <ul className="text-sm space-y-2 text-white/75">
            <li>
              <span className="text-white/40 block text-xs">Email Support:</span>
              <a href="mailto:support@toolboxgalaxy.com" className="text-[#6fd5ff] hover:underline font-mono text-xs inline-flex items-center gap-1">
                <Mail size={13} /> support@toolboxgalaxy.com
              </a>
            </li>
            <li>
              <span className="text-white/40 block text-xs">Direct Telephone:</span>
              <a href="tel:+919876543210" className="text-[#6fd5ff] hover:underline font-mono text-xs inline-flex items-center gap-1">
                <Phone size={13} /> +91-9876543210
              </a>
            </li>
            <li>
              <Link href="/contact" className="inline-flex items-center gap-1 text-[#c7f36b] hover:underline text-xs mt-1">
                About &amp; Feedback Form <ArrowRight size={13} />
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider text-[#c7f36b] font-semibold mb-3">Company &amp; Legal</h3>
          <ul className="text-sm space-y-2">
            <li>
              <Link href="/about" className="hover:text-white transition-colors font-medium text-white/90">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact &amp; Support
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy (Zero Upload)
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/in/mohdazizshaikh"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-white/70 hover:text-[#6fd5ff] transition-colors"
              >
                LinkedIn Profile <ArrowRight size={13} />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
        <p>© 2026 Toolbox Galaxy · Aaditech Solution. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/llms.txt" className="hover:text-white underline">llms.txt</Link>
          <Link href="/.well-known/mcp/server-card.json" className="hover:text-white underline">MCP Server Card</Link>
          <a href="/sitemap.xml" className="hover:text-white underline">Sitemap</a>
        </div>
      </div>
    </footer>
  </AppShell>;
}
