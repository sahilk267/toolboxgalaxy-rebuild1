// Orbit Dash / Orbital Workbench: React owns the canvas; Babylon owns the game scene.
import { Engine } from "@babylonjs/core/Engines/engine";
import "@/game/registerStandardShaders";
import { createGameScene, type GameCallbacks, type GameHandle } from "@/game/scene";
import { useEffect, useRef, useState } from "react";
import type { ArcadeDifficulty } from "@/game/playability";

export default function GameCanvas({ callbacks, difficulty = "normal" }: { callbacks: GameCallbacks; difficulty?: ArcadeDifficulty }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacksRef = useRef(callbacks);
  const [error, setError] = useState("");
  callbacksRef.current = callbacks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let handle: GameHandle | null = null;
    let engine: Engine;
    try {
      engine = new Engine(canvas, true, {
        preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: true,
      });
    } catch {
      setError("Orbit Dash requires an available WebGL browser and graphics context.");
      return;
    }
    const render = () => {
      if (!disposed && handle && !handle.scene.isDisposed) handle.scene.render();
    };
    const onResize = () => { if (!disposed) engine.resize(); };
    const onVisibility = () => {
      if (disposed) return;
      if (document.hidden) engine.stopRenderLoop(render);
      else if (handle) {
        engine.resize();
        engine.runRenderLoop(render);
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    void createGameScene(engine, canvas, {
      onScore: (score,best)=>callbacksRef.current.onScore(score,best),
      onStatus: status=>callbacksRef.current.onStatus(status),
      onSound: event=>callbacksRef.current.onSound(event),
    }, difficulty).then(game=>{
      if (disposed) { game.dispose(); return; }
      handle = game;
      if (!document.hidden) engine.runRenderLoop(render);
    }).catch(()=>{
      if (!disposed) setError("Orbit Dash could not initialize the 3D scene. Check WebGL support and refresh.");
    });

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      engine.stopRenderLoop(render);
      handle?.dispose();
      engine.dispose();
    };
  }, [difficulty]);

  return <>
    <canvas ref={canvasRef} className="game-canvas" style={{touchAction:"none"}}
      aria-label="Orbit Dash game canvas" tabIndex={0} />
    {error && <div className="absolute inset-x-4 bottom-20 z-50 rounded-lg border border-red-500/50 bg-slate-950 p-4 text-sm text-red-200" role="alert">
      {error}
    </div>}
  </>;
}
