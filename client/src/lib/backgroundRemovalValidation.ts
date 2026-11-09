/** Strict limits for CPU/WASM background removal. Images never leave the browser. */
export const BACKGROUND_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxPixels: 8_000_000,
  maxSide: 8_192,
  inferenceSide: 1_024,
} as const;

export type PixelSize = { width: number; height: number };
export type BackgroundMode = "transparent" | "white" | "black" | "custom";

const ACCEPTED = new Set(["image/png", "image/jpeg", "image/webp"]);

export function backgroundFileError(type: string, size: number): string | null {
  if (!ACCEPTED.has(type)) return "Choose a JPG, PNG or WebP image. SVG, GIF and HEIC are not supported.";
  if (!Number.isFinite(size) || size < 1 || size > BACKGROUND_LIMITS.maxBytes)
    return "Choose a non-empty image smaller than 10 MB.";
  return null;
}

export function backgroundDimensionError({ width, height }: PixelSize): string | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1)
    return "Invalid image dimensions.";
  if (width > BACKGROUND_LIMITS.maxSide || height > BACKGROUND_LIMITS.maxSide ||
      width * height > BACKGROUND_LIMITS.maxPixels)
    return "Image exceeds the 8 MP / 8192 px safety limit. Resize it first.";
  return null;
}

export function inferenceSize({ width, height }: PixelSize): PixelSize {
  const error = backgroundDimensionError({ width, height });
  if (error) throw new Error(error);
  const factor = Math.min(1, BACKGROUND_LIMITS.inferenceSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

export function safeOutputFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[.-]+/, "").slice(0, 70) || "image";
  return base + "-no-background.png";
}

export function validHexColor(value: string): boolean {
  return /^#[a-fA-F0-9]{6}$/.test(value);
}
