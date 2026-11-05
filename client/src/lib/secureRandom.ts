/**
 * Cryptographically secure random integer and sampling utilities
 * Rejection sampling eliminates modulo bias across the entire uint32 domain.
 */

export function secureRandomInt(min: number, max: number): number {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max
  ) {
    throw new Error("Invalid integer bounds.");
  }

  const range = max - min + 1;
  const space = 0x100000000; // 2^32

  if (!Number.isSafeInteger(range) || range < 1 || range > space) {
    throw new Error("Unsupported range size.");
  }

  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    throw new Error("Secure randomness is unavailable.");
  }

  // If range === space (e.g. min = 0, max = 0xFFFFFFFF), limit = space, so every 32-bit sample is accepted
  const limit = range === space ? space : Math.floor(space / range) * range;
  const buffer = new Uint32Array(1);

  let sample: number;
  do {
    cryptoObj.getRandomValues(buffer);
    sample = buffer[0];
  } while (sample >= limit);

  return min + (sample % range);
}

export function generateUniqueRandomInts(
  min: number,
  max: number,
  count: number
): number[] {
  if (count <= 0) return [];
  const range = max - min + 1;
  if (count > range) {
    throw new Error(`Cannot generate ${count} unique numbers from a range of ${range}.`);
  }

  // If count is a large fraction of range (> 50%) and range is small/moderate, use Fisher-Yates shuffle
  if (range <= 10000 && count > range * 0.5) {
    const all = Array.from({ length: range }, (_, i) => min + i);
    for (let i = all.length - 1; i > 0; i--) {
      const j = secureRandomInt(0, i);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, count);
  }

  const set = new Set<number>();
  while (set.size < count) {
    set.add(secureRandomInt(min, max));
  }
  return Array.from(set);
}

export function generateRandomDecimals(
  min: number,
  max: number,
  count: number,
  precision: number,
  unique: boolean = false
): number[] {
  if (count <= 0) return [];
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error("Invalid decimal bounds.");
  }
  if (!Number.isInteger(precision) || precision < 0 || precision > 10) {
    throw new Error("Precision must be an integer between 0 and 10.");
  }
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const factor = 10 ** precision;

  const minStep = Math.ceil(lower * factor - 1e-9);
  const maxStep = Math.floor(upper * factor + 1e-9);

  if (
    !Number.isSafeInteger(minStep) ||
    !Number.isSafeInteger(maxStep) ||
    minStep > maxStep
  ) {
    throw new Error("No valid values exist at this precision.");
  }

  const totalDomain = maxStep - minStep + 1;
  if (unique && count > totalDomain) {
    throw new Error(
      `Requested ${count} unique decimals, but only ${totalDomain} discrete values exist at precision ${precision}.`
    );
  }

  const steps = unique
    ? generateUniqueRandomInts(minStep, maxStep, count)
    : Array.from({ length: count }, () => secureRandomInt(minStep, maxStep));

  return steps.map((n) => Number((n / factor).toFixed(precision)));
}

export function generateUniqueDecimals(
  min: number,
  max: number,
  count: number,
  precision: number
): number[] {
  return generateRandomDecimals(min, max, count, precision, true);
}

