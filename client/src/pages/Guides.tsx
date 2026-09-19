import { useMemo, useState } from "react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";
import SectionHeading from "@/components/SectionHeading";
import { GUIDES, GuideDefinition } from "@shared/guidesData";
import {
  BookOpen,
  Search,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  FileText,
  Calculator,
  Camera,
  Code2,
} from "lucide-react";

const orbitMark = "/orbit-mark.svg";

const categoryIcons: Record<string, any> = {
  "PDF & Documents": FileText,
  "Taxes & Finance": Calculator,
  "Careers & Government": Camera,
  "Data & Development": Code2,
};

export default function Guides() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const list = Array.from(new Set(GUIDES.map((g) => g.category)));
    return ["All", ...list];
  }, []);

  const filteredGuides = useMemo(() => {
    return GUIDES.filter((guide) => {
      const matchesCategory =
        selectedCategory === "All" || guide.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        guide.title.toLowerCase().includes(q) ||
        guide.summary.toLowerCase().includes(q) ||
        guide.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <AppShell>
      <section className="page-section page-section--tools" id="guides-hub-section">
        {/* Hero Runway */}
        <div className="tools-hero-runway">
          <div>
            <div className="page-kicker">
              <span>01</span>
              <span>KNOWLEDGE BASE & REFERENCE</span>
            </div>
            <SectionHeading
              eyebrow="ZERO-UPLOAD IN-BROWSER WORKFLOWS"
              title="Technical Guides & How-To Articles"
              copy="Deep, authoritative explanations on client-side document processing, statutory tax calculations, government exam specifications, and data transformations. Built without promotional filler."
            />
          </div>

          <aside className="tools-signal-panel" aria-label="Knowledge base status">
            <div className="tools-signal-panel__head">
              <img src={orbitMark} alt="" />
              <span>GALAXY FIELD GUIDES</span>
            </div>
            <p className="tools-signal-panel__copy">
              Articles explain underlying file formats, mathematical formulas, and security guarantees. Every guide links to a zero-install tool running in pure browser memory.
            </p>
            <div className="tools-signal-panel__stats">
              <div>
                <span>AUTHORITY</span>
                <strong>100%</strong>
              </div>
              <div>
                <span>ARTICLES</span>
                <strong>{GUIDES.length}</strong>
              </div>
              <div>
                <span>TELEMETRY</span>
                <strong>Zero</strong>
              </div>
            </div>
          </aside>
        </div>

        {/* Search and Category Filter Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, topics, formulas, or formats..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#c7f36b] focus:outline-none focus:ring-1 focus:ring-[#c7f36b] transition-all"
              id="guide-search-input"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-[#c7f36b] text-[#0a0f1d] font-semibold shadow-sm"
                      : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/5"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Guides Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" id="guides-grid">
          {filteredGuides.map((guide) => {
            const Icon = categoryIcons[guide.category] || BookOpen;
            return (
              <article
                key={guide.slug}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e1628]/80 p-6 backdrop-blur-sm transition-all hover:border-[#c7f36b]/40 hover:bg-[#121c33] hover:shadow-xl"
                id={`guide-card-${guide.slug}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#c7f36b]/10 border border-[#c7f36b]/20 px-2.5 py-1 text-[11px] font-mono font-medium text-[#c7f36b]">
                      <Icon size={13} />
                      {guide.category}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-white/40 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {guide.readingTimeMinutes} min read
                      </span>
                    </div>
                  </div>

                  <h2 className="font-display text-lg font-bold text-white group-hover:text-[#c7f36b] transition-colors leading-snug">
                    <Link href={`/guides/${guide.slug}`} className="focus:outline-none">
                      {guide.title}
                    </Link>
                  </h2>

                  <p className="mt-2.5 text-sm text-white/65 line-clamp-3 leading-relaxed">
                    {guide.summary}
                  </p>

                  {/* Key takeaways bullets */}
                  <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 font-semibold flex items-center gap-1">
                      <Sparkles size={11} className="text-[#c7f36b]" />
                      Core Takeaways
                    </p>
                    <ul className="space-y-1.5 text-xs text-white/70">
                      {guide.keyTakeaways.slice(0, 2).map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-[#c7f36b] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {guide.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono text-white/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom link bar */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <Link
                    href={`/tools/${guide.targetToolSlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-[#c7f36b] transition-colors group/tool"
                    title={`Try ${guide.targetToolName}`}
                  >
                    <span>Tool: {guide.targetToolName}</span>
                    <ExternalLink size={12} className="group-hover/tool:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href={`/guides/${guide.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-[#c7f36b]/15 border border-white/10 hover:border-[#c7f36b]/40 px-3 py-1.5 text-xs font-semibold text-white hover:text-[#c7f36b] transition-all"
                  >
                    <span>Read Guide</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredGuides.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <BookOpen size={36} className="mx-auto text-white/30 mb-3" />
            <p className="text-white/80 font-medium">No guides match your search</p>
            <p className="text-xs text-white/40 mt-1">Try searching for "PDF", "GST", "photo", or "JSON"</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Authority & Methodology Footnote */}
        <div className="mt-16 rounded-2xl border border-[#c7f36b]/20 bg-[#c7f36b]/[0.03] p-6 text-sm">
          <div className="flex items-center gap-2 mb-2 text-[#c7f36b] font-display font-bold">
            <Layers size={18} />
            <h3>Our Editorial & Technical Methodology</h3>
          </div>
          <p className="text-white/70 leading-relaxed text-xs md:text-sm">
            All guides on Toolbox Galaxy are written and reviewed by software engineers and technical auditors. Every tool recommendation links to client-side, zero-upload web utilities that process data exclusively in your browser tab. We never recommend third-party cloud tools that compromise user privacy or monetize user files.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
