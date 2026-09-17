import http from "http";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let activePort = 3555;
let serverProcess: ChildProcess | null = null;

async function checkPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function fetchRoute(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${activePort}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1] : null;
}

async function runTests() {
  // Check if server is already running on 3555 or 3000
  const is3555Open = await checkPortOpen(3555);
  if (is3555Open) {
    activePort = 3555;
    console.log("Using existing server on port 3555");
  } else {
    // Start ephemeral test server on port 3555
    console.log("Spawning test server on port 3555...");
    serverProcess = spawn("npx", ["tsx", path.resolve(__dirname, "../server/index.ts")], {
      env: { ...process.env, PORT: "3555", NODE_ENV: "production" },
      stdio: "pipe",
    });

    // Wait for server to boot
    let retries = 20;
    while (retries > 0) {
      await new Promise((r) => setTimeout(r, 600));
      if (await checkPortOpen(3555)) {
        console.log("Test server ready on port 3555.");
        break;
      }
      retries--;
    }
    if (retries === 0) {
      throw new Error("Timed out waiting for test server to start on port 3555");
    }
    activePort = 3555;
  }

  const tests: {
    path: string;
    expectedTitleSnippet: string;
    expectedDescSnippet: string;
    expectedOgImage: string;
  }[] = [
    {
      path: "/tools/gst-tax-calculator",
      expectedTitleSnippet: "GST &amp; Business Tax Calculator – Free Online Tool | Toolbox Galaxy",
      expectedDescSnippet: "Calculate GST (3%, 5%, 12%, 18%, 28%)",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-category-regional-tools.png",
    },
    {
      path: "/tools/passport-photo-resizer",
      expectedTitleSnippet: "Govt Job &amp; Passport Photo Resizer – Free Online Tool | Toolbox Galaxy",
      expectedDescSnippet: "Resize &amp; compress photos to exact KB limits",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-category-regional-tools.png",
    },
    {
      path: "/tools/basic-calculator",
      expectedTitleSnippet: "Basic Calculator – Free Online Tool | Toolbox Galaxy",
      expectedDescSnippet: "Clear, local arithmetic for everyday decisions.",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-category-daily-utilities.png",
    },
    {
      path: "/tools/jwt-debugger",
      expectedTitleSnippet: "JWT Debugger &amp; Token Inspector – Free Online Tool | Toolbox Galaxy",
      expectedDescSnippet: "Decode and inspect JSON Web Tokens client-side",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-category-developer-tools.png",
    },
    {
      path: "/tools/image-resizer",
      expectedTitleSnippet: "Image Resizer – Free Online Tool | Toolbox Galaxy",
      expectedDescSnippet: "Resize and compress images locally",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-category-image-tools.png",
    },
    {
      path: "/games/queens",
      expectedTitleSnippet: "Queens – Free Daily Logic Puzzle | Toolbox Galaxy",
      expectedDescSnippet: "region crowns · no touching",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-game-queens.png",
    },
    {
      path: "/games/mini-sudoku",
      expectedTitleSnippet: "Mini Sudoku – Free Daily Logic Puzzle | Toolbox Galaxy",
      expectedDescSnippet: "6×6 number field · daily clue density",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-game-mini-sudoku.png",
    },
    {
      path: "/games/tango",
      expectedTitleSnippet: "Tango – Free Daily Logic Puzzle | Toolbox Galaxy",
      expectedDescSnippet: "binary links · visible = / × rules",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-game-tango.png",
    },
    {
      path: "/games/the-hive",
      expectedTitleSnippet: "The Hive – Daily Spelling Logic Puzzle | Toolbox Galaxy",
      expectedDescSnippet: "Find words, discover the secret pangram",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-game-the-hive.png",
    },
    {
      path: "/games/queens?by=Commander",
      expectedTitleSnippet: "⚔️ Queens Challenge from Commander | Toolbox Galaxy",
      expectedDescSnippet: "Can you beat Commander&#39;s time in today&#39;s daily logic puzzle?",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-game-queens.png",
    },
    {
      path: "/tools",
      expectedTitleSnippet: "Tools Foundry – Free In-Browser Developer Utilities | Toolbox Galaxy",
      expectedDescSnippet: "Explore 50+ privacy-first in-browser developer utilities",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-tools-foundry.png",
    },
    {
      path: "/games",
      expectedTitleSnippet: "Games Bay – Free Daily Brain &amp; Logic Puzzles | Toolbox Galaxy",
      expectedDescSnippet: "Play The Hive, Wordle Plus, Queens, Connections, and Mini-Sudoku",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-games-bay.png",
    },
    {
      path: "/",
      expectedTitleSnippet: "Toolbox Galaxy – Private In-Browser Tools &amp; Daily Logic Hub",
      expectedDescSnippet: "100% client-side privacy-first workbench",
      expectedOgImage: "https://toolboxgalaxy.com/og/og-default.png",
    },
  ];

  let passedCount = 0;

  for (const t of tests) {
    const html = await fetchRoute(t.path);
    const title = extractTag(html, /<title>(.*?)<\/title>/);
    const desc = extractTag(html, /<meta name="description" content="(.*?)" \/>/);
    const ogImage = extractTag(html, /<meta property="og:image" content="(.*?)" \/>/);
    const twitterImage = extractTag(html, /<meta name="twitter:image" content="(.*?)" \/>/);

    const titleOk = title?.includes(t.expectedTitleSnippet);
    const descOk = desc?.includes(t.expectedDescSnippet);
    const ogImageOk = ogImage === t.expectedOgImage;
    const twitterImageOk = twitterImage === t.expectedOgImage;

    if (titleOk && descOk && ogImageOk && twitterImageOk) {
      console.log(`PASS · ${t.path}`);
      console.log(`       <title>:       ${title}`);
      console.log(`       <og:image>:    ${ogImage}`);
      console.log(`       <meta desc>:   ${desc?.slice(0, 60)}...`);
      passedCount++;
    } else {
      console.error(`FAIL · ${t.path}`);
      if (!titleOk) {
        console.error(`       Expected title snippet: ${t.expectedTitleSnippet}`);
        console.error(`       Actual title:           ${title}`);
      }
      if (!descOk) {
        console.error(`       Expected desc snippet:  ${t.expectedDescSnippet}`);
        console.error(`       Actual desc:            ${desc}`);
      }
      if (!ogImageOk || !twitterImageOk) {
        console.error(`       Expected OG image:      ${t.expectedOgImage}`);
        console.error(`       Actual og:image:        ${ogImage}`);
        console.error(`       Actual twitter:image:   ${twitterImage}`);
      }
      process.exitCode = 1;
    }
  }

  console.log(`\nVerified ${passedCount}/${tests.length} SEO & OG routes successfully!`);
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
  process.exit(0);
}

runTests()
  .catch((err) => {
    console.error("Verification error:", err);
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
    process.exit(1);
  });
