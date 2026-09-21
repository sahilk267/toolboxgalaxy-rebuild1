// Surviv Battle Royale - Procedural Island Map & Structure Generator
import { MAP_SIZE } from "./constants";
import type { Obstacle, GroundLoot, WeaponId, AmmoType, LootType } from "./types";

export function generateIslandMap(): { obstacles: Obstacle[]; initialLoot: GroundLoot[] } {
  const obstacles: Obstacle[] = [];
  const initialLoot: GroundLoot[] = [];
  let nextObsId = 1;
  let nextLootId = 1;

  // 1. Boundary Perimeter Walls (Water fence)
  const wallThick = 60;
  // Top
  obstacles.push({
    id: nextObsId++,
    type: "wall",
    x: MAP_SIZE / 2,
    y: wallThick / 2,
    radius: 0,
    width: MAP_SIZE,
    height: wallThick,
    health: 99999,
    maxHealth: 99999,
    collidable: true,
    destructible: false,
    color: "#1e293b",
    active: true
  });
  // Bottom
  obstacles.push({
    id: nextObsId++,
    type: "wall",
    x: MAP_SIZE / 2,
    y: MAP_SIZE - wallThick / 2,
    radius: 0,
    width: MAP_SIZE,
    height: wallThick,
    health: 99999,
    maxHealth: 99999,
    collidable: true,
    destructible: false,
    color: "#1e293b",
    active: true
  });
  // Left
  obstacles.push({
    id: nextObsId++,
    type: "wall",
    x: wallThick / 2,
    y: MAP_SIZE / 2,
    radius: 0,
    width: wallThick,
    height: MAP_SIZE,
    health: 99999,
    maxHealth: 99999,
    collidable: true,
    destructible: false,
    color: "#1e293b",
    active: true
  });
  // Right
  obstacles.push({
    id: nextObsId++,
    type: "wall",
    x: MAP_SIZE - wallThick / 2,
    y: MAP_SIZE / 2,
    radius: 0,
    width: wallThick,
    height: MAP_SIZE,
    health: 99999,
    maxHealth: 99999,
    collidable: true,
    destructible: false,
    color: "#1e293b",
    active: true
  });

  // 2. Add 2 Military Compounds / Bunkers
  const bunkers = [
    { cx: 850, cy: 850, w: 260, h: 200 },
    { cx: 1950, cy: 1850, w: 280, h: 220 }
  ];

  for (const b of bunkers) {
    const hw = b.w / 2;
    const hh = b.h / 2;
    // North wall (with door gap)
    obstacles.push({
      id: nextObsId++,
      type: "wall",
      x: b.cx - 60,
      y: b.cy - hh,
      radius: 0,
      width: b.w - 120,
      height: 20,
      health: 99999,
      maxHealth: 99999,
      collidable: true,
      destructible: false,
      color: "#334155",
      active: true
    });
    // South wall
    obstacles.push({
      id: nextObsId++,
      type: "wall",
      x: b.cx,
      y: b.cy + hh,
      radius: 0,
      width: b.w,
      height: 20,
      health: 99999,
      maxHealth: 99999,
      collidable: true,
      destructible: false,
      color: "#334155",
      active: true
    });
    // West wall
    obstacles.push({
      id: nextObsId++,
      type: "wall",
      x: b.cx - hw,
      y: b.cy,
      radius: 0,
      width: 20,
      height: b.h,
      health: 99999,
      maxHealth: 99999,
      collidable: true,
      destructible: false,
      color: "#334155",
      active: true
    });
    // East wall
    obstacles.push({
      id: nextObsId++,
      type: "wall",
      x: b.cx + hw,
      y: b.cy,
      radius: 0,
      width: 20,
      height: b.h,
      health: 99999,
      maxHealth: 99999,
      collidable: true,
      destructible: false,
      color: "#334155",
      active: true
    });

    // High tier metal crates inside bunker
    obstacles.push({
      id: nextObsId++,
      type: "metal_crate",
      x: b.cx,
      y: b.cy,
      radius: 0,
      width: 44,
      height: 44,
      health: 180,
      maxHealth: 180,
      collidable: true,
      destructible: true,
      dropsLoot: true,
      color: "#475569",
      active: true
    });
  }

  // Helper: check overlap
  const isClear = (x: number, y: number, margin: number) => {
    if (x < 150 || x > MAP_SIZE - 150 || y < 150 || y > MAP_SIZE - 150) return false;
    for (const obs of obstacles) {
      if (obs.type === "wall") {
        const hw = (obs.width || 40) / 2 + margin;
        const hh = (obs.height || 40) / 2 + margin;
        if (Math.abs(x - obs.x) < hw && Math.abs(y - obs.y) < hh) return false;
      } else {
        const dist = Math.hypot(x - obs.x, y - obs.y);
        if (dist < obs.radius + margin) return false;
      }
    }
    return true;
  };

  // 3. Scatter Standard Wooden Crates (80 across map)
  for (let i = 0; i < 90; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const x = Math.random() * (MAP_SIZE - 300) + 150;
      const y = Math.random() * (MAP_SIZE - 300) + 150;
      if (isClear(x, y, 40)) {
        obstacles.push({
          id: nextObsId++,
          type: "crate",
          x,
          y,
          radius: 0,
          width: 38,
          height: 38,
          health: 60,
          maxHealth: 60,
          collidable: true,
          destructible: true,
          dropsLoot: true,
          color: "#b45309",
          active: true
        });
        break;
      }
    }
  }

  // 4. Scatter Trees (110 across map)
  for (let i = 0; i < 110; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const x = Math.random() * (MAP_SIZE - 300) + 150;
      const y = Math.random() * (MAP_SIZE - 300) + 150;
      const radius = Math.random() * 12 + 28; // 28-40px radius
      if (isClear(x, y, radius + 20)) {
        obstacles.push({
          id: nextObsId++,
          type: "tree",
          x,
          y,
          radius,
          health: 9999,
          maxHealth: 9999,
          collidable: true,
          destructible: false,
          color: "#15803d",
          active: true
        });
        break;
      }
    }
  }

  // 5. Scatter Hard Rocks (60 across map)
  for (let i = 0; i < 60; i++) {
    for (let attempts = 0; attempts < 15; attempts++) {
      const x = Math.random() * (MAP_SIZE - 300) + 150;
      const y = Math.random() * (MAP_SIZE - 300) + 150;
      const radius = Math.random() * 8 + 20; // 20-28px
      if (isClear(x, y, radius + 15)) {
        obstacles.push({
          id: nextObsId++,
          type: "rock",
          x,
          y,
          radius,
          health: 200,
          maxHealth: 200,
          collidable: true,
          destructible: true,
          dropsLoot: true,
          color: "#64748b",
          active: true
        });
        break;
      }
    }
  }

  // 6. Scatter Bushes (50 soft foliage spots)
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * (MAP_SIZE - 300) + 150;
    const y = Math.random() * (MAP_SIZE - 300) + 150;
    const radius = Math.random() * 10 + 26;
    obstacles.push({
      id: nextObsId++,
      type: "bush",
      x,
      y,
      radius,
      health: 9999,
      maxHealth: 9999,
      collidable: false, // Players can walk and hide inside
      destructible: false,
      color: "#166534",
      active: true
    });
  }

  // 7. Initial Loose World Loot (50 items scattered on ground)
  const looseWeapons: WeaponId[] = ["m9", "glock", "m870", "mp220", "mac10", "ak47", "m416"];
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * (MAP_SIZE - 400) + 200;
    const y = Math.random() * (MAP_SIZE - 400) + 200;
    const r = Math.random();
    if (r < 0.35) {
      const wId = looseWeapons[Math.floor(Math.random() * looseWeapons.length)];
      initialLoot.push({
        id: nextLootId++,
        type: "weapon",
        x,
        y,
        vx: 0,
        vy: 0,
        weaponId: wId,
        amount: 1,
        active: true
      });
    } else if (r < 0.65) {
      const ammos: AmmoType[] = ["9mm", "12g", "762mm", "556mm"];
      const aType = ammos[Math.floor(Math.random() * ammos.length)];
      initialLoot.push({
        id: nextLootId++,
        type: "ammo",
        x,
        y,
        vx: 0,
        vy: 0,
        ammoType: aType,
        amount: aType === "12g" ? 10 : 30,
        active: true
      });
    } else if (r < 0.85) {
      const medTypes: LootType[] = ["bandage", "soda", "pills", "medkit"];
      const m = medTypes[Math.floor(Math.random() * medTypes.length)];
      initialLoot.push({
        id: nextLootId++,
        type: m,
        x,
        y,
        vx: 0,
        vy: 0,
        amount: m === "bandage" ? 5 : 1,
        active: true
      });
    } else {
      const armors: LootType[] = ["helmet", "vest", "backpack", "scope"];
      const a = armors[Math.floor(Math.random() * armors.length)];
      const tier = Math.random() < 0.7 ? 1 : 2;
      initialLoot.push({
        id: nextLootId++,
        type: a,
        x,
        y,
        vx: 0,
        vy: 0,
        tier,
        amount: 1,
        active: true
      });
    }
  }

  return { obstacles, initialLoot };
}
