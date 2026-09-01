import Phaser from "phaser";

/**
 * FogOfWarSystem — Niebla de Guerra permanente para el mapa principal (Phaser).
 * - Siempre activa por defecto como experiencia central de juego.
 * - Cubre la pantalla con un RenderTexture negro opaco (depth 10000).
 * - Abre un campo de visión circular alrededor del personaje con difuminado suave continuo.
 */

export const FOG_VISION_RADIUS = 300; // Radio de visión en píxeles de mundo

export class FogOfWarSystem {
  private scene: Phaser.Scene;
  private fogRT: Phaser.GameObjects.RenderTexture | null = null;
  private visionImage: Phaser.GameObjects.Image | null = null;
  private radius: number;
  private enabled = true;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;
  private lastDrawnX = -9999;
  private lastDrawnY = -9999;
  private lastDrawnZoom = -1;

  constructor(scene: Phaser.Scene, radius: number = FOG_VISION_RADIUS) {
    this.scene = scene;
    this.radius = radius;
  }

  create(): void {
    const cam = this.scene.cameras.main;
    let width = (this.scene.scale as any).width as number;
    let height = (this.scene.scale as any).height as number;
    if (!width || !height || width < 10 || height < 10) {
      width = Math.max(window.innerWidth, cam?.width ?? 800, 800);
      height = Math.max(window.innerHeight, cam?.height ?? 600, 600);
    }

    // RenderTexture que cubre toda la pantalla fija (scrollFactor 0)
    this.fogRT = this.scene.add.renderTexture(0, 0, width, height);
    this.fogRT.setOrigin(0, 0);
    this.fogRT.setScrollFactor(0);
    this.fogRT.setDepth(10000);
    this.fogRT.setVisible(true);
    this.fogRT.setAlpha(1);

    // Generar textura de degradado radial suave con difuminado continuo
    const textureKey = "fog_vision_radial_texture_hd";
    if (!this.scene.textures.exists(textureKey)) {
      const texSize = 512;
      const center = texSize / 2;
      const canvasTex = this.scene.textures.createCanvas(textureKey, texSize, texSize);
      if (canvasTex) {
        const ctx = canvasTex.getContext();
        const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.55, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.75, "rgba(255, 255, 255, 0.70)");
        grad.addColorStop(0.88, "rgba(255, 255, 255, 0.30)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, texSize, texSize);
        canvasTex.refresh();
      }
    }

    this.visionImage = new Phaser.GameObjects.Image(this.scene, 0, 0, textureKey);
    this.visionImage.setOrigin(0.5, 0.5);

    try { this.fogRT.fill(0x000000, 1); } catch {}

    this.resizeHandler = (gameSize: Phaser.Structs.Size) => {
      if (!this.fogRT) return;
      const w = gameSize.width;
      const h = gameSize.height;
      try {
        this.fogRT.resize(w, h);
        this.fogRT.setSize(w, h);
      } catch {
        this.fogRT.setSize(w, h);
      }
      this.lastDrawnX = -9999;
    };
    this.scene.scale.on("resize", this.resizeHandler as any);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  update(playerX: number, playerY: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.enabled || !this.fogRT || !this.visionImage) return;
    if (playerX == null || playerY == null || !camera) return;

    // Cálculo exacto de coordenadas de pantalla con cualquier nivel de zoom de la cámara
    const screenX = (playerX - camera.scrollX - camera.width / 2) * camera.zoom + camera.width / 2;
    const screenY = (playerY - camera.scrollY - camera.height / 2) * camera.zoom + camera.height / 2;
    const screenRadius = this.radius * camera.zoom;

    if (screenRadius < 1) return;

    const moved = Math.abs(screenX - this.lastDrawnX) > 0.5 ||
                  Math.abs(screenY - this.lastDrawnY) > 0.5 ||
                  Math.abs(camera.zoom - this.lastDrawnZoom) > 0.01;
    if (!moved) return;

    this.lastDrawnX = screenX;
    this.lastDrawnY = screenY;
    this.lastDrawnZoom = camera.zoom;

    // 1) Rellenar de oscuridad
    this.fogRT.clear();
    this.fogRT.fill(0x000000, 1);

    // 2) Ajustar tamaño de visión circular difuminada
    const diameter = screenRadius * 2;
    this.visionImage.setDisplaySize(diameter, diameter);

    // 3) Borrar visión con gradiente continuo exactamente sobre el jugador
    this.fogRT.erase(this.visionImage, screenX, screenY);
  }

  setRadius(radius: number): void {
    this.radius = Math.max(64, Math.min(2000, Math.round(radius)));
    this.lastDrawnX = -9999;
  }

  getRadius(): number {
    return this.radius;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.fogRT) this.fogRT.setVisible(enabled);
    this.lastDrawnX = -9999;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  destroy(): void {
    if (this.resizeHandler) {
      try {
        this.scene.scale.off("resize", this.resizeHandler as any);
      } catch {}
      this.resizeHandler = undefined;
    }
    try {
      this.fogRT?.destroy();
    } catch {}
    try {
      this.visionImage?.destroy();
    } catch {}
    this.fogRT = null;
    this.visionImage = null;
  }
}

export default FogOfWarSystem;
