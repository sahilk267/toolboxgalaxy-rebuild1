export interface CollisionPoint3D { x: number; y: number; z: number }

/**
 * Exact ray / axis-aligned-box intersection using the slab method.
 * Unlike epsilon-substituted division, a parallel ray outside any slab
 * cannot hit, and a ray starting inside the box exits at a positive distance.
 * The direction is expected to be normalized by the calling game engine.
 */
export function rayAabbDistance(
  origin: CollisionPoint3D,
  direction: CollisionPoint3D,
  min: CollisionPoint3D,
  max: CollisionPoint3D,
): number | null {
  let entry = -Infinity;
  let exit = Infinity;
  let hasDirection = false;
  for (const axis of ["x", "y", "z"] as const) {
    const o = origin[axis];
    const d = direction[axis];
    const lo = min[axis];
    const hi = max[axis];
    if (![o, d, lo, hi].every(Number.isFinite) || lo > hi) return null;
    if (Math.abs(d) <= 1e-12) {
      if (o < lo || o > hi) return null;
      continue;
    }
    hasDirection = true;
    let a = (lo - o) / d;
    let b = (hi - o) / d;
    if (a > b) [a, b] = [b, a];
    entry = Math.max(entry, a);
    exit = Math.min(exit, b);
    if (entry > exit) return null;
  }

  if (!hasDirection || exit <= 0) return null;
  const distance = entry > 0 ? entry : exit;
  return Number.isFinite(distance) && distance > 0 ? distance : null;
}
