// Orbital Workbench: a plain-language local-first evidence ledger that separates current browser behavior from any future host-managed feature.
import AppShell from "@/components/AppShell";

export default function Privacy() {
  return (
    <AppShell>
      <article className="page-section policy-page">
        <header className="policy-header">
          <p className="mono-label text-[#c7f36b]">PRIVACY / LOCAL-FIRST LEDGER</p>
          <h1 className="font-display mt-4 text-5xl font-semibold tracking-[-0.065em]">
            Your input should not become a mystery.
          </h1>
          <p>
            Toolbox Galaxy’s verified tools run in the browser. The text, values, dates, times, JSON, CSV, and chosen images you enter in local tools are not sent to a Toolbox Galaxy server by the tool itself.
          </p>
          <div className="policy-readouts" aria-label="Current privacy status">
            <span>
              <b>TOOL INPUT</b>
              <small>LOCAL EXECUTION</small>
            </span>
            <span>
              <b>PLAYER PROFILE</b>
              <small>NOT REQUIRED</small>
            </span>
            <span>
              <b>COOKIE USAGE</b>
              <small>ZERO COOKIES</small>
            </span>
          </div>
        </header>

        <section className="policy-ledger-section" aria-labelledby="policy-current">
          <div className="policy-ledger-head">
            <span>01</span>
            <h2 id="policy-current">Current local records</h2>
            <b>DEVICE-ONLY</b>
          </div>
          <p>
            Orbit Dash stores a browser-local high score using local storage. This score remains on the device/browser profile until you clear browser data. We do not use it to identify you.
          </p>
          <p>
            The Games Bay can also retain a small browser-local completion flag for a genuinely solved Mini Sudoku, Tango, Queens, Patches, Zip, or Wend daily edition. The weekly local streak calendar and six-game personal-best overview only read those existing flags to show valid reached-date activity, distinct authored editions, and local-date runs; the calendar’s optional game filter and Grid/Timeline layout change the current view in memory and are not saved.
          </p>
          <p>
            Daily reminder preferences and notification eligibility flags are stored strictly on your local device (in standard browser local storage). No push registration servers, account records, or remote identifiers are ever created.
          </p>
        </section>

        <section className="policy-ledger-section" aria-labelledby="policy-tools">
          <div className="policy-ledger-head">
            <span>02</span>
            <h2 id="policy-tools">Daily utility workspaces</h2>
            <b>CURRENT TAB ONLY</b>
          </div>
          <p>
            Business Days, Time Zone Meeting Planner, Timestamp Converter, Text Diff, Find / Replace, Split Bill, Loan / EMI Estimate, Work Shift, JSON ↔ CSV Converter, CSV Viewer & Cleaner, Image Crop / Rotate / Convert, Image Metadata Remover, and Line Sorter & De-duplicator process only the values visible in their open workspace. Structured-data tools accept pasted text only. The image editor accepts one visitor-selected PNG, JPG, or WebP in browser memory, applies only explicitly chosen crop/rotation/export settings, and neither changes the original file nor uploads it. Image Metadata Remover re-exports one selected PNG, JPG, or WebP at its native decoded dimensions through a fresh local canvas; it does not inspect metadata exhaustively, change the source, or upload image bytes. Line Sorter & De-duplicator processes one pasted text list with current-tab sort, trim, blank-line, and duplicate choices; it does not upload, save, compare another document, or replace content.
          </p>
          <p>
            No listed tool saves a draft; calls a holiday, time, rate, lender, payment, payroll, text-processing, spreadsheet, conversion, or image service; creates a calendar event; or uploads your content. CSV preview cells are rendered as text, formula-looking CSV exports are written as text for spreadsheet safety, and image object URLs are released when they are replaced or the page closes. Currency choices format current numbers only. Copy and download are visitor-triggered browser actions.
          </p>
        </section>

        <section className="policy-ledger-section" aria-labelledby="policy-share">
          <div className="policy-ledger-head">
            <span>03</span>
            <h2 id="policy-share">Visitor-triggered summary</h2>
            <b>NO AUTO-SEND</b>
          </div>
          <p>
            After a genuine derived summary appears, you may choose to share, copy, or download only the visible range, selected game scope, streak, verified-day, and field-count values. It adds no account, player profile, new activity log, remote calendar request, or automatic network transmission. Opening a route, using a demo, and viewing a transformed board do not create a calendar mark, personal-best record, share card, or saved view preference.
          </p>
        </section>

        <section className="policy-ledger-section" aria-labelledby="policy-analytics">
          <div className="policy-ledger-head">
            <span>04</span>
            <h2 id="policy-analytics">Cookieless, privacy-respecting analytics & performance telemetry</h2>
            <b>AGGREGATED USAGE METRICS</b>
          </div>
          <p>
            Toolbox Galaxy respects your data privacy. All tools run 100% locally in your browser. If website analytics measurement is configured, we use Cookieless, privacy-respecting analytics to understand site traffic, popular tools, and reliability.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-white/70 text-sm my-3">
            <li><b>No cookies:</b> We operate without tracking cookies, advertising identifiers, or persistent device fingerprints.</li>
            <li><b>No IP address storage:</b> No IP address storage or raw network logs are retained or tied to user activity.</li>
            <li><b>No cross-site tracking:</b> No cross-site tracking is conducted across third-party websites or ad networks.</li>
            <li><b>Do Not Track:</b> We strictly respect your browser's Do Not Track (DNT) and Global Privacy Control (GPC) signals.</li>
          </ul>
          <p>
            <b>What is measured:</b> Standard aggregated, non-sensitive metrics to maintain site quality:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-white/70 text-sm my-3">
            <li>Aggregated pageviews and navigation (e.g., visits to specific tools or puzzle modules)</li>
            <li>Referring channels and search engine queries that brought you to the site</li>
            <li>Device categories, screen resolutions, and browser/operating system distributions</li>
            <li>Geographic region (country and city-level estimates)</li>
          </ul>
          <p>
            <b>Tool inputs are strictly protected:</b>
          </p>
          <ul className="list-disc pl-6 space-y-1 text-white/70 text-sm my-3">
            <li><b>Zero tool input transmission:</b> Whatever you type, paste, calculate, encode, or convert stays strictly inside your browser memory.</li>
            <li><b>Zero document storage:</b> Files, images, and PDFs processed locally are never transmitted to analytics or external servers.</li>
            <li><b>No keystroke recording:</b> We never record your text, passwords, or personal workspace contents.</li>
          </ul>
          <p>
            When analytics is unconfigured in local or staging environments, no analytics network requests are dispatched whatsoever.
          </p>
        </section>

        <section className="policy-ledger-section" aria-labelledby="policy-future">
          <div className="policy-ledger-head">
            <span>05</span>
            <h2 id="policy-future">Future feature notice</h2>
            <b>DECLARED BEFORE USE</b>
          </div>
          <p>
            Any future upload or server-backed tool will be marked clearly before you use it. It will publish its allowed file types, file-size limit, retention behavior, and any server processing it needs. These terms should be reviewed with the final hosting, analytics, advertising, and support configuration before public launch.
          </p>
        </section>
      </article>
    </AppShell>
  );
}
