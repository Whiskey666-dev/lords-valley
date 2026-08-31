import { useEffect, useState } from "react";
import { getMineralType, getMineralCss, getMineralDisplayName, getMineralDescription, WORLD_TILES, TILE } from "../../game/world/Terrain";

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
      const cam = (window as any).__PHASER_CAMERA__ as any;
      if (!cam) {
        setData(null);
        return;
      }
      try {
        // Convertir coords ventana -> coords canvas (corrige offset Navbar/side panels)
        // Antes se pasaba clientX/Y directo a getWorldPoint, lo que desplazaba la detección "arriba" del cuadro.
        const canvas = document.querySelector("#game-container canvas") as HTMLCanvasElement | null;
        let canvasX: number;
        let canvasY: number;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
            setData(null);
            return;
          }
          canvasX = clientX - rect.left;
          canvasY = clientY - rect.top;
          // Si el tamaño del juego difiere del rect (paneles laterales, DPR), escalar
          const scaleX = (cam.width || rect.width) / rect.width;
          const scaleY = (cam.height || rect.height) / rect.height;
          if (Math.abs(scaleX - 1) > 0.02) canvasX *= scaleX;
          if (Math.abs(scaleY - 1) > 0.02) canvasY *= scaleY;
        } else {
          // Fallback: usa coords directas
          canvasX = clientX;
          canvasY = clientY;
        }
        const worldPoint = cam.getWorldPoint(canvasX, canvasY);
        const tx = Math.floor(worldPoint.x / TILE);
        const ty = Math.floor(worldPoint.y / TILE);
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) {
          setData(null);
          return;
        }
        const type = getMineralType(tx, ty);
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
        // Auto-ocultar tras 4s si no hay otro click
        if (hideTimeout) window.clearTimeout(hideTimeout);
        hideTimeout = window.setTimeout(() => setData(null), 4000);
      } catch {
        setData(null);
      }
    };

    const onLeftClick = (e: MouseEvent) => {
      // Solo click izquierdo (0)
      if (e.button !== 0) return;
      // Ignora clicks sobre UI (botones, paneles, minimapa, navbar, consola...)
      const target = e.target as HTMLElement;
      // Solo permitir clicks sobre el canvas del juego
      const isCanvas = !!target.closest("canvas");
      const isGameContainer = !!target.closest("#game-container");
      // Si no es canvas ni game-container, es UI → ocultar tooltip y no mostrar nuevo
      if (!isCanvas && !isGameContainer) {
        // Click en UI no mineral: ocultar tooltip existente
        // No retornamos inmediatamente si queremos ocultar, pero no mostrar nuevo
        // Si el click fue en UI, no mostramos mineral
        setData(null);
        return;
      }
      // Si está bloqueado por input (consola/inventario) no mostrar
      // Permitimos igual si el juego está en pausa? Mejor ocultar
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

  // Evita que el tooltip se salga de la ventana
  const offsetX = 14;
  const offsetY = 18;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
  const tooltipW = 220;
  const tooltipH = 70;
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
        background: "#0f1012f2",
        border: `1px solid ${data.css}`,
        borderLeft: `4px solid ${data.css}`,
        borderRadius: 8,
        padding: "8px 10px",
        minWidth: 180,
        maxWidth: 240,
        boxShadow: "0 8px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset",
        backdropFilter: "blur(6px)",
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
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: `0 0 6px ${data.css}88`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}>
          {data.label}
        </span>
        <span style={{ fontSize: 9, color: "#888", background: "#1a1a1a", padding: "1px 5px", borderRadius: 4, border: "1px solid #2a2a2a" }}>
          {data.type}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "#bbb", lineHeight: 1.3, marginBottom: 4 }}>
        {data.desc}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9 }}>
        <span style={{ color: "#ff6b6b", background: "#1a0f0f", border: "1px solid #331a1a", padding: "1px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
          ⛔ No transitable
        </span>
        <span style={{ color: "#555", fontFamily: "monospace" }}>
          [{data.tileX}:{data.tileY}]
        </span>
      </div>
    </div>
  );
}

export default MineralTooltip;
