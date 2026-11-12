import type { Obstacle } from "./types";

/**
 * Static, insertion-order-preserving broad phase for the procedural island.
 * Destruction toggles obstacle.active but never changes obstacle geometry.
 * Queries are conservative: exact impact/collision tests remain authoritative.
 */
export class SurvivObstacleIndex {
  private readonly cellSize = 192;
  private readonly cells = new Map<string, number[]>();
  private readonly boxes: Array<{ minX: number; minY: number; maxX: number; maxY: number }>;

  constructor(private readonly obstacles: readonly Obstacle[]) {
    this.boxes = obstacles.map((obstacle, index) => {
      const rectangular = obstacle.type === "wall" || obstacle.type === "crate" || obstacle.type === "metal_crate";
      const halfX = rectangular ? (obstacle.width || 40) / 2 : obstacle.radius;
      const halfY = rectangular ? (obstacle.height || 40) / 2 : obstacle.radius;
      const bounds = {
        minX: obstacle.x - halfX, minY: obstacle.y - halfY,
        maxX: obstacle.x + halfX, maxY: obstacle.y + halfY,
      };
      for (let y = Math.floor(bounds.minY / this.cellSize); y <= Math.floor(bounds.maxY / this.cellSize); y++) {
        for (let x = Math.floor(bounds.minX / this.cellSize); x <= Math.floor(bounds.maxX / this.cellSize); x++) {
          const key = `${x},${y}`;
          const cell = this.cells.get(key);
          if (cell) cell.push(index);
          else this.cells.set(key, [index]);
        }
      }
      return bounds;
    });
  }

  private query(minX: number, minY: number, maxX: number, maxY: number): Obstacle[] {
    const ids = new Set<number>();
    for (let y = Math.floor(minY / this.cellSize); y <= Math.floor(maxY / this.cellSize); y++) {
      for (let x = Math.floor(minX / this.cellSize); x <= Math.floor(maxX / this.cellSize); x++) {
        for (const id of this.cells.get(`${x},${y}`) || []) ids.add(id);
      }
    }
    // Stable obstacle order preserves equal-time projectile collision priority.
    return [...ids].sort((a, b) => a - b)
      .filter(id => {
        const b = this.boxes[id];
        return this.obstacles[id].active &&
          b.maxX >= minX && b.minX <= maxX &&
          b.maxY >= minY && b.minY <= maxY;
      })
      .map(id => this.obstacles[id]);
  }

  near(x: number, y: number, radius: number): Obstacle[] {
    return this.query(x - radius, y - radius, x + radius, y + radius);
  }

  segment(from: {x:number;y:number}, to: {x:number;y:number}, padding: number): Obstacle[] {
    return this.query(
      Math.min(from.x, to.x) - padding, Math.min(from.y, to.y) - padding,
      Math.max(from.x, to.x) + padding, Math.max(from.y, to.y) + padding,
    );
  }
}
