import Phaser from "phaser";
import {
  tileToIso,
  isoToTile,
  ISO_TILE_W,
  ISO_TILE_H,
  WORLD_TILES,
} from "../world/Terrain";
import {
  terrainHeightManager,
  getHeightFast,
  HEIGHT_STEP_PX,
} from "../world/TerrainHeight";

export type TerrainMode = "excavar" | "aumentar" | null;

/**
 * TerrainEditSystem.ts — Sistema Phaser para edición de terreno
 * - Muestra previsualización con mouse (rombos afectados) cuando hay modo activo
 * - Click izquierdo (o drag) aplica delta según modo y tamaño de pincel
 * - ESC / click derecho cancela, emite eventos de altura
 */
export class TerrainEditSystem {
  private scene: Phaser.Scene;
  private ghost: Phaser.GameObjects.Graphics;
  private mode: TerrainMode = null;
  private brushSize = 1;
  // último tile bajo cursor para optimizar redraw
  private lastTile: { x: number; y: number } | null = null;
  private _isPointerDown = false;
  // evita TS6133 noUnusedLocals: se lee en destroy
  private get _pointerDownState(): boolean { return this._isPointerDown; }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ghost = this.scene.add.graphics();
    this.ghost.setDepth(998);
    this.ghost.setVisible(false);

    this.setupEvents();
    this.setupInput();
  }

  private setupEvents(): void {
    const onModeChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ mode: TerrainMode; size: number }>).detail;
      if (!detail) return;
      this.mode = detail.mode ?? null;
      if (typeof detail.size === "number") this.brushSize = detail.size;
      (window as any).__TERRAIN_EDIT_ACTIVE__ = !!this.mode;
      (window as any).__TERRAIN_EDIT_MODE__ = this.mode;
      this.updateGhostVisibility();
      // limpiar lastTile para forzar redraw en próximo pointermove
      this.lastTile = null;
      if (!this.mode) {
        this.ghost.clear();
        this.ghost.setVisible(false);
      }
    };

    window.addEventListener("phaser-terrain-mode-changed" as any, onModeChanged as EventListener);
    // compat: evento separado de tamaño
    const onSizeChanged = (e: Event) => {
      const d = (e as CustomEvent<{ size: number }>).detail;
      if (d && typeof d.size === "number") {
        this.brushSize = d.size;
        this.lastTile = null;
      }
    };
    window.addEventListener("phaser-terrain-size-changed" as any, onSizeChanged as EventListener);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("phaser-terrain-mode-changed" as any, onModeChanged as EventListener);
      window.removeEventListener("phaser-terrain-size-changed" as any, onSizeChanged as EventListener);
      this.destroy();
    });
  }

  private setupInput(): void {
    // pointer move => actualizar preview en pantalla
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.mode) return;
      // Si está arrastrando con click presionado, aplicar continuo
      const isDown = (pointer as any).isDown || pointer.leftButtonDown?.();
      if (isDown) {
        this._isPointerDown = true;
        this.applyAtPointer(pointer);
      }
      this.updateGhostPreview(pointer);
    });

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.mode) return;
      if (pointer.rightButtonDown?.()) {
        // click derecho cancela modo
        this.cancelMode();
        return;
      }
      if (pointer.leftButtonDown?.() || (pointer as any).primaryDown || (pointer as any).leftButtonReleased === false) {
        this._isPointerDown = true;
        // evitar que el click atraviese a otros sistemas (farm etc) cuando terreno está activo
        // pero seguimos aplicando
        this.applyAtPointer(pointer);
        this.updateGhostPreview(pointer);
      }
    });

    this.scene.input.on("pointerup", () => {
      this._isPointerDown = false;
    });

    // ESC cancela
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on("keydown-ESC", () => {
        if (this.mode) this.cancelMode();
      });
    }

    // pointer out limpia ghost
    this.scene.input.on("pointerout", () => {
      this.ghost.clear();
      this.ghost.setVisible(false);
      this.lastTile = null;
    });
  }

  private cancelMode(): void {
    this.mode = null;
    (window as any).__TERRAIN_EDIT_ACTIVE__ = false;
    (window as any).__TERRAIN_EDIT_MODE__ = null;
    this.ghost.clear();
    this.ghost.setVisible(false);
    this.lastTile = null;
    window.dispatchEvent(new CustomEvent("phaser-terrain-mode-changed", { detail: { mode: null, size: this.brushSize } }));
    // también notifica React para deseleccionar botones (opcional)
    window.dispatchEvent(new CustomEvent("phaser-terrain-cancelled" as any));
  }

  private updateGhostVisibility(): void {
    if (this.mode) this.ghost.setVisible(true);
    else this.ghost.setVisible(false);
  }

  private updateGhostPreview(pointer: Phaser.Input.Pointer): void {
    if (!this.mode) {
      this.ghost.clear();
      this.ghost.setVisible(false);
      return;
    }
    const cam = this.scene.cameras.main;
    if (!cam) return;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const { tileX, tileY } = isoToTile(worldPoint.x, worldPoint.y);

    // si no cambió tile, no redibujar
    if (this.lastTile && this.lastTile.x === tileX && this.lastTile.y === tileY) return;
    this.lastTile = { x: tileX, y: tileY };

    // si fuera de rango, limpiar
    if (tileX < 0 || tileY < 0 || tileX >= WORLD_TILES || tileY >= WORLD_TILES) {
      this.ghost.clear();
      return;
    }

    const tiles = terrainHeightManager.getBrushTiles(tileX, tileY, this.brushSize);
    this.ghost.clear();
    this.ghost.setVisible(true);

    // colores según modo
    const isExcavar = this.mode === "excavar";
    // fill semi-transparente: excavar = azul/oscuro hundido, aumentar = verde tierra elevada
    const fillColor = isExcavar ? 0x1a3a5a : 0x2e7d32; // azul oscuro vs verde
    const strokeColor = isExcavar ? 0x4fc3f7 : 0x66bb6a;
    const fillAlpha = 0.38;
    const strokeAlpha = 0.95;

    // Dibujar cada rombo afectado
    for (const t of tiles) {
      const iso = tileToIso(t.x, t.y);
      const h = getHeightFast(t.x, t.y);
      // altura actual desplaza el rombo levemente hacia arriba si es elevado
      const yOffset = iso.y - h * HEIGHT_STEP_PX;
      const x = iso.x;
      const y = yOffset;
      const hw = ISO_TILE_W / 2;
      const hh = ISO_TILE_H / 2;

      // relleno
      this.ghost.fillStyle(fillColor, fillAlpha);
      this.ghost.beginPath();
      this.ghost.moveTo(x + hw, y);
      this.ghost.lineTo(x + ISO_TILE_W, y + hh);
      this.ghost.lineTo(x + hw, y + ISO_TILE_H);
      this.ghost.lineTo(x, y + hh);
      this.ghost.closePath();
      this.ghost.fillPath();

      // borde
      this.ghost.lineStyle(2, strokeColor, strokeAlpha);
      this.ghost.beginPath();
      this.ghost.moveTo(x + hw, y);
      this.ghost.lineTo(x + ISO_TILE_W, y + hh);
      this.ghost.lineTo(x + hw, y + ISO_TILE_H);
      this.ghost.lineTo(x, y + hh);
      this.ghost.closePath();
      this.ghost.strokePath();

      // flecha indicador de dirección en el centro (pequeña)
      // excavar: flecha hacia abajo, aumentar: hacia arriba
      this.ghost.fillStyle(strokeColor, 0.9);
      if (isExcavar) {
        // triangulo hacia abajo en centro del rombo
        const cx = x + hw;
        const cy = y + hh;
        this.ghost.beginPath();
        this.ghost.moveTo(cx - 5, cy - 4);
        this.ghost.lineTo(cx + 5, cy - 4);
        this.ghost.lineTo(cx, cy + 5);
        this.ghost.closePath();
        this.ghost.fillPath();
      } else {
        const cx = x + hw;
        const cy = y + hh;
        this.ghost.beginPath();
        this.ghost.moveTo(cx - 5, cy + 4);
        this.ghost.lineTo(cx + 5, cy + 4);
        this.ghost.lineTo(cx, cy - 5);
        this.ghost.closePath();
        this.ghost.fillPath();
      }
    }

    // Texto indicador de tamaño en el centro del pincel
    // (solo si brush >1, muestra 3x3 etc)
    if (tiles.length > 1) {
      const centerIso = tileToIso(tileX, tileY);
      const ch = getHeightFast(tileX, tileY);
      const cy = centerIso.y - ch * HEIGHT_STEP_PX + ISO_TILE_H / 2;
      const cx = centerIso.x + ISO_TILE_W / 2;
      // No tenemos Text en Graphics, usamos debug string via graphics? Mejor dejar solo rombos.
      // Se podría añadir un Text, pero lo omitimos para no crear/destruir cada frame.
      void cx; void cy;
    }
  }

  private applyAtPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.mode) return;
    const cam = this.scene.cameras.main;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const { tileX, tileY } = isoToTile(worldPoint.x, worldPoint.y);
    if (tileX < 0 || tileY < 0 || tileX >= WORLD_TILES || tileY >= WORLD_TILES) return;
    const delta = this.mode === "excavar" ? -1 : 1;
    const changed = terrainHeightManager.applyBrush(tileX, tileY, delta, this.brushSize);
    if (changed.length > 0) {
      // feedback cámara sutil
      // this.scene.cameras.main.shake(40, 0.001);
      // actualizar preview para reflejar nuevo offset
      this.lastTile = null;
      this.updateGhostPreview(pointer);
    }
  }

  // API externa por si React quiere aplicar programáticamente
  public setMode(mode: TerrainMode, size: number): void {
    this.mode = mode;
    this.brushSize = size;
    (window as any).__TERRAIN_EDIT_ACTIVE__ = !!mode;
    (window as any).__TERRAIN_EDIT_MODE__ = mode;
    this.updateGhostVisibility();
    this.lastTile = null;
    if (!mode) {
      this.ghost.clear();
      this.ghost.setVisible(false);
    }
  }

  public destroy(): void {
    void this._pointerDownState;
    try { this.ghost.destroy(); } catch {}
  }
}
