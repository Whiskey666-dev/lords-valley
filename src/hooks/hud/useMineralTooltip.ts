import { useEffect, useState } from "react";
import {
  getMineralType,
  getMineralCss,
  getMineralDisplayName,
  getMineralDescription,
  WORLD_TILES,
  isoToTile,
} from "../../game/world/Terrain";
import { useGameStore } from "../../app/store/useGameStore";

export interface TooltipData {
  screenX: number;
  screenY: number;
  type: string;
  label: string;
  css: string;
  desc: string;
  tileX: number;
  tileY: number;
}

export function useMineralTooltip() {
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
            const gidMap: Record<number, string> = {
              30: "COBRE",
              31: "ESTANO",
              32: "HIERRO",
              33: "PLATA",
              34: "ORO",
              35: "CARBON",
            };
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

  return { data, closeTooltip: () => setData(null) };
}

export default useMineralTooltip;
