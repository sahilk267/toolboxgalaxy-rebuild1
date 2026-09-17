export type CropWindow = { x: number; y: number; width: number; height: number };
export type ImageDimensions = { width: number; height: number };
export type ImageOutputFormat = "image/png" | "image/jpeg" | "image/webp";

export const imageTransformLimits = { maxBytes: 20 * 1024 * 1024, maxEdge: 8192, maxPixels: 20_000_000 } as const;

const whole = (value: number) => Math.floor(Number.isFinite(value) ? value : 0);
export function cropWithinSource(source: ImageDimensions, crop: CropWindow): CropWindow {
  const x = Math.max(0, Math.min(whole(crop.x), Math.max(0, source.width - 1))); const y = Math.max(0, Math.min(whole(crop.y), Math.max(0, source.height - 1)));
  return { x, y, width: Math.max(1, Math.min(whole(crop.width), source.width - x)), height: Math.max(1, Math.min(whole(crop.height), source.height - y)) };
}

export function outputDimensions(crop: CropWindow, quarterTurns: number): ImageDimensions { const turns = ((quarterTurns % 4) + 4) % 4; return turns % 2 ? { width: crop.height, height: crop.width } : { width: crop.width, height: crop.height }; }
export function nextQuarterTurn(current: number, direction: -1 | 1) { return ((current + direction) % 4 + 4) % 4; }
export function formatExtension(format: ImageOutputFormat) { return format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp"; }
export function imageFileError(file: File) { if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return "Choose a PNG, JPG, or WebP image. Animated and SVG files are not included in this editor."; if (file.size > imageTransformLimits.maxBytes) return "Choose an image smaller than 20 MB for a responsive local edit."; return ""; }
export function sourceDimensionError(dimensions: ImageDimensions) { if (dimensions.width > imageTransformLimits.maxEdge || dimensions.height > imageTransformLimits.maxEdge) return "Choose an image no larger than 8,192 pixels on either edge."; if (dimensions.width * dimensions.height > imageTransformLimits.maxPixels) return "Choose an image with 20 million pixels or fewer for this browser-local editor."; return ""; }
