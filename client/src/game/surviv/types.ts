// Surviv Battle Royale (2D Top-Down Island Shooter) - Types & Structures

export type WeaponId =
  | "fists"
  | "m9"
  | "glock"
  | "mp220"
  | "m870"
  | "ak47"
  | "m416"
  | "mac10"
  | "mosin";

export type AmmoType = "9mm" | "12g" | "762mm" | "556mm";

export type LootType =
  | "weapon"
  | "ammo"
  | "helmet"
  | "vest"
  | "backpack"
  | "scope"
  | "bandage"
  | "medkit"
  | "soda"
  | "pills";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: "melee" | "pistol" | "shotgun" | "smg" | "rifle" | "sniper";
  ammoType?: AmmoType;
  magSize: number;
  reloadTimeMs: number;
  fireDelayMs: number;
  bulletSpeed: number;
  damage: number;
  spread: number;         // radians
  pellets: number;        // 1 for bullet, 8-10 for shotgun
  barrelLength: number;
  bulletColor: string;
  bulletRadius: number;
  falloffRange: number;
  soundType: "punch" | "pistol" | "shotgun" | "rifle" | "sniper";
}

export interface GroundLoot {
  id: number;
  type: LootType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  weaponId?: WeaponId;
  ammoType?: AmmoType;
  amount: number;       // ammo count or med count
  tier?: number;        // 1, 2, 3 for armor/helmet/backpack/scope
  active: boolean;
}

export interface Obstacle {
  id: number;
  type: "tree" | "rock" | "crate" | "metal_crate" | "wall" | "bush";
  x: number;
  y: number;
  radius: number;       // For circles (tree, rock, bush)
  width?: number;       // For boxes (crates, walls)
  height?: number;
  health: number;
  maxHealth: number;
  collidable: boolean;  // False for bushes
  destructible: boolean;// True for crates/rocks
  dropsLoot?: boolean;
  color: string;
  active: boolean;
}

export interface BulletEntity {
  id: number;
  ownerId: number;
  isBot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
  radius: number;
  color: string;
  active: boolean;
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

export interface InventoryItem {
  weaponId: WeaponId;
  curAmmo: number;
}

export interface PlayerEntity {
  id: number;
  name: string;
  isBot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  boost: number;         // 0 to 100 adrenaline
  helmetTier: number;    // 0, 1, 2, 3
  vestTier: number;      // 0, 1, 2, 3
  backpackTier: number;  // 1, 2, 3
  scopeTier: number;     // 1x, 2x, 4x, 8x

  // Weapons slots: 0 = Primary, 1 = Secondary, 2 = Melee (Fists)
  weapons: [InventoryItem | null, InventoryItem | null, InventoryItem];
  activeSlot: 0 | 1 | 2;
  isReloading: boolean;
  reloadTimer: number;

  // Ammo inventory
  ammo: Record<AmmoType, number>;

  // Medical inventory
  meds: {
    bandages: number;
    medkits: number;
    sodas: number;
    pills: number;
  };

  isUsingMed: boolean;
  medTimer: number;
  medType: "bandage" | "medkit" | "soda" | "pills" | null;

  fireCooldown: number;
  kills: number;
  damageDealt: number;
  active: boolean;
  inBush: boolean;

  // Bot AI
  aiState?: "looting" | "hunting" | "healing" | "fleeing_zone";
  targetX?: number;
  targetY?: number;
  botThinkTimer?: number;
}

export interface ZoneState {
  currentCenterX: number;
  currentCenterY: number;
  currentRadius: number;
  targetCenterX: number;
  targetCenterY: number;
  targetRadius: number;
  phase: number;
  phaseTimer: number;    // seconds left in current wait or shrink
  isShrinking: boolean;
  dps: number;
}

export interface KillFeedEntry {
  id: string;
  killerName: string;
  victimName: string;
  weaponName: string;
  isPlayerKiller: boolean;
  isPlayerVictim: boolean;
  timestamp: number;
}
