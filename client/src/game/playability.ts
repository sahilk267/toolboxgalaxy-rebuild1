/**
 * Browser-local arcade onboarding and adaptive pressure.
 *
 * The opening is a real non-damaging learning window. Pressure grows smoothly
 * rather than instantly spawning max-level opponents. No paywalls/telemetry.
 */
export type ArcadeDifficulty = "easy" | "normal" | "hard";
export const ARCADE_DIFFICULTIES: readonly ArcadeDifficulty[] = ["easy", "normal", "hard"];
const settings = {
  easy:   { protection: 16, ramp: 145, start: 0.22, peak: 0.86 },
  normal: { protection: 12, ramp: 115, start: 0.32, peak: 1.00 },
  hard:   { protection: 8,  ramp: 88,  start: 0.44, peak: 1.18 },
} as const;
export interface ArcadePressure {
  elapsed: number;
  protectionRemaining: number;
  rampFraction: number;
  enemyPressure: number;
  phase: "learning" | "warming" | "rising" | "full";
}
export function arcadePressure(elapsedSeconds: number, difficulty: ArcadeDifficulty = "normal"): ArcadePressure {
  const config = settings[difficulty] ?? settings.normal;
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const protectionRemaining = Math.max(0, config.protection - elapsed);
  const rampFraction = Math.max(0, Math.min(1, (elapsed - config.protection) / config.ramp));
  const smooth = rampFraction * rampFraction * (3 - 2 * rampFraction);
  return {
    elapsed,
    protectionRemaining,
    rampFraction,
    enemyPressure: config.start + (config.peak - config.start) * smooth,
    phase: protectionRemaining > 0 ? "learning" :
      rampFraction < 0.25 ? "warming" :
      rampFraction < 1 ? "rising" : "full",
  };
}
export function isOpeningProtected(elapsed: number, difficulty: ArcadeDifficulty = "normal"): boolean {
  return arcadePressure(elapsed, difficulty).protectionRemaining > 0;
}
export function targetDiepBots(elapsed: number, difficulty: ArcadeDifficulty = "normal"): number {
  const pressure = arcadePressure(elapsed,difficulty);
  return Math.max(2, Math.min(8, Math.floor(3 + pressure.rampFraction * 5)));
}
export type Point2 = { x: number; y: number };
export function meetsSpawnSeparation(
  candidate: Point2, others: readonly Point2[], minDistance: number,
): boolean {
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y) &&
    Number.isFinite(minDistance) && minDistance >= 0 &&
    others.every(other => Math.hypot(candidate.x-other.x, candidate.y-other.y) >= minDistance);
}
export function krunkerBotHitChance(pressure:number, distance:number, playerSpeed:number):number {
  const normalizedPressure=Number.isFinite(pressure)?Math.max(0,pressure):0;
  const range=Number.isFinite(distance)?Math.max(0,distance):100;
  const moving=Number.isFinite(playerSpeed)?Math.max(0,Math.min(1,playerSpeed/12)):0;
  return Math.max(0.10,Math.min(0.70,0.17+0.38*normalizedPressure-range/170-moving*0.16));
}
export function orbitGatePace(elapsedSeconds:number,difficulty:ArcadeDifficulty="normal") {
  const pressure=arcadePressure(elapsedSeconds,difficulty);
  return {
    speed:2.25+pressure.enemyPressure*2.85,
    spawnInterval:3.5-pressure.rampFraction*1.75,
    gapRange:0.4+2.3*pressure.rampFraction,
  };
}
export function arcadePhaseLabel(phase: ArcadePressure["phase"]): string {
  return {
    learning: "Learn the controls — protected",
    warming: "Warm-up",
    rising: "Challenge increasing",
    full: "Full challenge",
  }[phase];
}
