import Phaser from "phaser";
import {
  isWaterTileFast,
  isTreeTile,
  getMineralTypeFast,
} from "../world/Terrain";
import { collisionMatrix } from "../world/CollisionMatrix";

/**
 * Capa A — Suelo Estático
 * Inicializa la matriz de colisión y el estado del terreno.
 */
export class StaticGroundLayer {
  private baked = false;

  constructor(_scene: Phaser.Scene) {}

  bake() {
    if (this.baked) return;
    // Construir matriz lógica de colisiones
    collisionMatrix.buildFromTerrain(isWaterTileFast, getMineralTypeFast as any, isTreeTile as any);
    this.baked = true;
  }

  destroy() {
    this.baked = false;
  }
}
