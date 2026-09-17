// Orbital Workbench: Pure client-side binary EXIF & GPS parser.
// Inspects JPEG / TIFF byte headers in local browser memory with zero network requests.

export interface ExifTagSummary {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  lensModel?: string;
  focalLength?: string;
  fNumber?: string;
  iso?: string;
  exposureTime?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    latDms: string;
    lonDms: string;
  };
  rawTagCount: number;
}

export async function parseExifFromBlob(blob: Blob): Promise<ExifTagSummary | null> {
  try {
    const buffer = await blob.slice(0, 128 * 1024).arrayBuffer(); // First 128 KB is plenty for headers
    const view = new DataView(buffer);

    // Check for JPEG SOI marker (0xFFD8)
    if (view.getUint16(0, false) !== 0xFFD8) {
      return null;
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint8(offset) !== 0xFF) {
        break;
      }

      const marker = view.getUint8(offset + 1);

      // APP1 Marker is 0xFFE1
      if (marker === 0xE1) {
        const app1Length = view.getUint16(offset + 2, false);
        const exifHeader = view.getUint32(offset + 4, false);

        // Check for 'Exif\0\0' (0x45786966 followed by 0x0000)
        if (exifHeader === 0x45786966 && view.getUint16(offset + 8, false) === 0x0000) {
          return parseTiffHeader(view, offset + 10, app1Length - 8);
        }
      }

      // Next marker
      const sectionLength = view.getUint16(offset + 2, false);
      offset += 2 + sectionLength;
    }

    return null;
  } catch (e) {
    console.warn("EXIF parse warning:", e);
    return null;
  }
}

function parseTiffHeader(view: DataView, tiffStart: number, maxBytes: number): ExifTagSummary {
  const result: ExifTagSummary = { rawTagCount: 0 };
  const endianMarker = view.getUint16(tiffStart, false);
  const littleEndian = endianMarker === 0x4949; // 'II' is little endian, 'MM' is big endian

  if (endianMarker !== 0x4949 && endianMarker !== 0x4D4D) {
    return result;
  }

  // Forty-two check (0x002A)
  if (view.getUint16(tiffStart + 2, littleEndian) !== 0x002A) {
    return result;
  }

  const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
  let exifSubIfdOffset: number | null = null;
  let gpsSubIfdOffset: number | null = null;

  function readString(offset: number, count: number): string {
    let str = "";
    for (let i = 0; i < count; i++) {
      const code = view.getUint8(tiffStart + offset + i);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str.trim();
  }

  function readRational(offset: number): number {
    const num = view.getUint32(tiffStart + offset, littleEndian);
    const den = view.getUint32(tiffStart + offset + 4, littleEndian);
    return den === 0 ? 0 : num / den;
  }

  // Parse IFD
  function parseIfd(offset: number, isGps = false, isExifSub = false) {
    if (offset + 2 > maxBytes) return;
    const entries = view.getUint16(tiffStart + offset, littleEndian);
    result.rawTagCount += entries;

    let pos = offset + 2;
    for (let i = 0; i < entries; i++) {
      if (pos + 12 > maxBytes) break;

      const tag = view.getUint16(tiffStart + pos, littleEndian);
      const type = view.getUint16(tiffStart + pos + 2, littleEndian);
      const count = view.getUint32(tiffStart + pos + 4, littleEndian);
      const valueOffset = count <= 4 && (type === 1 || type === 2 || type === 3)
        ? pos + 8
        : view.getUint32(tiffStart + pos + 8, littleEndian);

      if (!isGps && !isExifSub) {
        if (tag === 0x010F) result.make = readString(valueOffset, count);
        else if (tag === 0x0110) result.model = readString(valueOffset, count);
        else if (tag === 0x0131) result.software = readString(valueOffset, count);
        else if (tag === 0x0132) result.dateTime = readString(valueOffset, count);
        else if (tag === 0x8769) exifSubIfdOffset = valueOffset;
        else if (tag === 0x8825) gpsSubIfdOffset = valueOffset;
      } else if (isExifSub) {
        if (tag === 0xA434) result.lensModel = readString(valueOffset, count);
        else if (tag === 0x9003 && !result.dateTime) result.dateTime = readString(valueOffset, count);
        else if (tag === 0x8827) result.iso = `ISO ${view.getUint16(tiffStart + pos + 8, littleEndian)}`;
        else if (tag === 0x829D) {
          const fn = readRational(valueOffset);
          if (fn) result.fNumber = `f/${fn.toFixed(1)}`;
        } else if (tag === 0x920A) {
          const fl = readRational(valueOffset);
          if (fl) result.focalLength = `${fl.toFixed(1)} mm`;
        } else if (tag === 0x829A) {
          const num = view.getUint32(tiffStart + valueOffset, littleEndian);
          const den = view.getUint32(tiffStart + valueOffset + 4, littleEndian);
          if (num && den) {
            result.exposureTime = num >= den ? `${(num / den).toFixed(1)}s` : `1/${Math.round(den / num)}s`;
          }
        }
      }

      pos += 12;
    }
  }

  // Parse IFD0
  parseIfd(ifd0Offset);

  // Parse SubIFD
  if (exifSubIfdOffset !== null) {
    parseIfd(exifSubIfdOffset, false, true);
  }

  // Parse GPS
  if (gpsSubIfdOffset !== null) {
    const gpsEntries = view.getUint16(tiffStart + gpsSubIfdOffset, littleEndian);
    let latRef = "N";
    let lonRef = "W";
    let latParts: number[] = [];
    let lonParts: number[] = [];
    let altitude: number | undefined;

    let pos = gpsSubIfdOffset + 2;
    for (let i = 0; i < gpsEntries; i++) {
      if (pos + 12 > maxBytes) break;
      const tag = view.getUint16(tiffStart + pos, littleEndian);
      const valOffset = view.getUint32(tiffStart + pos + 8, littleEndian);

      if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(tiffStart + pos + 8));
      else if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(tiffStart + pos + 8));
      else if (tag === 0x0002) {
        latParts = [
          readRational(valOffset),
          readRational(valOffset + 8),
          readRational(valOffset + 16)
        ];
      } else if (tag === 0x0004) {
        lonParts = [
          readRational(valOffset),
          readRational(valOffset + 8),
          readRational(valOffset + 16)
        ];
      } else if (tag === 0x0006) {
        altitude = readRational(valOffset);
      }

      pos += 12;
    }

    if (latParts.length === 3 && lonParts.length === 3) {
      let lat = latParts[0] + latParts[1] / 60 + latParts[2] / 3600;
      if (latRef === "S") lat = -lat;

      let lon = lonParts[0] + lonParts[1] / 60 + lonParts[2] / 3600;
      if (lonRef === "W") lon = -lon;

      result.gps = {
        latitude: lat,
        longitude: lon,
        altitude,
        latDms: `${latParts[0]}° ${latParts[1]}' ${latParts[2].toFixed(1)}" ${latRef}`,
        lonDms: `${lonParts[0]}° ${lonParts[1]}' ${lonParts[2].toFixed(1)}" ${lonRef}`
      };
    }
  }

  return result;
}
