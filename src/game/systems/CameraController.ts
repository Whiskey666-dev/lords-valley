import Phaser from 'phaser';

export class CameraController {
  private velocity = new Phaser.Math.Vector2(0, 0);
  private isDragging = false;
  private dragStart = new Phaser.Math.Vector2(0, 0);
  private camStart = new Phaser.Math.Vector2(0, 0);
  private worldW: number;
  private worldH: number;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private followMode = true;

  constructor(camera: Phaser.Cameras.Scene2D.Camera, worldW = 6144, worldH = 6144) {
    this.camera = camera;
    this.worldW = worldW;
    this.worldH = worldH;
  }

  get dragging(): boolean { return this.isDragging; }
  get isFollowing(): boolean { return this.followMode; }
  setFollowMode(follow: boolean) { this.followMode = follow; if (follow) this.isDragging = false; }

  attach(scene: Phaser.Scene) {
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.followMode) return;
      if (p.middleButtonDown() || p.rightButtonDown()) {
        this.isDragging = true;
        this.dragStart.set(p.x, p.y);
        this.camStart.set(this.camera.scrollX, this.camera.scrollY);
      }
    });
    scene.input.on('pointerup', () => (this.isDragging = false));
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const dx = p.x - this.dragStart.x;
      const dy = p.y - this.dragStart.y;
      this.camera.scrollX = Phaser.Math.Clamp(this.camStart.x - dx / this.camera.zoom, 0, this.worldW - this.camera.width / this.camera.zoom);
      this.camera.scrollY = Phaser.Math.Clamp(this.camStart.y - dy / this.camera.zoom, 0, this.worldH - this.camera.height / this.camera.zoom);
    });
    scene.input.on('wheel', (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number, event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
      const delta = dy > 0 ? -0.08 : 0.08;
      const nz = Phaser.Math.Clamp(this.camera.zoom + delta, 0.6, 1.6);
      this.camera.setZoom(nz);
      this.emitZoomSync();
    });

    window.addEventListener('phaser-zoom-set', (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') {
        const c = Phaser.Math.Clamp(detail, 0, 100);
        const nz = c <= 50 ? 0.6 + (c / 50) * 0.4 : 1.0 + ((c - 50) / 50) * 0.6;
        this.camera.setZoom(nz);
      }
    });
  }

  update(dt: number) {
    // Solo inercia tras drag; WASD es para movimiento del Player, no cámara libre
    if (this.velocity.length() > 1) {
      this.camera.scrollX = Phaser.Math.Clamp(this.camera.scrollX + this.velocity.x * dt, 0, this.worldW - this.camera.width / this.camera.zoom);
      this.camera.scrollY = Phaser.Math.Clamp(this.camera.scrollY + this.velocity.y * dt, 0, this.worldH - this.camera.height / this.camera.zoom);
      this.velocity.scale(0.88);
      if (this.velocity.length() < 1) this.velocity.set(0, 0);
    }
  }

  private emitZoomSync() {
    const z = this.camera.zoom;
    const percent = z <= 1.0 ? Math.round(((z - 0.6) / 0.4) * 50) : Math.round(50 + ((z - 1.0) / 0.6) * 50);
    window.dispatchEvent(new CustomEvent('phaser-zoom-sync', { detail: percent }));
  }
}
