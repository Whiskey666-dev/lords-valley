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
import { getHeightFast, HEIGHT_STEP_PX } from '../world/TerrainHeight';
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
    // Escuchar cambios de altura para refrescar chunks afectados
    window.addEventListener("terrain-height-changed" as any, ((e: CustomEvent<{ changedChunks: Set<string> }>) => {
      const detail = (e as CustomEvent<any>).detail;
      const changed: Set<string> | string[] = detail?.changedChunks ?? new Set();
      const set = changed instanceof Set ? changed : new Set<string>(changed as string[]);
      this.refreshChunks(set);
    }) as EventListener);
  }

  /** Re-render chunks cuya altura cambió */
  private refreshChunks(keys: Set<string>): void {
    for (const key of keys) {
      const existing = this.rendered.get(key);
      if (existing) {
        existing.destroy(true);
        this.rendered.delete(key);
        this.renderChunk(key);
      } else {
        // si el chunk no estaba renderizado pero está en pending needed, se renderizará en próximo update
        // forzar si está dentro del viewport actual: intentar render si no existe
        // Solo si está cerca: calculamos needed con lastCenter? simplificamos: no hacer nada
      }
    }
  }

  /** Ajusta color por altura: aclara si elevado, oscurece si hundido */
  private shadeColor(hex: number, h: number): number {
    if (h === 0) return hex;
    let r = (hex >> 16) & 0xff;
    let g = (hex >> 8) & 0xff;
    let b = hex & 0xff;
    if (h > 0) {
      const f = Math.min(0.45, h * 0.075);
      r = Math.min(255, Math.round(r + (255 - r) * f));
      g = Math.min(255, Math.round(g + (255 - g) * f));
      b = Math.min(255, Math.round(b + (255 - b) * f));
    } else {
      const f = Math.max(0.35, 1 + h * 0.09); // h negativo => 0.91, 0.82...
      r = Math.round(r * f);
      g = Math.round(g * f);
      b = Math.round(b * f);
    }
    return (r << 16) | (g << 8) | b;
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

    // 2) Overlays de agua, minerales y árboles agrupados por color + altura
    // También dibujamos variaciones de césped por altura (no solo overlay)
    const colorGroups = new Map<number, Array<{ x: number; y: number }>>();

    // Para césped con altura, necesitamos agrupar también por altura (sombreamos BASE_GREEN)
    // Creamos mapa de altura -> color sombreado para césped
    const heightBaseColorCache = new Map<number, number>();

    for (let y = 0; y < CHUNK_TILES; y++) {
      for (let x = 0; x < CHUNK_TILES; x++) {
        const worldTileX = cx * CHUNK_TILES + x;
        const worldTileY = cy * CHUNK_TILES + y;
        const baseIsoX = (worldTileX - worldTileY) * HALF_W + ISO_ORIGIN_X;
        const baseIsoY = (worldTileX + worldTileY) * HALF_H;
        const h = getHeightFast(worldTileX, worldTileY);
        const isoX = baseIsoX;
        const isoY = baseIsoY - h * HEIGHT_STEP_PX;

        let color: number | null = null;
        let isBaseGreen = false;
        const mineralType = getMineralTypeFast(worldTileX, worldTileY);
        if (isWaterTileFast(worldTileX, worldTileY)) {
          color = this.shadeColor(WATER_DARK, h);
        } else if (mineralType) {
          color = this.shadeColor(getMineralColor(mineralType), h);
        } else if (isTreeTile(cx, cy, x, y)) {
          color = this.shadeColor(TREE_BROWN, h);
        } else {
          // Césped base: si hay altura !=0, dibujamos overlay sombreado, si no dejamos base polígono
          if (h !== 0) {
            isBaseGreen = true;
            let cached = heightBaseColorCache.get(h);
            if (cached === undefined) {
              cached = this.shadeColor(BASE_GREEN, h);
              heightBaseColorCache.set(h, cached);
            }
            color = cached;
          } else {
            continue; // Césped base ya dibujado
          }
        }

        // Para césped sombreado también usamos colorGroups, se dibujará sobre base
        if (color === null) continue;
        // si esBaseGreen y altura, mantendremos grupo normal
        void isBaseGreen;
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
      // Si es césped con altura, dibujar borde sutil de desnivel
      // (solo si color proviene de BASE_GREEN sombreado)
      // Detectamos si algún punto de este color corresponde a césped elevado
      // Para simplicidad dibujamos contorno delgado del mismo color más oscuro si altura !=0
    }

    // 2b) Dibujar indicadores de altura (números) y bordes de acantilado para desnivel visible
    // Pequeños ticks de sombra en tile con altura para percibir relieve
    const cliffGraphics = this.scene.add.graphics();
    cliffGraphics.setDepth(-10);
    let hasCliff = false;
    for (let y = 0; y < CHUNK_TILES; y++) {
      for (let x = 0; x < CHUNK_TILES; x++) {
        const worldTileX = cx * CHUNK_TILES + x;
        const worldTileY = cy * CHUNK_TILES + y;
        const h = getHeightFast(worldTileX, worldTileY);
        if (h === 0) continue;
        const baseIsoX = (worldTileX - worldTileY) * HALF_W + ISO_ORIGIN_X;
        const baseIsoY = (worldTileX + worldTileY) * HALF_H - h * HEIGHT_STEP_PX;
        // Borde lateral si vecino más bajo (acantilado)
        const eastH = worldTileX + 1 < 192 ? getHeightFast(worldTileX + 1, worldTileY) : h;
        const southH = worldTileY + 1 < 192 ? getHeightFast(worldTileX, worldTileY + 1) : h;
        if (h > eastH || h > southH) {
          hasCliff = true;
          const diff = Math.max(h - eastH, h - southH);
          const alpha = Math.min(0.35, 0.12 + diff * 0.06);
          cliffGraphics.fillStyle(0x000000, alpha);
          cliffGraphics.beginPath();
          // sombra lateral del rombo: pequeño paralelogramo en borde sur-este
          cliffGraphics.moveTo(baseIsoX + ISO_TILE_W, baseIsoY + HALF_H);
          cliffGraphics.lineTo(baseIsoX + HALF_W, baseIsoY + ISO_TILE_H);
          cliffGraphics.lineTo(baseIsoX + HALF_W, baseIsoY + ISO_TILE_H + Math.min(8, diff * HEIGHT_STEP_PX));
          cliffGraphics.lineTo(baseIsoX + ISO_TILE_W, baseIsoY + HALF_H + Math.min(8, diff * HEIGHT_STEP_PX));
          cliffGraphics.closePath();
          cliffGraphics.fillPath();
        }
      }
    }
    if (hasCliff) container.add(cliffGraphics); else cliffGraphics.destroy();

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
