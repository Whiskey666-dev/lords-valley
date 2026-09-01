import Phaser from 'phaser';
import { useGameStore } from '../../app/store/useGameStore';
import {
  CHUNK_TILES,
  BASE_GREEN,
  WATER_DARK,
  TREE_BROWN,
  isWaterTileFast,
  isTreeTile,
  getMineralTypeFast,
  getMineralColor,
  ISO_TILE_W,
  ISO_TILE_H,
  ISO_ORIGIN_X,
  isoToTile,
  WORLD_CHUNKS
} from '../world/Terrain';
import { collisionMatrix } from '../world/CollisionMatrix';

export class ChunkRenderer {
  private rendered = new Map<string, Phaser.GameObjects.Container>();
  private pending = new Set<string>();
  private lastCenter = { x: -9999, y: -9999 };
  private lastZoom = -1;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Asegurar que la matriz de colisión esté construida
    collisionMatrix.buildFromTerrain(isWaterTileFast, getMineralTypeFast as any, isTreeTile as any);
  }

  worldToChunk(isoX: number, isoY: number) {
    const { tileX, tileY } = isoToTile(isoX, isoY);
    const cx = Math.floor(tileX / CHUNK_TILES);
    const cy = Math.floor(tileY / CHUNK_TILES);
    return {
      chunkX: Math.max(0, Math.min(WORLD_CHUNKS - 1, cx)),
      chunkY: Math.max(0, Math.min(WORLD_CHUNKS - 1, cy)),
    };
  }

  chunkKey(x: number, y: number) {
    return `${x}:${y}`;
  }

  update(camera: Phaser.Cameras.Scene2D.Camera) {
    if (!camera) return;
    const centerX = camera.scrollX + camera.width / 2;
    const centerY = camera.scrollY + camera.height / 2;
    const currentZoom = camera.zoom;

    const dist = Phaser.Math.Distance.Between(centerX, centerY, this.lastCenter.x, this.lastCenter.y);
    const zoomChanged = Math.abs(currentZoom - this.lastZoom) > 0.05;
    if (dist < 256 && !zoomChanged && this.rendered.size > 0) return;
    this.lastCenter = { x: centerX, y: centerY };
    this.lastZoom = currentZoom;

    const centerChunk = this.worldToChunk(centerX, centerY);

    // Calcular radio de chunks según zoom (más chunks si zoom alejado)
    const radius = currentZoom < 0.8 ? 3 : 2;
    const neededChunks = new Set<string>();

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const cx = centerChunk.chunkX + dx;
        const cy = centerChunk.chunkY + dy;
        if (cx >= 0 && cx < WORLD_CHUNKS && cy >= 0 && cy < WORLD_CHUNKS) {
          neededChunks.add(this.chunkKey(cx, cy));
        }
      }
    }

    // Renderizar chunks faltantes de forma inmediata y sincrónica (sin tirones)
    for (const key of neededChunks) {
      if (!this.rendered.has(key)) {
        this.renderChunk(key);
      }
    }

    // Desmontar chunks lejanos para liberar memoria GPU
    for (const [key, container] of this.rendered.entries()) {
      if (!neededChunks.has(key)) {
        container.destroy(true);
        this.rendered.delete(key);
      }
    }

    // Obtener datos de chunks del backend en background si faltan en useGameStore
    const missingInStore: string[] = [];
    const storeChunks = useGameStore.getState().chunks;
    for (const key of neededChunks) {
      if (!storeChunks.has(key) && !this.pending.has(key)) {
        missingInStore.push(key);
      }
    }
    if (missingInStore.length > 0) {
      missingInStore.forEach(k => this.pending.add(k));
      missingInStore.forEach(async (key) => {
        const [cx, cy] = key.split(':').map(Number);
        try {
          await useGameStore.getState().getChunk(cx, cy);
        } catch {
          // ignore
        } finally {
          this.pending.delete(key);
        }
      });
    }
  }

  private renderChunk(key: string) {
    const [cx, cy] = key.split(':').map(Number);
    const container = this.scene.add.container(0, 0);
    container.setDepth(-10);

    const terrain = this.scene.add.graphics();
    terrain.setDepth(-10);

    const HALF_W = ISO_TILE_W / 2; // 32
    const HALF_H = ISO_TILE_H / 2; // 16

    // Vértices del rombo del chunk completo (32x32 tiles)
    const c0x = (cx * CHUNK_TILES - cy * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c0y = (cx * CHUNK_TILES + cy * CHUNK_TILES) * HALF_H;
    const c1x = ((cx + 1) * CHUNK_TILES - cy * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c1y = ((cx + 1) * CHUNK_TILES + cy * CHUNK_TILES) * HALF_H;
    const c2x = ((cx + 1) * CHUNK_TILES - (cy + 1) * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c2y = ((cx + 1) * CHUNK_TILES + (cy + 1) * CHUNK_TILES) * HALF_H;
    const c3x = (cx * CHUNK_TILES - (cy + 1) * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c3y = (cx * CHUNK_TILES + (cy + 1) * CHUNK_TILES) * HALF_H;

    // 1) Base verde de césped de todo el chunk (1 polígono en lugar de 1024)
    terrain.fillStyle(BASE_GREEN, 1);
    terrain.beginPath();
    terrain.moveTo(c0x + HALF_W, c0y);
    terrain.lineTo(c1x + HALF_W, c1y);
    terrain.lineTo(c2x + HALF_W, c2y + ISO_TILE_H);
    terrain.lineTo(c3x + HALF_W, c3y + ISO_TILE_H);
    terrain.closePath();
    terrain.fillPath();

    // 2) Overlays de agua, minerales y árboles agrupados por color
    const colorGroups = new Map<number, Array<{ x: number; y: number }>>();

    for (let y = 0; y < CHUNK_TILES; y++) {
      for (let x = 0; x < CHUNK_TILES; x++) {
        const worldTileX = cx * CHUNK_TILES + x;
        const worldTileY = cy * CHUNK_TILES + y;
        const isoX = (worldTileX - worldTileY) * HALF_W + ISO_ORIGIN_X;
        const isoY = (worldTileX + worldTileY) * HALF_H;

        let color: number | null = null;
        const mineralType = getMineralTypeFast(worldTileX, worldTileY);
        if (isWaterTileFast(worldTileX, worldTileY)) {
          color = WATER_DARK;
        } else if (mineralType) {
          color = getMineralColor(mineralType);
        } else if (isTreeTile(cx, cy, x, y)) {
          color = TREE_BROWN;
        } else {
          continue; // Césped base ya dibujado
        }

        let group = colorGroups.get(color);
        if (!group) {
          group = [];
          colorGroups.set(color, group);
        }
        group.push({ x: isoX, y: isoY });
      }
    }

    // Dibujar cada grupo de tiles especiales con 1 solo fillPath por color
    for (const [color, points] of colorGroups) {
      if (points.length === 0) continue;
      terrain.fillStyle(color, 1);
      terrain.beginPath();
      for (const p of points) {
        terrain.moveTo(p.x + HALF_W, p.y);
        terrain.lineTo(p.x + ISO_TILE_W, p.y + HALF_H);
        terrain.lineTo(p.x + HALF_W, p.y + ISO_TILE_H);
        terrain.lineTo(p.x, p.y + HALF_H);
        terrain.closePath();
      }
      terrain.fillPath();
    }

    // Borde sutil del chunk
    terrain.lineStyle(1, 0x224422, 0.15);
    (terrain as any).strokePoints([
      { x: c0x + HALF_W, y: c0y },
      { x: c1x + HALF_W, y: c1y },
      { x: c2x + HALF_W, y: c2y + ISO_TILE_H },
      { x: c3x + HALF_W, y: c3y + ISO_TILE_H },
    ], true);

    container.add(terrain);
    this.rendered.set(key, container);
  }

  destroy() {
    for (const container of this.rendered.values()) {
      container.destroy(true);
    }
    this.rendered.clear();
    this.pending.clear();
  }
}
