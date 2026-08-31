import { useEffect, useRef, useState, useCallback } from "react";
import { startLaunchGame } from "../../game/main";
import { getBinding, isRebindingActive, isConsoleOpenActive } from "../../ui/input/KeyBindings";
import { useGameStore } from "../../app/store/useGameStore";
import { fetchSettlementsByOwner } from "../../app/api/settlement.api";
import { type NpcPanelData } from "../character/useNpcPanel";

export function useAppController() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<NpcPanelData | null>(null);
  const [zoom, setZoom] = useState(50);
  const [showPlayerInventory, setShowPlayerInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showConstruction, setShowConstruction] = useState(false);
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem("access_token"));

  const survivors = useGameStore((s) => s.survivors);
  const selectedId = useGameStore((s) => s.selectedId);
  const fetchSettlement = useGameStore((s) => s.fetchSettlement);

  const handleToggleInventory = useCallback(() => {
    setShowPlayerInventory(prev => !prev);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleToggleFollowers = useCallback(() => {
    setShowFollowers(prev => !prev);
  }, []);

  const handleToggleBuildings = useCallback(() => {
    setShowBuildings(prev => !prev);
  }, []);

  const handleToggleMap = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  const handleToggleMissions = useCallback(() => {
    setShowMissions(prev => !prev);
  }, []);

  const handleToggleSkills = useCallback(() => {
    setShowSkills(prev => !prev);
  }, []);
  const handleToggleConstruction = useCallback(() => {
    setShowConstruction(prev => !prev);
  }, []);

  // Sincronización cross-tab (localStorage / evento auth-changed)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "player" || e.key === "settlementId") {
        setIsAuthed(!!localStorage.getItem("access_token"));
      }
    };
    const onAuthChanged = () => setIsAuthed(!!localStorage.getItem("access_token"));
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  // Hidratar settlement del usuario autenticado
  useEffect(() => {
    if (!isAuthed) return;
    const load = async () => {
      let sid = localStorage.getItem("settlementId");
      if (!sid) {
        const playerRaw = localStorage.getItem("player");
        const playerId = localStorage.getItem("playerId") || (playerRaw ? JSON.parse(playerRaw).id : null);
        if (playerId) {
          try {
            const list = await fetchSettlementsByOwner(playerId);
            if (list.length > 0) {
              sid = list[0].id;
              localStorage.setItem("settlementId", sid);
            }
          } catch (e) {
            console.warn("[App] fetchSettlements error", e);
          }
        }
        if (!sid) sid = import.meta.env.VITE_SETTLEMENT_ID || null;
      }
      if (sid) {
        fetchSettlement(sid).catch(() => console.warn("[App] fetchSettlement failed", sid));
      }
    };
    load();
  }, [isAuthed, fetchSettlement]);

  // Sincronización de selectedId de Zustand a selectedNPC
  useEffect(() => {
    const sv = survivors.find((s) => s.id === selectedId);
    if (!sv || !selectedId) {
      setTimeout(() => setSelectedNPC(null), 0);
    } else {
      setSelectedNPC({
        id: sv.id,
        name: sv.firstName + " " + sv.lastName,
        profession: sv.professions?.[0]?.type ?? sv.profession ?? "—",
        loyalty: sv.loyalty,
        health: sv.needs?.health ?? sv.stats?.salud ?? 100,
        edad: sv.age ?? sv.edad,
        ...sv,
      } as NpcPanelData);
    }
  }, [selectedId, survivors]);

  // Ciclo de vida de Phaser y suscripciones de eventos de ventana
  useEffect(() => {
    if (!isAuthed) return;
    if (!gameRef.current) {
      gameRef.current = startLaunchGame();
      setTimeout(() => {
        const container = document.getElementById("game-container");
        const canvas = container?.querySelector("canvas") as HTMLCanvasElement | null;
        if (container && canvas) {
          container.style.position = "relative";
          canvas.style.position = "absolute";
          canvas.style.left = "50%";
          canvas.style.top = "50%";
          canvas.style.transform = "translate(-50%, -50%)";
          canvas.style.margin = "0";
        }
      }, 200);
    }

    const handleNPCSelect = (event: Event) => {
      const customEvent = event as CustomEvent<NpcPanelData>;
      setSelectedNPC(customEvent.detail);
    };
    const handleNPCClose = () => setSelectedNPC(null);
    const handleZoomSync = (e: Event) => {
      const z = (e as CustomEvent<number>).detail;
      if (typeof z === "number") setZoom(Math.min(100, Math.max(0, Math.round(z))));
    };
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    window.addEventListener("phaser-npc-selected", handleNPCSelect);
    window.addEventListener("phaser-npc-deselected", handleNPCClose);
    window.addEventListener("phaser-zoom-sync", handleZoomSync);
    window.addEventListener("phaser-action-inventory", handleToggleInventory);
    window.addEventListener("phaser-action-config", handleToggleSettings);
    window.addEventListener("phaser-action-buildings", handleToggleBuildings);
    window.addEventListener("phaser-action-map", handleToggleMap);
    window.addEventListener("phaser-action-missions", handleToggleMissions);
    window.addEventListener("phaser-action-habilidades", handleToggleSkills);
    window.addEventListener("phaser-action-construction", handleToggleConstruction);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("phaser-npc-selected", handleNPCSelect);
      window.removeEventListener("phaser-npc-deselected", handleNPCClose);
      window.removeEventListener("phaser-zoom-sync", handleZoomSync);
      window.removeEventListener("phaser-action-inventory", handleToggleInventory);
      window.removeEventListener("phaser-action-config", handleToggleSettings);
      window.removeEventListener("phaser-action-buildings", handleToggleBuildings);
      window.removeEventListener("phaser-action-map", handleToggleMap);
      window.removeEventListener("phaser-action-missions", handleToggleMissions);
      window.removeEventListener("phaser-action-habilidades", handleToggleSkills);
      window.removeEventListener("phaser-action-construction", handleToggleConstruction);
      window.removeEventListener("wheel", handleWheel);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isAuthed, handleToggleInventory, handleToggleSettings, handleToggleBuildings, handleToggleMap, handleToggleMissions, handleToggleSkills, handleToggleConstruction]);

  // Atajo de teclado global (Inventario + Misiones)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isRebindingActive() || isConsoleOpenActive()) return;
      const inventoryKey = getBinding("inventory");
      const missionsKey = getBinding("missions");
      if (e.key.toUpperCase() === inventoryKey) {
        e.preventDefault();
        handleToggleInventory();
      } else if (e.key.toUpperCase() === missionsKey) {
        e.preventDefault();
        handleToggleMissions();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleToggleInventory, handleToggleMissions]);

  const handleZoomIn = () => {
    setZoom(z => {
      const nz = Math.min(100, z + 10);
      window.dispatchEvent(new CustomEvent("phaser-zoom-set", { detail: nz }));
      return nz;
    });
  };

  const handleZoomOut = () => {
    setZoom(z => {
      const nz = Math.max(0, z - 10);
      window.dispatchEvent(new CustomEvent("phaser-zoom-set", { detail: nz }));
      return nz;
    });
  };

  const handleCloseNPC = () => {
    setSelectedNPC(null);
    useGameStore.getState().clearSelection();
  };

  return {
    isAuthed,
    setIsAuthed,
    selectedNPC,
    setSelectedNPC,
    handleCloseNPC,
    showPlayerInventory,
    setShowPlayerInventory,
    handleToggleInventory,
    showSettings,
    setShowSettings,
    handleToggleSettings,
    showFollowers,
    setShowFollowers,
    handleToggleFollowers,
    showBuildings,
    setShowBuildings,
    handleToggleBuildings,
    showMap,
    setShowMap,
    handleToggleMap,
    showMissions,
    setShowMissions,
    handleToggleMissions,
    showSkills,
    setShowSkills,
    handleToggleSkills,
    showConstruction,
    setShowConstruction,
    handleToggleConstruction,
    zoom,
    handleZoomIn,
    handleZoomOut,
  };
}

export default useAppController;
