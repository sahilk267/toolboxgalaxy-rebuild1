export type ImagesPdfPageSize = "a4" | "letter" | "fit";
export type ImagesPdfOrientation = "portrait" | "landscape";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_EDGE = 8192;
const MAX_IMAGE_PIXELS = 20_000_000;

export function imagesPdfFileError(file: Pick<File, "type" | "size">): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return "Choose a PNG, JPEG or WebP image.";
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return "Choose a nonempty image of 20 MB or less.";
  }
  return null;
}

export function imagesPdfDimensionError(width: number, height: number): string | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) {
    return "Image dimensions must be within 1 to 8,192 pixels per side.";
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    return "Image exceeds 20 million pixels; choose a smaller image.";
  }
  return null;
}

export type ImagesPdfPlacement = {
  pageWidth: number; pageHeight: number;
  x: number; y: number; width: number; height: number;
};

export function imagesPdfPlacement(
  imageWidth: number, imageHeight: number,
  pageSize: ImagesPdfPageSize, orientation: ImagesPdfOrientation, margin: number,
): ImagesPdfPlacement {
  const invalid = imagesPdfDimensionError(imageWidth, imageHeight);
  if (invalid) throw new Error(invalid);
  if (!Number.isFinite(margin) || margin < 0 || margin > 50) {
    throw new Error("PDF margin must be between 0 and 50 points.");
  }
  if (!["a4", "letter", "fit"].includes(pageSize) ||
      !["portrait", "landscape"].includes(orientation)) {
    throw new Error("Unsupported PDF page setting.");
  }
  let pageWidth = pageSize === "letter" ? 612 : 595.28;
  let pageHeight = pageSize === "letter" ? 792 : 841.89;
  if (pageSize === "fit") {
    pageWidth = imageWidth + margin * 2;
    pageHeight = imageHeight + margin * 2;
  } else if (orientation === "landscape") {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const scale = Math.min(usableWidth / imageWidth, usableHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    pageWidth, pageHeight,
    x: margin + (usableWidth - width) / 2,
    y: margin + (usableHeight - height) / 2,
    width, height,
  };
}
