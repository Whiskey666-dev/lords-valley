import Phaser from "phaser";

/**
 * CameraSystem.ts - Sistema de cámara modular.
 * Gestiona bounds, zoom y centrado manual para garantizar que el personaje
 * esté siempre exactamente en el centro de la pantalla (sin lerp que causaba
 * carga lenta del terreno izquierda→derecha).
 */

export function setupCamera(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, worldW = 6144, worldH = 6144): void {
  scene.cameras.main.setBounds(0, 0, worldW, worldH);

  const percentToZoom = (p: number): number => {
    const c = Phaser.Math.Clamp(p, 0, 100);
    return c <= 50 ? 0.6 + (c / 50) * 0.4 : 1.0 + ((c - 50) / 50) * 0.6;
  };
  const zoomToPercent = (z: number): number => {
    const c = Phaser.Math.Clamp(z, 0.6, 1.6);
    return c <= 1.0 ? Math.round(((c - 0.6) / 0.4) * 50) : Math.round(50 + ((c - 1.0) / 0.6) * 50);
  };

  // @ts-ignore - guardamos helpers en la escena para update
  (scene as unknown as { _percentToZoom: typeof percentToZoom })._percentToZoom = percentToZoom;
  (scene as unknown as { _zoomToPercent: typeof zoomToPercent })._zoomToPercent = zoomToPercent;

  scene.cameras.main.setZoom(percentToZoom(50));

  const t = target as unknown as { x: number; y: number };
  scene.cameras.main.centerOn(t.x, t.y);

  const applyZoomPercent = (p: number): void => {
    scene.cameras.main.setZoom(percentToZoom(p));
  };

  window.addEventListener("phaser-zoom-set", (e: Event) => {
    const detail = (e as CustomEvent<number>).detail;
    if (typeof detail === "number") applyZoomPercent(detail);
  });

  scene.input.on("wheel", (_pointer: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
    if (dy !== 0) {
      // @ts-ignore
      const ev = window.event as WheelEvent | undefined;
      if (ev?.ctrlKey) {
        ev.preventDefault();
        const deltaPercent = dy > 0 ? -10 : 10;
        const currentPercent = zoomToPercent(scene.cameras.main.zoom);
        const nzPercent = Phaser.Math.Clamp(currentPercent + deltaPercent, 0, 100);
        scene.cameras.main.setZoom(percentToZoom(nzPercent));
        window.dispatchEvent(new CustomEvent("phaser-zoom-sync", { detail: nzPercent }));
      }
    }
  });
}

export function updateCamera(scene: Phaser.Scene, target: { x: number; y: number }): void {
  // Centrado manual pixel-perfect cada frame, respeta bounds (se desacopla en bordes)
  scene.cameras.main.centerOn(target.x, target.y);
}
