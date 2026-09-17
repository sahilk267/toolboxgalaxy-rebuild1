import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  findToolBySlug,
  findGameBySlug,
  truncateDescription,
  resolveOgImageUrl,
  renderToolJsonLdScript,
} from "../shared/seoCatalog";
import { sanitizeUserParam, escapeHtml } from "../shared/userParam";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust static dist path resolution with validation
function findValidDistPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "dist"),
    path.resolve(__dirname, "..", "dist"),
    path.resolve(__dirname, "dist"),
    path.resolve(process.cwd(), "client", "dist"),
    path.resolve(__dirname, "..", "client", "dist"),
    path.resolve(process.cwd(), "client"),
    path.resolve(__dirname, "..", "client"),
    path.resolve(__dirname, "public"),
  ];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) continue;
      const indexPath = path.join(dir, "index.html");
      if (!fs.existsSync(indexPath)) continue;

      const stat = fs.statSync(indexPath);
      if (stat.size < 50) continue;

      const content = fs.readFileSync(indexPath, "utf-8");
      if (content.includes("<html") || content.includes("<!DOCTYPE") || fs.existsSync(path.join(dir, "assets"))) {
        return dir;
      }
    } catch {
      // Ignore read/stat errors and check next candidate
    }
  }

  return null;
}

function getFallbackHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Toolbox Galaxy – Initializing</title>
  <style>
    body {
      margin: 0;
      background: #0b1020;
      color: #f4f2ea;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      font-family: monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(199, 243, 107, 0.15);
      color: #c7f36b;
      border: 1px solid rgba(199, 243, 107, 0.3);
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.03em;
    }
    p {
      margin: 0 0 24px;
      color: rgba(244, 242, 234, 0.65);
      font-size: 14px;
      line-height: 1.6;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(199, 243, 107, 0.2);
      border-top-color: #c7f36b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .button {
      display: inline-block;
      background: #c7f36b;
      color: #0b1020;
      font-weight: 600;
      font-size: 13px;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
    }
    .button:hover { opacity: 0.9; }
  </style>
  <script>
    setInterval(async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const check = await fetch("/");
          if (check.ok && check.headers.get("content-type")?.includes("text/html")) {
            const text = await check.text();
            if (!text.includes("build-in-progress-screen")) {
              window.location.reload();
            }
          }
        }
      } catch (e) {}
    }, 2500);
  </script>
</head>
<body id="build-in-progress-screen">
  <div class="card">
    <div class="badge">Workbench Boot Sequence</div>
    <div class="spinner"></div>
    <h1>Application Assets Initializing</h1>
    <p>The client bundle is being prepared or compiled. This page will automatically refresh as soon as static production assets are mounted.</p>
    <button class="button" onclick="window.location.reload()">Reload Now</button>
  </div>
</body>
</html>`;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // In-memory cache for production assets to avoid per-request synchronous filesystem I/O
  let cachedDistPath: string | null = findValidDistPath();
  let cachedIndexHtml: string | null = null;
  let staticMiddleware: express.Handler | null = null;

  if (cachedDistPath) {
    try {
      const indexPath = path.join(cachedDistPath, "index.html");
      cachedIndexHtml = fs.readFileSync(indexPath, "utf-8");
      // Set up a non-blocking watcher so if dist/index.html is re-generated, cache updates automatically
      try {
        fs.watch(indexPath, () => {
          try {
            if (cachedDistPath) {
              cachedIndexHtml = fs.readFileSync(indexPath, "utf-8");
            }
          } catch {}
        });
      } catch {}
    } catch {}
    staticMiddleware = express.static(cachedDistPath, { maxAge: "1h", index: false });
  }

  // Pre-compiled singleton static middleware - zero per-request disk scanning
  app.use((req, res, next) => {
    if (staticMiddleware) {
      return staticMiddleware(req, res, next);
    }
    // Lazy discovery only if server started before production bundle was completed
    if (!cachedDistPath) {
      const discovered = findValidDistPath();
      if (discovered) {
        cachedDistPath = discovered;
        try {
          cachedIndexHtml = fs.readFileSync(path.join(discovered, "index.html"), "utf-8");
        } catch {}
        staticMiddleware = express.static(discovered, { maxAge: "1h", index: false });
        return staticMiddleware(req, res, next);
      }
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      staticPath: cachedDistPath || "unresolved",
      hasIndex: Boolean(cachedIndexHtml),
    });
  });

  // Handle client-side routing - serve index.html with automated dynamic SEO & OpenGraph meta tags
  app.get("*", (req, res) => {
    const pathname = req.path;

    // If it is a missing static file asset, return a clean 404 instead of HTML to prevent syntax errors
    if (/\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|ico|json|woff2?|ttf|map)$/i.test(pathname) || pathname.startsWith("/assets/")) {
      return res.status(404).type("text/plain").send("Asset not found");
    }

    // Serve directly from in-memory cache without any synchronous disk I/O
    let html = cachedIndexHtml;

    // If not cached yet (e.g. cold start race condition), attempt single resolution
    if (!html) {
      if (!cachedDistPath) {
        cachedDistPath = findValidDistPath();
        if (cachedDistPath) {
          staticMiddleware = express.static(cachedDistPath, { maxAge: "1h", index: false });
        }
      }
      if (cachedDistPath) {
        try {
          cachedIndexHtml = fs.readFileSync(path.join(cachedDistPath, "index.html"), "utf-8");
          html = cachedIndexHtml;
        } catch {}
      }
    }

    if (!html) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(getFallbackHtml());
    }

    const safeBy = sanitizeUserParam(req.query.by);

    let pageTitle = "Toolbox Galaxy – Private In-Browser Tools & Daily Logic Hub";
    let ogTitle = "Toolbox Galaxy – Free In-Browser Tools & Daily Logic Puzzles";
    let ogDesc = "100% client-side privacy-first workbench: PDF & Doc Studio, 120+ utilities, and daily logic puzzles (The Hive, Wordle, Connections).";

    const isHive = pathname.startsWith("/games/the-hive") || pathname.startsWith("/games/hive") || pathname.startsWith("/games/spelling-bee");
    const isWordle = pathname.startsWith("/games/wordle") || pathname.startsWith("/games/orbit-lexicon");
    const isConnections = pathname.startsWith("/games/connections");
    const isCrossword = pathname.startsWith("/games/mini-crossword") || pathname.startsWith("/games/crossword");
    const isStrands = pathname.startsWith("/games/strands") || pathname.startsWith("/games/theme-threads");

    const isTool = pathname.startsWith("/tools/");
    const toolSlug = isTool ? pathname.replace(/^\/tools\/?/, "").split("/")[0] : null;

    let toolJsonLdScript: string | null = null;
    if (toolSlug) {
      const matchedTool = findToolBySlug(toolSlug);
      if (matchedTool) {
        if (safeBy) {
          pageTitle = `${safeBy} thinks you'll find this useful: ${matchedTool.name} | Toolbox Galaxy`;
          ogTitle = `${safeBy} thinks you'll find this useful: ${matchedTool.name} | Toolbox Galaxy`;
          ogDesc = `${safeBy} shared this free, private in-browser tool with you: ${matchedTool.name}. ${truncateDescription(matchedTool.description, 110)}`;
        } else {
          pageTitle = `${matchedTool.name} – Free Online Tool | Toolbox Galaxy`;
          ogTitle = `${matchedTool.name} – Free Online Tool | Toolbox Galaxy`;
          ogDesc = truncateDescription(matchedTool.description, 155);
        }
        toolJsonLdScript = renderToolJsonLdScript(matchedTool);
      } else if (safeBy) {
        const rawSlug = toolSlug || "tool";
        const formatted = rawSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        pageTitle = `${safeBy} thinks you'll find this useful: ${formatted} | Toolbox Galaxy`;
        ogTitle = `${safeBy} thinks you'll find this useful: ${formatted} | Toolbox Galaxy`;
        ogDesc = `${safeBy} shared this free, private in-browser utility with you. 100% client-side with zero data collection.`;
      }
    } else if (pathname === "/tools" || pathname === "/tools/") {
      pageTitle = "Tools Foundry – Free In-Browser Developer Utilities | Toolbox Galaxy";
      ogTitle = "Tools Foundry – Free In-Browser Developer Utilities";
      ogDesc = "Explore 50+ privacy-first in-browser developer utilities, converters, calculators, and formatters. 100% client-side.";
    } else if (isHive) {
      if (safeBy) {
        pageTitle = `⚔️ Challenge from ${safeBy} – The Hive | Toolbox Galaxy`;
        ogTitle = `⚔️ ${safeBy} challenged you in The Hive!`;
        ogDesc = `Can you beat ${safeBy}'s time in today's hexagonal word puzzle? Play now with zero install!`;
      } else {
        pageTitle = "The Hive – Daily Spelling Logic Puzzle | Toolbox Galaxy";
        ogTitle = "🐝 The Hive – Daily Hex Word Puzzle";
        ogDesc = "Find words, discover the secret pangram, and reach Queen Bee rank! 100% free with daily curated puzzles.";
      }
    } else if (isWordle) {
      if (safeBy) {
        pageTitle = `⚔️ Wordle Challenge from ${safeBy} | Toolbox Galaxy`;
        ogTitle = `⚔️ ${safeBy} challenged you to Wordle Plus!`;
        ogDesc = `Can you guess the 5-letter word faster than ${safeBy}? Step up to the challenge!`;
      } else {
        pageTitle = "Wordle Plus – Daily 5-Letter Word Puzzle | Toolbox Galaxy";
        ogTitle = "🟩 Wordle Plus – Daily Word Challenge";
        ogDesc = "Test your vocabulary with daily 5-letter puzzles. Free, clean UI, audio cues, and zero ads.";
      }
    } else if (isConnections) {
      if (safeBy) {
        pageTitle = `⚔️ Connections Challenge from ${safeBy} | Toolbox Galaxy`;
        ogTitle = `⚔️ ${safeBy} challenged you to Connections!`;
        ogDesc = `Can you group all 4 word categories with fewer mistakes than ${safeBy}? Accept the challenge!`;
      } else {
        pageTitle = "Connections – Daily 4×4 Word Association Puzzle | Toolbox Galaxy";
        ogTitle = "🔠 Connections – Daily Word Association Puzzle";
        ogDesc = "Find four groups of 4 related words across 4 hidden categories. 100% free with daily new editions.";
      }
    } else if (isCrossword) {
      if (safeBy) {
        pageTitle = `⚔️ Crossword Challenge from ${safeBy} | Toolbox Galaxy`;
        ogTitle = `⚔️ ${safeBy} challenged you to Mini Crossword!`;
        ogDesc = `Can you solve today's 5×5 crossword faster than ${safeBy}? Play now!`;
      } else {
        pageTitle = "Mini Crossword – Daily 5×5 Speed Puzzle | Toolbox Galaxy";
        ogTitle = "📰 Mini Crossword – Daily 5×5 Speed Puzzle";
        ogDesc = "Solve the daily 5×5 mini crossword puzzle across and down. Fast, clean, and 100% free.";
      }
    } else if (isStrands) {
      if (safeBy) {
        pageTitle = `⚔️ Strands Challenge from ${safeBy} | Toolbox Galaxy`;
        ogTitle = `⚔️ ${safeBy} challenged you to Strands!`;
        ogDesc = `Can you uncover the theme words and spangram faster than ${safeBy}? Play now!`;
      } else {
        pageTitle = "Strands – Daily Word Connection & Spangram Puzzle | Toolbox Galaxy";
        ogTitle = "🧶 Strands – Daily Theme Words Puzzle";
        ogDesc = "Find all theme words and the golden spangram across the 8×6 grid. 100% free with zero ads.";
      }
    } else if (pathname.startsWith("/games")) {
      const gameSlug = pathname.replace(/^\/games\/(?:logic\/)?/, "").split("/")[0];
      const matchedGame = gameSlug ? findGameBySlug(gameSlug) : undefined;

      if (matchedGame) {
        if (safeBy) {
          pageTitle = `⚔️ ${matchedGame.name} Challenge from ${safeBy} | Toolbox Galaxy`;
          ogTitle = `⚔️ ${safeBy} challenged you in ${matchedGame.name}!`;
          ogDesc = `Can you beat ${safeBy}'s time in today's daily logic puzzle? Play now with zero ads and zero install!`;
        } else {
          pageTitle = `${matchedGame.name} – Free Daily Logic Puzzle | Toolbox Galaxy`;
          ogTitle = `${matchedGame.name} – Free Daily Logic Puzzle`;
          ogDesc = truncateDescription(`${matchedGame.name}: ${matchedGame.detail}. Play free in your browser with zero ads.`, 155);
        }
      } else if (safeBy) {
        const rawSlug = gameSlug || "puzzle";
        const formatted = rawSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        const safeFormatted = escapeHtml(formatted);
        pageTitle = `⚔️ ${safeFormatted} Challenge from ${safeBy} | Toolbox Galaxy`;
        ogTitle = `⚔️ ${safeBy} challenged you in ${safeFormatted}!`;
        ogDesc = `Can you beat ${safeBy}'s time in today's daily logic puzzle? Play now with zero ads and zero install!`;
      } else {
        pageTitle = "Games Bay – Free Daily Brain & Logic Puzzles | Toolbox Galaxy";
        ogTitle = "🎮 Games Bay – Daily Brain & Word Puzzles";
        ogDesc = "Play The Hive, Wordle Plus, Queens, Connections, and Mini-Sudoku in your browser.";
      }
    } else if (pathname.startsWith("/pdf-studio") || pathname.startsWith("/studio") || pathname.startsWith("/document-studio")) {
      pageTitle = "PDF Studio – Free Private In-Browser PDF Editor | Toolbox Galaxy";
      ogTitle = "📄 PDF Studio – 100% Client-Side Private PDF Tools";
      ogDesc = "Merge, split, rotate, convert, and edit PDFs locally in your browser. Zero cloud uploads, 100% confidential.";
    } else if (pathname === "/privacy") {
      pageTitle = "Privacy Policy – Toolbox Galaxy";
      ogTitle = "Privacy Policy – Toolbox Galaxy";
      ogDesc = "Toolbox Galaxy privacy policy. 100% client-side architecture with zero tracking and zero server-side file retention.";
    } else if (pathname === "/terms") {
      pageTitle = "Terms of Service – Toolbox Galaxy";
      ogTitle = "Terms of Service – Toolbox Galaxy";
      ogDesc = "Terms of service and usage conditions for Toolbox Galaxy local-first utilities.";
    } else if (pathname === "/contact") {
      pageTitle = "Contact Us – Toolbox Galaxy";
      ogTitle = "Contact Us – Toolbox Galaxy";
      ogDesc = "Get in touch with the Toolbox Galaxy maintainers for support, suggestions, or feedback.";
    }

    const ogImageUrl = resolveOgImageUrl(pathname);
    const safeEscapedTitle = escapeHtml(pageTitle);
    const safeEscapedOgTitle = escapeHtml(ogTitle);
    const safeEscapedOgDesc = escapeHtml(ogDesc);
    const safeEscapedOgImage = escapeHtml(ogImageUrl);
    const canonicalUrl = `https://toolboxgalaxy.com${pathname === "/" ? "" : pathname.split("?")[0]}`;
    const safeEscapedCanonicalUrl = escapeHtml(canonicalUrl);

    // Replace meta tags dynamically using callback functions to prevent regex replacement injection
    html = html
      .replace(/<title>.*?<\/title>/, () => `<title>${safeEscapedTitle}</title>`)
      .replace(/<link rel="canonical" href=".*?" \/>/, () => `<link rel="canonical" href="${safeEscapedCanonicalUrl}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/, () => `<meta property="og:url" content="${safeEscapedCanonicalUrl}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/, () => `<meta property="og:title" content="${safeEscapedOgTitle}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/, () => `<meta property="og:description" content="${safeEscapedOgDesc}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/, () => `<meta property="og:image" content="${safeEscapedOgImage}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/, () => `<meta name="twitter:title" content="${safeEscapedOgTitle}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/, () => `<meta name="twitter:description" content="${safeEscapedOgDesc}" />`)
      .replace(/<meta name="twitter:image" content=".*?" \/>/, () => `<meta name="twitter:image" content="${safeEscapedOgImage}" />`)
      .replace(/<meta name="description" content=".*?" \/>/, () => `<meta name="description" content="${safeEscapedOgDesc}" />`);

    if (toolJsonLdScript) {
      html = html.replace("</head>", () => `  ${toolJsonLdScript}\n</head>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  const port = Number(process.env.PORT) || 3000;
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/ (serving ${cachedDistPath || "fallback"})`);
  });
}

startServer().catch(console.error);
