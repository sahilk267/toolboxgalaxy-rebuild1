// Diep Arena (Tank Evolution & Upgrades) - System Types & Definitions

export type TankClassId =
  | "basic"
  // Tier 2 (Lv 15)
  | "twin"
  | "sniper"
  | "machine-gun"
  | "flank-guard"
  // Tier 3 (Lv 30)
  | "triple-shot"
  | "quad-tank"
  | "assassin"
  | "overseer"
  | "destroyer"
  | "gunner"
  | "tri-angle"
  // Tier 4 (Lv 45)
  | "octo-tank"
  | "overlord"
  | "annihilator"
  | "booster";

export interface BarrelDef {
  length: number;      // relative to tank radius
  width: number;       // relative to tank radius
  angle: number;       // radians relative to tank facing
  offsetForward?: number;
  offsetLateral?: number;
  recoil: number;      // pushback multiplier on tank
  bulletSpeedMult?: number;
  bulletDamageMult?: number;
  bulletSizeMult?: number;
  reloadDelay?: number; // phase delay (0..1)
}

export interface TankClassDef {
  id: TankClassId;
  name: string;
  tier: 1 | 2 | 3 | 4;
  reqLevel: number;
  description: string;
  parentClass?: TankClassId;
  barrels: BarrelDef[];
  hasDrones?: boolean;
  maxDrones?: number;
  baseReload: number;      // ms between shots
  bodyRadius: number;
  bulletColor?: string;
  fovMultiplier?: number;  // For snipers (zoom out)
}

export type StatKey =
  | "healthRegen"
  | "maxHealth"
  | "bodyDamage"
  | "bulletSpeed"
  | "bulletPenetration"
  | "bulletDamage"
  | "reload"
  | "movementSpeed";

export interface TankStats {
  healthRegen: number;       // 0 to 7
  maxHealth: number;         // 0 to 7
  bodyDamage: number;        // 0 to 7
  bulletSpeed: number;       // 0 to 7
  bulletPenetration: number; // 0 to 7
  bulletDamage: number;      // 0 to 7
  reload: number;            // 0 to 7
  movementSpeed: number;     // 0 to 7
}

export type ShapeType = "square" | "triangle" | "pentagon" | "alpha-pentagon" | "crasher" | "green-square";

export interface ShapeEntity {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  health: number;
  maxHealth: number;
  radius: number;
  xpValue: number;
  bodyDamage: number;
  active: boolean;
  damagedTimer: number;
}

export interface BulletEntity {
  id: number;
  ownerId: number;
  isBot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;         // Bullet penetration
  maxHealth: number;
  damage: number;
  lifetime: number;       // Remaining ticks
  color: string;
  active: boolean;
}

export interface DroneEntity {
  id: number;
  ownerId: number;
  isBot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  rotation: number;
  health: number;
  maxHealth: number;
  damage: number;
  radius: number;
  active: boolean;
  damagedTimer: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  active: boolean;
}

export interface TankEntity {
  id: number;
  name: string;
  isBot: boolean;
  classId: TankClassId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  health: number;
  maxHealth: number;
  level: number;
  score: number;
  statPoints: number;
  stats: TankStats;
  barrelCooldowns: number[];
  barrelRecoils: number[];
  damagedTimer: number;
  color: string;
  active: boolean;
  // Bot AI state
  aiState?: "farming" | "attacking" | "fleeing";
  targetEntityId?: number | null;
  botThinkTimer?: number;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  classId: TankClassId;
  isPlayer: boolean;
  color: string;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  killerColor: string;
  victimColor: string;
  timestamp: number;
}
