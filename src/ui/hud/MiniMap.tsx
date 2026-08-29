import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../app/store/useGameStore';

const WORLD_SIZE = 6144;
const MINI_SIZE = 140;
const SCALE = MINI_SIZE / WORLD_SIZE;

function gidToColor(gid: number): string {
  if (gid === 1) return '#2d5a27';
  if (gid === 2) return '#8b7355';
  if (gid === 5) return '#1a4d1a';
  if (gid === 101) return '#5a5a5a';
  if (gid === 102) return '#2e86ab';
  return '#2d5a27';
}

export function MiniMap() {
  const chunks = useGameStore((s) => s.chunks);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const p = (window as any).__PLAYER_POS__;
      if (p && typeof p.x === 'number') setPlayerPos({ x: p.x, y: p.y });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Precarga todo el mundo 6x6 = 6144 para que no queden partes negras
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, MINI_SIZE, MINI_SIZE);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, MINI_SIZE, MINI_SIZE);

    // Draw chunks real tiles scaled
    for (const chunk of chunks.values() as any) {
      const tiles: number[][] = chunk.tiles ?? [];
      const baseX = chunk.chunkX * 1024 * SCALE;
      const baseY = chunk.chunkY * 1024 * SCALE;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const gid = tiles[y]?.[x] ?? 1;
          ctx.fillStyle = gidToColor(gid);
          const px = baseX + x * 32 * SCALE;
          const py = baseY + y * 32 * SCALE;
          const s = Math.max(1, 32 * SCALE);
          ctx.fillRect(px, py, s, s);
        }
      }
      // resources tiny yellow
      for (const r of (chunk.resources ?? [])) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(r.posX * SCALE, r.posY * SCALE, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Survivors no se renderizan en minimapa — solo Player (core viene sin mock)
    // Player dot
    if (playerPos) {
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath();
      ctx.arc(playerPos.x * SCALE, playerPos.y * SCALE, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // pulso
      ctx.fillStyle = 'rgba(255,59,48,0.25)';
      ctx.beginPath();
      ctx.arc(playerPos.x * SCALE, playerPos.y * SCALE, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [chunks, playerPos]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left - MINI_SIZE / 2;
    const cy = e.clientY - rect.top - MINI_SIZE / 2;
    // clamp to circle
    const dist = Math.hypot(cx, cy);
    if (dist > MINI_SIZE / 2) return;
    const worldX = (e.clientX - rect.left) / MINI_SIZE * WORLD_SIZE;
    const worldY = (e.clientY - rect.top) / MINI_SIZE * WORLD_SIZE;
    // convertir a chunk para compatibilidad, pero también centerOn directo si está en modo libre
    const chunkX = Math.floor(worldX / 1024);
    const chunkY = Math.floor(worldY / 1024);
    window.dispatchEvent(new CustomEvent('minimap-goto', { detail: { chunkX, chunkY } }));
    // modo preciso: centerOn directo si MainScene escucha world
    const cam = (window as any).__PHASER_CAMERA__ as Phaser.Cameras.Scene2D.Camera | undefined;
    if (cam) cam.centerOn(worldX, worldY);
    else {
      // fallback directo via custom event world
      window.dispatchEvent(new CustomEvent('minimap-goto-world', { detail: { x: worldX, y: worldY } }));
    }
  };

  if (chunks.size === 0 && !playerPos) {
    return (
      <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 15 }}>
        <div onClick={handleClick} style={{ width: MINI_SIZE, height: MINI_SIZE, borderRadius: '50%', background: '#0a0a0a', border: '2px solid #444', overflow: 'hidden', position: 'relative', cursor: 'crosshair', boxShadow: '0 4px 12px #00000099' }}>
          <canvas ref={canvasRef} width={MINI_SIZE} height={MINI_SIZE} style={{ width: MINI_SIZE, height: MINI_SIZE, display: 'block' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        onClick={handleClick}
        title="Click para mover cámara (modo libre Y)"
        style={{
          width: MINI_SIZE,
          height: MINI_SIZE,
          borderRadius: '50%',
          background: '#000000',
          border: '2px solid #555',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'crosshair',
          boxShadow: '0 4px 16px #000000cc, inset 0 0 8px #000000',
        }}
      >
        <canvas ref={canvasRef} width={MINI_SIZE} height={MINI_SIZE} style={{ width: MINI_SIZE, height: MINI_SIZE, display: 'block' }} />
        {/* borde interior circular */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        {/* cruz centro */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: 1, background: 'rgba(255,255,255,0.15)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1, height: 6, background: 'rgba(255,255,255,0.15)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
