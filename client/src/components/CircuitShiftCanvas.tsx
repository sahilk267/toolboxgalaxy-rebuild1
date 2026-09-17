// Circuit Shift: lifecycle-safe React canvas adapter; the puzzle world owns all Babylon gameplay state.
import { Engine } from "@babylonjs/core/Engines/engine";
import "@/game/registerStandardShaders";
import { createCircuitShiftScene, type CircuitShiftHandle } from "@/game/circuitShift/scene";
import type { CircuitDifficulty, CircuitMode, CircuitShiftCallbacks } from "@/game/circuitShift/CircuitShiftWorld";
import { useEffect, useRef } from "react";

export default function CircuitShiftCanvas({ callbacks, difficulty, mode }: { callbacks: CircuitShiftCallbacks; difficulty: CircuitDifficulty; mode: CircuitMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbackRef = useRef(callbacks);
  callbackRef.current = callbacks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let isDisposed = false;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let handle: CircuitShiftHandle | null = null;

    createCircuitShiftScene(
      engine,
      canvas,
      {
        onScore: (score, best) => callbackRef.current.onScore(score, best),
        onStatus: (status) => callbackRef.current.onStatus(status),
        onMoves: (moves) => callbackRef.current.onMoves(moves),
        onSound: (event) => callbackRef.current.onSound(event),
        onDailyStreak: (streak) => callbackRef.current.onDailyStreak?.(streak),
      },
      difficulty,
      mode
    ).then((game) => {
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

    const resize = () => {
      if (!isDisposed) engine.resize();
    };
    window.addEventListener("resize", resize);

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", resize);
      handle?.dispose();
      engine.dispose();
    };
  }, [difficulty, mode]);

  return <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} aria-label="Circuit Shift game canvas" />;
}
