import { useEffect, useState } from "react";
import { FOG_VISION_RADIUS } from "../../game/systems/FogOfWarSystem";

/**
 * FogOverlay — Capa DOM para niebla de guerra del mapa principal.
 * Garantiza opacidad total del terreno cargado excepto círculo alrededor del jugador.
 * Usa CSS mask radial para recortar el agujero de visión en tiempo real.
 * Se sincroniza con __PLAYER_POS__ y __PHASER_CAMERA__ (mismo sistema que MiniMap).
 * Se coloca absolute sobre #game-container (zIndex 5) con pointerEvents none.
 */
export function FogOverlay() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("lordsvalley_fog_enabled_v1");
      if (v !== null) return v !== "false";
    } catch {}
    return true;
  });
  const [radius, setRadius] = useState<number>(FOG_VISION_RADIUS);
  const [screen, setScreen] = useState<{ x: number; y: number; r: number; ready: boolean }>({
    x: -9999,
    y: -9999,
    r: FOG_VISION_RADIUS,
    ready: false,
  });

  // Sincronizar enable/radius con eventos globales (compartidos con Phaser y MiniMap)
  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === "boolean") setEnabled(detail.enabled);
      else setEnabled((v) => !v);
    };
    const onRadius = (e: Event) => {
      const detail = (e as CustomEvent<{ radius: number }>).detail;
      if (typeof detail?.radius === "number") setRadius(Math.max(32, Math.min(2000, detail.radius)));
    };
    window.addEventListener("phaser-fog-toggle" as any, onToggle as EventListener);
    window.addEventListener("phaser-fog-radius" as any, onRadius as EventListener);
    // También persistencia hacia Phaser: exponer API
    (window as any).__FOG_DOM_API__ = {
      setEnabled: (v: boolean) => setEnabled(v),
      toggle: () => setEnabled((v) => !v),
      setRadius: (r: number) => setRadius(r),
      getRadius: () => radius,
      isEnabled: () => enabled,
    };
    return () => {
      window.removeEventListener("phaser-fog-toggle" as any, onToggle as EventListener);
      window.removeEventListener("phaser-fog-radius" as any, onRadius as EventListener);
    };
  }, [radius, enabled]);

  useEffect(() => {
    try { localStorage.setItem("lordsvalley_fog_enabled_v1", String(enabled)); } catch {}
  }, [enabled]);

  // Polling de posición del jugador y cámara para calcular agujero en coordenadas de pantalla
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      const p = (window as any).__PLAYER_POS__ as { x: number; y: number } | undefined;
      const cam = (window as any).__PHASER_CAMERA__ as Phaser.Cameras.Scene2D.Camera | undefined;
      if (p && typeof p.x === "number" && cam && cam.worldView) {
        const screenX = (p.x - cam.worldView.x) * cam.zoom;
        const screenY = (p.y - cam.worldView.y) * cam.zoom;
        const r = radius * cam.zoom;
        // Solo actualizar si cambió significativamente para evitar re-renders excesivos
        setScreen((prev) => {
          if (Math.abs(prev.x - screenX) < 1 && Math.abs(prev.y - screenY) < 1 && Math.abs(prev.r - r) < 0.5 && prev.ready) return prev;
          return { x: screenX, y: screenY, r, ready: true };
        });
      } else if (p && !cam) {
        // Fallback: centrar en medio si cámara aún no disponible (primeros frames)
        const w = window.innerWidth;
        const h = window.innerHeight;
        setScreen({ x: w / 2, y: h / 2, r: radius, ready: true });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, radius]);

  if (!enabled) return null;
  if (!screen.ready) {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "#000000",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
    );
  }

  // Construir máscara radial: centro transparente (agujero), exterior negro (niebla)
  // Usamos degradado suave para borde menos duro, igual que Phaser (inner 68%, mid 84%)
  const inner = screen.r * 0.68;
  const mid = screen.r * 0.84;
  // mask radial: transparent en centro → fog invisible, black en exterior → fog visible
  // CSS mask: white = visible, transparent = hole. Con background negro, mask hace el agujero.
  const mask = `radial-gradient(circle at ${screen.x}px ${screen.y}px, transparent 0px, transparent ${inner}px, rgba(0,0,0,0.35) ${mid}px, black ${screen.r}px, black 100%)`;
  // Fallback adicional: si el jugador está fuera de viewport (±2000), el centro off-screen hace que todo sea negro (correcto)

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background: "#000000",
        pointerEvents: "none",
        zIndex: 5,
        // Máscara que recorta el agujero de visión
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        // Asegurar que no haya transición que cause lag
        willChange: "mask-image, -webkit-mask-image",
      }}
    />
  );
}

export default FogOverlay;
