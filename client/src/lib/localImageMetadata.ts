export type MetadataImageFormat = "image/png" | "image/jpeg" | "image/webp";
export const imageMetadataLimits = { maxBytes: 20 * 1024 * 1024, maxEdge: 8192, maxPixels: 20_000_000 } as const;
const accepted: MetadataImageFormat[] = ["image/png", "image/jpeg", "image/webp"];

export const metadataFormatLabel = (format: MetadataImageFormat) => format === "image/jpeg" ? "JPG" : format === "image/webp" ? "WebP" : "PNG";
export const metadataFormatExtension = (format: MetadataImageFormat) => format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
export function metadataFileError(file: Pick<File, "type" | "size">): string | null { if (!accepted.includes(file.type as MetadataImageFormat)) return "Choose a PNG, JPG, or WebP still image. GIF, SVG, and other formats are not supported by this clean re-export."; if (file.size > imageMetadataLimits.maxBytes) return "Choose an image smaller than 20 MB for this browser-local re-export."; return null; }
export function metadataDimensionError(size: { width: number; height: number }): string | null { if (!Number.isInteger(size.width) || !Number.isInteger(size.height) || size.width < 1 || size.height < 1) return "This image has invalid decoded dimensions."; if (size.width > imageMetadataLimits.maxEdge || size.height > imageMetadataLimits.maxEdge) return "Choose an image no wider or taller than 8,192 pixels."; if (size.width * size.height > imageMetadataLimits.maxPixels) return "Choose an image with no more than 20 million decoded pixels."; return null; }
