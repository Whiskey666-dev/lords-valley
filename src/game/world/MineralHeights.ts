import { WORLD_TILES_N, getTileGid, isMineralGid, getActiveSeed, DEFAULT_WORLD_SEED } from "./WorldTiles";

function hashSeedToUint32(seed: string | number): number {
  if (typeof seed === "number") return seed >>> 0;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(x: number, y: number, seed: number): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

let activeSeed: string | null = null;
let specialMineralKey: string | null = null;
const mineralHeightsCache = new Map<string, number>();

export function ensureMineralHeights(seed?: string): void {
  const currentSeed = seed ?? getActiveSeed() ?? DEFAULT_WORLD_SEED;
  if (currentSeed === activeSeed && specialMineralKey !== null) return;

  activeSeed = currentSeed;
  mineralHeightsCache.clear();
  specialMineralKey = null;

  const seedNum = hashSeedToUint32(currentSeed);
  const rng = mulberry32(seedNum ^ 0x3a9e14f);

  // Probabilidad del 85% de que spawnee un mineral legendario de 8 clicks
  const hasSpecial = rng() < 0.85;

  if (hasSpecial) {
    const mineralList: Array<{ x: number; y: number }> = [];
    for (let ty = 0; ty < WORLD_TILES_N; ty++) {
      for (let tx = 0; tx < WORLD_TILES_N; tx++) {
        const gid = getTileGid(tx, ty);
        if (gid !== undefined && isMineralGid(gid)) {
          mineralList.push({ x: tx, y: ty });
        }
      }
    }

    if (mineralList.length > 0) {
      mineralList.sort((a, b) => a.y * WORLD_TILES_N + a.x - (b.y * WORLD_TILES_N + b.x));
      const chosenIndex = Math.floor(rng() * mineralList.length);
      const chosen = mineralList[chosenIndex];
      specialMineralKey = `${chosen.x}:${chosen.y}`;
      console.log(`[MineralHeights] Veta legendaria de 8 clicks (200 cargas) en [${chosen.x}:${chosen.y}]`);
    }
  }
}

export function getMineralHeight(tx: number, ty: number): number {
  const key = `${tx}:${ty}`;
  const cached = mineralHeightsCache.get(key);
  if (cached !== undefined) return cached;

  ensureMineralHeights();

  if (specialMineralKey && key === specialMineralKey) {
    mineralHeightsCache.set(key, 8);
    return 8;
  }

  const seedNum = hashSeedToUint32(activeSeed ?? DEFAULT_WORLD_SEED);
  const hVal = hash2D(tx, ty, seedNum ^ 0x9e3779b9);
  // Altura aleatoria entre 3 y 6 inclusive (3, 4, 5, 6)
  const height = 3 + (hVal % 4);
  mineralHeightsCache.set(key, height);
  return height;
}

export function getMineralCharges(height: number): number {
  if (height >= 8) return 200;
  if (height === 6) return 20;
  if (height === 5) return 15;
  if (height === 4) return 10;
  if (height === 3) return 5;
  return Math.max(5, (height - 2) * 5);
}

export function isSpecialMineral(tx: number, ty: number): boolean {
  ensureMineralHeights();
  return specialMineralKey === `${tx}:${ty}`;
}

export function getMineralTileInfo(tx: number, ty: number): {
  height: number;
  charges: number;
  isSpecial: boolean;
} {
  const height = getMineralHeight(tx, ty);
  const charges = getMineralCharges(height);
  const isSpecial = height >= 8;
  return { height, charges, isSpecial };
}
