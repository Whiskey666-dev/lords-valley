import { WORLD_TILES, isoToTile } from "./Terrain";

/**
 * Capa lógica de colisión — matriz 192x192 de 0 libre / 1 ocupado.
 * Sin físicas Arcade para el mapa. O(1) por consulta.
 */
export class CollisionMatrix {
  static readonly W = WORLD_TILES; // 192
  static readonly H = WORLD_TILES;
  private data: Uint8Array;

  constructor() {
    this.data = new Uint8Array(CollisionMatrix.W * CollisionMatrix.H);
  }

  clear() {
    this.data.fill(0);
  }

  private idx(tx: number, ty: number): number {
    return ty * CollisionMatrix.W + tx;
  }

  isBlockedTile(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= CollisionMatrix.W || ty >= CollisionMatrix.H) return true;
    return this.data[this.idx(tx, ty)] === 1;
  }

  setBlocked(tx: number, ty: number, blocked = true) {
    if (tx < 0 || ty < 0 || tx >= CollisionMatrix.W || ty >= CollisionMatrix.H) return;
    this.data[this.idx(tx, ty)] = blocked ? 1 : 0;
  }

  isBlockedIso(isoX: number, isoY: number): boolean {
    const { tileX, tileY } = isoToTile(isoX, isoY);
    return this.isBlockedTile(tileX, tileY);
  }

  /**
   * Hitbox de contacto centrada exactamente en los pies del personaje (elipse isométrica 2:1).
   * Chequea la elipse de contacto simétrica en todas las caras (N, S, E, O).
   */
  isBodyBlockedAt(isoX: number, isoY: number): boolean {
    return (
      this.isBlockedIso(isoX, isoY) ||
      this.isBlockedIso(isoX - 6, isoY) ||
      this.isBlockedIso(isoX + 6, isoY) ||
      this.isBlockedIso(isoX, isoY - 3) ||
      this.isBlockedIso(isoX, isoY + 3)
    );
  }

  /**
   * Rellena la matriz desde los tiles del BACKEND (fuente única).
   * Solo el agua y los minerales son obstáculos sólidos intransitables.
   * Tiles aún no cargados se consideran libres (el boot precarga el mundo).
   */
  buildFromWorldTiles(getGid: (tx: number, ty: number) => number | undefined): void {
    this.clear();
    for (let ty = 0; ty < CollisionMatrix.H; ty++) {
      for (let tx = 0; tx < CollisionMatrix.W; tx++) {
        const gid = getGid(tx, ty);
        if (gid !== undefined && (gid === 102 || (gid >= 30 && gid <= 35))) {
          this.data[this.idx(tx, ty)] = 1;
        }
      }
    }
  }

  occupyRect(tileX: number, tileY: number, w: number, h: number) {
    for (let y = tileY; y < tileY + h; y++) {
      for (let x = tileX; x < tileX + w; x++) {
        this.setBlocked(x, y, true);
      }
    }
  }

  freeRect(tileX: number, tileY: number, w: number, h: number) {
    for (let y = tileY; y < tileY + h; y++) {
      for (let x = tileX; x < tileX + w; x++) {
        this.setBlocked(x, y, false);
      }
    }
  }

  toArray(): number[][] {
    const out: number[][] = [];
    for (let y = 0; y < CollisionMatrix.H; y++) {
      const row: number[] = [];
      for (let x = 0; x < CollisionMatrix.W; x++) row.push(this.data[this.idx(x, y)]);
      out.push(row);
    }
    return out;
  }
}

export const collisionMatrix = new CollisionMatrix();
