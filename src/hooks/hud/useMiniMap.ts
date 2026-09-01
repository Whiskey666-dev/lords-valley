import { useEffect, useRef, useState, useCallback } from "react";
import {
  isWaterTileFast,
  isTreeTile,
  getMineralTypeFast,
  getMineralCss,
  TILE,
  WORLD_TILES,
  ISO_TILE_W,
  ISO_TILE_H,
  ISO_WORLD_WIDTH,
  ISO_WORLD_HEIGHT,
  ISO_ORIGIN_X,
  tileToIso,
  isoToTile,
  worldToIso,
  noise
} from "../../game/world/Terrain";

export const FOG_VISION_RADIUS = 300;
export const WORLD_SIZE = 6144;
export const ISO_SIZE_W = ISO_WORLD_WIDTH; // 12288
export const ISO_SIZE_H = ISO_WORLD_HEIGHT; // 6144
export const DEFAULT_MINI_SIZE = 145;
export const EXPANDED_MINI_SIZE = 240;

export type MiniMapPosition = "top-right" | "bottom-right";
const STORAGE_POS_KEY = "lordsvalley_minimap_position";
const STORAGE_VISIBLE_KEY = "lordsvalley_minimap_visible";
const STORAGE_FOG_EXPLORED_KEY = "lordsvalley_fog_explored_v1";

function getFogStorageKey(): string {
  try {
    const pid = localStorage.getItem("playerId") || (JSON.parse(localStorage.getItem("player") || "null")?.id) || localStorage.getItem("settlementId") || "global";
    return `${STORAGE_FOG_EXPLORED_KEY}_${pid}`;
  } catch {
    return STORAGE_FOG_EXPLORED_KEY;
  }
}

export function useMiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [miniZoom, setMiniZoom] = useState(1);
  const [showMissions, setShowMissions] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  // Niebla de guerra exclusiva del minimapa (exploración persistente)
  const exploredRef = useRef<Set<number>>(new Set<number>());
  const [exploredTick, setExploredTick] = useState(0);
  const saveTimeoutRef = useRef<number | null>(null);
  const [fogEnabled, setFogEnabled] = useState<boolean>(true);
  const [fogRadius, setFogRadius] = useState<number>(FOG_VISION_RADIUS);
  const fogTileRadius = Math.ceil(fogRadius / TILE);
  const fogTileRadiusSq = fogTileRadius * fogTileRadius;

  const updateFogCanvas = useCallback(() => {
    const OFF_W = 600;
    const OFF_H = 300;
    let fCanvas = fogCanvasRef.current;
    if (!fCanvas) {
      fCanvas = document.createElement("canvas");
      fCanvas.width = OFF_W;
      fCanvas.height = OFF_H;
      fogCanvasRef.current = fCanvas;
    }
    const fCtx = fCanvas.getContext("2d");
    if (!fCtx) return;

    fCtx.clearRect(0, 0, OFF_W, OFF_H);
    fCtx.fillStyle = "rgba(4, 8, 13, 0.94)";
    fCtx.fillRect(0, 0, OFF_W, OFF_H);

    // Borrar las casillas exploradas instantáneamente
    fCtx.globalCompositeOperation = "destination-out";
    fCtx.fillStyle = "rgba(0, 0, 0, 1)";

    const scale = OFF_W / ISO_WORLD_WIDTH;
    const tileW = ISO_TILE_W * scale;
    const tileH = ISO_TILE_H * scale;
    const halfW = tileW / 2;
    const halfH = tileH / 2;

    fCtx.beginPath();
    for (const key of exploredRef.current) {
      const tx = key % WORLD_TILES;
      const ty = Math.floor(key / WORLD_TILES);
      const isoX = (tx - ty) * (ISO_TILE_W / 2) + ISO_ORIGIN_X - (ISO_TILE_W / 2);
      const isoY = (tx + ty) * (ISO_TILE_H / 2);
      const bx = isoX * scale;
      const by = isoY * scale;

      fCtx.moveTo(bx + halfW, by);
      fCtx.lineTo(bx + tileW, by + halfH);
      fCtx.lineTo(bx + halfW, by + tileH);
      fCtx.lineTo(bx, by + halfH);
      fCtx.closePath();
    }
    fCtx.fill();
    fCtx.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    try {
      const key = getFogStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr: number[] = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          exploredRef.current = new Set(arr);
          setExploredTick((v) => v + 1);
          updateFogCanvas();
        }
      }
    } catch {}
  }, [updateFogCanvas]);

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
      updateFogCanvas();
      scheduleSave();
    }
  }, [scheduleSave, fogTileRadius, fogTileRadiusSq, updateFogCanvas]);

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

  const [playerPos, setPlayerPos] = useState<{ x: number; y: number } | null>(null);
  const [npcsPos, setNpcsPos] = useState<Array<{ id: string; x: number; y: number; name?: string }>>([]);

  const currentSize = isExpanded ? EXPANDED_MINI_SIZE : DEFAULT_MINI_SIZE;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_POS_KEY, position); } catch {}
  }, [position]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_VISIBLE_KEY, String(isVisible)); } catch {}
  }, [isVisible]);

  useEffect(() => {
    const id = setInterval(() => {
      const p = (window as any).__PLAYER_POS__;
      if (p && typeof p.x === "number") {
        setPlayerPos({ x: p.x, y: p.y });
        const t = isoToTile(p.x, p.y);
        markExploredAround(t.tileX * TILE + TILE/2, t.tileY * TILE + TILE/2);
      }

      const npcs = (window as any).__NPCS_POS__;
      if (Array.isArray(npcs)) {
        setNpcsPos(npcs);
      }
    }, 100);
    return () => clearInterval(id);
  }, [markExploredAround]);

  // Pre-hornear el mapa isométrico base una sola vez al montar (0 re-renders, 0 lag, terreno permanente)
  useEffect(() => {
    const OFF_W = 600;
    const OFF_H = 300;
    let baseCanvas = baseCanvasRef.current;
    if (!baseCanvas) {
      baseCanvas = document.createElement("canvas");
      baseCanvas.width = OFF_W;
      baseCanvas.height = OFF_H;
      baseCanvasRef.current = baseCanvas;
    }
    const bCtx = baseCanvas.getContext("2d");
    if (!bCtx) return;

    bCtx.imageSmoothingEnabled = false;
    bCtx.fillStyle = "#04080d";
    bCtx.fillRect(0, 0, OFF_W, OFF_H);

    const scale = OFF_W / ISO_WORLD_WIDTH;
    const tileW = ISO_TILE_W * scale;
    const tileH = ISO_TILE_H * scale;
    const halfW = tileW / 2;
    const halfH = tileH / 2;

    // Fondo base diamante verde
    bCtx.fillStyle = "#2d5e35";
    bCtx.beginPath();
    bCtx.moveTo(OFF_W / 2, 0);
    bCtx.lineTo(OFF_W, OFF_H / 2);
    bCtx.lineTo(OFF_W / 2, OFF_H);
    bCtx.lineTo(0, OFF_H / 2);
    bCtx.closePath();
    bCtx.fill();

    const batches = new Map<string, Array<{ x: number; y: number }>>();

    for (let ty = 0; ty < WORLD_TILES; ty++) {
      for (let tx = 0; tx < WORLD_TILES; tx++) {
        const cx = (tx / 32) | 0;
        const cy = (ty / 32) | 0;
        const lx = tx & 31;
        const ly = ty & 31;

        let css: string | null = null;
        const mineral = getMineralTypeFast(tx, ty);

        if (isWaterTileFast(tx, ty)) {
          css = "#023e8a";
        } else if (mineral) {
          css = getMineralCss(mineral);
        } else if (isTreeTile(cx, cy, lx, ly)) {
          css = "#8b4513";
        } else {
          const n = noise(cx, cy, lx, ly);
          if (n > 0.4) css = "#3b7a45";
          else if (n < -0.3) css = "#244d2b";
        }

        if (!css) continue;

        const isoX = (tx - ty) * (ISO_TILE_W / 2) + ISO_ORIGIN_X - (ISO_TILE_W / 2);
        const isoY = (tx + ty) * (ISO_TILE_H / 2);
        const bx = isoX * scale;
        const by = isoY * scale;

        let arr = batches.get(css);
        if (!arr) {
          arr = [];
          batches.set(css, arr);
        }
        arr.push({ x: bx, y: by });
      }
    }

    for (const [color, points] of batches) {
      bCtx.fillStyle = color;
      bCtx.beginPath();
      for (const p of points) {
        bCtx.moveTo(p.x + halfW, p.y);
        bCtx.lineTo(p.x + tileW, p.y + halfH);
        bCtx.lineTo(p.x + halfW, p.y + tileH);
        bCtx.lineTo(p.x, p.y + halfH);
        bCtx.closePath();
      }
      bCtx.fill();
    }
  }, []); // Hornear una sola vez al inicio: terreno 100% permanente e inmutable

  useEffect(() => {
    const onClear = () => {
      exploredRef.current.clear();
      setExploredTick((v) => v + 1);
      updateFogCanvas();
      try { localStorage.removeItem(getFogStorageKey()); } catch {}
    };
    const onRevealAll = () => {
      for (let ty = 0; ty < WORLD_TILES; ty++) {
        for (let tx = 0; tx < WORLD_TILES; tx++) {
          exploredRef.current.add(ty * WORLD_TILES + tx);
        }
      }
      setExploredTick((v) => v + 1);
      updateFogCanvas();
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
    };
  }, [fogEnabled, scheduleSave, fogRadius, updateFogCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    const fogCanvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, currentSize, currentSize);
    ctx.fillStyle = "#04080d";
    ctx.fillRect(0, 0, currentSize, currentSize);

    const isoScale = (currentSize / ISO_WORLD_WIDTH) * miniZoom;
    const baseOffsetY = (currentSize - ISO_WORLD_HEIGHT * (currentSize / ISO_WORLD_WIDTH)) / 2;
    let offsetX = 0;
    let offsetY = baseOffsetY;
    if (miniZoom > 1 && playerPos) {
      offsetX = currentSize / 2 - playerPos.x * isoScale;
      offsetY = currentSize / 2 - playerPos.y * isoScale;
      const maxOffsetX = currentSize / 2;
      const minOffsetX = currentSize / 2 - ISO_WORLD_WIDTH * isoScale;
      const maxOffsetY = currentSize / 2;
      const minOffsetY = currentSize / 2 - ISO_WORLD_HEIGHT * isoScale;
      offsetX = Math.max(minOffsetX - baseOffsetY, Math.min(maxOffsetX + baseOffsetY, offsetX));
      offsetY = Math.max(minOffsetY, Math.min(maxOffsetY + baseOffsetY * 2, offsetY));
    }

    ctx.save();

    // 1) Dibujar terreno base permanente
    if (baseCanvas) {
      ctx.drawImage(
        baseCanvas,
        0, 0, baseCanvas.width, baseCanvas.height,
        offsetX, offsetY, ISO_WORLD_WIDTH * isoScale, ISO_WORLD_HEIGHT * isoScale
      );
    }

    // 2) Dibujar niebla de guerra exclusiva del minimapa
    if (fogEnabled && fogCanvas) {
      ctx.drawImage(
        fogCanvas,
        0, 0, fogCanvas.width, fogCanvas.height,
        offsetX, offsetY, ISO_WORLD_WIDTH * isoScale, ISO_WORLD_HEIGHT * isoScale
      );

      // Círculo de visión del jugador en minimapa
      if (playerPos) {
        const visionR = fogRadius * isoScale;
        const px = playerPos.x * isoScale + offsetX;
        const py = playerPos.y * isoScale + offsetY;
        ctx.strokeStyle = "rgba(212,175,55,0.7)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(px, py, visionR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const isExplored = (tx: number, ty: number): boolean => {
      if (!fogEnabled) return true;
      return exploredRef.current.has(ty * WORLD_TILES + tx);
    };

    // 3) Misiones
    if (showMissions) {
      const missionIso = tileToIso(96, 96);
      const mIsoX = missionIso.x + ISO_TILE_W / 2;
      const mIsoY = missionIso.y + ISO_TILE_H / 2;
      if (!fogEnabled || isExplored(96, 96)) {
        const mx = mIsoX * isoScale + offsetX;
        const my = mIsoY * isoScale + offsetY;
        ctx.fillStyle = "#ffd700";
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
      }
    }

    // 4) Alertas
    if (showAlerts) {
      const alertIso = worldToIso(4800, 2200);
      const atx = Math.floor(4800 / TILE);
      const aty = Math.floor(2200 / TILE);
      if (!fogEnabled || isExplored(atx, aty)) {
        const ax = alertIso.x * isoScale + offsetX;
        const ay = alertIso.y * isoScale + offsetY;
        const ar = 400 * isoScale;
        ctx.strokeStyle = "rgba(255, 60, 60, 0.8)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(ax, ay, ar, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 60, 60, 0.15)";
        ctx.fill();
        ctx.setLineDash([]);
      }
    }

    // 5) NPCs
    for (const npc of npcsPos) {
      if (fogEnabled) {
        const { tileX: ntx, tileY: nty } = isoToTile(npc.x, npc.y);
        if (!isExplored(ntx, nty)) continue;
      }
      const nx = npc.x * isoScale + offsetX;
      const ny = npc.y * isoScale + offsetY;
      if (nx < -4 || nx > currentSize + 4 || ny < -4 || ny > currentSize + 4) continue;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(nx, ny, 3 * Math.min(1.8, miniZoom), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#004d25";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 6) Jugador
    if (playerPos) {
      const pr = 3.5 * Math.min(1.8, miniZoom);
      const px = playerPos.x * isoScale + offsetX;
      const py = playerPos.y * isoScale + offsetY;
      ctx.fillStyle = "#ff3b30";
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 59, 48, 0.28)";
      ctx.beginPath();
      ctx.arc(px, py, pr * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [playerPos, npcsPos, currentSize, miniZoom, showMissions, showAlerts, exploredTick, fogEnabled, fogRadius]);

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isoScale = (currentSize / ISO_WORLD_WIDTH) * miniZoom;
    const baseOffsetY = (currentSize - ISO_WORLD_HEIGHT * (currentSize / ISO_WORLD_WIDTH)) / 2;
    let offsetX = 0;
    let offsetY = baseOffsetY;
    if (miniZoom > 1 && playerPos) {
      offsetX = currentSize / 2 - playerPos.x * isoScale;
      offsetY = currentSize / 2 - playerPos.y * isoScale;
    }
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const isoX = (canvasX - offsetX) / isoScale;
    const isoY = (canvasY - offsetY) / isoScale;
    const clampedX = Math.max(0, Math.min(ISO_WORLD_WIDTH, isoX));
    const clampedY = Math.max(0, Math.min(ISO_WORLD_HEIGHT, isoY));
    const { tileX, tileY } = isoToTile(clampedX, clampedY);
    const chunkX = Math.floor(tileX / 32);
    const chunkY = Math.floor(tileY / 32);
    window.dispatchEvent(new CustomEvent("minimap-goto", { detail: { chunkX, chunkY } }));
    const cam = (window as any).__PHASER_CAMERA__ as Phaser.Cameras.Scene2D.Camera | undefined;
    if (cam) {
      cam.centerOn(clampedX, clampedY);
    } else {
      window.dispatchEvent(new CustomEvent("minimap-goto-world", { detail: { x: clampedX, y: clampedY } }));
    }
  };

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
