// Signal Switch: top-down procedural relay board scene with a lifecycle-safe handle.
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { SignalSwitchWorld, type SignalSwitchCallbacks } from "@/game/signalSwitch/SignalSwitchWorld";

export type SignalSwitchHandle = { scene: Scene; dispose: () => void };
export async function createSignalSwitchScene(engine: Engine, canvas: HTMLCanvasElement, callbacks: SignalSwitchCallbacks): Promise<SignalSwitchHandle> { const scene = new Scene(engine); scene.clearColor = new Color4(.015, .028, .06, 1); const camera = new ArcRotateCamera("relay-camera", Math.PI / 2, Math.PI / 2, 16, Vector3.Zero(), scene); camera.mode = Camera.ORTHOGRAPHIC_CAMERA; camera.orthoTop = 5.8; camera.orthoBottom = -5.8; camera.orthoLeft = -8.3; camera.orthoRight = 8.3; const light = new HemisphericLight("relay-light", new Vector3(0, 0, -1), scene); light.intensity = .96; light.diffuse = new Color3(.78, .88, 1); light.groundColor = new Color3(.025, .05, .1); const world = new SignalSwitchWorld(scene, canvas, callbacks); const observer = scene.onBeforeRenderObservable.add(() => world.update(Math.min(scene.getEngine().getDeltaTime() / 1000, .05))); return { scene, dispose: () => { scene.onBeforeRenderObservable.remove(observer); world.dispose(); scene.dispose(); } }; }
