import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "../../app/store/useGameStore";
import { isWaterTile, isTreeTile, getMineralType, getMineralCss, gidToCss as terrainGidToCss } from "../../game/world/Terrain";

export const WORLD_SIZE = 6144;
export const DEFAULT_MINI_SIZE = 145;
export const EXPANDED_MINI_SIZE = 240;

export type MiniMapPosition = "top-right" | "bottom-right";
const STORAGE_POS_KEY = "lordsvalley_minimap_position";
const STORAGE_VISIBLE_KEY = "lordsvalley_minimap_visible";

export function gidToColor(gid: number): string {
  return terrainGidToCss(gid);
}

export function useMiniMap() {
  const chunks = useGameStore((s) => s.chunks);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados de configuración y controles
  const [isExpanded, setIsExpanded] = useState(false);
  const [miniZoom, setMiniZoom] = useState(1); // 1x a 4x
  const [showMissions, setShowMissions] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

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

  // Polling de la posición del jugador y de los NPCs desde Phaser
  useEffect(() => {
    const id = setInterval(() => {
      const p = (window as any).__PLAYER_POS__;
      if (p && typeof p.x === "number") {
        setPlayerPos({ x: p.x, y: p.y });
      }

      const npcs = (window as any).__NPCS_POS__;
      if (Array.isArray(npcs)) {
        setNpcsPos(npcs);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

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

  // Renderizado del canvas minimapa con soporte de zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, currentSize, currentSize);
    ctx.fillStyle = "#060f14";
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

    // 1. Dibuja terreno base + río + árboles (20-70% café) - detecta mismo Terrain que ChunkRenderer
    for (const chunk of chunks.values() as any) {
      const cx = chunk.chunkX as number;
      const cy = chunk.chunkY as number;
      const baseX = cx * 1024 * scale;
      const baseY = cy * 1024 * scale;
      const tileSize = Math.max(1, Math.ceil(32 * scale));

      // Base por tile: agua > mineral veta > árbol 20-70% > verde
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const worldTileX = cx * 32 + x;
          const worldTileY = cy * 32 + y;
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
              const mineral = getMineralType(worldTileX, worldTileY);
              if (isWaterTile(worldTileX, worldTileY)) ctx.fillStyle = "#023e8a";
              else if (mineral) ctx.fillStyle = getMineralCss(mineral);
              else if (isTreeTile(rx, ry, x, y)) ctx.fillStyle = "#8b4513";
              else ctx.fillStyle = "#3a7d44";
              const px = baseX + x * 32 * scale;
              const py = baseY + y * 32 * scale;
              ctx.fillRect(px, py, tileSize, tileSize);
            }
          }
        }
      }
    }

    // 2. Misiones activas (si el filtro está activado)
    if (showMissions) {
      // Marcador de objetivo principal (ej. campamento o zona de exploración)
      const missionPoints = [{ x: 3072, y: 3072, label: "Refugio" }];
      for (const m of missionPoints) {
        const mx = m.x * scale;
        const my = m.y * scale;
        ctx.save();
        ctx.fillStyle = "#ffcc00";
        ctx.strokeStyle = "#443300";
        ctx.lineWidth = 1;
        // Icono de rombo/diamante para misiones
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

    // 3. Alertas / Zonas de peligro (si el filtro está activado)
    if (showAlerts) {
      const alertPoints = [{ x: 4800, y: 2200, radius: 400 }];
      for (const a of alertPoints) {
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

    // 4. NPCs activos reales generados en Phaser (verde brillante)
    for (const npc of npcsPos) {
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(npc.x * scale, npc.y * scale, 3 * Math.min(1.8, miniZoom), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#004d25";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 5. Jugador (punto y pulso rojo)
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
  }, [chunks, playerPos, npcsPos, currentSize, miniZoom, showMissions, showAlerts]);

  // Click en minimapa para mover cámara
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left - currentSize / 2;
    const cy = e.clientY - rect.top - currentSize / 2;
    const dist = Math.hypot(cx, cy);
    if (dist > currentSize / 2) return;

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

  return {
    canvasRef,
    currentSize,
    isExpanded,
    miniZoom,
    showMissions,
    showAlerts,
    position,
    isVisible,
    toggleExpand,
    toggleMissions,
    toggleAlerts,
    togglePosition,
    toggleVisibility,
    setPosition,
    setIsVisible,
    zoomIn,
    zoomOut,
    setMiniZoom,
    handleMiniMapClick,
  };
}

export default useMiniMap;
