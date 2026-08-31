import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "../../app/store/useGameStore";
import { isWaterTile, isTreeTile, getMineralType, getMineralCss, gidToCss as terrainGidToCss, TILE, WORLD_TILES } from "../../game/world/Terrain";
import { FOG_VISION_RADIUS } from "../../game/systems/FogOfWarSystem";

export const WORLD_SIZE = 6144;
export const DEFAULT_MINI_SIZE = 145;
export const EXPANDED_MINI_SIZE = 240;

export type MiniMapPosition = "top-right" | "bottom-right";
const STORAGE_POS_KEY = "lordsvalley_minimap_position";
const STORAGE_VISIBLE_KEY = "lordsvalley_minimap_visible";
const STORAGE_FOG_ENABLED_KEY = "lordsvalley_fog_enabled_v1";
const STORAGE_FOG_EXPLORED_KEY = "lordsvalley_fog_explored_v1";

export function gidToColor(gid: number): string {
  return terrainGidToCss(gid);
}

// — Helpers niebla —

function getFogStorageKey(): string {
  try {
    const pid = localStorage.getItem("playerId") || (JSON.parse(localStorage.getItem("player") || "null")?.id) || localStorage.getItem("settlementId") || "global";
    return `${STORAGE_FOG_EXPLORED_KEY}_${pid}`;
  } catch {
    return STORAGE_FOG_EXPLORED_KEY;
  }
}

export function useMiniMap() {
  const chunks = useGameStore((s) => s.chunks);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados de configuración y controles
  const [isExpanded, setIsExpanded] = useState(false);
  const [miniZoom, setMiniZoom] = useState(1); // 1x a 4x
  const [showMissions, setShowMissions] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  // Niebla de guerra — exploración persistente minimapa
  const exploredRef = useRef<Set<number>>(new Set<number>());
  const [exploredTick, setExploredTick] = useState(0);
  const saveTimeoutRef = useRef<number | null>(null);
  const [fogEnabled, setFogEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_FOG_ENABLED_KEY);
      if (v !== null) return v !== "false";
    } catch {}
    return true; // por defecto NIEBLA ACTIVADA (mapa oscuro)
  });
  const [fogRadius, setFogRadius] = useState<number>(FOG_VISION_RADIUS);
  const fogTileRadius = Math.ceil(fogRadius / TILE);
  const fogTileRadiusSq = fogTileRadius * fogTileRadius;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_FOG_ENABLED_KEY, String(fogEnabled)); } catch {}
  }, [fogEnabled]);

  // Cargar exploración guardada al montar
  useEffect(() => {
    try {
      const key = getFogStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr: number[] = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          exploredRef.current = new Set(arr);
          setExploredTick((v) => v + 1);
        }
      }
      // Si no hay datos guardados, sembrar el spawn central para no iniciar 100% negro tras primera visita
      // El siguiente poll de playerPos añadirá el círculo inicial automáticamente
    } catch {}
  }, []);

  // Escuchar cambios de storage para sync entre pestañas / cambio de player
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(STORAGE_FOG_EXPLORED_KEY)) {
        try {
          if (e.newValue) {
            const arr: number[] = JSON.parse(e.newValue);
            exploredRef.current = new Set(arr);
            setExploredTick((v) => v + 1);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) return;
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const key = getFogStorageKey();
        const arr = Array.from(exploredRef.current);
        localStorage.setItem(key, JSON.stringify(arr));
      } catch {}
      saveTimeoutRef.current = null;
    }, 900);
  }, []);

  const markExploredAround = useCallback((worldX: number, worldY: number) => {
    const centerTx = Math.floor(worldX / TILE);
    const centerTy = Math.floor(worldY / TILE);
    let changed = false;
    for (let dy = -fogTileRadius; dy <= fogTileRadius; dy++) {
      for (let dx = -fogTileRadius; dx <= fogTileRadius; dx++) {
        if (dx * dx + dy * dy > fogTileRadiusSq) continue;
        const tx = centerTx + dx;
        const ty = centerTy + dy;
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) continue;
        const key = ty * WORLD_TILES + tx;
        if (!exploredRef.current.has(key)) {
          exploredRef.current.add(key);
          changed = true;
        }
      }
    }
    if (changed) {
      setExploredTick((v) => v + 1);
      scheduleSave();
    }
  }, [scheduleSave, fogTileRadius, fogTileRadiusSq]);

  // Posición y visibilidad (persistentes)
  const [position, setPosition] = useState<MiniMapPosition>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_POS_KEY) as MiniMapPosition | null;
        if (stored === "top-right" || stored === "bottom-right") return stored;
      }
    } catch {}
    return "bottom-right";
  });
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_VISIBLE_KEY);
        if (stored !== null) return stored !== "false";
      }
    } catch {}
    return true;
  });

  // Posiciones dinámicas
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number } | null>(null);
  const [npcsPos, setNpcsPos] = useState<Array<{ id: string; x: number; y: number; name?: string }>>([]);

  const currentSize = isExpanded ? EXPANDED_MINI_SIZE : DEFAULT_MINI_SIZE;

  // Persistencia de posición y visibilidad
  useEffect(() => {
    try { localStorage.setItem(STORAGE_POS_KEY, position); } catch {}
  }, [position]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_VISIBLE_KEY, String(isVisible)); } catch {}
  }, [isVisible]);

  // Polling de la posición del jugador y de los NPCs desde Phaser + actualizar niebla explorada
  useEffect(() => {
    const id = setInterval(() => {
      const p = (window as any).__PLAYER_POS__;
      if (p && typeof p.x === "number") {
        setPlayerPos({ x: p.x, y: p.y });
        if (fogEnabled) {
          markExploredAround(p.x, p.y);
        }
      }

      const npcs = (window as any).__NPCS_POS__;
      if (Array.isArray(npcs)) {
        setNpcsPos(npcs);
      }
    }, 100);
    return () => clearInterval(id);
  }, [fogEnabled, markExploredAround]);

  // Precarga chunks 6x6 = 6144
  useEffect(() => {
    const { getChunk } = useGameStore.getState();
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) {
        const key = `${x}:${y}`;
        if (!useGameStore.getState().chunks.has(key)) {
          getChunk(x, y).catch(() => {});
        }
      }
    }
  }, []);

  // Listeners globales para comandos de niebla (consola / debug)
  useEffect(() => {
    const onClear = () => {
      exploredRef.current.clear();
      setExploredTick((v) => v + 1);
      try { localStorage.removeItem(getFogStorageKey()); } catch {}
    };
    const onRevealAll = () => {
      // Revelar todo el mapa (192*192)
      for (let ty = 0; ty < WORLD_TILES; ty++) {
        for (let tx = 0; tx < WORLD_TILES; tx++) {
          exploredRef.current.add(ty * WORLD_TILES + tx);
        }
      }
      setExploredTick((v) => v + 1);
      scheduleSave();
    };
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === "boolean") setFogEnabled(detail.enabled);
      else setFogEnabled((v) => !v);
    };
    const onRadius = (e: Event) => {
      const detail = (e as CustomEvent<{ radius: number }>).detail;
      if (typeof detail?.radius === "number") setFogRadius(Math.max(32, Math.min(2000, detail.radius)));
    };
    window.addEventListener("phaser-fog-clear" as any, onClear as EventListener);
    window.addEventListener("phaser-fog-reveal-all" as any, onRevealAll as EventListener);
    window.addEventListener("phaser-fog-toggle" as any, onToggle as EventListener);
    window.addEventListener("phaser-fog-radius" as any, onRadius as EventListener);
    // Exponer API global
    (window as any).__MINIMAP_FOG_API__ = {
      clear: onClear,
      revealAll: onRevealAll,
      toggle: () => setFogEnabled((v) => !v),
      setEnabled: (v: boolean) => setFogEnabled(v),
      isEnabled: () => fogEnabled,
      setRadius: (r: number) => setFogRadius(r),
      getRadius: () => fogRadius,
      getExploredCount: () => exploredRef.current.size,
      getExploredPercent: () => ((exploredRef.current.size / (WORLD_TILES * WORLD_TILES)) * 100).toFixed(1),
    };
    return () => {
      window.removeEventListener("phaser-fog-clear" as any, onClear as EventListener);
      window.removeEventListener("phaser-fog-reveal-all" as any, onRevealAll as EventListener);
      window.removeEventListener("phaser-fog-toggle" as any, onToggle as EventListener);
      window.removeEventListener("phaser-fog-radius" as any, onRadius as EventListener);
      // No borrar __MINIMAP_FOG_API__ aquí si aún hay otra instancia? lo dejamos
    };
  }, [fogEnabled, scheduleSave, fogRadius]);

  // Renderizado del canvas minimapa con soporte de zoom + NIEBLA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, currentSize, currentSize);
    // Fondo negro de niebla base (si fog habilitado, todo negro inicial)
    ctx.fillStyle = fogEnabled ? "#000000" : "#060f14";
    ctx.fillRect(0, 0, currentSize, currentSize);

    // Si miniZoom > 1, el minimapa se centra en la posición del jugador
    const scale = (currentSize / WORLD_SIZE) * miniZoom;
    let offsetX = 0;
    let offsetY = 0;

    if (miniZoom > 1 && playerPos) {
      offsetX = currentSize / 2 - playerPos.x * scale;
      offsetY = currentSize / 2 - playerPos.y * scale;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Helper fog check
    const isExplored = (wx: number, wy: number): boolean => {
      if (!fogEnabled) return true;
      const k = wy * WORLD_TILES + wx;
      return exploredRef.current.has(k);
    };

    // 1. Dibuja terreno base + río + árboles (20-70% café) - detecta mismo Terrain que ChunkRenderer
    // Incluye NIEBLA: si tile no explorado -> negro, si explorado -> color real
    for (const chunk of chunks.values() as any) {
      const cx = chunk.chunkX as number;
      const cy = chunk.chunkY as number;
      const baseX = cx * 1024 * scale;
      const baseY = cy * 1024 * scale;
      const tileSize = Math.max(1, Math.ceil(32 * scale));

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const worldTileX = cx * 32 + x;
          const worldTileY = cy * 32 + y;
          if (fogEnabled && !isExplored(worldTileX, worldTileY)) {
            ctx.fillStyle = "#000000";
          } else {
            const mineral = getMineralType(worldTileX, worldTileY);
            if (isWaterTile(worldTileX, worldTileY)) {
              ctx.fillStyle = "#023e8a";
            } else if (mineral) {
              ctx.fillStyle = getMineralCss(mineral);
            } else if (isTreeTile(cx, cy, x, y)) {
              ctx.fillStyle = "#8b4513";
            } else {
              ctx.fillStyle = "#3a7d44";
            }
          }
          const px = baseX + x * 32 * scale;
          const py = baseY + y * 32 * scale;
          ctx.fillRect(px, py, tileSize, tileSize);
        }
      }
    }

    // Dibuja chunks aún no cargados para minimapa completo (mismo Terrain tile-level)
    for (let rx = 0; rx < 6; rx++) {
      for (let ry = 0; ry < 6; ry++) {
        const key = `${rx}:${ry}`;
        if (!chunks.has(key)) {
          const baseX = rx * 1024 * scale;
          const baseY = ry * 1024 * scale;
          const tileSize = Math.max(1, Math.ceil(32 * scale));
          for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
              const worldTileX = rx * 32 + x;
              const worldTileY = ry * 32 + y;
              if (fogEnabled && !isExplored(worldTileX, worldTileY)) {
                ctx.fillStyle = "#000000";
              } else {
                const mineral = getMineralType(worldTileX, worldTileY);
                if (isWaterTile(worldTileX, worldTileY)) ctx.fillStyle = "#023e8a";
                else if (mineral) ctx.fillStyle = getMineralCss(mineral);
                else if (isTreeTile(rx, ry, x, y)) ctx.fillStyle = "#8b4513";
                else ctx.fillStyle = "#3a7d44";
              }
              const px = baseX + x * 32 * scale;
              const py = baseY + y * 32 * scale;
              ctx.fillRect(px, py, tileSize, tileSize);
            }
          }
        }
      }
    }

    // 1b. Círculo de visión actual en minimapa (borde suave) — se dibuja después del terreno pero antes de entidades
    // Muestra el campo de visión actual incluso sobre niebla explorada, y ayuda a ver el radio
    if (fogEnabled && playerPos) {
      const visionR = fogRadius * scale;
      const px = playerPos.x * scale;
      const py = playerPos.y * scale;
      ctx.save();
      // Halo exterior suave de visión (transparente)
      const grad = ctx.createRadialGradient(px, py, visionR * 0.72, px, py, visionR);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.72, "rgba(255,255,255,0)");
      grad.addColorStop(0.88, "rgba(255,255,255,0.09)");
      grad.addColorStop(1, "rgba(255,255,255,0.18)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, visionR, 0, Math.PI * 2);
      ctx.fill();
      // Borde del círculo de visión
      ctx.strokeStyle = "rgba(180,210,255,0.35)";
      ctx.lineWidth = Math.max(0.8, 1.1 * Math.min(1.5, miniZoom));
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(px, py, visionR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 2. Misiones activas (si el filtro está activado) — solo visibles si la zona ya fue explorada o sin niebla
    if (showMissions) {
      const missionPoints = [{ x: 3072, y: 3072, label: "Refugio" }];
      for (const m of missionPoints) {
        const tx = Math.floor(m.x / TILE);
        const ty = Math.floor(m.y / TILE);
        if (fogEnabled && !isExplored(tx, ty)) continue; // ocultar misiones en niebla no explorada
        const mx = m.x * scale;
        const my = m.y * scale;
        ctx.save();
        ctx.fillStyle = "#ffcc00";
        ctx.strokeStyle = "#443300";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx, my - 5);
        ctx.lineTo(mx + 4, my);
        ctx.lineTo(mx, my + 5);
        ctx.lineTo(mx - 4, my);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Alertas / Zonas de peligro (si el filtro está activado) — idem filtrado por niebla
    if (showAlerts) {
      const alertPoints = [{ x: 4800, y: 2200, radius: 400 }];
      for (const a of alertPoints) {
        const atx = Math.floor(a.x / TILE);
        const aty = Math.floor(a.y / TILE);
        if (fogEnabled && !isExplored(atx, aty)) continue;
        const ax = a.x * scale;
        const ay = a.y * scale;
        const ar = a.radius * scale;
        ctx.save();
        ctx.strokeStyle = "rgba(255, 60, 60, 0.7)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(ax, ay, ar, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 60, 60, 0.12)";
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. NPCs activos reales generados en Phaser (verde brillante) — ocultar si están en niebla no explorada
    for (const npc of npcsPos) {
      if (fogEnabled) {
        const ntx = Math.floor(npc.x / TILE);
        const nty = Math.floor(npc.y / TILE);
        if (!isExplored(ntx, nty)) continue; // NPC fuera de zona explorada no se ve en minimapa
        // Además ocultar si está fuera del círculo de visión actual? No, debe permanecer si ya fue explorado
      }
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(npc.x * scale, npc.y * scale, 3 * Math.min(1.8, miniZoom), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#004d25";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 5. Jugador (punto y pulso rojo) — siempre visible
    if (playerPos) {
      const pr = 3.5 * Math.min(1.8, miniZoom);
      ctx.fillStyle = "#ff3b30";
      ctx.beginPath();
      ctx.arc(playerPos.x * scale, playerPos.y * scale, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Pulso exterior
      ctx.fillStyle = "rgba(255, 59, 48, 0.28)";
      ctx.beginPath();
      ctx.arc(playerPos.x * scale, playerPos.y * scale, pr * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [chunks, playerPos, npcsPos, currentSize, miniZoom, showMissions, showAlerts, exploredTick, fogEnabled, fogRadius]);

  // Click en minimapa cuadrado para mover cámara (esquinas visibles)
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

    let worldX: number;
    let worldY: number;

    const scale = (currentSize / WORLD_SIZE) * miniZoom;
    if (miniZoom > 1 && playerPos) {
      const offsetX = currentSize / 2 - playerPos.x * scale;
      const offsetY = currentSize / 2 - playerPos.y * scale;
      worldX = (e.clientX - rect.left - offsetX) / scale;
      worldY = (e.clientY - rect.top - offsetY) / scale;
    } else {
      worldX = ((e.clientX - rect.left) / currentSize) * WORLD_SIZE;
      worldY = ((e.clientY - rect.top) / currentSize) * WORLD_SIZE;
    }

    const clampedX = Math.max(0, Math.min(WORLD_SIZE, worldX));
    const clampedY = Math.max(0, Math.min(WORLD_SIZE, worldY));
    const chunkX = Math.floor(clampedX / 1024);
    const chunkY = Math.floor(clampedY / 1024);

    window.dispatchEvent(new CustomEvent("minimap-goto", { detail: { chunkX, chunkY } }));
    const cam = (window as any).__PHASER_CAMERA__ as Phaser.Cameras.Scene2D.Camera | undefined;
    if (cam) {
      cam.centerOn(clampedX, clampedY);
    } else {
      window.dispatchEvent(
        new CustomEvent("minimap-goto-world", { detail: { x: clampedX, y: clampedY } })
      );
    }
  };

  // Handlers de zoom y toggles
  const zoomIn = useCallback(() => {
    setMiniZoom((z) => Math.min(4, Number((z + 0.5).toFixed(1))));
  }, []);

  const zoomOut = useCallback(() => {
    setMiniZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))));
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleMissions = useCallback(() => {
    setShowMissions((prev) => !prev);
  }, []);

  const toggleAlerts = useCallback(() => {
    setShowAlerts((prev) => !prev);
  }, []);

  const togglePosition = useCallback(() => {
    setPosition((prev) => (prev === "bottom-right" ? "top-right" : "bottom-right"));
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const toggleFog = useCallback(() => {
    window.dispatchEvent(new CustomEvent("phaser-fog-toggle" as any, { detail: {} }));
  }, []);

  const clearFog = useCallback(() => {
    window.dispatchEvent(new CustomEvent("phaser-fog-clear" as any));
  }, []);

  const revealAllFog = useCallback(() => {
    window.dispatchEvent(new CustomEvent("phaser-fog-reveal-all" as any));
  }, []);

  return {
    canvasRef,
    currentSize,
    isExpanded,
    miniZoom,
    showMissions,
    showAlerts,
    position,
    isVisible,
    fogEnabled,
    exploredCount: exploredRef.current.size,
    exploredPercent: ((exploredRef.current.size / (WORLD_TILES * WORLD_TILES)) * 100).toFixed(1),
    toggleExpand,
    toggleMissions,
    toggleAlerts,
    togglePosition,
    toggleVisibility,
    toggleFog,
    clearFog,
    revealAllFog,
    setPosition,
    setIsVisible,
    zoomIn,
    zoomOut,
    setMiniZoom,
    handleMiniMapClick,
  };
}

export default useMiniMap;
