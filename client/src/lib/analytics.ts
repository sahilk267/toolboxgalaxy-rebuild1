// Orbital Workbench: Analytics integration supporting Google Analytics (GA4), with Plausible / Umami fallbacks.
// Clean no-op when no analytics measurement ID is configured.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

export type AnalyticsProvider = "google" | "plausible" | "umami" | "none";

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  measurementId?: string; // Google Analytics GA4 (e.g. G-XXXXXXXXXX)
  domain?: string;
  apiHost?: string;
  websiteId?: string;
  src?: string;
  respectDNT: boolean;
}

function getEnv(key: string): string | undefined {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && typeof import.meta.env[key] === "string") {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== "undefined" && process.env && typeof process.env[key] === "string") {
      return process.env[key];
    }
  } catch {}
  return undefined;
}

/**
 * Resolves analytics configuration from environment variables.
 * Priority: Google Analytics (GA4) -> Plausible -> Umami -> None (clean no-op).
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const gaMeasurementId =
    getEnv("VITE_GA_MEASUREMENT_ID") ||
    getEnv("VITE_GOOGLE_ANALYTICS_ID") ||
    getEnv("VITE_GTAG_ID");

  if (gaMeasurementId && gaMeasurementId.trim() !== "") {
    return {
      provider: "google",
      measurementId: gaMeasurementId.trim(),
      respectDNT: false, // Standard GA4 measurement
    };
  }

  const plausibleDomain = getEnv("VITE_PLAUSIBLE_DOMAIN") || getEnv("VITE_ANALYTICS_DOMAIN");
  const plausibleApiHost = getEnv("VITE_PLAUSIBLE_API_HOST") || "https://plausible.io";

  if (plausibleDomain && plausibleDomain.trim() !== "") {
    return {
      provider: "plausible",
      domain: plausibleDomain.trim(),
      apiHost: plausibleApiHost.trim(),
      respectDNT: true,
    };
  }

  const umamiWebsiteId = getEnv("VITE_UMAMI_WEBSITE_ID");
  const umamiSrc = getEnv("VITE_UMAMI_SRC") || "https://cloud.umami.is/script.js";

  if (umamiWebsiteId && umamiWebsiteId.trim() !== "") {
    return {
      provider: "umami",
      websiteId: umamiWebsiteId.trim(),
      src: umamiSrc.trim(),
      respectDNT: true,
    };
  }

  return {
    provider: "none",
    respectDNT: true,
  };
}

/**
 * Checks if the visitor has enabled "Do Not Track" in their browser.
 */
export function isDoNotTrackEnabled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    navigator.doNotTrack === "1" ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1" ||
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack === "1"
  );
}

let isInitialized = false;

/**
 * Initializes analytics script if configured.
 * Safe to call multiple times (idempotent).
 */
export function initAnalytics(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (isInitialized) return;

  const config = getAnalyticsConfig();

  // Clean no-op if unconfigured
  if (config.provider === "none") {
    return;
  }

  // Respect visitor's explicit privacy preference for privacy-first providers
  if (config.respectDNT && isDoNotTrackEnabled()) {
    try {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
        console.info("[Analytics] Do Not Track is enabled; analytics disabled.");
      }
    } catch {}
    return;
  }

  isInitialized = true;

  if (config.provider === "google" && config.measurementId) {
    const existing = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    if (!existing) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
      window.gtag("js", new Date());
      // Initialize with SPA pageview tracking handled explicitly by the router
      window.gtag("config", config.measurementId, {
        send_page_view: true,
      });

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
      document.head.appendChild(script);
    }
  } else if (config.provider === "plausible" && config.domain) {
    const existing = document.querySelector("script[data-domain]");
    if (!existing) {
      const script = document.createElement("script");
      script.defer = true;
      script.dataset.domain = config.domain;
      const host = config.apiHost?.replace(/\/+$/, "") || "https://plausible.io";
      script.src = `${host}/js/script.js`;
      document.head.appendChild(script);
    }
  } else if (config.provider === "umami" && config.websiteId) {
    const existing = document.querySelector("script[data-website-id]");
    if (!existing) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = config.src || "https://cloud.umami.is/script.js";
      script.dataset.websiteId = config.websiteId;
      document.head.appendChild(script);
    }
  }
}

/**
 * Blocklist of property keys that could contain personally identifiable information (PII).
 */
const PII_KEY_REGEX = /^(email|user|username|name|token|key|password|secret|auth|phone|ip|address|ssn|content|text|input|raw|prompt|query|href|url)$/i;

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const JWT_PATTERN = /ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;
const PHONE_PATTERN = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/;

/**
 * Sanitizes telemetry properties to strictly eliminate user-identifiable data (PII).
 * Strips blocked keys, email addresses, tokens, and raw user input text.
 */
export function sanitizeTelemetryProps(
  props?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
  if (!props || typeof props !== "object") return undefined;

  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(props)) {
    if (PII_KEY_REGEX.test(key)) {
      continue;
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        sanitized[key] = value;
      }
    } else if (typeof value === "boolean") {
      sanitized[key] = value;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      if (
        trimmed.length > 0 &&
        trimmed.length <= 64 &&
        !EMAIL_PATTERN.test(trimmed) &&
        !JWT_PATTERN.test(trimmed) &&
        !PHONE_PATTERN.test(trimmed)
      ) {
        sanitized[key] = trimmed;
      }
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export interface ToolActionTelemetry {
  action: string;
  toolSlug?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Sends event-based telemetry when a user completes an action in a tool workspace.
 * Strictly maintains privacy by stripping all personally identifiable data (PII).
 */
export function trackToolAction(
  action: string,
  metadata?: Record<string, unknown>,
  toolSlug?: string
): void {
  if (typeof window === "undefined" || !action) return;

  const normalizedAction = action.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  const payload: Record<string, string | number | boolean> = {};

  if (toolSlug) {
    const safeSlug = toolSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 48);
    if (safeSlug) {
      payload.tool_slug = safeSlug;
    }
  }

  const safeProps = sanitizeTelemetryProps(metadata);
  if (safeProps) {
    Object.assign(payload, safeProps);
  }

  trackEvent(normalizedAction, Object.keys(payload).length > 0 ? payload : undefined);
}

/**
 * Tracks single-page application (SPA) pageviews for Google Analytics and active providers.
 * Extended to dispatch event-based telemetry when an action completion is provided,
 * while strictly maintaining privacy by avoiding user-identifiable data.
 */
export function trackPageView(
  path?: string,
  title?: string,
  toolAction?: string | ToolActionTelemetry,
  actionMetadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const rawPath = path || (window.location && window.location.pathname ? window.location.pathname : "/");
  // Ensure query strings and hashes containing user names or referral tokens are stripped
  const pagePath = rawPath.split(/[?#]/)[0] || "/";
  const pageTitle = title || (typeof document !== "undefined" && document.title ? document.title : "Toolbox Galaxy");

  try {
    if (typeof window.gtag === "function") {
      const config = getAnalyticsConfig();
      if (config.measurementId) {
        const origin = window.location && window.location.origin ? window.location.origin : "";
        window.gtag("config", config.measurementId, {
          page_path: pagePath,
          page_title: pageTitle,
          page_location: origin ? `${origin}${pagePath}` : pagePath,
        });
      }
    }
    if (typeof window.plausible === "function") {
      window.plausible("pageview", {
        props: {
          path: pagePath,
        },
      });
    }
  } catch {
    // Analytics failures must never crash application logic
  }

  // Handle extended event-based telemetry for tool workspace action completion
  if (toolAction) {
    if (typeof toolAction === "string") {
      trackToolAction(toolAction, actionMetadata);
    } else if (typeof toolAction === "object" && toolAction.action) {
      const mergedMetadata = {
        ...(toolAction.category ? { category: toolAction.category } : {}),
        ...(toolAction.metadata || {}),
      };
      trackToolAction(toolAction.action, mergedMetadata, toolAction.toolSlug);
    }
  }
}

/**
 * Safely tracks custom events (e.g., tool run, puzzle completion, share click).
 * Sanitizes all properties through a privacy filter to guarantee zero PII leakage.
 * Cleanly no-ops if analytics is unconfigured, disabled, or blocked.
 */
export function trackEvent(eventName: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !eventName) return;

  const safeProps = sanitizeTelemetryProps(props);

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, safeProps);
    }
    if (typeof window.plausible === "function") {
      window.plausible(eventName, safeProps ? { props: safeProps } : undefined);
    } else if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(eventName, safeProps);
    }
  } catch {
    // Analytics failures must never crash application logic
  }
}
