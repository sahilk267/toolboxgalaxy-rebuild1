import * as THREE from "three";
import {
  WeaponClass,
  WeaponDef,
  BotEntity,
  BoxCollider,
  BulletTracer,
  SparkParticle,
  DamagePopup,
  KillfeedEntry,
  MatchStats,
  KrunkerCallbacks,
} from "./types";
import {
  WEAPON_DEFS,
  PHYSICS,
  BOT_NAMES,
  BOT_COLORS,
} from "./constants";
import { buildKrunkerArena } from "./mapBuilder";
import { buildBotCharacter, buildFPSViewmodel } from "./characterBuilder";
import { krunkerAudio } from "./audio";

export class KrunkerEngine {
  // Three.js Core
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Arena Geometry & Colliders
  public colliders: BoxCollider[] = [];
  public jumpPads: BoxCollider[] = [];
  public spawnPoints: THREE.Vector3[] = [];

  // Player State
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0; // Horizontal look (radians)
  public pitch: number = 0; // Vertical look (radians)
  public health: number = 100;
  public maxHealth: number = 100;
  public isAlive: boolean = true;
  public isGrounded: boolean = false;
  public isSliding: boolean = false;
  public slideTimer: number = 0;
  public currentCameraHeight: number = PHYSICS.STAND_HEIGHT;
  public isADS: boolean = false;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;

  // Weapons & Combat
  public currentWeaponClass: WeaponClass = "triggerman";
  public currentWeapon: WeaponDef = WEAPON_DEFS.triggerman;
  public currentAmmo: number = WEAPON_DEFS.triggerman.magSize;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public fireCooldown: number = 0;
  public recoilOffset: THREE.Vector3 = new THREE.Vector3();
  public recoilRotation: THREE.Euler = new THREE.Euler();
  public viewmodelGroup: THREE.Group | null = null;
  public bobCycle: number = 0;

  // Bot Lobby
  public bots: BotEntity[] = [];
  public numBots: number = 6;

  // Visual Effects & Particles
  public tracers: BulletTracer[] = [];
  public tracerLineGeos: THREE.LineSegments | null = null;
  public sparks: SparkParticle[] = [];
  public sparkPointsMesh: THREE.Points | null = null;
  public damagePopups: DamagePopup[] = [];

  // Input State
  public keys: Record<string, boolean> = {};
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  public mouseSensitivity: number = 0.0022;
  public baseFOV: number = 80;

  // Match Telemetry & Callbacks
  public stats: MatchStats = {
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
  public callbacks: KrunkerCallbacks;
  public matchTimeRemaining: number = 240; // 4 minutes
  public isMatchEnded: boolean = false;

  // Internal Loop
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, callbacks: KrunkerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.baseFOV, aspect, 0.1, 400);

    // 2. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Build Arena Map & Colliders
    const mapData = buildKrunkerArena(this.scene);
    this.colliders = mapData.colliders;
    this.jumpPads = mapData.jumpPads;
    this.spawnPoints = mapData.spawnPoints;

    // 4. Spawn Player
    this.spawnPlayer();

    // 5. Initialize First-Person Viewmodel
    this.setupViewmodel();

    // 6. Spawn Bot Lobby
    this.spawnBots();

    // 7. Setup Visual FX Meshes
    this.setupFXMeshes();

    // 8. Start Loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  // Spawn or Respawn Player at safe spawn point
  public spawnPlayer() {
    const sp = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    this.playerPos.set(sp.x, sp.y + 0.5, sp.z);
    this.playerVelocity.set(0, 0, 0);
    this.health = 100;
    this.isAlive = true;
    this.isGrounded = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.currentCameraHeight = PHYSICS.STAND_HEIGHT;
    this.currentAmmo = this.currentWeapon.magSize;
    this.isReloading = false;
    this.isInvulnerable = true;
    this.invulnerableTimer = PHYSICS.INVULNERABLE_DURATION;

    this.camera.position.copy(this.playerPos);
    this.camera.position.y += this.currentCameraHeight;

    this.callbacks.onPlayerRespawn();
    this.callbacks.onPlayerDamaged(this.health, this.maxHealth);
    this.callbacks.onAmmoChange(this.currentAmmo, this.currentWeapon.magSize, false);
  }

  // Switch Active Weapon Class
  public setWeaponClass(weaponClass: WeaponClass) {
    if (this.currentWeaponClass === weaponClass) return;
    this.currentWeaponClass = weaponClass;
    this.currentWeapon = WEAPON_DEFS[weaponClass];
    this.currentAmmo = this.currentWeapon.magSize;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.setupViewmodel();
    this.callbacks.onAmmoChange(this.currentAmmo, this.currentWeapon.magSize, false);
  }

  // Setup/Refresh First-Person Weapon Model on Camera
  private setupViewmodel() {
    if (this.viewmodelGroup) {
      this.camera.remove(this.viewmodelGroup);
    }
    this.viewmodelGroup = buildFPSViewmodel(this.currentWeaponClass);
    this.camera.add(this.viewmodelGroup);
    if (!this.scene.children.includes(this.camera)) {
      this.scene.add(this.camera);
    }
  }

  // Setup Visual FX (Bullet Tracers & Sparks)
  private setupFXMeshes() {
    // Tracers
    const lineGeo = new THREE.BufferGeometry();
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xfef08a, // Glowing yellow-white laser beam
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    this.tracerLineGeos = new THREE.LineSegments(lineGeo, lineMat);
    this.scene.add(this.tracerLineGeos);

    // Sparks
    const sparkGeo = new THREE.BufferGeometry();
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
    });
    this.sparkPointsMesh = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(this.sparkPointsMesh);
  }

  // Spawn Bots into the arena
  private spawnBots() {
    const classes: WeaponClass[] = ["triggerman", "hunter", "run-n-gun", "vince", "detective"];

    for (let i = 0; i < this.numBots; i++) {
      const name = BOT_NAMES[i % BOT_NAMES.length];
      const color = BOT_COLORS[i % BOT_COLORS.length];
      const botClass = classes[i % classes.length];
      const sp = this.spawnPoints[(i + 1) % this.spawnPoints.length];

      const visuals = buildBotCharacter(color, botClass);
      visuals.group.position.copy(sp);
      this.scene.add(visuals.group);

      const bot: BotEntity = {
        id: `bot-${i}`,
        name,
        weaponClass: botClass,
        mesh: visuals.group,
        headMesh: visuals.headMesh,
        bodyMesh: visuals.bodyMesh,
        weaponMesh: visuals.weaponMesh,
        leftLegMesh: visuals.leftLeg,
        rightLegMesh: visuals.rightLeg,
        position: sp.clone(),
        velocity: new THREE.Vector3(),
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        health: 100,
        maxHealth: 100,
        isAlive: true,
        respawnTimer: 0,
        invulnerableTimer: 1.0,
        targetId: null,
        state: "patrol",
        stateTimer: 2.0 + Math.random() * 3.0,
        fireCooldown: Math.random() * 1.0,
        reactionTimer: 0.25,
        lastKnownTargetPos: null,
        color,
        kills: 0,
        deaths: 0,
        score: 0,
        walkCycle: 0,
      };

      this.bots.push(bot);
    }
  }

  // Main Game Loop
  private animate(now: number) {
    if (this.isDestroyed) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.isMatchEnded) {
      // 1. Update Match Timer
      this.matchTimeRemaining -= dt;
      if (this.matchTimeRemaining <= 0) {
        this.matchTimeRemaining = 0;
        this.endMatch();
      }

      // 2. Process Player Movement & Physics (Slide-Hopping & Bhop)
      if (this.isAlive) {
        this.updatePlayerMovement(dt);
        this.handleWeaponInput(dt);
      } else {
        // Free cam or death rotation
        this.updateDeathState(dt);
      }

      // 3. Process Bots AI & Movement
      this.updateBots(dt);

      // 4. Process Weapon Viewmodel Animations
      this.updateViewmodel(dt);

      // 5. Update Tracers & Particles
      this.updateVisualFX(dt);
    }

    // 6. Render Frame
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  // Core Krunker Slide-Hopping & Bhop Physics Engine
  private updatePlayerMovement(dt: number) {
    // Invulnerability decay
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Input Movement Directions
    let moveForward = 0;
    let moveRight = 0;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveForward += 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveForward -= 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) moveRight -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) moveRight += 1;

    const wantsSlide = !!(this.keys["ShiftLeft"] || this.keys["ShiftRight"] || this.keys["KeyC"]);
    const wantsJump = !!(this.keys["Space"] || this.keys["KeyK"]);

    // Calculate forward & right unit vectors relative to yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const wishDir = new THREE.Vector3()
      .addScaledVector(forward, moveForward)
      .addScaledVector(right, moveRight);
    const hasMoveInput = wishDir.lengthSq() > 0.001;
    if (hasMoveInput) wishDir.normalize();

    // 1. SLIDE MECHANIC TRIGGER (Crouch / Slide on ground with movement)
    if (wantsSlide && this.isGrounded && !this.isSliding && hasMoveInput) {
      this.isSliding = true;
      this.slideTimer = PHYSICS.SLIDE_DURATION;

      // Add forward burst momentum in direction of movement!
      const currentHorizSpeed = Math.sqrt(
        this.playerVelocity.x * this.playerVelocity.x + this.playerVelocity.z * this.playerVelocity.z
      );
      const boostDir = wishDir.clone();
      const boostAmount = Math.max(PHYSICS.SLIDE_BOOST, currentHorizSpeed * 0.35);
      this.playerVelocity.addScaledVector(boostDir, boostAmount);

      // Clamp max slide speed
      const newSpeed = Math.sqrt(
        this.playerVelocity.x * this.playerVelocity.x + this.playerVelocity.z * this.playerVelocity.z
      );
      if (newSpeed > PHYSICS.MAX_SLIDE_SPEED) {
        this.playerVelocity.x = (this.playerVelocity.x / newSpeed) * PHYSICS.MAX_SLIDE_SPEED;
        this.playerVelocity.z = (this.playerVelocity.z / newSpeed) * PHYSICS.MAX_SLIDE_SPEED;
      }

      krunkerAudio.playSlide();
    }

    // Slide state timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0 || !wantsSlide) {
        this.isSliding = false;
      }
    }

    // Camera height interpolation (smooth transition between standing and sliding)
    const targetHeight = this.isSliding ? PHYSICS.SLIDE_HEIGHT : PHYSICS.STAND_HEIGHT;
    this.currentCameraHeight += (targetHeight - this.currentCameraHeight) * Math.min(1.0, dt * 14.0);

    // 2. JUMP / BHOP MECHANIC (Jump preserves slide momentum in air!)
    if (wantsJump && this.isGrounded) {
      this.playerVelocity.y = PHYSICS.JUMP_FORCE;
      this.isGrounded = false;
      // If jumping during a slide, momentum is preserved with zero air friction!
      if (this.isSliding) {
        this.isSliding = false;
      }
    }

    // 3. HORIZONTAL ACCELERATION & FRICTION
    const weaponSpeedMult = this.currentWeapon.movementSpeed;
    const targetBaseSpeed = PHYSICS.BASE_SPEED * weaponSpeedMult * (this.isADS ? 0.6 : 1.0);

    if (this.isGrounded) {
      if (this.isSliding) {
        // Friction is very low during slide, allowing fast gliding
        const friction = PHYSICS.SLIDE_FRICTION;
        this.playerVelocity.x -= this.playerVelocity.x * friction * dt;
        this.playerVelocity.z -= this.playerVelocity.z * friction * dt;
      } else {
        // Normal ground running
        const friction = PHYSICS.GROUND_FRICTION;
        this.playerVelocity.x -= this.playerVelocity.x * friction * dt;
        this.playerVelocity.z -= this.playerVelocity.z * friction * dt;

        if (hasMoveInput) {
          const accel = PHYSICS.GROUND_ACCEL;
          this.playerVelocity.x += wishDir.x * accel * dt;
          this.playerVelocity.z += wishDir.z * accel * dt;

          // Soft clamp to base speed if not sliding
          const curSpeed = Math.sqrt(
            this.playerVelocity.x * this.playerVelocity.x + this.playerVelocity.z * this.playerVelocity.z
          );
          if (curSpeed > targetBaseSpeed) {
            const drag = Math.max(0, curSpeed - targetBaseSpeed) * 3.0 * dt;
            this.playerVelocity.x *= Math.max(0, 1 - drag / curSpeed);
            this.playerVelocity.z *= Math.max(0, 1 - drag / curSpeed);
          }
        }
      }
    } else {
      // In Air: Apply gravity + air acceleration strafe
      this.playerVelocity.y -= PHYSICS.GRAVITY * dt;

      if (hasMoveInput) {
        const airAccel = PHYSICS.AIR_ACCEL;
        this.playerVelocity.x += wishDir.x * airAccel * dt;
        this.playerVelocity.z += wishDir.z * airAccel * dt;
      }
    }

    // Calculate current speed in units/sec (Krunker speedometer telemetry)
    const horizSpeed = Math.sqrt(
      this.playerVelocity.x * this.playerVelocity.x + this.playerVelocity.z * this.playerVelocity.z
    );
    this.callbacks.onSpeedUpdate(Math.round(horizSpeed * 10));
    if (horizSpeed > this.stats.topSpeed) {
      this.stats.topSpeed = horizSpeed;
    }

    // 4. COLLISION DETECTION & RESOLUTION WITH MAP BOXES
    const stepMove = this.playerVelocity.clone().multiplyScalar(dt);
    this.resolvePlayerCollisions(stepMove);

    // 5. JUMP PADS CHECK
    this.checkJumpPads();

    // 6. UPDATE CAMERA POSITION & ROTATION
    this.camera.position.copy(this.playerPos);
    this.camera.position.y += this.currentCameraHeight;

    // Apply look rotation: pitch on camera X, yaw on camera Y
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch + this.recoilRotation.x;

    // Head bobbing when walking on ground
    if (this.isGrounded && hasMoveInput && !this.isSliding) {
      this.bobCycle += dt * horizSpeed * 0.8;
      this.camera.position.y += Math.sin(this.bobCycle) * 0.04;
      this.camera.position.x += Math.cos(this.bobCycle * 0.5) * 0.02;
    }
  }

  // Player AABB swept collision resolution
  private resolvePlayerCollisions(move: THREE.Vector3) {
    const radius = PHYSICS.PLAYER_RADIUS;
    const height = this.isSliding ? 1.2 : 2.0;

    // Check X Movement
    this.playerPos.x += move.x;
    for (const c of this.colliders) {
      if (c.isJumpPad) continue;
      if (
        this.playerPos.x + radius > c.min.x &&
        this.playerPos.x - radius < c.max.x &&
        this.playerPos.z + radius > c.min.z &&
        this.playerPos.z - radius < c.max.z &&
        this.playerPos.y + height > c.min.y &&
        this.playerPos.y < c.max.y
      ) {
        if (move.x > 0) {
          this.playerPos.x = c.min.x - radius;
        } else if (move.x < 0) {
          this.playerPos.x = c.max.x + radius;
        }
        this.playerVelocity.x = 0;
      }
    }

    // Check Z Movement
    this.playerPos.z += move.z;
    for (const c of this.colliders) {
      if (c.isJumpPad) continue;
      if (
        this.playerPos.x + radius > c.min.x &&
        this.playerPos.x - radius < c.max.x &&
        this.playerPos.z + radius > c.min.z &&
        this.playerPos.z - radius < c.max.z &&
        this.playerPos.y + height > c.min.y &&
        this.playerPos.y < c.max.y
      ) {
        if (move.z > 0) {
          this.playerPos.z = c.min.z - radius;
        } else if (move.z < 0) {
          this.playerPos.z = c.max.z + radius;
        }
        this.playerVelocity.z = 0;
      }
    }

    // Check Y Movement (Vertical & Grounding)
    this.playerPos.y += move.y;
    this.isGrounded = false;

    for (const c of this.colliders) {
      if (c.isJumpPad) continue;
      if (
        this.playerPos.x + radius > c.min.x &&
        this.playerPos.x - radius < c.max.x &&
        this.playerPos.z + radius > c.min.z &&
        this.playerPos.z - radius < c.max.z &&
        this.playerPos.y + height > c.min.y &&
        this.playerPos.y < c.max.y
      ) {
        if (move.y <= 0 && this.playerPos.y < c.max.y) {
          // Landed on surface
          this.playerPos.y = c.max.y;
          this.playerVelocity.y = 0;
          this.isGrounded = true;
        } else if (move.y > 0) {
          // Hit ceiling
          this.playerPos.y = c.min.y - height;
          this.playerVelocity.y = 0;
        }
      }
    }

    // Fall safety floor
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }
  }

  // Check if player stepped on a jump pad
  private checkJumpPads() {
    for (const pad of this.jumpPads) {
      if (
        this.playerPos.x >= pad.min.x &&
        this.playerPos.x <= pad.max.x &&
        this.playerPos.z >= pad.min.z &&
        this.playerPos.z <= pad.max.z &&
        Math.abs(this.playerPos.y - pad.min.y) < 1.0
      ) {
        this.playerVelocity.y = pad.jumpForce || 25.0;
        this.isGrounded = false;
        krunkerAudio.playJumpPad();
        break;
      }
    }
  }

  // Handle Weapon Firing, ADS, and Reload Inputs
  private handleWeaponInput(dt: number) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // ADS (Right Click or KeyE)
    this.isADS = this.isRightMouseDown || !!this.keys["KeyE"];

    // Reloading
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.currentAmmo = this.currentWeapon.magSize;
        this.callbacks.onAmmoChange(this.currentAmmo, this.currentWeapon.magSize, false);
      }
      return;
    }

    // Manual Reload Key
    if (this.keys["KeyR"] && this.currentAmmo < this.currentWeapon.magSize) {
      this.startReload();
      return;
    }

    // Firing Check
    const wantsFire = this.isMouseDown;
    if (wantsFire && this.fireCooldown <= 0) {
      if (this.currentAmmo > 0) {
        this.shootPlayerWeapon();
      } else {
        krunkerAudio.playDryFire();
        this.startReload();
        this.fireCooldown = 0.3;
      }
    }

    // Recoil recovery
    this.recoilRotation.x *= Math.max(0, 1 - dt * 16.0);
    this.recoilOffset.z *= Math.max(0, 1 - dt * 14.0);
  }

  // Initiate weapon reload sequence
  public startReload() {
    if (this.isReloading || this.currentAmmo === this.currentWeapon.magSize) return;
    this.isReloading = true;
    this.reloadTimer = this.currentWeapon.reloadTime;
    krunkerAudio.playReload();
    this.callbacks.onAmmoChange(this.currentAmmo, this.currentWeapon.magSize, true);
  }

  // Perform Hitscan Raycast Firing
  private shootPlayerWeapon() {
    this.fireCooldown = 1.0 / this.currentWeapon.fireRate;
    this.currentAmmo--;
    this.stats.shotsFired++;
    this.callbacks.onAmmoChange(this.currentAmmo, this.currentWeapon.magSize, false);

    // Audio
    krunkerAudio.playGunshot(this.currentWeapon.modelType);

    // Recoil kick
    const recoilAmount = this.currentWeapon.recoil;
    this.recoilRotation.x += recoilAmount * 0.65;
    this.recoilOffset.z += recoilAmount * 0.4;

    // Vince Shotgun Jumping mechanic: Jump + Shoot down boosts player upwards!
    if (
      this.currentWeaponClass === "vince" &&
      !this.isGrounded &&
      this.pitch < -0.5 // looking significantly down
    ) {
      this.playerVelocity.y = Math.max(
        this.playerVelocity.y + PHYSICS.SHOTGUN_JUMP_FORCE,
        PHYSICS.SHOTGUN_JUMP_FORCE
      );
    }

    // Raycast Origin: Camera Position
    const origin = this.camera.position.clone();

    // Muzzle position for visual tracer
    const muzzlePos = this.camera.position.clone();
    const forwardVec = new THREE.Vector3();
    this.camera.getWorldDirection(forwardVec);
    const rightVec = new THREE.Vector3().crossVectors(forwardVec, new THREE.Vector3(0, 1, 0)).normalize();
    muzzlePos.addScaledVector(forwardVec, 0.6);
    muzzlePos.addScaledVector(rightVec, this.isADS ? 0 : 0.28);
    muzzlePos.y -= 0.18;

    const pellets = this.currentWeapon.pellets;
    const spread = this.isADS ? this.currentWeapon.adsSpread : this.currentWeapon.hipSpread;

    for (let p = 0; p < pellets; p++) {
      // Calculate ray direction with spread
      const rayDir = forwardVec.clone();
      if (spread > 0) {
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        rayDir.addScaledVector(rightVec, spreadX);
        rayDir.y += spreadY;
        rayDir.normalize();
      }

      this.castHitscanRay(origin, rayDir, muzzlePos);
    }
  }

  // Single Hitscan Raycast checking Bots and Environment
  private castHitscanRay(origin: THREE.Vector3, dir: THREE.Vector3, muzzlePos: THREE.Vector3) {
    let closestDist = 200;
    let hitPoint = origin.clone().addScaledVector(dir, closestDist);
    let hitBot: BotEntity | null = null;
    let isHeadshot = false;

    // 1. Check Collisions with Map Boxes
    for (const c of this.colliders) {
      const t = this.intersectRayAABB(origin, dir, c.min, c.max);
      if (t !== null && t > 0 && t < closestDist) {
        closestDist = t;
        hitPoint = origin.clone().addScaledVector(dir, t);
      }
    }

    // 2. Check Collisions with Alive Bots (Head vs Body hitscan detection)
    for (const bot of this.bots) {
      if (!bot.isAlive || bot.invulnerableTimer > 0) continue;

      // Head AABB (0.7x0.7x0.7 centered at bot head position)
      const headCenter = bot.position.clone().add(new THREE.Vector3(0, 1.95, 0));
      const headMin = headCenter.clone().sub(new THREE.Vector3(0.35, 0.35, 0.35));
      const headMax = headCenter.clone().add(new THREE.Vector3(0.35, 0.35, 0.35));

      const tHead = this.intersectRayAABB(origin, dir, headMin, headMax);
      if (tHead !== null && tHead > 0 && tHead < closestDist) {
        closestDist = tHead;
        hitPoint = origin.clone().addScaledVector(dir, tHead);
        hitBot = bot;
        isHeadshot = true;
      }

      // Body AABB (0.8x1.4x0.8 centered at bot torso)
      const bodyCenter = bot.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      const bodyMin = bodyCenter.clone().sub(new THREE.Vector3(0.42, 0.85, 0.42));
      const bodyMax = bodyCenter.clone().add(new THREE.Vector3(0.42, 0.85, 0.42));

      const tBody = this.intersectRayAABB(origin, dir, bodyMin, bodyMax);
      if (tBody !== null && tBody > 0 && tBody < closestDist) {
        closestDist = tBody;
        hitPoint = origin.clone().addScaledVector(dir, tBody);
        hitBot = bot;
        isHeadshot = false;
      }
    }

    // 3. Register Hit Outcome
    if (hitBot) {
      this.stats.shotsHit++;
      let damage = this.currentWeapon.damage;
      if (isHeadshot) {
        damage = Math.round(damage * this.currentWeapon.headshotMultiplier);
        this.stats.headshots++;
        krunkerAudio.playHeadshotDing();
      } else {
        krunkerAudio.playHitmarker();
      }

      this.stats.damageDealt += damage;
      hitBot.health -= damage;

      // Notify UI hitmarker & damage numbers
      this.callbacks.onPlayerHit(damage, isHeadshot);
      this.spawnDamagePopup(hitPoint, damage, isHeadshot);

      // Blood / Spark FX
      this.spawnSparks(hitPoint, isHeadshot ? 0xef4444 : 0xf59e0b, 10);

      // Check if bot killed
      if (hitBot.health <= 0) {
        this.killBot(hitBot, isHeadshot);
      }
    } else {
      // Wall Impact sparks
      this.spawnSparks(hitPoint, 0xfde047, 6);
    }

    // 4. Add Bullet Tracer Beam
    this.tracers.push({
      start: muzzlePos.clone(),
      end: hitPoint.clone(),
      color: 0xfef08a,
      life: 0.08,
      maxLife: 0.08,
    });
  }

  // Player kills a bot
  private killBot(bot: BotEntity, isHeadshot: boolean) {
    bot.isAlive = false;
    bot.health = 0;
    bot.deaths++;
    bot.mesh.visible = false;
    bot.respawnTimer = PHYSICS.RESPAWN_DELAY;

    this.stats.kills++;
    this.stats.currentKillstreak++;
    if (this.stats.currentKillstreak > this.stats.highestKillstreak) {
      this.stats.highestKillstreak = this.stats.currentKillstreak;
    }

    let scoreGain = 100;
    if (isHeadshot) scoreGain += 50;
    if (this.isSliding) scoreGain += 25; // Slide kill bonus!
    if (this.stats.currentKillstreak > 1) scoreGain += 20 * this.stats.currentKillstreak;

    this.stats.score += scoreGain;
    krunkerAudio.playKillChime();

    // Callbacks
    const reason = isHeadshot ? "HEADSHOT KILL +150" : "ENEMY ELIMINATED +100";
    this.callbacks.onScoreAdd(scoreGain, reason, isHeadshot ? "#ef4444" : "#eab308");

    const killEntry: KillfeedEntry = {
      id: Math.random().toString(),
      killer: "You",
      victim: bot.name,
      weapon: this.currentWeapon.className,
      isHeadshot,
      isPlayerKiller: true,
      isPlayerVictim: false,
      timestamp: Date.now(),
    };
    this.callbacks.onKillfeed(killEntry);
    this.updateLeaderboard();
  }

  // Bot AI logic update
  private updateBots(dt: number) {
    for (const bot of this.bots) {
      if (!bot.isAlive) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) {
          this.respawnBot(bot);
        }
        continue;
      }

      if (bot.invulnerableTimer > 0) {
        bot.invulnerableTimer -= dt;
      }

      // State timer
      bot.stateTimer -= dt;
      bot.fireCooldown -= dt;

      // 1. Target Acquisition: Find player or other bot
      let targetPos: THREE.Vector3 | null = null;
      let targetDist = 999;
      let targetIsPlayer = false;

      // Check distance to player
      if (this.isAlive && !this.isInvulnerable) {
        const d = bot.position.distanceTo(this.playerPos);
        if (d < 45) {
          targetPos = this.playerPos;
          targetDist = d;
          targetIsPlayer = true;
        }
      }

      // If no player, check other bots
      if (!targetPos) {
        for (const other of this.bots) {
          if (other.id !== bot.id && other.isAlive && other.invulnerableTimer <= 0) {
            const d = bot.position.distanceTo(other.position);
            if (d < targetDist && d < 35) {
              targetDist = d;
              targetPos = other.position;
              targetIsPlayer = false;
            }
          }
        }
      }

      // 2. State Machine & Movement
      if (targetPos) {
        // Turn towards target
        const dx = targetPos.x - bot.position.x;
        const dz = targetPos.z - bot.position.z;
        const targetYaw = Math.atan2(dx, dz);
        bot.rotationY += (targetYaw - bot.rotationY) * Math.min(1.0, dt * 8.0);
        bot.mesh.rotation.y = bot.rotationY;

        // Strafe & Advance
        const forward = new THREE.Vector3(Math.sin(bot.rotationY), 0, Math.cos(bot.rotationY));
        const right = new THREE.Vector3(Math.cos(bot.rotationY), 0, -Math.sin(bot.rotationY));

        let speed = 9.0;
        if (targetDist > 16) {
          // Advance closer
          bot.position.addScaledVector(forward, speed * dt);
        } else if (targetDist < 8) {
          // Back up
          bot.position.addScaledVector(forward, -speed * 0.7 * dt);
        }
        // Lateral strafing
        const strafeDir = Math.sin(Date.now() * 0.003 + parseInt(bot.id.slice(-1), 10));
        bot.position.addScaledVector(right, strafeDir * speed * 0.8 * dt);

        // Walking Leg Animation
        bot.walkCycle += dt * 12.0;
        bot.leftLegMesh.rotation.x = Math.sin(bot.walkCycle) * 0.6;
        bot.rightLegMesh.rotation.x = -Math.sin(bot.walkCycle) * 0.6;

        // 3. Bot Shooting
        if (bot.fireCooldown <= 0 && targetDist < 40) {
          bot.fireCooldown = 0.5 + Math.random() * 0.8;
          this.botFire(bot, targetPos, targetIsPlayer);
        }
      } else {
        // Patrol around
        if (bot.stateTimer <= 0) {
          bot.rotationY = Math.random() * Math.PI * 2;
          bot.stateTimer = 3.0 + Math.random() * 4.0;
        }
        bot.mesh.rotation.y = bot.rotationY;
        const forward = new THREE.Vector3(Math.sin(bot.rotationY), 0, Math.cos(bot.rotationY));
        bot.position.addScaledVector(forward, 6.0 * dt);

        bot.walkCycle += dt * 8.0;
        bot.leftLegMesh.rotation.x = Math.sin(bot.walkCycle) * 0.4;
        bot.rightLegMesh.rotation.x = -Math.sin(bot.walkCycle) * 0.4;
      }

      // Keep bot in bounds
      bot.position.x = Math.max(-48, Math.min(48, bot.position.x));
      bot.position.z = Math.max(-48, Math.min(48, bot.position.z));
      bot.mesh.position.copy(bot.position);
    }
  }

  // Bot fires weapon at target
  private botFire(bot: BotEntity, targetPos: THREE.Vector3, isTargetPlayer: boolean) {
    const origin = bot.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const targetAim = targetPos.clone().add(new THREE.Vector3(0, 1.3, 0));

    // Add slight bot aim spread
    const spread = (Math.random() - 0.5) * 0.08;
    const dir = targetAim.clone().sub(origin).normalize();
    dir.x += spread;
    dir.z += spread;
    dir.normalize();

    // Check if line of sight is clear
    const maxDist = origin.distanceTo(targetPos) + 2;
    let hitWall = false;
    for (const c of this.colliders) {
      const t = this.intersectRayAABB(origin, dir, c.min, c.max);
      if (t !== null && t > 0 && t < maxDist - 1.5) {
        hitWall = true;
        break;
      }
    }

    if (hitWall) return; // Obstructed by wall

    // Visual tracer from bot
    this.tracers.push({
      start: origin.clone(),
      end: targetAim.clone(),
      color: 0xf97316,
      life: 0.08,
      maxLife: 0.08,
    });

    // If targeting player, deal damage
    if (isTargetPlayer && this.isAlive && !this.isInvulnerable) {
      const botDef = WEAPON_DEFS[bot.weaponClass];
      const damage = Math.round(botDef.damage * 0.75); // slight damage tuning for bots
      this.health -= damage;
      this.callbacks.onPlayerDamaged(Math.max(0, this.health), this.maxHealth);

      if (this.health <= 0) {
        this.killPlayer(bot.name, botDef.className);
      }
    }
  }

  // Bot respawns at random spawn
  private respawnBot(bot: BotEntity) {
    const sp = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    bot.position.copy(sp);
    bot.health = 100;
    bot.isAlive = true;
    bot.invulnerableTimer = 1.5;
    bot.mesh.visible = true;
    bot.mesh.position.copy(bot.position);
  }

  // Player gets killed
  private killPlayer(killerName: string, weaponName: string) {
    this.isAlive = false;
    this.health = 0;
    this.stats.deaths++;
    this.stats.currentKillstreak = 0;

    const killEntry: KillfeedEntry = {
      id: Math.random().toString(),
      killer: killerName,
      victim: "You",
      weapon: weaponName,
      isHeadshot: false,
      isPlayerKiller: false,
      isPlayerVictim: true,
      timestamp: Date.now(),
    };
    this.callbacks.onKillfeed(killEntry);
    this.callbacks.onPlayerKilled(killerName, weaponName);
    this.updateLeaderboard();
  }

  // Death camera animation
  private updateDeathState(dt: number) {
    this.pitch = Math.max(-0.6, this.pitch - dt * 1.5);
    this.camera.position.y = Math.max(0.4, this.camera.position.y - dt * 2.5);
    this.camera.rotation.x = this.pitch;
  }

  // Update First-Person Viewmodel bob, recoil, and ADS alignment
  private updateViewmodel(dt: number) {
    if (!this.viewmodelGroup) return;

    // FOV Zoom interpolation for ADS
    const targetFOV = this.isADS ? this.baseFOV * this.currentWeapon.adsZoom : this.baseFOV;
    this.camera.fov += (targetFOV - this.camera.fov) * Math.min(1.0, dt * 16.0);
    this.camera.updateProjectionMatrix();

    // Target Viewmodel Position
    // ADS brings weapon to optical center: x = 0, y = -0.15, z = -0.35
    const targetPos = this.isADS
      ? new THREE.Vector3(0, -0.14, -0.38)
      : new THREE.Vector3(0.32, -0.28, -0.55);

    // Add recoil kick offset
    targetPos.add(this.recoilOffset);

    // Reload tilt animation
    if (this.isReloading) {
      targetPos.y -= 0.15;
      targetPos.z -= 0.1;
    }

    this.viewmodelGroup.position.lerp(targetPos, Math.min(1.0, dt * 18.0));
  }

  // Update Visual FX (Tracers and Sparks)
  private updateVisualFX(dt: number) {
    // 1. Tracers
    const activeTracers: BulletTracer[] = [];
    const linePositions: number[] = [];

    for (const t of this.tracers) {
      t.life -= dt;
      if (t.life > 0) {
        activeTracers.push(t);
        linePositions.push(t.start.x, t.start.y, t.start.z);
        linePositions.push(t.end.x, t.end.y, t.end.z);
      }
    }
    this.tracers = activeTracers;

    if (this.tracerLineGeos) {
      this.tracerLineGeos.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
    }

    // 2. Sparks
    const activeSparks: SparkParticle[] = [];
    const sparkPositions: number[] = [];

    for (const s of this.sparks) {
      s.life -= dt;
      if (s.life > 0) {
        s.position.addScaledVector(s.velocity, dt);
        s.velocity.y -= 18.0 * dt; // gravity
        activeSparks.push(s);
        sparkPositions.push(s.position.x, s.position.y, s.position.z);
      }
    }
    this.sparks = activeSparks;

    if (this.sparkPointsMesh) {
      this.sparkPointsMesh.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(sparkPositions, 3)
      );
    }
  }

  // Spawn spark particle burst
  private spawnSparks(pos: THREE.Vector3, color: number, count = 6) {
    for (let i = 0; i < count; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8.0,
        Math.random() * 6.0 + 2.0,
        (Math.random() - 0.5) * 8.0
      );
      this.sparks.push({
        position: pos.clone(),
        velocity: vel,
        color,
        size: 0.3,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
      });
    }
  }

  // Spawn floating damage text popup
  private spawnDamagePopup(pos: THREE.Vector3, damage: number, isHeadshot: boolean) {
    const popup: DamagePopup = {
      id: Math.random().toString(),
      text: `${damage}`,
      position: pos.clone().add(new THREE.Vector3(0, 0.4, 0)),
      isHeadshot,
      life: 0.8,
      maxLife: 0.8,
    };
    this.damagePopups.push(popup);
    setTimeout(() => {
      const idx = this.damagePopups.indexOf(popup);
      if (idx !== -1) this.damagePopups.splice(idx, 1);
    }, 800);
  }

  // Ray-AABB intersection algorithm
  private intersectRayAABB(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    min: THREE.Vector3,
    max: THREE.Vector3
  ): number | null {
    let tmin = (min.x - origin.x) / (dir.x !== 0 ? dir.x : 0.00001);
    let tmax = (max.x - origin.x) / (dir.x !== 0 ? dir.x : 0.00001);
    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (min.y - origin.y) / (dir.y !== 0 ? dir.y : 0.00001);
    let tymax = (max.y - origin.y) / (dir.y !== 0 ? dir.y : 0.00001);
    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if (tmin > tymax || tymin > tmax) return null;
    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (min.z - origin.z) / (dir.z !== 0 ? dir.z : 0.00001);
    let tzmax = (max.z - origin.z) / (dir.z !== 0 ? dir.z : 0.00001);
    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

    if (tmin > tzmax || tzmin > tmax) return null;
    if (tzmin > tmin) tmin = tzmin;

    return tmin > 0 ? tmin : null;
  }

  // Leaderboard broadcast
  private updateLeaderboard() {
    const list = [
      {
        name: "You",
        kills: this.stats.kills,
        deaths: this.stats.deaths,
        score: this.stats.score,
        isPlayer: true,
      },
      ...this.bots.map((b) => ({
        name: b.name,
        kills: b.kills,
        deaths: b.deaths,
        score: b.kills * 100,
      })),
    ];
    list.sort((a, b) => b.score - a.score);
    this.callbacks.onLeaderboardUpdate(list);
  }

  // Match End
  private endMatch() {
    this.isMatchEnded = true;
    const list = [
      { name: "You", score: this.stats.score },
      ...this.bots.map((b) => ({ name: b.name, score: b.kills * 100 })),
    ];
    list.sort((a, b) => b.score - a.score);
    const winner = list[0].name;
    this.callbacks.onMatchEnd(this.stats, winner);
  }

  // Mouse Movement Handler (Pointer Lock)
  public onMouseMove(dx: number, dy: number) {
    if (!this.isAlive) return;

    // Apply sensitivity (scaled down when ADS for sniper precision)
    const sens = this.isADS ? this.mouseSensitivity * 0.5 : this.mouseSensitivity;
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;

    // Clamp pitch between -89° and +89°
    const maxPitch = (Math.PI / 2) * 0.98;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  // Resize Handler
  public onResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Cleanup & Disposal
  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
