import { useState, useCallback, useEffect } from "react";

export type TerrainMode = "excavar" | "aumentar" | null;

export function useTerrainTools(onClose: () => void) {
  const [mode, setMode] = useState<TerrainMode>(() => (window as any).__TERRAIN_EDIT_MODE__ ?? null);
  const [brushSize, setBrushSize] = useState<number>(() => (window as any).__TERRAIN_EDIT_SIZE__ ?? 1);

  // Sincroniza con Phaser vía eventos + globals persistentes
  const emitMode = useCallback((m: TerrainMode, s: number) => {
    (window as any).__TERRAIN_EDIT_MODE__ = m;
    (window as any).__TERRAIN_EDIT_SIZE__ = s;
    (window as any).__TERRAIN_EDIT_ACTIVE__ = !!m;
    window.dispatchEvent(new CustomEvent("phaser-terrain-mode-changed", { detail: { mode: m, size: s } }));
  }, []);

  // Emitir siempre que cambie modo o tamaño (incluye montaje inicial)
  useEffect(() => {
    emitMode(mode, brushSize);
  }, [mode, brushSize, emitMode]);

  // ESC cierra panel, cancelar modo si está activo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Si Phaser cancela modo (click derecho / ESC en Phaser), reflejar en React
  useEffect(() => {
    const onCancelled = () => setMode(null);
    window.addEventListener("phaser-terrain-cancelled" as any, onCancelled as EventListener);
    return () => window.removeEventListener("phaser-terrain-cancelled" as any, onCancelled as EventListener);
  }, []);

  const handleSelectMode = useCallback((m: Exclude<TerrainMode, null>) => {
    setMode(prev => (prev === m ? null : m));
  }, []);

  const handleSetSize = useCallback((s: number) => {
    const clamped = Math.max(1, Math.min(5, Math.round(s)));
    setBrushSize(clamped);
    (window as any).__TERRAIN_EDIT_SIZE__ = clamped;
    window.dispatchEvent(new CustomEvent("phaser-terrain-size-changed" as any, { detail: { size: clamped } }));
  }, []);

  // Al cerrar panel NO desactiva modo (permite usar herramienta con panel cerrado)
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDeactivate = useCallback(() => {
    setMode(null);
    emitMode(null, brushSize);
  }, [brushSize, emitMode]);

  const tilesAffected = brushSize === 1 ? 1 : (brushSize * 2 - 1) * (brushSize * 2 - 1);
  // Mapeo legible: 1 => 1 rombo, 2 => 3x3=9, 3=>5x5=25, etc.
  const sizeLabel = brushSize === 1 ? "1 rombo" : `${brushSize * 2 - 1}×${brushSize * 2 - 1} (${tilesAffected})`;

  return {
    mode,
    brushSize,
    sizeLabel,
    tilesAffected,
    isActive: mode !== null,
    handleSelectMode,
    handleSetSize,
    handleClose,
    handleDeactivate,
    setMode,
  };
}

export default useTerrainTools;
