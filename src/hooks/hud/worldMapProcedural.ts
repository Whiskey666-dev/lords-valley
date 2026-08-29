// ─── Dimensiones del mundo ───────────────────────────────────────────────────
export const WORLD_W = 256; // Sectores de ancho del mapa mundial
export const WORLD_H = 200; // Sectores de alto
export const GAME_SIZE = 6144; // Unidades de juego por lado de sector
export const SECTOR_X = 128; // Sector activo (Valle de Jasper) en X del grid mundial
export const SECTOR_Y = 102; // Sector activo en Y

// ─── Noise con semilla ──────────────────────────────────────────────────────
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + smoothstep(t) * (b - a);
}

function hashN(x: number, y: number, s: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.3) * 43758.5453;
  return v - Math.floor(v);
}

function n2(x: number, y: number, s: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  return lerp(
    lerp(hashN(xi, yi, s), hashN(xi + 1, yi, s), xf),
    lerp(hashN(xi, yi + 1, s), hashN(xi + 1, yi + 1, s), xf),
    yf
  );
}

function fbm(x: number, y: number, s: number, oct = 4): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += n2(x * f, y * f, s + i * 53.7) * a;
    a *= 0.5;
    f *= 2;
  }
  return v;
}

// ─── Altura en el mapa (0–1) con Domain-Warping ─────────────────────────────
export function getHeight(nx: number, ny: number, S: number): number {
  const wx = nx + fbm(nx * 2.1, ny * 2.1, S, 3) * 0.27;
  const wy = ny + fbm(nx * 2.1 + 5.2, ny * 2.1 + 1.7, S + 100, 3) * 0.27;

  const cx = 0.44 + n2(1, 1, S) * 0.13;
  const cy = 0.50 + n2(2, 1, S) * 0.10;
  const rx = 0.29 + n2(3, 1, S) * 0.07;
  const ry = 0.23 + n2(4, 1, S) * 0.05;
  const rot = (n2(5, 1, S) - 0.5) * 1.0;

  const dx = wx - cx, dy = wy - cy;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const rdx = dx * cr + dy * sr;
  const rdy = -dx * sr + dy * cr;
  const blob1 = 1 - Math.sqrt((rdx / rx) ** 2 + (rdy / ry) ** 2);

  const p2x = cx + (n2(6, 1, S) - 0.3) * 0.30;
  const p2y = cy + (n2(7, 1, S) - 0.3) * 0.26;
  const blob2 = 0.72 - Math.sqrt(((wx - p2x) / 0.19) ** 2 + ((wy - p2y) / 0.14) ** 2);

  const p3x = cx + (n2(8, 1, S) - 0.5) * 0.34;
  const p3y = cy + (n2(9, 1, S) - 0.5) * 0.24;
  const blob3 = 0.56 - Math.sqrt(((wx - p3x) / 0.14) ** 2 + ((wy - p3y) / 0.11) ** 2);

  const land = Math.max(blob1 * 1.1, blob2 * 0.9, blob3 * 0.85);
  const terrain = fbm(nx * 3.6, ny * 3.6, S + 500, 5);

  let hv: number;
  if (land > 0) {
    hv = 0.43 + (land * 0.35 + terrain * 0.65) * 0.57;
  } else {
    hv = 0.38 + land * 0.30;
  }

  for (let i = 0; i < 7; i++) {
    const ix = n2(i * 2.1, 0.5, S + 300 + i * 17);
    const iy = n2(0.5, i * 2.3, S + 300 + i * 17);
    const ir = 0.013 + n2(i, i + 1, S + 400) * 0.025;
    const d = Math.hypot(nx - ix, ny - iy);
    if (d < ir * 1.5) hv = Math.max(hv, 0.43 + (1 - d / (ir * 1.5)) * 0.14);
  }

  return Math.max(0, Math.min(1, hv));
}

// ─── Paleta topográfica pixelada en escalones ───────────────────────────────
export function topoColor(hv: number): [number, number, number] {
  if (hv < 0.20) return [4, 12, 44];
  if (hv < 0.26) return [7, 20, 62];
  if (hv < 0.31) return [11, 28, 82];
  if (hv < 0.36) return [15, 38, 102];
  if (hv < 0.40) return [19, 50, 122];
  if (hv < 0.42) return [24, 60, 140];
  if (hv < 0.44) return [185, 162, 94];
  if (hv < 0.47) return [164, 185, 83];
  if (hv < 0.50) return [136, 168, 69];
  if (hv < 0.53) return [112, 150, 57];
  if (hv < 0.56) return [90, 130, 47];
  if (hv < 0.59) return [72, 115, 39];
  if (hv < 0.62) return [57, 100, 32];
  if (hv < 0.65) return [47, 85, 28];
  if (hv < 0.68) return [105, 95, 70];
  if (hv < 0.72) return [132, 115, 86];
  if (hv < 0.76) return [156, 140, 106];
  if (hv < 0.80) return [178, 164, 130];
  if (hv < 0.86) return [200, 192, 162];
  if (hv < 0.92) return [214, 210, 190];
  return [228, 233, 240];
}

// ─── Genera ImageData del mapa mundial completo ─────────────────────────────
export function generateMap(seed: number): ImageData {
  const data = new Uint8ClampedArray(WORLD_W * WORLD_H * 4);
  for (let py = 0; py < WORLD_H; py++) {
    for (let px = 0; px < WORLD_W; px++) {
      const [r, g, b] = topoColor(getHeight(px / WORLD_W, py / WORLD_H, seed));
      const i = (py * WORLD_W + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, WORLD_W, WORLD_H);
}

// ─── Etiquetas de regiones ───────────────────────────────────────────────────
export interface WorldRegion {
  name: string;
  nx: number;
  ny: number;
  title: boolean;
  major: boolean;
}

export const WORLD_REGIONS: WorldRegion[] = [
  { name: 'CONTINENTE DE ALDORIA', nx: 0.50, ny: 0.07, title: true,  major: true  },
  { name: 'Tundra de Vael',        nx: 0.50, ny: 0.14, title: false, major: true  },
  { name: 'Bosques del Norte',     nx: 0.27, ny: 0.25, title: false, major: true  },
  { name: 'Picos del Este',        nx: 0.78, ny: 0.22, title: false, major: true  },
  { name: 'Bosques de Eldara',     nx: 0.19, ny: 0.49, title: false, major: true  },
  { name: 'Montañas de Krath',     nx: 0.82, ny: 0.43, title: false, major: true  },
  { name: 'Pantanos de Murk',      nx: 0.74, ny: 0.73, title: false, major: false },
  { name: 'Desierto de Solara',    nx: 0.50, ny: 0.85, title: false, major: true  },
  { name: 'Costas de Ámbar',       nx: 0.09, ny: 0.56, title: false, major: false },
];
