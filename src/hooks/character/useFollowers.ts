import { useState, useEffect, useMemo } from "react";
import type { NpcPanelData } from "./useNpcPanel";

export interface FollowerItem extends NpcPanelData {
  x?: number;
  y?: number;
}

export function useFollowers() {
  const [liveNpcs, setLiveNpcs] = useState<FollowerItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Polling de NPCs vivos desde Phaser (generados con createNpc o de forma natural)
  useEffect(() => {
    const updateNpcs = () => {
      const npcs = (window as any).__NPCS_POS__;
      if (Array.isArray(npcs)) {
        setLiveNpcs(npcs);
      }
    };
    updateNpcs();
    const interval = setInterval(updateNpcs, 250);
    return () => clearInterval(interval);
  }, []);

  // Solo NPCs activos en el mundo, con filtro de búsqueda opcional
  const followersList = useMemo<FollowerItem[]>(() => {
    if (!searchTerm.trim()) return liveNpcs;
    const lower = searchTerm.toLowerCase();
    return liveNpcs.filter(
      (f) =>
        (f.name ?? "").toLowerCase().includes(lower) ||
        (f.profession ?? "").toLowerCase().includes(lower)
    );
  }, [liveNpcs, searchTerm]);

  // Centrar cámara en el NPC y abrir su panel
  const selectAndFocusNpc = (npc: FollowerItem) => {
    const targetX = npc.x ?? npc.positionX ?? 0;
    const targetY = npc.y ?? npc.positionY ?? 0;

    // Pedir a Phaser que centre la cámara y abra el panel del NPC
    window.dispatchEvent(
      new CustomEvent("phaser-focus-npc", {
        detail: { id: npc.id, x: targetX, y: targetY },
      })
    );

    // Abrir panel directamente con los datos ya disponibles
    window.dispatchEvent(
      new CustomEvent("phaser-npc-selected", { detail: npc })
    );
  };

  return {
    followersList,
    totalCount: liveNpcs.length,
    searchTerm,
    setSearchTerm,
    selectAndFocusNpc,
  };
}

export default useFollowers;
