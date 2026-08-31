export const WORLD_CHUNKS = 6;
export const CHUNK_PX = 1024;
export const TILE = 32;
export const CHUNK_TILES = 32;
export const WORLD_SIZE = WORLD_CHUNKS * CHUNK_PX;
export const WORLD_TILES = WORLD_SIZE / TILE; // 192
export const BASE_GREEN = 0x3a7d44;
export const TREE_BROWN = 0x8b4513;
export const WATER_DARK = 0x023e8a;
export const MINERAL_YELLOW = 0xffd700;

export function noise(cx: number, cy: number, x: number, y: number, seed = 1337): number {
  const s = Math.sin(cx * 374761 + cy * 668265261 + x * 1274126177 + y * 15485863 + seed * 961748941) * 10000;
  return s - Math.floor(s);
}

// --- Agua a nivel de TILE pequeño (32px, tamaño personaje) ---
// Ancho río 5-15 tiles, serpenteante, contiguo, a veces lago o sin agua
let cachedWaterTiles: Set<string> | null = null;
let cachedWaterType: 'none' | 'river' | 'lake' = 'river';

function generateWaterTiles(): Set<string> {
  if (cachedWaterTiles) return cachedWaterTiles;
  const W = WORLD_TILES; // 192
  const water = new Set<string>();

  const roll = Math.random();
  if (roll < 0.15) {
    cachedWaterType = 'none';
    cachedWaterTiles = water;
    return water;
  } else if (roll < 0.75) {
    cachedWaterType = 'river';
  } else {
    cachedWaterType = 'lake';
  }

  if (cachedWaterType === 'lake') {
    // Lago: blob irregular 5-15 tiles de ancho (diámetro), contiguo
    const radius = 5 + Math.floor(Math.random() * 11); // 5-15 tiles de radio => diámetro 10-30
    const cx = 30 + Math.floor(Math.random() * (W - 60));
    const cy = 30 + Math.floor(Math.random() * (W - 60));
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const edgeNoise = (Math.random() - 0.5) * 4;
        if (dist < radius + edgeNoise) water.add(`${x}:${y}`);
      }
    }
    // Asegura contigüidad: ya es disco, contiguo
    cachedWaterTiles = water;
    return water;
  }

  // Río serpenteante de ancho 5-15 tiles, cruza de extremo a extremo
  const horizontal = Math.random() < 0.6;
  // Ancho inicial 5-15, variará ±1 por segmento
  let width = 5 + Math.floor(Math.random() * 11); // 5-15
  const centerline: [number, number][] = [];

  if (horizontal) {
    let x = 0;
    let y = 60 + Math.floor(Math.random() * 72); // 60-132 evita borde exacto
    centerline.push([x, y]);
    while (x < W - 1) {
      const r = Math.random();
      // Meandro: 50% este, 25% norte, 25% sur
      if (r < 0.5 && x < W - 1) x += 1;
      else if (r < 0.75) y = Math.max(2, Math.min(W - 3, y + 1));
      else y = Math.max(2, Math.min(W - 3, y - 1));
      centerline.push([x, y]);
      // Variación de ancho ±1
      if (Math.random() < 0.25) {
        width = Math.max(5, Math.min(15, width + (Math.random() < 0.5 ? 1 : -1)));
      }
      if (x === W - 1) break;
    }
    // Expande ancho perpendicular (vertical)
    for (const [cx, cy] of centerline) {
      const w = Math.max(5, Math.min(15, width + Math.floor((Math.random() - 0.5) * 2)));
      const h = Math.floor(w / 2);
      for (let dy = -h; dy <= h; dy++) {
        const ny = cy + dy;
        if (ny >= 0 && ny < W) water.add(`${cx}:${ny}`);
      }
      // Añade irregularidad de borde: 20% de tiles extra adyacentes
      if (Math.random() < 0.2) {
        const ny = cy + (Math.random() < 0.5 ? h + 1 : -h - 1);
        if (ny >= 0 && ny < W) water.add(`${cx}:${ny}`);
      }
    }
  } else {
    let x = 60 + Math.floor(Math.random() * 72);
    let y = 0;
    centerline.push([x, y]);
    while (y < W - 1) {
      const r = Math.random();
      if (r < 0.5 && y < W - 1) y += 1;
      else if (r < 0.75) x = Math.max(2, Math.min(W - 3, x + 1));
      else x = Math.max(2, Math.min(W - 3, x - 1));
      centerline.push([x, y]);
      if (Math.random() < 0.25) {
        width = Math.max(5, Math.min(15, width + (Math.random() < 0.5 ? 1 : -1)));
      }
      if (y === W - 1) break;
    }
    for (const [cx, cy] of centerline) {
      const w = Math.max(5, Math.min(15, width + Math.floor((Math.random() - 0.5) * 2)));
      const h = Math.floor(w / 2);
      for (let dx = -h; dx <= h; dx++) {
        const nx = cx + dx;
        if (nx >= 0 && nx < W) water.add(`${nx}:${cy}`);
      }
      if (Math.random() < 0.2) {
        const nx = cx + (Math.random() < 0.5 ? h + 1 : -h - 1);
        if (nx >= 0 && nx < W) water.add(`${nx}:${cy}`);
      }
    }
  }

  // Asegura que no haya tiles aislados: el método ya garantiza contigüidad por expand perpendicular
  // Si por alguna razón quedó <5 tiles de ancho en algún segmento, ya está dentro de 5-15

  cachedWaterTiles = water;
  return water;
}

export function getWaterTiles(): Set<string> {
  return generateWaterTiles();
}

export function getWaterType(): 'none' | 'river' | 'lake' {
  generateWaterTiles();
  return cachedWaterType;
}

// Compatibilidad: chunks azules ahora son a nivel tile, pero mantenemos helpers chunk-level
export function getWaterChunks(): Set<string> {
  const tiles = getWaterTiles();
  const chunks = new Set<string>();
  for (const key of tiles) {
    const [wx, wy] = key.split(':').map(Number);
    const cx = Math.floor(wx / CHUNK_TILES);
    const cy = Math.floor(wy / CHUNK_TILES);
    chunks.add(`${cx}:${cy}`);
  }
  return chunks;
}

export function getRiverChunks(): Set<string> {
  return getWaterChunks();
}

export function isWaterTile(worldTileX: number, worldTileY: number): boolean {
  return getWaterTiles().has(`${worldTileX}:${worldTileY}`);
}

export function isWaterChunk(chunkX: number, chunkY: number): boolean {
  return getWaterChunks().has(`${chunkX}:${chunkY}`);
}

export function isRiverChunk(chunkX: number, chunkY: number): boolean {
  return isWaterChunk(chunkX, chunkY);
}

export function getTreeDensity(chunkX: number, chunkY: number): number {
  return 0.23 + noise(chunkX, chunkY, 555, 555) * 0.47;
}

export function isTreeTile(chunkX: number, chunkY: number, localX: number, localY: number): boolean {
  const worldX = chunkX * CHUNK_TILES + localX;
  const worldY = chunkY * CHUNK_TILES + localY;
  if (isWaterTile(worldX, worldY)) return false;
  if (isMineralTile(worldX, worldY)) return false;
  const density = getTreeDensity(chunkX, chunkY);
  return noise(chunkX, chunkY, localX, localY) < density;
}

// --- Minerales en vetas con rareza y límites ---
export const MINERAL_CONFIGS = [
  { type: 'CARBON' as const, gid: 35, color: 0x1a1a1a, css: '#1a1a1a', rarity: 0.25, veinMin: 8, veinMax: 15 },
  { type: 'COBRE' as const, gid: 30, color: 0xb87333, css: '#b87333', rarity: 0.20, veinMin: 6, veinMax: 12 },
  { type: 'ESTANO' as const, gid: 31, color: 0xa8a9ad, css: '#a8a9ad', rarity: 0.18, veinMin: 6, veinMax: 12 },
  { type: 'HIERRO' as const, gid: 32, color: 0x5a5a5a, css: '#5a5a5a', rarity: 0.15, veinMin: 5, veinMax: 10 },
  { type: 'PLATA' as const, gid: 33, color: 0xc0c0c0, css: '#c0c0c0', rarity: 0.05, veinMin: 3, veinMax: 7 },
  { type: 'ORO' as const, gid: 34, color: 0xffd700, css: '#ffd700', rarity: 0.02, veinMin: 2, veinMax: 5 },
];

let cachedMineralTiles: Map<string, string> | null = null;

function generateMineralTiles(): Map<string, string> {
  if (cachedMineralTiles) return cachedMineralTiles;
  const W = WORLD_TILES;
  const totalTiles = W * W;
  const mineralMap = new Map<string, string>();
  const occupied = new Set<string>(getWaterTiles()); // no spawnear donde hay agua

  // Genera por tipo: rarity es límite máximo relativo a total de cuadros pequeños (escalado 0.18 para que 85% nominal sea ~15% real y el mapa siga jugable)
  const MINERAL_SCALE = 0.18;
  for (const cfg of MINERAL_CONFIGS) {
    const targetTiles = Math.floor(totalTiles * cfg.rarity * MINERAL_SCALE);
    // Limita agua ya ocupada: si target excede tierra disponible, recorta
    let placed = 0;
    let attempts = 0;
    while (placed < targetTiles && attempts < targetTiles * 3) {
      attempts++;
      // Tamaño veta variable
      const veinSize = cfg.veinMin + Math.floor(Math.random() * (cfg.veinMax - cfg.veinMin + 1));
      // Centro aleatorio no en agua y no ocupado
      let cx: number, cy: number, tries = 0;
      do {
        cx = Math.floor(Math.random() * W);
        cy = Math.floor(Math.random() * W);
        tries++;
      } while ((occupied.has(`${cx}:${cy}`) || isWaterTile(cx, cy)) && tries < 20);
      if (occupied.has(`${cx}:${cy}`) || isWaterTile(cx, cy)) continue;

      // Crece veta contigua
      const vein = new Set<string>();
      vein.add(`${cx}:${cy}`);
      let veinAttempts = 0;
      while (vein.size < veinSize && veinAttempts < veinSize * 5) {
        const arr = Array.from(vein);
        const [rx, ry] = arr[Math.floor(Math.random() * arr.length)].split(':').map(Number);
        const dirs: [number, number][] = [[1,0],[-1,0],[0,1],[0,-1]];
        const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
        const nx = rx + dx, ny = ry + dy;
        const key = `${nx}:${ny}`;
        if (nx < 0 || nx >= W || ny < 0 || ny >= W) { veinAttempts++; continue; }
        if (occupied.has(key) || isWaterTile(nx, ny) || mineralMap.has(key)) { veinAttempts++; continue; }
        vein.add(key);
        veinAttempts = 0;
      }
      // Añade veta al mapa
      for (const k of vein) {
        if (placed >= targetTiles) break;
        if (!occupied.has(k) && !isWaterTile(parseInt(k.split(':')[0]), parseInt(k.split(':')[1]))) {
          mineralMap.set(k, cfg.type);
          occupied.add(k);
          placed++;
        }
      }
    }
  }
  cachedMineralTiles = mineralMap;
  return mineralMap;
}

export function getMineralTiles(): Map<string, string> {
  return generateMineralTiles();
}

export function getMineralType(worldTileX: number, worldTileY: number): string | null {
  return getMineralTiles().get(`${worldTileX}:${worldTileY}`) ?? null;
}

export function isMineralTile(worldTileX: number, worldTileY: number): boolean {
  return getMineralTiles().has(`${worldTileX}:${worldTileY}`);
}

export function getMineralColor(type: string): number {
  const cfg = MINERAL_CONFIGS.find(c => c.type === type);
  return cfg ? cfg.color : MINERAL_YELLOW;
}

export function getMineralCss(type: string): string {
  const cfg = MINERAL_CONFIGS.find(c => c.type === type);
  return cfg ? cfg.css : '#ffd700';
}

export function isTreeTileFixed(chunkX: number, chunkY: number, localX: number, localY: number): boolean {
  return isTreeTile(chunkX, chunkY, localX, localY);
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
  HIERRO: "Hierro",
  PLATA: "Plata",
  ORO: "Oro",
};

export const MINERAL_DESCRIPTIONS: Record<string, string> = {
  CARBON: "Combustible básico para hornos y forja",
  COBRE: "Metal blando para herramientas y cableado",
  ESTANO: "Aleación esencial para bronce",
  HIERRO: "Metal resistente para armas y estructuras",
  PLATA: "Metal precioso, comercio y orfebrería",
  ORO: "Metal muy raro y valioso",
};

export function getMineralDisplayName(type: string): string {
  return MINERAL_LABELS[type] ?? type;
}

export function getMineralDescription(type: string): string {
  return MINERAL_DESCRIPTIONS[type] ?? "Veta mineral";
}

export function isBlockedTile(worldTileX: number, worldTileY: number): boolean {
  return isMineralTile(worldTileX, worldTileY) || isWaterTile(worldTileX, worldTileY);
}

export function isBlockedWorldXY(worldX: number, worldY: number): boolean {
  const tx = Math.floor(worldX / TILE);
  const ty = Math.floor(worldY / TILE);
  if (tx < 0 || tx >= WORLD_TILES || ty < 0 || ty >= WORLD_TILES) return true;
  return isBlockedTile(tx, ty);
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
