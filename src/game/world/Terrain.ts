import { getTileGid } from "./WorldTiles";

export const WORLD_CHUNKS = 6;
export const CHUNK_PX = 1024;
export const TILE = 32;
export const CHUNK_TILES = 32;
export const WORLD_SIZE = WORLD_CHUNKS * CHUNK_PX;
export const WORLD_TILES = WORLD_SIZE / TILE; // 192
export const BASE_GREEN = 0x3a7d44;
export const TREE_BROWN = 0x8b4513;
export const WATER_DARK = 0x023e8a;

// Isométrico puro 2:1 - cada tile cuadrado es rombo 64x32
export const ISO_TILE_W = 64;
export const ISO_TILE_H = 32;
export const ISO_ORIGIN_X = (WORLD_TILES * ISO_TILE_W) / 2; // 6144
export const ISO_WORLD_WIDTH = WORLD_TILES * ISO_TILE_W; // 12288
export const ISO_WORLD_HEIGHT = WORLD_TILES * ISO_TILE_H; // 6144

export function tileToIso(tileX: number, tileY: number) {
  return {
    x: (tileX - tileY) * (ISO_TILE_W / 2) + ISO_ORIGIN_X,
    y: (tileX + tileY) * (ISO_TILE_H / 2)
  };
}
export function isoToTile(isoX: number, isoY: number) {
  // Inversa EXACTA de tileToIso, que devuelve el vértice norte del rombo.
  // Sin restar medio tile: ese -32 desplazaba el picking 1 rombo y rompía
  // la simetría con el backend (ver IsometricProjectionService).
  const u = (isoX - ISO_ORIGIN_X) / (ISO_TILE_W / 2);
  const v = isoY / (ISO_TILE_H / 2);
  const tileX = Math.floor((u + v) / 2);
  const tileY = Math.floor((v - u) / 2);
  return { tileX, tileY };
}
export function worldToIso(worldX: number, worldY: number) {
  // worldX/Y en coords cuadradas 0..6144 -> iso
  const tx = worldX / TILE;
  const ty = worldY / TILE;
  return tileToIso(tx, ty);
}
export function isoToWorld(isoX: number, isoY: number) {
  const t = isoToTile(isoX, isoY);
  return { x: t.tileX * TILE + TILE/2, y: t.tileY * TILE + TILE/2 };
}

/**
 * Crea un cuerpo físico estático (Arcade) para un tile bloqueado.
 *
 * Geometría del rombo isométrico (ISO_TILE_W=64, ISO_TILE_H=32):
 *   Vértice N  → (iso.x,        iso.y)          ← punto más alto
 *   Vértice E/O→ (iso.x ± 32,  iso.y + 16)      ← vértices laterales
 *   Vértice S  → (iso.x,        iso.y + 32)      ← punto más bajo (cara sur)
 *
 * El cuerpo (ISO_TILE_W/2 × ISO_TILE_H/2 = 32 × 16) se centra a 3/4 de la
 * altura del rombo → ocupa [iso.y+16 .. iso.y+32].  El borde sur del cuerpo
 * queda exactamente en el vértice sur visual, permitiendo que el personaje
 * toque la pared sin atravesarla.
 *
 * @param group   StaticGroup de Phaser donde se añade el cuerpo
 * @param wx      Tile world-X (columna)
 * @param wy      Tile world-Y (fila)
 * @param texture Clave de textura (puede ser invisible con setAlpha(0))
 * @returns       El objeto creado (imagen con cuerpo estático)
 */
export function addTileBody(
  group: Phaser.Physics.Arcade.StaticGroup,
  wx: number,
  wy: number,
  texture: string
): Phaser.Physics.Arcade.Image {
  const iso = tileToIso(wx, wy);
  // Centro del cuerpo físico coincidente al píxel con el centro del rombo base (iso.y + ISO_TILE_H / 2 = iso.y + 16)
  const bodyX = iso.x;
  const bodyY = iso.y + ISO_TILE_H / 2;
  const bodyW = ISO_TILE_W / 2;   // 32 px
  const bodyH = ISO_TILE_H / 2;   // 16 px

  const img = group.create(bodyX, bodyY, texture) as Phaser.Physics.Arcade.Image;
  img.setDisplaySize(bodyW, bodyH);
  img.setAlpha(0);
  if ((img as any).refreshBody) (img as any).refreshBody();
  const body = img.body as Phaser.Physics.Arcade.StaticBody;
  if (body) {
    body.setSize(bodyW, bodyH);
    body.updateFromGameObject();
  }
  return img;
}


/**
 * hash2i: hash visual determinista y sin estado para variaciones cosméticas
 * (p. ej. matices de césped en el minimapa). NO genera mundo: el terreno lo
 * sirve el backend (ver WorldTiles.ts). Rango [0, 1).
 */
export function hash2i(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// (Generación procedural de agua eliminada: el terreno lo sirve el backend — ver WorldTiles.ts)

// (Generación procedural de agua/árboles eliminada: el terreno lo sirve el backend — ver WorldTiles.ts)

// Catálogo de colores por tipo de mineral (solo visual). La GENERACIÓN
// (rareza al cuarto, vetas, determinismo por seed) vive en el backend:
// ChunkGeneratorService es la fuente única de verdad del terreno.
const MINERAL_CSS: Record<string, string> = {
  CARBON: '#1a1a1a',
  COBRE: '#b87333',
  ESTANO: '#a8a9ad',
  HIERRO: '#5a5a5a',
  PLATA: '#c0c0c0',
  ORO: '#ffd700',
};

export function getMineralCss(type: string): string {
  return MINERAL_CSS[type] ?? '#ffd700';
}

export function gidToColor(gid: number): number {
  if (gid === 102) return WATER_DARK;
  if (gid === 2) return TREE_BROWN;
  if (gid === 30) return 0xb87333; // COBRE
  if (gid === 31) return 0xa8a9ad; // ESTANO
  if (gid === 32) return 0x5a5a5a; // HIERRO
  if (gid === 33) return 0xc0c0c0; // PLATA
  if (gid === 34) return 0xffd700; // ORO
  if (gid === 35) return 0x1a1a1a; // CARBON
  return BASE_GREEN;
}

export function gidToCss(gid: number): string {
  if (gid === 102) return "#023e8a";
  if (gid === 2) return "#8b4513";
  if (gid === 30) return "#b87333";
  if (gid === 31) return "#a8a9ad";
  if (gid === 32) return "#5a5a5a";
  if (gid === 33) return "#c0c0c0";
  if (gid === 34) return "#ffd700";
  if (gid === 35) return "#1a1a1a";
  return "#3a7d44";
}

export const MINERAL_LABELS: Record<string, string> = {
  CARBON: "Carbón",
  COBRE: "Cobre",
  ESTANO: "Estaño",
  ESTAÑO: "Estaño",
  ESTE: "Estaño",
  HIERRO: "Hierro",
  PLATA: "Plata",
  ORO: "Oro",
};

export const MINERAL_DESCRIPTIONS: Record<string, string> = {
  CARBON: "Combustible básico para hornos y forja",
  COBRE: "Metal blando para herramientas y cableado",
  ESTANO: "Aleación esencial para bronce y forja",
  ESTAÑO: "Aleación esencial para bronce y forja",
  ESTE: "Aleación esencial para bronce y forja",
  HIERRO: "Metal resistente para armas y estructuras",
  PLATA: "Metal precioso, comercio y orfebrería",
  ORO: "Metal muy raro y valioso",
};

export function getMineralDisplayName(type: string): string {
  const upper = (type || "").toUpperCase().trim();
  return MINERAL_LABELS[upper] ?? MINERAL_LABELS[type] ?? (type === "ESTE" ? "Estaño" : type);
}

export function getMineralDescription(type: string): string {
  const upper = (type || "").toUpperCase().trim();
  return MINERAL_DESCRIPTIONS[upper] ?? MINERAL_DESCRIPTIONS[type] ?? "Veta mineral";
}

export function isBlockedTile(worldTileX: number, worldTileY: number): boolean {
  // Terreno del backend (fuente única). Sin datos aún: fail-open (el boot precarga el mundo).
  if (worldTileX < 0 || worldTileY < 0 || worldTileX >= WORLD_TILES || worldTileY >= WORLD_TILES) return true;
  const gid = getTileGid(worldTileX, worldTileY);
  if (gid === undefined) return false;
  return gid === 102 || (gid >= 30 && gid <= 35);
}

export function isBlockedWorldXY(worldX: number, worldY: number): boolean {
  const tx = Math.floor(worldX / TILE);
  const ty = Math.floor(worldY / TILE);
  if (tx < 0 || tx >= WORLD_TILES || ty < 0 || ty >= WORLD_TILES) return true;
  return isBlockedTile(tx, ty);
}
export function isBlockedIsoWorldXY(isoX: number, isoY: number): boolean {
  const { tileX, tileY } = isoToTile(isoX, isoY);
  if (tileX < 0 || tileX >= WORLD_TILES || tileY < 0 || tileY >= WORLD_TILES) return true;
  return isBlockedTile(tileX, tileY);
}
export function findNearestSafeIsoPos(isoX: number, isoY: number, maxRadiusTiles = 12): { x: number; y: number } | null {
  const { tileX, tileY } = isoToTile(isoX, isoY);
  if (!isBlockedTile(tileX, tileY)) return { x: isoX, y: isoY };
  for (let r = 1; r <= maxRadiusTiles; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = tileX + dx, ty = tileY + dy;
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) continue;
        if (!isBlockedTile(tx, ty)) {
          const p = tileToIso(tx, ty);
          // centro del rombo = vértice norte + medio alto
          return { x: p.x, y: p.y + ISO_TILE_H/2 };
        }
      }
    }
  }
  return null;
}

export function findNearestSafeWorldPos(worldX: number, worldY: number, maxRadiusTiles = 12): { x: number; y: number } | null {
  const originTx = Math.floor(worldX / TILE);
  const originTy = Math.floor(worldY / TILE);
  if (!isBlockedTile(originTx, originTy)) return { x: worldX, y: worldY };
  for (let r = 1; r <= maxRadiusTiles; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // solo borde del cuadrado
        const tx = originTx + dx;
        const ty = originTy + dy;
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) continue;
        if (!isBlockedTile(tx, ty)) {
          return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
        }
      }
    }
  }
  return null;
}
