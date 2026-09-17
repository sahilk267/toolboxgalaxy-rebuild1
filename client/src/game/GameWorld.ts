// Orbit Dash / Orbital Workbench: framework-independent local arcade loop with procedural meshes and semantic input.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { SoundEvent } from "@/game/audio";

type GameCallbacks = { onScore: (score: number, best: number) => void; onStatus: (status: "ready" | "playing" | "over") => void; onSound: (event: SoundEvent) => void };
type Gate = { root: TransformNode; x: number; gapY: number; scored: boolean; fragmentCollected: boolean; fragment: ReturnType<typeof MeshBuilder.CreatePolyhedron> };

const LIME = new Color3(0.78, 0.95, 0.42);
const EMBER = new Color3(1, 0.61, 0.33);
const INK = new Color3(0.04, 0.07, 0.14);

export class GameWorld {
  private readonly player = MeshBuilder.CreatePolyhedron("signal-ship", { type: 1, size: 0.65 }, this.scene);
  private readonly gates: Gate[] = [];
  private readonly pressed = new Set<string>();
  private readonly demo: boolean;
  private score = 0;
  private best = (() => {
    try {
      return Number(window.localStorage.getItem("toolbox-galaxy-orbit-dash-best") || 0);
    } catch {
      return 0;
    }
  })();
  private status: "ready" | "playing" | "over" = "ready";
  private spawnClock = 0;
  private elapsed = 0;
  private playerY = 0;
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;
  private readonly onPointer: (event: PointerEvent) => void;

  constructor(private readonly scene: Scene, private readonly canvas: HTMLCanvasElement, private readonly callbacks: GameCallbacks) {
    this.demo = new URLSearchParams(window.location.search).has("demo");
    this.configurePlayer();
    this.createStarfield();
    this.onKeyDown = (event) => {
      if (["ArrowUp", "ArrowDown", "w", "W", "s", "S", " ", "r", "R"].includes(event.key)) event.preventDefault();
      if (event.key === " " || event.key.toLowerCase() === "r") { if (this.status !== "playing") this.reset(); return; }
      this.pressed.add(event.key.toLowerCase());
      if (this.status === "ready") this.start();
    };
    this.onKeyUp = (event) => this.pressed.delete(event.key.toLowerCase());
    this.onPointer = (event) => {
      if (this.status === "ready") this.start();
      const rect = this.canvas.getBoundingClientRect();
      const normalized = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      this.playerY = Math.max(-4.2, Math.min(4.2, normalized * 4.2));
    };
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
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

  start() { this.status = "playing"; this.callbacks.onStatus(this.status); this.callbacks.onSound("start"); }

  reset() {
    this.gates.splice(0).forEach((gate) => gate.root.dispose());
    this.score = 0; this.spawnClock = 0; this.elapsed = 0; this.playerY = 0; this.player.position.y = 0; this.status = "playing";
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
    if (this.spawnClock <= 0) { this.spawnGate(); this.spawnClock = 2.05; }
    for (let index = this.gates.length - 1; index >= 0; index -= 1) {
      const gate = this.gates[index]; gate.x -= delta * 4.35; gate.root.position.x = gate.x;
      const yDistance = Math.abs(this.player.position.y - gate.gapY);
      const nearGate = Math.abs(gate.x - this.player.position.x) < 0.32;
      if (nearGate && yDistance > 1.42) { this.endRun(); break; }
      if (!gate.fragmentCollected && Math.abs(gate.x - this.player.position.x) < 0.38 && yDistance < 0.44) { gate.fragmentCollected = true; gate.fragment.setEnabled(false); this.addScore(2); this.callbacks.onSound("fragment"); }
      if (!gate.scored && gate.x < this.player.position.x - 0.4) { gate.scored = true; this.addScore(1); this.callbacks.onSound("gate"); }
      if (gate.x < -8.4) { gate.root.dispose(); this.gates.splice(index, 1); }
    }
  }

  private spawnGate() {
    const gapY = this.demo ? Math.sin((this.elapsed + 0.6) * 1.22) * 2.1 : Math.max(-2.7, Math.min(2.7, Math.sin(this.elapsed * 1.51) * 2.5));
    const root = new TransformNode(`gate-${this.elapsed.toFixed(2)}`, this.scene);
    const material = new StandardMaterial(`gate-mat-${this.elapsed}`, this.scene);
    material.diffuseColor = new Color3(0.28, 0.41, 0.54); material.emissiveColor = new Color3(0.04, 0.09, 0.15); material.specularColor = Color3.Black();
    const edgeMaterial = new StandardMaterial(`edge-mat-${this.elapsed}`, this.scene);
    edgeMaterial.diffuseColor = LIME.scale(0.7); edgeMaterial.emissiveColor = LIME.scale(0.22);
    const topHeight = 5.3 - (gapY + 1.25); const bottomHeight = gapY - 1.25 + 5.3;
    [
      { y: gapY + 1.25 + topHeight / 2, height: topHeight },
      { y: -5.3 + bottomHeight / 2, height: bottomHeight },
    ].forEach((part, index) => {
      const block = MeshBuilder.CreateBox(`gate-block-${index}-${this.elapsed}`, { width: 0.58, height: Math.max(.1, part.height), depth: 0.28 }, this.scene);
      block.parent = root; block.position.y = part.y; block.material = material;
      const rail = MeshBuilder.CreateBox(`gate-rail-${index}-${this.elapsed}`, { width: 0.76, height: 0.08, depth: 0.32 }, this.scene);
      rail.parent = root; rail.position.y = index === 0 ? gapY + 1.25 : gapY - 1.25; rail.material = edgeMaterial;
    });
    const fragment = MeshBuilder.CreatePolyhedron(`fragment-${this.elapsed}`, { type: 1, size: .28 }, this.scene);
    fragment.parent = root; fragment.position = new Vector3(0, gapY, 0.38);
    const fragmentMaterial = new StandardMaterial(`fragment-mat-${this.elapsed}`, this.scene); fragmentMaterial.diffuseColor = EMBER; fragmentMaterial.emissiveColor = EMBER.scale(.46); fragment.material = fragmentMaterial;
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
  dispose() { window.removeEventListener("keydown", this.onKeyDown); window.removeEventListener("keyup", this.onKeyUp); this.canvas.removeEventListener("pointermove", this.onPointer); this.canvas.removeEventListener("pointerdown", this.onPointer); this.gates.forEach((gate) => gate.root.dispose()); this.player.dispose(); }
}
