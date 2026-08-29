import { useState, useMemo, useCallback, useEffect } from "react";
import {
  INITIAL_BUILDINGS,
  type BuildingData,
  type BuildingCategory,
  type HierarchyRole,
} from "./buildingsData";

export type BuildingFilterMode = "all" | "existing" | "locked";
export type BuildingDetailTab = "gestion" | "administracion";

export function useBuildings() {
  const [buildings, setBuildings] = useState<BuildingData[]>(INITIAL_BUILDINGS);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("b_woodcamp");
  const [filterMode, setFilterMode] = useState<BuildingFilterMode>("all");
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | "all">("all");
  const [activeTab, setActiveTab] = useState<BuildingDetailTab>("gestion");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveNpcNames, setLiveNpcNames] = useState<string[]>([]);

  // Polling de NPCs vivos para asignación
  useEffect(() => {
    const update = () => {
      const npcs = (window as any).__NPCS_POS__;
      if (Array.isArray(npcs)) {
        const names = npcs.map((n: any) => n.name ?? `Colono #${n.id.slice(-4)}`);
        setLiveNpcNames(names);
      }
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, []);

  // Edificios filtrados
  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      // Filtro de estado
      if (filterMode === "existing" && b.status !== "existing") return false;
      if (filterMode === "locked" && b.status !== "locked") return false;

      // Filtro de categoría
      if (selectedCategory !== "all" && b.category !== selectedCategory) return false;

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.categoryLabel.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [buildings, filterMode, selectedCategory, searchQuery]);

  // Edificio actualmente seleccionado
  const selectedBuilding = useMemo(() => {
    return (
      buildings.find((b) => b.id === selectedBuildingId) ??
      filteredBuildings[0] ??
      buildings[0]
    );
  }, [buildings, selectedBuildingId, filteredBuildings]);

  // Conteo de estadísticas
  const stats = useMemo(() => {
    const total = buildings.length;
    const existing = buildings.filter((b) => b.status === "existing").length;
    const locked = buildings.filter((b) => b.status === "locked").length;
    const totalWorkersAssigned = buildings.reduce(
      (acc, b) => acc + b.workers.filter((w) => !!w.npcName).length,
      0
    );
    return { total, existing, locked, totalWorkersAssigned };
  }, [buildings]);

  // Asignar NPC a puesto de trabajo
  const assignWorker = useCallback(
    (buildingId: string, slotId: string, npcName: string, role: HierarchyRole) => {
      setBuildings((prev) =>
        prev.map((b) => {
          if (b.id !== buildingId) return b;
          const updatedWorkers = b.workers.map((w) => {
            if (w.id !== slotId) return w;
            return {
              ...w,
              npcName,
              role,
              efficiency: role === "maestro" || role === "administrador" ? 100 : 85,
              assignedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
          });

          // Recalcular eficiencia general del edificio
          const active = updatedWorkers.filter((w) => !!w.npcName);
          const newEff =
            active.length > 0
              ? Math.round(
                  active.reduce((sum, w) => sum + w.efficiency, 0) /
                    Math.max(1, b.maxWorkers)
                )
              : 0;

          return { ...b, workers: updatedWorkers, efficiency: newEff };
        })
      );
    },
    []
  );

  // Remover trabajador
  const removeWorker = useCallback((buildingId: string, slotId: string) => {
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id !== buildingId) return b;
        const updatedWorkers = b.workers.map((w) => {
          if (w.id !== slotId) return w;
          return { ...w, npcName: undefined, efficiency: 0, assignedAt: undefined };
        });
        const active = updatedWorkers.filter((w) => !!w.npcName);
        const newEff =
          active.length > 0
            ? Math.round(
                active.reduce((sum, w) => sum + w.efficiency, 0) /
                  Math.max(1, b.maxWorkers)
              )
            : 0;
        return { ...b, workers: updatedWorkers, efficiency: newEff };
      })
    );
  }, []);

  // Cambiar rango / jerarquía
  const changeWorkerRole = useCallback(
    (buildingId: string, slotId: string, newRole: HierarchyRole) => {
      setBuildings((prev) =>
        prev.map((b) => {
          if (b.id !== buildingId) return b;
          const updatedWorkers = b.workers.map((w) => {
            if (w.id !== slotId) return w;
            return {
              ...w,
              role: newRole,
              efficiency:
                newRole === "maestro" || newRole === "administrador"
                  ? 100
                  : newRole === "supervisor"
                  ? 95
                  : 85,
            };
          });
          return { ...b, workers: updatedWorkers };
        })
      );
    },
    []
  );

  // Transferir o modificar recursos de bodega (Gestión)
  const modifyInventoryItem = useCallback(
    (buildingId: string, itemId: string, delta: number) => {
      setBuildings((prev) =>
        prev.map((b) => {
          if (b.id !== buildingId) return b;
          const updatedInv = b.inventory.map((item) => {
            if (item.id !== itemId) return item;
            const nextQty = Math.max(0, Math.min(item.maxCapacity, item.quantity + delta));
            return { ...item, quantity: nextQty };
          });
          return { ...b, inventory: updatedInv };
        })
      );
    },
    []
  );

  // Desbloquear / Construir edificio
  const constructBuilding = useCallback((buildingId: string) => {
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id !== buildingId) return b;
        return {
          ...b,
          status: "existing",
          level: 1,
          efficiency: 75,
        };
      })
    );
  }, []);

  return {
    buildings: filteredBuildings,
    allBuildings: buildings,
    selectedBuilding,
    selectedBuildingId,
    setSelectedBuildingId,
    filterMode,
    setFilterMode,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    stats,
    liveNpcNames,
    assignWorker,
    removeWorker,
    changeWorkerRole,
    modifyInventoryItem,
    constructBuilding,
  };
}

export default useBuildings;
