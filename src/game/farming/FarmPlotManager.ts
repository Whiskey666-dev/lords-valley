import { CROPS_CATALOG, type CropDefinition, calculateGrowthStatus, type CropGrowthStatus } from "./farmData";

export interface FarmPlotData {
  id: string;
  tileX: number;
  tileY: number;
  cropId: string | null;
  plantedAt: number | null;
  timeOffsetMs?: number;
  createdAt: number;
}

export interface FarmPlotStatus extends FarmPlotData {
  crop: CropDefinition | null;
  growth: CropGrowthStatus | null;
}

const STORAGE_BASE = "lords_valley_farm_plots";
const LEGACY_KEY = "lords_valley_farm_plots_v1";

class FarmPlotManagerClass {
  private plots: Map<string, FarmPlotData> = new Map();
  private listeners: Set<(plots: FarmPlotData[]) => void> = new Set();
  private activeSettlementId: string | null = null;
  private saveDebounceTimer: number | null = null;

  constructor() {
    const sid = localStorage.getItem("settlementId");
    this.activeSettlementId = sid && sid.trim() ? sid.trim() : null;
    this.loadFromStorage();
    window.addEventListener("storage", (e) => {
      if (e.key === "settlementId") {
        this.setActiveSettlementId(e.newValue);
      }
    });
  }

  private storageKey(): string {
    return this.activeSettlementId ? `${STORAGE_BASE}_${this.activeSettlementId}` : LEGACY_KEY;
  }

  setActiveSettlementId(id: string | null): void {
    const newId = id && id.trim() ? id.trim() : null;
    if (newId === this.activeSettlementId) return;
    this.activeSettlementId = newId;
    this.plots.clear();
    this.loadFromStorage();
    this.notifyListeners();
    console.log(`[FarmPlotManager] switched to settlement ${newId || "legacy"} plots=${this.plots.size}`);
  }

  getActiveSettlementId(): string | null {
    return this.activeSettlementId;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (raw) {
        const list: FarmPlotData[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.plots.clear();
          list.forEach(p => {
            const key = `${p.tileX}:${p.tileY}`;
            this.plots.set(key, p);
          });
        }
      } else {
        this.plots.clear();
      }
    } catch (e) {
      console.warn("[FarmPlotManager] Error loading farm plots from storage", e);
    }
  }

  private saveToStorage(): void {
    try {
      const list = Array.from(this.plots.values());
      localStorage.setItem(this.storageKey(), JSON.stringify(list));
      this.notifyListeners();
      this.saveToBackendDebounced(list);
    } catch (e) {
      console.warn("[FarmPlotManager] Error saving farm plots to storage", e);
    }
  }

  private saveToBackendDebounced(list: FarmPlotData[]): void {
    if (!this.activeSettlementId) return;
    if (this.saveDebounceTimer) window.clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = window.setTimeout(() => {
      this.saveToBackend(list);
    }, 1500);
  }

  private async saveToBackend(list: FarmPlotData[]): Promise<void> {
    const sid = this.activeSettlementId;
    if (!sid) return;
    try {
      const { api } = await import("../../app/api/client");
      const { fetchSettlement } = await import("../../app/api/settlement.api");
      const settlement: any = await fetchSettlement(sid).catch(() => null);
      const prevState = settlement?.worldState || {};
      const newState = { ...prevState, farmPlots: list };
      await api.patch(`/settlements/${sid}/world-state`, { worldState: newState }).catch(() => {});
    } catch {}
  }

  async loadFromBackend(): Promise<void> {
    const sid = this.activeSettlementId;
    if (!sid) return;
    try {
      const { fetchSettlement } = await import("../../app/api/settlement.api");
      const settlement: any = await fetchSettlement(sid);
      const plots = settlement?.worldState?.farmPlots;
      if (Array.isArray(plots)) {
        this.plots.clear();
        plots.forEach((p: FarmPlotData) => {
          const key = `${p.tileX}:${p.tileY}`;
          this.plots.set(key, p);
        });
        // persistir localmente para cache
        localStorage.setItem(this.storageKey(), JSON.stringify(Array.from(this.plots.values())));
        this.notifyListeners();
      }
    } catch {}
  }

  public subscribe(cb: (plots: FarmPlotData[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.getAllPlots());
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(): void {
    const list = this.getAllPlots();
    this.listeners.forEach(cb => cb(list));
    window.dispatchEvent(new CustomEvent("phaser-farm-plots-changed", { detail: list }));
  }

  public getAllPlots(): FarmPlotData[] {
    return Array.from(this.plots.values());
  }

  public getPlotAt(tileX: number, tileY: number): FarmPlotData | undefined {
    return this.plots.get(`${tileX}:${tileY}`);
  }

  public hasPlotAt(tileX: number, tileY: number): boolean {
    return this.plots.has(`${tileX}:${tileY}`);
  }

  public placePlot(tileX: number, tileY: number): FarmPlotData {
    const key = `${tileX}:${tileY}`;
    const newPlot: FarmPlotData = {
      id: `plot_${tileX}_${tileY}_${Date.now()}`,
      tileX,
      tileY,
      cropId: null,
      plantedAt: null,
      timeOffsetMs: 0,
      createdAt: Date.now(),
    };
    this.plots.set(key, newPlot);
    this.saveToStorage();
    console.log(`[FarmPlotManager] Parcela colocada en (${tileX}, ${tileY})`);
    return newPlot;
  }

  public removePlot(tileX: number, tileY: number): boolean {
    const key = `${tileX}:${tileY}`;
    const existed = this.plots.delete(key);
    if (existed) {
      this.saveToStorage();
      console.log(`[FarmPlotManager] Parcela eliminada en (${tileX}, ${tileY})`);
    }
    return existed;
  }

  public plantCrop(tileX: number, tileY: number, cropId: string): FarmPlotData | null {
    const plot = this.getPlotAt(tileX, tileY);
    if (!plot) return null;
    plot.cropId = cropId;
    plot.plantedAt = Date.now();
    plot.timeOffsetMs = 0;
    this.saveToStorage();
    console.log(`[FarmPlotManager] Cultivo "${cropId}" sembrado en (${tileX}, ${tileY})`);
    return plot;
  }

  public harvestCrop(tileX: number, tileY: number): { crop: CropDefinition; yieldAmount: number } | null {
    const plot = this.getPlotAt(tileX, tileY);
    if (!plot || !plot.cropId || !plot.plantedAt) return null;

    const crop = CROPS_CATALOG.find(c => c.id === plot.cropId);
    if (!crop) return null;

    const status = calculateGrowthStatus(plot.plantedAt, plot.timeOffsetMs ?? 0);
    if (!status.isReady) {
      console.warn("[FarmPlotManager] El cultivo aún no está listo para cosechar");
    }

    const yieldAmount = crop.baseYield.amount;

    // Resetear parcela a tierra limpia preparada
    plot.cropId = null;
    plot.plantedAt = null;
    plot.timeOffsetMs = 0;
    this.saveToStorage();

    console.log(`[FarmPlotManager] Cosechado ${crop.name} en (${tileX}, ${tileY}) x${yieldAmount}`);
    return { crop, yieldAmount };
  }

  public advancePlotTime(tileX: number, tileY: number, additionalHours: number): FarmPlotData | null {
    const plot = this.getPlotAt(tileX, tileY);
    if (!plot || !plot.plantedAt) return null;
    plot.timeOffsetMs = (plot.timeOffsetMs ?? 0) + additionalHours * 3600 * 1000;
    this.saveToStorage();
    return plot;
  }

  public getPlotStatus(plot: FarmPlotData): FarmPlotStatus {
    const crop = plot.cropId ? CROPS_CATALOG.find(c => c.id === plot.cropId) ?? null : null;
    const growth = plot.plantedAt ? calculateGrowthStatus(plot.plantedAt, plot.timeOffsetMs ?? 0) : null;
    return {
      ...plot,
      crop,
      growth,
    };
  }
}

export const farmPlotManager = new FarmPlotManagerClass();
