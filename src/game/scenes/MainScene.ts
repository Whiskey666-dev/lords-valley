import Phaser from "phaser";
import { Player } from "../../characters/Player";
import { Survivor } from "../../characters/Survivor";
import { DeadDragon, DEAD_DRAGON_ORDERS, COMPORTAMIENTOS, FUNCIONES, HABILIDAD_CATEGORIAS } from "../../characters/DeadDragon";
import { initAllCharacterAnimations } from "../../characters/Animations";
import { isGameInputBlocked, isActionJustDown } from "../../ui/input/KeyBindings";
import * as InputSystem from "../systems/InputSystem";
import { setupCamera, updateCamera } from "../systems/CameraSystem";
import { getCenterSpawn, spawnNpcs, spawnDeadDragons } from "../systems/SpawnSystem";
import { ChatBubbleSystem } from "../systems/ChatBubbleSystem";
import { CameraController } from "../systems/CameraController";
import { findNearestSafeIsoPos, tileToIso, worldToIso, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT, ISO_TILE_W, ISO_TILE_H } from "../world/Terrain";
import { collisionMatrix } from "../world/CollisionMatrix";
import { StaticGroundLayer } from "../layers/StaticGroundLayer";
import { DynamicLayer } from "../layers/DynamicLayer";
import { ChunkRenderer } from "../entities/ChunkRenderer";
import { fetchPlayer, savePlayerPos } from "../../app/api/player.api";
import { useGameStore } from "../../app/store/useGameStore";
import { getSocket } from "../../app/socket";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Survivor[] = [];
  private deadDragons: DeadDragon[] = [];
  private chatSystem!: ChatBubbleSystem;
  private cameraController!: CameraController;
  private chunkRenderer!: ChunkRenderer;
  private staticGround!: StaticGroundLayer;
  private dynamicLayer!: DynamicLayer;
  private cameraFollow = true;
  private lastViewportEmit = 0;
  private lastCameraX = 0;
  private lastCameraY = 0;

  constructor() { super("MainScene"); }

  create(): void {
    this.setupWorld();
    window.dispatchEvent(new CustomEvent("lords-loading-progress", {
      detail: { progress: 65, step: "Generando animaciones y entidades..." }
    }));
    initAllCharacterAnimations(this);
    this.verifyHumanAnimations();

    // Inicializar suelo y chunks isométricos
    this.staticGround = new StaticGroundLayer(this);
    this.staticGround.bake();
    this.chunkRenderer = new ChunkRenderer(this);

    window.dispatchEvent(new CustomEvent("lords-loading-progress", {
      detail: { progress: 80, step: "Generando terreno isométrico y colisiones..." }
    }));

    // Capa dinámica para entidades
    this.dynamicLayer = new DynamicLayer(this);

    this.spawnPlayer();
    this.setupNpcListeners();
    this.setupDeadDragonListeners();
    this.chatSystem = new ChatBubbleSystem(this);

    setupCamera(this, this.player, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT);
    this.setupRTSOverlay();
    this.setupDebug();

    // Render inicial de chunks alrededor de la cámara
    this.chunkRenderer.update(this.cameras.main);

    window.dispatchEvent(new CustomEvent("lords-loading-progress", {
      detail: { progress: 100, step: "¡Bienvenido a Lords Valley!" }
    }));
  }

  private setupNpcListeners(): void {
    const onSpawnRequest = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      spawnNpcs(this, count, this.player, this.npcs);
      this.npcs.slice(-count).forEach(n => { if (n.sprite) this.dynamicLayer.add(n.sprite as any); });
    };

    const onFocusNpc = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; x?: number; y?: number }>).detail;
      if (!detail) return;
      const target = this.npcs.find(n => n.id === detail.id);
      if (target && target.sprite) {
        if (this.cameraFollow) {
          this.cameraFollow = false;
          this.cameraController.setFollowMode(false);
        }
        this.cameras.main.centerOn(target.sprite.x, target.sprite.y);
        window.dispatchEvent(new CustomEvent("phaser-npc-selected", { detail: target.getPaqueteUI() }));
      } else if (typeof detail.x === "number" && typeof detail.y === "number") {
        if (this.cameraFollow) {
          this.cameraFollow = false;
          this.cameraController.setFollowMode(false);
        }
        this.cameras.main.centerOn(detail.x, detail.y);
      }
    };

    window.addEventListener("phaser-create-npcs", onSpawnRequest as EventListener);
    window.addEventListener("phaser-focus-npc", onFocusNpc as EventListener);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("phaser-create-npcs", onSpawnRequest as EventListener);
      window.removeEventListener("phaser-focus-npc", onFocusNpc as EventListener);
      this.npcs.forEach(n => n.desinstanciarSprite());
      this.npcs = [];
    });
  }

  private setupDeadDragonListeners(): void {
    const onSpawnDragons = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number; isAlly: boolean }>).detail;
      const count = detail?.count ?? 1;
      const isAlly = detail?.isAlly ?? true;
      spawnDeadDragons(this, count, isAlly, this.player as unknown as Phaser.GameObjects.GameObject & { x: number; y: number }, this.deadDragons, this.npcs);
      this.deadDragons.slice(-count).forEach(d => { if (d.sprite) this.dynamicLayer.add(d.sprite as any); });
    };

    const onFocusDragon = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; x?: number; y?: number }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target && target.sprite) {
        if (this.cameraFollow) {
          this.cameraFollow = false;
          this.cameraController.setFollowMode(false);
        }
        this.cameras.main.centerOn(target.sprite.x, target.sprite.y);
        window.dispatchEvent(new CustomEvent("phaser-dead-dragon-selected" as any, { detail: target.getPaqueteUI() }));
      } else if (typeof detail.x === "number" && typeof detail.y === "number") {
        if (this.cameraFollow) {
          this.cameraFollow = false;
          this.cameraController.setFollowMode(false);
        }
        this.cameras.main.centerOn(detail.x, detail.y);
      }
    };

    const onSetOrder = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; orden: string }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target && DEAD_DRAGON_ORDERS.includes(detail.orden as any)) {
        target.setOrden(detail.orden as any);
      }
    };

    const onDamageDragon = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; cantidad: number }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target) target.recibirDano(detail.cantidad ?? 100);
    };

    const onEquipDragon = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; slot: "montura" | "mochila"; item?: any }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (!target) return;
      if (detail.slot === "mochila") {
        if (detail.item === null) {
          target.equipMochila(null);
        } else if (detail.item) target.equipMochila(detail.item);
        else target.equipMochila({ id: "moch_"+Date.now(), nombre: "Mochila de Cuero", cantidad: 1, categoria: "Equipo" });
      } else if (detail.slot === "montura") {
        if (detail.item === null) target.equipMontura(null);
        else if (detail.item) target.equipMontura(detail.item);
        else target.equipMontura({ id: "mnt_"+Date.now(), nombre: "Montura Ósea", cantidad: 1, categoria: "Equipo" });
      }
    };

    const onUnequipDragon = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; slot: "montura" | "mochila" }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (!target) return;
      if (detail.slot === "mochila") target.equipMochila(null);
      if (detail.slot === "montura") target.equipMontura(null);
    };

    const onAddItem = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; item: any }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (!target || !detail.item) return;
      target.inventory.addItem(detail.item);
      window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated" as any, { detail: target.getPaqueteUI() }));
    };

    const onSetComportamiento = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; comportamiento: string }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target && (COMPORTAMIENTOS as string[]).includes(detail.comportamiento)) {
        target.setComportamiento(detail.comportamiento as any);
      }
    };
    const onSetFuncion = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; funcion: string }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target && (FUNCIONES as string[]).includes(detail.funcion)) {
        target.setFuncion(detail.funcion as any);
      }
    };
    const onToggleHabilidadCategoria = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; categoria: string }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target && (HABILIDAD_CATEGORIAS as string[]).includes(detail.categoria)) {
        target.toggleHabilidadCategoria(detail.categoria as any);
      }
    };
    const onToggleHabilidad = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; categoria: string; habilidad: string }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (target) target.toggleHabilidadSeleccionada(detail.categoria as any, detail.habilidad);
    };
    const onSetHogar = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; x?: number; y?: number }>).detail;
      if (!detail) return;
      const target = this.deadDragons.find(d => d.id === detail.id);
      if (!target) return;
      let x = detail.x, y = detail.y;
      if (typeof x !== "number" || typeof y !== "number") {
        if (target.sprite) { x = target.sprite.x; y = target.sprite.y; }
        else {
          const p = (window as any).__PLAYER_POS__ as { x: number; y: number } | undefined;
          if (p) { x = p.x; y = p.y; } else return;
        }
      }
      target.setHogar(x, y);
    };

    window.addEventListener("phaser-create-dead-dragons" as any, onSpawnDragons as EventListener);
    window.addEventListener("phaser-focus-dead-dragon" as any, onFocusDragon as EventListener);
    window.addEventListener("phaser-dead-dragon-set-order" as any, onSetOrder as EventListener);
    window.addEventListener("phaser-dead-dragon-set-comportamiento" as any, onSetComportamiento as EventListener);
    window.addEventListener("phaser-dead-dragon-set-funcion" as any, onSetFuncion as EventListener);
    window.addEventListener("phaser-dead-dragon-toggle-habilidad-cat" as any, onToggleHabilidadCategoria as EventListener);
    window.addEventListener("phaser-dead-dragon-toggle-habilidad" as any, onToggleHabilidad as EventListener);
    window.addEventListener("phaser-dead-dragon-set-hogar" as any, onSetHogar as EventListener);
    window.addEventListener("phaser-dead-dragon-damage" as any, onDamageDragon as EventListener);
    window.addEventListener("phaser-dead-dragon-equip" as any, onEquipDragon as EventListener);
    window.addEventListener("phaser-dead-dragon-unequip" as any, onUnequipDragon as EventListener);
    window.addEventListener("phaser-dead-dragon-add-item" as any, onAddItem as EventListener);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("phaser-create-dead-dragons" as any, onSpawnDragons as EventListener);
      window.removeEventListener("phaser-focus-dead-dragon" as any, onFocusDragon as EventListener);
      window.removeEventListener("phaser-dead-dragon-set-order" as any, onSetOrder as EventListener);
      window.removeEventListener("phaser-dead-dragon-set-comportamiento" as any, onSetComportamiento as EventListener);
      window.removeEventListener("phaser-dead-dragon-set-funcion" as any, onSetFuncion as EventListener);
      window.removeEventListener("phaser-dead-dragon-toggle-habilidad-cat" as any, onToggleHabilidadCategoria as EventListener);
      window.removeEventListener("phaser-dead-dragon-toggle-habilidad" as any, onToggleHabilidad as EventListener);
      window.removeEventListener("phaser-dead-dragon-set-hogar" as any, onSetHogar as EventListener);
      window.removeEventListener("phaser-dead-dragon-damage" as any, onDamageDragon as EventListener);
      window.removeEventListener("phaser-dead-dragon-equip" as any, onEquipDragon as EventListener);
      window.removeEventListener("phaser-dead-dragon-unequip" as any, onUnequipDragon as EventListener);
      window.removeEventListener("phaser-dead-dragon-add-item" as any, onAddItem as EventListener);
      this.deadDragons.forEach(d => d.desinstanciarSprite());
      this.deadDragons = [];
    });

    (window as any).__DEAD_DRAGON_API__ = {
      spawnAlly: (n=1) => window.dispatchEvent(new CustomEvent("phaser-create-dead-dragons" as any, { detail: { count: n, isAlly: true } })),
      spawnEnemy: (n=1) => window.dispatchEvent(new CustomEvent("phaser-create-dead-dragons" as any, { detail: { count: n, isAlly: false } })),
      damage: (id:string, cant=200) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-damage" as any, { detail: { id, cantidad: cant } })),
      setOrder: (id:string, orden:string) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-set-order" as any, { detail: { id, orden } })),
      setComportamiento: (id:string, c:string) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-set-comportamiento" as any, { detail: { id, comportamiento: c } })),
      setFuncion: (id:string, f:string) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-set-funcion" as any, { detail: { id, funcion: f } })),
      toggleHabilidadCat: (id:string, cat:string) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-toggle-habilidad-cat" as any, { detail: { id, categoria: cat } })),
      toggleHabilidad: (id:string, cat:string, hab:string) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-toggle-habilidad" as any, { detail: { id, categoria: cat, habilidad: hab } })),
      setHogar: (id:string, x?:number, y?:number) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-set-hogar" as any, { detail: { id, x, y } })),
      equipMochila: (id:string) => window.dispatchEvent(new CustomEvent("phaser-dead-dragon-equip" as any, { detail: { id, slot: "mochila" } })),
      list: () => this.deadDragons.map(d=>d.getPaqueteUI()),
    };
  }

  private setupWorld(): void {
    this.physics.world.setBounds(0, 0, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#111a11");
  }

  private lastSavePos = { x: 0, y: 0 };
  private spawnPlayer(): void {
    const spawn = getCenterSpawn(this);
    const isoSpawn = worldToIso(spawn.x, spawn.y);
    this.player = new Player(this, isoSpawn.x + ISO_TILE_W/2, isoSpawn.y + ISO_TILE_H/2);
    this.player.setOrigin(0.5, 0.5);

    try {
      if (collisionMatrix.isBlockedIso(this.player.x, this.player.y)) {
        const safe = findNearestSafeIsoPos(this.player.x, this.player.y);
        if (safe) {
          this.player.setPosition(safe.x, safe.y);
          console.log('[MainScene] Spawn iso corregido matriz', safe);
        }
      }
    } catch {}

    this.player.setInteractive({ useHandCursor: true });
    this.dynamicLayer?.add(this.player as any);

    this.player.on('pointerdown', async (pointer: Phaser.Input.Pointer) => {
      if ((pointer as any).middleButtonDown?.() || (pointer as any).rightButtonDown?.()) return;
      try {
        const settlement = (useGameStore as any).getState?.().settlement;
        const playerId = settlement?.ownerId || localStorage.getItem('playerId');
        if (!playerId) return;
        const dto = await fetchPlayer(playerId);
        window.dispatchEvent(new CustomEvent('phaser-npc-selected', { detail: {
          id: dto.id,
          name: dto.username,
          profession: 'Player',
          loyalty: 100,
          health: 100,
          isPlayer: true,
          email: dto.email,
          username: dto.username,
          settings: dto.settings,
          createdAt: dto.createdAt,
          positionX: this.player.x,
          positionY: this.player.y,
        }}));
      } catch (e) {
        window.dispatchEvent(new CustomEvent('phaser-npc-selected', { detail: {
          id: 'player',
          name: 'Tú (Player)',
          profession: 'Player',
          loyalty: 100,
          health: 100,
          isPlayer: true,
          positionX: this.player.x,
          positionY: this.player.y,
        }}));
      }
      try { (useGameStore as any).getState?.().clearSelection?.(); } catch {}
    });

    console.log("[MainScene] Player spawneado en", this.player.x.toFixed(0), this.player.y.toFixed(0));
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.savePlayerPos() });
    window.addEventListener('beforeunload', () => this.savePlayerPos());
  }

  private savePlayerPos() {
    try {
      if (!this.player) return;
      const x = Math.round(this.player.x), y = Math.round(this.player.y);
      if (Math.hypot(x - this.lastSavePos.x, y - this.lastSavePos.y) < 10) return;
      this.lastSavePos = { x, y };
      const playerId = localStorage.getItem('playerId') || (useGameStore as any).getState?.().settlement?.ownerId;
      if (!playerId) return;
      savePlayerPos(playerId, { x, y }).catch(() => {});
    } catch {}
  }

  private setupRTSOverlay(): void {
    this.cameraController = new CameraController(this.cameras.main, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT);
    this.cameraController.attach(this);
    this.cameraController.setFollowMode(this.cameraFollow);
    this.cameras.main.setLerp(0, 0);
    this.cameras.main.stopFollow();
    (window as any).__PHASER_CAMERA__ = this.cameras.main;

    window.addEventListener('minimap-goto', ((e: CustomEvent<{ chunkX: number; chunkY: number }>) => {
      const { chunkX, chunkY } = e.detail;
      if (this.cameraFollow) { this.cameraFollow = false; this.cameraController.setFollowMode(false); }
      const p = tileToIso(chunkX * 32 + 16, chunkY * 32 + 16);
      this.cameras.main.centerOn(p.x + ISO_TILE_W/2, p.y + ISO_TILE_H/2);
    }) as EventListener);

    window.addEventListener('minimap-goto-world' as any, ((e: CustomEvent<{ x: number; y: number }>) => {
      const { x, y } = (e as any).detail;
      if (typeof x === 'number' && typeof y === 'number') {
        if (this.cameraFollow) { this.cameraFollow = false; this.cameraController.setFollowMode(false); }
        this.cameras.main.centerOn(x, y);
      }
    }) as EventListener);

    window.addEventListener('wheel', (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false } as any);
  }

  private setupDebug(): void {
    if (this.input.keyboard) {
      this.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.ESC]);
    }
  }

  private verifyHumanAnimations(): void {
    const dirs = ["down", "up", "right", "left", "up_right", "up_left", "down_right", "down_left"] as const;
    const checks: string[] = [];
    for (const dir of dirs) {
      checks.push(`walk_${dir}`, `idle_${dir}`, `jump_${dir}`, `dash_${dir}`, `death_${dir}`, `attack_${dir}`);
      checks.push(`player_attack_${dir}`);
      checks.push(`npc_walk_${dir}`, `npc_idle_${dir}`, `npc_jump_${dir}`, `npc_dash_${dir}`, `npc_death_${dir}`, `npc_attack_${dir}`);
    }
    const missing: string[] = [];
    let ok = 0;
    for (const key of checks) {
      if (this.anims.exists(key)) ok++;
      else missing.push(key);
    }
    if (missing.length) console.warn(`[MainScene] Animaciones faltantes (${missing.length}):`, missing);
    else console.log(`[MainScene] ✓ Todas las animaciones humanas verificadas (${ok} anims)`);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (isActionJustDown(this, "cameraFollow")) {
      this.cameraFollow = !this.cameraFollow;
      this.cameraController.setFollowMode(this.cameraFollow);
      if (this.cameraFollow && this.player) this.cameras.main.centerOn(this.player.x, this.player.y);
      console.log(`[MainScene] Cámara ${this.cameraFollow ? "SIGUIENDO" : "LIBRE"}`);
      (window as any).__CAMERA_FOLLOW__ = this.cameraFollow;
      window.dispatchEvent(new CustomEvent('phaser-camera-follow', { detail: this.cameraFollow }));
    }
    
    // Renderizado dinámico de chunks visibles
    if (this.chunkRenderer && this.cameras.main) {
      this.chunkRenderer.update(this.cameras.main);
    }

    // Ordenamiento por profundidad de entidades dinámicas
    if (this.dynamicLayer) {
      this.dynamicLayer.sortByDepth(this.cameras.main);
    }
    
    // Viewport throttled 800ms + movedEnough
    if (this.cameras.main) {
      const movedEnough = Math.abs(this.cameras.main.scrollX - this.lastCameraX) > 512 ||
                          Math.abs(this.cameras.main.scrollY - this.lastCameraY) > 512;
      const enoughTime = Date.now() - this.lastViewportEmit > 800;
      if (movedEnough && enoughTime) {
        const minChunkX = Math.floor(this.cameras.main.scrollX / 1024);
        const minChunkY = Math.floor(this.cameras.main.scrollY / 1024);
        const maxChunkX = Math.floor((this.cameras.main.scrollX + this.cameras.main.width) / 1024);
        const maxChunkY = Math.floor((this.cameras.main.scrollY + this.cameras.main.height) / 1024);
        getSocket().emit('updateViewport', {
          minChunkX, minChunkY, maxChunkX, maxChunkY,
          settlementId: (useGameStore.getState()?.settlement?.ownerId || localStorage.getItem('playerId'))
        });
        this.lastViewportEmit = Date.now();
        this.lastCameraX = this.cameras.main.scrollX;
        this.lastCameraY = this.cameras.main.scrollY;
      }
    }
    if (this.cameraController) {
      this.cameraController.update(dt);
    }
    if (this.input.keyboard) {
      const shouldBlock = isGameInputBlocked();
      if (this.input.keyboard.enabled === shouldBlock) {
        this.input.keyboard.enabled = !shouldBlock;
        if (shouldBlock) this.input.keyboard.resetKeys();
      }
    }
    if (isGameInputBlocked()) {
      if (this.player) {
        const b = this.player.body as Phaser.Physics.Arcade.Body | undefined;
        if (b) b.setVelocity(0);
        this.player.updateEntity();
      }
      this.npcs.forEach(n => n.updateEntity());
      this.deadDragons.forEach(d => d.updateEntity());
      this.chatSystem.update(this.player);
      if (this.cameraFollow && this.player) updateCamera(this, this.player);
      if (this.player) (window as any).__PLAYER_POS__ = { x: this.player.x, y: this.player.y };
      const npcPositionsBlocked = this.npcs.filter(n => n.sprite && n.sprite.active).map(n => ({ ...n.getPaqueteUI(), x: n.sprite!.x, y: n.sprite!.y }));
      (window as any).__NPCS_POS__ = npcPositionsBlocked;
      const dragonPositionsBlocked = this.deadDragons.filter(d => d.sprite && d.sprite.active).map(d => ({ ...d.getPaqueteUI(), x: d.sprite!.x, y: d.sprite!.y }));
      (window as any).__DEAD_DRAGONS_POS__ = dragonPositionsBlocked;
      return;
    }
    if (InputSystem.isCloseJustPressed(this)) {
      window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
      window.dispatchEvent(new CustomEvent("phaser-dead-dragon-deselected" as any));
    }
    if (InputSystem.isInventoryJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-inventory"));
    if (InputSystem.isMapJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-map"));
    if (InputSystem.isMissionsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-missions"));
    if (InputSystem.isStatsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-stats"));

    if (this.player) {
      this.player.updateEntity();
      (window as any).__PLAYER_POS__ = { x: this.player.x, y: this.player.y };
    }

    this.npcs.forEach(n => n.updateEntity());
    const npcPositions = this.npcs
      .filter(n => n.sprite && n.sprite.active)
      .map(n => ({
        ...n.getPaqueteUI(),
        x: n.sprite!.x,
        y: n.sprite!.y,
      }));
    (window as any).__NPCS_POS__ = npcPositions;

    this.deadDragons.forEach(d => d.updateEntity());
    const dragonPositions = this.deadDragons
      .filter(d => d.sprite && d.sprite.active)
      .map(d => ({
        ...d.getPaqueteUI(),
        x: d.sprite!.x,
        y: d.sprite!.y,
      }));
    (window as any).__DEAD_DRAGONS_POS__ = dragonPositions;
    (window as any).__DEAD_DRAGON_COUNT__ = this.deadDragons.length;

    this.chatSystem.update(this.player);
    if (this.cameraFollow && this.player) {
      updateCamera(this, this.player);
    }
  }
}
