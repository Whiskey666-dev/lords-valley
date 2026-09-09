import Phaser from 'phaser';
import {
  CHUNK_TILES,
  BASE_GREEN,
  gidToColor,
  ISO_TILE_W,
  ISO_TILE_H,
  ISO_ORIGIN_X,
  isoToTile,
  WORLD_CHUNKS,
  WORLD_TILES
} from '../world/Terrain';
import { eastWall, southWall, darken, EAST_SHADE, SOUTH_SHADE } from '../world/IsoWalls';
import { getChunkTiles, getTileGid, fetchSingleChunk } from '../world/WorldTiles';
import { getHeightFast, HEIGHT_STEP_PX } from '../world/TerrainHeight';
import { collisionMatrix } from '../world/CollisionMatrix';

export class ChunkRenderer {
  private rendered = new Map<string, Phaser.GameObjects.Container>();
  private topLayers = new Map<string, Phaser.GameObjects.Graphics>();
  /** Contenedor único de tops: orden explícito atrás→adelante, inmune al
   * orden de llegada por streaming (la cámara crea chunks en cualquier
   * orden al moverse; sin esto un chunk trasero tardío taparía al frontal). */
  private topContainer: Phaser.GameObjects.Container | null = null;
  private pending = new Set<string>();
  private lastCenter = { x: -9999, y: -9999 };
  private lastZoom = -1;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Huella de versión en consola (F12)
    console.log("[terrain] renderer v15 (muros sólidos: caras frontales E/S por banda diagonal)");
    this.topContainer = scene.add.container(0, 0);
    this.topContainer.setDepth(-10);
    // Colisión desde los tiles del backend (el boot precarga el mundo)
    collisionMatrix.buildFromWorldTiles(getTileGid);
    // Escuchar cambios de altura para refrescar chunks afectados
    window.addEventListener("terrain-height-changed" as any, ((e: CustomEvent<{ changedChunks: Set<string> }>) => {
      const detail = (e as CustomEvent<any>).detail;
      const changed: Set<string> | string[] = detail?.changedChunks ?? new Set();
      const set = changed instanceof Set ? changed : new Set<string>(changed as string[]);
      // Con muros en las 4 caras, los vecinos en las 4 direcciones tienen
      // muros que miran hacia aquí: al editar hay que refrescarlos también,
      // o los bordes de chunk quedan con muros rancios/faltantes.
      const expanded = new Set<string>(set);
      for (const key of set) {
        const [cx, cy] = key.split(':').map(Number);
        if (Number.isFinite(cx) && Number.isFinite(cy)) {
          if (cx > 0) expanded.add(`${cx - 1}:${cy}`);
          if (cy > 0) expanded.add(`${cx}:${cy - 1}`);
          if (cx < WORLD_CHUNKS - 1) expanded.add(`${cx + 1}:${cy}`);
          if (cy < WORLD_CHUNKS - 1) expanded.add(`${cx}:${cy + 1}`);
        }
      }
      this.refreshChunks(expanded);
    }) as EventListener);
  }

  /** Re-render chunks cuya altura cambió (mismo orden atrás→adelante que update). */
  private refreshChunks(keys: Set<string>): void {
    const ordered = [...keys].sort((a, b) => {
      const [ax, ay] = a.split(':').map(Number);
      const [bx, by] = b.split(':').map(Number);
      return ax + ay - (bx + by) || ax - bx;
    });
    for (const key of ordered) {
      if (this.rendered.has(key)) {
        this.destroyChunk(key);
        this.renderChunk(key);
      } else {
        // si el chunk no estaba renderizado pero está en pending needed, se renderizará en próximo update
        // forzar si está dentro del viewport actual: intentar render si no existe
        // Solo si está cerca: calculamos needed con lastCenter? simplificamos: no hacer nada
      }
    }
  }

  /** Destruye base horneada + objetos de relieve de un chunk. */
  private destroyChunk(key: string): void {
    const existing = this.rendered.get(key);
    if (existing) {
      existing.destroy(true);
      this.rendered.delete(key);
    }
    const top = this.topLayers.get(key);
    if (top) {
      try { this.topContainer?.remove(top); } catch { /* ya fuera */ }
      top.destroy();
      this.topLayers.delete(key);
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

    // Orden atrás→adelante (suma cx+cy, desempate cx): determinista. El
    // orden final lo impone topContainer por sortKey (ver sortTopLayers):
    // da igual en qué orden lleguen los chunks por streaming o fetch.
    const ordered = [...neededChunks].sort((a, b) => {
      const [ax, ay] = a.split(':').map(Number);
      const [bx, by] = b.split(':').map(Number);
      return ax + ay - (bx + by) || ax - bx;
    });
    // Renderizar chunks faltantes de forma inmediata y sincrónica (sin tirones)
    for (const key of ordered) {
      if (!this.rendered.has(key)) {
        this.renderChunk(key);
      }
    }

    // Desmontar chunks lejanos para liberar memoria GPU
    for (const key of Array.from(this.rendered.keys())) {
      if (!neededChunks.has(key)) {
        this.destroyChunk(key);
      }
    }

    // Tiles del backend con la seed activa; lo que falte se pide y se
    // renderiza al llegar (renderChunk es idempotente).
    for (const key of neededChunks) {
      if (!this.rendered.has(key) && !this.pending.has(key)) {
        const [cx, cy] = key.split(':').map(Number);
        if (getChunkTiles(cx, cy)) {
          this.renderChunk(key);
        } else {
          this.pending.add(key);
          fetchSingleChunk(cx, cy).then(() => {
            this.pending.delete(key);
            if (!this.rendered.has(key) && getChunkTiles(cx, cy)) this.renderChunk(key);
          }).catch(() => {
            this.pending.delete(key);
          });
        }
      }
    }
    // Seguro final: los tops quedan ordenados atrás→adelante.
    this.sortTopLayers();
  }

  private renderChunk(key: string) {
    const [cx, cy] = key.split(':').map(Number);
    this.destroyChunk(key);
    const chunkTiles = getChunkTiles(cx, cy);
    if (!chunkTiles) return;

    const container = this.scene.add.container(0, 0);
    container.setDepth(-11);
    const base = this.scene.add.graphics();
    base.setDepth(-11);
    const terrain = this.scene.add.graphics();
    terrain.setDepth(-10);

    const HALF_W = ISO_TILE_W / 2;
    const HALF_H = ISO_TILE_H / 2;

    const c0x = (cx * CHUNK_TILES - cy * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c0y = (cx * CHUNK_TILES + cy * CHUNK_TILES) * HALF_H;
    const c1x = ((cx + 1) * CHUNK_TILES - cy * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c1y = ((cx + 1) * CHUNK_TILES + cy * CHUNK_TILES) * HALF_H;
    const c2x = ((cx + 1) * CHUNK_TILES - (cy + 1) * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c2y = ((cx + 1) * CHUNK_TILES + (cy + 1) * CHUNK_TILES) * HALF_H;
    const c3x = (cx * CHUNK_TILES - (cy + 1) * CHUNK_TILES) * HALF_W + ISO_ORIGIN_X;
    const c3y = (cx * CHUNK_TILES + (cy + 1) * CHUNK_TILES) * HALF_H;

    base.fillStyle(BASE_GREEN, 1);
    base.beginPath();
    base.moveTo(c0x, c0y);
    base.lineTo(c1x, c1y);
    base.lineTo(c2x, c2y);
    base.lineTo(c3x, c3y);
    base.closePath();
    base.fillPath();

    // Cada quad se pinta con su propio beginPath/fillPath (evita agujeros
    // por even-odd fill rule cuando varios quads comparten aristas).
    const fillQuad = (color: number, q: Array<{ x: number; y: number }>) => {
      terrain.fillStyle(color, 1);
      terrain.beginPath();
      terrain.moveTo(q[0].x, q[0].y);
      terrain.lineTo(q[1].x, q[1].y);
      terrain.lineTo(q[2].x, q[2].y);
      terrain.lineTo(q[3].x, q[3].y);
      terrain.closePath();
      terrain.fillPath();
    };

    type BandTile = {
      x: number; y: number; gid: number; h: number;
      hE: number; hS: number;
    };
    const bands: BandTile[][] = Array.from({ length: 2 * CHUNK_TILES - 1 }, () => []);
    for (let y = 0; y < CHUNK_TILES; y++) {
      for (let x = 0; x < CHUNK_TILES; x++) {
        const gid = chunkTiles[y][x];
        const worldTileX = cx * CHUNK_TILES + x;
        const worldTileY = cy * CHUNK_TILES + y;
        const baseIsoX = (worldTileX - worldTileY) * HALF_W + ISO_ORIGIN_X;
        const baseIsoY = (worldTileX + worldTileY) * HALF_H;
        const h = getHeightFast(worldTileX, worldTileY);
        bands[x + y].push({
          x: baseIsoX,
          y: baseIsoY - h * HEIGHT_STEP_PX,
          gid, h,
          hE: worldTileX + 1 < WORLD_TILES ? getHeightFast(worldTileX + 1, worldTileY) : h,
          hS: worldTileY + 1 < WORLD_TILES ? getHeightFast(worldTileX, worldTileY + 1) : h,
        });
      }
    }

    // Por banda diagonal (atrás→adelante, s = 0..2*CHUNK_TILES-2):
    // 1. Top del tile (rombo superior)
    // 2. Muros visibles (Este y Sur) extruidos hacia abajo
    // Las bandas posteriores (s+1, s+2...) se pintan después, de modo que cualquier
    // relieve frontal cubre naturalmente los muros que quedan detrás.
    for (let s = 0; s < bands.length; s++) {
      const band = bands[s];
      if (band.length === 0) continue;

      for (const t of band) {
        const color = this.shadeColor(gidToColor(t.gid), t.h);
        terrain.fillStyle(color, 1);
        terrain.beginPath();
        terrain.moveTo(t.x, t.y);
        terrain.lineTo(t.x + HALF_W, t.y + HALF_H);
        terrain.lineTo(t.x, t.y + ISO_TILE_H);
        terrain.lineTo(t.x - HALF_W, t.y + HALF_H);
        terrain.closePath();
        terrain.fillPath();
      }

      for (const t of band) {
        if (t.h > t.hE) fillQuad(darken(gidToColor(t.gid), EAST_SHADE),  eastWall(t.x,  t.y, (t.h - t.hE) * HEIGHT_STEP_PX));
        if (t.h > t.hS) fillQuad(darken(gidToColor(t.gid), SOUTH_SHADE), southWall(t.x, t.y, (t.h - t.hS) * HEIGHT_STEP_PX));
      }
    }

    base.lineStyle(1, 0x224422, 0.15);
    (base as any).strokePoints([
      { x: c0x, y: c0y }, { x: c1x, y: c1y },
      { x: c2x, y: c2y }, { x: c3x, y: c3y },
    ], true);

    (terrain as any).sortKey = (cx + cy) * 10 + cx;
    container.add(base);
    this.rendered.set(key, container);
    this.topContainer?.add(terrain);
    this.sortTopLayers();
    this.topLayers.set(key, terrain);
  }

  /** Reordena los tops atrás→adelante de forma explícita. */
  private sortTopLayers(): void {
    try {
      (this.topContainer as any)?.sort?.("sortKey");
    } catch { /* contenedor aún no listo: el próximo update lo ordena */ }
  }

  destroy() {
    for (const container of this.rendered.values()) {
      container.destroy(true);
    }
    this.rendered.clear();
    this.topLayers.clear();
    if (this.topContainer) {
      this.topContainer.destroy(true);
      this.topContainer = null;
    }
    this.pending.clear();
  }
}
