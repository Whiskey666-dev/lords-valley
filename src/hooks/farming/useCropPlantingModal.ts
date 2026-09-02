import { useState, useEffect, useMemo, useCallback } from "react";
import { CROPS_CATALOG, type CropDefinition } from "../../game/farming/farmData";
import { farmPlotManager, type FarmPlotStatus } from "../../game/farming/FarmPlotManager";

export interface UseCropPlantingModalReturn {
  currentPlot: FarmPlotStatus | null;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  search: string;
  setSearch: (query: string) => void;
  harvestNotice: string | null;
  filteredCrops: CropDefinition[];
  handlePlant: (cropId: string) => void;
  handleHarvest: () => void;
  handleAdvanceTime: (hours: number) => void;
  handleClearCrop: () => void;
  handleRemovePlot: () => void;
}

export function useCropPlantingModal(
  plotStatus: FarmPlotStatus | null,
  onClose: () => void
): UseCropPlantingModalReturn {
  const [currentPlot, setCurrentPlot] = useState<FarmPlotStatus | null>(plotStatus);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [harvestNotice, setHarvestNotice] = useState<string | null>(null);

  // Sincronizar estado cuando cambie la prop
  useEffect(() => {
    if (plotStatus) {
      const refreshed = farmPlotManager.getPlotAt(plotStatus.tileX, plotStatus.tileY);
      if (refreshed) {
        setCurrentPlot(farmPlotManager.getPlotStatus(refreshed));
      } else {
        setCurrentPlot(plotStatus);
      }
    }
  }, [plotStatus]);

  // Actualizar temporizador cada segundo si hay cultivo activo
  useEffect(() => {
    if (!currentPlot || !currentPlot.plantedAt) return;
    const interval = setInterval(() => {
      const updated = farmPlotManager.getPlotAt(currentPlot.tileX, currentPlot.tileY);
      if (updated) {
        setCurrentPlot(farmPlotManager.getPlotStatus(updated));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPlot?.tileX, currentPlot?.tileY, currentPlot?.plantedAt]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filteredCrops = useMemo(() => {
    return CROPS_CATALOG.filter((c) => {
      if (selectedCategory !== "all" && c.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.categoryLabel.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, search]);

  const handlePlant = useCallback(
    (cropId: string) => {
      if (!currentPlot) return;
      const updated = farmPlotManager.plantCrop(currentPlot.tileX, currentPlot.tileY, cropId);
      if (updated) {
        setCurrentPlot(farmPlotManager.getPlotStatus(updated));
      }
    },
    [currentPlot]
  );

  const handleHarvest = useCallback(() => {
    if (!currentPlot) return;
    const result = farmPlotManager.harvestCrop(currentPlot.tileX, currentPlot.tileY);
    if (result) {
      setHarvestNotice(`¡Has cosechado +${result.yieldAmount} ${result.crop.baseYield.unit} de ${result.crop.name}!`);
      setTimeout(() => setHarvestNotice(null), 3000);
      const updated = farmPlotManager.getPlotAt(currentPlot.tileX, currentPlot.tileY);
      if (updated) {
        setCurrentPlot(farmPlotManager.getPlotStatus(updated));
      }
    }
  }, [currentPlot]);

  const handleAdvanceTime = useCallback(
    (hours: number) => {
      if (!currentPlot) return;
      const updated = farmPlotManager.advancePlotTime(currentPlot.tileX, currentPlot.tileY, hours);
      if (updated) {
        setCurrentPlot(farmPlotManager.getPlotStatus(updated));
      }
    },
    [currentPlot]
  );

  const handleClearCrop = useCallback(() => {
    if (!currentPlot) return;
    const plot = farmPlotManager.getPlotAt(currentPlot.tileX, currentPlot.tileY);
    if (plot) {
      plot.cropId = null;
      plot.plantedAt = null;
      plot.timeOffsetMs = 0;
      farmPlotManager.placePlot(plot.tileX, plot.tileY);
      setCurrentPlot(farmPlotManager.getPlotStatus(plot));
    }
  }, [currentPlot]);

  const handleRemovePlot = useCallback(() => {
    if (!currentPlot) return;
    farmPlotManager.removePlot(currentPlot.tileX, currentPlot.tileY);
    onClose();
  }, [currentPlot, onClose]);

  return {
    currentPlot,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    harvestNotice,
    filteredCrops,
    handlePlant,
    handleHarvest,
    handleAdvanceTime,
    handleClearCrop,
    handleRemovePlot,
  };
}

export default useCropPlantingModal;
