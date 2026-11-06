import { MAP_SIZE } from "./constants";
import type { ZoneState } from "./types";

// Include the whole 2,800x2,800 playable island before the first shrinking phase.
// The old initial radius (0.48 of map size) was smaller than phase zero's target
// (0.65), making the first supposedly shrinking phase EXPAND the danger boundary.
export const SURVIV_INITIAL_ZONE_RADIUS = MAP_SIZE * 0.72;

type ShrinkingZone = Pick<
  ZoneState,
  "currentRadius" | "targetRadius" |
  "currentCenterX" | "currentCenterY" |
  "targetCenterX" | "targetCenterY"
>;

/** Progress zone radius and center consistently to their targets in remaining time. */
export function advanceSurvivZoneShrink(
  zone: ShrinkingZone,
  timeRemainingBeforeStep: number,
  secondsElapsed: number,
): void {
  if (![timeRemainingBeforeStep, secondsElapsed].every(Number.isFinite) ||
      secondsElapsed <= 0) return;
  const progress = timeRemainingBeforeStep <= secondsElapsed
    ? 1
    : Math.min(1, secondsElapsed / timeRemainingBeforeStep);
  // Never expand a safe zone during a shrinking phase even if a target is wrong.
  const shrinkingRadius = Math.max(0, Math.min(zone.targetRadius, zone.currentRadius));
  zone.currentRadius += (shrinkingRadius - zone.currentRadius) * progress;
  zone.currentCenterX += (zone.targetCenterX - zone.currentCenterX) * progress;
  zone.currentCenterY += (zone.targetCenterY - zone.currentCenterY) * progress;
}

/** Snap the last few pixels at a completed phase to avoid cumulative drift. */
export function completeSurvivZoneShrink(zone: ShrinkingZone): void {
  zone.currentRadius = Math.max(0, Math.min(zone.currentRadius, zone.targetRadius));
  zone.currentCenterX = zone.targetCenterX;
  zone.currentCenterY = zone.targetCenterY;
}
