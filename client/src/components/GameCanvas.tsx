// Orbit Dash / Orbital Workbench: React owns the canvas frame; Babylon owns the gameplay scene and render loop.
import { Engine } from "@babylonjs/core/Engines/engine";
import "@/game/registerStandardShaders";
import { createGameScene, type GameCallbacks, type GameHandle } from "@/game/scene";
import { useEffect, useRef } from "react";

export default function GameCanvas({ callbacks }: { callbacks: GameCallbacks }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    let isDisposed = false;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let handle: GameHandle | null = null;

    createGameScene(engine, canvas, {
      onScore: (score, best) => callbacksRef.current.onScore(score, best),
      onStatus: (status) => callbacksRef.current.onStatus(status),
      onSound: (event) => callbacksRef.current.onSound(event),
    }).then((game) => {
      if (isDisposed) {
        game.dispose();
        return;
      }
      handle = game;
      engine.runRenderLoop(() => {
        if (!isDisposed && game.scene && !game.scene.isDisposed) {
          game.scene.render();
        }
      });
    });

    const onResize = () => {
      if (!isDisposed) engine.resize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} aria-label="Orbit Dash game canvas" />;
}
