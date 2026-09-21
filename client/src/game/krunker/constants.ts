import { WeaponClass, WeaponDef } from "./types";

export const WEAPON_DEFS: Record<WeaponClass, WeaponDef> = {
  triggerman: {
    id: "triggerman",
    name: "Triggerman",
    className: "Triggerman",
    category: "Assault Rifle",
    description: "Versatile, rapid fully-automatic assault rifle. Well-rounded for all combat ranges.",
    primaryColor: "#38bdf8", // Sky blue
    damage: 23,
    headshotMultiplier: 1.5,
    pellets: 1,
    fireRate: 9.0, // 9 rounds/sec
    magSize: 30,
    reloadTime: 1.6,
    recoil: 0.024,
    hipSpread: 0.02,
    adsSpread: 0.005,
    adsZoom: 0.8,
    isFullAuto: true,
    modelType: "rifle",
    movementSpeed: 1.0,
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    className: "Hunter",
    category: "Sniper Rifle",
    description: "High-caliber bolt-action sniper rifle. Devastating headshots, lethal precision at distance.",
    primaryColor: "#f59e0b", // Amber
    damage: 85,
    headshotMultiplier: 2.0, // 170 damage on headshot (instant kill)
    pellets: 1,
    fireRate: 1.1, // Bolt action cycle
    magSize: 4,
    reloadTime: 2.2,
    recoil: 0.08,
    hipSpread: 0.07,
    adsSpread: 0.001,
    adsZoom: 0.4, // High zoom
    isFullAuto: false,
    modelType: "sniper",
    movementSpeed: 0.95,
  },
  "run-n-gun": {
    id: "run-n-gun",
    name: "Run N Gun",
    className: "Run N Gun",
    category: "Submachine Gun",
    description: "Lightweight, ultra-high rate of fire SMG. Exceptional mobility and slide-hopping speed.",
    primaryColor: "#a855f7", // Purple
    damage: 17,
    headshotMultiplier: 1.45,
    pellets: 1,
    fireRate: 14.0, // 14 rounds/sec
    magSize: 34,
    reloadTime: 1.4,
    recoil: 0.022,
    hipSpread: 0.035,
    adsSpread: 0.012,
    adsZoom: 0.85,
    isFullAuto: true,
    modelType: "smg",
    movementSpeed: 1.12, // +12% mobility
  },
  vince: {
    id: "vince",
    name: "Vince",
    className: "Vince",
    category: "Shotgun",
    description: "Pump-action shotgun with heavy multi-pellet spread. Allows shotgun-jump vertical boosts.",
    primaryColor: "#ef4444", // Red
    damage: 12, // per pellet
    headshotMultiplier: 1.4,
    pellets: 8, // 8 x 12 = 96 max body damage
    fireRate: 1.4,
    magSize: 2,
    reloadTime: 1.5,
    recoil: 0.09,
    hipSpread: 0.065,
    adsSpread: 0.045,
    adsZoom: 0.88,
    isFullAuto: false,
    modelType: "shotgun",
    movementSpeed: 1.02,
  },
  detective: {
    id: "detective",
    name: "Detective",
    className: "Detective",
    category: "Revolver",
    description: "Heavy six-shooter revolver with high stopping power, crisp cadence, and swift draws.",
    primaryColor: "#10b981", // Emerald
    damage: 52,
    headshotMultiplier: 1.6, // 83.2 headshot
    pellets: 1,
    fireRate: 3.5,
    magSize: 6,
    reloadTime: 1.7,
    recoil: 0.05,
    hipSpread: 0.022,
    adsSpread: 0.004,
    adsZoom: 0.82,
    isFullAuto: false,
    modelType: "revolver",
    movementSpeed: 1.05,
  },
};

// Physics and Slide-Hopping constants
export const PHYSICS = {
  GRAVITY: 38.0,
  BASE_SPEED: 17.5,
  AIR_ACCEL: 8.0,
  GROUND_ACCEL: 55.0,
  GROUND_FRICTION: 7.5,
  SLIDE_FRICTION: 0.8, // Very low friction during slide
  SLIDE_BOOST: 13.5, // Forward velocity burst when pressing slide
  SLIDE_DURATION: 0.85, // Seconds max slide before friction restores
  SLIDE_HEIGHT: 1.1, // Camera height while sliding
  STAND_HEIGHT: 1.9, // Camera height standing
  JUMP_FORCE: 14.2,
  SHOTGUN_JUMP_FORCE: 12.0, // Vince shotgun recoil boost
  MAX_SLIDE_SPEED: 58.0, // High velocity cap for skilled slide-hoppers
  PLAYER_RADIUS: 0.75,
  RESPAWN_DELAY: 2.8,
  INVULNERABLE_DURATION: 2.0,
};

export const BOT_NAMES = [
  "Voxel_Apex",
  "ShadowSnipe",
  "BhopGod",
  "PixelPhantom",
  "CyberKev",
  "KrunkerPro99",
  "NeonSpecter",
  "TurboSlide",
];

export const BOT_COLORS = [
  "#ef4444", // Crimson
  "#f97316", // Orange
  "#eab308", // Yellow
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
];

// Arena Map Spawn points
export const SPAWN_POINTS = [
  { x: 0, y: 1.0, z: 0 },
  { x: -32, y: 1.0, z: -32 },
  { x: 32, y: 1.0, z: -32 },
  { x: -32, y: 1.0, z: 32 },
  { x: 32, y: 1.0, z: 32 },
  { x: 0, y: 1.0, z: -40 },
  { x: 0, y: 1.0, z: 40 },
  { x: -40, y: 1.0, z: 0 },
  { x: 40, y: 1.0, z: 0 },
  { x: 18, y: 8.5, z: 18 }, // High tower
  { x: -18, y: 8.5, z: -18 }, // High bridge
];
