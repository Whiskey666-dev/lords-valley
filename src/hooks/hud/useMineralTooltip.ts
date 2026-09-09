import { useEffect, useState } from "react";
import {
  getMineralCss,
  getMineralDisplayName,
  getMineralDescription,
  WORLD_TILES,
  isoToTile,
  tileToIso,
  ISO_TILE_H,
} from "../../game/world/Terrain";
import { getTileGid, isMineralGid } from "../../game/world/WorldTiles";
import { getMineralTileInfo, getMineralHeight } from "../../game/world/MineralHeights";
import { HEIGHT_STEP_PX } from "../../game/world/TerrainHeight";

export interface TooltipData {
  screenX: number;
  screenY: number;
  type: string;
  label: string;
  css: string;
  desc: string;
  tileX: number;
  tileY: number;
  height: number;
  charges: number;
  isSpecial: boolean;
}

const GID_MAP: Record<number, string> = {
  30: "COBRE",
  31: "ESTANO",
  32: "HIERRO",
  33: "PLATA",
  34: "ORO",
  35: "CARBON",
};

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
        const { tileX: tx0, tileY: ty0 } = isoToTile(worldPoint.x, worldPoint.y);

        // 1. Verificar si el tile en el plano o un mineral elevado adyacente fue clickeado
        let selectedTx = tx0;
        let selectedTy = ty0;
        let selectedGid = getTileGid(tx0, ty0);

        if (!selectedGid || !isMineralGid(selectedGid)) {
          // Si el click fue sobre la parte elevada (hacia arriba en pantalla) de un mineral que está en frente:
          let found = false;
          for (let dy = 0; dy <= 4; dy++) {
            for (let dx = 0; dx <= 4; dx++) {
              if (dx === 0 && dy === 0) continue;
              const cx = tx0 + dx;
              const cy = ty0 + dy;
              if (cx < 0 || cy < 0 || cx >= WORLD_TILES || cy >= WORLD_TILES) continue;
              const gid = getTileGid(cx, cy);
              if (gid !== undefined && isMineralGid(gid)) {
                const h = getMineralHeight(cx, cy);
                const iso = tileToIso(cx, cy);
                const topX = iso.x;
                const topY = iso.y - h * HEIGHT_STEP_PX;
                if (
                  Math.abs(worldPoint.x - topX) <= 32 &&
                  worldPoint.y >= topY &&
                  worldPoint.y <= iso.y + ISO_TILE_H
                ) {
                  selectedTx = cx;
                  selectedTy = cy;
                  selectedGid = gid;
                  found = true;
                  break;
                }
              }
            }
            if (found) break;
          }
        }

        if (selectedTx < 0 || selectedTy < 0 || selectedTx >= WORLD_TILES || selectedTy >= WORLD_TILES) {
          setData(null);
          return;
        }

        const type = selectedGid ? GID_MAP[selectedGid] ?? null : null;
        if (!type) {
          setData(null);
          return;
        }

        const info = getMineralTileInfo(selectedTx, selectedTy);
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
          tileX: selectedTx,
          tileY: selectedTy,
          height: info.height,
          charges: info.charges,
          isSpecial: info.isSpecial,
        });

        if (hideTimeout) window.clearTimeout(hideTimeout);
        hideTimeout = window.setTimeout(() => setData(null), 6000);
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
