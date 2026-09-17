// Orbital Workbench: searchable verified-tool registry arranged as connected, data-driven module bays rather than an unverified legacy catalogue.
import AppShell from "@/components/AppShell";
import FavoriteTools from "@/components/FavoriteTools";
import RecentToolHistory from "@/components/RecentToolHistory";
import SectionHeading from "@/components/SectionHeading";
import ToolCard from "@/components/ToolCard";
import { categories, tools } from "@/data/toolRegistry";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

const orbitMark = "/orbit-mark.svg";

export default function Tools() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");

  const visibleTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesQuery = `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Popular"
          ? tool.tags.includes("Popular")
          : tool.category === activeCategory);
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query]);

  const categoryGroups = useMemo(() => {
    return categories
      .filter((category) => category !== "All" && category !== "Popular")
      .map((category) => ({
        category,
        items: visibleTools.filter((tool) => tool.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleTools]);

  return (
    <AppShell>
      <section className="page-section page-section--tools">
        <div className="tools-hero-runway">
          <div>
            <div className="page-kicker">
              <span>01</span>
              <span>VERIFIED TOOL FOUNDRY</span>
            </div>
            <SectionHeading
              eyebrow="LOCAL-FIRST / ZERO SERVER DEPENDENCIES"
              title="Small tools. Clear outcomes."
              copy="The foundry keeps browser-run utilities that can be tested, explained, and used without sending your input away."
            />
          </div>

          <aside className="tools-signal-panel" aria-label="Tool foundry status">
            <div className="tools-signal-panel__head">
              <img src={orbitMark} alt="" />
              <span>ORBITAL TOOL CONTROL</span>
              <i>LIVE</i>
            </div>
            <strong>
              {tools.length} <small>verified modules</small>
            </strong>
            <div className="tools-signal-panel__metrics">
              <span>
                LOCAL EXECUTORS <b>{tools.length}/{tools.length}</b>
              </span>
              <span>
                REMOTE DEPENDENCIES <b>00</b>
              </span>
              <span>
                INPUT RETENTION <b>NONE</b>
              </span>
            </div>
          </aside>
        </div>

        <FavoriteTools />
        <RecentToolHistory />

        <div className="tool-controls">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search verified tools"
              aria-label="Search verified tools"
            />
          </label>
          <div className="category-bar" aria-label="Tool categories">
            <SlidersHorizontal size={16} className="text-[#c7f36b]" />
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-chip ${activeCategory === category ? "filter-chip--active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="tools-result-line">
          <span>{visibleTools.length.toString().padStart(2, "0")} verified modules</span>
          <span>runs in your browser</span>
        </div>

        {activeCategory === "All" ? (
          <div className="tool-module-fields">
            {categoryGroups.map((group, index) => (
              <section
                className="tool-group"
                key={group.category}
                aria-labelledby={`tool-group-${group.category.replace(/\W+/g, "-")}`}
              >
                <div className="tool-group__head">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2 id={`tool-group-${group.category.replace(/\W+/g, "-")}`}>
                    {group.category} modules
                  </h2>
                  <b>{String(group.items.length).padStart(2, "0")} online</b>
                </div>
                <p className="tool-group__readout">
                  BAY {String(index + 1).padStart(2, "0")} / {group.items.length} BROWSER-LOCAL EXECUTOR
                  {group.items.length === 1 ? "" : "S"} / MOUNTED
                </p>
                <div className="tool-grid">
                  {group.items.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="tool-grid">
            {visibleTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}

        {visibleTools.length === 0 && (
          <div className="empty-state">
            <p className="mono-label">NO MODULE FOUND</p>
            <p>Try a shorter search or return to all categories.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
