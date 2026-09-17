// Signal Switch: framework-independent four-relay reaction game for the Games Bay.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { SoundEvent } from "@/game/audio";

export type RelayDirection = "up" | "right" | "down" | "left";
export type SignalSwitchCallbacks = { onScore: (score: number, best: number) => void; onStatus: (status: "ready" | "playing" | "over") => void; onTimer: (seconds: number) => void; onSound: (event: SoundEvent) => void };
type RelayPad = { direction: RelayDirection; root: TransformNode; material: StandardMaterial; position: Vector3 };

const directions: RelayDirection[] = ["up", "right", "down", "left"];
const positions: Record<RelayDirection, Vector3> = { up: new Vector3(0, 3.05, .28), right: new Vector3(4.25, 0, .28), down: new Vector3(0, -3.05, .28), left: new Vector3(-4.25, 0, .28) };

export class SignalSwitchWorld {
  private readonly pads: RelayPad[] = [];
  private readonly demo: boolean;
  private readonly packet = MeshBuilder.CreatePolyhedron("signal-packet", { type: 1, size: .38 }, this.scene);
  private score = 0;
  private best = (() => {
    try {
      return Number(window.localStorage.getItem("toolbox-galaxy-signal-switch-best") || 0);
    } catch {
      return 0;
    }
  })();
  private status: "ready" | "playing" | "over" = "ready"; private active: RelayDirection = "up"; private timer = 2.4; private demoClock = 0; private turn = 0;
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onPointer: (event: PointerEvent) => void;

  constructor(private readonly scene: Scene, private readonly canvas: HTMLCanvasElement, private readonly callbacks: SignalSwitchCallbacks) {
    this.demo = new URLSearchParams(window.location.search).has("demo");
    this.createBoard(); this.createPads(); this.configurePacket(); this.setActive("up");
    this.onKeyDown = (event) => { const key = event.key.toLowerCase(); const keys: Record<string, RelayDirection> = { arrowup: "up", w: "up", arrowright: "right", d: "right", arrowdown: "down", s: "down", arrowleft: "left", a: "left" }; if (keys[key]) { event.preventDefault(); this.select(keys[key]); } if (event.key === " " || key === "r") { event.preventDefault(); if (this.status !== "playing") this.reset(); } };
    this.onPointer = (event) => { const rect = this.canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width; const y = (event.clientY - rect.top) / rect.height; const direction: RelayDirection = y < .31 ? "up" : y > .69 ? "down" : x < .36 ? "left" : "right"; this.select(direction); };
    window.addEventListener("keydown", this.onKeyDown, { passive: false }); this.canvas.addEventListener("pointerdown", this.onPointer);
    this.callbacks.onScore(this.score, this.best); this.callbacks.onTimer(this.timer); this.callbacks.onStatus(this.status); if (this.demo) this.start();
  }

  private createBoard() {
    const boardMaterial = new StandardMaterial("relay-board", this.scene); boardMaterial.diffuseColor = new Color3(.045, .09, .16); boardMaterial.emissiveColor = new Color3(.006, .018, .04); boardMaterial.specularColor = Color3.Black();
    const board = MeshBuilder.CreateBox("relay-board", { width: 13.2, height: 9.5, depth: .15 }, this.scene); board.material = boardMaterial; board.position.z = 0;
    const gridMaterial = new StandardMaterial("grid-rails", this.scene); gridMaterial.emissiveColor = new Color3(.10, .22, .31); gridMaterial.diffuseColor = Color3.Black(); gridMaterial.alpha = .7;
    for (let index = -5; index <= 5; index += 1) { const vertical = MeshBuilder.CreateBox(`grid-v-${index}`, { width: .025, height: 8.8, depth: .05 }, this.scene); vertical.position = new Vector3(index * 1.05, 0, .12); vertical.material = gridMaterial; const horizontal = MeshBuilder.CreateBox(`grid-h-${index}`, { width: 12.5, height: .025, depth: .05 }, this.scene); horizontal.position = new Vector3(0, index * .78, .12); horizontal.material = gridMaterial; }
    const hubMaterial = new StandardMaterial("central-hub", this.scene); hubMaterial.diffuseColor = new Color3(.18, .24, .32); hubMaterial.emissiveColor = new Color3(.025, .05, .07); const hub = MeshBuilder.CreateCylinder("central-hub", { diameter: 2.0, height: .25, tessellation: 32 }, this.scene); hub.material = hubMaterial; hub.position.z = .28;
  }

  private createPads() {
    directions.forEach((direction) => { const material = new StandardMaterial(`pad-${direction}`, this.scene); material.diffuseColor = new Color3(.09, .16, .24); material.emissiveColor = new Color3(.008, .02, .035); material.specularColor = Color3.Black(); const root = new TransformNode(`relay-${direction}`, this.scene); root.position = positions[direction].clone(); const base = MeshBuilder.CreateBox(`relay-base-${direction}`, { width: 2.25, height: 1.72, depth: .18 }, this.scene); base.parent = root; base.material = material; const marker = MeshBuilder.CreatePolyhedron(`relay-marker-${direction}`, { type: 1, size: .24 }, this.scene); marker.parent = root; marker.position.z = .26; marker.material = material; this.pads.push({ direction, root, material, position: positions[direction] }); });
  }

  private configurePacket() { const material = new StandardMaterial("packet-material", this.scene); material.diffuseColor = new Color3(1, .54, .22); material.emissiveColor = new Color3(.46, .12, .025); material.specularColor = Color3.Black(); this.packet.material = material; this.packet.position.z = .62; }
  private setActive(direction: RelayDirection) { this.active = direction; this.pads.forEach((pad) => { const chosen = pad.direction === direction; pad.material.diffuseColor = chosen ? new Color3(.66, .9, .20) : new Color3(.09, .16, .24); pad.material.emissiveColor = chosen ? new Color3(.17, .34, .04) : new Color3(.008, .02, .035); pad.root.scaling = chosen ? new Vector3(1.08, 1.08, 1.08) : Vector3.One(); }); this.packet.position = positions[direction].add(new Vector3(0, 0, .55)); }
  private start() { this.status = "playing"; this.callbacks.onStatus(this.status); this.callbacks.onSound("start"); this.nextRelay(); }
  private nextRelay() { this.active = this.demo ? directions[(this.turn * 3 + 1) % directions.length] : directions[Math.floor(Math.random() * directions.length)]; this.turn += 1; this.timer = Math.max(.82, 2.4 - this.score * .05); this.setActive(this.active); this.callbacks.onTimer(this.timer); }
  private select(direction: RelayDirection) {
    if (this.status === "ready") this.start();
    if (this.status !== "playing") return;
    if (direction === this.active) {
      this.score += 1;
      if (this.score > this.best) {
        this.best = this.score;
        try {
          window.localStorage.setItem("toolbox-galaxy-signal-switch-best", String(this.best));
        } catch {}
      }
      this.callbacks.onScore(this.score, this.best);
      this.callbacks.onSound("relayCorrect");
      this.nextRelay();
    } else this.endRun();
  }
  private endRun() { this.status = "over"; this.callbacks.onStatus(this.status); this.callbacks.onSound("relayFail"); }
  reset() { this.score = 0; this.turn = 0; this.demoClock = 0; this.callbacks.onScore(this.score, this.best); this.start(); }
  update(delta: number) { this.packet.rotation.z += delta * 2.7; if (this.status !== "playing") return; if (this.demo) { this.demoClock += delta; if (this.demoClock > .52) { this.demoClock = 0; this.select(this.active); } return; } this.timer -= delta; this.callbacks.onTimer(Math.max(0, this.timer)); if (this.timer <= 0) this.endRun(); }
  dispose() { window.removeEventListener("keydown", this.onKeyDown); this.canvas.removeEventListener("pointerdown", this.onPointer); this.packet.dispose(); this.pads.forEach((pad) => pad.root.dispose()); }
}
