export type CanvasImageMime = "image/png" | "image/jpeg" | "image/webp";

/**
 * Some browsers silently fall back to PNG if the requested canvas encoding is
 * unavailable. Never label the fallback as JPEG/WebP or offer a misleading download.
 */
export function assertCanvasImageEncoding(blob: Blob, requested: CanvasImageMime): Blob {
  if (!blob || blob.size === 0) {
    throw new Error("The browser returned an empty image. No file was exported.");
  }
  const actual = blob.type.toLowerCase().split(";")[0].trim();
  if (actual !== requested) {
    const label = requested === "image/webp" ? "WebP" : requested === "image/jpeg" ? "JPG" : "PNG";
    throw new Error(`The browser could not encode ${label} correctly (returned ${actual || "an unknown format"}). Choose another export format.`);
  }
  return blob;
}
