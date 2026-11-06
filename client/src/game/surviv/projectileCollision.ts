import { PLAYER_RADIUS } from "./constants";
import type { BulletEntity, Obstacle, PlayerEntity } from "./types";

export type ProjectilePoint = { x: number; y: number };

export function segmentCircleHit(
  start: ProjectilePoint,
  end: ProjectilePoint,
  center: ProjectilePoint,
  radius: number,
): number | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const ox = start.x - center.x;
  const oy = start.y - center.y;
  if (![dx, dy, ox, oy, radius].every(Number.isFinite) || radius < 0) return null;
  const r2 = radius * radius;
  if (ox * ox + oy * oy <= r2) return 0;
  const a = dx * dx + dy * dy;
  if (a <= 0) return null;
  const b = 2 * (ox * dx + oy * dy);
  const discriminant = b * b - 4 * a * (ox * ox + oy * oy - r2);
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

export function segmentBoxHit(
  start: ProjectilePoint,
  end: ProjectilePoint,
  center: ProjectilePoint,
  halfWidth: number,
  halfHeight: number,
): number | null {
  if (![start.x, start.y, end.x, end.y, center.x, center.y, halfWidth, halfHeight].every(Number.isFinite) ||
      halfWidth < 0 || halfHeight < 0) return null;

  let enter = 0;
  let exit = 1;
  for (const axis of ["x", "y"] as const) {
    const origin = start[axis];
    const motion = end[axis] - origin;
    const min = center[axis] - (axis === "x" ? halfWidth : halfHeight);
    const max = center[axis] + (axis === "x" ? halfWidth : halfHeight);
    if (Math.abs(motion) < 1e-12) {
      if (origin < min || origin > max) return null;
      continue;
    }
    let first = (min - origin) / motion;
    let last = (max - origin) / motion;
    if (first > last) [first, last] = [last, first];
    enter = Math.max(enter, first);
    exit = Math.min(exit, last);
    if (enter > exit) return null;
  }
  return enter >= 0 && enter <= 1 ? enter : null;
}

export type ProjectileImpact =
  | { kind: "obstacle"; obstacle: Obstacle; t: number }
  | { kind: "player"; target: PlayerEntity; t: number };

/** Return the first hit ALONG the movement segment, not the first array item or endpoint. */
export function firstProjectileImpact(
  bullet: Pick<BulletEntity, "ownerId" | "radius">,
  start: ProjectilePoint,
  end: ProjectilePoint,
  obstacles: readonly Obstacle[],
  players: readonly PlayerEntity[],
): ProjectileImpact | null {
  let nearest: ProjectileImpact | null = null;
  for (const obstacle of obstacles) {
    if (!obstacle.active || !obstacle.collidable) continue;
    const isBox = obstacle.type === "wall" || obstacle.type === "crate" || obstacle.type === "metal_crate";
    const t = isBox
      ? segmentBoxHit(start, end, obstacle, (obstacle.width || 40) / 2 + bullet.radius,
          (obstacle.height || 40) / 2 + bullet.radius)
      : segmentCircleHit(start, end, obstacle, obstacle.radius + bullet.radius);
    if (t !== null && (!nearest || t < nearest.t)) {
      nearest = { kind: "obstacle", obstacle, t };
    }
  }

  for (const target of players) {
    if (!target.active || target.id === bullet.ownerId) continue;
    const t = segmentCircleHit(start, end, target, PLAYER_RADIUS + bullet.radius);
    // Keep an obstacle ahead of a player when both first-hit distances tie.
    if (t !== null && (!nearest || t < nearest.t)) {
      nearest = { kind: "player", target, t };
    }
  }
  return nearest;
}
