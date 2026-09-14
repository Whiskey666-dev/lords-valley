import { useEffect, useRef, useState, useCallback } from "react";
import { startLaunchGame } from "../../game/main";
import { getBinding, isRebindingActive, isConsoleOpenActive } from "../../ui/input/KeyBindings";
import { useGameStore } from "../../app/store/useGameStore";
import { fetchPlayer } from "../../app/api/player.api";
import {
  getPlayerNeedsCache,
  refreshPlayerNeeds,
  subscribePlayerNeeds,
} from "../inventory/playerInventoryStore";
import { setActiveSeed, ensureWorldTiles, getTileGid } from "../../game/world/WorldTiles";
import { invalidateMinimapBase } from "../hud/useMiniMap";
import { terrainHeightManager } from "../../game/world/TerrainHeight";
import { farmPlotManager } from "../../game/farming/FarmPlotManager";
import { collisionMatrix } from "../../game/world/CollisionMatrix";
import { type NpcPanelData } from "../character/useNpcPanel";
import type { DeadDragonPanelData } from "../../ui/character/DeadDragonPanel";
import type { FarmPlotStatus } from "../../game/farming/FarmPlotManager";

export function useAppController() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [showCharacter, setShowCharacter] = useState(false);
  const [characterData, setCharacterData] = useState<NpcPanelData | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<NpcPanelData | null>(null);
  const [selectedDeadDragon, setSelectedDeadDragon] = useState<DeadDragonPanelData | null>(null);
  const [selectedFarmPlot, setSelectedFarmPlot] = useState<FarmPlotStatus | null>(null);
  const [zoom, setZoom] = useState(50);
  const [showPlayerInventory, setShowPlayerInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showConstruction, setShowConstruction] = useState(false);
  const [showTerrain, setShowTerrain] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem("access_token"));

  const survivors = useGameStore((s) => s.survivors);
  const selectedId = useGameStore((s) => s.selectedId);
  const fetchSettlement = useGameStore((s) => s.fetchSettlement);

  const handleToggleCharacter = useCallback(() => {
    setShowCharacter(prev => {
      const next = !prev;
      if (next) {
        setSelectedNPC(null);
        setSelectedDeadDragon(null);
      }
      return next;
    });
  }, []);

  const handleCloseCharacter = useCallback(() => {
    setShowCharacter(false);
  }, []);

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

  const handleToggleTerrain = useCallback(() => {
    setShowTerrain(prev => !prev);
  }, []);

  const handleEnterGame = useCallback(async (settlementId: string) => {
    localStorage.setItem("settlementId", settlementId);
    // Configurar mundo por settlement ANTES de lanzar Phaser
    try {
      // Cambiar managers a este settlement (limpia heights/plots del anterior)
      terrainHeightManager.setActiveSettlementId(settlementId);
      farmPlotManager.setActiveSettlementId(settlementId);

      // Intentar obtener worldSeed/worldState del backend
      const { fetchSettlement: fetchSett } = await import("../../app/api/settlement.api");
      const settlement: any = await fetchSett(settlementId).catch(() => null);
      const seed = settlement?.worldSeed || `seed_${settlementId.slice(-8)}_${Date.now().toString(36)}`;
      // Fuente única: el backend genera los tiles de este mundo; precargar los 36 chunks.
      setActiveSeed(seed);
      try {
        await ensureWorldTiles(seed);
      } catch (e) {
        console.warn("[App] precarga de chunks falló, se cargarán al explorar", e);
      }
      // Reconstruir colisiones para la nueva semilla (StaticGroundLayer y ChunkRenderer lo harán de nuevo, pero aseguramos)
      try {
        collisionMatrix.buildFromWorldTiles(getTileGid);
      } catch {}
      // El minimapa hornea de nuevo con los tiles de este mundo; la niebla se reinicia.
      invalidateMinimapBase();
      try {
        window.dispatchEvent(new CustomEvent("phaser-fog-clear"));
      } catch {}

      // Si el settlement trae worldState con heights/plots, hidratar managers
      if (settlement?.worldState) {
        const ws = settlement.worldState;
        if (Array.isArray(ws.terrainHeights) && ws.terrainHeights.length === 36864) {
          // evitar re-guardar a backend al importar (desactivar debounce temporal)
          terrainHeightManager.importArray(ws.terrainHeights);
        }
        if (Array.isArray(ws.farmPlots)) {
          const key = `lords_valley_farm_plots_${settlementId}`;
          localStorage.setItem(key, JSON.stringify(ws.farmPlots));
          // forzar recarga del manager
          farmPlotManager.setActiveSettlementId(null as any);
          farmPlotManager.setActiveSettlementId(settlementId);
        }
      }

      // También asegurar que el store tenga el settlement
      fetchSettlement(settlementId).catch(() => console.warn("[App] fetchSettlement failed", settlementId));
    } catch (e) {
      console.warn("[App] handleEnterGame worldSeed fail", e);
      // fallback: usar id como seed
      setActiveSeed(settlementId);
      fetchSettlement(settlementId).catch(() => {});
    }
    setShowStartMenu(false);
  }, [fetchSettlement]);

  const handleReturnToStart = useCallback(() => {
    // Cerrar todos los paneles de juego antes de volver al inicio
    setShowCharacter(false);
    setSelectedNPC(null);
    setSelectedDeadDragon(null);
    setSelectedFarmPlot(null);
    setShowPlayerInventory(false);
    setShowSettings(false);
    setShowFollowers(false);
    setShowBuildings(false);
    setShowMap(false);
    setShowMissions(false);
    setShowSkills(false);
    setShowConstruction(false);
    setShowTerrain(false);
    // Destruir Phaser y mostrar inicio
    if (gameRef.current) {
      try { gameRef.current.destroy(true); } catch {}
      gameRef.current = null;
    }
    useGameStore.getState().resetState();
    setShowStartMenu(true);
  }, []);

  // Cuando cambia auth, mostrar inicio si está autenticado
  useEffect(() => {
    if (isAuthed) setShowStartMenu(true);
  }, [isAuthed]);

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

  // Hidratar datos del jugador autenticado (sin auto-seleccionar settlement)
  useEffect(() => {
    if (!isAuthed) return;
    const load = async () => {
      const playerRaw = localStorage.getItem("player");
      const parsedPlayer = playerRaw ? JSON.parse(playerRaw) : null;
      const playerId = localStorage.getItem("playerId") || (parsedPlayer ? parsedPlayer.id : null);

      if (playerId) {
        try {
          const dto = await fetchPlayer(playerId);
          // Saciedad real: el backend (/player/me/needs) es la autoridad.
          // Sin valores inventados: se toma lo ya sincronizado en el store y,
          // si el fetch tardó, NO se pisan los valores publicados entretanto
          // (un "usar Pan" en esa ventana debe sobrevivir a esta hidratación).
          setCharacterData((prev) => {
            const live = getPlayerNeedsCache();
            const prevNeeds = (prev as any)?.needs as { hunger?: number; thirst?: number } | undefined;
            const hunger = live?.hunger ?? prevNeeds?.hunger ?? 0;
            const thirst = live?.thirst ?? prevNeeds?.thirst ?? 0;
            return {
              id: dto.id,
              name: dto.username || "Señor Feudal",
              profession: "Gobernante",
              loyalty: 100,
              health: 100,
              isPlayer: true,
              email: dto.email,
              username: dto.username,
              settings: dto.settings,
              createdAt: dto.createdAt,
              edad: 28,
              attributes: {
                strength: 15,
                agility: 14,
                endurance: 16,
                intelligence: 18,
                charisma: 20,
                perception: 16,
              },
              needs: { hunger, thirst },
            } as unknown as NpcPanelData;
          });
        } catch {
          setCharacterData({
            id: playerId,
            name: parsedPlayer?.username || "Señor Feudal",
            profession: "Gobernante",
            loyalty: 100,
            health: 100,
            isPlayer: true,
            username: parsedPlayer?.username || "Player",
            edad: 28,
          } as NpcPanelData);
        }
      } else {
        setCharacterData({
          id: "player",
          name: "Señor Feudal",
          profession: "Gobernante",
          loyalty: 100,
          health: 100,
          isPlayer: true,
          edad: 28,
        } as NpcPanelData);
      }
    };
    load();
  }, [isAuthed]);

  // Hambre/sed del jugador (autoridad: backend /player/me/needs).
  // Fuente única: playerNeedsStore. Al usar un consumible el store publica el
  // valor inmediato y luego converge con el refetch; aquí solo se refleja
  // en el panel del personaje + polling cada 20s (decaimiento 5h).
  useEffect(() => {
    if (!isAuthed) return;
    const applyNeeds = (hunger: number, thirst: number) => {
      setCharacterData((prev) => {
        if (!prev) return prev;
        const prevNeeds = (prev as any).needs ?? {};
        return {
          ...prev,
          needs: {
            ...prevNeeds,
            hunger: Math.max(0, Math.min(100, Math.round(hunger))),
            thirst: Math.max(0, Math.min(100, Math.round(thirst))),
          },
        } as NpcPanelData;
      });
    };
    const cached = getPlayerNeedsCache();
    if (cached) applyNeeds(cached.hunger, cached.thirst);
    const unsub = subscribePlayerNeeds((n) => applyNeeds(n.hunger, n.thirst));
    void refreshPlayerNeeds();
    const timer = window.setInterval(() => {
      void refreshPlayerNeeds();
    }, 20000);
    return () => {
      unsub();
      window.clearInterval(timer);
    };
  }, [isAuthed]);

  // Sincronización de selectedId de Zustand a selectedNPC
  useEffect(() => {
    if (!selectedId) {
      setSelectedNPC(null);
      return;
    }
    const sv = survivors.find((s) => s.id === selectedId);
    if (sv) {
      setShowCharacter(false);
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

  // Ciclo de vida de Phaser: solo cuando está autenticado Y no está en menú de inicio
  useEffect(() => {
    if (!isAuthed || showStartMenu) return;

    let cancelled = false;
    let retryTimer: number | null = null;

    const launch = () => {
      if (cancelled) return;
      const container = document.getElementById("game-container");
      if (!container) {
        // DOM aún no pintado (React acaba de cambiar showStartMenu) -> reintentar
        retryTimer = window.setTimeout(launch, 50);
        return;
      }
      if (!gameRef.current) {
        try {
          window.dispatchEvent(new CustomEvent("lords-loading-progress", { detail: { progress: 10, step: "Iniciando motor de juego..." } }));
          gameRef.current = startLaunchGame();
          console.log("[useAppController] Phaser Game lanzado");
        } catch (e) {
          console.error("[useAppController] Error lanzando Phaser, reintentando", e);
          retryTimer = window.setTimeout(launch, 300);
          return;
        }
        setTimeout(() => {
          const c = document.getElementById("game-container");
          const canvas = c?.querySelector("canvas") as HTMLCanvasElement | null;
          if (c && canvas) {
            c.style.position = "relative";
            canvas.style.position = "absolute";
            canvas.style.left = "50%";
            canvas.style.top = "50%";
            canvas.style.transform = "translate(-50%, -50%)";
            canvas.style.margin = "0";
          }
        }, 200);
      }
    };

    // pequeño defer para asegurar que React haya pintado #game-container
    retryTimer = window.setTimeout(launch, 60);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (gameRef.current) {
        try { gameRef.current.destroy(true); } catch {}
        gameRef.current = null;
      }
    };
  }, [isAuthed, showStartMenu]);

  // Suscripciones de eventos de ventana (UI/Phaser bridge)
  useEffect(() => {
    const handleNPCSelect = (event: Event) => {
      const customEvent = event as CustomEvent<NpcPanelData>;
      if ((customEvent.detail as any)?.isDeadDragon) return;
      setShowCharacter(false);
      setSelectedNPC(customEvent.detail);
      setSelectedDeadDragon(null);
    };
    const handleNPCClose = () => setSelectedNPC(null);
    const handleDeadDragonSelect = (event: Event) => {
      const customEvent = event as CustomEvent<DeadDragonPanelData>;
      setShowCharacter(false);
      setSelectedDeadDragon(customEvent.detail);
      setSelectedNPC(null);
    };
    const handleDeadDragonClose = () => setSelectedDeadDragon(null);
    const handleDeadDragonUpdated = (event: Event) => {
      const detail = (event as CustomEvent<DeadDragonPanelData>).detail;
      if (!detail) return;
      setSelectedDeadDragon(prev => (prev && prev.id === detail.id ? detail : prev));
    };
    const handleZoomSync = (e: Event) => {
      const z = (e as CustomEvent<number>).detail;
      if (typeof z === "number") setZoom(Math.min(100, Math.max(0, Math.round(z))));
    };
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const handleCropPlotSelect = (event: Event) => {
      const detail = (event as CustomEvent<FarmPlotStatus>).detail;
      setSelectedFarmPlot(detail);
    };

    const handleCloseBoth = () => {
      setShowCharacter(false);
      handleNPCClose();
      handleDeadDragonClose();
      setSelectedFarmPlot(null);
    };

    window.addEventListener("phaser-npc-selected", handleNPCSelect);
    window.addEventListener("phaser-dead-dragon-selected" as any, handleDeadDragonSelect as EventListener);
    window.addEventListener("phaser-dead-dragon-deselected" as any, handleDeadDragonClose as EventListener);
    window.addEventListener("phaser-dead-dragon-updated" as any, handleDeadDragonUpdated as EventListener);
    window.addEventListener("phaser-crop-plot-selected" as any, handleCropPlotSelect as EventListener);
    window.addEventListener("phaser-npc-deselected", handleCloseBoth);
    window.addEventListener("phaser-zoom-sync", handleZoomSync);
    window.addEventListener("phaser-action-character", handleToggleCharacter);
    window.addEventListener("phaser-action-inventory", handleToggleInventory);
    window.addEventListener("phaser-action-config", handleToggleSettings);
    window.addEventListener("phaser-action-buildings", handleToggleBuildings);
    window.addEventListener("phaser-action-map", handleToggleMap);
    window.addEventListener("phaser-action-missions", handleToggleMissions);
    window.addEventListener("phaser-action-habilidades", handleToggleSkills);
    window.addEventListener("phaser-action-construction", handleToggleConstruction);
    window.addEventListener("phaser-action-terreno", handleToggleTerrain);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("phaser-npc-selected", handleNPCSelect);
      window.removeEventListener("phaser-dead-dragon-selected" as any, handleDeadDragonSelect as EventListener);
      window.removeEventListener("phaser-dead-dragon-deselected" as any, handleDeadDragonClose as EventListener);
      window.removeEventListener("phaser-dead-dragon-updated" as any, handleDeadDragonUpdated as EventListener);
      window.removeEventListener("phaser-crop-plot-selected" as any, handleCropPlotSelect as EventListener);
      window.removeEventListener("phaser-npc-deselected", handleCloseBoth);
      window.removeEventListener("phaser-zoom-sync", handleZoomSync);
      window.removeEventListener("phaser-action-character", handleToggleCharacter);
      window.removeEventListener("phaser-action-inventory", handleToggleInventory);
      window.removeEventListener("phaser-action-config", handleToggleSettings);
      window.removeEventListener("phaser-action-buildings", handleToggleBuildings);
      window.removeEventListener("phaser-action-map", handleToggleMap);
      window.removeEventListener("phaser-action-missions", handleToggleMissions);
      window.removeEventListener("phaser-action-habilidades", handleToggleSkills);
      window.removeEventListener("phaser-action-construction", handleToggleConstruction);
      window.removeEventListener("phaser-action-terreno", handleToggleTerrain);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [handleToggleCharacter, handleToggleInventory, handleToggleSettings, handleToggleBuildings, handleToggleMap, handleToggleMissions, handleToggleSkills, handleToggleConstruction, handleToggleTerrain]);

  // Atajo de teclado global (Personaje + Inventario + Misiones)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isRebindingActive() || isConsoleOpenActive()) return;
      const inventoryKey = getBinding("inventory");
      const missionsKey = getBinding("missions");
      const statsKey = getBinding("stats");
      if (e.key.toUpperCase() === inventoryKey) {
        e.preventDefault();
        handleToggleInventory();
      } else if (e.key.toUpperCase() === missionsKey) {
        e.preventDefault();
        handleToggleMissions();
      } else if (e.key.toUpperCase() === statsKey) {
        e.preventDefault();
        handleToggleCharacter();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleToggleCharacter, handleToggleInventory, handleToggleMissions]);

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

  const handleCloseDeadDragon = () => {
    setSelectedDeadDragon(null);
  };

  const handleCloseCropPlot = () => {
    setSelectedFarmPlot(null);
  };

  return {
    isAuthed,
    setIsAuthed,
    showStartMenu,
    setShowStartMenu,
    handleEnterGame,
    handleReturnToStart,
    showCharacter,
    characterData,
    handleToggleCharacter,
    handleCloseCharacter,
    selectedNPC,
    setSelectedNPC,
    handleCloseNPC,
    selectedDeadDragon,
    setSelectedDeadDragon,
    handleCloseDeadDragon,
    selectedFarmPlot,
    setSelectedFarmPlot,
    handleCloseCropPlot,
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
    showTerrain,
    setShowTerrain,
    handleToggleTerrain,
    zoom,
    handleZoomIn,
    handleZoomOut,
  };
}

export default useAppController;
