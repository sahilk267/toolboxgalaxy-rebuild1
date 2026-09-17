// Orbit Dash / Orbital Workbench: Babylon scene owner with generated background art and a clean local game handle.
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import type { SoundEvent } from "@/game/audio";
import { GameWorld } from "@/game/GameWorld";

export type GameHandle = { scene: Scene; dispose: () => void };
export type GameCallbacks = { onScore: (score: number, best: number) => void; onStatus: (status: "ready" | "playing" | "over") => void; onSound: (event: SoundEvent) => void };

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement, callbacks: GameCallbacks): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.02, 0.04, 0.09, 1);
  const camera = new ArcRotateCamera("orbit-dash-camera", Math.PI / 2, Math.PI / 2, 18, new Vector3(0, 0, 0), scene);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camera.orthoTop = 5.5; camera.orthoBottom = -5.5; camera.orthoLeft = -8.8; camera.orthoRight = 8.8;
  const light = new HemisphericLight("orbit-dash-light", new Vector3(0, 1, -1), scene);
  light.intensity = 0.92; light.diffuse = new Color3(0.76, 0.86, 1); light.groundColor = new Color3(0.03, 0.05, 0.12);
  const world = new GameWorld(scene, canvas, callbacks);
  const observer = scene.onBeforeRenderObservable.add(() => world.update(Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05)));
  return { scene, dispose: () => { scene.onBeforeRenderObservable.remove(observer); world.dispose(); scene.dispose(); } };
}
