import Phaser from "phaser";
import { collisionMatrix } from "../world/CollisionMatrix";
import { getTileGid } from "../world/WorldTiles";

/**
 * Capa A — Suelo Estático
 * Inicializa la matriz de colisión desde los tiles del backend.
 */
export class StaticGroundLayer {
  private baked = false;

  constructor(_scene: Phaser.Scene) {}

  bake() {
    if (this.baked) return;
    // Construir matriz lógica de colisiones (el boot precarga el mundo)
    collisionMatrix.buildFromWorldTiles(getTileGid);
    this.baked = true;
  }

  destroy() {
    this.baked = false;
  }
}
