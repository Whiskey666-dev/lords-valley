/**
 * IsoWalls.ts — Geometría pura de muros isométricos (cero dependencias).
 *
 * Cuando un tile está más alto que su vecino este o sur, su rombo "flota":
 * hay un hueco entre su arista y el rombo bajo. El muro es el cuadrilátero
 * que une ambas aristas (extrusión vertical exacta, sin solapes ni huecos):
 * el fondo del muro coincide al píxel con la arista del vecino bajo.
 *
 * Convención: (topX, topY) = vértice norte del rombo YA con su altura
 * aplicada. HALF_W/HALF_H deben coincidir con ISO_TILE_W/H / 2 (64x32).
 * Solo las dos caras visibles (este y sur) generan muro.
 */

export const WALL_HALF_W = 32;
export const WALL_HALF_H = 16;
/** Tono de cada cara (luz este, sombra sur). */
export const EAST_SHADE = 0.75;
export const SOUTH_SHADE = 0.6;

export type IsoPoint = { x: number; y: number };

/** Cara este: arista E-S del rombo extruida hacia abajo dropPx. Orden: E, S, Sb, Eb. */
export function eastWall(topX: number, topY: number, dropPx: number): IsoPoint[] {
  return [
    { x: topX + WALL_HALF_W, y: topY + WALL_HALF_H },
    { x: topX, y: topY + 2 * WALL_HALF_H },
    { x: topX, y: topY + 2 * WALL_HALF_H + dropPx },
    { x: topX + WALL_HALF_W, y: topY + WALL_HALF_H + dropPx },
  ];
}

/** Cara sur: arista S-W del rombo extruida hacia abajo dropPx. Orden: S, W, Wb, Sb. */
export function southWall(topX: number, topY: number, dropPx: number): IsoPoint[] {
  return [
    { x: topX, y: topY + 2 * WALL_HALF_H },
    { x: topX - WALL_HALF_W, y: topY + WALL_HALF_H },
    { x: topX - WALL_HALF_W, y: topY + WALL_HALF_H + dropPx },
    { x: topX, y: topY + 2 * WALL_HALF_H + dropPx },
  ];
}



/**
 * Regla de paso entre tiles con altura: se puede subir como máximo 1 nivel.
 * Bajar/caer siempre vale (incluso a pozos profundos).
 */
export function canStepHeight(hFrom: number, hTo: number): boolean {
  return hTo - hFrom < 2;
}

/** Oscurece un hex por factor (0..1), con clamp por canal. */
export function darken(hex: number, f: number): number {
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = cl(((hex >> 16) & 0xff) * f);
  const g = cl(((hex >> 8) & 0xff) * f);
  const b = cl((hex & 0xff) * f);
  return (r << 16) | (g << 8) | b;
}
