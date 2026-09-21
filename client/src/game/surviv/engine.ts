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
  private nextBulletId = 1;
  private nextLootId = 500;
  private isMatchOver = false;

  constructor(audio: SurvivAudio, callbacks: SurvivCallbacks) {
    this.audio = audio;
    this.callbacks = callbacks;

    // 1. Generate Island
    const { obstacles, initialLoot } = generateIslandMap();
    this.obstacles = obstacles;
    this.loot = initialLoot;

    // 2. Setup Safe Zone
    this.zone = {
      currentCenterX: MAP_SIZE / 2,
      currentCenterY: MAP_SIZE / 2,
      currentRadius: MAP_SIZE * 0.48,
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
      const spawn = this.findSafeSpawn();
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
        botThinkTimer: Math.random() * 2
      });
    }

    this.start();
  }

  private findSafeSpawn(): { x: number; y: number } {
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * (MAP_SIZE - 600) + 300;
      const y = Math.random() * (MAP_SIZE - 600) + 300;
      let safe = true;
      for (const obs of this.obstacles) {
        if (obs.collidable) {
          const dist = Math.hypot(x - obs.x, y - obs.y);
          if (dist < (obs.radius || 40) + 50) {
            safe = false;
            break;
          }
        }
      }
      if (safe) return { x, y };
    }
    return { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

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
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
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
    this.callbacks.onAliveUpdate(totalAlive, this.bots.length + 1);

    // 8. Trigger Game Over / Chicken Dinner
    if (!this.isMatchOver) {
      if (!this.player.active) {
        this.isMatchOver = true;
        const rank = totalAlive + 1;
        this.callbacks.onGameOver(false, rank, this.player.kills, this.player.damageDealt);
      } else if (aliveBots === 0) {
        this.isMatchOver = true;
        this.callbacks.onGameOver(true, 1, this.player.kills, this.player.damageDealt);
      }
    }

    // Notify UI
    this.callbacks.onPlayerUpdate(this.player);
    this.callbacks.onZoneUpdate(this.zone);
  }

  // Zone Logic
  private updateZone(dt: number) {
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
      const phaseDef = ZONE_PHASES[Math.min(this.zone.phase, ZONE_PHASES.length - 1)];
      const shrinkSpeed = (this.zone.currentRadius - this.zone.targetRadius) / Math.max(0.1, this.zone.phaseTimer);
      this.zone.currentRadius = Math.max(0, this.zone.currentRadius - shrinkSpeed * dt);

      // Move center towards target
      this.zone.currentCenterX += (this.zone.targetCenterX - this.zone.currentCenterX) * 0.05 * dt;
      this.zone.currentCenterY += (this.zone.targetCenterY - this.zone.currentCenterY) * 0.05 * dt;

      if (this.zone.phaseTimer <= 0 || this.zone.currentRadius <= this.zone.targetRadius + 5) {
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
    for (const obs of this.obstacles) {
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
      bot.aiState = "fleeing_zone";
      bot.targetX = this.zone.currentCenterX + (Math.random() - 0.5) * 150;
      bot.targetY = this.zone.currentCenterY + (Math.random() - 0.5) * 150;
    } else if (bot.botThinkTimer <= 0) {
      bot.botThinkTimer = 1.0 + Math.random() * 1.5;

      // Find nearest enemy (player or other bot)
      let nearestEnemy: PlayerEntity | null = null;
      let nearestDist = 550;

      // Check player
      if (this.player.active) {
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
        bot.targetX = nearestEnemy.x;
        bot.targetY = nearestEnemy.y;
      } else {
        // Look for loot or crates to break
        bot.aiState = "looting";
        let targetFound = false;
        for (const obs of this.obstacles) {
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
        const speed = 210;
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
    let nextX = p.x + p.vx * dt;
    let nextY = p.y + p.vy * dt;

    // Bounds clamp
    nextX = Math.max(PLAYER_RADIUS + 30, Math.min(MAP_SIZE - PLAYER_RADIUS - 30, nextX));
    nextY = Math.max(PLAYER_RADIUS + 30, Math.min(MAP_SIZE - PLAYER_RADIUS - 30, nextY));

    // Circle & AABB collisions
    for (const obs of this.obstacles) {
      if (!obs.active || !obs.collidable) continue;

      if (obs.type === "wall" || obs.type === "crate" || obs.type === "metal_crate") {
        // Box collision
        const hw = (obs.width || 40) / 2;
        const hh = (obs.height || 40) / 2;
        const closestX = Math.max(obs.x - hw, Math.min(obs.x + hw, nextX));
        const closestY = Math.max(obs.y - hh, Math.min(obs.y + hh, nextY));
        const distX = nextX - closestX;
        const distY = nextY - closestY;
        const distSq = distX * distX + distY * distY;

        if (distSq < PLAYER_RADIUS * PLAYER_RADIUS) {
          const dist = Math.sqrt(distSq);
          const overlap = PLAYER_RADIUS - (dist || 0.001);
          const nx = dist ? distX / dist : 1;
          const ny = dist ? distY / dist : 0;
          nextX += nx * overlap;
          nextY += ny * overlap;
        }
      } else {
        // Circle collision (trees, rocks)
        const dx = nextX - obs.x;
        const dy = nextY - obs.y;
        const dist = Math.hypot(dx, dy);
        const minDist = PLAYER_RADIUS + obs.radius;

        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          nextX += nx * overlap;
          nextY += ny * overlap;
        }
      }
    }

    p.x = nextX;
    p.y = nextY;
  }

  // Weapon & Combat
  public getActiveWeapon(p: PlayerEntity) {
    const slotItem = p.weapons[p.activeSlot];
    if (!slotItem) return WEAPONS.fists;
    return WEAPONS[slotItem.weaponId] || WEAPONS.fists;
  }

  public fireWeapon(p: PlayerEntity) {
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

    p.fireCooldown = wep.fireDelayMs;

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
      for (const obs of this.obstacles) {
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
        active: true
      });
    }
  }

  private checkMeleeHit(attacker: PlayerEntity, hx: number, hy: number, damage: number) {
    const targets = [this.player, ...this.bots];
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
    for (const b of this.bullets) {
      if (!b.active) continue;

      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      b.x += stepX;
      b.y += stepY;
      b.distanceTraveled += Math.hypot(stepX, stepY);

      if (b.distanceTraveled >= b.maxDistance) {
        b.active = false;
        continue;
      }

      // Check collision with obstacles
      let hitObs = false;
      for (const obs of this.obstacles) {
        if (!obs.active || !obs.collidable) continue;

        if (obs.type === "wall" || obs.type === "crate" || obs.type === "metal_crate") {
          const hw = (obs.width || 40) / 2;
          const hh = (obs.height || 40) / 2;
          if (b.x >= obs.x - hw && b.x <= obs.x + hw && b.y >= obs.y - hh && b.y <= obs.y + hh) {
            b.active = false;
            hitObs = true;
            this.spawnParticle(b.x, b.y, obs.color, 4, 0.2);
            if (obs.destructible) {
              const attacker = b.ownerId === 0 ? this.player : this.bots.find((x) => x.id === b.ownerId);
              this.damageObstacle(obs, b.damage, attacker);
            }
            break;
          }
        } else {
          // Trees & Rocks
          const dist = Math.hypot(b.x - obs.x, b.y - obs.y);
          if (dist < obs.radius) {
            b.active = false;
            hitObs = true;
            this.spawnParticle(b.x, b.y, obs.color, 4, 0.2);
            if (obs.destructible) {
              const attacker = b.ownerId === 0 ? this.player : this.bots.find((x) => x.id === b.ownerId);
              this.damageObstacle(obs, b.damage, attacker);
            }
            break;
          }
        }
      }

      if (hitObs) continue;

      // Check collision with players
      const allPlayers = [this.player, ...this.bots];
      for (const target of allPlayers) {
        if (target.id === b.ownerId || !target.active) continue;

        const dist = Math.hypot(b.x - target.x, b.y - target.y);
        if (dist < PLAYER_RADIUS + b.radius) {
          b.active = false;
          const attacker = b.ownerId === 0 ? this.player : this.bots.find((x) => x.id === b.ownerId);
          const wep = attacker ? this.getActiveWeapon(attacker) : WEAPONS.m9;
          this.damagePlayer(target, b.damage, attacker, wep.name);
          this.spawnBlood(target.x, target.y);
          break;
        }
      }
    }

    // Clean inactive bullets
    this.bullets = this.bullets.filter((b) => b.active);
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
    // Damage reduction from Vest & Helmet
    const vestRed = ARMOR_DAMAGE_REDUCTION[target.vestTier] || 0;
    const helmetRed = HELMET_DAMAGE_REDUCTION[target.helmetTier] || 0;
    const totalReduction = Math.min(0.7, vestRed + helmetRed * 0.5);
    const actualDamage = Math.max(1, rawDamage * (1 - totalReduction));

    target.health -= actualDamage;

    if (attacker) {
      attacker.damageDealt += actualDamage;
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
  public reloadWeapon(p: PlayerEntity) {
    if (p.isReloading) return;
    const item = p.weapons[p.activeSlot];
    if (!item || item.weaponId === "fists") return;

    const wep = WEAPONS[item.weaponId];
    if (!wep.ammoType) return;

    const needed = wep.magSize - item.curAmmo;
    const available = p.ammo[wep.ammoType] || 0;

    if (needed > 0 && available > 0) {
      p.isReloading = true;
      p.reloadTimer = wep.reloadTimeMs;
      if (!p.isBot) {
        this.audio.playReload();
      }
    }
  }

  private finishReload(p: PlayerEntity) {
    p.isReloading = false;
    const item = p.weapons[p.activeSlot];
    if (!item) return;

    const wep = WEAPONS[item.weaponId];
    if (!wep.ammoType) return;

    const needed = wep.magSize - item.curAmmo;
    const toLoad = Math.min(needed, p.ammo[wep.ammoType] || 0);

    item.curAmmo += toLoad;
    p.ammo[wep.ammoType] -= toLoad;
  }

  // Medical Consumption
  public useMed(p: PlayerEntity, type: "bandage" | "medkit" | "soda" | "pills") {
    if (p.isUsingMed) return;

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
    p.isUsingMed = false;
    if (!p.medType) return;

    const type = p.medType;
    p.medType = null;

    if (type === "bandage") {
      p.meds.bandages--;
      p.health = Math.min(75, p.health + 15);
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
    this.player.isReloading = false;
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
          item.active = false;
          if (!p.isBot) {
            this.audio.playPickup();
          }
        }
      }
    }
  }

  private tryCollectLoot(p: PlayerEntity, item: GroundLoot): boolean {
    if (item.type === "ammo" && item.ammoType) {
      const maxCap = MAX_AMMO_BY_BACKPACK[p.backpackTier][item.ammoType];
      const cur = p.ammo[item.ammoType];
      if (cur < maxCap) {
        const canTake = Math.min(item.amount, maxCap - cur);
        p.ammo[item.ammoType] += canTake;
        return true;
      }
      return false;
    }

    if (item.type === "weapon" && item.weaponId) {
      const wepDef = WEAPONS[item.weaponId];
      // If primary empty
      if (!p.weapons[0]) {
        p.weapons[0] = { weaponId: item.weaponId, curAmmo: wepDef.magSize };
        p.activeSlot = 0;
        return true;
      }
      // If secondary empty
      if (!p.weapons[1]) {
        p.weapons[1] = { weaponId: item.weaponId, curAmmo: wepDef.magSize };
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

    if (item.type === "bandage") {
      if (p.meds.bandages < 15) {
        p.meds.bandages += item.amount;
        return true;
      }
      return false;
    }

    if (item.type === "medkit") {
      if (p.meds.medkits < 3) {
        p.meds.medkits += item.amount;
        return true;
      }
      return false;
    }

    if (item.type === "soda") {
      if (p.meds.sodas < 6) {
        p.meds.sodas += item.amount;
        return true;
      }
      return false;
    }

    if (item.type === "pills") {
      if (p.meds.pills < 4) {
        p.meds.pills += item.amount;
        return true;
      }
      return false;
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
    this.stop();
    this.audio.dispose();
  }
}
