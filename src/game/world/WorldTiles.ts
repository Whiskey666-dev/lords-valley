import { fetchChunk, fetchChunksBulk } from "../../app/api/settlement.api";
import { useGameStore } from "../../app/store/useGameStore";

/**
 * WorldTiles.ts — Fuente única de verdad del terreno en el cliente.
 *
 * Los tiles (agua/mineral/árbol/césped) los genera el BACKEND de forma
 * determinista por seed y este módulo los cachea desde el store.
 * La generación procedural local (Terrain.ts) quedó eliminada: si el dato
 * no está cargado, se devuelve undefined y el sistema reintenta (nunca se
 * inventa terreno).
 */

export const WORLD_CHUNKS_N = 6;
export const CHUNK_TILES_N = 32;
export const WORLD_TILES_N = WORLD_CHUNKS_N * CHUNK_TILES_N; // 192
export const DEFAULT_WORLD_SEED = "default_seed";

// GIDs canónicos del backend (ChunkGeneratorService)
export const GID_GRASS = 1;
export const GID_TREE = 2;
export const GID_WATER = 102;
export const GID_MIN_MINERAL = 30;
export const GID_MAX_MINERAL = 35;

let activeSeed: string | null = null;
let ensuredForSeed: string | null = null;

/** Fija el mundo activo; al cambiar de seed limpia los chunks cacheados. */
export function setActiveSeed(seed: string | null | undefined): string {
  const s = seed && seed.trim() ? seed.trim() : DEFAULT_WORLD_SEED;
  if (s !== activeSeed) {
    activeSeed = s;
    ensuredForSeed = null;
    try {
      useGameStore.setState({ chunks: new Map() });
    } catch {
      /* store aún no listo: se limpiará en ensure */
    }
  }
  return activeSeed;
}

export function getActiveSeed(): string {
  return activeSeed ?? DEFAULT_WORLD_SEED;
}

/** Precarga los 36 chunks del mundo (1 sola llamada bulk). Idempotente por seed. */
export async function ensureWorldTiles(seed?: string): Promise<void> {
  const s = seed ?? activeSeed ?? DEFAULT_WORLD_SEED;
  setActiveSeed(s);
  const state = useGameStore.getState();
  const missing: Array<{ x: number; y: number }> = [];
  for (let cy = 0; cy < WORLD_CHUNKS_N; cy++) {
    for (let cx = 0; cx < WORLD_CHUNKS_N; cx++) {
      if (!state.chunks.has(`${cx}:${cy}`)) missing.push({ x: cx, y: cy });
    }
  }
  if (missing.length === 0) {
    ensuredForSeed = s;
    return;
  }
  const rows: any[] = await fetchChunksBulk(missing, s);
  const st = useGameStore.getState();
  for (const c of rows ?? []) {
    if (c && typeof c.chunkX === "number") st.setChunk(c);
  }
  ensuredForSeed = s;
}

export function isWorldReady(): boolean {
  return ensuredForSeed != null;
}

/** Carga perezosa de un chunk con la seed activa (rellena huecos al explorar). */
export async function fetchSingleChunk(cx: number, cy: number): Promise<any> {
  const c = await fetchChunk(cx, cy, getActiveSeed());
  useGameStore.getState().setChunk(c);
  return c;
}

/** Matriz tiles[32][32] row-major ([localY][localX]) del chunk, si está cargado. */
export function getChunkTiles(cx: number, cy: number): number[][] | undefined {
  const c = useGameStore.getState().chunks.get(`${cx}:${cy}`);
  const t = c?.tiles;
  return Array.isArray(t) ? (t as number[][]) : undefined;
}

/** GID del tile global, o undefined si su chunk aún no cargó. */
export function getTileGid(tx: number, ty: number): number | undefined {
  if (tx < 0 || ty < 0 || tx >= WORLD_TILES_N || ty >= WORLD_TILES_N) return undefined;
  const tiles = getChunkTiles(Math.floor(tx / CHUNK_TILES_N), Math.floor(ty / CHUNK_TILES_N));
  return tiles?.[ty % CHUNK_TILES_N]?.[tx % CHUNK_TILES_N];
}

export function isWaterGid(gid: number): boolean {
  return gid === GID_WATER;
}

export function isMineralGid(gid: number): boolean {
  return gid >= GID_MIN_MINERAL && gid <= GID_MAX_MINERAL;
}

export function isTreeGid(gid: number): boolean {
  return gid === GID_TREE;
}

/** Solo agua y mineral bloquean (los árboles no, igual que antes). */
export function isBlockedGid(gid: number): boolean {
  return gid === GID_WATER || (gid >= GID_MIN_MINERAL && gid <= GID_MAX_MINERAL);
}

/** Bloqueo por tile global. Sin datos => false (fail-open, el mundo carga). */
export function isBlockedTile(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= WORLD_TILES_N || ty >= WORLD_TILES_N) return true;
  const gid = getTileGid(tx, ty);
  if (gid === undefined) return false;
  return isBlockedGid(gid);
}
