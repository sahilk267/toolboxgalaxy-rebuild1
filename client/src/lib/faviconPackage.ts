/** Pure ICO and manifest helpers. PNG-compressed ICO frames are supported by modern browsers/Windows. */
export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;
export const FAVICON_MAX_BYTES = 5 * 1024 * 1024;
export const FAVICON_MAX_PIXELS = 20_000_000;

export function faviconFileError(type: string, size: number, width?: number, height?: number): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(type)) return "Choose a PNG, JPG or WebP file.";
  if (!Number.isFinite(size) || size <= 0 || size > FAVICON_MAX_BYTES)
    return "Choose an image smaller than 5 MB.";
  if (width !== undefined || height !== undefined) {
    if (width === undefined || height === undefined || !Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
        width <= 0 || height <= 0 || width * height > FAVICON_MAX_PIXELS)
      return "Image dimensions exceed the 20-megapixel safety limit.";
  }
  return null;
}

export function assertPngSize(bytes: Uint8Array, expected: number): void {
  if (bytes.byteLength < 33) throw new Error("PNG data is incomplete.");
  const signature = [137,80,78,71,13,10,26,10];
  if (signature.some((byte, i) => bytes[i] !== byte)) throw new Error("Expected a PNG image.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(12) !== 0x49484452) throw new Error("Missing PNG IHDR header.");
  if (view.getUint32(16) !== expected || view.getUint32(20) !== expected)
    throw new Error("PNG dimensions do not match favicon frame.");
}

export function encodePngIco(frames: readonly { size: 16 | 32 | 48; png: Uint8Array }[]): Uint8Array {
  if (!frames.length || frames.length > 3 || new Set(frames.map(f => f.size)).size !== frames.length)
    throw new Error("ICO requires one to three distinct PNG frames.");
  for (const frame of frames) assertPngSize(frame.png, frame.size);
  const headerLength = 6 + 16 * frames.length;
  const output = new Uint8Array(headerLength + frames.reduce((n, f) => n + f.png.length, 0));
  const view = new DataView(output.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, frames.length, true);
  let offset = headerLength;
  frames.forEach((frame, i) => {
    const entry = 6 + 16 * i;
    output[entry] = frame.size;
    output[entry + 1] = frame.size;
    view.setUint16(entry + 4, 1, true); // color planes
    view.setUint16(entry + 6, 32, true); // bit depth
    view.setUint32(entry + 8, frame.png.length, true);
    view.setUint32(entry + 12, offset, true);
    output.set(frame.png, offset);
    offset += frame.png.length;
  });
  return output;
}

export function faviconManifest(appName: string, themeColor: string): string {
  const name = appName.trim().slice(0, 80) || "My Website";
  if (!/^#[0-9a-f]{6}$/i.test(themeColor)) throw new Error("Theme color must be a six-digit HEX value.");
  return JSON.stringify({
    name,
    short_name: name.slice(0, 24),
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    theme_color: themeColor,
    background_color: themeColor,
    display: "standalone",
  }, null, 2);
}

export function faviconHtmlSnippet(): string {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32">',
    '<link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">',
    '<link rel="manifest" href="/site.webmanifest">',
  ].join("\n");
}
