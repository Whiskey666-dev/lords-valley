import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WORLD_W,
  WORLD_H,
  GAME_SIZE,
  SECTOR_X,
  SECTOR_Y,
  WORLD_REGIONS,
  generateMap,
} from './worldMapProcedural';

export interface WorldMapFilters {
  resources: boolean;
  anomalies: boolean;
  territorial: boolean;
}

export interface NpcMapPin {
  id: string;
  name: string;
  profession: string;
  x: number;
  y: number;
}

interface UseWorldMapProps {
  onClose?: () => void;
}

export function useWorldMap({ onClose }: UseWorldMapProps = {}) {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number } | null>(null);
  const [npcs, setNpcs] = useState<NpcMapPin[]>([]);
  const [filters, setFilters] = useState<WorldMapFilters>({
    resources: false,
    anomalies: false,
    territorial: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Semilla aleatoria generada una sola vez por sesión
  const [seed] = useState<number>(() => Math.random() * 99999 + 1);
  const [camZoom, setCamZoom] = useState(1);
  const [camCenter, setCamCenter] = useState({
    x: SECTOR_X / WORLD_W,
    y: SECTOR_Y / WORLD_H,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const rafRef = useRef<number>(0);
  const viewRef = useRef({ srcX: 0, srcY: 0, visW: WORLD_W, visH: WORLD_H });
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startCx: 0.5,
    startCy: 0.5,
  });

  // Polling de posición del jugador y NPCs desde Phaser
  useEffect(() => {
    const id = setInterval(() => {
      const p = (window as any).__PLAYER_POS__;
      if (p && typeof p.x === 'number') setPlayerPos({ x: p.x, y: p.y });
      const npcArr = (window as any).__NPCS_POS__;
      if (Array.isArray(npcArr)) setNpcs(npcArr);
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Generar mapa al montar en segundo plano
  useEffect(() => {
    bitmapRef.current = null;
    const id = setTimeout(async () => {
      const off = document.createElement('canvas');
      off.width = WORLD_W;
      off.height = WORLD_H;
      off.getContext('2d')!.putImageData(generateMap(seed), 0, 0);
      bitmapRef.current = await createImageBitmap(off);
    }, 0);
    return () => clearTimeout(id);
  }, [seed]);

  // Ajustar dimensiones del canvas al contenedor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // Evento rueda del ratón para zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      setCamZoom((z) => Math.max(1, Math.min(64, z * factor)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Arrastre con el cursor para panear
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startCx: camCenter.x,
      startCy: camCenter.y,
    };
  }, [camCenter]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const { visW, visH } = viewRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    const dx = (((e.clientX - d.startX) / cw) * visW) / WORLD_W;
    const dy = (((e.clientY - d.startY) / ch) * visH) / WORLD_H;
    setCamCenter({
      x: Math.max(0, Math.min(1, d.startCx - dx)),
      y: Math.max(0, Math.min(1, d.startCy - dy)),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  // Bucle de renderizado RAF en Canvas
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const bitmap = bitmapRef.current;
      if (!canvas || !bitmap) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Rango visible del mundo
      const visW = WORLD_W / camZoom;
      const visH = visW * (ch / cw);
      let srcX = camCenter.x * WORLD_W - visW / 2;
      let srcY = camCenter.y * WORLD_H - visH / 2;
      srcX = Math.max(0, Math.min(WORLD_W - visW, srcX));
      srcY = Math.max(0, Math.min(WORLD_H - visH, srcY));
      viewRef.current = { srcX, srcY, visW, visH };

      // Fondo oceánico
      ctx.fillStyle = '#030c1a';
      ctx.fillRect(0, 0, cw, ch);

      // Mapa de biomas PIXELADO (sin suavizado)
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bitmap, srcX, srcY, visW, visH, 0, 0, cw, ch);

      // Conversor de coordenadas de mundo a canvas
      const toC = (wx: number, wy: number): [number, number] => [
        ((wx - srcX) / visW) * cw,
        ((wy - srcY) / visH) * ch,
      ];

      const sectorPx = cw / visW; // píxeles de canvas por sector

      // ── Grid de sectores (visible al hacer zoom) ──
      if (sectorPx >= 2.5) {
        const alpha = Math.min(0.28, (sectorPx - 2.5) / 18);
        ctx.strokeStyle = `rgba(210,210,210,${alpha})`;
        ctx.lineWidth = 0.5;
        for (let gx = Math.ceil(srcX); gx <= Math.floor(srcX + visW); gx++) {
          const [cx2] = toC(gx, srcY);
          ctx.beginPath();
          ctx.moveTo(cx2, 0);
          ctx.lineTo(cx2, ch);
          ctx.stroke();
        }
        for (let gy = Math.ceil(srcY); gy <= Math.floor(srcY + visH); gy++) {
          const [, cy2] = toC(srcX, gy);
          ctx.beginPath();
          ctx.moveTo(0, cy2);
          ctx.lineTo(cw, cy2);
          ctx.stroke();
        }
      }

      // ── Sector activo (Valle de Jasper) ──
      const [asx, asy] = toC(SECTOR_X, SECTOR_Y);
      const [aex, aey] = toC(SECTOR_X + 1, SECTOR_Y + 1);
      const asw = aex - asx;
      const ash = aey - asy;
      if (asw > 0 && asx < cw && asy < ch) {
        ctx.fillStyle = 'rgba(255,230,60,0.10)';
        ctx.fillRect(asx, asy, asw, ash);
        ctx.strokeStyle = 'rgba(255,218,48,0.90)';
        ctx.lineWidth = Math.max(1, sectorPx * 0.07);
        ctx.setLineDash(sectorPx > 10 ? [3, 2] : []);
        ctx.strokeRect(asx, asy, asw, ash);
        ctx.setLineDash([]);
        if (sectorPx > 14) {
          const fs = Math.min(11, sectorPx * 0.22);
          ctx.font = `${fs}px monospace`;
          ctx.fillStyle = 'rgba(255,218,48,0.92)';
          ctx.textAlign = 'left';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 3;
          ctx.fillText('▶ Valle de Jasper', asx + 2, asy - 3);
          ctx.shadowBlur = 0;
        }
      }

      // ── Etiquetas de regiones (se desvanecen al hacer zoom) ──
      if (camZoom < 12) {
        const la = Math.min(1, (12 - camZoom) / 6);
        ctx.save();
        ctx.globalAlpha = la;
        ctx.textAlign = 'center';
        for (const reg of WORLD_REGIONS) {
          const [lx, ly] = toC(reg.nx * WORLD_W, reg.ny * WORLD_H);
          if (lx < -60 || lx > cw + 60 || ly < -20 || ly > ch + 20) continue;
          if (reg.title) {
            ctx.font = `800 ${Math.max(10, Math.floor(ch / 44))}px Georgia, serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#e8d4a0';
            ctx.fillText(reg.name, lx, ly);
          } else {
            const fs = reg.major
              ? Math.max(8, Math.floor(ch / 68))
              : Math.max(7, Math.floor(ch / 90));
            ctx.font = `${reg.major ? '600' : '400'} ${fs}px system-ui, sans-serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.92)';
            ctx.shadowBlur = 3;
            ctx.fillStyle = reg.major ? '#ede4cc' : '#a09888';
            ctx.fillText(reg.name, lx, ly);
          }
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ── Filtro: Recursos ──
      if (filters.resources) {
        const pts = [
          [0.22, 0.30],
          [0.30, 0.17],
          [0.72, 0.24],
          [0.52, 0.70],
          [0.14, 0.55],
          [0.82, 0.52],
          [0.40, 0.38],
          [0.67, 0.80],
        ];
        const r = Math.max(2.5, sectorPx * 0.25);
        for (const [nx2, ny2] of pts) {
          const [px2, py2] = toC(nx2 * WORLD_W, ny2 * WORLD_H);
          if (px2 < 0 || px2 > cw || py2 < 0 || py2 > ch) continue;
          const g = ctx.createRadialGradient(px2, py2, 0, px2, py2, r * 2.5);
          g.addColorStop(0, 'rgba(255,215,0,0.6)');
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px2, py2, r * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(px2, py2, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Filtro: Anomalías ──
      if (filters.anomalies) {
        const pts = [
          [0.57, 0.27],
          [0.18, 0.82],
          [0.90, 0.66],
        ];
        const r = Math.max(4, sectorPx * 0.3);
        for (const [nx2, ny2] of pts) {
          const [px2, py2] = toC(nx2 * WORLD_W, ny2 * WORLD_H);
          if (px2 < 0 || px2 > cw || py2 < 0 || py2 > ch) continue;
          ctx.save();
          ctx.strokeStyle = '#b044ff';
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(px2, py2, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#b044ff';
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(px2, py2, r * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }

      // ── Filtro: Territorios ──
      if (filters.territorial) {
        const territories = [
          { nx2: 0.40, ny2: 0.44, rS: 7, color: '#4a90e2', name: 'Ducado de Jasper' },
          { nx2: 0.20, ny2: 0.45, rS: 5, color: '#22aa66', name: 'Territorio Eldara' },
          { nx2: 0.78, ny2: 0.40, rS: 6, color: '#cc6622', name: 'Dominio Krath' },
        ];
        for (const t of territories) {
          const [tx, ty] = toC(t.nx2 * WORLD_W, t.ny2 * WORLD_H);
          const [tx2] = toC(t.nx2 * WORLD_W + t.rS, t.ny2 * WORLD_H);
          const tr = Math.abs(tx2 - tx);
          if (tr < 1) continue;
          ctx.save();
          const g2 = ctx.createRadialGradient(tx, ty, 0, tx, ty, tr);
          g2.addColorStop(0, t.color);
          g2.addColorStop(1, 'transparent');
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 0.9;
          ctx.font = '9px system-ui,sans-serif';
          ctx.fillStyle = t.color;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 3;
          ctx.fillText(t.name, tx, ty - tr - 4);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }

      // ── Marcadores de NPCs ──
      for (const npc of npcs) {
        const [nx2, ny2] = toC(
          SECTOR_X + npc.x / GAME_SIZE,
          SECTOR_Y + npc.y / GAME_SIZE
        );
        if (nx2 < -5 || nx2 > cw + 5 || ny2 < -5 || ny2 > ch + 5) continue;
        const r = Math.max(2.5, sectorPx * 0.07);
        ctx.fillStyle = '#00ff88';
        ctx.strokeStyle = '#004d25';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(nx2, ny2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // ── Marcador del jugador ──
      if (playerPos) {
        const [px2, py2] = toC(
          SECTOR_X + playerPos.x / GAME_SIZE,
          SECTOR_Y + playerPos.y / GAME_SIZE
        );
        if (px2 >= -10 && px2 <= cw + 10 && py2 >= -10 && py2 <= ch + 10) {
          const r = Math.max(4, sectorPx * 0.09);
          const glow = ctx.createRadialGradient(px2, py2, 0, px2, py2, r * 3.5);
          glow.addColorStop(0, 'rgba(255,60,40,0.55)');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px2, py2, r * 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff3b28';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(px2, py2, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (sectorPx > 6) {
            const arm = r * 2.2;
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(px2 - arm, py2);
            ctx.lineTo(px2 + arm, py2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px2, py2 - arm);
            ctx.lineTo(px2, py2 + arm);
            ctx.stroke();
          }
        }
      }

      // Borde del mapa
      ctx.strokeStyle = 'rgba(60,45,30,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, cw - 2, ch - 2);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [camZoom, camCenter, playerPos, npcs, filters]);

  // Controles de zoom y posición
  const zoomIn = useCallback(() => {
    setCamZoom((z) => Math.min(64, z * 1.5));
  }, []);

  const zoomOut = useCallback(() => {
    setCamZoom((z) => Math.max(1, z / 1.5));
  }, []);

  const resetCenter = useCallback(() => {
    setCamCenter({ x: SECTOR_X / WORLD_W, y: SECTOR_Y / WORLD_H });
    setCamZoom(1);
  }, []);

  const toggleFilter = useCallback((key: keyof WorldMapFilters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleShowFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const closeFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  // Manejador tecla ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFilters) closeFilters();
        else if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showFilters, closeFilters]);

  const zoomPct = Math.round(camZoom * 100);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return {
    canvasRef,
    playerPos,
    npcs,
    filters,
    showFilters,
    seed,
    zoomPct,
    activeFilterCount,
    toggleFilter,
    toggleShowFilters,
    closeFilters,
    zoomIn,
    zoomOut,
    resetCenter,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

export default useWorldMap;
