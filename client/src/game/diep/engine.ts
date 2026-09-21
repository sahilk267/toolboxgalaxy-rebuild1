// Diep Arena - High-Performance Physics, AI, Object Pooling & Render Loop Engine
import {
  ARENA_SIZE,
  NEST_RADIUS,
  MAX_LEVEL,
  LEVEL_XP,
  TANK_CLASSES,
  EVOLUTION_PATHS,
  COLORS,
  getLevelFromScore,
  isStatPointLevel
} from "./constants";
import type {
  TankEntity,
  TankClassId,
  TankStats,
  StatKey,
  ShapeEntity,
  ShapeType,
  BulletEntity,
  DroneEntity,
  ParticleEntity,
  LeaderboardEntry,
  KillFeedItem
} from "./types";
import { DiepAudio } from "./audio";

export interface EngineCallbacks {
  onPlayerUpdate: (player: TankEntity) => void;
  onLeaderboardUpdate: (entries: LeaderboardEntry[]) => void;
  onKillFeed: (item: KillFeedItem) => void;
  onEvolutionChoices: (choices: TankClassId[]) => void;
  onGameOver: (finalScore: number, level: number, classId: TankClassId, kills: number) => void;
}

const BOT_NAMES = [
  "Nova", "Apex", "Viper", "Sentinel", "Titan", "Striker", "Ghost", "Nebula",
  "Shadow", "Vector", "Eclipse", "Rogue", "Blaze", "Vortex", "Cipher", "Hydra"
];

export class DiepEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public audio: DiepAudio;
  public callbacks: EngineCallbacks;

  public isRunning = false;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Viewport / Camera
  public cameraX = ARENA_SIZE / 2;
  public cameraY = ARENA_SIZE / 2;
  public cameraZoom = 1;
  public targetZoom = 1;

  // Entities
  public player: TankEntity;
  public bots: TankEntity[] = [];
  public shapes: ShapeEntity[] = [];
  public bullets: BulletEntity[] = [];
  public drones: DroneEntity[] = [];
  public particles: ParticleEntity[] = [];

  // Input State
  public keys: Record<string, boolean> = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    space: false
  };
  public mouseX = 0;
  public mouseY = 0;
  public isMouseDown = false;
  public autoFire = false;
  public autoSpin = false;

  // Mobile virtual joystick offsets (-1..1)
  public moveStickX = 0;
  public moveStickY = 0;
  public aimStickX = 0;
  public aimStickY = 0;
  public isAimingTouch = false;

  // Gameplay Metrics
  public kills = 0;
  private nextEntityId = 1;
  private droneSpawnCooldowns: Record<number, number> = {};

  constructor(canvas: HTMLCanvasElement, audio: DiepAudio, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;
    this.audio = audio;
    this.callbacks = callbacks;

    // Initialize pre-allocated pools
    this.initPools();

    // Spawn Player
    this.player = this.createTank(
      "Player",
      ARENA_SIZE / 2 + (Math.random() - 0.5) * 800,
      ARENA_SIZE / 2 + (Math.random() - 0.5) * 800,
      false,
      COLORS.player
    );

    // Spawn Initial Bots (8 active bots)
    for (let i = 0; i < 8; i++) {
      this.spawnBot();
    }

    // Populate Initial Shapes (200 shapes)
    this.populateInitialShapes(220);
  }

  // Pre-allocate object pools to prevent GC stutter
  private initPools() {
    this.bullets = Array.from({ length: 400 }, (_, i) => ({
      id: i,
      ownerId: 0,
      isBot: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 8,
      health: 10,
      maxHealth: 10,
      damage: 10,
      lifetime: 0,
      color: "#00b2e1",
      active: false
    }));

    this.shapes = Array.from({ length: 280 }, (_, i) => ({
      id: i,
      type: "square",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      vRot: 0.01,
      health: 10,
      maxHealth: 10,
      radius: 14,
      xpValue: 10,
      bodyDamage: 8,
      active: false,
      damagedTimer: 0
    }));

    this.drones = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      ownerId: 0,
      isBot: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
      rotation: 0,
      health: 20,
      maxHealth: 20,
      damage: 15,
      radius: 12,
      active: false,
      damagedTimer: 0
    }));

    this.particles = Array.from({ length: 250 }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 4,
      color: "#ffe869",
      alpha: 0,
      decay: 0.05,
      active: false
    }));
  }

  private createTank(name: string, x: number, y: number, isBot: boolean, color: string): TankEntity {
    return {
      id: this.nextEntityId++,
      name,
      isBot,
      classId: "basic",
      x,
      y,
      vx: 0,
      vy: 0,
      angle: 0,
      targetAngle: 0,
      health: 100,
      maxHealth: 100,
      level: 1,
      score: 0,
      statPoints: 0,
      stats: {
        healthRegen: 0,
        maxHealth: 0,
        bodyDamage: 0,
        bulletSpeed: 0,
        bulletPenetration: 0,
        bulletDamage: 0,
        reload: 0,
        movementSpeed: 0
      },
      barrelCooldowns: [0, 0, 0, 0, 0, 0, 0, 0],
      barrelRecoils: [0, 0, 0, 0, 0, 0, 0, 0],
      damagedTimer: 0,
      color,
      active: true,
      aiState: "farming",
      botThinkTimer: 0
    };
  }

  private spawnBot() {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + " [" + Math.floor(Math.random() * 90 + 10) + "]";
    const botColors = [COLORS.botEnemy, COLORS.botTeamGreen, COLORS.botTeamPurple, "#f18d4e"];
    const color = botColors[Math.floor(Math.random() * botColors.length)];

    const x = Math.random() * (ARENA_SIZE - 200) + 100;
    const y = Math.random() * (ARENA_SIZE - 200) + 100;
    const bot = this.createTank(name, x, y, true, color);

    // Initial random score for bots so arena has high and low tier enemies
    const initialScore = Math.floor(Math.random() * 32000);
    this.addScore(bot, initialScore, false);

    // Auto assign bot stats and evolution based on starting level
    this.autoLevelBot(bot);

    this.bots.push(bot);
  }

  private autoLevelBot(bot: TankEntity) {
    // Randomly assign available stat points
    const statKeys: StatKey[] = [
      "healthRegen", "maxHealth", "bodyDamage", "bulletSpeed",
      "bulletPenetration", "bulletDamage", "reload", "movementSpeed"
    ];

    while (bot.statPoints > 0) {
      const key = statKeys[Math.floor(Math.random() * statKeys.length)];
      if (bot.stats[key] < 7) {
        bot.stats[key]++;
        bot.statPoints--;
      } else {
        break;
      }
    }

    // Evolve bot if high enough level
    if (bot.level >= 15 && bot.classId === "basic") {
      const t2Options = EVOLUTION_PATHS.basic;
      bot.classId = t2Options[Math.floor(Math.random() * t2Options.length)];
    }
    if (bot.level >= 30) {
      const t3Options = EVOLUTION_PATHS[bot.classId];
      if (t3Options && t3Options.length > 0) {
        bot.classId = t3Options[Math.floor(Math.random() * t3Options.length)];
      }
    }
    if (bot.level >= 45) {
      const t4Options = EVOLUTION_PATHS[bot.classId];
      if (t4Options && t4Options.length > 0) {
        bot.classId = t4Options[Math.floor(Math.random() * t4Options.length)];
      }
    }
    this.recalculateMaxHealth(bot);
  }

  private populateInitialShapes(count: number) {
    // Always guarantee Alpha Pentagon in center nest
    this.spawnShapeSpecific("alpha-pentagon", ARENA_SIZE / 2, ARENA_SIZE / 2);

    for (let i = 0; i < count; i++) {
      this.spawnRandomShape();
    }
  }

  private spawnShapeSpecific(type: ShapeType, x: number, y: number) {
    const slot = this.shapes.find((s) => !s.active);
    if (!slot) return;

    slot.active = true;
    slot.type = type;
    slot.x = x;
    slot.y = y;
    slot.vx = (Math.random() - 0.5) * 0.4;
    slot.vy = (Math.random() - 0.5) * 0.4;
    slot.rotation = Math.random() * Math.PI * 2;
    slot.vRot = (Math.random() - 0.5) * 0.03;
    slot.damagedTimer = 0;

    switch (type) {
      case "square":
        slot.radius = 14;
        slot.maxHealth = 10;
        slot.health = 10;
        slot.xpValue = 10;
        slot.bodyDamage = 8;
        break;
      case "triangle":
        slot.radius = 16;
        slot.maxHealth = 30;
        slot.health = 30;
        slot.xpValue = 25;
        slot.bodyDamage = 12;
        break;
      case "pentagon":
        slot.radius = 24;
        slot.maxHealth = 100;
        slot.health = 100;
        slot.xpValue = 130;
        slot.bodyDamage = 18;
        break;
      case "alpha-pentagon":
        slot.radius = 70;
        slot.maxHealth = 3000;
        slot.health = 3000;
        slot.xpValue = 3000;
        slot.bodyDamage = 45;
        break;
      case "crasher":
        slot.radius = 11;
        slot.maxHealth = 18;
        slot.health = 18;
        slot.xpValue = 15;
        slot.bodyDamage = 14;
        break;
      case "green-square":
        slot.radius = 14;
        slot.maxHealth = 200;
        slot.health = 200;
        slot.xpValue = 1000;
        slot.bodyDamage = 10;
        break;
    }
  }

  private spawnRandomShape() {
    const rand = Math.random();
    const isNest = Math.random() < 0.25;

    let x: number;
    let y: number;

    if (isNest) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (NEST_RADIUS - 60);
      x = ARENA_SIZE / 2 + Math.cos(angle) * dist;
      y = ARENA_SIZE / 2 + Math.sin(angle) * dist;

      if (rand < 0.35) {
        this.spawnShapeSpecific("crasher", x, y);
      } else {
        this.spawnShapeSpecific("pentagon", x, y);
      }
    } else {
      x = Math.random() * (ARENA_SIZE - 120) + 60;
      y = Math.random() * (ARENA_SIZE - 120) + 60;

      if (rand < 0.001) {
        this.spawnShapeSpecific("green-square", x, y);
      } else if (rand < 0.65) {
        this.spawnShapeSpecific("square", x, y);
      } else if (rand < 0.88) {
        this.spawnShapeSpecific("triangle", x, y);
      } else {
        this.spawnShapeSpecific("pentagon", x, y);
      }
    }
  }

  // Calculate Tank Computed Stats
  public getComputedStats(tank: TankEntity) {
    const cDef = TANK_CLASSES[tank.classId] || TANK_CLASSES.basic;
    return {
      maxHealth: 100 + tank.stats.maxHealth * 20,
      regenRate: 0.2 + tank.stats.healthRegen * 0.8, // HP per second
      bodyDamage: 20 + tank.stats.bodyDamage * 7,
      bulletSpeed: 5.5 + tank.stats.bulletSpeed * 0.85,
      bulletPenetration: 15 + tank.stats.bulletPenetration * 12,
      bulletDamage: 14 + tank.stats.bulletDamage * 6,
      reloadMs: Math.max(60, cDef.baseReload * Math.pow(0.9, tank.stats.reload)),
      moveSpeed: 3.2 + tank.stats.movementSpeed * 0.45,
      radius: cDef.bodyRadius
    };
  }

  public recalculateMaxHealth(tank: TankEntity) {
    const stats = this.getComputedStats(tank);
    const ratio = tank.health / tank.maxHealth;
    tank.maxHealth = stats.maxHealth;
    tank.health = Math.min(tank.maxHealth, tank.maxHealth * ratio);
  }

  // Invest a stat point
  public upgradeStat(key: StatKey): boolean {
    if (this.player.statPoints <= 0) return false;
    if (this.player.stats[key] >= 7) return false;

    this.player.stats[key]++;
    this.player.statPoints--;
    this.recalculateMaxHealth(this.player);
    this.audio.playUpgrade();
    this.callbacks.onPlayerUpdate(this.player);
    return true;
  }

  // Evolve to chosen class
  public evolve(nextClassId: TankClassId) {
    const allowed = EVOLUTION_PATHS[this.player.classId] || [];
    if (!allowed.includes(nextClassId)) return;

    this.player.classId = nextClassId;
    this.player.barrelCooldowns = [0, 0, 0, 0, 0, 0, 0, 0];
    this.player.barrelRecoils = [0, 0, 0, 0, 0, 0, 0, 0];

    const def = TANK_CLASSES[nextClassId];
    if (def.fovMultiplier) {
      this.targetZoom = 1 / def.fovMultiplier;
    } else {
      this.targetZoom = 1;
    }

    this.recalculateMaxHealth(this.player);
    this.audio.playLevelUp();
    this.callbacks.onPlayerUpdate(this.player);
    this.callbacks.onEvolutionChoices([]);
  }

  public addScore(tank: TankEntity, amount: number, playSound = true) {
    const oldLevel = tank.level;
    tank.score += amount;
    tank.level = Math.min(MAX_LEVEL, getLevelFromScore(tank.score));

    if (tank.level > oldLevel) {
      // Award stat points for each level up
      let pointsAwarded = 0;
      for (let lvl = oldLevel + 1; lvl <= tank.level; lvl++) {
        if (isStatPointLevel(lvl)) {
          pointsAwarded++;
        }
      }
      tank.statPoints += pointsAwarded;

      if (!tank.isBot) {
        if (playSound) this.audio.playLevelUp();
        this.checkEvolutionChoices();
      }
    }
  }

  private checkEvolutionChoices() {
    if (this.player.level >= 15 && this.player.classId === "basic") {
      this.callbacks.onEvolutionChoices(EVOLUTION_PATHS.basic);
    } else if (this.player.level >= 30 && TANK_CLASSES[this.player.classId]?.tier === 2) {
      this.callbacks.onEvolutionChoices(EVOLUTION_PATHS[this.player.classId] || []);
    } else if (this.player.level >= 45 && TANK_CLASSES[this.player.classId]?.tier === 3) {
      this.callbacks.onEvolutionChoices(EVOLUTION_PATHS[this.player.classId] || []);
    } else {
      this.callbacks.onEvolutionChoices([]);
    }
  }

  // Particle Emitter
  private emitParticles(x: number, y: number, color: string, count: number, maxSpeed = 3) {
    for (let i = 0; i < count; i++) {
      const p = this.particles.find((item) => !item.active);
      if (!p) break;
      p.active = true;
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * maxSpeed + 0.5;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.radius = Math.random() * 4 + 2;
      p.color = color;
      p.alpha = 1;
      p.decay = Math.random() * 0.04 + 0.03;
    }
  }

  // Fire barrel bullet
  private fireBullet(tank: TankEntity, barrelIndex: number) {
    const cDef = TANK_CLASSES[tank.classId] || TANK_CLASSES.basic;
    const bDef = cDef.barrels[barrelIndex];
    if (!bDef) return;

    const stats = this.getComputedStats(tank);
    const barrelAngle = tank.angle + bDef.angle;
    const bLength = bDef.length * stats.radius;
    const offsetLat = bDef.offsetLateral || 0;

    // Bullet start point at tip of barrel
    const perpAngle = tank.angle + Math.PI / 2;
    const spawnX = tank.x + Math.cos(tank.angle) * (stats.radius * 0.5) + Math.cos(barrelAngle) * bLength + Math.cos(perpAngle) * offsetLat;
    const spawnY = tank.y + Math.sin(tank.angle) * (stats.radius * 0.5) + Math.sin(barrelAngle) * bLength + Math.sin(perpAngle) * offsetLat;

    // Apply barrel recoil pushback to tank
    const recoilForce = bDef.recoil * 3.5;
    tank.vx -= Math.cos(barrelAngle) * recoilForce;
    tank.vy -= Math.sin(barrelAngle) * recoilForce;
    tank.barrelRecoils[barrelIndex] = 1;

    // Allocate bullet from pool
    const slot = this.bullets.find((b) => !b.active);
    if (!slot) return;

    const speed = stats.bulletSpeed * (bDef.bulletSpeedMult || 1);
    const spread = (Math.random() - 0.5) * 0.08;
    const finalAngle = barrelAngle + spread;

    slot.active = true;
    slot.ownerId = tank.id;
    slot.isBot = tank.isBot;
    slot.x = spawnX;
    slot.y = spawnY;
    slot.vx = Math.cos(finalAngle) * speed + tank.vx * 0.2;
    slot.vy = Math.sin(finalAngle) * speed + tank.vy * 0.2;
    slot.radius = Math.max(5, (bDef.width * stats.radius * 0.5) * (bDef.bulletSizeMult || 1));
    slot.damage = stats.bulletDamage * (bDef.bulletDamageMult || 1);
    slot.health = stats.bulletPenetration * (bDef.bulletDamageMult || 1);
    slot.maxHealth = slot.health;
    slot.lifetime = 140; // ~2.3 seconds
    slot.color = tank.color;

    if (!tank.isBot) {
      this.audio.playShoot(bDef.bulletSizeMult || 1);
    }
  }

  // Spawn Drone for Overseer / Overlord
  private spawnDrone(tank: TankEntity) {
    const cDef = TANK_CLASSES[tank.classId];
    if (!cDef.hasDrones) return;

    // Check active drones count for this tank
    const activeDrones = this.drones.filter((d) => d.active && d.ownerId === tank.id);
    if (activeDrones.length >= (cDef.maxDrones || 6)) return;

    const slot = this.drones.find((d) => !d.active);
    if (!slot) return;

    const stats = this.getComputedStats(tank);
    const spawnAngle = Math.random() * Math.PI * 2;
    slot.active = true;
    slot.ownerId = tank.id;
    slot.isBot = tank.isBot;
    slot.x = tank.x + Math.cos(spawnAngle) * (stats.radius + 15);
    slot.y = tank.y + Math.sin(spawnAngle) * (stats.radius + 15);
    slot.vx = Math.cos(spawnAngle) * 3;
    slot.vy = Math.sin(spawnAngle) * 3;
    slot.targetX = tank.x;
    slot.targetY = tank.y;
    slot.rotation = spawnAngle;
    slot.health = 30 + tank.stats.bulletPenetration * 10;
    slot.maxHealth = slot.health;
    slot.damage = 18 + tank.stats.bulletDamage * 7;
    slot.radius = 13;
    slot.damagedTimer = 0;
  }

  // Main Simulation Loop
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
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // PHYSICS & GAMEPLAY UPDATE
  private update(dt: number) {
    if (!this.player.active) return;

    // 1. Process Player Input & Movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys.w || this.keys.ArrowUp) moveY -= 1;
    if (this.keys.s || this.keys.ArrowDown) moveY += 1;
    if (this.keys.a || this.keys.ArrowLeft) moveX -= 1;
    if (this.keys.d || this.keys.ArrowRight) moveX += 1;

    // Apply mobile virtual stick if active
    if (Math.abs(this.moveStickX) > 0.05 || Math.abs(this.moveStickY) > 0.05) {
      moveX = this.moveStickX;
      moveY = this.moveStickY;
    }

    const pStats = this.getComputedStats(this.player);
    const mag = Math.hypot(moveX, moveY);
    if (mag > 0.01) {
      const normX = moveX / Math.max(1, mag);
      const normY = moveY / Math.max(1, mag);
      this.player.vx += normX * pStats.moveSpeed * 1.5;
      this.player.vy += normY * pStats.moveSpeed * 1.5;
    }

    // Aim Angle Calculation
    if (this.isAimingTouch && (Math.abs(this.aimStickX) > 0.1 || Math.abs(this.aimStickY) > 0.1)) {
      this.player.angle = Math.atan2(this.aimStickY, this.aimStickX);
    } else if (this.autoSpin) {
      this.player.angle += 0.04;
    } else {
      // Screen to world mouse coordinates
      const worldMouseX = (this.mouseX - this.canvas.width / 2) / this.cameraZoom + this.cameraX;
      const worldMouseY = (this.mouseY - this.canvas.height / 2) / this.cameraZoom + this.cameraY;
      this.player.angle = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);
    }

    // Firing trigger
    const shouldFire = this.isMouseDown || this.keys.space || this.autoFire || this.isAimingTouch;
    this.updateTankFiring(this.player, shouldFire, dt);

    // Update Player & Bots movement
    this.updateTankPhysics(this.player, dt);
    for (const bot of this.bots) {
      if (bot.active) {
        this.updateBotAI(bot, dt);
        this.updateTankPhysics(bot, dt);
      }
    }

    // 2. Update Drones
    this.updateDrones(dt);

    // 3. Update Bullets
    this.updateBullets();

    // 4. Update Shapes (drift & crasher AI)
    this.updateShapes(dt);

    // 5. Collisions Resolution
    this.resolveCollisions();

    // 6. Update Particles
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.alpha <= 0) p.active = false;
    }

    // 7. Respawn Shapes & Maintain Bot Population
    if (this.shapes.filter((s) => s.active).length < 240) {
      this.spawnRandomShape();
    }
    if (this.bots.filter((b) => b.active).length < 8) {
      this.spawnBot();
    }

    // 8. Camera Smoothing
    this.cameraX += (this.player.x - this.cameraX) * 0.12;
    this.cameraY += (this.player.y - this.cameraY) * 0.12;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.05;

    // 9. Throttle UI updates (every 6 frames)
    if (Math.random() < 0.16) {
      this.callbacks.onPlayerUpdate(this.player);
      this.updateLeaderboard();
    }
  }

  // Update Tank Firing Mechanics
  private updateTankFiring(tank: TankEntity, firing: boolean, dt: number) {
    const cDef = TANK_CLASSES[tank.classId] || TANK_CLASSES.basic;
    const stats = this.getComputedStats(tank);

    // Handle Overseer / Overlord drone generation
    if (cDef.hasDrones) {
      const coolKey = tank.id;
      this.droneSpawnCooldowns[coolKey] = (this.droneSpawnCooldowns[coolKey] || 0) - dt * 1000;
      if (this.droneSpawnCooldowns[coolKey] <= 0) {
        this.spawnDrone(tank);
        this.droneSpawnCooldowns[coolKey] = stats.reloadMs;
      }
      return;
    }

    // Barrel guns
    for (let i = 0; i < cDef.barrels.length; i++) {
      tank.barrelCooldowns[i] = Math.max(0, (tank.barrelCooldowns[i] || 0) - dt * 1000);
      tank.barrelRecoils[i] = Math.max(0, (tank.barrelRecoils[i] || 0) - dt * 6);

      if (firing && tank.barrelCooldowns[i] <= 0) {
        this.fireBullet(tank, i);
        tank.barrelCooldowns[i] = stats.reloadMs;
      }
    }
  }

  // Update Tank Position & Damping
  private updateTankPhysics(tank: TankEntity, dt: number) {
    const stats = this.getComputedStats(tank);

    tank.x += tank.vx;
    tank.y += tank.vy;
    tank.vx *= 0.88;
    tank.vy *= 0.88;

    // Bounds constraint
    const r = stats.radius;
    tank.x = Math.max(r, Math.min(ARENA_SIZE - r, tank.x));
    tank.y = Math.max(r, Math.min(ARENA_SIZE - r, tank.y));

    // Natural Passive Health Regeneration
    if (tank.damagedTimer > 0) {
      tank.damagedTimer -= dt;
    } else {
      tank.health = Math.min(tank.maxHealth, tank.health + stats.regenRate * dt * 25);
    }
  }

  // Intelligent Bot AI (Roam, Farm, Attack, Evade)
  private updateBotAI(bot: TankEntity, dt: number) {
    bot.botThinkTimer = (bot.botThinkTimer || 0) - dt;
    const stats = this.getComputedStats(bot);

    // Find closest target (Player or Shapes)
    const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
    const seesPlayer = this.player.active && distToPlayer < 650;

    if (seesPlayer) {
      bot.aiState = bot.health < bot.maxHealth * 0.35 && this.player.level > bot.level ? "fleeing" : "attacking";
    } else {
      bot.aiState = "farming";
    }

    if (bot.aiState === "attacking") {
      // Lead target aim
      const leadDist = distToPlayer / stats.bulletSpeed;
      const targetX = this.player.x + this.player.vx * leadDist * 0.5;
      const targetY = this.player.y + this.player.vy * leadDist * 0.5;
      bot.angle = Math.atan2(targetY - bot.y, targetX - bot.x);

      // Circle-strafe player
      const approachAngle = bot.angle + (distToPlayer > 300 ? 0.3 : Math.PI - 0.3);
      bot.vx += Math.cos(approachAngle) * stats.moveSpeed * 0.4;
      bot.vy += Math.sin(approachAngle) * stats.moveSpeed * 0.4;

      this.updateTankFiring(bot, true, dt);
    } else if (bot.aiState === "fleeing") {
      // Run away from player
      const fleeAngle = Math.atan2(bot.y - this.player.y, bot.x - this.player.x);
      bot.vx += Math.cos(fleeAngle) * stats.moveSpeed * 0.5;
      bot.vy += Math.sin(fleeAngle) * stats.moveSpeed * 0.5;
      bot.angle = fleeAngle + Math.PI; // shoot backwards while running!
      this.updateTankFiring(bot, true, dt);
    } else {
      // Farm closest shape
      let closestShape: ShapeEntity | null = null;
      let minDist = 500;
      for (const s of this.shapes) {
        if (!s.active || s.type === "alpha-pentagon") continue;
        const d = Math.hypot(s.x - bot.x, s.y - bot.y);
        if (d < minDist) {
          minDist = d;
          closestShape = s;
        }
      }

      if (closestShape) {
        bot.angle = Math.atan2(closestShape.y - bot.y, closestShape.x - bot.x);
        if (minDist > 140) {
          bot.vx += Math.cos(bot.angle) * stats.moveSpeed * 0.35;
          bot.vy += Math.sin(bot.angle) * stats.moveSpeed * 0.35;
        }
        this.updateTankFiring(bot, true, dt);
      } else {
        // Wander
        bot.angle += (Math.random() - 0.5) * 0.05;
        bot.vx += Math.cos(bot.angle) * stats.moveSpeed * 0.2;
        bot.vy += Math.sin(bot.angle) * stats.moveSpeed * 0.2;
      }
    }
  }

  // Update Drones Swarm (Overseer & Overlord)
  private updateDrones(dt: number) {
    for (const drone of this.drones) {
      if (!drone.active) continue;

      const owner = drone.isBot
        ? this.bots.find((b) => b.id === drone.ownerId && b.active)
        : this.player.active
        ? this.player
        : null;

      if (!owner) {
        drone.active = false;
        continue;
      }

      // Target acquisition: seek enemy or stay near owner
      let targetX = owner.x;
      let targetY = owner.y;

      if (!drone.isBot) {
        // Player's drones follow cursor or attack closest enemy
        const worldMouseX = (this.mouseX - this.canvas.width / 2) / this.cameraZoom + this.cameraX;
        const worldMouseY = (this.mouseY - this.canvas.height / 2) / this.cameraZoom + this.cameraY;
        targetX = worldMouseX;
        targetY = worldMouseY;
      } else {
        // Bot drone attacks bot's target
        targetX = this.player.x;
        targetY = this.player.y;
      }

      const dx = targetX - drone.x;
      const dy = targetY - drone.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 15) {
        drone.vx += (dx / dist) * 0.6;
        drone.vy += (dy / dist) * 0.6;
      }

      drone.x += drone.vx;
      drone.y += drone.vy;
      drone.vx *= 0.94;
      drone.vy *= 0.94;
      drone.rotation = Math.atan2(drone.vy, drone.vx);

      if (drone.damagedTimer > 0) drone.damagedTimer -= dt;
    }
  }

  // Update Bullets
  private updateBullets() {
    for (const b of this.bullets) {
      if (!b.active) continue;

      b.x += b.vx;
      b.y += b.vy;
      b.lifetime--;

      // Boundary check
      if (b.x < 0 || b.x > ARENA_SIZE || b.y < 0 || b.y > ARENA_SIZE || b.lifetime <= 0 || b.health <= 0) {
        b.active = false;
      }
    }
  }

  // Update Shapes & Crashers
  private updateShapes(dt: number) {
    for (const s of this.shapes) {
      if (!s.active) continue;

      if (s.type === "crasher") {
        // Crasher Pink Mini-Triangles swarm nearby tanks in the nest
        let closestTank: TankEntity | null = null;
        let minDist = 380;

        const allTanks = [this.player, ...this.bots].filter((t) => t.active);
        for (const t of allTanks) {
          const d = Math.hypot(t.x - s.x, t.y - s.y);
          if (d < minDist) {
            minDist = d;
            closestTank = t;
          }
        }

        if (closestTank) {
          const angle = Math.atan2(closestTank.y - s.y, closestTank.x - s.x);
          s.vx += Math.cos(angle) * 0.45;
          s.vy += Math.sin(angle) * 0.45;
          s.rotation = angle;
        }
      }

      s.x += s.vx;
      s.y += s.vy;
      s.rotation += s.vRot;
      s.vx *= 0.98;
      s.vy *= 0.98;

      // Soft bounce on arena boundaries
      if (s.x < s.radius) { s.x = s.radius; s.vx = Math.abs(s.vx); }
      if (s.x > ARENA_SIZE - s.radius) { s.x = ARENA_SIZE - s.radius; s.vx = -Math.abs(s.vx); }
      if (s.y < s.radius) { s.y = s.radius; s.vy = Math.abs(s.vy); }
      if (s.y > ARENA_SIZE - s.radius) { s.y = ARENA_SIZE - s.radius; s.vy = -Math.abs(s.vy); }

      if (s.damagedTimer > 0) s.damagedTimer -= dt;
    }
  }

  // Comprehensive Collision Detection & Resolution
  private resolveCollisions() {
    const allTanks = [this.player, ...this.bots].filter((t) => t.active);

    // 1. Bullets vs Shapes
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const s of this.shapes) {
        if (!s.active) continue;
        const dist = Math.hypot(b.x - s.x, b.y - s.y);
        if (dist < b.radius + s.radius) {
          // Collision!
          const damageToShape = Math.min(b.damage, b.health);
          const damageToBullet = s.bodyDamage * 0.8;

          s.health -= damageToShape;
          s.damagedTimer = 0.12;
          b.health -= damageToBullet;

          // Push shape
          s.vx += b.vx * 0.08;
          s.vy += b.vy * 0.08;

          if (!b.isBot) this.audio.playHit();

          if (s.health <= 0) {
            // Shape Destroyed!
            s.active = false;
            this.emitParticles(s.x, s.y, COLORS[s.type === "green-square" ? "greenSquare" : s.type === "alpha-pentagon" ? "alphaPentagon" : s.type], 8);
            if (!b.isBot) this.audio.playPop();

            const owner = allTanks.find((t) => t.id === b.ownerId);
            if (owner) {
              this.addScore(owner, s.xpValue);
            }
          }

          if (b.health <= 0) {
            b.active = false;
            break;
          }
        }
      }
    }

    // 2. Bullets vs Tanks
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const tank of allTanks) {
        if (!tank.active || tank.id === b.ownerId) continue;
        const stats = this.getComputedStats(tank);
        const dist = Math.hypot(b.x - tank.x, b.y - tank.y);
        if (dist < b.radius + stats.radius) {
          // Bullet hit tank!
          tank.health -= b.damage;
          tank.damagedTimer = 3.0; // Reset passive regen timer
          b.health -= 15;

          // Recoil push on hit
          tank.vx += b.vx * 0.12;
          tank.vy += b.vy * 0.12;

          this.emitParticles(b.x, b.y, b.color, 4);
          if (!b.isBot || tank.id === this.player.id) this.audio.playHit();

          if (b.health <= 0) b.active = false;

          if (tank.health <= 0) {
            this.eliminateTank(tank, b.ownerId);
          }
        }
      }
    }

    // 3. Drones vs Shapes & Tanks
    for (const drone of this.drones) {
      if (!drone.active) continue;

      // Drone vs Shapes
      for (const s of this.shapes) {
        if (!s.active) continue;
        if (Math.hypot(drone.x - s.x, drone.y - s.y) < drone.radius + s.radius) {
          s.health -= drone.damage;
          drone.health -= s.bodyDamage * 0.5;
          s.damagedTimer = 0.12;
          if (s.health <= 0) {
            s.active = false;
            const owner = allTanks.find((t) => t.id === drone.ownerId);
            if (owner) this.addScore(owner, s.xpValue);
          }
          if (drone.health <= 0) drone.active = false;
          break;
        }
      }

      // Drone vs Tanks
      for (const tank of allTanks) {
        if (!tank.active || tank.id === drone.ownerId) continue;
        const stats = this.getComputedStats(tank);
        if (Math.hypot(drone.x - tank.x, drone.y - tank.y) < drone.radius + stats.radius) {
          tank.health -= drone.damage;
          drone.health -= stats.bodyDamage * 0.5;
          tank.damagedTimer = 3.0;
          if (drone.health <= 0) drone.active = false;
          if (tank.health <= 0) {
            this.eliminateTank(tank, drone.ownerId);
          }
          break;
        }
      }
    }

    // 4. Tank vs Shape Physical Collision
    for (const tank of allTanks) {
      const stats = this.getComputedStats(tank);
      for (const s of this.shapes) {
        if (!s.active) continue;
        const dist = Math.hypot(tank.x - s.x, tank.y - s.y);
        if (dist < stats.radius + s.radius) {
          // Elastic bounce
          const angle = Math.atan2(s.y - tank.y, s.x - tank.x);
          tank.vx -= Math.cos(angle) * 2;
          tank.vy -= Math.sin(angle) * 2;
          s.vx += Math.cos(angle) * 3;
          s.vy += Math.sin(angle) * 3;

          // Body damage collision
          tank.health -= s.bodyDamage;
          s.health -= stats.bodyDamage;
          tank.damagedTimer = 3.0;
          s.damagedTimer = 0.12;

          if (s.health <= 0) {
            s.active = false;
            this.addScore(tank, s.xpValue);
            this.emitParticles(s.x, s.y, COLORS[s.type === "green-square" ? "greenSquare" : s.type === "alpha-pentagon" ? "alphaPentagon" : s.type], 8);
          }
          if (tank.health <= 0) {
            this.eliminateTank(tank, 0); // Environmental kill
          }
        }
      }
    }

    // 5. Tank vs Tank Ramming Collision
    for (let i = 0; i < allTanks.length; i++) {
      for (let j = i + 1; j < allTanks.length; j++) {
        const t1 = allTanks[i];
        const t2 = allTanks[j];
        const s1 = this.getComputedStats(t1);
        const s2 = this.getComputedStats(t2);
        const dist = Math.hypot(t1.x - t2.x, t1.y - t2.y);
        if (dist < s1.radius + s2.radius) {
          const angle = Math.atan2(t2.y - t1.y, t2.x - t1.x);
          t1.vx -= Math.cos(angle) * 3;
          t1.vy -= Math.sin(angle) * 3;
          t2.vx += Math.cos(angle) * 3;
          t2.vy += Math.sin(angle) * 3;

          t1.health -= s2.bodyDamage * 0.1;
          t2.health -= s1.bodyDamage * 0.1;
          t1.damagedTimer = 3.0;
          t2.damagedTimer = 3.0;

          if (t1.health <= 0) this.eliminateTank(t1, t2.id);
          if (t2.health <= 0) this.eliminateTank(t2, t1.id);
        }
      }
    }
  }

  // Handle Tank Destruction
  private eliminateTank(victim: TankEntity, killerId: number) {
    victim.active = false;
    this.emitParticles(victim.x, victim.y, victim.color, 24, 6);

    const allTanks = [this.player, ...this.bots];
    const killer = allTanks.find((t) => t.id === killerId);

    if (killer) {
      // Award 40% of victim's score to killer
      const bonusXP = Math.max(100, Math.floor(victim.score * 0.4));
      this.addScore(killer, bonusXP);

      if (killer.id === this.player.id) {
        this.kills++;
      }

      this.callbacks.onKillFeed({
        id: `${Date.now()}-${Math.random()}`,
        killer: killer.name,
        victim: victim.name,
        killerColor: killer.color,
        victimColor: victim.color,
        timestamp: Date.now()
      });
    }

    if (victim.id === this.player.id) {
      this.audio.playExplode();
      this.callbacks.onGameOver(this.player.score, this.player.level, this.player.classId, this.kills);
    } else {
      this.audio.playPop();
    }
  }

  // Generate Real-time Top 10 Leaderboard
  private updateLeaderboard() {
    const all = [this.player, ...this.bots]
      .filter((t) => t.active)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        name: t.name,
        score: t.score,
        classId: t.classId,
        isPlayer: t.id === this.player.id,
        color: t.color
      }));

    this.callbacks.onLeaderboardUpdate(all);
  }

  // CANVAS 2D RENDERER (DIEP.IO SIGNATURE VECTORS)
  private render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Draw Grid Arena Background
    this.drawArenaGrid(ctx);

    // 2. Draw Center Pentagon Nest
    this.drawCenterNest(ctx);

    // 3. Draw Shapes
    this.drawShapes(ctx);

    // 4. Draw Bullets
    this.drawBullets(ctx);

    // 5. Draw Drones
    this.drawDrones(ctx);

    // 6. Draw Tanks (Bots first, Player on top)
    for (const bot of this.bots) {
      if (bot.active) this.drawTank(ctx, bot);
    }
    if (this.player.active) {
      this.drawTank(ctx, this.player);
    }

    // 7. Draw Particles
    this.drawParticles(ctx);

    ctx.restore();
  }

  private drawArenaGrid(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = COLORS.gridBg;
    ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);

    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.gridLine;
    const step = 32;

    const startX = Math.max(0, Math.floor((this.cameraX - (this.canvas.width / 2) / this.cameraZoom) / step) * step);
    const endX = Math.min(ARENA_SIZE, Math.ceil((this.cameraX + (this.canvas.width / 2) / this.cameraZoom) / step) * step);
    const startY = Math.max(0, Math.floor((this.cameraY - (this.canvas.height / 2) / this.cameraZoom) / step) * step);
    const endY = Math.min(ARENA_SIZE, Math.ceil((this.cameraY + (this.canvas.height / 2) / this.cameraZoom) / step) * step);

    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_SIZE);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_SIZE, y);
    }
    ctx.stroke();

    // Arena Outer Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = COLORS.gridBorder;
    ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE);
  }

  private drawCenterNest(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(ARENA_SIZE / 2, ARENA_SIZE / 2, NEST_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.nestBg;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#a9a9c2";
    ctx.stroke();
  }

  private drawShapes(ctx: CanvasRenderingContext2D) {
    for (const s of this.shapes) {
      if (!s.active) continue;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      ctx.lineWidth = s.type === "alpha-pentagon" ? 6 : 3;
      ctx.lineJoin = "round";

      let fill = COLORS[s.type === "green-square" ? "greenSquare" : s.type === "alpha-pentagon" ? "alphaPentagon" : s.type];
      let stroke = COLORS[s.type === "green-square" ? "greenSquareOutline" : s.type === "alpha-pentagon" ? "pentagonOutline" : s.type === "crasher" ? "crasherOutline" : `${s.type}Outline` as keyof typeof COLORS];

      if (s.damagedTimer > 0) {
        fill = "#ffffff";
      }

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;

      if (s.type === "square" || s.type === "green-square") {
        ctx.beginPath();
        ctx.rect(-s.radius, -s.radius, s.radius * 2, s.radius * 2);
        ctx.fill();
        ctx.stroke();
      } else if (s.type === "triangle" || s.type === "crasher") {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          const px = Math.cos(a) * s.radius;
          const py = Math.sin(a) * s.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (s.type === "pentagon" || s.type === "alpha-pentagon") {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          const px = Math.cos(a) * s.radius;
          const py = Math.sin(a) * s.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      // Health Bar if damaged
      if (s.health < s.maxHealth) {
        this.drawHealthBar(ctx, s.x, s.y - s.radius - 10, s.radius * 2, s.health / s.maxHealth);
      }
    }
  }

  private drawBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      if (!b.active) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#333333";
      ctx.stroke();
    }
  }

  private drawDrones(ctx: CanvasRenderingContext2D) {
    for (const d of this.drones) {
      if (!d.active) continue;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);

      ctx.beginPath();
      ctx.moveTo(d.radius * 1.2, 0);
      ctx.lineTo(-d.radius * 0.8, -d.radius);
      ctx.lineTo(-d.radius * 0.4, 0);
      ctx.lineTo(-d.radius * 0.8, d.radius);
      ctx.closePath();

      ctx.fillStyle = d.damagedTimer > 0 ? "#ffffff" : d.isBot ? COLORS.botEnemy : COLORS.player;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#333333";
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawTank(ctx: CanvasRenderingContext2D, tank: TankEntity) {
    const cDef = TANK_CLASSES[tank.classId] || TANK_CLASSES.basic;
    const stats = this.getComputedStats(tank);

    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.angle);

    // 1. Draw Barrels
    for (let i = 0; i < cDef.barrels.length; i++) {
      const bDef = cDef.barrels[i];
      const recoilOffset = (tank.barrelRecoils[i] || 0) * (bDef.length * stats.radius * 0.25);
      const bLen = bDef.length * stats.radius - recoilOffset;
      const bWid = bDef.width * stats.radius;
      const offsetLat = (bDef.offsetLateral || 0);

      ctx.save();
      ctx.rotate(bDef.angle);

      ctx.fillStyle = COLORS.barrel;
      ctx.strokeStyle = COLORS.barrelOutline;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.rect(stats.radius * 0.2, offsetLat - bWid / 2, bLen, bWid);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 2. Draw Tank Body
    ctx.beginPath();
    ctx.arc(0, 0, stats.radius, 0, Math.PI * 2);
    ctx.fillStyle = tank.damagedTimer > 0 ? "#ffffff" : tank.color;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#333333";
    ctx.stroke();

    ctx.restore();

    // 3. Floating Name & Health Bar
    ctx.save();
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeText(`${tank.name} [Lv ${tank.level}]`, tank.x, tank.y - stats.radius - 18);
    ctx.fillText(`${tank.name} [Lv ${tank.level}]`, tank.x, tank.y - stats.radius - 18);

    if (tank.health < tank.maxHealth) {
      this.drawHealthBar(ctx, tank.x, tank.y - stats.radius - 8, stats.radius * 2.2, tank.health / tank.maxHealth);
    }
    ctx.restore();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ratio: number) {
    const barW = Math.max(30, width);
    const barH = 5;
    ctx.fillStyle = "#444444";
    ctx.fillRect(x - barW / 2, y, barW, barH);

    ctx.fillStyle = ratio > 0.4 ? "#85e37d" : "#e35b5b";
    ctx.fillRect(x - barW / 2, y, barW * Math.max(0, Math.min(1, ratio)), barH);

    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW / 2, y, barW, barH);
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }

  // Cleanup on unmount
  public dispose() {
    this.stop();
  }
}
