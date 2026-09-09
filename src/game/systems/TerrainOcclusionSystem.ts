import Phaser from "phaser";
import {
  tileToIso,
  isoToTile,
  ISO_TILE_W,
  ISO_TILE_H,
  WORLD_TILES,
  gidToColor,
} from "../world/Terrain";
import { getHeightFast, HEIGHT_STEP_PX } from "../world/TerrainHeight";
import { getTileGid } from "../world/WorldTiles";
import { eastWall, southWall, darken, EAST_SHADE, SOUTH_SHADE } from "../world/IsoWalls";

/**
 * TerrainOcclusionSystem.ts
 *
 * Hace que los tiles elevados que están frente al personaje (tapándolo)
 * se dibujen de forma semi-transparente solo cuando el personaje está
 * detrás de ellos, permitiendo ver al personaje a través del terreno.
 */
export class TerrainOcclusionSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private readonly OCCLUSION_ALPHA = 0.38;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = this.scene.add.graphics();
    // Depth por encima de las entidades dinámicas (~3000..6000)
    // pero por debajo de herramientas de UI/editor (9500)
    this.graphics.setDepth(8500);
  }

  /**
   * Evalúa los tiles alrededor del jugador y dibuja con transparencia
   * solo aquellos tiles elevados que están delante de él tapándolo.
   */
  public update(player: { x: number; y: number; active?: boolean } | null): void {
    this.graphics.clear();
    if (!player || player.active === false) return;

    const px = player.x;
    const py = player.y;

    // Tile en el plano donde están los pies del jugador
    const { tileX: pTileX, tileY: pTileY } = isoToTile(px, py);
    const playerH = getHeightFast(pTileX, pTileY);

    const HALF_W = ISO_TILE_W / 2;
    const HALF_H = ISO_TILE_H / 2;

    // Buscar en la vecindad inmediata (máx 3 tiles adelante/lados)
    for (let dy = -1; dy <= 3; dy++) {
      for (let dx = -1; dx <= 3; dx++) {
        const tx = pTileX + dx;
        const ty = pTileY + dy;
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) continue;

        const h = getHeightFast(tx, ty);
        // Si el tile no es más alto que el suelo del jugador, no puede taparlo desde arriba
        if (h <= playerH) continue;

        const iso = tileToIso(tx, ty);
        const topX = iso.x;
        const topY = iso.y - h * HEIGHT_STEP_PX;
        const groundCenterY = iso.y + HALF_H;

        // El tile está delante del jugador en la proyección isométrica (hacia la cámara)
        if (groundCenterY < py - 6) continue;

        // Bounding box en pantalla del tile elevado
        const leftX = topX - HALF_W;
        const rightX = topX + HALF_W;
        const bottomY = iso.y + ISO_TILE_H; // fondo de los muros

        // Verificar si la caja de la entidad (altura ~48px) intersecta con el tile
        const entityTop = py - 48;
        const entityBottom = py;
        const entityLeft = px - 16;
        const entityRight = px + 16;

        const overlapX = entityRight > leftX && entityLeft < rightX;
        const overlapY = entityBottom > topY && entityTop < bottomY;

        if (!overlapX || !overlapY) continue;

        // Este tile elevado está FRENTE al jugador y lo está tapando -> Dibujar con transparencia
        const gid = getTileGid(tx, ty) ?? 1;
        const color = gidToColor(gid);
        const hE = tx + 1 < WORLD_TILES ? getHeightFast(tx + 1, ty) : h;
        const hS = ty + 1 < WORLD_TILES ? getHeightFast(tx, ty + 1) : h;

        // 1. Superficie (rombo superior)
        this.graphics.fillStyle(color, this.OCCLUSION_ALPHA);
        this.graphics.beginPath();
        this.graphics.moveTo(topX, topY);
        this.graphics.lineTo(topX + HALF_W, topY + HALF_H);
        this.graphics.lineTo(topX, topY + ISO_TILE_H);
        this.graphics.lineTo(topX - HALF_W, topY + HALF_H);
        this.graphics.closePath();
        this.graphics.fillPath();

        // 2. Muro Este (si desciende hacia vecino este)
        if (h > hE) {
          const dropPx = (h - hE) * HEIGHT_STEP_PX;
          const wall = eastWall(topX, topY, dropPx);
          this.graphics.fillStyle(darken(color, EAST_SHADE), this.OCCLUSION_ALPHA);
          this.graphics.beginPath();
          this.graphics.moveTo(wall[0].x, wall[0].y);
          this.graphics.lineTo(wall[1].x, wall[1].y);
          this.graphics.lineTo(wall[2].x, wall[2].y);
          this.graphics.lineTo(wall[3].x, wall[3].y);
          this.graphics.closePath();
          this.graphics.fillPath();
        }

        // 3. Muro Sur (si desciende hacia vecino sur)
        if (h > hS) {
          const dropPx = (h - hS) * HEIGHT_STEP_PX;
          const wall = southWall(topX, topY, dropPx);
          this.graphics.fillStyle(darken(color, SOUTH_SHADE), this.OCCLUSION_ALPHA);
          this.graphics.beginPath();
          this.graphics.moveTo(wall[0].x, wall[0].y);
          this.graphics.lineTo(wall[1].x, wall[1].y);
          this.graphics.lineTo(wall[2].x, wall[2].y);
          this.graphics.lineTo(wall[3].x, wall[3].y);
          this.graphics.closePath();
          this.graphics.fillPath();
        }

        // 4. Contorno sutil para lectura nítida del relieve translúcido
        this.graphics.lineStyle(1, 0xffffff, 0.25);
        (this.graphics as any).strokePoints([
          { x: topX, y: topY },
          { x: topX + HALF_W, y: topY + HALF_H },
          { x: topX, y: topY + ISO_TILE_H },
          { x: topX - HALF_W, y: topY + HALF_H },
        ], true);
      }
    }
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}
