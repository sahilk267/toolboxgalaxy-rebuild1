/** Browser-only background-removal input/output constraints. */
export const BACKGROUND_MAX_BYTES = 10 * 1024 * 1024;
export const BACKGROUND_MAX_EDGE = 8192;
export const BACKGROUND_MAX_PIXELS = 8_000_000;
export const BACKGROUND_ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export type BackgroundFill = "transparent" | "white" | "black" | "custom";

export function validateBackgroundFile(file: Pick<File, "size" | "type">): string | null {
  if (!BACKGROUND_ALLOWED_MIMES.includes(file.type as typeof BACKGROUND_ALLOWED_MIMES[number])) {
    return "Choose a JPG, PNG, or WebP image. SVG, GIF, and HEIC are not supported.";
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > BACKGROUND_MAX_BYTES) {
    return "Choose a non-empty image up to 10 MB.";
  }
  return null;
}

export function validateBackgroundDimensions(width: number, height: number): string | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > BACKGROUND_MAX_EDGE || height > BACKGROUND_MAX_EDGE ||
      width * height > BACKGROUND_MAX_PIXELS) {
    return "Image dimensions must be within 8,192 px per edge and 8 megapixels total.";
  }
  return null;
}

export function safeHexColor(value: string): string | null {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

export function backgroundFileName(name: string): string {
  const basename = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 65);
  return `${basename || "image"}-no-background.png`;
}
