import Phaser from "phaser";
import { CHUNK_PX, CHUNK_TILES, TILE, WORLD_CHUNKS, isMineralTile } from "../world/Terrain";

/**
 * MineralPhysics.ts - Sistema de física para minerales.
 * Crea cuerpos estáticos Arcade para cada tile mineral en chunks visibles (3x3 alrededor de cámara)
 * y los sincroniza con el movimiento de cámara. El jugador y NPCs colisionan y no pueden atravesarlos.
 */

export class MineralPhysicsManager {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.StaticGroup | null = null;
  private activeChunks = new Set<string>();
  private chunkObjects = new Map<string, Phaser.GameObjects.GameObject[]>();
  private playerCollider: Phaser.Physics.Arcade.Collider | null = null;
  private npcColliders = new Map<string, Phaser.Physics.Arcade.Collider>();
  private lastCenterChunk = { x: -999, y: -999 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(): void {
    this.ensureTexture();
    this.group = this.scene.physics.add.staticGroup();
    // Grupo invisible, no necesita gravedad
  }

  private ensureTexture() {
    if (!this.scene.textures.exists("mineral_pixel")) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture("mineral_pixel", 2, 2);
      g.destroy();
    }
  }

  private chunkKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  private worldToChunk(worldX: number, worldY: number): { cx: number; cy: number } {
    return { cx: Math.floor(worldX / CHUNK_PX), cy: Math.floor(worldY / CHUNK_PX) };
  }

  /** Sincroniza colliders de minerales para los 3x3 chunks alrededor de la cámara. Throttle 512px. */
  sync(camera: Phaser.Cameras.Scene2D.Camera, player?: Phaser.Physics.Arcade.Sprite, npcs?: Array<{ sprite: Phaser.Physics.Arcade.Sprite | null; id: string }>): void {
    if (!this.group) return;
    const centerX = camera.scrollX + camera.width / 2;
    const centerY = camera.scrollY + camera.height / 2;
    const { cx, cy } = this.worldToChunk(centerX, centerY);
    const dist = Phaser.Math.Distance.Between(cx, cy, this.lastCenterChunk.x, this.lastCenterChunk.y);
    // Evita regenerar cada frame si no se movió de chunk
    if (dist < 1 && this.activeChunks.size > 0) {
      // Aún así asegurar colliders de player/npcs nuevos
      if (player) this.ensurePlayerCollider(player);
      if (npcs) this.ensureNpcColliders(npcs);
      return;
    }
    this.lastCenterChunk = { x: cx, y: cy };

    const needed = new Set<string>();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const ncx = cx + dx;
        const ncy = cy + dy;
        if (ncx < 0 || ncy < 0 || ncx >= WORLD_CHUNKS || ncy >= WORLD_CHUNKS) continue;
        needed.add(this.chunkKey(ncx, ncy));
      }
    }

    // Crear nuevos chunks
    for (const key of needed) {
      if (!this.activeChunks.has(key)) {
        const [cx2, cy2] = key.split(":").map(Number);
        this.createChunk(cx2, cy2);
        this.activeChunks.add(key);
      }
    }

    // Eliminar chunks fuera de rango
    for (const key of Array.from(this.activeChunks)) {
      if (!needed.has(key)) {
        this.removeChunk(key);
        this.activeChunks.delete(key);
      }
    }

    if (player) this.ensurePlayerCollider(player);
    if (npcs) this.ensureNpcColliders(npcs);
  }

  private createChunk(cx: number, cy: number): void {
    if (!this.group) return;
    const objs: Phaser.GameObjects.GameObject[] = [];
    for (let y = 0; y < CHUNK_TILES; y++) {
      for (let x = 0; x < CHUNK_TILES; x++) {
        const wx = cx * CHUNK_TILES + x;
        const wy = cy * CHUNK_TILES + y;
        if (!isMineralTile(wx, wy)) continue;
        const worldX = cx * CHUNK_PX + x * TILE + TILE / 2;
        const worldY = cy * CHUNK_PX + y * TILE + TILE / 2;
        // create en staticGroup con textura invisible
        const img = this.group.create(worldX, worldY, "mineral_pixel") as Phaser.Physics.Arcade.Image;
        img.setDisplaySize(TILE, TILE);
        img.setAlpha(0);
        // Alpha 0 pero cuerpo colisionable; refreshBody para que el tamaño coincida con displaySize
        if ((img as any).refreshBody) (img as any).refreshBody();
        // Asegurar que el cuerpo sea del tamaño del tile
        const body = img.body as Phaser.Physics.Arcade.StaticBody;
        if (body) {
          body.setSize(TILE, TILE);
          body.updateFromGameObject();
        }
        objs.push(img);
      }
    }
    this.chunkObjects.set(this.chunkKey(cx, cy), objs);
  }

  private removeChunk(key: string): void {
    const objs = this.chunkObjects.get(key);
    if (!objs) return;
    for (const o of objs) {
      this.group?.remove(o, true, true);
      o.destroy();
    }
    this.chunkObjects.delete(key);
  }

  private ensurePlayerCollider(player: Phaser.Physics.Arcade.Sprite): void {
    if (!this.group || !player) return;
    if (this.playerCollider) return; // ya existe
    this.playerCollider = this.scene.physics.add.collider(player, this.group);
  }

  private ensureNpcColliders(npcs: Array<{ sprite: Phaser.Physics.Arcade.Sprite | null; id: string }>): void {
    if (!this.group) return;
    for (const npc of npcs) {
      if (!npc.sprite) continue;
      if (this.npcColliders.has(npc.id)) continue;
      const col = this.scene.physics.add.collider(npc.sprite, this.group);
      this.npcColliders.set(npc.id, col);
    }
    // Limpiar colliders de NPCs ya no existentes
    for (const id of Array.from(this.npcColliders.keys())) {
      if (!npcs.some(n => n.id === id)) {
        const c = this.npcColliders.get(id);
        // Phaser collider no tiene destroy directo, pero podemos remover del world
        try { (this.scene.physics.world as any).removeCollider?.(c); } catch {}
        this.npcColliders.delete(id);
      }
    }
  }

  /** Limpieza total al destruir escena */
  destroy(): void {
    for (const key of Array.from(this.chunkObjects.keys())) this.removeChunk(key);
    this.activeChunks.clear();
    if (this.playerCollider) {
      try { (this.scene.physics.world as any).removeCollider?.(this.playerCollider); } catch {}
      this.playerCollider = null;
    }
    this.npcColliders.clear();
    this.group?.clear(true, true);
    this.group?.destroy();
    this.group = null;
  }

  /** Expone el grupo para debug o tests */
  getGroup(): Phaser.Physics.Arcade.StaticGroup | null {
    return this.group;
  }

  getActiveChunkCount(): number {
    return this.activeChunks.size;
  }
}

export default MineralPhysicsManager;
