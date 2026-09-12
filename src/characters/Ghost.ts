import Phaser from 'phaser';
import { Survivor } from './Survivor';
import { ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT, isoToTile, isBlockedTile } from '../game/world/Terrain';
import { reportPlayerAttacked, updateGhostPosition } from '../app/socket';

// ─── Constantes del Ghost ────────────────────────────────────────────────────
export const GHOST_MAX_SALUD = 600;
export const GHOST_MAX_ENERGIA = 100;
/** Velocidad base igual al jugador (100 px/s) */
const GHOST_BASE_SPEED = 100;
/** +15% al detectar objetivo */
const GHOST_CHASE_SPEED = GHOST_BASE_SPEED * 1.15;
/**
 * Rango de detección: 5 tiles isométricos.
 * Tile iso: ancho=64, alto=32. Diagonal ≈ 71px.
 * 5 tiles ≈ 360 px.
 */
const GHOST_DETECTION_RANGE = 360;
/** Distancia de ataque */
const GHOST_ATTACK_RANGE = 48;
/** Cooldown entre ataques (ms) */
const GHOST_ATTACK_COOLDOWN = 1200;
const PATROL_MIN_MS = 2500;
const PATROL_MAX_MS = 5000;

// ─── Sprite ──────────────────────────────────────────────────────────────────

/**
 * GhostSprite — sprite físico del Ghost.
 * Mismo patrón que DeadDragonSprite (que funciona correctamente).
 * Sprite: ghost_idle, 96x96 px, 8 frames horizontales (768x96 total).
 */
export class GhostSprite extends Phaser.Physics.Arcade.Sprite {
  public healthBarBg: Phaser.GameObjects.Rectangle | null = null;
  public healthBarHp: Phaser.GameObjects.Rectangle | null = null;
  public healthBarEn: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Textura inicial: ghost_idle frame 0, fallback al player
    const texKey = scene.textures.exists('ghost_idle') ? 'ghost_idle' : 'player_idle_down';
    super(scene, x, y, texKey, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Hitbox pie del ghost: 28x20, centrado horizontalmente, en la parte baja del sprite
    body.setSize(28, 20);
    body.setOffset(34, 68);

    this.setOrigin(0.5, 0.833);
    this.setDepth(12);
    this.setScale(1);

    // Crear animaciones en el sprite (mismo patrón que DeadDragonSprite)
    GhostSprite.createAnimations(scene);
    this.playGhostIdle();

    // Tint fantasmal azul-blanco
    this.setTint(0xaaddff);
    this.setAlpha(0.92);

    // Barras de vida y energía siempre visibles
    this.createHealthBars(scene, x, y);
  }

  static createAnimations(scene: Phaser.Scene) {
    if (scene.anims.exists('ghost_idle')) return;

    const texKey = scene.textures.exists('ghost_idle') ? 'ghost_idle' : null;
    if (!texKey) {
      console.warn('[GhostSprite] Textura ghost_idle no encontrada, no se crea anim');
      return;
    }

    scene.anims.create({
      key: 'ghost_idle',
      frames: scene.anims.generateFrameNumbers(texKey, { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });
    console.log('[GhostSprite] ✓ Anim ghost_idle creada (8 frames, 8fps, loop)');
  }

  playGhostIdle() {
    if (this.scene && this.scene.anims.exists('ghost_idle')) {
      if (this.anims.currentAnim?.key !== 'ghost_idle') {
        this.play('ghost_idle', true);
      }
    }
  }

  private createHealthBars(scene: Phaser.Scene, x: number, y: number) {
    const barY = y - 70;

    // Fondo negro
    this.healthBarBg = scene.add.rectangle(x, barY, 46, 16, 0x000000, 0.75);
    this.healthBarBg.setDepth(9000);
    this.healthBarBg.setOrigin(0.5, 0.5);

    // Barra HP (roja)
    this.healthBarHp = scene.add.rectangle(x - 22, barY - 3, 44, 5, 0xff2222, 1);
    this.healthBarHp.setDepth(9001);
    this.healthBarHp.setOrigin(0, 0.5);

    // Barra Energía (azul)
    this.healthBarEn = scene.add.rectangle(x - 22, barY + 4, 44, 5, 0x44aaff, 1);
    this.healthBarEn.setDepth(9001);
    this.healthBarEn.setOrigin(0, 0.5);
  }

  updateBars(salud: number, maxSalud: number, energia: number, maxEnergia: number) {
    if (!this.healthBarBg || !this.healthBarHp || !this.healthBarEn) return;

    const barY = this.y - 70;
    const bx = this.x;

    this.healthBarBg.setPosition(bx, barY);
    this.healthBarHp.setPosition(bx - 22, barY - 3);
    this.healthBarEn.setPosition(bx - 22, barY + 4);

    const hpPct = Math.max(0, Math.min(1, salud / maxSalud));
    const enPct = Math.max(0, Math.min(1, energia / maxEnergia));
    this.healthBarHp.setSize(Math.round(44 * hpPct), 5);
    this.healthBarEn.setSize(Math.round(44 * enPct), 5);
  }

  destroyBars() {
    this.healthBarBg?.destroy();
    this.healthBarHp?.destroy();
    this.healthBarEn?.destroy();
    this.healthBarBg = null;
    this.healthBarHp = null;
    this.healthBarEn = null;
  }
}

// ─── Clase lógica Ghost ───────────────────────────────────────────────────────

export class Ghost {
  public id: string;
  public nombre = "Ghost";
  public sprite: GhostSprite | null = null;
  /** ID del settlement al que pertenece este ghost (asignado por el servidor) */
  public settlementId: string | null = null;

  // Stats — sincronizados con el servidor via 'ghost:damage_result'
  public salud: number = GHOST_MAX_SALUD;
  public maxSalud: number = GHOST_MAX_SALUD;
  public energia: number = GHOST_MAX_ENERGIA;
  public maxEnergia: number = GHOST_MAX_ENERGIA;

  // Posición origen para patrullas locales
  public homeX = 0;
  public homeY = 0;

  // IA
  private isDead = false;
  private lastAttackTime = 0;
  /** Timestamp de la última vez que reportamos posición al servidor */
  private lastPositionReport = 0;
  private patrolTarget: { x: number; y: number } | null = null;
  private patrolChangeAt = 0;

  constructor() {
    this.id = 'ghost_' + Math.random().toString(36).substring(2, 7);
  }

  /**
   * Crea un Ghost con datos autoritativos del servidor.
   * Usar cuando el servidor emite 'ghost:spawned' con el estado canónico.
   * @param serverData - GhostStateDto retornado por el servidor
   */
  public static fromServerData(serverData: {
    id: string;
    hp: number;
    maxHp: number;
    energia: number;
    maxEnergia: number;
    positionX: number;
    positionY: number;
    settlementId?: string;
  }): Ghost {
    const ghost = new Ghost();
    ghost.id = serverData.id;
    ghost.salud = serverData.hp;
    ghost.maxSalud = serverData.maxHp;
    ghost.energia = serverData.energia;
    ghost.maxEnergia = serverData.maxEnergia;
    ghost.homeX = serverData.positionX;
    ghost.homeY = serverData.positionY;
    if (serverData.settlementId) ghost.settlementId = serverData.settlementId;
    return ghost;
  }

  // ── Instanciar ─────────────────────────────────────────────────────────────

  instanciarSprite(scene: Phaser.Scene, x: number, y: number) {
    this.homeX = x;
    this.homeY = y;
    this.sprite = new GhostSprite(scene, x, y);
    this.patrolTarget = this.pickRandomPatrolPoint();
    this.patrolChangeAt = scene.time.now + PATROL_MIN_MS + Math.random() * (PATROL_MAX_MS - PATROL_MIN_MS);
    console.log(`[Ghost] ${this.id} instanciado en (${x.toFixed(0)}, ${y.toFixed(0)}) tex=${scene.textures.exists('ghost_idle') ? 'ghost_idle OK' : 'FALLBACK player'}`);
  }

  desinstanciarSprite() {
    if (this.sprite) {
      this.sprite.destroyBars();
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  updateEntity(
    player: Phaser.Physics.Arcade.Sprite,
    survivors: Survivor[],
    delta: number
  ): boolean {
    if (this.isDead || !this.sprite || !this.sprite.active) return false;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return false;

    // Actualizar barras
    this.sprite.updateBars(this.salud, this.maxSalud, this.energia, this.maxEnergia);

    // Reproducir animación idle si no está corriendo
    this.sprite.playGhostIdle();

    // Reportar posición al servidor cada 500ms para validaciones de distancia
    const now = Date.now();
    if (now - this.lastPositionReport > 500 && this.sprite) {
      updateGhostPosition(this.id, this.sprite.x, this.sprite.y);
      this.lastPositionReport = now;
    }

    // IA
    const target = this.findClosestTarget(player, survivors);
    if (target) {
      this.chaseTarget(body, target);
    } else {
      this.doPatrol(body, this.sprite.scene, delta);
    }

    return true;
  }

  // ── Detección ─────────────────────────────────────────────────────────────

  private findClosestTarget(
    player: Phaser.Physics.Arcade.Sprite,
    survivors: Survivor[]
  ): { x: number; y: number; entity: any } | null {
    if (!this.sprite) return null;

    const sx = this.sprite.x;
    const sy = this.sprite.y;
    let closest: { x: number; y: number; entity: any } | null = null;
    let closestDist = GHOST_DETECTION_RANGE;

    // El modo creativo ya NO se controla con window.__CREATIVE_MODE__.
    // El servidor es la autoridad: cuando el ghost reporta un ataque via WebSocket,
    // el servidor rechaza el daño si gameMode === 'creative'.
    // El ghost sigue detectando y persiguiendo visualmente (para UX), pero el daño
    // solo se aplica cuando el servidor lo confirma.
    if (player && player.active) {
      const d = Phaser.Math.Distance.Between(sx, sy, player.x, player.y);
      if (d <= GHOST_DETECTION_RANGE) {
        closestDist = d;
        closest = { x: player.x, y: player.y, entity: player };
      }
    }

    for (const surv of survivors) {
      if (!surv.sprite || !surv.sprite.active) continue;
      const d = Phaser.Math.Distance.Between(sx, sy, surv.sprite.x, surv.sprite.y);
      if (d < closestDist) {
        closestDist = d;
        closest = { x: surv.sprite.x, y: surv.sprite.y, entity: surv };
      }
    }

    return closest;
  }

  // ── Persecución ───────────────────────────────────────────────────────────

  private chaseTarget(body: Phaser.Physics.Arcade.Body, target: { x: number; y: number; entity: any }) {
    if (!this.sprite) return;

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= GHOST_ATTACK_RANGE) {
      body.setVelocity(0);
      this.tryAttack(target.entity);
    } else {
      body.setVelocity((dx / dist) * GHOST_CHASE_SPEED, (dy / dist) * GHOST_CHASE_SPEED);
      if (Math.abs(dx) > 1) {
        // Sprite base mira a la izquierda: voltear a la derecha cuando dx > 0
        this.sprite.setFlipX(dx > 0);
      }
    }
  }

  // ── Ataque ────────────────────────────────────────────────────────────────

  private tryAttack(targetEntity: any) {
    if (!this.sprite?.scene) return;

    const now = this.sprite.scene.time.now;
    if (now - this.lastAttackTime < GHOST_ATTACK_COOLDOWN) return;

    this.lastAttackTime = now;

    // Flash de ataque (visual — siempre se muestra independiente del resultado del servidor)
    this.sprite.setTint(0xff4444);
    this.sprite.scene.time.delayedCall(200, () => {
      if (this.sprite?.active) this.sprite.setTint(0xaaddff);
    });

    // SEGURIDAD: El daño ya NO se aplica directamente en el cliente.
    // En cambio, reportamos el intento de ataque al servidor via WebSocket.
    // El servidor valida (modo creativo, distancia, cooldown) y decide si aplicar el daño.
    // El cliente aplica el daño SOLO cuando recibe 'player:damage_result' con applied=true.
    if (targetEntity && this.sprite) {
      const isPlayer = targetEntity.constructor?.name === "Player" || targetEntity === (window as any).__PLAYER_REF__;
      const targetId: string = isPlayer
        ? ((window as any).__PLAYER_ID__ ?? 'player')
        : (targetEntity.id ?? 'unknown');

      const settlementId: string = this.settlementId ?? ((window as any).__SETTLEMENT_ID__ ?? '');

      reportPlayerAttacked({
        ghostId: this.id,
        targetId,
        ghostX: this.sprite.x,
        ghostY: this.sprite.y,
        targetX: targetEntity.x ?? 0,
        targetY: targetEntity.y ?? 0,
        settlementId,
      });

      // El daño se aplicará en el listener de 'player:damage_result' en MainScene
      (window as any).__PLAYER_WAS_ATTACKED__ = { attacked: true, time: now, ghostId: this.id, pendingServerConfirmation: true };
    }
  }

  // ── Patrulla ──────────────────────────────────────────────────────────────

  private doPatrol(body: Phaser.Physics.Arcade.Body, scene: Phaser.Scene, _delta: number) {
    if (!this.sprite) return;

    const now = scene.time.now;
    const arrived =
      this.patrolTarget !== null &&
      Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.patrolTarget.x, this.patrolTarget.y) < 20;

    if (!this.patrolTarget || arrived || now >= this.patrolChangeAt) {
      this.patrolTarget = this.pickRandomPatrolPoint();
      this.patrolChangeAt = now + PATROL_MIN_MS + Math.random() * (PATROL_MAX_MS - PATROL_MIN_MS);
    }

    if (!this.patrolTarget) { body.setVelocity(0); return; }

    const dx = this.patrolTarget.x - this.sprite.x;
    const dy = this.patrolTarget.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 12) { body.setVelocity(0); return; }

    body.setVelocity((dx / dist) * GHOST_BASE_SPEED, (dy / dist) * GHOST_BASE_SPEED);
    if (Math.abs(dx) > 1) {
      // Sprite base mira a la izquierda: voltear a la derecha cuando dx > 0
      this.sprite.setFlipX(dx > 0);
    }
  }

  /**
   * Patrulla local alrededor del origen de spawn/posición actual (radio ~250px)
   * para no abandonar la zona ni alejarse inmediatamente del jugador.
   */
  private pickRandomPatrolPoint(): { x: number; y: number } {
    const originX = this.homeX || (this.sprite ? this.sprite.x : ISO_WORLD_WIDTH / 2);
    const originY = this.homeY || (this.sprite ? this.sprite.y : ISO_WORLD_HEIGHT / 2);
    const radius = 250;

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * radius;
      const x = Math.round(originX + Math.cos(angle) * r);
      const y = Math.round(originY + Math.sin(angle) * r);
      const { tileX, tileY } = isoToTile(x, y);
      if (!isBlockedTile(tileX, tileY)) return { x, y };
    }
    return { x: originX, y: originY };
  }

  // ── Daño / Muerte ─────────────────────────────────────────────────────────

  recibirDano(cantidad: number): boolean {
    if (this.isDead) return false;
    this.salud = Math.max(0, this.salud - cantidad);

    if (this.sprite?.active) {
      this.sprite.setTint(0xffffff);
      this.sprite.scene.time.delayedCall(120, () => {
        if (this.sprite?.active) this.sprite.setTint(0xaaddff);
      });
    }

    if (this.salud <= 0) { this.morir(); return true; }
    return false;
  }

  private morir() {
    this.isDead = true;
    if (!this.sprite) return;

    this.sprite.destroyBars();
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 500,
      ease: 'Power2',
      onComplete: () => { this.desinstanciarSprite(); },
    });

    console.log(`[Ghost] ${this.id} muerto.`);
    window.dispatchEvent(new CustomEvent('phaser-ghost-died', { detail: { id: this.id } }));
  }

  // ── Estado ────────────────────────────────────────────────────────────────

  get estaVivo(): boolean {
    return !this.isDead && this.salud > 0;
  }

  getPaqueteUI() {
    return {
      id: this.id,
      nombre: this.nombre,
      salud: this.salud,
      maxSalud: this.maxSalud,
      energia: this.energia,
      maxEnergia: this.maxEnergia,
      positionX: this.sprite?.x ?? 0,
      positionY: this.sprite?.y ?? 0,
      x: this.sprite?.x ?? 0,
      y: this.sprite?.y ?? 0,
    };
  }
}
