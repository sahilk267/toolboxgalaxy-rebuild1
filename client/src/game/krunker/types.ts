import * as THREE from "three";

export type WeaponClass = "triggerman" | "hunter" | "run-n-gun" | "vince" | "detective";

export interface WeaponDef {
  id: WeaponClass;
  name: string;
  className: string;
  category: string;
  description: string;
  primaryColor: string;
  damage: number;
  headshotMultiplier: number;
  pellets: number; // For shotguns > 1
  fireRate: number; // shots per second
  magSize: number;
  reloadTime: number; // seconds
  recoil: number;
  hipSpread: number;
  adsSpread: number;
  adsZoom: number; // FOV multiplier e.g. 0.6 for sniper, 0.85 for rifle
  isFullAuto: boolean;
  modelType: "rifle" | "sniper" | "smg" | "shotgun" | "revolver";
  movementSpeed: number; // speed multiplier (e.g. 1.1 for smg, 0.95 for sniper)
}

export interface BoxCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
  mesh?: THREE.Object3D;
  isJumpPad?: boolean;
  jumpForce?: number;
}

export interface BotEntity {
  id: string;
  name: string;
  weaponClass: WeaponClass;
  mesh: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  weaponMesh: THREE.Group;
  leftLegMesh: THREE.Mesh;
  rightLegMesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  pitch: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  respawnTimer: number;
  invulnerableTimer: number;
  targetId: string | null;
  state: "patrol" | "chase" | "strafe" | "flee";
  stateTimer: number;
  fireCooldown: number;
  reactionTimer: number;
  lastKnownTargetPos: THREE.Vector3 | null;
  color: string;
  kills: number;
  deaths: number;
  score: number;
  walkCycle: number;
}

export interface BulletTracer {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: number;
  life: number;
  maxLife: number;
}

export interface SparkParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: number;
  size: number;
  life: number;
  maxLife: number;
}

export interface DamagePopup {
  id: string;
  text: string;
  position: THREE.Vector3;
  isHeadshot: boolean;
  life: number;
  maxLife: number;
}

export interface KillfeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  isHeadshot: boolean;
  isPlayerKiller: boolean;
  isPlayerVictim: boolean;
  timestamp: number;
}

export interface ScorePopup {
  id: string;
  text: string;
  score: number;
  color: string;
  timestamp: number;
}

export interface MatchStats {
  kills: number;
  deaths: number;
  headshots: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  score: number;
  highestKillstreak: number;
  currentKillstreak: number;
  topSpeed: number;
}

export interface KrunkerCallbacks {
  onKillfeed: (entry: KillfeedEntry) => void;
  onScoreAdd: (score: number, reason: string, color?: string) => void;
  onPlayerHit: (damage: number, isHeadshot: boolean) => void;
  onPlayerDamaged: (currentHp: number, maxHp: number) => void;
  onPlayerKilled: (killerName: string, weapon: string) => void;
  onPlayerRespawn: () => void;
  onAmmoChange: (ammo: number, magSize: number, isReloading: boolean) => void;
  onSpeedUpdate: (speed: number) => void;
  onLeaderboardUpdate: (players: Array<{ name: string; kills: number; deaths: number; score: number; isPlayer?: boolean }>) => void;
  onMatchEnd: (stats: MatchStats, winnerName: string) => void;
}
