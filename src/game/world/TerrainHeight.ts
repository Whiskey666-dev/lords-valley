import { WORLD_TILES } from "./Terrain";

/**
 * TerrainHeight.ts — Alturas del terreno por tile isométrico (192x192)
 * Cada tile tiene un nivel entero que modifica desnivel visual y efecto.
 * Excavar: -1 por aplicación, Aumentar: +1, clamp [-8, +8]
 * Persistencia localStorage + eventos para ChunkRenderer / TerrainEditSystem
 */

export const HEIGHT_MIN = -8;
export const HEIGHT_MAX = 8;
export const HEIGHT_STEP_PX = 6; // desplazamiento vertical por nivel en isométrico

const STORAGE_BASE = "lords_valley_terrain_heights";
const LEGACY_KEY = "lords_valley_terrain_heights_v1";

class TerrainHeightManager {
  private data: Int8Array;
  private listeners: Set<() => void> = new Set();
  private activeSettlementId: string | null = null;

  constructor() {
    this.data = new Int8Array(WORLD_TILES * WORLD_TILES);
    // intentar cargar con settlementId actual de localStorage
    const sid = localStorage.getItem("settlementId");
    this.activeSettlementId = sid;
    this.load();
    // escuchar cambios de settlementId via storage event (cross-tab)
    window.addEventListener("storage", (e) => {
      if (e.key === "settlementId") {
        this.setActiveSettlementId(e.newValue);
      }
    });
  }

  private storageKey(): string {
    if (this.activeSettlementId) return `${STORAGE_BASE}_${this.activeSettlementId}`;
    return LEGACY_KEY;
  }

  // Cambia de mundo/partida: limpia datos actuales y carga los del nuevo id
  setActiveSettlementId(id: string | null): void {
    const newId = id && id.trim() ? id.trim() : null;
    if (newId === this.activeSettlementId) return;
    this.activeSettlementId = newId;
    this.data.fill(0);
    this.load();
    // notificar a ChunkRenderer que todo el mundo cambió
    this.notify(new Set(Array.from({ length: 36 }, (_, i) => `${i % 6}:${Math.floor(i / 6)}`)), []);
    console.log(`[TerrainHeight] switched to settlement ${newId || "legacy"} heights=${this.countNonZero()}`);
  }

  getActiveSettlementId(): string | null {
    return this.activeSettlementId;
  }

  private idx(tx: number, ty: number): number {
    return ty * WORLD_TILES + tx;
  }

  private load(): void {
    try {
      const key = this.storageKey();
      const raw = localStorage.getItem(key);
      if (!raw) {
        // fallback: si es per-settlement y no hay datos, intentar migrar desde legacy si es primer mundo
        if (this.activeSettlementId) {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            // no migrar automáticamente para no contaminar nuevo mundo; dejar vacío
          }
        }
        return;
      }
      const arr: number[] = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length !== WORLD_TILES * WORLD_TILES) return;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (typeof v === "number" && v >= HEIGHT_MIN && v <= HEIGHT_MAX) this.data[i] = v;
      }
    } catch (e) {
      console.warn("[TerrainHeight] load error", e);
    }
  }

  private save(): void {
    try {
      const key = this.storageKey();
      localStorage.setItem(key, JSON.stringify(Array.from(this.data)));
      // también intentar persistir en backend worldState de forma debounced (no bloqueante)
      this.saveToBackendDebounced();
    } catch {}
  }

  // Guardado en backend (worldState) debounced para no saturar
  private saveDebounceTimer: number | null = null;
  private saveToBackendDebounced(): void {
    if (!this.activeSettlementId) return;
    if (this.saveDebounceTimer) window.clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = window.setTimeout(() => {
      this.saveToBackend();
    }, 1500);
  }

  private async saveToBackend(): Promise<void> {
    const sid = this.activeSettlementId;
    if (!sid) return;
    try {
      // solo si hay algo que guardar, enviar como parte de worldState
      // usamos dynamic import para evitar ciclo
      const { api } = await import("../../app/api/client");
      // Obtener worldState actual del settlement y mergear solo heights
      // Para no sobreescribir farmPlots, primero fetch y luego patch
      const { fetchSettlement } = await import("../../app/api/settlement.api");
      const settlement: any = await fetchSettlement(sid).catch(() => null);
      const prevState = settlement?.worldState || {};
      const newState = { ...prevState, terrainHeights: Array.from(this.data) };
      await api.patch(`/settlements/${sid}/world-state`, { worldState: newState }).catch(() => {});
    } catch {}
  }

  // Cargar desde backend worldState (si existe) y sobrescribir local
  async loadFromBackend(): Promise<void> {
    const sid = this.activeSettlementId;
    if (!sid) return;
    try {
      const { fetchSettlement } = await import("../../app/api/settlement.api");
      const settlement: any = await fetchSettlement(sid);
      const heights = settlement?.worldState?.terrainHeights;
      if (Array.isArray(heights) && heights.length === WORLD_TILES * WORLD_TILES) {
        this.importArray(heights);
      }
    } catch {}
  }

  private notify(changedChunks: Set<string>, affectedTiles: Array<{ x: number; y: number; h: number }>): void {
    this.listeners.forEach((cb) => cb());
    window.dispatchEvent(new CustomEvent("terrain-height-changed", { detail: { changedChunks, affectedTiles } }));
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  getHeight(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) return 0;
    return this.data[this.idx(tx, ty)];
  }

  setHeight(tx: number, ty: number, h: number): boolean {
    if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) return false;
    const clamped = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, Math.round(h)));
    const i = this.idx(tx, ty);
    if (this.data[i] === clamped) return false;
    this.data[i] = clamped;
    const changedChunks = new Set<string>([`${Math.floor(tx / 32)}:${Math.floor(ty / 32)}`]);
    this.save();
    this.notify(changedChunks, [{ x: tx, y: ty, h: clamped }]);
    return true;
  }

  /**
   * Retorna lista de tiles afectados por pincel centrado en (cx,cy) con tamaño brushSize 1..5
   * brushSize 1 => 1 tile, 2=>3x3=9, 3=>5x5=25, 4=>7x7=49, 5=>9x9=81 (cuadrado simétrico)
   */
  getBrushTiles(cx: number, cy: number, brushSize: number): Array<{ x: number; y: number }> {
    const s = Math.max(1, Math.min(5, Math.round(brushSize)));
    const radius = s - 1; // 0..4
    const out: Array<{ x: number; y: number }> = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < WORLD_TILES && y >= 0 && y < WORLD_TILES) out.push({ x, y });
      }
    }
    return out;
  }

  /**
   * Aplica delta (+1 aumentar, -1 excavar) a todos los tiles del pincel.
   * Retorna tiles modificados.
   */
  applyBrush(cx: number, cy: number, delta: number, brushSize: number): Array<{ x: number; y: number; h: number }> {
    const tiles = this.getBrushTiles(cx, cy, brushSize);
    const changed: Array<{ x: number; y: number; h: number }> = [];
    const changedChunks = new Set<string>();
    for (const t of tiles) {
      const i = this.idx(t.x, t.y);
      const cur = this.data[i];
      const next = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, cur + delta));
      if (next !== cur) {
        this.data[i] = next;
        changed.push({ x: t.x, y: t.y, h: next });
        changedChunks.add(`${Math.floor(t.x / 32)}:${Math.floor(t.y / 32)}`);
      }
    }
    if (changed.length > 0) {
      this.save();
      this.notify(changedChunks, changed);
    }
    return changed;
  }

  reset(): void {
    this.data.fill(0);
    try { localStorage.removeItem(this.storageKey()); } catch {}
    // si es per-settlement, también limpiar backend (opcional: no borrar worldState, solo heights)
    if (this.activeSettlementId) {
      // No borrar worldState completo, solo heights; se hará en próximo save
      this.saveToBackendDebounced();
    }
    this.notify(new Set(Array.from({ length: 36 }, (_, i) => `${i % 6}:${Math.floor(i / 6)}`)), []);
  }

  /** Para debug / serialización */
  exportArray(): number[] {
    return Array.from(this.data);
  }

  importArray(arr: number[]): void {
    if (arr.length !== WORLD_TILES * WORLD_TILES) return;
    for (let i = 0; i < arr.length; i++) this.data[i] = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, Math.round(arr[i])));
    this.save();
    this.notify(new Set(Array.from({ length: 36 }, (_, i) => `${i % 6}:${Math.floor(i / 6)}`)), []);
  }

  countNonZero(): number {
    let c = 0;
    for (let i = 0; i < this.data.length; i++) if (this.data[i] !== 0) c++;
    return c;
  }
}

export const terrainHeightManager = new TerrainHeightManager();

// Helpers rápidos sin instanciar (para ChunkRenderer que necesita O(1) fast path)
export function getHeightFast(tx: number, ty: number): number {
  return terrainHeightManager.getHeight(tx, ty);
}

export function getHeight(tx: number, ty: number): number {
  return terrainHeightManager.getHeight(tx, ty);
}
