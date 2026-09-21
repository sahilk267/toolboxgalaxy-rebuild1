// Surviv Battle Royale - 2D Vector Canvas Renderer & Input Controller
import { useEffect, useRef, useCallback } from "react";
import { SurvivEngine, type SurvivCallbacks } from "@/game/surviv/engine";
import { SurvivAudio } from "@/game/surviv/audio";
import {
  MAP_SIZE,
  PLAYER_RADIUS,
  WEAPONS,
  AMMO_COLORS
} from "@/game/surviv/constants";
import type { PlayerEntity, Obstacle, GroundLoot, BulletEntity, ParticleEntity } from "@/game/surviv/types";

interface SurvivCanvasProps {
  callbacks: SurvivCallbacks;
  engineRef: React.MutableRefObject<SurvivEngine | null>;
  audio: SurvivAudio;
}

export default function SurvivCanvas({ callbacks, engineRef, audio }: SurvivCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Touch tracking for mobile dual joysticks
  const touchState = useRef({
    moveTouchId: null as number | null,
    aimTouchId: null as number | null,
    moveOrigin: { x: 0, y: 0 },
    moveCurrent: { x: 0, y: 0 },
    aimOrigin: { x: 0, y: 0 },
    aimCurrent: { x: 0, y: 0 }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize simulation engine
    const engine = new SurvivEngine(audio, callbacks);
    engineRef.current = engine;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      engine.keys[e.code] = true;
      if (e.code === "KeyR") {
        engine.reloadWeapon(engine.player);
      } else if (e.code === "Digit1") {
        engine.switchWeapon(0);
      } else if (e.code === "Digit2") {
        engine.switchWeapon(1);
      } else if (e.code === "Digit3") {
        engine.switchWeapon(2);
      } else if (e.code === "Digit7") {
        engine.useMed(engine.player, "bandage");
      } else if (e.code === "Digit8") {
        engine.useMed(engine.player, "medkit");
      } else if (e.code === "Digit9") {
        engine.useMed(engine.player, "soda");
      } else if (e.code === "Digit0") {
        engine.useMed(engine.player, "pills");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const p = engine.player;
      const scopeZoom = [1.0, 1.0, 0.85, 0.68, 0.52][p.scopeTier] || 1.0;
      const cx = width / 2;
      const cy = height / 2;

      engine.mouseWorldX = p.x + (e.clientX - cx) / scopeZoom;
      engine.mouseWorldY = p.y + (e.clientY - cy) / scopeZoom;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        engine.isMouseDown = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        engine.isMouseDown = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const nextSlot = e.deltaY > 0 ? (engine.player.activeSlot + 1) % 3 : (engine.player.activeSlot + 2) % 3;
      engine.switchWeapon(nextSlot as 0 | 1 | 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Touch Event Handlers for Mobile Dual Joysticks
    const handleTouchStart = (e: TouchEvent) => {
      const ts = touchState.current;
      const halfWidth = width / 2;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX < halfWidth && ts.moveTouchId === null) {
          // Left half -> Move joystick
          ts.moveTouchId = t.identifier;
          ts.moveOrigin = { x: t.clientX, y: t.clientY };
          ts.moveCurrent = { x: t.clientX, y: t.clientY };
          engine.moveStick.active = true;
        } else if (t.clientX >= halfWidth && ts.aimTouchId === null) {
          // Right half -> Aim & fire joystick
          ts.aimTouchId = t.identifier;
          ts.aimOrigin = { x: t.clientX, y: t.clientY };
          ts.aimCurrent = { x: t.clientX, y: t.clientY };
          engine.aimStick.active = true;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const ts = touchState.current;
      const maxRadius = 55;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === ts.moveTouchId) {
          ts.moveCurrent = { x: t.clientX, y: t.clientY };
          const dx = t.clientX - ts.moveOrigin.x;
          const dy = t.clientY - ts.moveOrigin.y;
          const dist = Math.hypot(dx, dy);
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);
          engine.moveStick.x = (Math.cos(angle) * clampedDist) / maxRadius;
          engine.moveStick.y = (Math.sin(angle) * clampedDist) / maxRadius;
        } else if (t.identifier === ts.aimTouchId) {
          ts.aimCurrent = { x: t.clientX, y: t.clientY };
          const dx = t.clientX - ts.aimOrigin.x;
          const dy = t.clientY - ts.aimOrigin.y;
          const dist = Math.hypot(dx, dy);
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);
          engine.aimStick.x = (Math.cos(angle) * clampedDist) / maxRadius;
          engine.aimStick.y = (Math.sin(angle) * clampedDist) / maxRadius;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const ts = touchState.current;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === ts.moveTouchId) {
          ts.moveTouchId = null;
          engine.moveStick.active = false;
          engine.moveStick.x = 0;
          engine.moveStick.y = 0;
        } else if (t.identifier === ts.aimTouchId) {
          ts.aimTouchId = null;
          engine.aimStick.active = false;
          engine.aimStick.x = 0;
          engine.aimStick.y = 0;
        }
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    // Render loop
    let animId: number;
    const render = () => {
      const p = engine.player;
      const scopeZoom = [1.0, 1.0, 0.85, 0.68, 0.52][p.scopeTier] || 1.0;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Camera Transform: center on player with scope zoom
      ctx.translate(width / 2, height / 2);
      ctx.scale(scopeZoom, scopeZoom);
      ctx.translate(-p.x, -p.y);

      // 1. Draw Deep Ocean Water
      ctx.fillStyle = "#0c4a6e";
      ctx.fillRect(-600, -600, MAP_SIZE + 1200, MAP_SIZE + 1200);

      // 2. Draw Island Grass Terrain
      ctx.fillStyle = "#719853";
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Sand Beach Shore Border
      ctx.lineWidth = 28;
      ctx.strokeStyle = "#eab308";
      ctx.strokeRect(14, 14, MAP_SIZE - 28, MAP_SIZE - 28);

      // Subtle Grid / Topo Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
      const step = 80;
      ctx.beginPath();
      for (let x = 0; x <= MAP_SIZE; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_SIZE);
      }
      for (let y = 0; y <= MAP_SIZE; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_SIZE, y);
      }
      ctx.stroke();

      // 3. Draw Red Toxic Gas Zone
      drawRedZone(ctx, engine);

      // 4. Draw Ground Loot Items
      drawGroundLoot(ctx, engine.loot);

      // 5. Draw Obstacles (Base layer: Rocks, Crates, Walls)
      drawObstacles(ctx, engine.obstacles);

      // 6. Draw Bullets & Tracers
      drawBullets(ctx, engine.bullets);

      // 7. Draw Characters (Bots + Player)
      for (const bot of engine.bots) {
        if (bot.active) {
          drawCharacter(ctx, bot, engine, false);
        }
      }
      if (p.active) {
        drawCharacter(ctx, p, engine, true);
      }

      // 8. Draw Canopy Layer (Tree tops & Bushes above players)
      drawCanopiesAndBushes(ctx, engine.obstacles);

      // 9. Draw Particle Debris & Blood
      drawParticles(ctx, engine.particles);

      ctx.restore();

      // 10. Draw Screen-Space Overlays (Red storm vignette if outside circle, Touch Joysticks)
      drawScreenHUD(ctx, engine, width, height, touchState.current);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      engine.dispose();
    };
  }, [audio, callbacks, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none block"
    />
  );
}

// Sub-renderers

function drawRedZone(ctx: CanvasRenderingContext2D, engine: SurvivEngine) {
  const z = engine.zone;

  // Outer Red Haze (Toxic Gas)
  ctx.save();
  ctx.beginPath();
  ctx.rect(-1000, -1000, MAP_SIZE + 2000, MAP_SIZE + 2000);
  ctx.arc(z.currentCenterX, z.currentCenterY, z.currentRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = "rgba(220, 38, 38, 0.28)";
  ctx.fill();

  // Red Zone Boundary Ring
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(z.currentCenterX, z.currentCenterY, z.currentRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Target Safe Zone White Outline (Dotted)
  if (z.isShrinking || z.currentRadius > z.targetRadius) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(z.targetCenterX, z.targetCenterY, z.targetRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawGroundLoot(ctx: CanvasRenderingContext2D, loot: GroundLoot[]) {
  ctx.save();
  for (const item of loot) {
    if (!item.active) continue;

    ctx.save();
    ctx.translate(item.x, item.y);

    if (item.type === "weapon" && item.weaponId) {
      const wep = WEAPONS[item.weaponId];
      // Weapon backing pill
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.roundRect(-22, -12, 44, 24, 6);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Gun silhouette
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-12, -3, 24, 6);
      ctx.fillRect(-8, 3, 5, 6); // grip

      // Label
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(wep.name.split(" ")[0], 0, 20);
    } else if (item.type === "ammo" && item.ammoType) {
      const info = AMMO_COLORS[item.ammoType];
      ctx.fillStyle = info.bg;
      ctx.beginPath();
      ctx.roundRect(-10, -10, 20, 20, 4);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = info.text;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.ammoType.slice(0, 3), 0, 0);
    } else if (item.type === "bandage") {
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-8, -5, 16, 10);
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -5, 16, 10);
    } else if (item.type === "medkit") {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(-11, -9, 22, 18, 3);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-2, -6, 4, 12);
      ctx.fillRect(-6, -2, 12, 4);
    } else if (item.type === "soda") {
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.roundRect(-6, -10, 12, 20, 3);
      ctx.fill();
    } else if (item.type === "vest" || item.type === "helmet") {
      const tierColor = item.tier === 3 ? "#000000" : item.tier === 2 ? "#1e40af" : "#15803d";
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Lv${item.tier}`, 0, 0);
    } else if (item.type === "scope") {
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${item.tier}x`, 0, 0);
    }

    ctx.restore();
  }
  ctx.restore();
}

function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) {
  ctx.save();
  for (const obs of obstacles) {
    if (!obs.active) continue;

    if (obs.type === "wall") {
      const hw = (obs.width || 40) / 2;
      const hh = (obs.height || 40) / 2;
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x - hw, obs.y - hh, obs.width || 40, obs.height || 40);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x - hw, obs.y - hh, obs.width || 40, obs.height || 40);
    } else if (obs.type === "crate") {
      const hw = (obs.width || 38) / 2;
      const hh = (obs.height || 38) / 2;
      // Wooden crate box
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(obs.x - hw, obs.y - hh, obs.width || 38, obs.height || 38);
      ctx.strokeStyle = "#431407";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(obs.x - hw, obs.y - hh, obs.width || 38, obs.height || 38);

      // Crate Cross Braces
      ctx.beginPath();
      ctx.moveTo(obs.x - hw, obs.y - hh);
      ctx.lineTo(obs.x + hw, obs.y + hh);
      ctx.moveTo(obs.x + hw, obs.y - hh);
      ctx.lineTo(obs.x - hw, obs.y + hh);
      ctx.stroke();
    } else if (obs.type === "metal_crate") {
      const hw = (obs.width || 44) / 2;
      const hh = (obs.height || 44) / 2;
      // Military High-Tier Crate
      ctx.fillStyle = "#334155";
      ctx.fillRect(obs.x - hw, obs.y - hh, obs.width || 44, obs.height || 44);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.strokeRect(obs.x - hw, obs.y - hh, obs.width || 44, obs.height || 44);

      // Star / Military insignia
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", obs.x, obs.y);
    } else if (obs.type === "rock") {
      // Gray Boulder
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Rock facets
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.arc(obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, obs.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCanopiesAndBushes(ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) {
  ctx.save();
  for (const obs of obstacles) {
    if (!obs.active) continue;

    if (obs.type === "tree") {
      // Trunk center circle
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Lush Green Canopy Outer Leaves
      ctx.fillStyle = "rgba(22, 101, 52, 0.92)";
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#14532d";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner Canopy Layer
      ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
      ctx.beginPath();
      ctx.arc(obs.x - 3, obs.y - 3, obs.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.type === "bush") {
      // Soft Leafy Bush
      ctx.fillStyle = "rgba(21, 128, 61, 0.72)";
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 83, 45, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCharacter(ctx: CanvasRenderingContext2D, p: PlayerEntity, engine: SurvivEngine, isLocalPlayer: boolean) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // If in bush, make transparent
  if (p.inBush) {
    ctx.globalAlpha = isLocalPlayer ? 0.45 : 0.08;
  }

  // Surviv signature body rotation
  ctx.rotate(p.angle);

  const curWep = engine.getActiveWeapon(p);

  // 1. Draw Hands & Weapon
  ctx.fillStyle = isLocalPlayer ? "#f59e0b" : "#e2e8f0"; // Skin tone
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  if (curWep.category === "melee") {
    // Two fists forward
    ctx.beginPath();
    ctx.arc(14, -12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(14, 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Firearm Barrel
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(8, -3.5, curWep.barrelLength - 8, 7);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, -3.5, curWep.barrelLength - 8, 7);

    // Left hand holding foregrip
    ctx.fillStyle = isLocalPlayer ? "#f59e0b" : "#e2e8f0";
    ctx.beginPath();
    ctx.arc(curWep.barrelLength * 0.55, -8, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right hand on trigger
    ctx.beginPath();
    ctx.arc(14, 8, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 2. Main Circle Body
  ctx.fillStyle = isLocalPlayer ? "#38bdf8" : "#f87171"; // Blue for player, Red for enemies
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 3. Armor Vest Visual Overlay
  if (p.vestTier > 0) {
    const vestColors = ["", "#15803d", "#1e40af", "#000000"];
    ctx.strokeStyle = vestColors[p.vestTier] || "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS - 3, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
  }

  // 4. Helmet Visual Overlay
  if (p.helmetTier > 0) {
    const helmetColors = ["", "#16a34a", "#2563eb", "#000000"];
    ctx.fillStyle = helmetColors[p.helmetTier] || "#000000";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 5. Backpack indicator on back
  if (p.backpackTier > 1) {
    ctx.fillStyle = p.backpackTier === 3 ? "#0f172a" : "#475569";
    ctx.fillRect(-PLAYER_RADIUS - 4, -8, 6, 16);
  }

  ctx.restore();

  // Overhead Health Bar & Name (Screen aligned, not rotated)
  if (!p.inBush || isLocalPlayer) {
    ctx.save();
    ctx.translate(p.x, p.y - PLAYER_RADIUS - 16);

    // Name
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(isLocalPlayer ? "YOU" : p.name, 0, -4);
    ctx.shadowBlur = 0;

    // Health Bar
    const barW = 38;
    const barH = 5;
    const hpRatio = Math.max(0, p.health / p.maxHealth);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(-barW / 2, 0, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#eab308" : "#ef4444";
    ctx.fillRect(-barW / 2, 0, barW * hpRatio, barH);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, 0, barW, barH);

    ctx.restore();
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: BulletEntity[]) {
  ctx.save();
  for (const b of bullets) {
    if (!b.active) continue;

    // Bullet glowing trace
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bullet tail
    ctx.lineWidth = b.radius * 1.5;
    ctx.strokeStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - (b.vx * 0.02), b.y - (b.vy * 0.02));
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleEntity[]) {
  ctx.save();
  for (const p of particles) {
    if (!p.active) continue;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawScreenHUD(
  ctx: CanvasRenderingContext2D,
  engine: SurvivEngine,
  width: number,
  height: number,
  ts: {
    moveOrigin: { x: number; y: number };
    moveCurrent: { x: number; y: number };
    aimOrigin: { x: number; y: number };
    aimCurrent: { x: number; y: number };
  }
) {
  const p = engine.player;
  const distToZone = Math.hypot(p.x - engine.zone.currentCenterX, p.y - engine.zone.currentCenterY);

  // Toxic Red Gas Screen Vignette if outside safe circle
  if (distToZone > engine.zone.currentRadius) {
    ctx.save();
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.3,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.6
    );
    gradient.addColorStop(0, "rgba(239, 68, 68, 0)");
    gradient.addColorStop(1, "rgba(220, 38, 38, 0.45)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Mobile Virtual Touch Joysticks
  if (engine.moveStick.active) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ts.moveOrigin.x, ts.moveOrigin.y, 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
    ctx.beginPath();
    ctx.arc(ts.moveCurrent.x, ts.moveCurrent.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (engine.aimStick.active) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ts.aimOrigin.x, ts.aimOrigin.y, 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
    ctx.beginPath();
    ctx.arc(ts.aimCurrent.x, ts.aimCurrent.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
