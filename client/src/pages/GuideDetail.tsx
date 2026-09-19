import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import AppShell from "@/components/AppShell";
import NotFound from "@/pages/NotFound";
import { findGuideBySlug, GUIDES, GuideDefinition } from "@shared/guidesData";
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Sparkles,
  FileCheck,
  Check,
} from "lucide-react";

export default function GuideDetail() {
  const [, params] = useRoute("/guides/:slug");
  const slug = params?.slug || "";
  const guide = useMemo(() => findGuideBySlug(slug), [slug]);
  const [copied, setCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  // Update client document title
  useEffect(() => {
    if (guide) {
      document.title = `${guide.metaTitle} | Toolbox Galaxy`;
      window.scrollTo(0, 0);
    }
  }, [guide]);

  // Observer for active TOC highlighting
  useEffect(() => {
    if (!guide) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    guide.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [guide]);

  if (!guide) {
    return <NotFound />;
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: guide.title,
          text: guide.summary,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore copy error
    }
  };

  // Other related guides
  const relatedGuides = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <AppShell>
      <article className="page-section page-section--tools max-w-5xl mx-auto" id={`guide-article-${guide.slug}`}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-mono text-white/50">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/guides" className="hover:text-white transition-colors">
            Guides
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#c7f36b] truncate max-w-xs">{guide.category}</span>
        </nav>

        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-[#c7f36b] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Technical Guides</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="rounded-2xl border border-white/10 bg-[#0e1628]/90 p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-md bg-[#c7f36b]/10 border border-[#c7f36b]/30 px-3 py-1 text-xs font-mono font-semibold text-[#c7f36b]">
              {guide.category}
            </span>
            <div className="flex items-center gap-4 text-xs font-mono text-white/50 ml-auto">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {guide.readingTimeMinutes} min read
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} />
                Updated {guide.updatedDate}
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
            {guide.title}
          </h1>

          <p className="mt-4 text-base md:text-lg text-white/70 leading-relaxed font-sans">
            {guide.summary}
          </p>

          {/* Action Row */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            {/* Direct Tool Launch Callout */}
            <Link
              href={`/tools/${guide.targetToolSlug}`}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#c7f36b] px-4 py-2.5 text-xs md:text-sm font-bold text-[#0a0f1d] hover:bg-[#d8fb85] shadow-lg shadow-[#c7f36b]/15 transition-all group"
              id="guide-hero-tool-cta"
            >
              <Wrench size={16} className="text-[#0a0f1d]" />
              <span>{guide.targetToolAction}</span>
              <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all"
              id="guide-share-button"
            >
              {copied ? <Check size={14} className="text-[#c7f36b]" /> : <Share2 size={14} />}
              <span>{copied ? "Link Copied to Clipboard!" : "Share Article"}</span>
            </button>
          </div>
        </header>

        {/* Executive Summary / Key Takeaways Box */}
        <section aria-labelledby="key-takeaways-heading" className="mt-8 rounded-2xl border border-[#c7f36b]/30 bg-[#c7f36b]/[0.04] p-6">
          <div className="flex items-center gap-2 text-[#c7f36b] font-display font-bold text-sm mb-3">
            <Sparkles size={16} />
            <h2 id="key-takeaways-heading">Executive Key Takeaways</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-white/80">
            {guide.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-black/20 rounded-xl p-3 border border-white/5">
                <CheckCircle2 size={16} className="text-[#c7f36b] shrink-0 mt-0.5" />
                <span className="leading-snug">{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Main Grid: Content + Sticky Sidebar TOC */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article Content */}
          <main className="lg:col-span-8 space-y-10">
            {guide.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-white/5 bg-[#0e1628]/40 p-6 md:p-8"
              >
                <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-tight mb-4 pb-3 border-b border-white/10">
                  {section.title}
                </h2>

                <div className="prose prose-invert max-w-none text-sm md:text-base text-white/75 leading-relaxed space-y-4">
                  {section.content.split("\n\n").map((para, pIdx) => {
                    // Check if block is subheader
                    if (para.startsWith("### ")) {
                      return (
                        <h3 key={pIdx} className="font-display text-base md:text-lg font-semibold text-white pt-2 text-[#c7f36b]">
                          {para.replace("### ", "")}
                        </h3>
                      );
                    }
                    // Check if block is unordered bullet list
                    if (para.startsWith("- ") || para.startsWith("1. ")) {
                      const items = para.split("\n");
                      return (
                        <ul key={pIdx} className="space-y-1.5 pl-4 list-disc marker:text-[#c7f36b]">
                          {items.map((it, itIdx) => (
                            <li key={itIdx} className="leading-relaxed">
                              {it.replace(/^[-*]\s+|\d+\.\s+/, "")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    // Format bold and code backticks simply
                    return (
                      <p key={pIdx} className="leading-relaxed whitespace-pre-line">
                        {para}
                      </p>
                    );
                  })}
                </div>

                {/* Callout Box if present */}
                {section.callout && (
                  <div
                    className={`mt-6 rounded-xl border p-4 text-xs md:text-sm flex items-start gap-3 ${
                      section.callout.type === "warning"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        : section.callout.type === "best-practice"
                        ? "border-[#c7f36b]/30 bg-[#c7f36b]/10 text-emerald-200"
                        : "border-sky-500/30 bg-sky-500/10 text-sky-200"
                    }`}
                  >
                    {section.callout.type === "warning" ? (
                      <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                    ) : section.callout.type === "best-practice" ? (
                      <FileCheck size={18} className="shrink-0 text-[#c7f36b] mt-0.5" />
                    ) : (
                      <Info size={18} className="shrink-0 text-sky-400 mt-0.5" />
                    )}
                    <div className="leading-relaxed">{section.callout.text}</div>
                  </div>
                )}

                {/* Tips Box if present */}
                {section.tips && section.tips.length > 0 && (
                  <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs md:text-sm">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#c7f36b] font-semibold mb-2">
                      Pro-Tip / Best Practice:
                    </p>
                    <ul className="space-y-1 text-white/70 pl-4 list-disc marker:text-[#c7f36b]">
                      {section.tips.map((tip, tIdx) => (
                        <li key={tIdx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}

            {/* In-Article Midpoint Conversion Card */}
            <div className="rounded-2xl border border-[#c7f36b]/40 bg-gradient-to-br from-[#0e1628] to-[#162238] p-6 md:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#c7f36b] font-semibold">
                    RECOMMENDED ZERO-INSTALL WORKSPACE
                  </span>
                  <h3 className="font-display text-xl font-bold text-white mt-1">
                    Try {guide.targetToolName}
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-white/70 max-w-md">
                    Execute this exact workflow completely in your browser memory. No sign-up, no server uploads, and no monthly fees.
                  </p>
                </div>
                <Link
                  href={`/tools/${guide.targetToolSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-5 py-3 text-xs md:text-sm font-bold text-[#0a0f1d] hover:bg-[#d8fb85] shrink-0 transition-all shadow-md shadow-[#c7f36b]/10"
                >
                  <Wrench size={16} />
                  <span>Launch Tool Now</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            {/* Structured FAQ Section */}
            {guide.faqs && guide.faqs.length > 0 && (
              <section aria-labelledby="faqs-heading" className="rounded-2xl border border-white/10 bg-[#0e1628]/60 p-6 md:p-8">
                <div className="flex items-center gap-2 text-white font-display font-bold text-xl mb-6">
                  <HelpCircle size={20} className="text-[#c7f36b]" />
                  <h2 id="faqs-heading">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                  {guide.faqs.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10"
                    >
                      <h3 className="font-medium text-sm md:text-base text-white flex items-start gap-2">
                        <span className="font-mono text-xs text-[#c7f36b] mt-0.5">Q:</span>
                        <span>{faq.question}</span>
                      </h3>
                      <p className="mt-2 text-xs md:text-sm text-white/70 pl-5 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-20 space-y-6">
              {/* Table of Contents */}
              <div className="rounded-2xl border border-white/10 bg-[#0e1628]/80 p-5 backdrop-blur-md">
                <p className="font-mono text-xs uppercase tracking-wider text-white/40 font-semibold mb-3 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#c7f36b]" />
                  Table of Contents
                </p>
                <nav aria-label="Article outline" className="space-y-1">
                  {guide.sections.map((section, idx) => {
                    const active = activeSectionId === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`block rounded-lg px-2.5 py-1.5 text-xs transition-all leading-snug ${
                          active
                            ? "bg-[#c7f36b]/15 text-[#c7f36b] font-semibold border-l-2 border-[#c7f36b]"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {section.title}
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Contextual Tool Callout Widget */}
              <div className="rounded-2xl border border-[#c7f36b]/30 bg-[#c7f36b]/[0.03] p-5">
                <span className="inline-block rounded bg-[#c7f36b]/20 px-2 py-0.5 text-[10px] font-mono text-[#c7f36b] font-semibold uppercase">
                  Featured Browser Tool
                </span>
                <h4 className="font-display text-base font-bold text-white mt-2">
                  {guide.targetToolName}
                </h4>
                <p className="mt-1 text-xs text-white/65 leading-relaxed">
                  Run this workflow privately with zero server transmissions.
                </p>
                <Link
                  href={`/tools/${guide.targetToolSlug}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-3.5 py-2 text-xs font-bold text-[#0a0f1d] hover:bg-[#d8fb85] transition-all"
                >
                  <Wrench size={14} />
                  <span>Open Tool</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Related Guides List */}
              <div className="rounded-2xl border border-white/10 bg-[#0e1628]/60 p-5">
                <p className="font-mono text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">
                  More Technical Guides
                </p>
                <div className="space-y-3">
                  {relatedGuides.map((rg) => (
                    <Link
                      key={rg.slug}
                      href={`/guides/${rg.slug}`}
                      className="group block rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-[#c7f36b]/40 hover:bg-white/[0.05] transition-all"
                    >
                      <span className="text-[10px] font-mono text-[#c7f36b] uppercase">
                        {rg.category}
                      </span>
                      <h5 className="font-medium text-xs text-white group-hover:text-[#c7f36b] transition-colors line-clamp-2 mt-1">
                        {rg.title}
                      </h5>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </AppShell>
  );
}
