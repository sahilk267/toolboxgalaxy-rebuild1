// Orbit Dash / Orbital Workbench: framework-independent local arcade loop with procedural meshes and semantic input.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { SoundEvent } from "@/game/audio";
import { arcadePressure, isOpeningProtected, orbitGatePace, type ArcadeDifficulty } from "@/game/playability";

export type OrbitGameStatus = "ready" | "playing" | "paused" | "over";

type GameCallbacks = { onScore: (score: number, best: number) => void; onStatus: (status: OrbitGameStatus) => void; onSound: (event: SoundEvent) => void };
type Gate = { root: TransformNode; x: number; gapY: number; scored: boolean; fragmentCollected: boolean; fragment: ReturnType<typeof MeshBuilder.CreatePolyhedron> };

const LIME = new Color3(0.78, 0.95, 0.42);
const EMBER = new Color3(1, 0.61, 0.33);
const INK = new Color3(0.04, 0.07, 0.14);

export class GameWorld {
  private readonly player = MeshBuilder.CreatePolyhedron("signal-ship", { type: 1, size: 0.65 }, this.scene);
  private readonly gates: Gate[] = [];
  // Shared by every procedural gate: thousands of gates must not mean
  // thousands of Babylon materials retained until scene teardown.
  private readonly gateMaterial: StandardMaterial;
  private readonly gateEdgeMaterial: StandardMaterial;
  private readonly gateFragmentMaterial: StandardMaterial;
  private readonly pressed = new Set<string>();
  private readonly demo: boolean;
  private score = 0;
  private best = (() => {
    try {
      const stored = Number(window.localStorage.getItem("toolbox-galaxy-orbit-dash-best") || 0);
      return Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
    } catch {
      return 0;
    }
  })();
  private status: OrbitGameStatus = "ready";
  private spawnClock = 0;
  private elapsed = 0;
  private playerY = 0;
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;
  private readonly onWindowBlur: () => void;
  private readonly onVisibility: () => void;
  private readonly onPointer: (event: PointerEvent) => void;

  constructor(private readonly scene: Scene, private readonly canvas: HTMLCanvasElement, private readonly callbacks: GameCallbacks, private readonly difficulty: ArcadeDifficulty = "normal") {
    this.gateMaterial = new StandardMaterial("orbit-gate-shared", scene);
    this.gateMaterial.diffuseColor = new Color3(0.28, 0.41, 0.54);
    this.gateMaterial.emissiveColor = new Color3(0.04, 0.09, 0.15);
    this.gateMaterial.specularColor = Color3.Black();
    this.gateEdgeMaterial = new StandardMaterial("orbit-edge-shared", scene);
    this.gateEdgeMaterial.diffuseColor = LIME.scale(0.7);
    this.gateEdgeMaterial.emissiveColor = LIME.scale(0.22);
    this.gateFragmentMaterial = new StandardMaterial("orbit-fragment-shared", scene);
    this.gateFragmentMaterial.diffuseColor = EMBER;
    this.gateFragmentMaterial.emissiveColor = EMBER.scale(0.46);
    this.demo = new URLSearchParams(window.location.search).has("demo");
    this.configurePlayer();
    this.createStarfield();
    this.onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "w", "s", " ", "r", "p", "escape"].includes(key)) event.preventDefault();
      if (key === "p" || key === "escape") {
        if (this.status === "playing") this.pause();
        else if (this.status === "paused") this.resume();
        return;
      }
      if (key === " " || key === "r") {
        if (this.status === "paused") this.resume();
        else if (this.status !== "playing") this.reset();
        return;
      }
      if (!["arrowup","arrowdown","w","s"].includes(key)) return;
      if (this.status === "paused" || this.status === "over") return;
      this.pressed.add(key);
      if (this.status === "ready") this.start();
    };
    this.onKeyUp = (event) => this.pressed.delete(event.key.toLowerCase());
    this.onWindowBlur = () => {
      this.pressed.clear();
      if (!this.demo && this.status === "playing") this.pause();
    };
    this.onVisibility = () => {
      if (document.hidden && !this.demo && this.status === "playing") this.pause();
    };
    this.onPointer = (event) => {
      if (this.status === "paused" || this.status === "over") return;
      // Hovering over the canvas must not start a game unexpectedly.
      if (this.status === "ready" && event.type === "pointerdown") this.start();
      const rect = this.canvas.getBoundingClientRect();
      if (rect.height < 1) return;
      const normalized = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      this.playerY = Math.max(-4.2, Math.min(4.2, normalized * 4.2));
    };
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onWindowBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.canvas.addEventListener("pointermove", this.onPointer);
    this.canvas.addEventListener("pointerdown", this.onPointer);
    this.callbacks.onScore(this.score, this.best);
    this.callbacks.onStatus(this.status);
    if (this.demo) this.start();
  }

  private configurePlayer() {
    const material = new StandardMaterial("ship-material", this.scene);
    material.diffuseColor = LIME;
    material.emissiveColor = LIME.scale(0.32);
    material.specularColor = Color3.Black();
    this.player.material = material;
    this.player.rotation.z = -Math.PI / 2;
    this.player.position = new Vector3(-4.6, 0, 0.35);
  }

  private createStarfield() {
    const starMaterial = new StandardMaterial("star-material", this.scene);
    starMaterial.emissiveColor = new Color3(0.35, 0.43, 0.62);
    starMaterial.diffuseColor = INK;
    starMaterial.alpha = 0.55;
    for (let index = 0; index < 72; index += 1) {
      const star = MeshBuilder.CreateSphere(`star-${index}`, { diameter: 0.025 + (index % 4) * 0.012 }, this.scene);
      star.position.x = -8 + ((index * 37) % 160) / 10;
      star.position.y = -5 + ((index * 53) % 100) / 10;
      star.position.z = 1.4;
      star.material = starMaterial;
    }
  }

  start() {
    if (this.status === "playing") return;
    if (this.status === "paused") { this.resume(); return; }
    if (this.status === "over") { this.reset(); return; }
    this.status = "playing";
    this.spawnClock = 1.2;
    this.callbacks.onStatus(this.status);
    this.callbacks.onSound("start");
  }

  pause() {
    if (this.status !== "playing") return;
    this.status = "paused";
    this.pressed.clear();
    this.callbacks.onStatus(this.status);
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "playing";
    this.pressed.clear();
    this.callbacks.onStatus(this.status);
  }

  reset() {
    this.gates.splice(0).forEach((gate) => gate.root.dispose());
    this.pressed.clear();
    this.score = 0; this.spawnClock = 1.2; this.elapsed = 0; this.playerY = 0; this.player.position.y = 0; this.status = "playing";
    this.callbacks.onScore(this.score, this.best); this.callbacks.onStatus(this.status); this.callbacks.onSound("start");
  }

  update(delta: number) {
    if (this.status !== "playing") return;
    this.elapsed += delta;
    const vertical = (this.pressed.has("arrowup") || this.pressed.has("w") ? 1 : 0) - (this.pressed.has("arrowdown") || this.pressed.has("s") ? 1 : 0);
    if (this.demo) this.playerY = Math.sin(this.elapsed * 1.7) * 2.35;
    else this.playerY = Math.max(-4.2, Math.min(4.2, this.playerY + vertical * delta * 5.2));
    this.player.position.y += (this.playerY - this.player.position.y) * Math.min(1, delta * 9);
    this.player.rotation.y = Math.sin(this.elapsed * 5) * 0.16;
    this.spawnClock -= delta;
    const pace=orbitGatePace(this.elapsed,this.difficulty);
    const gateSpeed=pace.speed;
    if (this.spawnClock <= 0) { this.spawnGate(); this.spawnClock = pace.spawnInterval; }
    for (let index = this.gates.length - 1; index >= 0; index -= 1) {
      const gate = this.gates[index]; gate.x -= delta * gateSpeed; gate.root.position.x = gate.x;
      const yDistance = Math.abs(this.player.position.y - gate.gapY);
      const nearGate = Math.abs(gate.x - this.player.position.x) < 0.32;
      if (nearGate && yDistance > 1.42 && !isOpeningProtected(this.elapsed,this.difficulty)) { this.endRun(); break; }
      if (!gate.fragmentCollected && Math.abs(gate.x - this.player.position.x) < 0.38 && yDistance < 0.44) { gate.fragmentCollected = true; gate.fragment.setEnabled(false); this.addScore(2); this.callbacks.onSound("fragment"); }
      if (!gate.scored && gate.x < this.player.position.x - 0.4) { gate.scored = true; this.addScore(1); this.callbacks.onSound("gate"); }
      if (gate.x < -8.4) { gate.root.dispose(); this.gates.splice(index, 1); }
    }
  }

  private spawnGate() {
    const ramp=arcadePressure(this.elapsed,this.difficulty);
    const gapRange=orbitGatePace(this.elapsed,this.difficulty).gapRange;
    const gapY = this.demo ? Math.sin((this.elapsed + 0.6) * 1.22) * 2.1 :
      Math.max(-gapRange, Math.min(gapRange, Math.sin(this.elapsed * (0.55+1.0*ramp.rampFraction)) * gapRange));
    const root = new TransformNode(`gate-${this.elapsed.toFixed(2)}`, this.scene);
    const topHeight = 5.3 - (gapY + 1.25); const bottomHeight = gapY - 1.25 + 5.3;
    [
      { y: gapY + 1.25 + topHeight / 2, height: topHeight },
      { y: -5.3 + bottomHeight / 2, height: bottomHeight },
    ].forEach((part, index) => {
      const block = MeshBuilder.CreateBox(`gate-block-${index}-${this.elapsed}`, { width: 0.58, height: Math.max(.1, part.height), depth: 0.28 }, this.scene);
      block.parent = root; block.position.y = part.y; block.material = this.gateMaterial;
      const rail = MeshBuilder.CreateBox(`gate-rail-${index}-${this.elapsed}`, { width: 0.76, height: 0.08, depth: 0.32 }, this.scene);
      rail.parent = root; rail.position.y = index === 0 ? gapY + 1.25 : gapY - 1.25; rail.material = this.gateEdgeMaterial;
    });
    const fragment = MeshBuilder.CreatePolyhedron(`fragment-${this.elapsed}`, { type: 1, size: .28 }, this.scene);
    fragment.parent = root; fragment.position = new Vector3(0, gapY, 0.38);
    fragment.material = this.gateFragmentMaterial;
    root.position.x = 8.2;
    this.gates.push({ root, x: 8.2, gapY, scored: false, fragmentCollected: false, fragment });
  }

  private addScore(amount: number) {
    this.score += amount;
    if (this.score > this.best) {
      this.best = this.score;
      try {
        window.localStorage.setItem("toolbox-galaxy-orbit-dash-best", String(this.best));
      } catch {}
    }
    this.callbacks.onScore(this.score, this.best);
  }
  private endRun() { this.status = "over"; this.callbacks.onStatus(this.status); this.callbacks.onSound("collision"); }
  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onWindowBlur);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("pointermove", this.onPointer);
    this.canvas.removeEventListener("pointerdown", this.onPointer);
    this.gates.forEach((gate) => gate.root.dispose());
    this.gates.length = 0;
    this.player.dispose();
    this.gateMaterial.dispose();
    this.gateEdgeMaterial.dispose();
    this.gateFragmentMaterial.dispose();
  }
}
