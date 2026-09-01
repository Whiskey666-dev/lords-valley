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
   * Hitbox exacta de contacto en los pies del personaje (sprite 48x64 centrado, centro de pies en Y + 14).
   * Chequea la elipse de contacto simétrica en todas las caras (N, S, E, O, NE, NO, SE, SO).
   */
  isBodyBlockedAt(isoX: number, isoY: number): boolean {
    const feetY = isoY + 14;
    return (
      this.isBlockedIso(isoX, feetY) ||
      this.isBlockedIso(isoX - 6, feetY) ||
      this.isBlockedIso(isoX + 6, feetY) ||
      this.isBlockedIso(isoX, feetY - 4) ||
      this.isBlockedIso(isoX, feetY + 4)
    );
  }

  /**
   * Rellena la matriz desde Terrain procedimental.
   * Solo el agua y los minerales son obstáculos sólidos intransitables.
   */
  buildFromTerrain(
    isWaterTileFast: (x: number, y: number) => boolean,
    isMineralTileFast: (x: number, y: number) => boolean,
    _isTreeTile?: (cx: number, cy: number, lx: number, ly: number) => boolean
  ) {
    this.clear();
    for (let ty = 0; ty < CollisionMatrix.H; ty++) {
      for (let tx = 0; tx < CollisionMatrix.W; tx++) {
        if (isWaterTileFast(tx, ty) || isMineralTileFast(tx, ty)) {
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
