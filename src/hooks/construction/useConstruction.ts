import { useState, useMemo, useCallback } from "react";
import {
  INITIAL_BUILDINGS,
  CATEGORY_INFO,
  type BuildingData,
  type BuildingCategory,
} from "../buildings/buildingsData";
import {
  type MissionCategoryId,
} from "../missions/missionsData";

export interface UpgradeInfo {
  id: string;
  name: string;
  description: string;
  chapterId: MissionCategoryId;
  tier: number;
  cost: { name: string; amount: number; icon: string }[];
}

export function getUpgradesForBuilding(b: BuildingData): UpgradeInfo[] {
  const baseCost =
    b.unlockCost && b.unlockCost.length > 0
      ? b.unlockCost
      : b.tier === 1
      ? [
          { name: "Madera", amount: 40, icon: "🪵" },
          { name: "Piedra", amount: 30, icon: "🪨" },
        ]
      : b.tier === 2
      ? [
          { name: "Piedra Labrada", amount: 70, icon: "🧱" },
          { name: "Tablas", amount: 50, icon: "🪵" },
        ]
      : [
          { name: "Piedra Labrada", amount: 150, icon: "🧱" },
          { name: "Oro", amount: 50, icon: "💰" },
        ];

  const scaleCost = (factor: number): { name: string; amount: number; icon: string }[] =>
    baseCost.map((c) => ({ ...c, amount: Math.round(c.amount * factor) }));

  if (b.tier === 1) {
    return [
      {
        id: `${b.id}_up2`,
        name: "Ampliación a Nivel 2",
        description: "+2 puestos de trabajo y +35% capacidad de bodega. Desbloquea gestión intermedia.",
        chapterId: "asentamiento",
        tier: 2,
        cost: scaleCost(1.2),
      },
      {
        id: `${b.id}_up3`,
        name: "Mejora Señorial",
        description: "+50% eficiencia, permite supervisores y previene desperdicios. Requiere administración feudal.",
        chapterId: "senorio",
        tier: 3,
        cost: scaleCost(1.8),
      },
      {
        id: `${b.id}_up4`,
        name: "Maestría Imperial",
        description: "Automatización parcial y +100% producción. Tecnología de imperio sostenible.",
        chapterId: "imperio",
        tier: 4,
        cost: scaleCost(2.6),
      },
    ];
  }
  if (b.tier === 2) {
    return [
      {
        id: `${b.id}_up3`,
        name: "Refuerzo Ducal",
        description: "+40% durabilidad, almacén reforzado y +1 puesto especializado.",
        chapterId: "ducado",
        tier: 3,
        cost: scaleCost(1.4),
      },
      {
        id: `${b.id}_up4`,
        name: "Fortificación de Conquista",
        description: "Defensa +30% y habilita producción militar. Requiere doctrina de guerra.",
        chapterId: "conquista",
        tier: 4,
        cost: scaleCost(2.0),
      },
      {
        id: `${b.id}_up5`,
        name: "Obra Imperial Perfeccionada",
        description: "Máxima tecnología imperial: producción autónoma y bonificación global.",
        chapterId: "imperio",
        tier: 5,
        cost: scaleCost(2.8),
      },
    ];
  }
  return [
    {
      id: `${b.id}_up4`,
      name: "Legado de Conquista",
      description: "+50% prestigio y +25% eficiencia en crisis. Requiere dominio militar.",
      chapterId: "conquista",
      tier: 4,
      cost: scaleCost(1.6),
    },
    {
      id: `${b.id}_up5`,
      name: "Obra Imperial Definitiva",
      description: "Monumento imperial: +100% capacidad y legitimidad divina. Pináculo tecnológico.",
      chapterId: "imperio",
      tier: 5,
      cost: scaleCost(2.4),
    },
  ];
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as BuildingCategory[];

export function useConstruction(onClose: () => void) {
  const [filterCategory, setFilterCategory] = useState<BuildingCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "existing" | "locked">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingData[]>(INITIAL_BUILDINGS);

  const handleStartPlacement = useCallback(
    (buildingId: string) => {
      window.dispatchEvent(new CustomEvent("phaser-start-placement", { detail: { buildingId } }));
      onClose();
    },
    [onClose]
  );

  const handleConstruct = useCallback(
    (id: string) => {
      if (id === "b_cropplot") {
        handleStartPlacement(id);
        return;
      }
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "existing" as const, level: 1, efficiency: 75 } : b
        )
      );
    },
    [handleStartPlacement]
  );

  const filtered = useMemo(() => {
    return buildings.filter((b) => {
      if (filterCategory !== "all" && b.category !== filterCategory) return false;
      if (filterStatus === "existing" && b.status !== "existing") return false;
      if (filterStatus === "locked" && b.status !== "locked") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [buildings, filterCategory, filterStatus, search]);

  const stats = useMemo(() => {
    return {
      total: buildings.length,
      existing: buildings.filter((b) => b.status === "existing").length,
      locked: buildings.filter((b) => b.status === "locked").length,
    };
  }, [buildings]);

  return {
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    search,
    setSearch,
    expandedId,
    setExpandedId,
    buildings,
    filtered,
    stats,
    handleStartPlacement,
    handleConstruct,
  };
}

export default useConstruction;
