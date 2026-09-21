// Diep Arena - React Canvas Component with Mouse, Keyboard, and Dual Touch Virtual Joysticks
import { useEffect, useRef } from "react";
import { DiepEngine, type EngineCallbacks } from "@/game/diep/engine";
import { DiepAudio } from "@/game/diep/audio";

interface DiepCanvasProps {
  callbacks: EngineCallbacks;
  engineRef: React.MutableRefObject<DiepEngine | null>;
  audio: DiepAudio;
}

export default function DiepCanvas({ callbacks, engineRef, audio }: DiepCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Virtual touch controls tracking
  const leftTouchId = useRef<number | null>(null);
  const leftTouchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rightTouchId = useRef<number | null>(null);
  const rightTouchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Responsive Canvas Resize Observer (Retina / DPR Aware)
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    // Initialize Engine
    const engine = new DiepEngine(canvas, audio, callbacks);
    engineRef.current = engine;
    engine.start();

    // KEYBOARD INPUTS
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }

      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engine.keys.w = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engine.keys.s = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engine.keys.a = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engine.keys.d = true;
      if (e.code === "Space") engine.keys.space = true;

      // Auto-Fire Toggle (E)
      if (e.key === "e" || e.key === "E") {
        engine.autoFire = !engine.autoFire;
      }
      // Auto-Spin Toggle (C)
      if (e.key === "c" || e.key === "C") {
        engine.autoSpin = !engine.autoSpin;
      }

      // Quick Stat Upgrades (Keys 1-8)
      const statOrder = [
        "healthRegen", "maxHealth", "bodyDamage", "bulletSpeed",
        "bulletPenetration", "bulletDamage", "reload", "movementSpeed"
      ] as const;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 8) {
        const statKey = statOrder[num - 1];
        engine.upgradeStat(statKey);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engine.keys.w = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engine.keys.s = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engine.keys.a = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engine.keys.d = false;
      if (e.code === "Space") engine.keys.space = false;
    };

    // MOUSE INPUTS
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      engine.mouseX = e.clientX - rect.left;
      engine.mouseY = e.clientY - rect.top;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        engine.isMouseDown = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        engine.isMouseDown = false;
      }
    };

    // TOUCH INPUTS (Mobile Dual Sticks)
    const onTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;

        if (tx < rect.width / 2 && leftTouchId.current === null) {
          // Left touch = Movement joystick
          leftTouchId.current = touch.identifier;
          leftTouchStart.current = { x: tx, y: ty };
        } else if (tx >= rect.width / 2 && rightTouchId.current === null) {
          // Right touch = Aim & Shoot joystick
          rightTouchId.current = touch.identifier;
          rightTouchStart.current = { x: tx, y: ty };
          engine.isAimingTouch = true;
          engine.mouseX = tx;
          engine.mouseY = ty;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;

        if (touch.identifier === leftTouchId.current) {
          const dx = tx - leftTouchStart.current.x;
          const dy = ty - leftTouchStart.current.y;
          const dist = Math.hypot(dx, dy);
          const maxRadius = 50;
          engine.moveStickX = Math.max(-1, Math.min(1, dx / maxRadius));
          engine.moveStickY = Math.max(-1, Math.min(1, dy / maxRadius));
        } else if (touch.identifier === rightTouchId.current) {
          const dx = tx - rightTouchStart.current.x;
          const dy = ty - rightTouchStart.current.y;
          engine.aimStickX = dx;
          engine.aimStickY = dy;
          engine.mouseX = tx;
          engine.mouseY = ty;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === leftTouchId.current) {
          leftTouchId.current = null;
          engine.moveStickX = 0;
          engine.moveStickY = 0;
        } else if (touch.identifier === rightTouchId.current) {
          rightTouchId.current = null;
          engine.aimStickX = 0;
          engine.aimStickY = 0;
          engine.isAimingTouch = false;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);

      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);

      engine.dispose();
      engineRef.current = null;
    };
  }, [audio, callbacks, engineRef]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden bg-[#cdcdcd]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
        aria-label="Diep Arena Canvas"
      />
    </div>
  );
}
