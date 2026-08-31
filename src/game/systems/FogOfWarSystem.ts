import Phaser from "phaser";

/**
 * FogOfWarSystem — Niebla de Guerra para el mapa principal (Phaser).
 * - Cubre toda la pantalla con un RenderTexture negro opaco.
 * - Abre un agujero circular suave alrededor del jugador (visión en tiempo real).
 * - La visión se mueve con el jugador y respeta el zoom de la cámara.
 * - Solo afecta al mapa principal; el minimapa tiene su propia lógica de exploración persistente.
 */

export const FOG_VISION_RADIUS = 260; // píxeles de mundo (~8 tiles) — perímetro visible pequeño y opaco exterior
export const FOG_VISION_RADIUS_TILES = Math.ceil(FOG_VISION_RADIUS / 32);
export const FOG_FEATHER_INNER = 0.68;
export const FOG_FEATHER_MID = 0.84;

export class FogOfWarSystem {
  private scene: Phaser.Scene;
  private fogRT: Phaser.GameObjects.RenderTexture | null = null;
  private visionGraphics: Phaser.GameObjects.Graphics | null = null;
  private radius: number;
  private enabled = true;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;

  constructor(scene: Phaser.Scene, radius: number = FOG_VISION_RADIUS) {
    this.scene = scene;
    this.radius = radius;
  }

  create(): void {
    // Usar dimensiones robustas (scale puede ser 0 en boot) — fallback a window / camera
    let width = (this.scene.scale as any).width as number;
    let height = (this.scene.scale as any).height as number;
    if (!width || !height || width < 10 || height < 10) {
      const cam = this.scene.cameras.main;
      width = Math.max(window.innerWidth, cam?.width ?? 800, 800);
      height = Math.max(window.innerHeight, cam?.height ?? 600, 600);
    }

    // RenderTexture del tamaño de la pantalla, fijo a cámara (scrollFactor 0)
    this.fogRT = this.scene.add.renderTexture(0, 0, width, height);
    this.fogRT.setOrigin(0, 0);
    this.fogRT.setScrollFactor(0);
    this.fogRT.setDepth(100); // por encima de terreno (depth -10) y sprites (5-10), por debajo de UI React (DOM)
    this.fogRT.setVisible(true);
    this.fogRT.setAlpha(1);

    // Gráfico que se usará como "borrador" (círculo blanco con degradado suave)
    this.visionGraphics = this.scene.make.graphics({ add: false } as any);
    // Asegurar que no se añade a la display list

    // Rellenar inicialmente de negro (evita flash de 1 frame sin niebla)
    try { this.fogRT.fill(0x000000, 1); } catch {}
    console.log(`[FogOfWar] creado ${width}x${height} radius=${this.radius}`);

    this.resizeHandler = (gameSize: Phaser.Structs.Size) => {
      if (!this.fogRT) return;
      const w = gameSize.width;
      const h = gameSize.height;
      // resize() recrea el framebuffer y limpia contenido
      try {
        this.fogRT!.resize(w, h);
        this.fogRT!.setSize(w, h);
      } catch {
        // fallback
        this.fogRT!.setSize(w, h);
      }
    };
    this.scene.scale.on("resize", this.resizeHandler as any);

    // Limpieza al cerrar escena
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /**
   * Debe llamarse cada frame con la posición mundial del jugador y la cámara principal.
   */
  update(playerX: number, playerY: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.enabled || !this.fogRT || !this.visionGraphics) return;
    if (playerX == null || playerY == null || !camera) return;

    // Convertir posición mundial del jugador a coordenadas de pantalla
    // worldView = rect visible en mundo (scrollX,Y + size/zoom)
    const screenX = (playerX - camera.worldView.x) * camera.zoom;
    const screenY = (playerY - camera.worldView.y) * camera.zoom;
    const screenRadius = this.radius * camera.zoom;

    // Si el radio es muy pequeño o la pantalla no tiene tamaño, no dibujar
    if (screenRadius < 1) return;
    // Validar tamaño de textura — si es 0, reintentar redimensionar
    let w = (this.scene.scale as any).width as number;
    let h = (this.scene.scale as any).height as number;
    if (!w || !h || w < 10 || h < 10) {
      w = window.innerWidth;
      h = window.innerHeight;
      try { this.fogRT.resize(w, h); this.fogRT.setSize(w, h); } catch {}
    }
    if (w <= 0 || h <= 0) return;

    // Redibujar niebla completa + agujero de visión
    // 1) Limpiar y rellenar de negro opaco
    this.fogRT.clear();
    this.fogRT.fill(0x000000, 1);

    // 2) Preparar círculo con degradado suave (feather) para borde menos duro
    const r = screenRadius;
    const inner = r * FOG_FEATHER_INNER;
    const mid = r * FOG_FEATHER_MID;

    this.visionGraphics.clear();
    // Dibujar de fuera hacia dentro para que el centro quede completamente opaco (borrado total)
    // Capa exterior muy suave
    this.visionGraphics.fillStyle(0xffffff, 0.18);
    this.visionGraphics.fillCircle(r, r, r);
    // Capa media
    this.visionGraphics.fillStyle(0xffffff, 0.45);
    this.visionGraphics.fillCircle(r, r, mid);
    // Núcleo sólido (borrado total)
    this.visionGraphics.fillStyle(0xffffff, 1);
    this.visionGraphics.fillCircle(r, r, inner);

    // 3) "Borrar" (erase) el círculo de la textura de niebla
    // erase(graphics, x, y) dibuja el graphics en la RT en posición x,y usando blend ERASE
    const eraseX = screenX - r;
    const eraseY = screenY - r;
    this.fogRT.erase(this.visionGraphics, eraseX, eraseY);
  }

  setRadius(radius: number): void {
    this.radius = Math.max(32, Math.min(2000, Math.round(radius)));
  }

  getRadius(): number {
    return this.radius;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.fogRT) this.fogRT.setVisible(enabled);
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
      this.visionGraphics?.destroy();
    } catch {}
    this.fogRT = null;
    this.visionGraphics = null;
  }
}

export default FogOfWarSystem;
