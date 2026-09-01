import { useEffect, useState } from "react";
import { getMineralType, getMineralCss, getMineralDisplayName, getMineralDescription, WORLD_TILES, isoToTile } from "../../game/world/Terrain";
import { useGameStore } from "../../app/store/useGameStore";

interface TooltipData {
  screenX: number;
  screenY: number;
  type: string;
  label: string;
  css: string;
  desc: string;
  tileX: number;
  tileY: number;
}

export function MineralTooltip() {
  const [data, setData] = useState<TooltipData | null>(null);

  useEffect(() => {
    let hideTimeout: number | null = null;

    const showForMineralAt = (clientX: number, clientY: number) => {
      const cam = (window as any).__PHASER_CAMERA__ as Phaser.Cameras.Scene2D.Camera | undefined;
      if (!cam) {
        setData(null);
        return;
      }
      try {
        const canvas = document.querySelector("#game-container canvas") as HTMLCanvasElement | null;
        let canvasX = clientX;
        let canvasY = clientY;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
            setData(null);
            return;
          }
          canvasX = clientX - rect.left;
          canvasY = clientY - rect.top;
          const scaleX = (cam.width || rect.width) / rect.width;
          const scaleY = (cam.height || rect.height) / rect.height;
          if (Math.abs(scaleX - 1) > 0.02) canvasX *= scaleX;
          if (Math.abs(scaleY - 1) > 0.02) canvasY *= scaleY;
        }

        const worldPoint = cam.getWorldPoint(canvasX, canvasY);
        const { tileX: tx, tileY: ty } = isoToTile(worldPoint.x, worldPoint.y);

        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) {
          setData(null);
          return;
        }

        // Buscar tipo de mineral
        let type: string | null = null;
        try {
          const chunkX = Math.floor(tx / 32);
          const chunkY = Math.floor(ty / 32);
          const chunk = (useGameStore as any).getState?.().chunks?.get?.(`${chunkX}:${chunkY}`);
          if (chunk && Array.isArray(chunk.tiles)) {
            const gid = chunk.tiles[ty % 32]?.[tx % 32];
            const gidMap: Record<number, string> = { 30: "COBRE", 31: "ESTANO", 32: "HIERRO", 33: "PLATA", 34: "ORO", 35: "CARBON" };
            type = gidMap[gid] ?? null;
          }
        } catch {}

        if (!type) {
          type = getMineralType(tx, ty);
        }

        if (!type) {
          setData(null);
          return;
        }

        const css = getMineralCss(type);
        const label = getMineralDisplayName(type);
        const desc = getMineralDescription(type);
        setData({
          screenX: clientX,
          screenY: clientY,
          type,
          label,
          css,
          desc,
          tileX: tx,
          tileY: ty,
        });

        if (hideTimeout) window.clearTimeout(hideTimeout);
        hideTimeout = window.setTimeout(() => setData(null), 5000);
      } catch {
        setData(null);
      }
    };

    const onLeftClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      const isCanvas = !!target.closest("canvas");
      const isGameContainer = !!target.closest("#game-container");
      if (!isCanvas && !isGameContainer) {
        setData(null);
        return;
      }
      showForMineralAt(e.clientX, e.clientY);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setData(null);
    };

    window.addEventListener("click", onLeftClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onLeftClick);
      window.removeEventListener("keydown", onKeyDown);
      if (hideTimeout) window.clearTimeout(hideTimeout);
    };
  }, []);

  if (!data) return null;

  const offsetX = 14;
  const offsetY = 18;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
  const tooltipW = 230;
  const tooltipH = 80;
  let left = data.screenX + offsetX;
  let top = data.screenY + offsetY;
  if (left + tooltipW > viewportW - 8) left = data.screenX - tooltipW - 8;
  if (top + tooltipH > viewportH - 8) top = data.screenY - tooltipH - 8;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 60,
        pointerEvents: "none",
        background: "#0c1017f5",
        border: `1.5px solid ${data.css}`,
        borderLeft: `4px solid ${data.css}`,
        borderRadius: 8,
        padding: "8px 12px",
        minWidth: 190,
        maxWidth: 250,
        boxShadow: `0 8px 28px rgba(0,0,0,0.85), 0 0 12px ${data.css}44`,
        backdropFilter: "blur(8px)",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: data.css,
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: `0 0 8px ${data.css}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}>
          {data.label}
        </span>
        <span style={{ fontSize: 9, color: "#aaa", background: "#1a2330", padding: "1px 6px", borderRadius: 4, border: "1px solid #2a384c", marginLeft: "auto" }}>
          {data.type}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.35, marginBottom: 6 }}>
        {data.desc}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10 }}>
        <span style={{ color: "#ff6b6b", background: "#221111", border: "1px solid #442222", padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
          ⛔ No transitable
        </span>
        <span style={{ color: "#7a8e9e", fontFamily: "monospace", fontSize: 9 }}>
          Tile [{data.tileX}:{data.tileY}]
        </span>
      </div>
    </div>
  );
}

export default MineralTooltip;
