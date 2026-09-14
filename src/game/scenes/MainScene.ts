import Phaser from "phaser";
import { Player } from "../../characters/Player";
import { BASE_HUMAN_ORIGIN_Y } from "../../characters/BaseHuman";
import { Survivor } from "../../characters/Survivor";
import { DeadDragon, DEAD_DRAGON_ORDERS, COMPORTAMIENTOS, FUNCIONES, HABILIDAD_CATEGORIAS } from "../../characters/DeadDragon";
import { Ghost } from "../../characters/Ghost";
import { initAllCharacterAnimations } from "../../characters/Animations";
import { isGameInputBlocked, isActionJustDown } from "../../ui/input/KeyBindings";
import * as InputSystem from "../systems/InputSystem";
import { setupCamera, updateCamera } from "../systems/CameraSystem";
import { getCenterSpawn, spawnNpcs, spawnDeadDragons, spawnGhosts, requestServerGhostSpawn, initCombatSocket, findSafeSpawnPos, clampToIsoWorld } from "../systems/SpawnSystem";
import { ChatBubbleSystem } from "../systems/ChatBubbleSystem";
import { NeedBubbleSystem } from "../systems/NeedBubbleSystem";
import { CameraController } from "../systems/CameraController";
import { findNearestSafeIsoPos, tileToIso, worldToIso, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT, ISO_TILE_H } from "../world/Terrain";
import { collisionMatrix } from "../world/CollisionMatrix";
import { StaticGroundLayer } from "../layers/StaticGroundLayer";
import { DynamicLayer } from "../layers/DynamicLayer";
import { ChunkRenderer } from "../entities/ChunkRenderer";
import { FarmPlacementSystem } from "../systems/FarmPlacementSystem";
import { TerrainEditSystem } from "../systems/TerrainEditSystem";
import { TerrainOcclusionSystem } from "../systems/TerrainOcclusionSystem";
import { savePlayerPos, fetchMyNeeds } from "../../app/api/player.api";
import { setGameMode as apiSetGameMode, fetchSettlement } from "../../app/api/settlement.api";
import { PLAYER_NEEDS_EVENT } from "../../hooks/inventory/playerInventoryStore";
import { useGameStore } from "../../app/store/useGameStore";
import { getSocket, getCombatSocket, reportGhostDamage, reportCombatHit, reportRespawn, playerEntityId } from "../../app/socket";
import { CombatSystem } from "../../combat/CombatSystem";
import type { DragonCombatCtx } from "../../characters/DeadDragon";
import { SaveSystem } from "../../save/SaveSystem";

/** Daño base del jugador (lo reporta el cliente; el servidor lo acota a 200) */
const PLAYER_MELEE_DAMAGE = 50;
const PLAYER_MELEE_RANGE_GHOST = 150;
const PLAYER_MELEE_RANGE_DRAGON = 180;

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Survivor[] = [];
  private deadDragons: DeadDragon[] = [];
  private ghosts: Ghost[] = [];
  private chatSystem!: ChatBubbleSystem;
  /** Nubes flotantes 🍖/💧 sobre player y NPCs con hambre/sed >= 60. */
  private needBubbles!: NeedBubbleSystem;
  private cameraController!: CameraController;
  private chunkRenderer!: ChunkRenderer;
  private staticGround!: StaticGroundLayer;
  private dynamicLayer!: DynamicLayer;
  private farmPlacementSystem!: FarmPlacementSystem;
  // sistema de terreno es instanciado por side-effect; no necesita lectura directa
  private terrainEditSystem!: TerrainEditSystem;
  private terrainOcclusionSystem!: TerrainOcclusionSystem;
  private cameraFollow = true;
  private lastViewportEmit = 0;
  private lastCameraX = 0;
  private lastCameraY = 0;
  /** ID del settlement actual — requerido para operaciones server-side (ghost spawn, game mode) */
  private settlementId: string | null = null;

  /**
   * Resuelve el settlement desde el store hidratado o localStorage.
   * Sin esto los ghosts caen al fallback local (sin registro en servidor)
   * y el servidor rechaza todo su combate con ghost_not_found_or_dead.
   */
  private resolveSettlementId(): string | null {
    try {
      const fromStore = (useGameStore as any).getState?.()?.settlement?.id as string | undefined;
      const fromLs = localStorage.getItem("settlementId");
      const sid = fromStore ?? fromLs ?? null;
      if (sid) {
        this.settlementId = sid;
        (window as any).__SETTLEMENT_ID__ = sid;
      }
      return sid;
    } catch {
      return this.settlementId;
    }
  }
  /** Punto donde el jugador apareció por primera vez: respawn al morir */
  private firstSpawnPos: { x: number; y: number } | null = null;
  private playerDead = false;
  private prevPlayerAttacking = false;

  constructor() { super("MainScene"); }

  create(): void {
    try {
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
      this.resolveSettlementId();
      this.setupNpcListeners();
      this.setupDeadDragonListeners();
      this.setupGhostListeners();
      this.restoreSavedGame();
      this.chatSystem = new ChatBubbleSystem(this);
      this.needBubbles = new NeedBubbleSystem(this);
      this.setupNeedsSync();
      this.farmPlacementSystem = new FarmPlacementSystem(this);
      this.terrainEditSystem = new TerrainEditSystem(this);
      void this.terrainEditSystem;
      this.terrainOcclusionSystem = new TerrainOcclusionSystem(this);

      setupCamera(this, this.player, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT);
      this.setupRTSOverlay();
      this.setupDebug();

      // Render inicial de chunks alrededor de la cámara
      this.chunkRenderer.update(this.cameras.main);
    } catch (e) {
      console.error("[MainScene] Error en create, forzando fin de carga", e);
      window.dispatchEvent(new CustomEvent("lords-loading-progress", { detail: { progress: 90, step: "Recuperando carga..." } }));
    } finally {
      // Siempre desbloquear la pantalla de carga aunque haya error
      window.dispatchEvent(new CustomEvent("lords-loading-progress", {
        detail: { progress: 100, step: "¡Bienvenido a Lords Valley!" }
      }));
      // fallback extra por si el evento se pierde por timing
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("lords-loading-progress", { detail: { progress: 100, step: "¡Bienvenido a Lords Valley!" } }));
      }, 400);
    }
  }

  private setupNpcListeners(): void {
    const onSpawnRequest = (e: Event) => {
      if (!this.sceneAlive) return;
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      // Con settlementId los NPCs nacen server-side (UUID reales); sin él, fallback local.
      const sid = this.settlementId ?? this.resolveSettlementId() ?? undefined;
      void spawnNpcs(this, count, this.player, this.npcs, sid).then(() => {
        if (!this.sceneAlive) return;
        this.npcs.slice(-count).forEach(n => { if (n.sprite) this.dynamicLayer.add(n.sprite as any); });
        this.saveFullGameState();
      });
    };

    const onFocusNpc = (e: Event) => {
      if (!this.sceneAlive) return;
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
    // Muerte real: filtra el caído, cierra su panel y guarda
    const onNpcDied = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (!detail) return;
      this.npcs = this.npcs.filter(n => n.id !== detail.id || n.estaVivo);
      window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
      this.saveFullGameState();
    };
    window.addEventListener("phaser-npc-died" as any, onNpcDied as EventListener);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("phaser-create-npcs", onSpawnRequest as EventListener);
      window.removeEventListener("phaser-focus-npc", onFocusNpc as EventListener);
      window.removeEventListener("phaser-npc-died" as any, onNpcDied as EventListener);
      this.npcs.forEach(n => n.desinstanciarSprite());
      this.npcs = [];
    });
  }

  private setupDeadDragonListeners(): void {
    const onSpawnDragons = (e: Event) => {
      if (!this.sceneAlive) return;
      const detail = (e as CustomEvent<{ count: number; isAlly: boolean }>).detail;
      const count = detail?.count ?? 1;
      const isAlly = detail?.isAlly ?? true;
      spawnDeadDragons(this, count, isAlly, this.player as unknown as Phaser.GameObjects.GameObject & { x: number; y: number }, this.deadDragons, this.npcs);
      this.deadDragons.slice(-count).forEach(d => { if (d.sprite) this.dynamicLayer.add(d.sprite as any); });
      this.saveFullGameState();
    };

    const onFocusDragon = (e: Event) => {
      if (!this.sceneAlive) return;
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
      if (!this.sceneAlive) return;
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
    // Muerte real: filtra el caído, cierra su panel y guarda
    const onDragonDied = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (!detail) return;
      this.deadDragons = this.deadDragons.filter(d => d.id !== detail.id || d.estaVivo);
      window.dispatchEvent(new CustomEvent("phaser-dead-dragon-deselected" as any));
      this.saveFullGameState();
    };
    window.addEventListener("phaser-dead-dragon-died" as any, onDragonDied as EventListener);
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
      window.removeEventListener("phaser-dead-dragon-died" as any, onDragonDied as EventListener);
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

  // ── Ghost listeners + comandos de consola spawnGhost1/2/3 ────────────────
  private setupGhostListeners(): void {
    // ── Listener para spawn de ghosts desde UI (delega al servidor) ──
    const onSpawnGhosts = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      // Re-resuelve por si el store se hidrató después del create
      const sid = this.settlementId ?? this.resolveSettlementId() ?? undefined;
      if (sid) initCombatSocket(sid);
      // Solicitar al servidor en lugar de generar localmente
      requestServerGhostSpawn(count, sid);
    };

    // ── Render de ghosts autoritativos del servidor (coords iso) ──
    // Unifica 'ghost:spawned' y 'ghost:active_list': crea solo los que no existen
    // (dedupe por id) y acota al mundo iso. El servidor es la autoridad del HP/stats.
    // ── Listener 'ghost:spawned' del servidor (WebSocket /combat namespace) ──
    // El servidor genera IDs UUID y stats canónicos; el cliente crea el sprite de rendering.
    // Registro idempotente: el socket es singleton y puede haber listeners de una
    // escena anterior; el off previo evita duplicados y el guard la escena muerta.
    const combatSock = getCombatSocket();
    combatSock.off('ghost:spawned');
    combatSock.off('ghost:active_list');
    combatSock.off('ghost:died');
    combatSock.off('ghost:damage_result');
    combatSock.off('combat:hit_result');
    combatSock.off('combat:died');
    combatSock.off('player:damage_result');
    combatSock.on('ghost:spawned', (data: { ghosts: any[]; settlementId: string }) => {
      if (!this.sceneAlive) return;
      if (!data?.ghosts) return;
      const added = this.renderServerGhosts(data.ghosts);
      window.dispatchEvent(new CustomEvent("phaser-ghosts-spawned" as any, {
        detail: { count: added, total: this.ghosts.length }
      }));
      this.saveFullGameState();
    });

    // ── Lista de ghosts activos al unirse al room ──
    // El servidor vive en memoria: tras recargar la página los ghosts anteriores
    // siguen activos allí; sin este render serían atacantes invisibles.
    combatSock.on('ghost:active_list', (data: { ghosts: any[]; settlementId: string }) => {
      if (!this.sceneAlive) return;
      if (!data?.ghosts || data.ghosts.length === 0) return;
      const added = this.renderServerGhosts(data.ghosts);
      if (added > 0) {
        console.log(`[MainScene] ${added} ghost(s) activos re-renderizados del servidor`);
        window.dispatchEvent(new CustomEvent("phaser-ghosts-spawned" as any, {
          detail: { count: added, total: this.ghosts.length }
        }));
        this.saveFullGameState();
      }
    });

    // ── Listener 'ghost:died' del servidor ──
    combatSock.on('ghost:died', (data: { ghostId: string }) => {
      if (!this.sceneAlive) return;
      this.ghosts = this.ghosts.filter(g => g.id !== data.ghostId || g.estaVivo);
      this.saveFullGameState();
    });

    // ── Listener 'ghost:damage_result' — HP autoritativo del ghost ──
    // El cliente sincroniza el HP del servidor (nunca lo calcula). Si muere, morir() lo desvanece.
    combatSock.on('ghost:damage_result', (result: { applied: boolean; ghostId: string; newHp: number; isDead: boolean }) => {
      if (!this.sceneAlive) return;
      if (!result.applied || typeof result.newHp !== 'number') return;
      const ghost = this.ghosts.find(g => g.id === result.ghostId);
      if (ghost) ghost.applyServerDamage(result.newHp);
    });

    // ── Listener 'combat:hit_result' — golpes genéricos validados por el servidor ──
    combatSock.on('combat:hit_result', (result: { applied: boolean; damage: number; targetId: string; targetKind: string; targetHp: number; targetMaxHp: number; isDead: boolean }) => {
      if (!this.sceneAlive) return;
      if (!result.applied || typeof result.targetHp !== 'number' || typeof result.targetKind !== 'string') return;
      this.applyCombatHitResult(result.targetKind, result.targetId, result.targetHp, result.targetMaxHp);
    });

    // ── Listener 'combat:died' (broadcast) — asegura la muerte en todos los clientes ──
    combatSock.on('combat:died', (data: { targetId: string; targetKind: string }) => {
      if (!this.sceneAlive) return;
      if (data.targetKind === 'player') {
        this.onPlayerDiedFromServer();
        return;
      }
      this.applyCombatHitResult(data.targetKind, data.targetId, 0);
    });
    // ── Listener 'player:damage_result' — daño solo se aplica si el servidor lo confirma ──
    combatSock.on('player:damage_result', (result: { applied: boolean; amount: number; targetId: string; rejectedReason?: string; targetHp?: number; isDead?: boolean }) => {
      if (!this.sceneAlive) return;
      if (!result.applied) {
        if (result.rejectedReason && result.rejectedReason !== 'creative_mode' && result.rejectedReason !== 'god_mode' && result.rejectedReason !== 'target_dead') {
          console.warn('[MainScene] Daño rechazado por servidor:', result.rejectedReason);
        }
        (window as any).__PLAYER_WAS_ATTACKED__ = { attacked: false, pendingServerConfirmation: false };
        return;
      }
      if (typeof result.targetHp === 'number') {
        this.applyPlayerDamage(result.targetHp);
      } else if (this.player && !this.playerDead) {
        if (this.player.recibirDano(result.amount) && !this.playerDead) this.playerDeathSeq();
      }
      (window as any).__PLAYER_WAS_ATTACKED__ = { attacked: true, amount: result.amount, pendingServerConfirmation: false };
      console.log(`[MainScene] Daño confirmado por servidor: ${result.amount}`);
    });

    // ── Fallback local para spawn sin settlementId (offline/debug) ──
    const onSpawnGhostsLocal = (e: Event) => {
      if (!this.sceneAlive) return;
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      const prevLen = this.ghosts.length;
      spawnGhosts(this, count, this.player as unknown as Phaser.GameObjects.GameObject & { x: number; y: number }, this.ghosts, this.npcs);
      for (let i = prevLen; i < this.ghosts.length; i++) {
        const g = this.ghosts[i];
        if (g.sprite) this.dynamicLayer.add(g.sprite as any);
      }
      this.saveFullGameState();
    };
    window.addEventListener('phaser-create-ghosts-local' as any, onSpawnGhostsLocal as EventListener);

    const onGhostDied = () => {
      this.ghosts = this.ghosts.filter(g => g.estaVivo);
      this.saveFullGameState();
    };

    window.addEventListener('phaser-create-ghosts' as any, onSpawnGhosts as EventListener);
    window.addEventListener('phaser-ghost-died' as any, onGhostDied as EventListener);

    // ── GodMode (comando GodModeOn/Off, validado por el servidor) ──
    // El servidor rechaza el daño (rejectedReason 'god_mode'); aquí solo se guarda
    // el flag para que otros sistemas cliente puedan consultarlo.
    const onGodMode = (e: Event) => {
      const detail = (e as CustomEvent<{ on: boolean }>).detail;
      (window as any).__GOD_MODE__ = detail?.on === true;
      console.log(`[MainScene] GodMode: ${(window as any).__GOD_MODE__ ? 'ON' : 'OFF'} (servidor)`);
    };
    window.addEventListener('phaser-godmode' as any, onGodMode as EventListener);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('phaser-create-ghosts' as any, onSpawnGhosts as EventListener);
      window.removeEventListener('phaser-create-ghosts-local' as any, onSpawnGhostsLocal as EventListener);
      window.removeEventListener('phaser-ghost-died' as any, onGhostDied as EventListener);
      window.removeEventListener('phaser-godmode' as any, onGodMode as EventListener);
      combatSock.off('ghost:spawned');
      combatSock.off('ghost:active_list');
      combatSock.off('ghost:died');
      combatSock.off('ghost:damage_result');
      combatSock.off('combat:hit_result');
      combatSock.off('combat:died');
      combatSock.off('player:damage_result');
      this.ghosts.forEach(g => g.desinstanciarSprite());
      this.ghosts = [];
      delete (window as any).spawnGhost;
      delete (window as any).spawnGhost1;
      delete (window as any).spawnGhost2;
      delete (window as any).spawnGhost3;
      delete (window as any).ghosts;
      delete (window as any).__GHOSTS__;
      delete (window as any).__GHOST_API__;
      delete (window as any).__GHOSTS_POS__;
      delete (window as any).__GHOST_COUNT__;
      delete (window as any).CreativeMode;
      delete (window as any).SurvivalMode;
      delete (window as any).saveGame;
      delete (window as any).clearSave;
      window.removeEventListener('phaser-game-mode' as any, onGameMode as EventListener);
    });

    const onGameMode = (e: Event) => {
      const detail = (e as CustomEvent<{ mode: 'creative' | 'survival' }>).detail;
      if (!detail?.mode) return;
      // Delegar al servidor — el servidor es la autoridad del gameMode
      if (this.settlementId) {
        apiSetGameMode(this.settlementId, detail.mode)
          .then(() => console.log(`[MainScene] Modo de juego guardado en servidor: ${detail.mode}`))
          .catch((err) => console.warn('[MainScene] Error al guardar modo en servidor:', err));
      }
      (window as any).__GAME_MODE__ = detail.mode;
      console.log(`[MainScene] Modo: ${detail.mode}`);
      this.saveFullGameState();
    };
    window.addEventListener('phaser-game-mode' as any, onGameMode as EventListener);

    // Estado inicial: leer desde store (datos del servidor)
    const storeSettlement = (useGameStore as any).getState?.()?.settlement;
    const initialMode = storeSettlement?.gameMode ?? 'survival';
    (window as any).__GAME_MODE__ = initialMode;
    console.log(`[MainScene] Modo inicial (servidor): ${initialMode}`);

    // Comandos de consola — llaman al servidor vía PATCH /game-mode
    (window as any).CreativeMode = () => {
      if (!this.settlementId) return '⚠️ Sin settlementId';
      window.dispatchEvent(new CustomEvent('phaser-game-mode' as any, { detail: { mode: 'creative' } }));
      return '🎨 Modo Creativo solicitado al servidor';
    };
    (window as any).SurvivalMode = () => {
      if (!this.settlementId) return '⚠️ Sin settlementId';
      window.dispatchEvent(new CustomEvent('phaser-game-mode' as any, { detail: { mode: 'survival' } }));
      return '⚔️ Modo Supervivencia solicitado al servidor';
    };

    (window as any).saveGame = () => { this.saveFullGameState(); return '💾 Partida guardada.'; };
    (window as any).clearSave = () => { SaveSystem.clear(); return '🗑️ Guardado eliminado.'; };

    const dispatchGhost = (count: number) => {
      window.dispatchEvent(new CustomEvent('phaser-create-ghosts' as any, { detail: { count } }));
      return `✓ ${count} Ghost(s) solicitados al servidor`;
    };

    (window as any).spawnGhost = (n = 1) => dispatchGhost(n);
    (window as any).spawnGhost1 = () => dispatchGhost(1);
    (window as any).spawnGhost2 = () => dispatchGhost(2);
    (window as any).spawnGhost3 = () => dispatchGhost(3);
    (window as any).ghosts = this.ghosts;
    (window as any).__GHOSTS__ = this.ghosts;
    (window as any).__GHOST_API__ = {
      spawn: (n = 1) => dispatchGhost(n),
      list: () => this.ghosts.map(g => g.getPaqueteUI()),
      kill: (id: string) => { const g = this.ghosts.find(g => g.id === id); if (g) g.recibirDano(9999); },
    };

    console.log('[MainScene] Ghost listeners OK (servidor). Comandos: spawnGhost1/2/3 | CreativeMode | SurvivalMode | saveGame | clearSave');
  }

  /**
   * Crea sprites para ghosts autoritativos del servidor.
   * Deduplica por id (spawn + active_list pueden solaparse) y acota al mundo iso.
   * Retorna cuántos se añadieron.
   */
  private renderServerGhosts(ghostList: any[]): number {
    let added = 0;
    for (const ghostData of ghostList) {
      if (!ghostData?.id) continue;
      if (this.ghosts.some(g => g.id === ghostData.id)) continue;
      const ghost = Ghost.fromServerData(ghostData);
      const fallback = this.player ? { x: this.player.x, y: this.player.y } : { x: 6144, y: 3072 };
      const rawX = typeof ghostData.positionX === 'number' ? ghostData.positionX : fallback.x;
      const rawY = typeof ghostData.positionY === 'number' ? ghostData.positionY : fallback.y;
      const { x: spawnX, y: spawnY } = clampToIsoWorld(rawX, rawY);
      ghost.instanciarSprite(this, spawnX, spawnY);
      this.ghosts.push(ghost);
      if (ghost.sprite) {
        this.dynamicLayer?.add(ghost.sprite as any);
        console.log(`[MainScene] Ghost ${ghost.id} [server] en (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
        added++;
      }
    }
    return added;
  }

  /**
   * El socket de combate es singleton entre instancias del juego (StrictMode
   * monta dos juegos en dev, HMR, re-auth). Un listener de una escena ya
   * destruida (`scene.sys === null`) debe ignorar el evento: si tocara Phaser
   * reventaría (`queueDepthSort` de null) e impediría que la escena viva lo procese.
   */
  private get sceneAlive(): boolean {
    try {
      const sys = this.sys as Phaser.Scenes.Systems | null | undefined;
      return !!sys && typeof sys.isActive === 'function' && sys.isActive();
    } catch {
      return false;
    }
  }

  // ── Daño validado por el servidor: aplica HP a NPCs/mobs ──
  // El cliente nunca calcula HP: sincroniza el valor autoritativo y la entidad
  // muestra barras en porcentaje y muere/desaparece si llega a 0.
  private applyCombatHitResult(targetKind: string, targetId: string, targetHp: number, targetMaxHp?: number): void {    if (targetKind === 'survivor') {
      const npc = this.npcs.find(n => n.id === targetId);
      if (npc) npc.applyServerDamage(targetHp, targetMaxHp ?? npc.stats.maxSalud);
    } else if (targetKind === 'dead-dragon') {
      const dragon = this.deadDragons.find(d => d.id === targetId);
      if (dragon) dragon.applyServerDamage(targetHp, targetMaxHp ?? dragon.stats.maxSalud);
    } else if (targetKind === 'ghost') {
      const ghost = this.ghosts.find(g => g.id === targetId);
      if (ghost) ghost.applyServerDamage(targetHp);
    } else if (targetKind === 'player') {
      this.applyPlayerDamage(targetHp);
    }
  }

  // ── Player: daño, muerte con animación y respawn en el punto inicial ──
  private applyPlayerDamage(targetHp: number): void {
    if (!this.player || this.playerDead) return;
    this.player.applyServerDamage(targetHp, this.player.maxSalud);
    if (!this.player.estaVivo) this.playerDeathSeq();
  }

  private onPlayerDiedFromServer(): void {
    if (!this.player || this.playerDead) return;
    this.playerDeathSeq();
  }

  private playerDeathSeq(): void {
    if (!this.player || this.playerDead) return;
    this.playerDead = true;
    this.player.morir();
    window.dispatchEvent(new CustomEvent('phaser-player-died' as any));
    console.log('[MainScene] ☠️ El jugador ha muerto. Respawn en 1.6s...');
    this.time.delayedCall(1600, () => {
      if (!this.player) return;
      const spawn = this.firstSpawnPos ?? { x: this.player.x, y: this.player.y };
      this.player.respawn(spawn.x, spawn.y);
      reportRespawn(playerEntityId(), 'player');
      this.playerDead = false;
      if (this.cameraFollow) this.cameras.main.centerOn(spawn.x, spawn.y);
      this.saveFullGameState();
      window.dispatchEvent(new CustomEvent('phaser-player-respawned' as any, { detail: { ...spawn } }));
    });
  }

  // ── Player ataca: reporta el golpe al servidor (él valida y decreta) ──
  private playerMeleeStrike(): void {
    if (!this.player || this.playerDead) return;
    const px = this.player.x, py = this.player.y;
    let bestGhost: { id: string; d: number } | null = null;
    for (const g of this.ghosts) {
      if (!g.estaVivo || !g.sprite?.active) continue;
      const d = Math.hypot(g.sprite.x - px, g.sprite.y - py);
      if (d <= PLAYER_MELEE_RANGE_GHOST && (!bestGhost || d < bestGhost.d)) bestGhost = { id: g.id, d };
    }
    let bestDragon: { id: string; x: number; y: number; d: number } | null = null;
    for (const d of this.deadDragons) {
      if (d.isAlly || !d.estaVivo || !d.sprite?.active) continue;
      const dd = Math.hypot(d.sprite.x - px, d.sprite.y - py);
      if (dd <= PLAYER_MELEE_RANGE_DRAGON && (!bestDragon || dd < bestDragon.d)) {
        bestDragon = { id: d.id, x: d.sprite.x, y: d.sprite.y, d: dd };
      }
    }
    // Sin fuego amigo: solo fantasmas y dragones enemigos
    if (bestGhost && (!bestDragon || bestGhost.d <= bestDragon.d)) {
      reportGhostDamage({
        ghostId: bestGhost.id,
        amount: PLAYER_MELEE_DAMAGE,
        attackerId: playerEntityId(),
        attackerX: px,
        attackerY: py,
      });
    } else if (bestDragon) {
      reportCombatHit({
        attackerId: playerEntityId(),
        attackerKind: 'player',
        targetId: bestDragon.id,
        targetKind: 'dead-dragon',
        attackerX: px,
        attackerY: py,
        targetX: bestDragon.x,
        targetY: bestDragon.y,
        amount: PLAYER_MELEE_DAMAGE,
      });
    }
  }

  private buildDragonCtx(): DragonCombatCtx {
    return {
      player: this.player ? { x: this.player.x, y: this.player.y } : null,
      playerAlive: !!this.player && !this.playerDead,
      npcs: this.npcs,
      ghosts: this.ghosts,
      dragons: this.deadDragons,
    };
  }

  /**
   * Sincronía autoritativa de hambre/sed:
   * - Player: el backend es la autoridad (/player/me/needs, decaimiento 5h).
   *   Se aplica al usar Pan/Odre (evento) + polling cada 20s para corregir deriva.
   * - NPCs: el core es la autoridad (SimulationEngine 5h). Se corrige cada 60s
   *   desde el settlement. Entre polls, el cliente predice (Needs.tick) y los
   *   NPC auto-comen Pan localmente.
   */
  private setupNeedsSync(): void {
    const onNeedsChanged = (e: Event) => {
      if (!this.sceneAlive || !this.player) return;
      const detail = (e as CustomEvent<{ hunger: number; thirst: number }>).detail;
      if (typeof detail?.hunger === "number" && typeof detail?.thirst === "number") {
        this.player.syncNeedsFromServer(detail.hunger, detail.thirst);
      }
    };
    window.addEventListener(PLAYER_NEEDS_EVENT, onNeedsChanged as EventListener);

    // Estado inicial del servidor (corrige la predicción local al entrar)
    fetchMyNeeds().then(
      (n) => {
        if (this.sceneAlive && this.player && typeof n?.hunger === "number") {
          this.player.syncNeedsFromServer(n.hunger, n.thirst);
        }
      },
      () => {},
    );

    // Polling player cada 20s (deriva del decaimiento 5h)
    const playerTimer = this.time.addEvent({
      delay: 20000,
      loop: true,
      callback: () => {
        if (!this.sceneAlive || !this.player) return;
        fetchMyNeeds().then(
          (n) => {
            if (this.sceneAlive && this.player && typeof n?.hunger === "number") {
              this.player.syncNeedsFromServer(n.hunger, n.thirst);
            }
          },
          () => {},
        );
      },
    });

    // Polling NPCs cada 60s desde el settlement (autoridad del core)
    const npcTimer = this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => {
        if (!this.sceneAlive || this.npcs.length === 0) return;
        const sid = this.settlementId ?? (window as any).__SETTLEMENT_ID__ ?? null;
        if (!sid) return;
        fetchSettlement(sid).then(
          (s) => {
            if (!this.sceneAlive || !Array.isArray(s?.survivors)) return;
            const byId = new Map((s.survivors as any[]).map((sv: any) => [sv?.id, sv]));
            for (const npc of this.npcs) {
              const srv = byId.get(npc.id) as any;
              const needs = srv?.needs;
              if (needs && typeof needs.hunger === "number" && typeof needs.thirst === "number") {
                npc.needs.syncFromServer(needs.hunger, needs.thirst, needs.fatigue);
              }
            }
          },
          () => {},
        );
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener(PLAYER_NEEDS_EVENT, onNeedsChanged as EventListener);
      try {
        playerTimer.destroy();
      } catch {}
      try {
        npcTimer.destroy();
      } catch {}
      try {
        this.needBubbles?.destroy();
      } catch {}
    });
  }

  private setupWorld(): void {
    this.physics.world.setBounds(0, 0, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#111a11");
  }

  private lastSavePos = { x: 0, y: 0 };
  private spawnPlayer(): void {
    const spawn = getCenterSpawn(this);
    const isoSpawn = worldToIso(spawn.x, spawn.y);
    this.player = new Player(this, isoSpawn.x, isoSpawn.y + ISO_TILE_H/2);
    this.player.setOrigin(0.5, BASE_HUMAN_ORIGIN_Y);

    try {
      if (collisionMatrix.isBlockedIso(this.player.x, this.player.y)) {
        const safe = findNearestSafeIsoPos(this.player.x, this.player.y);
        if (safe) {
          this.player.setPosition(safe.x, safe.y);
          console.log('[MainScene] Spawn iso corregido matriz', safe);
        }
      }
    } catch {}

    this.dynamicLayer?.add(this.player as any);

    console.log("[MainScene] Player spawneado en", this.player.x.toFixed(0), this.player.y.toFixed(0));
    // Punto de respawn: donde apareció por primera vez
    this.firstSpawnPos = { x: this.player.x, y: this.player.y };
    this.playerDead = false;
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        this.savePlayerPos();
        this.saveFullGameState();
      },
    });
    // Guardado al salir: beforeunload + pagehide + visibilitychange (los móviles y la
    // navegación SPA no siempre disparan beforeunload). El guard sceneAlive impide que
    // una escena destruida (StrictMode/HMR) sobrescriba con arrays vacíos, y el SHUTDOWN
    // elimina los listeners para no acumular closured muertos.
    const saveOnExit = () => {
      if (!this.sceneAlive) return;
      this.savePlayerPos();
      this.saveFullGameState();
    };
    const onVisibilityHidden = () => { if (document.visibilityState === 'hidden') saveOnExit(); };
    window.addEventListener('beforeunload', saveOnExit);
    window.addEventListener('pagehide', saveOnExit);
    document.addEventListener('visibilitychange', onVisibilityHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('beforeunload', saveOnExit);
      window.removeEventListener('pagehide', saveOnExit);
      document.removeEventListener('visibilitychange', onVisibilityHidden);
    });
  }

  private savePlayerPos() {
    try {
      if (!this.player) return;
      const x = Math.round(this.player.x), y = Math.round(this.player.y);
      if (Math.hypot(x - this.lastSavePos.x, y - this.lastSavePos.y) < 10) return;
      this.lastSavePos = { x, y };
      // Obtener playerId desde el store (datos del servidor) — no desde localStorage (hackeable)
      const playerId = (useGameStore as any).getState?.().settlement?.ownerId
        ?? (useGameStore as any).getState?.().playerId;
      if (!playerId) return;
      savePlayerPos(playerId, { x, y }).catch(() => {});
    } catch {}
  }

  private saveFullGameState(): void {
    try {
      const playerPos = this.player ? { x: this.player.x, y: this.player.y } : undefined;
      // Leer gameMode desde __GAME_MODE__ (seteado por el servidor) — no desde __CREATIVE_MODE__ (hackeable)
      const gameMode = ((window as any).__GAME_MODE__ ?? 'survival') as 'creative' | 'survival';
      SaveSystem.saveGameState(playerPos, this.npcs, this.deadDragons, this.ghosts, gameMode);
    } catch (e) {
      console.warn('[MainScene] Error al guardar partida completa', e);
    }
  }

  private restoreSavedGame(): void {
    try {
      const save = SaveSystem.load();
      if (!save) {
        console.log('[MainScene] No se encontró partida guardada previa. Iniciando partida nueva.');
        this.startNewGameSpawns();
        return;
      }

      console.log(
        `[MainScene] 💾 Restaurando partida guardada (${new Date(save.timestamp).toLocaleTimeString()}): ` +
        `${save.npcs.length} NPCs, ${save.deadDragons.length} Dead Dragons, ${save.ghosts.length} Ghosts, modo=${save.gameMode}`
      );

      // Restaurar modo de juego — usar datos del servidor como fuente de verdad
      // Si el store tiene el gameMode del servidor, usarlo. Si no, usar el guardado local como fallback.
      const storeSettlement = (useGameStore as any).getState?.()?.settlement;
      const serverGameMode: string = storeSettlement?.gameMode ?? save.gameMode ?? 'survival';
      (window as any).__GAME_MODE__ = serverGameMode;
      console.log(`[MainScene] Modo de juego restaurado desde servidor: ${serverGameMode}`);

      // Inicializar combat socket con el settlementId
      if (this.settlementId) {
        initCombatSocket(this.settlementId);
      }

      // Restaurar posición del jugador si existe y es válida
      if (save.playerPos && this.player && typeof save.playerPos.x === 'number' && typeof save.playerPos.y === 'number') {
        this.player.setPosition(save.playerPos.x, save.playerPos.y);
        if (this.cameraFollow) {
          this.cameras.main.centerOn(save.playerPos.x, save.playerPos.y);
        }
      }

      // Restaurar NPCs (Survivors): el servidor es autoridad de identidad/stats,
      // el guardado local es autoridad de la ÚLTIMA POSICIÓN iso.
      // Se restauran TODOS: los del servidor + los locales que el servidor no conoce.
      const serverSurvivors = (storeSettlement?.survivors && Array.isArray(storeSettlement.survivors))
        ? storeSettlement.survivors
        : [];
      const serverIds = new Set(serverSurvivors.map((s: any) => s?.id).filter(Boolean));
      if (serverSurvivors.length > 0) {
        console.log(`[MainScene] 🛡️ Restaurando ${serverSurvivors.length} NPCs autoritativos desde el backend...`);
        for (const sData of serverSurvivors) {
          if (!sData?.id) continue;
          const localCache = save.npcs?.find((n: any) => n.id === sData.id);
          const surv = Survivor.fromServerData(sData);
          // Última posición guardada (iso) si es válida; si no, punto seguro fresco.
          // NUNCA la positionX del servidor: vive en espacio tile (zona oeste en iso).
          const cached = localCache && typeof localCache.x === 'number' && typeof localCache.y === 'number'
            && !(localCache.x === 0 && localCache.y === 0)
            ? clampToIsoWorld(localCache.x, localCache.y)
            : null;
          const otherSprites = this.npcs.map(n => n.sprite).filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];
          const pos = cached ?? findSafeSpawnPos(
            this.player as unknown as Phaser.GameObjects.GameObject & { x: number; y: number },
            80, 220, otherSprites, 50,
          );
          surv.instanciarSprite(this, pos.x, pos.y);
          this.npcs.push(surv);
          if (surv.sprite) this.dynamicLayer.add(surv.sprite as any);
        }
      }
      // NPCs solo-locales (fallback offline o de otra sesión): también se restauran
      const localOnly = (save.npcs ?? []).filter((n: any) => n?.id && !serverIds.has(n.id));
      for (const data of localOnly) {
        if (typeof data.x !== 'number' || typeof data.y !== 'number') continue;
        const surv = new Survivor();
        surv.id = data.id;
        surv.nombre = data.nombre;
        surv.edad = data.edad;
        surv.profesion = data.profesion;
        // HP canónico del servidor (200/50); partidas viejas traían aleatorios
        surv.stats.maxSalud = 200;
        surv.stats.salud = Math.max(0, Math.min(200, data.salud ?? 200));
        surv.stats.maxEnergia = 50;
        surv.stats.energia = Math.max(0, Math.min(50, data.energia ?? 50));
        if (typeof data.hambre === 'number') surv.needs.hambre = data.hambre;
        if (typeof data.sed === 'number') surv.needs.sed = data.sed;
        if (typeof data.sueno === 'number') surv.needs.sueno = data.sueno;
        if (typeof data.lealtad === 'number') surv.loyalty.nivel = data.lealtad;

        const { x, y } = clampToIsoWorld(data.x, data.y);
        surv.instanciarSprite(this, x, y);
        this.npcs.push(surv);
        if (surv.sprite) this.dynamicLayer.add(surv.sprite as any);
      }
      if (this.npcs.length > 0) {
        window.dispatchEvent(new CustomEvent('phaser-npcs-spawned', { detail: { count: this.npcs.length, total: this.npcs.length } }));
      }

      // Restaurar Dead Dragons
      for (const data of save.deadDragons) {
        const dragon = new DeadDragon(data.isAlly, data.x, data.y);
        dragon.id = data.id;
        dragon.nombre = data.nombre;
        dragon.stats.salud = data.salud;
        dragon.stats.maxSalud = data.maxSalud;
        dragon.stats.energia = data.energia;
        dragon.stats.maxEnergia = data.maxEnergia;
        if (data.hogar) dragon.setHogar(data.hogar.x, data.hogar.y);
        if (data.comportamiento) dragon.setComportamiento(data.comportamiento as any);
        if (data.funcion) dragon.setFuncion(data.funcion as any);
        dragon.instanciarSprite(this, data.x, data.y);
        this.deadDragons.push(dragon);
        if (dragon.sprite) this.dynamicLayer.add(dragon.sprite as any);
      }
      if (save.deadDragons.length > 0) {
        window.dispatchEvent(new CustomEvent('phaser-dead-dragons-spawned' as any, {
          detail: { count: save.deadDragons.length, total: this.deadDragons.length, isAlly: true }
        }));
      }

      // SEGURIDAD: Los Ghosts NO se restauran desde localStorage.
      // Los Ghosts son enemigos sincronizados en tiempo real mediante el CombatGateway del backend.
      // Esto previene que un jugador modifique su vida/cantidad o reviva enemigos muertos via devtools.
    } catch (e) {
      console.warn('[MainScene] Error al restaurar partida guardada', e);
    }
  }

  /**
   * Partida nueva: spawnea 1-3 Ghosts en puntos aleatorios del mapa.
   * El flag en window evita duplicados cuando StrictMode monta dos escenas en dev;
   * el guardado inmediato hace que un remontaje vea partida existente y no repita.
   */
  private startNewGameSpawns(): void {
    try {
      const w = window as any;
      if (this.settlementId) initCombatSocket(this.settlementId);
      if (!this.settlementId || w.__GHOSTS_AUTOSPAWNED__) return;
      w.__GHOSTS_AUTOSPAWNED__ = true;
      const count = 1 + Math.floor(Math.random() * 3);
      console.log(`[MainScene] 👻 Partida nueva: spawneando ${count} ghost(s) aleatorios...`);
      this.saveFullGameState();
      requestServerGhostSpawn(count, this.settlementId);
    } catch (e) {
      console.warn('[MainScene] Error en spawns de partida nueva', e);
    }
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
      this.cameras.main.centerOn(p.x, p.y + ISO_TILE_H/2);
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

    if (this.farmPlacementSystem) {
      this.farmPlacementSystem.update();
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
      this.npcs = this.npcs.filter(n => n.estaVivo);
      this.npcs.forEach(n => n.updateEntity(this.ghosts, this.deadDragons, delta));
      this.deadDragons = this.deadDragons.filter(d => d.estaVivo);
      this.deadDragons.forEach(d => d.updateEntity(this.buildDragonCtx()));
      this.ghosts = this.ghosts.filter(g => g.estaVivo);
      this.ghosts.forEach(g => g.updateEntity(
        this.player as unknown as Phaser.Physics.Arcade.Sprite,
        this.npcs,
        delta
      ));
      this.chatSystem.update(this.player);
      try {
        this.needBubbles?.update(this.player, this.npcs);
      } catch {}
      if (this.terrainOcclusionSystem && this.player) {
        this.terrainOcclusionSystem.update(this.player);
      }
      if (this.cameraFollow && this.player) updateCamera(this, this.player);
      if (this.player) (window as any).__PLAYER_POS__ = { x: this.player.x, y: this.player.y };
      const npcPositionsBlocked = this.npcs.filter(n => n.sprite && n.sprite.active).map(n => ({ ...n.getPaqueteUI(), x: n.sprite!.x, y: n.sprite!.y }));
      (window as any).__NPCS_POS__ = npcPositionsBlocked;
      const dragonPositionsBlocked = this.deadDragons.filter(d => d.sprite && d.sprite.active).map(d => ({ ...d.getPaqueteUI(), x: d.sprite!.x, y: d.sprite!.y }));
      (window as any).__DEAD_DRAGONS_POS__ = dragonPositionsBlocked;
      const ghostPositionsBlocked = this.ghosts.filter(g => g.sprite && g.sprite.active).map(g => ({ ...g.getPaqueteUI(), x: g.sprite!.x, y: g.sprite!.y }));
      (window as any).__GHOSTS_POS__ = ghostPositionsBlocked;
      (window as any).__GHOST_COUNT__ = this.ghosts.length;
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

    if (this.player && !this.playerDead) {
      this.player.updateEntity();
      (window as any).__PLAYER_POS__ = { x: this.player.x, y: this.player.y };
      // Flanco de subida del ataque: reporta UN golpe melee al servidor (él valida)
      const atk = CombatSystem.isAttacking(this.player as unknown as Phaser.Physics.Arcade.Sprite);
      if (atk && !this.prevPlayerAttacking) this.playerMeleeStrike();
      this.prevPlayerAttacking = atk;
    } else if (this.player) {
      const b = this.player.body as Phaser.Physics.Arcade.Body | undefined;
      if (b) b.setVelocity(0);
      this.prevPlayerAttacking = false;
    }

    this.npcs = this.npcs.filter(n => n.estaVivo);
    this.npcs.forEach(n => n.updateEntity(this.ghosts, this.deadDragons, delta));
    const npcPositions = this.npcs
      .filter(n => n.sprite && n.sprite.active)
      .map(n => ({
        ...n.getPaqueteUI(),
        x: n.sprite!.x,
        y: n.sprite!.y,
      }));
    (window as any).__NPCS_POS__ = npcPositions;

    this.deadDragons = this.deadDragons.filter(d => d.estaVivo);
    this.deadDragons.forEach(d => d.updateEntity(this.buildDragonCtx()));

    // Actualizar Ghosts: IA de patrulla/persecución/ataque (delta ya viene del parámetro update)
    this.ghosts = this.ghosts.filter(g => g.estaVivo); // limpiar muertos
    this.ghosts.forEach(g => g.updateEntity(
      this.player as unknown as Phaser.Physics.Arcade.Sprite,
      this.npcs,
      delta
    ));
    const ghostPositions = this.ghosts
      .filter(g => g.sprite && g.sprite.active)
      .map(g => ({
        ...g.getPaqueteUI(),
        x: g.sprite!.x,
        y: g.sprite!.y,
      }));
    (window as any).__GHOSTS_POS__ = ghostPositions;
    (window as any).__GHOST_COUNT__ = this.ghosts.length;

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
    try {
      this.needBubbles?.update(this.player, this.npcs);
    } catch {}
    if (this.terrainOcclusionSystem && this.player) {
      this.terrainOcclusionSystem.update(this.player);
    }
    if (this.cameraFollow && this.player) {
      updateCamera(this, this.player);
    }
  }
}
