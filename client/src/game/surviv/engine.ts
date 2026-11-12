// Surviv Battle Royale - Core Game Simulation Engine
import {
  MAP_SIZE,
  PLAYER_RADIUS,
  WEAPONS,
  ARMOR_DAMAGE_REDUCTION,
  HELMET_DAMAGE_REDUCTION,
  MAX_AMMO_BY_BACKPACK,
  MEDS_CONFIG,
  ZONE_PHASES,
  BOT_NAMES
} from "./constants";
import { generateIslandMap } from "./map";
import { firstProjectileImpact } from "./projectileCollision";
import { SurvivObstacleIndex } from "./obstacleIndex";
import { resolveSurvivMovement } from "./playerCollision";
import { arcadePressure, isOpeningProtected, meetsSpawnSeparation, type ArcadeDifficulty } from "../playability";
import { isStackableSurvivLoot, SURVIV_MEDICAL_INVENTORY_KEY, SURVIV_MEDICAL_LIMITS, transferSurvivLootStack, type SurvivMedicalLoot } from "./lootTransfer";
import { SURVIV_INITIAL_ZONE_RADIUS, advanceSurvivZoneShrink, completeSurvivZoneShrink } from "./zoneMechanics";
import type { SurvivAudio } from "./audio";
import type {
  PlayerEntity,
  WeaponId,
  AmmoType,
  Obstacle,
  GroundLoot,
  BulletEntity,
  ParticleEntity,
  ZoneState,
  KillFeedEntry
} from "./types";

export interface SurvivCallbacks {
  onPlayerUpdate: (p: PlayerEntity) => void;
  onAliveUpdate: (alive: number, total: number) => void;
  onKillFeed: (item: KillFeedEntry) => void;
  onZoneUpdate: (zone: ZoneState) => void;
  onGameOver: (won: boolean, rank: number, kills: number, damage: number) => void;
}

export class SurvivEngine {
  public player: PlayerEntity;
  public bots: PlayerEntity[] = [];
  public obstacles: Obstacle[] = [];
  private readonly obstacleIndex: SurvivObstacleIndex;
  private combatants: PlayerEntity[] = [];
  private hudUpdateClock = 0;
  private lastReportedAlive = -1;
  public loot: GroundLoot[] = [];
  public bullets: BulletEntity[] = [];
  public particles: ParticleEntity[] = [];
  public zone: ZoneState;

  public audio: SurvivAudio;
  public callbacks: SurvivCallbacks;

  // Input states
  public keys: Record<string, boolean> = {};
  public mouseWorldX = 0;
  public mouseWorldY = 0;
  public isMouseDown = false;

  // Mobile virtual joystick inputs
  public moveStick = { active: false, x: 0, y: 0 };
  public aimStick = { active: false, x: 0, y: 0 };

  private isRunning = false;
  private animFrameId: number | null = null;
  private lastTime = 0;
  public elapsedSeconds = 0;
  public difficulty: ArcadeDifficulty = "normal";
  private nextBulletId = 1;
  private nextLootId = 500;
  private isMatchOver = false;

  constructor(audio: SurvivAudio, callbacks: SurvivCallbacks) {
    this.audio = audio;
    this.callbacks = callbacks;

    // 1. Generate Island
    const { obstacles, initialLoot } = generateIslandMap();
    this.obstacles = obstacles;
    this.obstacleIndex = new SurvivObstacleIndex(obstacles);
    this.loot = initialLoot;

    // 2. Setup Safe Zone
    this.zone = {
      currentCenterX: MAP_SIZE / 2,
      currentCenterY: MAP_SIZE / 2,
      currentRadius: SURVIV_INITIAL_ZONE_RADIUS,
      targetCenterX: MAP_SIZE / 2 + (Math.random() - 0.5) * 400,
      targetCenterY: MAP_SIZE / 2 + (Math.random() - 0.5) * 400,
      targetRadius: MAP_SIZE * ZONE_PHASES[0].radiusRatio,
      phase: 0,
      phaseTimer: ZONE_PHASES[0].waitTime,
      isShrinking: false,
      dps: ZONE_PHASES[0].dps
    };

    // 3. Spawn Human Player
    const playerSpawn = this.findSafeSpawn();
    this.player = {
      id: 0,
      name: "Survivor",
      isBot: false,
      x: playerSpawn.x,
      y: playerSpawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 100,
      maxHealth: 100,
      boost: 0,
      helmetTier: 0,
      vestTier: 0,
      backpackTier: 1,
      scopeTier: 1,
      weapons: [
        { weaponId: "m9", curAmmo: 15 },
        null,
        { weaponId: "fists", curAmmo: 0 }
      ],
      activeSlot: 0,
      isReloading: false,
      reloadTimer: 0,
      ammo: { "9mm": 60, "12g": 10, "762mm": 0, "556mm": 0 },
      meds: { bandages: 5, medkits: 1, sodas: 2, pills: 0 },
      isUsingMed: false,
      medTimer: 0,
      medType: null,
      fireCooldown: 0,
      kills: 0,
      damageDealt: 0,
      active: true,
      inBush: false
    };

    // 4. Spawn 29 AI Bots
    const botCount = 29;
    const starterWeapons: WeaponId[] = ["m9", "glock", "m870", "mp220", "mac10"];
    for (let i = 0; i < botCount; i++) {
      const spawn = this.findSafeSpawn([this.player], 480);
      const startWep = starterWeapons[Math.floor(Math.random() * starterWeapons.length)];
      const wepDef = WEAPONS[startWep];
      this.bots.push({
        id: i + 1,
        name: BOT_NAMES[i % BOT_NAMES.length],
        isBot: true,
        x: spawn.x,
        y: spawn.y,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        health: 100,
        maxHealth: 100,
        boost: 0,
        helmetTier: Math.random() < 0.3 ? 1 : 0,
        vestTier: Math.random() < 0.3 ? 1 : 0,
        backpackTier: 1,
        scopeTier: 1,
        weapons: [
          { weaponId: startWep, curAmmo: wepDef.magSize },
          null,
          { weaponId: "fists", curAmmo: 0 }
        ],
        activeSlot: 0,
        isReloading: false,
        reloadTimer: 0,
        ammo: { "9mm": 60, "12g": 15, "762mm": 30, "556mm": 30 },
        meds: { bandages: 3, medkits: 0, sodas: 1, pills: 0 },
        isUsingMed: false,
        medTimer: 0,
        medType: null,
        fireCooldown: 0,
        kills: 0,
        damageDealt: 0,
        active: true,
        inBush: false,
        aiState: "looting",
        botThinkTimer: 3 + Math.random() * 4
      });
    }

    // Reuse a stable combatants array during projectile sweeps.
    this.combatants = [this.player, ...this.bots];
    this.lastReportedAlive = this.bots.length + 1;
    // The player chooses when the match starts; no background combat on page load.
    this.callbacks.onPlayerUpdate(this.player);
    this.callbacks.onAliveUpdate(this.lastReportedAlive, this.combatants.length);
    this.callbacks.onZoneUpdate(this.zone);
  }

  private findSafeSpawn(avoid: Array<{x:number;y:number}> = [], separation = 0): { x: number; y: number } {
    let best: {x:number;y:number}|null = null;
    let bestDistance = -1;
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * (MAP_SIZE - 600) + 300;
      const y = Math.random() * (MAP_SIZE - 600) + 300;
      const safe = this.obstacles.every(obs=>!obs.collidable ||
        Math.hypot(x-obs.x,y-obs.y) >= (obs.radius||40)+65);
      if(!safe)continue;
      const candidate={x,y};
      const distance=avoid.length?Math.min(...avoid.map(other=>Math.hypot(x-other.x,y-other.y))):MAP_SIZE;
      if(distance>bestDistance){best=candidate;bestDistance=distance;}
      if(meetsSpawnSeparation(candidate,avoid,separation) &&
        this.bots.every(other=>Math.hypot(x-other.x,y-other.y)>=150))return candidate;
    }
    return best || {x:MAP_SIZE/2,y:MAP_SIZE/2};
  }

  public setDifficulty(mode:ArcadeDifficulty) {
    if(!this.isRunning && this.elapsedSeconds===0) this.difficulty=mode;
  }

  public getOpeningProtectionRemaining(){
    return arcadePressure(this.elapsedSeconds,this.difficulty).protectionRemaining;
  }

  public start() {
    if (this.isRunning || this.isMatchOver) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public get running() { return this.isRunning; }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    // The winning/losing frame may stop the match; do not schedule any more physics.
    if (this.isRunning) this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsedSeconds += dt;
    // 1. Update Red Zone Shrink
    this.updateZone(dt);

    // 2. Update Human Player
    if (this.player.active) {
      this.updatePlayer(dt);
    }

    // 3. Update AI Bots
    for (const bot of this.bots) {
      if (bot.active) {
        this.updateBot(bot, dt);
      }
    }

    // 4. Update Bullets
    this.updateBullets(dt);

    // 5. Update Particles
    this.updateParticles(dt);

    // 6. Update Ground Loot drifting
    for (const l of this.loot) {
      if (!l.active) continue;
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.vx *= 0.9;
      l.vy *= 0.9;
    }

    // 7. Check Alive Survivors
    const aliveBots = this.bots.filter((b) => b.active).length;
    const totalAlive = aliveBots + (this.player.active ? 1 : 0);
    if (totalAlive !== this.lastReportedAlive) {
      this.lastReportedAlive = totalAlive;
      this.callbacks.onAliveUpdate(totalAlive, this.combatants.length);
    }

    // 8. Trigger Game Over / Chicken Dinner
    if (!this.isMatchOver) {
      if (!this.player.active) {
        this.isMatchOver = true;
        const rank = totalAlive + 1;
        this.stop();
        this.callbacks.onGameOver(false, rank, this.player.kills, this.player.damageDealt);
      } else if (aliveBots === 0) {
        this.isMatchOver = true;
        this.stop();
        this.callbacks.onGameOver(true, 1, this.player.kills, this.player.damageDealt);
      }
    }

    // React HUD refresh at up to 10 Hz rather than rerendering every frame.
    // The initial snapshot and onGameOver callback remain immediate.
    this.hudUpdateClock += dt;
    if (this.hudUpdateClock >= 0.1 || this.isMatchOver) {
      this.hudUpdateClock = 0;
      this.callbacks.onPlayerUpdate(this.player);
      this.callbacks.onZoneUpdate(this.zone);
    }
  }

  // Zone Logic
  private updateZone(dt: number) {
    const timeRemainingBeforeStep = this.zone.phaseTimer;
    this.zone.phaseTimer -= dt;

    if (!this.zone.isShrinking) {
      // Waiting phase
      if (this.zone.phaseTimer <= 0) {
        this.zone.isShrinking = true;
        const phaseDef = ZONE_PHASES[Math.min(this.zone.phase, ZONE_PHASES.length - 1)];
        this.zone.phaseTimer = phaseDef.shrinkTime;
        this.audio.playZoneWarning();
      }
    } else {
      // Shrinking phase
      advanceSurvivZoneShrink(this.zone, timeRemainingBeforeStep, dt);

      if (this.zone.phaseTimer <= 0 || this.zone.currentRadius <= this.zone.targetRadius + 5) {
        completeSurvivZoneShrink(this.zone);
        this.zone.phase++;
        this.zone.isShrinking = false;
        if (this.zone.phase < ZONE_PHASES.length) {
          const nextDef = ZONE_PHASES[this.zone.phase];
          this.zone.phaseTimer = nextDef.waitTime;
          this.zone.dps = nextDef.dps;
          // Pick next smaller target
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * (this.zone.currentRadius * 0.4);
          this.zone.targetCenterX = this.zone.currentCenterX + Math.cos(angle) * dist;
          this.zone.targetCenterY = this.zone.currentCenterY + Math.sin(angle) * dist;
          this.zone.targetRadius = MAP_SIZE * nextDef.radiusRatio;
        } else {
          this.zone.targetRadius = 0;
          this.zone.dps = 25;
        }
      }
    }

    // Apply Zone DPS to players outside
    this.applyZoneDamage(this.player, dt);
    for (const b of this.bots) {
      if (b.active) this.applyZoneDamage(b, dt);
    }
  }

  private applyZoneDamage(p: PlayerEntity, dt: number) {
    // A combat-dead player must not get another zone death, loot drop, or killfeed.
    if (!p.active || dt <= 0 || (!p.isBot && isOpeningProtected(this.elapsedSeconds,this.difficulty))) return;
    const distToCenter = Math.hypot(p.x - this.zone.currentCenterX, p.y - this.zone.currentCenterY);
    if (distToCenter > this.zone.currentRadius) {
      p.health -= this.zone.dps * dt;
      if (p.health <= 0) {
        p.health = 0;
        p.active = false;
        this.dropPlayerLoot(p);
        this.callbacks.onKillFeed({
          id: Math.random().toString(),
          killerName: "Red Zone",
          victimName: p.name,
          weaponName: "Toxic Gas",
          isPlayerKiller: false,
          isPlayerVictim: !p.isBot,
          timestamp: Date.now()
        });
      }
    }
  }

  // Human Player Update
  private updatePlayer(dt: number) {
    const p = this.player;

    // Movement calculation
    let mx = 0;
    let my = 0;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) my -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) my += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) mx -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) mx += 1;

    // Mobile move stick override
    if (this.moveStick.active) {
      mx = this.moveStick.x;
      my = this.moveStick.y;
    }

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
    }

    // Speed calculation: Boost provides up to +35% speed
    let baseSpeed = 240;
    if (p.boost > 0) {
      baseSpeed += (p.boost / 100) * 85;
      // Adrenaline boost decay
      p.boost = Math.max(0, p.boost - 2.5 * dt);
      // Boost passive health regen
      if (p.health < p.maxHealth) {
        p.health = Math.min(p.maxHealth, p.health + 1.8 * dt);
      }
    }

    // Weapon weight slow down slightly for heavy sniper/shotgun
    const curWep = this.getActiveWeapon(p);
    if (curWep.id === "mosin") baseSpeed *= 0.88;

    p.vx = mx * baseSpeed;
    p.vy = my * baseSpeed;

    // Move & collide with obstacles
    this.moveAndCollide(p, dt);

    // Aim angle
    if (this.aimStick.active && (Math.abs(this.aimStick.x) > 0.1 || Math.abs(this.aimStick.y) > 0.1)) {
      p.angle = Math.atan2(this.aimStick.y, this.aimStick.x);
    } else {
      p.angle = Math.atan2(this.mouseWorldY - p.y, this.mouseWorldX - p.x);
    }

    // Timers
    if (p.fireCooldown > 0) p.fireCooldown -= dt * 1000;
    if (p.isReloading) {
      p.reloadTimer -= dt * 1000;
      if (p.reloadTimer <= 0) {
        this.finishReload(p);
      }
    }

    if (p.isUsingMed) {
      p.medTimer -= dt * 1000;
      if (p.medTimer <= 0) {
        this.finishMed(p);
      }
    }

    // Check firing
    const shouldFire = this.isMouseDown || this.aimStick.active;
    if (shouldFire && !p.isReloading && !p.isUsingMed && p.fireCooldown <= 0) {
      this.fireWeapon(p);
    }

    // Check Bush hiding
    p.inBush = false;
    for (const obs of this.obstacleIndex.near(p.x, p.y, 5)) {
      if (obs.type === "bush") {
        if (Math.hypot(p.x - obs.x, p.y - obs.y) < obs.radius + 5) {
          p.inBush = true;
          break;
        }
      }
    }

    // Auto-Loot nearby items
    this.checkLootPickup(p);
  }

  // AI Bot Update
  private updateBot(bot: PlayerEntity, dt: number) {
    bot.botThinkTimer = (bot.botThinkTimer || 0) - dt;

    if (bot.fireCooldown > 0) bot.fireCooldown -= dt * 1000;
    if (bot.isReloading) {
      bot.reloadTimer -= dt * 1000;
      if (bot.reloadTimer <= 0) this.finishReload(bot);
    }

    // Zone urgency: Is bot outside the safe circle?
    const distToZone = Math.hypot(bot.x - this.zone.currentCenterX, bot.y - this.zone.currentCenterY);
    const outsideZone = distToZone > this.zone.currentRadius * 0.9;

    if (outsideZone) {
      // Do not pick a new random waypoint every animation frame: that makes
      // fleeing bots jitter and wastes AI decisions.
      if (bot.aiState !== "fleeing_zone" || bot.botThinkTimer <= 0) {
        bot.aiState = "fleeing_zone";
        bot.targetEntityId = undefined;
        bot.targetX = this.zone.currentCenterX + (Math.random() - 0.5) * 150;
        bot.targetY = this.zone.currentCenterY + (Math.random() - 0.5) * 150;
        bot.botThinkTimer = 1.2 + Math.random() * 1.2;
      }
    } else {
      // Track moving targets between decision ticks instead of shooting at
      // positions that can be more than a second out of date.
      if (bot.aiState === "hunting" && bot.targetEntityId !== undefined) {
        const target = this.combatants[bot.targetEntityId];
        if (target?.active && !target.inBush &&
            (target.isBot || !isOpeningProtected(this.elapsedSeconds, this.difficulty))) {
          bot.targetX = target.x;
          bot.targetY = target.y;
        } else {
          bot.botThinkTimer = 0;
        }
      }
    }
    if (!outsideZone && bot.botThinkTimer <= 0) {
      bot.botThinkTimer = 1.0 + Math.random() * 1.5;

      // Find nearest enemy (player or other bot)
      let nearestEnemy: PlayerEntity | null = null;
      let nearestDist = 290 + 260 * arcadePressure(this.elapsedSeconds,this.difficulty).rampFraction;

      // Check player
      if (this.player.active && !isOpeningProtected(this.elapsedSeconds,this.difficulty)) {
        const d = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
        if (d < nearestDist && !this.player.inBush) {
          nearestDist = d;
          nearestEnemy = this.player;
        }
      }

      // Check other bots
      for (const other of this.bots) {
        if (other.id === bot.id || !other.active || other.inBush) continue;
        const d = Math.hypot(other.x - bot.x, other.y - bot.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = other;
        }
      }

      if (nearestEnemy) {
        bot.aiState = "hunting";
        bot.targetEntityId = nearestEnemy.id;
        bot.targetX = nearestEnemy.x;
        bot.targetY = nearestEnemy.y;
      } else {
        // Look for loot or crates to break
        bot.aiState = "looting";
        bot.targetEntityId = undefined;
        let targetFound = false;
        for (const obs of this.obstacleIndex.near(bot.x, bot.y, 400)) {
          if (obs.active && obs.destructible) {
            const d = Math.hypot(obs.x - bot.x, obs.y - bot.y);
            if (d < 400) {
              bot.targetX = obs.x;
              bot.targetY = obs.y;
              targetFound = true;
              break;
            }
          }
        }
        if (!targetFound) {
          bot.targetX = bot.x + (Math.random() - 0.5) * 600;
          bot.targetY = bot.y + (Math.random() - 0.5) * 600;
        }
      }
    }

    // Execute Bot Movement & Aim
    if (bot.targetX !== undefined && bot.targetY !== undefined) {
      const dx = bot.targetX - bot.x;
      const dy = bot.targetY - bot.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 25) {
        const speed = 115 + 95 * arcadePressure(this.elapsedSeconds,this.difficulty).enemyPressure;
        bot.vx = (dx / dist) * speed;
        bot.vy = (dy / dist) * speed;
      } else {
        bot.vx = 0;
        bot.vy = 0;
      }

      bot.angle = Math.atan2(dy, dx);

      // Bot shooting logic
      if (bot.aiState === "hunting" && dist < 450 && bot.fireCooldown <= 0 && !bot.isReloading) {
        this.fireWeapon(bot);
      } else if (bot.aiState === "looting" && dist < 70 && bot.fireCooldown <= 0 && !bot.isReloading) {
        // Melee or shoot crate to farm loot
        this.fireWeapon(bot);
      }
    }

    this.moveAndCollide(bot, dt);
    this.checkLootPickup(bot);

    // Bot reload when empty
    const wep = this.getActiveWeapon(bot);
    const item = bot.weapons[bot.activeSlot];
    if (item && item.curAmmo === 0 && wep.ammoType && bot.ammo[wep.ammoType] > 0 && !bot.isReloading) {
      this.reloadWeapon(bot);
    }
  }

  // Physics & Obstacle Collision
  private moveAndCollide(p: PlayerEntity, dt: number) {
    const next = resolveSurvivMovement(
      { x: p.x, y: p.y },
      { x: p.vx, y: p.vy },
      dt,
      this.obstacles,
    );
    p.x = next.x;
    p.y = next.y;
  }

  // Weapon & Combat
  public getActiveWeapon(p: PlayerEntity) {
    const slotItem = p.weapons[p.activeSlot];
    if (!slotItem) return WEAPONS.fists;
    return WEAPONS[slotItem.weaponId] || WEAPONS.fists;
  }

  public fireWeapon(p: PlayerEntity) {
    // Enforce action state here too: fireWeapon is public, not just called by the frame loop.
    if (!p.active || p.isReloading || p.isUsingMed || p.fireCooldown > 0) return;
    const wep = this.getActiveWeapon(p);
    const item = p.weapons[p.activeSlot];

    // Check ammo
    if (wep.category !== "melee") {
      if (!item || item.curAmmo <= 0) {
        this.reloadWeapon(p);
        return;
      }
      item.curAmmo--;
    }

    p.fireCooldown = wep.fireDelayMs * (p.isBot ? 1 / Math.max(0.25, arcadePressure(this.elapsedSeconds,this.difficulty).enemyPressure) : 1);

    // Audio
    if (!p.isBot || Math.hypot(p.x - this.player.x, p.y - this.player.y) < 900) {
      this.audio.playGunshot(wep.soundType);
    }

    // Melee Punch
    if (wep.category === "melee") {
      const punchRange = 45;
      const punchX = p.x + Math.cos(p.angle) * punchRange;
      const punchY = p.y + Math.sin(p.angle) * punchRange;

      // Spawn punch particle
      this.spawnParticle(punchX, punchY, "#ffffff", 4, 0.2);

      // Hit obstacles (crates)
      for (const obs of this.obstacleIndex.near(punchX, punchY, 25)) {
        if (!obs.active || !obs.destructible) continue;
        const dist = Math.hypot(punchX - obs.x, punchY - obs.y);
        if (dist < (obs.radius || 30) + 25) {
          this.damageObstacle(obs, wep.damage, p);
        }
      }

      // Hit players
      this.checkMeleeHit(p, punchX, punchY, wep.damage);
      return;
    }

    // Projectiles (Guns & Shotguns)
    const barrelX = p.x + Math.cos(p.angle) * wep.barrelLength;
    const barrelY = p.y + Math.sin(p.angle) * wep.barrelLength;

    // Muzzle flash particle
    this.spawnParticle(barrelX, barrelY, "#fef08a", 6, 0.1);

    for (let i = 0; i < wep.pellets; i++) {
      const spreadAngle = p.angle + (Math.random() - 0.5) * wep.spread;
      const vx = Math.cos(spreadAngle) * wep.bulletSpeed;
      const vy = Math.sin(spreadAngle) * wep.bulletSpeed;

      this.bullets.push({
        id: this.nextBulletId++,
        ownerId: p.id,
        isBot: p.isBot,
        x: barrelX,
        y: barrelY,
        vx,
        vy,
        damage: wep.damage,
        distanceTraveled: 0,
        maxDistance: wep.falloffRange,
        radius: wep.bulletRadius,
        color: wep.bulletColor,
        active: true,
        weaponName: wep.name
      });
    }
  }

  private checkMeleeHit(attacker: PlayerEntity, hx: number, hy: number, damage: number) {
    const targets = this.combatants;
    for (const t of targets) {
      if (t.id === attacker.id || !t.active) continue;
      const dist = Math.hypot(hx - t.x, hy - t.y);
      if (dist < PLAYER_RADIUS + 15) {
        this.damagePlayer(t, damage, attacker, "Fists");
        this.spawnBlood(t.x, t.y);
      }
    }
  }

  private updateBullets(dt: number) {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      const remainingRange = bullet.maxDistance - bullet.distanceTraveled;
      if (remainingRange <= 0) {
        bullet.active = false;
        continue;
      }

      const from = { x: bullet.x, y: bullet.y };
      const fullX = bullet.vx * dt;
      const fullY = bullet.vy * dt;
      const fullDistance = Math.hypot(fullX, fullY);
      const distance = Math.min(remainingRange, fullDistance);
      const fraction = fullDistance > 0 ? distance / fullDistance : 0;
      const to = { x: from.x + fullX * fraction, y: from.y + fullY * fraction };

      // Sweep the complete movement segment to stop high-speed bullets tunneling
      // through walls or players. Resolve only the earliest impact.
      const impact = firstProjectileImpact(
        bullet, from, to, this.obstacleIndex.segment(from, to, bullet.radius), this.combatants,
      );
      if (impact) {
        bullet.x = from.x + (to.x - from.x) * impact.t;
        bullet.y = from.y + (to.y - from.y) * impact.t;
        bullet.distanceTraveled += distance * impact.t;
        bullet.active = false;

        const attacker = bullet.ownerId === this.player.id
          ? this.player
          : this.bots.find((bot) => bot.id === bullet.ownerId);

        if (impact.kind === "obstacle") {
          const obs = impact.obstacle;
          this.spawnParticle(bullet.x, bullet.y, obs.color, 4, 0.2);
          if (obs.destructible) this.damageObstacle(obs, bullet.damage, attacker);
        } else {
          const target = impact.target;
          const weaponName = bullet.weaponName ||
            (attacker ? this.getActiveWeapon(attacker).name : "Firearm");
          this.damagePlayer(target, bullet.damage, attacker, weaponName);
          this.spawnBlood(target.x, target.y);
        }
      } else {
        bullet.x = to.x;
        bullet.y = to.y;
        bullet.distanceTraveled += distance;
        if (bullet.distanceTraveled >= bullet.maxDistance) bullet.active = false;
      }
    }

    this.bullets = this.bullets.filter((bullet) => bullet.active);
  }

  private damageObstacle(obs: Obstacle, damage: number, attacker?: PlayerEntity) {
    obs.health -= damage;
    if (obs.health <= 0) {
      obs.health = 0;
      obs.active = false;
      this.audio.playCrateSmash();

      // Spawn wood/stone splinter particles
      for (let i = 0; i < 8; i++) {
        this.spawnParticle(obs.x, obs.y, obs.color, Math.random() * 5 + 3, 0.4);
      }

      // Drop Loot
      if (obs.dropsLoot) {
        this.dropCrateLoot(obs);
      }
    }
  }

  private dropCrateLoot(obs: Obstacle) {
    const isMetal = obs.type === "metal_crate";
    const weaponPool: WeaponId[] = isMetal
      ? ["ak47", "m416", "mosin", "mp220"]
      : ["m9", "glock", "m870", "mac10"];

    const pickedWep = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    const wepDef = WEAPONS[pickedWep];

    // Drop weapon
    this.spawnGroundLoot({
      id: this.nextLootId++,
      type: "weapon",
      x: obs.x + (Math.random() - 0.5) * 30,
      y: obs.y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      weaponId: pickedWep,
      amount: 1,
      active: true
    });

    // Drop ammo
    if (wepDef.ammoType) {
      this.spawnGroundLoot({
        id: this.nextLootId++,
        type: "ammo",
        x: obs.x + (Math.random() - 0.5) * 30,
        y: obs.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        ammoType: wepDef.ammoType,
        amount: wepDef.ammoType === "12g" ? 12 : 30,
        active: true
      });
    }

    // Drop Med or Armor
    if (isMetal) {
      this.spawnGroundLoot({
        id: this.nextLootId++,
        type: "vest",
        tier: 2,
        x: obs.x,
        y: obs.y,
        vx: 0,
        vy: 0,
        amount: 1,
        active: true
      });
    } else if (Math.random() < 0.5) {
      this.spawnGroundLoot({
        id: this.nextLootId++,
        type: "bandage",
        x: obs.x,
        y: obs.y,
        vx: 0,
        vy: 0,
        amount: 5,
        active: true
      });
    }
  }

  private dropPlayerLoot(p: PlayerEntity) {
    // Drop weapons
    for (const w of p.weapons) {
      if (w && w.weaponId !== "fists") {
        this.spawnGroundLoot({
          id: this.nextLootId++,
          type: "weapon",
          x: p.x + (Math.random() - 0.5) * 40,
          y: p.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          weaponId: w.weaponId,
          amount: 1,
          active: true
        });
      }
    }

    // Drop ammo
    for (const key of Object.keys(p.ammo) as AmmoType[]) {
      if (p.ammo[key] > 0) {
        this.spawnGroundLoot({
          id: this.nextLootId++,
          type: "ammo",
          x: p.x + (Math.random() - 0.5) * 40,
          y: p.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          ammoType: key,
          amount: p.ammo[key],
          active: true
        });
      }
    }

    // Drop Meds
    if (p.meds.medkits > 0) {
      this.spawnGroundLoot({
        id: this.nextLootId++,
        type: "medkit",
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        amount: p.meds.medkits,
        active: true
      });
    }
  }

  private spawnGroundLoot(lootItem: GroundLoot) {
    this.loot.push(lootItem);
  }

  private damagePlayer(target: PlayerEntity, rawDamage: number, attacker?: PlayerEntity, weaponName = "Firearm") {
    if (!target.active || !Number.isFinite(rawDamage) || rawDamage <= 0 ||
      (!target.isBot && isOpeningProtected(this.elapsedSeconds,this.difficulty))) return;
    // Damage reduction from Vest & Helmet
    const vestRed = ARMOR_DAMAGE_REDUCTION[target.vestTier] || 0;
    const helmetRed = HELMET_DAMAGE_REDUCTION[target.helmetTier] || 0;
    const totalReduction = Math.min(0.7, vestRed + helmetRed * 0.5);
    const actualDamage = Math.max(1, rawDamage * (1 - totalReduction));

    const remainingHealth = Math.max(0, target.health);
    const damageApplied = Math.min(remainingHealth, actualDamage);
    target.health -= damageApplied;

    if (attacker) {
      // Score only real health removed, not overkill damage past zero.
      attacker.damageDealt += damageApplied;
    }

    if (target.health <= 0) {
      target.health = 0;
      target.active = false;
      this.dropPlayerLoot(target);

      if (attacker) {
        attacker.kills++;
      }

      this.callbacks.onKillFeed({
        id: Math.random().toString(),
        killerName: attacker ? attacker.name : "Survivor",
        victimName: target.name,
        weaponName,
        isPlayerKiller: attacker?.id === 0,
        isPlayerVictim: target.id === 0,
        timestamp: Date.now()
      });
    }
  }

  // Reloading
  private cancelReload(p: PlayerEntity) {
    p.isReloading = false;
    p.reloadTimer = 0;
    p.reloadingSlot = undefined;
  }

  public reloadWeapon(p: PlayerEntity) {
    if (!p.active || p.isReloading || p.isUsingMed) return;
    const item = p.weapons[p.activeSlot];
    if (!item || item.weaponId === "fists") return;

    const wep = WEAPONS[item.weaponId];
    if (!wep?.ammoType) return;

    const needed = wep.magSize - item.curAmmo;
    const available = p.ammo[wep.ammoType] || 0;

    if (needed > 0 && available > 0) {
      p.isReloading = true;
      p.reloadingSlot = p.activeSlot;
      p.reloadTimer = wep.reloadTimeMs;
      if (!p.isBot) {
        this.audio.playReload();
      }
    }
  }

  private finishReload(p: PlayerEntity) {
    if (!p.isReloading) return;
    const slot = p.reloadingSlot;
    // Always clear the old timer before processing the weapon inventory.
    this.cancelReload(p);
    if (!p.active || slot === undefined || slot !== p.activeSlot) return;
    const item = p.weapons[slot];
    if (!item) return;

    const wep = WEAPONS[item.weaponId];
    if (!wep?.ammoType) return;

    const needed = Math.max(0, wep.magSize - item.curAmmo);
    const toLoad = Math.min(needed, Math.max(0, p.ammo[wep.ammoType] || 0));

    item.curAmmo += toLoad;
    p.ammo[wep.ammoType] -= toLoad;
  }

  // Medical Consumption
  public useMed(p: PlayerEntity, type: "bandage" | "medkit" | "soda" | "pills") {
    if (!p.active || p.isUsingMed || p.isReloading) return;

    if (type === "bandage" && p.health >= 75) return;
    if (type === "medkit" && p.health >= 100) return;
    if ((type === "soda" || type === "pills") && p.boost >= 100) return;

    const countKey = type === "bandage" ? "bandages" : type === "medkit" ? "medkits" : type === "soda" ? "sodas" : "pills";
    if (p.meds[countKey] <= 0) return;

    p.isUsingMed = true;
    p.medType = type;
    p.medTimer = MEDS_CONFIG[type].timeMs;
  }

  private finishMed(p: PlayerEntity) {
    if (!p.isUsingMed) return;
    p.isUsingMed = false;
    const type = p.medType;
    p.medType = null;
    p.medTimer = 0;
    if (!type || !p.active) return;
    const countKey = type === "bandage" ? "bandages" :
      type === "medkit" ? "medkits" : type === "soda" ? "sodas" : "pills";
    if (p.meds[countKey] <= 0) return;

    if (type === "bandage") {
      p.meds.bandages--;
      // Boost/regen can raise HP above 75 while a bandage is being applied.
      // Finishing a bandage must never LOWER the player's current health.
      if (p.health < 75) p.health = Math.min(75, p.health + 15);
    } else if (type === "medkit") {
      p.meds.medkits--;
      p.health = 100;
    } else if (type === "soda") {
      p.meds.sodas--;
      p.boost = Math.min(100, p.boost + 25);
    } else if (type === "pills") {
      p.meds.pills--;
      p.boost = Math.min(100, p.boost + 50);
    }

    if (!p.isBot) {
      this.audio.playHeal();
    }
  }

  // Switch Active Weapon Slot (0, 1, 2)
  public switchWeapon(slot: 0 | 1 | 2) {
    if (this.player.activeSlot === slot) return;
    this.player.activeSlot = slot;
    this.cancelReload(this.player);
    this.player.fireCooldown = 150;
  }

  // Auto-Pickup Ground Loot
  private checkLootPickup(p: PlayerEntity) {
    const pickupDist = PLAYER_RADIUS + 24;

    for (const item of this.loot) {
      if (!item.active) continue;
      const dist = Math.hypot(p.x - item.x, p.y - item.y);
      if (dist < pickupDist) {
        if (this.tryCollectLoot(p, item)) {
          // Partial ammo and medical pickups leave the remaining stack on the ground.
          if (!isStackableSurvivLoot(item.type) || item.amount === 0) {
            item.active = false;
          }
          if (!p.isBot) {
            this.audio.playPickup();
          }
        }
      }
    }
  }

  private tryCollectLoot(p: PlayerEntity, item: GroundLoot): boolean {
    if (item.type === "ammo" && item.ammoType) {
      const capacity = MAX_AMMO_BY_BACKPACK[p.backpackTier]?.[item.ammoType] ?? 0;
      const moved = transferSurvivLootStack(p.ammo[item.ammoType], capacity, item.amount);
      if (!moved.taken) return false;
      p.ammo[item.ammoType] = moved.carried;
      item.amount = moved.onGround;
      return true;
    }

    if (item.type === "weapon" && item.weaponId) {
      const wepDef = WEAPONS[item.weaponId];
      // If primary empty
      if (!p.weapons[0]) {
        p.weapons[0] = { weaponId: item.weaponId, curAmmo: wepDef.magSize };
        this.cancelReload(p);
        p.activeSlot = 0;
        return true;
      }
      // If secondary empty
      if (!p.weapons[1]) {
        p.weapons[1] = { weaponId: item.weaponId, curAmmo: wepDef.magSize };
        this.cancelReload(p);
        p.activeSlot = 1;
        return true;
      }
      return false;
    }

    if (item.type === "vest" && item.tier) {
      if (item.tier > p.vestTier) {
        p.vestTier = item.tier;
        return true;
      }
      return false;
    }

    if (item.type === "helmet" && item.tier) {
      if (item.tier > p.helmetTier) {
        p.helmetTier = item.tier;
        return true;
      }
      return false;
    }

    if (item.type === "backpack" && item.tier) {
      if (item.tier > p.backpackTier) {
        p.backpackTier = item.tier;
        return true;
      }
      return false;
    }

    if (item.type === "scope" && item.tier) {
      if (item.tier > p.scopeTier) {
        p.scopeTier = item.tier;
        return true;
      }
      return false;
    }

    if (item.type === "bandage" || item.type === "medkit" ||
        item.type === "soda" || item.type === "pills") {
      const medicalType: SurvivMedicalLoot = item.type;
      const inventoryKey = SURVIV_MEDICAL_INVENTORY_KEY[medicalType];
      const capacity = SURVIV_MEDICAL_LIMITS[medicalType];
      const moved = transferSurvivLootStack(p.meds[inventoryKey], capacity, item.amount);
      if (!moved.taken) return false;
      p.meds[inventoryKey] = moved.carried;
      item.amount = moved.onGround;
      return true;
    }

    return false;
  }

  // Particle Effects
  private spawnParticle(x: number, y: number, color: string, radius: number, duration: number) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 80 + 20;
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      color,
      alpha: 1.0,
      decay: 1.0 / duration,
      active: true
    });
  }

  private spawnBlood(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.spawnParticle(x, y, "#dc2626", Math.random() * 3 + 2, 0.45);
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        p.active = false;
      }
    }
    this.particles = this.particles.filter((p) => p.active);
  }

  public dispose() {
    // The page owns the shared audio instance; disposing a round must not
    // destroy sound playback for the next in-place replay.
    this.stop();
  }
}
