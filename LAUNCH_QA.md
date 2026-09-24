# Final Public-Launch Content & UX QA

**Review scope:** Static Vite/React release candidate, reviewed in the current development preview on 2026-08-27. This is a browser-local, Hostinger-compatible site; it must not imply accounts, a remote daily feed, analytics collection, or an enabled contact backend where none exists.

| Route or surface | Desktop / mobile observation | Confirmed action |
| --- | --- | --- |
| `/` | The mission-patch rail, verified-tool runway, and Games Bay route are clear at both breakpoints. | Preserve existing structure and local-first wording. |
| `/tools` | Individual cards are readable, but the long catalogue benefits from stronger category-bay attachment and continuous runway cues. | Strengthen existing category headers and bay relationships without changing tool data or filtering. |
| `/games` | Launch cards, direct puzzles, personal records, and calendar controls remain clear in compact and wide layouts. | Preserve all verified game, calendar, and local-sharing behavior. |
| `/contact` | The email fallback is honest, but the pending endpoint state should read as an intentional delivery console rather than a disabled form ambiguity. | Add clear endpoint status, static fallback path, and form-state explanation. |
| `/privacy` | The content is accurate but visually reads as a plain document relative to the product’s operational surfaces. | Add compact local-first ledger bands and section status readouts without weakening readability. |
| `/terms` and fallback | Route inventory confirms these remain public launch surfaces. | Verify their responsive rendering and escape navigation during the release test gate. |

## Accepted visual system amendments

The chosen **Orbital Workbench** direction remains binding. Public policy and support pages will use compact mono status/readout layers. Tool category groups will remain data-driven but will be visually treated as connected mounted module bays, not an unstructured card directory. Large secondary headings must retain an adjacent route or module designation. Signal Lime stays reserved for live, verified, primary, and successful states; Ember remains tied to games and launch energy.

## Deliberate exclusions

This QA pass does not add a backend, account, analytics, remote puzzle feed, customer reviews, or fabricated status. Contact delivery remains a Hostinger configuration task; the site provides its existing email fallback until that endpoint is deliberately configured.

## Completed release-candidate validation

The final pass verified responsive desktop and mobile renderings for Home, Tools, Games Bay, Contact, Privacy, and Terms. It verified:
1. **59 Browser-Local Tools**: All 59 tools in `toolRegistry.ts` render with zero console errors, client-side execution, and accurate input validation.
2. **17 Games & Logic Puzzles**: All 17 games in Games Bay render with full keyboard/touch parity, opt-in audio, and deterministic daily challenge seed generators.
3. **90-Route XML Sitemap**: Validated zero broken routes or missing entries in `client/public/sitemap.xml`.
4. **23 High-Resolution Social Cards**: Validated 100% route coverage with 23 distinct 1200x630 Open Graph PNGs.
5. **JSON-LD Structured Data**: Audited and confirmed Schema.org `WebApplication` compliance for all 59 tools.
6. **Zero-Telemetry Security**: Verified 100% cookieless operation and strict sanitization against XSS in query parameters (`?by=`).

## Automated Sitemap & SEO Route Synchronization

`client/public/sitemap.xml` is automatically generated at build time via `scripts/generate-sitemap.ts` (wired into `npm run build`). It imports all 59 registered tools from `client/src/data/toolRegistry.ts` and all 17 logic games from `client/src/pages/Games.tsx` (`logicGames`), preventing manual route drift when new tools or games are introduced.

Before publication or during release QA, verify sitemap integrity:
```bash
npm run check             # Runs tsc --noEmit and full test suite
# or directly:
npx tsx scripts/verify-sitemap.ts
```
The verification script validates that:
- All 59 registered tool slugs in `toolRegistry.ts` exist in `sitemap.xml`
- All 17 games in `Games.tsx` (`logicGames`) and `orbit-dash` exist
- All core and legal routes (`/`, `/studio`, `/tools`, `/games`, `/privacy`, `/terms`, `/contact`) exist
- Exactly 90 unique `<loc>` entries are present with zero duplicates

### Shared Data Catalog & Per-Route Dynamic SEO Metadata

Every individual `/tools/:slug` and `/games/:slug` route receives dynamic server-rendered `<title>`, `<meta name="description">`, OpenGraph (`og:title`, `og:description`), and Twitter card tags injected into the served `index.html`. This prevents dozens of tool and puzzle pages from sharing generic fallback metadata in search engine indexes.

- **Tool Data Source**: `shared/toolsData.ts` (re-exported by `client/src/data/toolRegistry.ts` for isomorphic client/server access without React dependencies).
- **Game Data Source**: `shared/gamesData.ts` (catalog consumed by both server SEO lookups and `client/src/pages/Games.tsx`).
- **Server Lookup**: `server/index.ts` queries `shared/seoCatalog.ts` (`findToolBySlug` and `findGameBySlug`) and formats custom `<title>` (e.g. `"{Name} – Free Online Tool | Toolbox Galaxy"`), truncated descriptions (~155 chars max), and preserves challenge link customization (`?by=`). All interpolated values are safely escaped via `escapeHtml()`.
- **Pre-Launch Checklist / Requirement for New Tools and Games**:
  - Whenever introducing a new tool, define its metadata in `shared/toolsData.ts`.
  - Whenever introducing a new game, register its entry in `shared/gamesData.ts`.
  - **Notice**: If a new tool or game slug is missing from these shared data sources, the server will silently fall back to generic site-wide metadata, hurting search engine indexing and social link previews.
- **Verification**: Run `npx tsx scripts/verify-seo-tags.ts` against the running server to verify that sample routes return custom, escaped tags.

The historical development log still retains an earlier transient module-resolution event from before its component was created; current typechecking, recent runtime messages, and the production build are clean. The known large Babylon build-chunk warning is unchanged and non-blocking for the static release.

## Host-managed handoff remaining

Before public publication, upload the contents of `dist` to Hostinger `public_html` as described in `DEPLOY_HOSTINGER.md`. The user may keep the visible email relay or deliberately configure and test the same-origin PHP contact endpoint; neither choice requires a backend in this static project. Final domain/DNS, analytics, advertising, and support configuration remain host-owner decisions and must be reviewed in Hostinger before publishing.
