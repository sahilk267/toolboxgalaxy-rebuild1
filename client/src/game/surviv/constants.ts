// Surviv Battle Royale - Game Constants, Weapons & Loot Tables
import type { WeaponId, WeaponDef, AmmoType } from "./types";

export const MAP_SIZE = 2800; // 2800x2800 island
export const PLAYER_RADIUS = 20; // 20px player circle
export const FISTS_DAMAGE = 20;

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  fists: {
    id: "fists",
    name: "Fists",
    category: "melee",
    magSize: 0,
    reloadTimeMs: 0,
    fireDelayMs: 280,
    bulletSpeed: 0,
    damage: 22,
    spread: 0,
    pellets: 1,
    barrelLength: 16,
    bulletColor: "#ffffff",
    bulletRadius: 0,
    falloffRange: 35,
    soundType: "punch"
  },
  m9: {
    id: "m9",
    name: "M9 Pistol",
    category: "pistol",
    ammoType: "9mm",
    magSize: 15,
    reloadTimeMs: 1400,
    fireDelayMs: 170,
    bulletSpeed: 1050,
    damage: 16,
    spread: 0.08,
    pellets: 1,
    barrelLength: 26,
    bulletColor: "#facc15",
    bulletRadius: 4,
    falloffRange: 600,
    soundType: "pistol"
  },
  glock: {
    id: "glock",
    name: "Glock 18C",
    category: "pistol",
    ammoType: "9mm",
    magSize: 20,
    reloadTimeMs: 1500,
    fireDelayMs: 85,
    bulletSpeed: 980,
    damage: 13,
    spread: 0.14,
    pellets: 1,
    barrelLength: 25,
    bulletColor: "#facc15",
    bulletRadius: 3.5,
    falloffRange: 500,
    soundType: "pistol"
  },
  mp220: {
    id: "mp220",
    name: "MP220 Double-Barrel",
    category: "shotgun",
    ammoType: "12g",
    magSize: 2,
    reloadTimeMs: 1800,
    fireDelayMs: 180,
    bulletSpeed: 900,
    damage: 14, // 14 x 9 pellets = 126 damage point blank!
    spread: 0.22,
    pellets: 9,
    barrelLength: 34,
    bulletColor: "#ef4444",
    bulletRadius: 3,
    falloffRange: 380,
    soundType: "shotgun"
  },
  m870: {
    id: "m870",
    name: "M870 Pump Shotgun",
    category: "shotgun",
    ammoType: "12g",
    magSize: 5,
    reloadTimeMs: 2400,
    fireDelayMs: 850,
    bulletSpeed: 920,
    damage: 13, // 13 x 10 pellets = 130 max
    spread: 0.18,
    pellets: 10,
    barrelLength: 36,
    bulletColor: "#ef4444",
    bulletRadius: 3,
    falloffRange: 420,
    soundType: "shotgun"
  },
  ak47: {
    id: "ak47",
    name: "AK-47 Rifle",
    category: "rifle",
    ammoType: "762mm",
    magSize: 30,
    reloadTimeMs: 2100,
    fireDelayMs: 115,
    bulletSpeed: 1150,
    damage: 22,
    spread: 0.07,
    pellets: 1,
    barrelLength: 38,
    bulletColor: "#38bdf8",
    bulletRadius: 4.5,
    falloffRange: 850,
    soundType: "rifle"
  },
  m416: {
    id: "m416",
    name: "M416 Assault Rifle",
    category: "rifle",
    ammoType: "556mm",
    magSize: 30,
    reloadTimeMs: 1900,
    fireDelayMs: 95,
    bulletSpeed: 1200,
    damage: 18,
    spread: 0.05,
    pellets: 1,
    barrelLength: 37,
    bulletColor: "#4ade80",
    bulletRadius: 4,
    falloffRange: 900,
    soundType: "rifle"
  },
  mac10: {
    id: "mac10",
    name: "MAC-10 SMG",
    category: "smg",
    ammoType: "9mm",
    magSize: 32,
    reloadTimeMs: 1600,
    fireDelayMs: 65, // super high rate of fire
    bulletSpeed: 950,
    damage: 12,
    spread: 0.20,
    pellets: 1,
    barrelLength: 24,
    bulletColor: "#facc15",
    bulletRadius: 3.5,
    falloffRange: 450,
    soundType: "pistol"
  },
  mosin: {
    id: "mosin",
    name: "Mosin-Nagant Sniper",
    category: "sniper",
    ammoType: "762mm",
    magSize: 5,
    reloadTimeMs: 2800,
    fireDelayMs: 1100,
    bulletSpeed: 1450,
    damage: 75,
    spread: 0.015,
    pellets: 1,
    barrelLength: 46,
    bulletColor: "#60a5fa",
    bulletRadius: 5.5,
    falloffRange: 1200,
    soundType: "sniper"
  }
};

export const AMMO_COLORS: Record<AmmoType, { bg: string; text: string; label: string }> = {
  "9mm": { bg: "#f59e0b", text: "#000000", label: "9mm" },
  "12g": { bg: "#dc2626", text: "#ffffff", label: "12 Gauge" },
  "762mm": { bg: "#0284c7", text: "#ffffff", label: "7.62mm" },
  "556mm": { bg: "#16a34a", text: "#ffffff", label: "5.56mm" }
};

export const ARMOR_DAMAGE_REDUCTION = [0, 0.25, 0.40, 0.55]; // Tiers 0, 1, 2, 3
export const HELMET_DAMAGE_REDUCTION = [0, 0.20, 0.35, 0.50];

export const MAX_AMMO_BY_BACKPACK: Record<number, Record<AmmoType, number>> = {
  1: { "9mm": 120, "12g": 30, "762mm": 90, "556mm": 90 },
  2: { "9mm": 240, "12g": 60, "762mm": 180, "556mm": 180 },
  3: { "9mm": 360, "12g": 90, "762mm": 270, "556mm": 270 }
};

export const MEDS_CONFIG = {
  bandage: { name: "Bandage", heal: 15, maxHpCap: 75, timeMs: 2500, icon: "🩹" },
  medkit: { name: "Medkit", heal: 100, maxHpCap: 100, timeMs: 4500, icon: "🧰" },
  soda: { name: "Soda", boost: 25, timeMs: 2000, icon: "🥤" },
  pills: { name: "Painkillers", boost: 50, timeMs: 3000, icon: "💊" }
};

// Zone shrink timeline
export const ZONE_PHASES = [
  { waitTime: 25, shrinkTime: 45, radiusRatio: 0.65, dps: 1.5 },
  { waitTime: 20, shrinkTime: 40, radiusRatio: 0.38, dps: 3.0 },
  { waitTime: 15, shrinkTime: 30, radiusRatio: 0.18, dps: 6.0 },
  { waitTime: 10, shrinkTime: 25, radiusRatio: 0.05, dps: 12.0 },
  { waitTime: 5, shrinkTime: 15, radiusRatio: 0.0, dps: 20.0 }
];

export const BOT_NAMES = [
  "ShadowStriker", "CrateCracker", "ViperAim", "BushCamper", "PixelCommando",
  "StormRunner", "RedZoneGhost", "SniperElite", "FlankKing", "BunkerBuster",
  "DeltaOne", "IronSkin", "RogueOperative", "LoneWolf", "BulletRain",
  "AdrenalineMax", "GhostInTheSmoke", "AlphaHunter", "TriggerHappy", "EchoZero",
  "KevlarTitan", "Spectre", "ZeroHour", "Wanderer", "TacticalOps",
  "ZoneStalker", "Helix", "SavageReaper", "QuickDraw"
];
