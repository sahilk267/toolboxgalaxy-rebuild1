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
 * Tracks single-page application (SPA) pageviews for Google Analytics and active providers.
 */
export function trackPageView(path?: string, title?: string): void {
  if (typeof window === "undefined") return;
  const pagePath = path || window.location.pathname + window.location.search;
  const pageTitle = title || document.title;

  try {
    if (typeof window.gtag === "function") {
      const config = getAnalyticsConfig();
      if (config.measurementId) {
        window.gtag("config", config.measurementId, {
          page_path: pagePath,
          page_title: pageTitle,
          page_location: window.location.href,
        });
      }
    }
  } catch {
    // Analytics failures must never crash application logic
  }
}

/**
 * Safely tracks custom events (e.g., tool run, puzzle completion, share click).
 * Cleanly no-ops if analytics is unconfigured, disabled, or blocked.
 */
export function trackEvent(eventName: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, props);
    }
    if (typeof window.plausible === "function") {
      window.plausible(eventName, props ? { props } : undefined);
    } else if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(eventName, props);
    }
  } catch {
    // Analytics failures must never crash application logic
  }
}
