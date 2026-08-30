import Phaser from 'phaser';
import { useGameStore } from '../../app/store/useGameStore';
import { CHUNK_PX, CHUNK_TILES, TILE, BASE_GREEN, WATER_DARK, TREE_BROWN, isWaterTile, isTreeTile, getMineralType, getMineralColor } from '../world/Terrain';

export class ChunkRenderer {
  private rendered = new Map<string, Phaser.GameObjects.Container>();
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

    const neededChunks: string[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = centerChunk.chunkX + dx;
        const cy = centerChunk.chunkY + dy;
        const key = this.chunkKey(cx, cy);
        neededChunks.push(key);
      }
    }

    const missingChunks = neededChunks.filter(
      key => !this.rendered.has(key) && !this.pending.has(key)
    );

    if (missingChunks.length > 0) {
      missingChunks.forEach(cid => this.pending.add(cid));

      await Promise.all(missingChunks.map(async (key) => {
        const [cx, cy] = key.split(':').map(Number);
        try {
          const chunk = await useGameStore.getState().getChunk(cx, cy);
          this.loadChunkData(key, chunk);
        } catch (e) {
          console.warn('[ChunkRenderer] failed load', cx, cy, e);
        } finally {
          this.pending.delete(key);
        }
      }));
    }

    for (const key of Array.from(this.rendered.keys())) {
      if (!neededChunks.includes(key)) {
        const g = this.rendered.get(key);
        g?.destroy(true);
        this.rendered.delete(key);
      }
    }
  }

  private loadChunkData(key: string, _chunk: any) {
    const [cx, cy] = key.split(':').map(Number);
    const container = this.scene.add.container(0, 0);
    container.setDepth(-10);

    const terrain = this.scene.add.graphics();
    terrain.setDepth(-10);

    // Base: por tile pequeño (32px) - agua > minerales vetas > árboles 20-70% > verde
    for (let y = 0; y < CHUNK_TILES; y++) {
      for (let x = 0; x < CHUNK_TILES; x++) {
        const worldTileX = cx * CHUNK_TILES + x;
        const worldTileY = cy * CHUNK_TILES + y;
        let color: number;
        const mineralType = getMineralType(worldTileX, worldTileY);
        if (isWaterTile(worldTileX, worldTileY)) {
          color = WATER_DARK;
        } else if (mineralType) {
          color = getMineralColor(mineralType);
        } else if (isTreeTile(cx, cy, x, y)) {
          color = TREE_BROWN;
        } else {
          color = BASE_GREEN;
        }
        terrain.fillStyle(color, 1);
        terrain.fillRect(cx * CHUNK_PX + x * TILE, cy * CHUNK_PX + y * TILE, TILE, TILE);
      }
    }

    // Borde sutil chunk
    terrain.lineStyle(1, 0x1a2e1a, 0.06);
    terrain.strokeRect(cx * CHUNK_PX, cy * CHUNK_PX, CHUNK_PX, CHUNK_PX);

    container.add(terrain);

    this.rendered.set(key, container);
  }
}
