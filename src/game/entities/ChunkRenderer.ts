import Phaser from 'phaser';
import { useGameStore } from '../../app/store/useGameStore';

const CHUNK_PX = 1024;
const TILE = 32;
const CHUNK_TILES = 32;

export class ChunkRenderer {
  private rendered = new Map<string, Phaser.GameObjects.Group>();
  private pending = new Set<string>();
  private lastCenter = { x: 0, y: 0 };
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  worldToChunk(worldX: number, worldY: number) {
    return { chunkX: Math.floor(worldX / CHUNK_PX), chunkY: Math.floor(worldY / CHUNK_PX), localX: Math.floor((worldX - Math.floor(worldX / CHUNK_PX) * CHUNK_PX) / TILE), localY: Math.floor((worldY - Math.floor(worldY / CHUNK_PX) * CHUNK_PX) / TILE) };
  }

  chunkKey(x: number, y: number) {
    return `${x}:${y}`;
  }

  async update(camera: Phaser.Cameras.Scene2D.Camera) {
    const centerX = camera.scrollX + camera.width / 2;
    const centerY = camera.scrollY + camera.height / 2;
    const centerChunk = this.worldToChunk(centerX, centerY);

    const dist = Phaser.Math.Distance.Between(centerX, centerY, this.lastCenter.x, this.lastCenter.y);
    if (dist < 512 && this.rendered.size > 0) return;
    this.lastCenter = { x: centerX, y: centerY };

    const needed = new Set<string>();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = centerChunk.chunkX + dx;
        const cy = centerChunk.chunkY + dy;
        const key = this.chunkKey(cx, cy);
        needed.add(key);
        if (!this.rendered.has(key) && !this.pending.has(key)) {
          this.pending.add(key);
          this.loadChunk(cx, cy).finally(() => this.pending.delete(key));
        }
      }
    }
    // Unload far (distance >1)
    for (const key of Array.from(this.rendered.keys())) {
      if (!needed.has(key)) {
        const g = this.rendered.get(key);
        g?.destroy(true);
        this.rendered.delete(key);
      }
    }
  }

  private async loadChunk(chunkX: number, chunkY: number) {
    const key = this.chunkKey(chunkX, chunkY);
    try {
      const chunk = await useGameStore.getState().getChunk(chunkX, chunkY);
      const group = this.scene.add.group();
      const tiles: number[][] = chunk.tiles as number[][];

      for (let y = 0; y < CHUNK_TILES; y++) {
        for (let x = 0; x < CHUNK_TILES; x++) {
          const gid = tiles[y]?.[x] ?? 1;
          const color = this.gidToColor(gid);
          const rect = this.scene.add.rectangle(
            chunkX * CHUNK_PX + x * TILE + TILE / 2,
            chunkY * CHUNK_PX + y * TILE + TILE / 2,
            TILE, TILE,
            color,
            1,
          );
          rect.setDepth(-10); // terreno siempre detrás de entidades
          rect.setStrokeStyle(1, 0x000000, 0.05);
          group.add(rect);
          if (gid === 101 || gid === 102) {
            rect.setFillStyle(0x555555);
          }
        }
      }
      // Resources overlay - encima del terreno pero debajo de survivors
      const resources = (chunk.resources as any[]) ?? [];
      for (const r of resources) {
        const c = this.scene.add.circle(r.posX, r.posY, 6, 0xffd700, 0.9);
        c.setDepth(0);
        c.setStrokeStyle(1, 0x000000);
        group.add(c);
      }

      this.rendered.set(key, group);
    } catch (e) {
      console.warn('[ChunkRenderer] failed load', chunkX, chunkY, e);
    }
  }

  private gidToColor(gid: number): number {
    if (gid === 1) return 0x2d5a27; // grass
    if (gid === 2) return 0x8b7355; // dirt
    if (gid === 5) return 0x1a4d1a; // forest
    if (gid === 101) return 0x5a5a5a; // rock
    if (gid === 102) return 0x2e86ab; // water
    return 0x2d5a27;
  }
}
