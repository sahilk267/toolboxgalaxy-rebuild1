import * as pdfjsLib from "pdfjs-dist";

let isConfigured = false;
let activeBlobUrl: string | null = null;

// Official version-matched high-availability CDN worker (guaranteed application/javascript MIME type)
const CDN_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || "6.4.299"}/build/pdf.worker.min.mjs`;

/**
 * Initializes and configures pdfjsLib.GlobalWorkerOptions.workerSrc
 * with multi-layer fallback resilience:
 * 1. Immediate CDN Worker URL (immune to Hostinger/Apache/LiteSpeed MIME misconfigurations)
 * 2. Background In-Memory application/javascript Blob URL (immune to server headers and works 100% offline)
 * 3. Never loads unverified .mjs files directly from same-origin without Blob conversion
 */
export function ensurePdfWorkerConfigured(): void {
  if (typeof window === "undefined") return;
  if (isConfigured && pdfjsLib.GlobalWorkerOptions.workerSrc) return;

  try {
    // 1. Immediately point to CDN worker. JSDelivr always returns Content-Type: application/javascript; charset=utf-8
    // with CORS headers, bypassing Hostinger LiteSpeed/Apache .mjs text/plain bugs completely.
    pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER_URL;
    isConfigured = true;

    // 2. Pre-fetch local worker script text and wrap in an in-memory application/javascript Blob URL
    // for seamless offline PWA execution without relying on web server MIME negotiation.
    if (!activeBlobUrl) {
      const origin = window.location.origin;
      const localWorkerJs = new URL("/pdf.worker.min.js", origin).href;

      fetch(localWorkerJs)
        .then((res) => {
          if (!res.ok) throw new Error("Local worker fetch status: " + res.status);
          return res.text();
        })
        .then((code) => {
          if (code && code.length > 500) {
            const blob = new Blob([code], { type: "application/javascript" });
            const blobUrl = URL.createObjectURL(blob);
            activeBlobUrl = blobUrl;
            pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
          }
        })
        .catch(() => {
          // If local worker is unreachable or 404, CDN worker remains active
        });
    }
  } catch (err) {
    console.warn("PDF worker configuration notice:", err);
  }
}

// Auto-run on module import in browser
if (typeof window !== "undefined") {
  ensurePdfWorkerConfigured();
}
