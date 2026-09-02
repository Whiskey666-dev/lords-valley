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

const STORAGE_KEY = "lords_valley_farm_plots_v1";

class FarmPlotManagerClass {
  private plots: Map<string, FarmPlotData> = new Map();
  private listeners: Set<(plots: FarmPlotData[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: FarmPlotData[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.plots.clear();
          list.forEach(p => {
            const key = `${p.tileX}:${p.tileY}`;
            this.plots.set(key, p);
          });
        }
      }
    } catch (e) {
      console.warn("[FarmPlotManager] Error loading farm plots from storage", e);
    }
  }

  private saveToStorage(): void {
    try {
      const list = Array.from(this.plots.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.notifyListeners();
    } catch (e) {
      console.warn("[FarmPlotManager] Error saving farm plots to storage", e);
    }
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
