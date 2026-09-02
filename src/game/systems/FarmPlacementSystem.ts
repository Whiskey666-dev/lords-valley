import Phaser from "phaser";
import {
  tileToIso,
  isoToTile,
  ISO_TILE_W,
  ISO_TILE_H,
  WORLD_TILES,
  isWaterTileFast,
  getMineralTypeFast,
  isTreeTile,
} from "../world/Terrain";
import { collisionMatrix } from "../world/CollisionMatrix";
import { farmPlotManager, type FarmPlotData } from "../farming/FarmPlotManager";
import {
  CROPS_CATALOG,
  calculateGrowthStatus,
} from "../farming/farmData";

export class FarmPlacementSystem {
  private scene: Phaser.Scene;
  private isPlacementActive = false;
  private ghostGraphics: Phaser.GameObjects.Graphics;
  private plotsContainer: Phaser.GameObjects.Container;
  private plotVisuals: Map<string, { container: Phaser.GameObjects.Container; data: FarmPlotData }> = new Map();
  private unsubscribePlots: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Contenedor para todas las parcelas (profundidad sobre el terreno)
    this.plotsContainer = this.scene.add.container(0, 0);
    this.plotsContainer.setDepth(2);

    // Gráficos del cursor de colocación (ghost)
    this.ghostGraphics = this.scene.add.graphics();
    this.ghostGraphics.setDepth(999);
    this.ghostGraphics.setVisible(false);

    this.setupListeners();
    this.setupInputHandlers();

    // Render inicial y suscripción a cambios
    this.unsubscribePlots = farmPlotManager.subscribe(() => {
      this.refreshAllPlots();
    });
  }

  private setupListeners(): void {
    const onStartPlacement = (e: Event) => {
      const detail = (e as CustomEvent<{ buildingId?: string }>).detail;
      const type = detail?.buildingId ?? "b_cropplot";
      this.startPlacement(type);
    };

    const onCancelPlacement = () => {
      this.cancelPlacement();
    };

    const onPlantCrop = (e: Event) => {
      const detail = (e as CustomEvent<{ tileX: number; tileY: number; cropId: string }>).detail;
      if (detail) {
        farmPlotManager.plantCrop(detail.tileX, detail.tileY, detail.cropId);
        this.refreshAllPlots();
      }
    };

    const onHarvestCrop = (e: Event) => {
      const detail = (e as CustomEvent<{ tileX: number; tileY: number }>).detail;
      if (detail) {
        farmPlotManager.harvestCrop(detail.tileX, detail.tileY);
        this.refreshAllPlots();
      }
    };

    window.addEventListener("phaser-start-placement" as any, onStartPlacement as EventListener);
    window.addEventListener("phaser-cancel-placement" as any, onCancelPlacement as EventListener);
    window.addEventListener("phaser-plant-crop" as any, onPlantCrop as EventListener);
    window.addEventListener("phaser-harvest-crop" as any, onHarvestCrop as EventListener);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("phaser-start-placement" as any, onStartPlacement as EventListener);
      window.removeEventListener("phaser-cancel-placement" as any, onCancelPlacement as EventListener);
      window.removeEventListener("phaser-plant-crop" as any, onPlantCrop as EventListener);
      window.removeEventListener("phaser-harvest-crop" as any, onHarvestCrop as EventListener);
      if (this.unsubscribePlots) this.unsubscribePlots();
      this.destroy();
    });
  }

  private setupInputHandlers(): void {
    // Tecla ESC para cancelar colocación
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on("keydown-ESC", () => {
        if (this.isPlacementActive) {
          this.cancelPlacement();
        }
      });
    }

    // Puntero en el mundo para colocación
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isPlacementActive) return;
      this.updateGhostPreview(pointer);
    });

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isPlacementActive) return;

      // Clic derecho cancela
      if (pointer.rightButtonDown?.()) {
        this.cancelPlacement();
        return;
      }

      // Clic izquierdo coloca
      if (pointer.leftButtonDown?.() || pointer.primaryDown) {
        this.tryPlacePlot(pointer);
      }
    });
  }

  public startPlacement(type = "b_cropplot"): void {
    this.isPlacementActive = true;
    this.ghostGraphics.setVisible(true);
    window.dispatchEvent(new CustomEvent("phaser-placement-mode-changed", { detail: { active: true, type } }));
  }

  public cancelPlacement(): void {
    this.isPlacementActive = false;
    this.ghostGraphics.clear();
    this.ghostGraphics.setVisible(false);
    window.dispatchEvent(new CustomEvent("phaser-placement-mode-changed", { detail: { active: false } }));
  }

  /**
   * Comprueba si una casilla está libre de agua, árboles, minerales y construcciones
   */
  public isTileFreeAndValid(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= WORLD_TILES || tileY < 0 || tileY >= WORLD_TILES) {
      return false;
    }
    // Verificar agua
    if (isWaterTileFast(tileX, tileY)) return false;
    // Verificar mineral
    if (getMineralTypeFast(tileX, tileY)) return false;
    // Verificar árbol
    const cx = Math.floor(tileX / 32);
    const cy = Math.floor(tileY / 32);
    const lx = tileX % 32;
    const ly = tileY % 32;
    if (isTreeTile(cx, cy, lx, ly)) return false;
    // Verificar colisión
    if (collisionMatrix.isBlockedTile(tileX, tileY)) return false;
    // Verificar si ya hay una parcela colocada
    if (farmPlotManager.hasPlotAt(tileX, tileY)) return false;

    return true;
  }

  private updateGhostPreview(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const { tileX, tileY } = isoToTile(worldPoint.x, worldPoint.y);

    this.ghostGraphics.clear();

    const isoPos = tileToIso(tileX, tileY);
    const hw = ISO_TILE_W / 2; // 32
    const hh = ISO_TILE_H / 2; // 16

    const isValid = this.isTileFreeAndValid(tileX, tileY);

    // Color del ghost: Verde esmeralda si es válido, Rojo si está ocupado
    const fillColor = isValid ? 0x3d2314 : 0x771111;
    const strokeColor = isValid ? 0x4caf50 : 0xf44336;

    // Relleno de la tierra café
    this.ghostGraphics.fillStyle(fillColor, 0.75);
    this.ghostGraphics.beginPath();
    this.ghostGraphics.moveTo(isoPos.x + hw, isoPos.y);
    this.ghostGraphics.lineTo(isoPos.x + ISO_TILE_W, isoPos.y + hh);
    this.ghostGraphics.lineTo(isoPos.x + hw, isoPos.y + ISO_TILE_H);
    this.ghostGraphics.lineTo(isoPos.x, isoPos.y + hh);
    this.ghostGraphics.closePath();
    this.ghostGraphics.fillPath();

    // Borde brillante de validación
    this.ghostGraphics.lineStyle(2, strokeColor, 0.9);
    this.ghostGraphics.beginPath();
    this.ghostGraphics.moveTo(isoPos.x + hw, isoPos.y);
    this.ghostGraphics.lineTo(isoPos.x + ISO_TILE_W, isoPos.y + hh);
    this.ghostGraphics.lineTo(isoPos.x + hw, isoPos.y + ISO_TILE_H);
    this.ghostGraphics.lineTo(isoPos.x, isoPos.y + hh);
    this.ghostGraphics.closePath();
    this.ghostGraphics.strokePath();

    // Líneas de surcos de tierra si es válido
    if (isValid) {
      this.ghostGraphics.lineStyle(1, 0x5a341a, 0.6);
      this.ghostGraphics.lineBetween(isoPos.x + hw - 10, isoPos.y + hh - 4, isoPos.x + hw + 10, isoPos.y + hh + 6);
      this.ghostGraphics.lineBetween(isoPos.x + hw - 16, isoPos.y + hh, isoPos.x + hw + 4, isoPos.y + hh + 10);
    }
  }

  private tryPlacePlot(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const { tileX, tileY } = isoToTile(worldPoint.x, worldPoint.y);

    if (!this.isTileFreeAndValid(tileX, tileY)) {
      this.scene.cameras.main.shake(100, 0.002);
      return;
    }

    // Colocar la parcela
    farmPlotManager.placePlot(tileX, tileY);
    this.refreshAllPlots();

    // Efecto de colocación exitosa
    const isoPos = tileToIso(tileX, tileY);
    const flash = this.scene.add.graphics();
    flash.setDepth(100);
    flash.lineStyle(2, 0xffeb3b, 1);
    flash.beginPath();
    flash.moveTo(isoPos.x + 32, isoPos.y);
    flash.lineTo(isoPos.x + 64, isoPos.y + 16);
    flash.lineTo(isoPos.x + 32, isoPos.y + 32);
    flash.lineTo(isoPos.x, isoPos.y + 16);
    flash.closePath();
    flash.strokePath();

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 350,
      onComplete: () => flash.destroy(),
    });

    this.cancelPlacement();
  }

  /**
   * Redibuja todas las parcelas y sus cultivos actuales
   */
  public refreshAllPlots(): void {
    const currentPlots = farmPlotManager.getAllPlots();
    const currentKeys = new Set(currentPlots.map(p => `${p.tileX}:${p.tileY}`));

    // Eliminar visuales que ya no existan
    for (const [key, visual] of this.plotVisuals.entries()) {
      if (!currentKeys.has(key)) {
        visual.container.destroy(true);
        this.plotVisuals.delete(key);
      }
    }

    // Crear o actualizar visuales
    currentPlots.forEach(plot => {
      const key = `${plot.tileX}:${plot.tileY}`;
      let visual = this.plotVisuals.get(key);

      if (!visual) {
        const container = this.createPlotContainer(plot);
        this.plotsContainer.add(container);
        visual = { container, data: plot };
        this.plotVisuals.set(key, visual);
      } else {
        visual.data = plot;
        this.updatePlotContainer(visual.container, plot);
      }
    });
  }

  /**
   * Crea el contenedor visual con la tierra café oscuro y los eventos de clic
   */
  private createPlotContainer(plot: FarmPlotData): Phaser.GameObjects.Container {
    const isoPos = tileToIso(plot.tileX, plot.tileY);
    const container = this.scene.add.container(isoPos.x, isoPos.y);
    container.setDepth(3 + (plot.tileX + plot.tileY) * 0.001);

    // 1) Gráficos del suelo de tierra café oscuro
    const groundGfx = this.scene.add.graphics();
    groundGfx.setName("groundGfx");
    container.add(groundGfx);

    // 2) Sprite del cultivo (centrado en el rombo isométrico 64x32 con anclaje en la base)
    const initialTexture = plot.cropId ? `crop_${plot.cropId}` : "";
    const cropSprite = this.scene.add.image(32, 20, initialTexture);
    cropSprite.setName("cropSprite");
    cropSprite.setOrigin(0.5, 0.85);
    cropSprite.setVisible(false);
    container.add(cropSprite);

    // 3) Indicador flotante cuando está listo para cosechar
    const readyIndicator = this.scene.add.text(32, -22, "✨ ¡Listo! 🌾", {
      fontSize: "11px",
      color: "#ffd700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    readyIndicator.setName("readyIndicator");
    readyIndicator.setOrigin(0.5, 0.5);
    readyIndicator.setVisible(false);
    container.add(readyIndicator);

    // Hacer interactivo el rombo isométrico con polígono numérico
    const hitPoly = new Phaser.Geom.Polygon([32, 0, 64, 16, 32, 32, 0, 16]);
    groundGfx.setInteractive(hitPoly, Phaser.Geom.Polygon.Contains);

    groundGfx.on("pointerover", () => {
      this.drawPlotGround(groundGfx, true, plot);
    });

    groundGfx.on("pointerout", () => {
      this.drawPlotGround(groundGfx, false, plot);
    });

    groundGfx.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isPlacementActive) return;
      if (pointer.rightButtonDown?.()) return;

      const fullStatus = farmPlotManager.getPlotStatus(plot);

      // Despachar evento para abrir el modal React de Siembra / Cosecha
      window.dispatchEvent(
        new CustomEvent("phaser-crop-plot-selected", {
          detail: fullStatus,
        })
      );
    });

    this.updatePlotContainer(container, plot);
    return container;
  }

  /**
   * Actualiza el contenido visual de un contenedor de parcela
   */
  private updatePlotContainer(container: Phaser.GameObjects.Container, plot: FarmPlotData): void {
    const groundGfx = container.getByName("groundGfx") as Phaser.GameObjects.Graphics;
    const cropSprite = container.getByName("cropSprite") as Phaser.GameObjects.Image;
    const readyIndicator = container.getByName("readyIndicator") as Phaser.GameObjects.Text;

    if (groundGfx) {
      this.drawPlotGround(groundGfx, false, plot);
    }

    if (cropSprite && readyIndicator) {
      if (!plot.cropId || !plot.plantedAt) {
        cropSprite.setVisible(false);
        readyIndicator.setVisible(false);
        this.scene.tweens.killTweensOf(cropSprite);
      } else {
        const crop = CROPS_CATALOG.find((c) => c.id === plot.cropId);
        const growth = calculateGrowthStatus(plot.plantedAt, plot.timeOffsetMs ?? 0);

        if (crop && growth.isVisible && growth.stage > 0) {
          const textureKey = `crop_${crop.id}`;
          if (this.scene.textures.exists(textureKey)) {
            cropSprite.setTexture(textureKey, growth.stage);
            cropSprite.setVisible(true);

            // Escala armónica para sprites de 64x64 sobre tile isométrico de 64x32
            const stageScales: Record<number, number> = {
              1: 0.55, // Brote inicial emergente
              2: 0.68, // Planta mediana
              3: 0.80, // Planta desarrollada
              4: 0.90, // Cultivo maduro con fruto
            };
            const baseScale = stageScales[growth.stage] ?? 0.75;
            cropSprite.setScale(baseScale);

            if (growth.isReady) {
              readyIndicator.setVisible(true);
              this.scene.tweens.killTweensOf(cropSprite);
              this.scene.tweens.add({
                targets: cropSprite,
                scaleY: baseScale * 1.08,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
              });
            } else {
              readyIndicator.setVisible(false);
              this.scene.tweens.killTweensOf(cropSprite);
              cropSprite.setScale(baseScale);
            }
          }
        } else {
          // Etapa 0: Oculto bajo la tierra
          cropSprite.setVisible(false);
          readyIndicator.setVisible(false);
          this.scene.tweens.killTweensOf(cropSprite);
        }
      }
    }
  }

  /**
   * Dibuja el suelo isométrico de tierra café oscuro con textura de surcos
   */
  private drawPlotGround(gfx: Phaser.GameObjects.Graphics, isHovered: boolean, plot: FarmPlotData): void {
    gfx.clear();

    const hw = 32;
    const hh = 16;

    // Paleta de tierra café oscuro (similar a tierra arada fértil)
    const baseColor = isHovered ? 0x4e2c17 : 0x3d2212;
    const borderColor = isHovered ? 0x8d582b : 0x27140a;
    const furrowColor = 0x241309;
    const ridgeColor = 0x5a341a;

    // 1. Relleno del rombo base
    gfx.fillStyle(baseColor, 1);
    gfx.beginPath();
    gfx.moveTo(hw, 0);
    gfx.lineTo(ISO_TILE_W, hh);
    gfx.lineTo(hw, ISO_TILE_H);
    gfx.lineTo(0, hh);
    gfx.closePath();
    gfx.fillPath();

    // 2. Surcos de cultivo labrados
    gfx.lineStyle(1.5, furrowColor, 0.85);
    gfx.lineBetween(12, 10, 52, 22);
    gfx.lineBetween(18, 7, 58, 19);
    gfx.lineBetween(6, 13, 46, 25);

    // Resaltes luminosos
    gfx.lineStyle(1, ridgeColor, 0.6);
    gfx.lineBetween(13, 9, 53, 21);
    gfx.lineBetween(19, 6, 59, 18);
    gfx.lineBetween(7, 12, 47, 24);

    // 3. Si tiene semilla bajo tierra (0h - 6h), dibujar montículos de siembra
    if (plot.cropId && plot.plantedAt) {
      const growth = calculateGrowthStatus(plot.plantedAt, plot.timeOffsetMs ?? 0);
      if (growth.stage === 0) {
        gfx.fillStyle(0x502d15, 0.9);
        gfx.fillCircle(hw - 6, hh - 2, 2.5);
        gfx.fillCircle(hw + 6, hh + 2, 2.5);
        gfx.fillCircle(hw, hh, 3);
      }
    }

    // 4. Borde del tile
    gfx.lineStyle(isHovered ? 2 : 1, borderColor, isHovered ? 1 : 0.8);
    gfx.beginPath();
    gfx.moveTo(hw, 0);
    gfx.lineTo(ISO_TILE_W, hh);
    gfx.lineTo(hw, ISO_TILE_H);
    gfx.lineTo(0, hh);
    gfx.closePath();
    gfx.strokePath();
  }

  public update(): void {
    // Actualización periódica si es requerida
  }

  public destroy(): void {
    this.ghostGraphics.destroy();
    this.plotsContainer.destroy(true);
    this.plotVisuals.clear();
  }
}
