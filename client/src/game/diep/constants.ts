// Diep Arena - Constants, Formulas, Evolution Trees & Level Progression
import type { TankClassDef, TankClassId, StatKey } from "./types";

export const ARENA_SIZE = 3200;
export const NEST_RADIUS = 500;
export const MAX_LEVEL = 45;

export const STAT_LABELS: Record<StatKey, { name: string; color: string; hotkey: string }> = {
  healthRegen:       { name: "Health Regen",       color: "#f08080", hotkey: "1" },
  maxHealth:         { name: "Max Health",         color: "#ff7f50", hotkey: "2" },
  bodyDamage:        { name: "Body Damage",        color: "#da70d6", hotkey: "3" },
  bulletSpeed:       { name: "Bullet Speed",       color: "#00bfff", hotkey: "4" },
  bulletPenetration: { name: "Bullet Penetration", color: "#ffd700", hotkey: "5" },
  bulletDamage:      { name: "Bullet Damage",      color: "#ff4500", hotkey: "6" },
  reload:            { name: "Reload",             color: "#32cd32", hotkey: "7" },
  movementSpeed:     { name: "Movement Speed",     color: "#00fa9a", hotkey: "8" },
};

// Diep.io Level XP Curve
export const LEVEL_XP: number[] = [
  0,      // Lv 1
  10,     // Lv 2
  30,     // Lv 3
  65,     // Lv 4
  120,    // Lv 5
  200,    // Lv 6
  310,    // Lv 7
  455,    // Lv 8
  640,    // Lv 9
  870,    // Lv 10
  1150,   // Lv 11
  1490,   // Lv 12
  1895,   // Lv 13
  2375,   // Lv 14
  2940,   // Lv 15 -> Tier 2
  3600,   // Lv 16
  4365,   // Lv 17
  5245,   // Lv 18
  6255,   // Lv 19
  7405,   // Lv 20
  8710,   // Lv 21
  10185,  // Lv 22
  11845,  // Lv 23
  13705,  // Lv 24
  15780,  // Lv 25
  18090,  // Lv 26
  20650,  // Lv 27
  23480,  // Lv 28 -> Last 1-per-level point
  26600,  // Lv 29
  30030,  // Lv 30 -> Tier 3
  33800,  // Lv 31
  37930,  // Lv 32
  42450,  // Lv 33
  47385,  // Lv 34
  52765,  // Lv 35
  58620,  // Lv 36
  64985,  // Lv 37
  71895,  // Lv 38
  79385,  // Lv 39
  87495,  // Lv 40
  96265,  // Lv 41
  105740, // Lv 42
  115965, // Lv 43
  126990, // Lv 44
  138865  // Lv 45 -> Tier 4 Max
];

// Checks if a stat point is awarded at level N
export function isStatPointLevel(level: number): boolean {
  if (level <= 1) return false;
  if (level <= 28) return true;
  return level === 30 || level === 33 || level === 36 || level === 39 || level === 42 || level === 45;
}

// Calculate level from total score
export function getLevelFromScore(score: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (score >= LEVEL_XP[i]) return i + 1;
  }
  return 1;
}

// TANK EVOLUTION CLASSES CATALOG
export const TANK_CLASSES: Record<TankClassId, TankClassDef> = {
  basic: {
    id: "basic",
    name: "Basic Tank",
    tier: 1,
    reqLevel: 1,
    description: "Standard balanced starter tank with a single reliable cannon.",
    bodyRadius: 24,
    baseReload: 380,
    barrels: [
      { length: 1.8, width: 0.85, angle: 0, recoil: 0.25, bulletSpeedMult: 1, bulletDamageMult: 1, bulletSizeMult: 1 }
    ]
  },

  // TIER 2 (Level 15)
  twin: {
    id: "twin",
    name: "Twin",
    tier: 2,
    reqLevel: 15,
    parentClass: "basic",
    description: "Dual parallel cannons delivering double bullet volume and suppressive fire.",
    bodyRadius: 24,
    baseReload: 220,
    barrels: [
      { length: 1.8, width: 0.8, angle: 0, offsetLateral: -9, recoil: 0.18, bulletSpeedMult: 1, bulletDamageMult: 0.7, bulletSizeMult: 0.9, reloadDelay: 0 },
      { length: 1.8, width: 0.8, angle: 0, offsetLateral: 9, recoil: 0.18, bulletSpeedMult: 1, bulletDamageMult: 0.7, bulletSizeMult: 0.9, reloadDelay: 0.5 }
    ]
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    tier: 2,
    reqLevel: 15,
    parentClass: "basic",
    description: "Long-range precision rifle with extended field of view and high velocity.",
    bodyRadius: 24,
    baseReload: 700,
    fovMultiplier: 1.25,
    barrels: [
      { length: 2.5, width: 0.85, angle: 0, recoil: 0.4, bulletSpeedMult: 1.5, bulletDamageMult: 1.5, bulletSizeMult: 1.05 }
    ]
  },
  "machine-gun": {
    id: "machine-gun",
    name: "Machine Gun",
    tier: 2,
    reqLevel: 15,
    parentClass: "basic",
    description: "Flared high-spread cannon with rapid firing rate and heavy spray.",
    bodyRadius: 24,
    baseReload: 160,
    barrels: [
      { length: 1.7, width: 1.25, angle: 0, recoil: 0.15, bulletSpeedMult: 0.9, bulletDamageMult: 0.65, bulletSizeMult: 0.85 }
    ]
  },
  "flank-guard": {
    id: "flank-guard",
    name: "Flank Guard",
    tier: 2,
    reqLevel: 15,
    parentClass: "basic",
    description: "Opposing dual cannons firing forwards and backwards to protect rear flank.",
    bodyRadius: 24,
    baseReload: 380,
    barrels: [
      { length: 1.8, width: 0.85, angle: 0, recoil: 0.25, bulletSpeedMult: 1, bulletDamageMult: 1, bulletSizeMult: 1 },
      { length: 1.4, width: 0.85, angle: Math.PI, recoil: 0.2, bulletSpeedMult: 1, bulletDamageMult: 0.85, bulletSizeMult: 0.95 }
    ]
  },

  // TIER 3 (Level 30)
  "triple-shot": {
    id: "triple-shot",
    name: "Triple Shot",
    tier: 3,
    reqLevel: 30,
    parentClass: "twin",
    description: "Spreads fire across three forward angles for wide area coverage.",
    bodyRadius: 24,
    baseReload: 250,
    barrels: [
      { length: 1.8, width: 0.8, angle: 0, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: 0.55, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: -0.55, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 }
    ]
  },
  "quad-tank": {
    id: "quad-tank",
    name: "Quad Tank",
    tier: 3,
    reqLevel: 30,
    parentClass: "flank-guard",
    description: "Omnidirectional 4-way cannon array covering all cardinal directions.",
    bodyRadius: 24,
    baseReload: 320,
    barrels: [
      { length: 1.7, width: 0.8, angle: 0, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.8, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: Math.PI * 0.5, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.8, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: Math.PI, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.8, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: -Math.PI * 0.5, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.8, bulletSizeMult: 0.9 }
    ]
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    tier: 3,
    reqLevel: 30,
    parentClass: "sniper",
    description: "Extreme range sniper with massive visual range and deadly projectile speed.",
    bodyRadius: 24,
    baseReload: 850,
    fovMultiplier: 1.45,
    barrels: [
      { length: 2.8, width: 0.85, angle: 0, recoil: 0.5, bulletSpeedMult: 1.8, bulletDamageMult: 2.1, bulletSizeMult: 1.15 }
    ]
  },
  overseer: {
    id: "overseer",
    name: "Overseer",
    tier: 3,
    reqLevel: 30,
    parentClass: "sniper",
    description: "Spawns and commands an autonomous swarm of lethal seeker drones.",
    bodyRadius: 25,
    baseReload: 1200,
    hasDrones: true,
    maxDrones: 6,
    barrels: [
      { length: 1.5, width: 1.4, angle: 0.55, recoil: 0.1 },
      { length: 1.5, width: 1.4, angle: -0.55, recoil: 0.1 }
    ]
  },
  destroyer: {
    id: "destroyer",
    name: "Destroyer",
    tier: 3,
    reqLevel: 30,
    parentClass: "machine-gun",
    description: "Fires massive, slow-moving destructive cannonballs with heavy recoil thrust.",
    bodyRadius: 25,
    baseReload: 1100,
    barrels: [
      { length: 1.9, width: 1.8, angle: 0, recoil: 1.4, bulletSpeedMult: 0.85, bulletDamageMult: 3.8, bulletSizeMult: 2.2 }
    ]
  },
  gunner: {
    id: "gunner",
    name: "Gunner",
    tier: 3,
    reqLevel: 30,
    parentClass: "machine-gun",
    description: "Four micro-cannons delivering ultra-rapid stream of needle-point bullets.",
    bodyRadius: 24,
    baseReload: 90,
    barrels: [
      { length: 1.6, width: 0.4, angle: 0, offsetLateral: -6, recoil: 0.08, bulletSpeedMult: 1.25, bulletDamageMult: 0.35, bulletSizeMult: 0.55, reloadDelay: 0 },
      { length: 1.6, width: 0.4, angle: 0, offsetLateral: 6, recoil: 0.08, bulletSpeedMult: 1.25, bulletDamageMult: 0.35, bulletSizeMult: 0.55, reloadDelay: 0.5 },
      { length: 1.8, width: 0.4, angle: 0, offsetLateral: -2, recoil: 0.08, bulletSpeedMult: 1.25, bulletDamageMult: 0.35, bulletSizeMult: 0.55, reloadDelay: 0.25 },
      { length: 1.8, width: 0.4, angle: 0, offsetLateral: 2, recoil: 0.08, bulletSpeedMult: 1.25, bulletDamageMult: 0.35, bulletSizeMult: 0.55, reloadDelay: 0.75 }
    ]
  },
  "tri-angle": {
    id: "tri-angle",
    name: "Tri-Angle",
    tier: 3,
    reqLevel: 30,
    parentClass: "flank-guard",
    description: "Two angled rear thruster cannons that propel the tank to unmatched velocity.",
    bodyRadius: 24,
    baseReload: 220,
    barrels: [
      { length: 1.8, width: 0.8, angle: 0, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.9, bulletSizeMult: 0.95 },
      { length: 1.4, width: 0.8, angle: Math.PI - 0.4, recoil: 0.45, bulletSpeedMult: 0.9, bulletDamageMult: 0.5, bulletSizeMult: 0.75 },
      { length: 1.4, width: 0.8, angle: -Math.PI + 0.4, recoil: 0.45, bulletSpeedMult: 0.9, bulletDamageMult: 0.5, bulletSizeMult: 0.75 }
    ]
  },

  // TIER 4 (Level 45)
  "octo-tank": {
    id: "octo-tank",
    name: "Octo Tank",
    tier: 4,
    reqLevel: 45,
    parentClass: "quad-tank",
    description: "Eight radial cannons creating a perpetual 360-degree storm of firepower.",
    bodyRadius: 26,
    baseReload: 200,
    barrels: [
      { length: 1.7, width: 0.8, angle: 0, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: Math.PI * 0.25, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: Math.PI * 0.5, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: Math.PI * 0.75, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: Math.PI, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: -Math.PI * 0.75, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: -Math.PI * 0.5, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 },
      { length: 1.7, width: 0.8, angle: -Math.PI * 0.25, recoil: 0.08, bulletSpeedMult: 1, bulletDamageMult: 0.75, bulletSizeMult: 0.9 }
    ]
  },
  overlord: {
    id: "overlord",
    name: "Overlord",
    tier: 4,
    reqLevel: 45,
    parentClass: "overseer",
    description: "Master drone controller commanding 8 heavy attack drones simultaneously.",
    bodyRadius: 26,
    baseReload: 1000,
    hasDrones: true,
    maxDrones: 8,
    barrels: [
      { length: 1.5, width: 1.4, angle: 0, recoil: 0.05 },
      { length: 1.5, width: 1.4, angle: Math.PI * 0.5, recoil: 0.05 },
      { length: 1.5, width: 1.4, angle: Math.PI, recoil: 0.05 },
      { length: 1.5, width: 1.4, angle: -Math.PI * 0.5, recoil: 0.05 }
    ]
  },
  annihilator: {
    id: "annihilator",
    name: "Annihilator",
    tier: 4,
    reqLevel: 45,
    parentClass: "destroyer",
    description: "Colossal super-cannon firing the largest destructive ordnance in the arena.",
    bodyRadius: 26,
    baseReload: 1200,
    barrels: [
      { length: 2.1, width: 2.3, angle: 0, recoil: 1.9, bulletSpeedMult: 0.85, bulletDamageMult: 4.8, bulletSizeMult: 2.9 }
    ]
  },
  booster: {
    id: "booster",
    name: "Booster",
    tier: 4,
    reqLevel: 45,
    parentClass: "tri-angle",
    description: "Four rear booster cannons unleashing hyper-speed ramming momentum.",
    bodyRadius: 24,
    baseReload: 180,
    barrels: [
      { length: 1.8, width: 0.8, angle: 0, recoil: 0.15, bulletSpeedMult: 1, bulletDamageMult: 0.9, bulletSizeMult: 0.95 },
      { length: 1.5, width: 0.7, angle: Math.PI - 0.35, recoil: 0.45, bulletSpeedMult: 0.9, bulletDamageMult: 0.45, bulletSizeMult: 0.7 },
      { length: 1.5, width: 0.7, angle: -Math.PI + 0.35, recoil: 0.45, bulletSpeedMult: 0.9, bulletDamageMult: 0.45, bulletSizeMult: 0.7 },
      { length: 1.3, width: 0.7, angle: Math.PI - 0.55, recoil: 0.35, bulletSpeedMult: 0.9, bulletDamageMult: 0.4, bulletSizeMult: 0.65 },
      { length: 1.3, width: 0.7, angle: -Math.PI + 0.55, recoil: 0.35, bulletSpeedMult: 0.9, bulletDamageMult: 0.4, bulletSizeMult: 0.65 }
    ]
  }
};

// Evolution Options Mapping
export const EVOLUTION_PATHS: Record<TankClassId, TankClassId[]> = {
  basic: ["twin", "sniper", "machine-gun", "flank-guard"],
  twin: ["triple-shot", "quad-tank"],
  sniper: ["assassin", "overseer"],
  "machine-gun": ["destroyer", "gunner"],
  "flank-guard": ["tri-angle", "quad-tank"],
  "triple-shot": ["octo-tank"],
  "quad-tank": ["octo-tank"],
  assassin: [],
  overseer: ["overlord"],
  destroyer: ["annihilator"],
  gunner: [],
  "tri-angle": ["booster"],
  "octo-tank": [],
  overlord: [],
  annihilator: [],
  booster: []
};

// Tank & Shape Color Palette
export const COLORS = {
  player: "#00b2e1",         // Classic Cyan Diep player
  botEnemy: "#f14e54",       // Red enemy
  botTeamBlue: "#00b2e1",
  botTeamGreen: "#00e16e",
  botTeamPurple: "#bf7ff5",
  barrel: "#999999",
  barrelOutline: "#555555",
  tankOutline: "#1d758f",
  enemyOutline: "#a6262a",
  
  square: "#ffe869",         // Yellow Square
  squareOutline: "#bfae4e",
  triangle: "#fc7677",       // Red Triangle
  triangleOutline: "#bd5859",
  pentagon: "#768dfc",       // Blue Pentagon
  pentagonOutline: "#5869bd",
  alphaPentagon: "#768dfc",
  crasher: "#f177dd",        // Pink nest crasher
  crasherOutline: "#b559a6",
  greenSquare: "#89e894",    // Ultra rare green
  greenSquareOutline: "#64ad6c",

  gridBg: "#cdcdcd",
  gridLine: "#c4c4c4",
  gridBorder: "#888888",
  nestBg: "#bfbfd8"
};
