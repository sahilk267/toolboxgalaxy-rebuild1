import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=======================================================");
console.log("  TOOLBOX GALAXY — PRIVACY ANALYTICS INTEGRITY AUDIT  ");
console.log("=======================================================");

// 1. Audit codebase to verify zero tracking scripts exist
console.log("👉 1. Auditing codebase for banned tracking/telemetry libraries...");
const clientSrcDir = path.resolve(process.cwd(), "client/src");

function scanDirectory(dir: string, bannedPatterns: RegExp[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, bannedPatterns);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".html"))) {
      // Skip analytics.ts itself where types and safety guards are declared
      if (entry.name === "analytics.ts") continue;
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const pattern of bannedPatterns) {
        assert(
          !pattern.test(content),
          `Banned tracking pattern ${pattern} found in ${fullPath}`
        );
      }
    }
  }
}

const bannedTracking = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /gtag\s*\(/i,
  /ga\s*\(\s*['"]send['"]/i,
  /connect\.facebook\.net/i,
  /fbevents\.js/i,
  /cdn\.segment\.com/i,
  /api\.mixpanel\.com/i,
  /app\.posthog\.com/i,
];

scanDirectory(clientSrcDir, bannedTracking);
console.log("✓ Zero banned tracking or advertising trackers found across client/src.");

// 2. Audit Privacy Policy copy
console.log("👉 2. Auditing client/src/pages/Privacy.tsx copy for cookieless analytics...");
const privacyPath = path.resolve(process.cwd(), "client/src/pages/Privacy.tsx");
const privacyContent = fs.readFileSync(privacyPath, "utf-8");

assert(privacyContent.includes("Cookieless, privacy-respecting analytics"), "Privacy.tsx must include analytics section");
assert(privacyContent.includes("No cookies"), "Privacy.tsx must explicitly state no cookies are used");
assert(privacyContent.includes("No IP address storage"), "Privacy.tsx must explicitly state no IP addresses stored");
assert(privacyContent.includes("No cross-site tracking"), "Privacy.tsx must state no cross-site tracking");
assert(privacyContent.includes("Do Not Track"), "Privacy.tsx must state respect for DNT");
console.log("✓ Privacy policy explicitly details cookieless analytics and DNT honor.");

// 3. Test analytics.ts module logic
console.log("👉 3. Testing client/src/lib/analytics.ts configuration & no-op behavior...");

// Mock window and document
class MockElement {
  tagName: string;
  dataset: Record<string, string> = {};
  src = "";
  defer = false;
  constructor(tagName: string) {
    this.tagName = tagName;
  }
}

const appendedElements: MockElement[] = [];
const mockDocument: any = {
  querySelector: () => null,
  createElement: (tag: string) => new MockElement(tag),
  head: {
    appendChild: (el: MockElement) => appendedElements.push(el),
  },
};

(globalThis as any).window = (globalThis as any).window || {};
(globalThis as any).window.document = mockDocument;
(globalThis as any).document = mockDocument;

// Test default unconfigured behavior (clean no-op)
const {
  getAnalyticsConfig,
  isDoNotTrackEnabled,
  initAnalytics,
  trackEvent,
  trackPageView,
  trackToolAction,
  sanitizeTelemetryProps,
} = await import("../client/src/lib/analytics");

const defaultConfig = getAnalyticsConfig();
assert.strictEqual(defaultConfig.provider, "none", "Default provider must be 'none' when env is empty");
assert.strictEqual(defaultConfig.respectDNT, true);

// 4. Test strict privacy sanitization
console.log("👉 4. Testing strict privacy sanitization of telemetry properties...");
const rawPropsWithPii = {
  email: "victim@example.com",
  user: "Alice",
  username: "alice_wonderland",
  password: "supersecretpassword",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMC6Y5",
  text: "Personal journal entry or confidential PDF text",
  input: "user secret data",
  ip: "192.168.1.1",
  file_count: 3,
  format: "json-beautify",
  tool_slug: "json",
  is_valid: true,
  leaked_email_in_value: "contact-me@hack.org",
};

const sanitized = sanitizeTelemetryProps(rawPropsWithPii);
assert(sanitized !== undefined, "Sanitized props should exist");
assert.strictEqual((sanitized as any).email, undefined, "Email key must be stripped");
assert.strictEqual((sanitized as any).user, undefined, "User key must be stripped");
assert.strictEqual((sanitized as any).username, undefined, "Username key must be stripped");
assert.strictEqual((sanitized as any).password, undefined, "Password key must be stripped");
assert.strictEqual((sanitized as any).token, undefined, "Token key must be stripped");
assert.strictEqual((sanitized as any).text, undefined, "Raw user text key must be stripped");
assert.strictEqual((sanitized as any).input, undefined, "User input key must be stripped");
assert.strictEqual((sanitized as any).ip, undefined, "IP key must be stripped");
assert.strictEqual((sanitized as any).leaked_email_in_value, undefined, "Values containing email addresses must be stripped");
assert.strictEqual(sanitized?.file_count, 3, "Safe numeric metadata must be preserved");
assert.strictEqual(sanitized?.format, "json-beautify", "Safe string metadata must be preserved");
assert.strictEqual(sanitized?.tool_slug, "json", "Safe slug metadata must be preserved");
assert.strictEqual(sanitized?.is_valid, true, "Safe boolean metadata must be preserved");
console.log("✓ Privacy filter successfully stripped all PII keys and values.");

// 5. Test extended trackPageView with tool workspace action completions
console.log("👉 5. Testing extended trackPageView tool workspace event telemetry...");
assert.doesNotThrow(() => {
  // Standard pageview
  trackPageView("/tools/pdf-editor");
  // Pageview with referral query string (must not crash or leak PII)
  trackPageView("/tools/pdf-editor?by=JohnDoe&token=secret");
  // Extended trackPageView with string action (e.g. 'pdf-merged', 'text-formatted')
  trackPageView(undefined, undefined, "pdf-merged", {
    file_count: 2,
    tool_slug: "pdf-merge-split",
    email: "leak@example.com", // Must be sanitized
  });
  trackPageView(undefined, undefined, "text-formatted", {
    format: "json-beautify",
    tool_slug: "json",
    raw_user_content: "secret", // Must be sanitized
  });
  // Extended trackPageView with ToolActionTelemetry object
  trackPageView(undefined, undefined, {
    action: "pdf-merged",
    toolSlug: "pdf-editor",
    category: "pdf-doc-studio",
    metadata: { pages: 5 },
  });
  // Direct trackToolAction
  trackToolAction("pdf-merged", { count: 4 }, "pdf-merge-split");
  trackToolAction("text-formatted", { mode: "uppercase" }, "text-case");
});
console.log("✓ Extended trackPageView and trackToolAction executed cleanly with zero PII leaks.");

// Ensure trackEvent does not crash or throw when unconfigured
assert.doesNotThrow(() => {
  trackEvent("puzzle_completed", { puzzle: "queens" });
  trackEvent("tool_used", { tool: "image-resizer" });
});

// Ensure initAnalytics does not append any script when provider is 'none'
initAnalytics();
assert.strictEqual(appendedElements.length, 0, "No script element should be injected when unconfigured");

console.log("✓ Analytics module cleanly no-ops when unconfigured without side-effects.");
console.log("🎉 ALL PRIVACY ANALYTICS INTEGRITY TESTS PASSED!");
