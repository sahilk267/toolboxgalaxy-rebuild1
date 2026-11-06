import { MAP_SIZE, PLAYER_RADIUS } from "./constants";
import type { Obstacle } from "./types";

export interface SurvivPoint { x: number; y: number }

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Resolve a player circle against a rectangular obstacle.
 * In particular, a center already inside the rectangle must be moved past
 * the nearest FACE plus the player's radius, not only by one radius.
 */
export function separateCircleFromBox(
  point: SurvivPoint,
  center: SurvivPoint,
  halfWidth: number,
  halfHeight: number,
  radius: number,
): SurvivPoint {
  if (![point.x, point.y, center.x, center.y, halfWidth, halfHeight, radius].every(Number.isFinite) ||
      halfWidth < 0 || halfHeight < 0 || radius <= 0) return point;

  const left = center.x - halfWidth;
  const right = center.x + halfWidth;
  const top = center.y - halfHeight;
  const bottom = center.y + halfHeight;
  const nearestX = clamp(point.x, left, right);
  const nearestY = clamp(point.y, top, bottom);
  const dx = point.x - nearestX;
  const dy = point.y - nearestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared >= radius * radius) return point;
  if (distanceSquared > 0) {
    const distance = Math.sqrt(distanceSquared);
    const movement = (radius - distance) / distance;
    return { x: point.x + dx * movement, y: point.y + dy * movement };
  }

  // Already inside (or exactly on a face). Push to the closest valid exterior.
  const distances = [
    point.x - left,
    right - point.x,
    point.y - top,
    bottom - point.y,
  ];
  const closestFace = distances.indexOf(Math.min(...distances));
  switch (closestFace) {
    case 0: return { x: left - radius, y: point.y };
    case 1: return { x: right + radius, y: point.y };
    case 2: return { x: point.x, y: top - radius };
    default: return { x: point.x, y: bottom + radius };
  }
}

/** Circle/circle collision also handles exact coincident centers deterministically. */
export function separateCircleFromCircle(
  point: SurvivPoint,
  center: SurvivPoint,
  combinedRadius: number,
): SurvivPoint {
  if (![point.x, point.y, center.x, center.y, combinedRadius].every(Number.isFinite) ||
      combinedRadius <= 0) return point;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= combinedRadius) return point;
  if (distance === 0) return { x: center.x + combinedRadius, y: center.y };
  const factor = combinedRadius / distance;
  return { x: center.x + dx * factor, y: center.y + dy * factor };
}

/**
 * Apply player/bot displacement, resolve active solid objects, and re-clamp
 * after separation so a collider cannot push the character off the island.
 * Several passes handle the adjoining bunker walls without spawning new objects.
 */
export function resolveSurvivMovement(
  position: SurvivPoint,
  velocity: SurvivPoint,
  deltaSeconds: number,
  obstacles: readonly Obstacle[],
): SurvivPoint {
  if (![position.x, position.y, velocity.x, velocity.y, deltaSeconds].every(Number.isFinite)) {
    return position;
  }
  const safeDt = Math.max(0, deltaSeconds);
  const minPosition = PLAYER_RADIUS + 30;
  const maxPosition = MAP_SIZE - minPosition;
  let next: SurvivPoint = {
    x: clamp(position.x + velocity.x * safeDt, minPosition, maxPosition),
    y: clamp(position.y + velocity.y * safeDt, minPosition, maxPosition),
  };

  for (let pass = 0; pass < 4; pass++) {
    const before = next;
    for (const obstacle of obstacles) {
      if (!obstacle.active || !obstacle.collidable) continue;
      const box = obstacle.type === "wall" || obstacle.type === "crate" || obstacle.type === "metal_crate";
      next = box
        ? separateCircleFromBox(next, obstacle, (obstacle.width || 40) / 2, (obstacle.height || 40) / 2, PLAYER_RADIUS)
        : separateCircleFromCircle(next, obstacle, PLAYER_RADIUS + obstacle.radius);
      next = {
        x: clamp(next.x, minPosition, maxPosition),
        y: clamp(next.y, minPosition, maxPosition),
      };
    }
    if (Math.abs(next.x - before.x) < 1e-8 && Math.abs(next.y - before.y) < 1e-8) break;
  }
  return next;
}
