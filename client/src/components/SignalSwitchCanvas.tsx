// Signal Switch: React owns the canvas mount; Babylon owns the procedural board and relay loop.
import { Engine } from "@babylonjs/core/Engines/engine";
import "@/game/registerStandardShaders";
import { createSignalSwitchScene, type SignalSwitchHandle } from "@/game/signalSwitch/scene";
import type { SignalSwitchCallbacks } from "@/game/signalSwitch/SignalSwitchWorld";
import { useEffect, useRef } from "react";

export default function SignalSwitchCanvas({ callbacks }: { callbacks: SignalSwitchCallbacks }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);
  const callbackRef = useRef(callbacks);
  callbackRef.current = callbacks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || started.current) return;
    started.current = true;
    let isDisposed = false;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let handle: SignalSwitchHandle | null = null;
    let lastRender = 0;
    const draw = () => {
      if (isDisposed || !handle || handle.scene.isDisposed || document.hidden) return;
      const now = performance.now();
      if (now - lastRender < 1000 / 30) return;
      lastRender = now;
      handle.scene.render();
    };
    const onVisibility = () => {
      if (isDisposed) return;
      if (document.hidden) engine.stopRenderLoop(draw);
      else {
        lastRender = 0;
        engine.resize();
        if (handle) engine.runRenderLoop(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    createSignalSwitchScene(engine, canvas, {
      onScore: (score, best) => callbackRef.current.onScore(score, best),
      onStatus: (status) => callbackRef.current.onStatus(status),
      onTimer: (seconds) => callbackRef.current.onTimer(seconds),
      onSound: (event) => callbackRef.current.onSound(event),
    }).then((game) => {
      if (isDisposed) {
        game.dispose();
        return;
      }
      handle = game;
      if (!document.hidden) engine.runRenderLoop(draw);
    });

    const resize = () => {
      if (!isDisposed) engine.resize();
    };
    window.addEventListener("resize", resize);

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      engine.stopRenderLoop(draw);
      handle?.dispose();
      engine.dispose();
      started.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} aria-label="Signal Switch game canvas" />;
}
