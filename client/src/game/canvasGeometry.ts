/**
 * Common 2D game coordinate helpers.
 * Game logic and pointer events use CSS pixels, while bitmap backing stores use device pixels.
 * Keeping them separate prevents high-DPI camera/aim offsets and canvas stretching.
 */
export function logicalCanvasSize(
  bitmapWidth: number,
  bitmapHeight: number,
  cssWidth: number,
  cssHeight: number,
): { width: number; height: number } {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : bitmapWidth;
  const height = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : bitmapHeight;
  return { width: Math.max(1, width), height: Math.max(1, height) };
}

export function canvasBackingSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): { width: number; height: number; scale: number } {
  const { width, height } = logicalCanvasSize(cssWidth, cssHeight, cssWidth, cssHeight);
  const scale = Number.isFinite(devicePixelRatio)
    ? Math.min(2, Math.max(1, devicePixelRatio))
    : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

export function pointerToCanvas(
  clientX: number,
  clientY: number,
  canvasLeft: number,
  canvasTop: number,
): { x: number; y: number } {
  return { x: clientX - canvasLeft, y: clientY - canvasTop };
}

export function survivPointerToWorld(
  clientX: number,
  clientY: number,
  canvasLeft: number,
  canvasTop: number,
  viewportWidth: number,
  viewportHeight: number,
  playerX: number,
  playerY: number,
  zoom: number,
): { x: number; y: number } {
  const point = pointerToCanvas(clientX, clientY, canvasLeft, canvasTop);
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return {
    x: playerX + (point.x - viewportWidth / 2) / safeZoom,
    y: playerY + (point.y - viewportHeight / 2) / safeZoom,
  };
}
