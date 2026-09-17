// Orbital Workbench: asymmetric overview route for reliable tools and lightweight games.
import AppShell from "@/components/AppShell";
import SectionHeading from "@/components/SectionHeading";
import ToolCard from "@/components/ToolCard";
import DailyDuaCard from "@/components/DailyDuaCard";
import { PinnedQuickDock } from "@/components/PinnedQuickDock";
import { tools } from "@/data/toolRegistry";
import { GameBayVisual, HeroWorkbenchVisual, StoryToolsVisual } from "@/components/HomeVisuals";
import { ArrowRight, CheckCircle2, Gamepad2, ShieldCheck, Sparkles, Wrench, Globe, Lock, Cpu } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return <AppShell>
    <section className="hero-section">
      <div className="hero-copy">
        <div className="page-kicker"><span>00</span><span>BY AADITECH SOLUTION · PRIVACY FIRST</span></div>
        <h1 className="font-display mt-9 max-w-3xl text-5xl font-semibold leading-[0.93] tracking-[-0.075em] text-[#f4f2ea] sm:text-6xl lg:text-8xl">Make the small thing <em>easy.</em></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">Verified browser tools for the work in front of you, plus a quick game when your brain needs to clear the board.</p>
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
        <div className="hero-trust">
          <span><Globe size={15} className="text-[#c7f36b]" /> Global Edge Ready</span>
          <span><Lock size={15} className="text-[#6fd5ff]" /> 100% In-Browser Memory</span>
          <span><Cpu size={15} className="text-[#ff9b54]" /> Zero Server Uploads</span>
        </div>
      </div>
      <div className="hero-visual">
        <HeroWorkbenchVisual />
        <div className="hero-caption"><span className="status-dot" /><span>Signal received · version 01</span></div>
      </div>
    </section>

    {/* Pinned Quick Dock for Personalized 1-Click Access */}
    <section className="my-6 max-w-6xl mx-auto px-4">
      <PinnedQuickDock />
    </section>

    {/* Soulful Daily Dua & Quote Card for Positivity & Blessings */}
    <section className="my-8 max-w-4xl mx-auto px-4">
      <DailyDuaCard />
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
  </AppShell>;
}
