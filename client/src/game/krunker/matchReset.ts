import type { BotEntity, MatchStats } from "./types";

export const KRUNKER_MATCH_DURATION_SECONDS = 240;

export function freshKrunkerMatchStats(): MatchStats {
  return {
    kills: 0,
    deaths: 0,
    headshots: 0,
    damageDealt: 0,
    shotsFired: 0,
    shotsHit: 0,
    score: 0,
    highestKillstreak: 0,
    currentKillstreak: 0,
    topSpeed: 0,
  };
}

/** Reset one existing bot without creating new Three.js meshes or duplicating objects. */
export function resetKrunkerBotForMatch(bot: BotEntity, spawn: BotEntity["position"]): void {
  bot.position.copy(spawn);
  bot.velocity.set(0, 0, 0);
  bot.mesh.position.copy(spawn);
  bot.mesh.rotation.y = 0;
  bot.mesh.visible = true;
  bot.leftLegMesh.rotation.x = 0;
  bot.rightLegMesh.rotation.x = 0;
  bot.rotationY = 0;
  bot.pitch = 0;
  bot.health = bot.maxHealth;
  bot.isAlive = true;
  bot.respawnTimer = 0;
  bot.invulnerableTimer = 1.0;
  bot.targetId = null;
  bot.state = "patrol";
  bot.stateTimer = 2.0;
  bot.fireCooldown = 0;
  bot.reactionTimer = 0.25;
  bot.lastKnownTargetPos = null;
  bot.kills = 0;
  bot.deaths = 0;
  bot.score = 0;
  bot.walkCycle = 0;
}
