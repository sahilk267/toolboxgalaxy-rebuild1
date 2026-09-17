// Circuit Shift: framework-independent 4×4 tile-rotation puzzle; React receives only HUD and sound events.
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";
import type { SoundEvent } from "@/game/audio";
import { getDailyChallenge, type DailyChallenge } from "@/game/circuitShift/dailyChallenge";
import { completeDailyStreak, getDailyStreak, type DailyStreak } from "@/game/circuitShift/dailyStreak";

export type CircuitStatus = "ready" | "playing" | "solved";
export type CircuitDifficulty = "calm" | "standard" | "dense";
export type CircuitMode = "practice" | "daily";
export type CircuitShiftCallbacks = { onScore: (score: number, best: number) => void; onStatus: (status: CircuitStatus) => void; onMoves: (moves: number) => void; onSound: (event: SoundEvent) => void; onDailyStreak?: (streak: DailyStreak) => void };
type TileKind = "straight" | "corner";
type Tile = { kind: TileKind; orientation: number; solution: number; base: Mesh; traces: Mesh[] };
const directionDelta = [[-1, 0], [0, 1], [1, 0], [0, -1]] as const;
const indexOf = (row: number, column: number) => row * 4 + column;
const solvedKinds: TileKind[] = ["straight", "straight", "straight", "straight", "straight", "straight", "straight", "straight", "straight", "corner", "straight", "corner", "straight", "straight", "straight", "straight"];
const solvedOrientations = [0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 3, 1, 0, 1, 0];
const difficultyProfiles: Record<CircuitDifficulty, { scrambleOffsets: number[]; scoreMultiplier: number }> = {
  calm: { scrambleOffsets: [1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0], scoreMultiplier: 1 },
  standard: { scrambleOffsets: [1, 2, 3, 2, 3, 1, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1], scoreMultiplier: 1.35 },
  dense: { scrambleOffsets: [3, 2, 3, 3, 3, 2, 3, 2, 2, 3, 2, 3, 3, 2, 3, 2], scoreMultiplier: 1.75 },
};

function connections(kind: TileKind, orientation: number) { const turn = ((orientation % 4) + 4) % 4; return kind === "straight" ? (turn % 2 === 0 ? [1, 3] : [0, 2]) : [turn, (turn + 1) % 4]; }

export class CircuitShiftWorld {
  private tiles: Tile[] = []; private selected = 0; private status: CircuitStatus = "ready"; private moves = 0; private score = 0; private best = 0; private elapsed = 0; private demoQueue: number[] = []; private demoCooldown = .6; private pointerHandler: (event: PointerEvent) => void; private keyHandler: (event: KeyboardEvent) => void; private dailyChallenge: DailyChallenge | null = null; private storageKey = "toolbox-circuit-shift-best"; private readonly demo: boolean;
  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private callbacks: CircuitShiftCallbacks, private difficulty: CircuitDifficulty = "standard", private mode: CircuitMode = "practice") {
    this.demo = new URLSearchParams(window.location.search).has("demo");
    if (mode === "daily") {
      this.dailyChallenge = getDailyChallenge();
      this.storageKey = `toolbox-circuit-shift-daily-${this.dailyChallenge.id}`;
    }
    try {
      this.best = Number(localStorage.getItem(this.storageKey) || 0);
    } catch {
      this.best = 0;
    }
    this.createBoard();
    this.reset();
    this.pointerHandler = (event) => this.onPointer(event);
    this.keyHandler = (event) => this.onKey(event);
    canvas.addEventListener("pointerdown", this.pointerHandler);
    window.addEventListener("keydown", this.keyHandler);
    if (this.demo) this.start();
    this.callbacks.onScore(this.score, this.best);
    if (this.mode === "daily") this.callbacks.onDailyStreak?.(getDailyStreak());
  }
  private createBoard() { const boardMaterial = new StandardMaterial("circuit-board-material", this.scene); boardMaterial.diffuseColor = new Color3(.035, .08, .16); boardMaterial.emissiveColor = new Color3(.008, .024, .055); boardMaterial.specularColor = Color3.Black(); const board = MeshBuilder.CreateBox("circuit-board", { width: 8.6, height: 8.6, depth: .16 }, this.scene); board.position.z = -.14; board.material = boardMaterial; for (let row = 0; row < 4; row += 1) for (let column = 0; column < 4; column += 1) { const index = indexOf(row, column); const base = MeshBuilder.CreateBox(`tile-${index}`, { width: 1.74, height: 1.74, depth: .16 }, this.scene); base.position.x = (column - 1.5) * 1.92; base.position.y = (1.5 - row) * 1.92; base.position.z = .02; const material = new StandardMaterial(`tile-mat-${index}`, this.scene); material.diffuseColor = new Color3(.07, .14, .23); material.emissiveColor = new Color3(.014, .04, .085); material.specularColor = new Color3(.09, .18, .27); base.material = material; const traces = [0, 1, 2, 3].map((direction) => { const horizontal = direction === 1 || direction === 3; const trace = MeshBuilder.CreateBox(`trace-${index}-${direction}`, { width: horizontal ? .88 : .14, height: horizontal ? .14 : .88, depth: .045 }, this.scene); trace.position.x = base.position.x + (direction === 1 ? .32 : direction === 3 ? -.32 : 0); trace.position.y = base.position.y + (direction === 0 ? .32 : direction === 2 ? -.32 : 0); trace.position.z = .15; const traceMaterial = new StandardMaterial(`trace-mat-${index}-${direction}`, this.scene); traceMaterial.diffuseColor = new Color3(.1, .28, .17); traceMaterial.emissiveColor = new Color3(.035, .11, .06); traceMaterial.specularColor = Color3.Black(); trace.material = traceMaterial; return trace; }); this.tiles.push({ kind: solvedKinds[index], orientation: 0, solution: solvedOrientations[index], base, traces }); } const socketMaterial = new StandardMaterial("socket-mat", this.scene); socketMaterial.emissiveColor = new Color3(.48, 1, .26); socketMaterial.diffuseColor = new Color3(.16, .34, .12); ["input", "output"].forEach((name, index) => { const socket = MeshBuilder.CreateBox(name, { width: .44, height: .7, depth: .16 }, this.scene); socket.position.set(index ? 4.32 : -4.32, 2.88, .08); socket.material = socketMaterial; }); }
  private reset() { this.status = "ready"; this.moves = 0; this.elapsed = 0; const profile = difficultyProfiles[this.difficulty]; const offsets = this.dailyChallenge?.scrambleOffsets || profile.scrambleOffsets; this.tiles.forEach((tile, index) => tile.orientation = (tile.solution + offsets[index]) % 4); this.demoQueue = this.tiles.flatMap((tile, index) => Array.from({ length: (tile.solution - tile.orientation + 4) % 4 }, () => index)); this.selected = 0; this.updateVisuals(); this.callbacks.onStatus(this.status); this.callbacks.onMoves(this.moves); }
  private start() { if (this.status === "solved") this.reset(); if (this.status === "ready") { this.status = "playing"; this.callbacks.onStatus(this.status); this.callbacks.onSound("start"); } }
  private reachable() { const visited = new Set<number>(); if (!connections(this.tiles[0].kind, this.tiles[0].orientation).includes(3)) return visited; const queue = [0]; visited.add(0); while (queue.length) { const current = queue.shift()!; const row = Math.floor(current / 4); const column = current % 4; connections(this.tiles[current].kind, this.tiles[current].orientation).forEach((direction) => { const [dy, dx] = directionDelta[direction]; const nextRow = row + dy; const nextColumn = column + dx; if (nextRow < 0 || nextRow > 3 || nextColumn < 0 || nextColumn > 3) return; const next = indexOf(nextRow, nextColumn); if (connections(this.tiles[next].kind, this.tiles[next].orientation).includes((direction + 2) % 4) && !visited.has(next)) { visited.add(next); queue.push(next); } }); } return visited; }
  private solved() { const reached = this.reachable(); return reached.has(3) && connections(this.tiles[3].kind, this.tiles[3].orientation).includes(1); }
  private rotate(index: number) { this.start(); this.tiles[index].orientation = (this.tiles[index].orientation + 1) % 4; this.moves += 1; this.selected = index; this.callbacks.onMoves(this.moves); this.callbacks.onSound("rotate"); this.updateVisuals(); if (this.solved()) { this.status = "solved"; const multiplier = this.mode === "daily" ? 1.9 : difficultyProfiles[this.difficulty].scoreMultiplier; const earned = Math.max(25, Math.round((180 - this.moves * 5) * multiplier)); this.score += earned; this.best = Math.max(this.best, this.score); try { localStorage.setItem(this.storageKey, String(this.best)); } catch {} if (this.mode === "daily" && !this.demo && this.dailyChallenge) this.callbacks.onDailyStreak?.(completeDailyStreak(this.dailyChallenge.id)); this.callbacks.onScore(this.score, this.best); this.callbacks.onStatus(this.status); this.callbacks.onSound("puzzleSolve"); } }
  private updateVisuals() { const reached = this.reachable(); this.tiles.forEach((tile, index) => { const baseMaterial = tile.base.material as StandardMaterial; const active = index === this.selected; baseMaterial.diffuseColor = active ? new Color3(.09, .27, .39) : new Color3(.07, .14, .23); baseMaterial.emissiveColor = active ? new Color3(.025, .12, .19) : new Color3(.014, .04, .085); const activeConnections = connections(tile.kind, tile.orientation); tile.traces.forEach((trace, direction) => { trace.isVisible = activeConnections.includes(direction); const material = trace.material as StandardMaterial; const lit = reached.has(index); material.emissiveColor = lit ? new Color3(.42, 1, .24) : new Color3(.035, .11, .06); material.diffuseColor = lit ? new Color3(.32, .74, .15) : new Color3(.1, .28, .17); }); }); }
  private onPointer(event: PointerEvent) { const pick = this.scene.pick(event.offsetX, event.offsetY); const tileIndex = this.tiles.findIndex((tile) => pick?.pickedMesh === tile.base || tile.traces.includes(pick?.pickedMesh as Mesh)); if (tileIndex >= 0) this.rotate(tileIndex); }
  private onKey(event: KeyboardEvent) { const target = event.target as HTMLElement | null; const editable = target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || ""); if (editable || document.querySelector('[data-slot="dialog-content"]')) return; if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter", "r", "R"].includes(event.key)) event.preventDefault(); if (event.key === "r" || event.key === "R") { this.reset(); return; } if (event.key === " ") { if (this.status === "ready") this.start(); else this.rotate(this.selected); return; } const row = Math.floor(this.selected / 4); const column = this.selected % 4; const move = event.key === "ArrowUp" ? [-1, 0] : event.key === "ArrowDown" ? [1, 0] : event.key === "ArrowLeft" ? [0, -1] : event.key === "ArrowRight" ? [0, 1] : null; if (move) { const nextRow = Math.max(0, Math.min(3, row + move[0])); const nextColumn = Math.max(0, Math.min(3, column + move[1])); this.selected = indexOf(nextRow, nextColumn); this.updateVisuals(); } if (event.key === "Enter") this.rotate(this.selected); }
  update(delta: number) { this.elapsed += delta; if (!this.demo) return; if (this.status === "ready" && this.elapsed > .55) this.start(); if (this.status === "playing" && this.demoQueue.length) { this.demoCooldown -= delta; if (this.demoCooldown <= 0) { this.rotate(this.demoQueue.shift()!); this.demoCooldown = .32; } } }
  dispose() { this.canvas.removeEventListener("pointerdown", this.pointerHandler); window.removeEventListener("keydown", this.keyHandler); this.tiles.forEach((tile) => { tile.base.dispose(); tile.traces.forEach((trace) => trace.dispose()); }); }
}
