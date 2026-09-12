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
import { getCenterSpawn, spawnNpcs, spawnDeadDragons, spawnGhosts } from "../systems/SpawnSystem";
import { ChatBubbleSystem } from "../systems/ChatBubbleSystem";
import { CameraController } from "../systems/CameraController";
import { findNearestSafeIsoPos, tileToIso, worldToIso, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT, ISO_TILE_H } from "../world/Terrain";
import { collisionMatrix } from "../world/CollisionMatrix";
import { StaticGroundLayer } from "../layers/StaticGroundLayer";
import { DynamicLayer } from "../layers/DynamicLayer";
import { ChunkRenderer } from "../entities/ChunkRenderer";
import { FarmPlacementSystem } from "../systems/FarmPlacementSystem";
import { TerrainEditSystem } from "../systems/TerrainEditSystem";
import { TerrainOcclusionSystem } from "../systems/TerrainOcclusionSystem";
import { savePlayerPos } from "../../app/api/player.api";
import { useGameStore } from "../../app/store/useGameStore";
import { getSocket } from "../../app/socket";
import { SaveSystem } from "../../save/SaveSystem";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Survivor[] = [];
  private deadDragons: DeadDragon[] = [];
  private ghosts: Ghost[] = [];
  private chatSystem!: ChatBubbleSystem;
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
      this.setupNpcListeners();
      this.setupDeadDragonListeners();
      this.setupGhostListeners();
      this.restoreSavedGame();
      this.chatSystem = new ChatBubbleSystem(this);
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
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      spawnNpcs(this, count, this.player, this.npcs);
      this.npcs.slice(-count).forEach(n => { if (n.sprite) this.dynamicLayer.add(n.sprite as any); });
      this.saveFullGameState();
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
      this.saveFullGameState();
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

  // ── Ghost listeners + comandos de consola createGhost1/2/3 ────────────────
  private setupGhostListeners(): void {
    const onSpawnGhosts = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      const prevLen = this.ghosts.length;
      spawnGhosts(this, count, this.player as unknown as Phaser.GameObjects.GameObject & { x: number; y: number }, this.ghosts, this.npcs);
      // Añadir a DynamicLayer solo los ghosts nuevos (usando diff de longitud)
      for (let i = prevLen; i < this.ghosts.length; i++) {
        const g = this.ghosts[i];
        if (g.sprite) {
          this.dynamicLayer.add(g.sprite as any);
          console.log(`[MainScene] Ghost ${g.id} añadido a DynamicLayer en (${g.sprite.x.toFixed(0)}, ${g.sprite.y.toFixed(0)})`);
        }
      }
      this.saveFullGameState();
    };

    const onGhostDied = () => {
      this.ghosts = this.ghosts.filter(g => g.estaVivo);
      this.saveFullGameState();
    };

    window.addEventListener('phaser-create-ghosts' as any, onSpawnGhosts as EventListener);
    window.addEventListener('phaser-ghost-died' as any, onGhostDied as EventListener);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('phaser-create-ghosts' as any, onSpawnGhosts as EventListener);
      window.removeEventListener('phaser-ghost-died' as any, onGhostDied as EventListener);
      this.ghosts.forEach(g => g.desinstanciarSprite());
      this.ghosts = [];
      // Limpiar comandos de consola
      delete (window as any).createGhost;
      delete (window as any).createGhost1;
      delete (window as any).createGhost2;
      delete (window as any).createGhost3;
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
      const isCreative = detail?.mode === 'creative';
      (window as any).__CREATIVE_MODE__ = isCreative;
      (window as any).__GAME_MODE__ = isCreative ? 'creative' : 'survival';
      console.log(`[MainScene] Modo de juego cambiado a: ${isCreative ? 'CREATIVO (Enemigos ignoran al jugador)' : 'SUPERVIVENCIA (Enemigos hostiles)'}`);
      this.saveFullGameState();
    };
    window.addEventListener('phaser-game-mode' as any, onGameMode as EventListener);

    // Estado inicial por defecto
    if (typeof (window as any).__CREATIVE_MODE__ === 'undefined') {
      (window as any).__CREATIVE_MODE__ = false;
      (window as any).__GAME_MODE__ = 'survival';
    }

    // Comandos de consola y F12: CreativeMode / SurvivalMode
    (window as any).CreativeMode = () => {
      (window as any).__CREATIVE_MODE__ = true;
      (window as any).__GAME_MODE__ = 'creative';
      window.dispatchEvent(new CustomEvent('phaser-game-mode' as any, { detail: { mode: 'creative' } }));
      return '🎨 Modo Creativo activado: los enemigos ignoran al jugador';
    };
    (window as any).SurvivalMode = () => {
      (window as any).__CREATIVE_MODE__ = false;
      (window as any).__GAME_MODE__ = 'survival';
      window.dispatchEvent(new CustomEvent('phaser-game-mode' as any, { detail: { mode: 'survival' } }));
      return '⚔️ Modo Supervivencia activado: los enemigos detectan al jugador';
    };

    // Comandos de guardado manual
    (window as any).saveGame = () => {
      this.saveFullGameState();
      return '💾 Partida guardada exitosamente (NPCs, dragones, ghosts, modo de juego).';
    };
    (window as any).clearSave = () => {
      SaveSystem.clear();
      return '🗑️ Guardado eliminado. Al refrescar iniciarás de cero.';
    };

    // Comandos de consola y F12: createGhost, createGhost1, createGhost2, createGhost3
    const dispatchGhost = (count: number) => {
      console.log(`[MainScene] Invocando ${count} Ghost(s)...`);
      window.dispatchEvent(new CustomEvent('phaser-create-ghosts' as any, { detail: { count } }));
      return `✓ ${count} Ghost(s) invocado(s)`;
    };

    (window as any).createGhost = (n = 1) => dispatchGhost(n);
    (window as any).createGhost1 = () => dispatchGhost(1);
    (window as any).createGhost2 = () => dispatchGhost(2);
    (window as any).createGhost3 = () => dispatchGhost(3);
    (window as any).ghosts = this.ghosts;
    (window as any).__GHOSTS__ = this.ghosts;

    // API interna para debug F12
    (window as any).__GHOST_API__ = {
      spawn: (n = 1) => dispatchGhost(n),
      list: () => this.ghosts.map(g => g.getPaqueteUI()),
      kill: (id: string) => {
        const ghost = this.ghosts.find(g => g.id === id);
        if (ghost) ghost.recibirDano(9999);
      },
    };

    console.log('[MainScene] Ghost listeners OK. Comandos: createGhost1, createGhost2, createGhost3 | CreativeMode | SurvivalMode | saveGame | clearSave');
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
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        this.savePlayerPos();
        this.saveFullGameState();
      },
    });
    window.addEventListener('beforeunload', () => {
      this.savePlayerPos();
      this.saveFullGameState();
    });
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

  private saveFullGameState(): void {
    try {
      const playerPos = this.player ? { x: this.player.x, y: this.player.y } : undefined;
      const gameMode = (window as any).__CREATIVE_MODE__ ? 'creative' : 'survival';
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
        return;
      }

      console.log(
        `[MainScene] 💾 Restaurando partida guardada (${new Date(save.timestamp).toLocaleTimeString()}): ` +
        `${save.npcs.length} NPCs, ${save.deadDragons.length} Dead Dragons, ${save.ghosts.length} Ghosts, modo=${save.gameMode}`
      );

      // Restaurar modo de juego
      const isCreative = save.gameMode === 'creative';
      (window as any).__CREATIVE_MODE__ = isCreative;
      (window as any).__GAME_MODE__ = save.gameMode;

      // Restaurar posición del jugador si existe y es válida
      if (save.playerPos && this.player && typeof save.playerPos.x === 'number' && typeof save.playerPos.y === 'number') {
        this.player.setPosition(save.playerPos.x, save.playerPos.y);
        if (this.cameraFollow) {
          this.cameras.main.centerOn(save.playerPos.x, save.playerPos.y);
        }
      }

      // Restaurar NPCs (Survivors)
      for (const data of save.npcs) {
        const surv = new Survivor();
        surv.id = data.id;
        surv.nombre = data.nombre;
        surv.edad = data.edad;
        surv.profesion = data.profesion;
        surv.stats.salud = data.salud;
        surv.stats.maxSalud = data.maxSalud;
        surv.stats.energia = data.energia;
        if (typeof data.hambre === 'number') surv.needs.hambre = data.hambre;
        if (typeof data.sed === 'number') surv.needs.sed = data.sed;
        if (typeof data.sueno === 'number') surv.needs.sueno = data.sueno;
        if (typeof data.lealtad === 'number') surv.loyalty.nivel = data.lealtad;

        surv.instanciarSprite(this, data.x, data.y);
        this.npcs.push(surv);
        if (surv.sprite) this.dynamicLayer.add(surv.sprite as any);
      }
      if (save.npcs.length > 0) {
        window.dispatchEvent(new CustomEvent('phaser-npcs-spawned', { detail: { count: save.npcs.length, total: this.npcs.length } }));
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

      // Restaurar Ghosts
      for (const data of save.ghosts) {
        const ghost = new Ghost();
        ghost.id = data.id;
        ghost.nombre = data.nombre;
        ghost.homeX = data.homeX ?? data.x;
        ghost.homeY = data.homeY ?? data.y;
        ghost.salud = data.salud;
        ghost.maxSalud = data.maxSalud;
        ghost.energia = data.energia;
        ghost.maxEnergia = data.maxEnergia;
        ghost.instanciarSprite(this, data.x, data.y);
        this.ghosts.push(ghost);
        if (ghost.sprite) this.dynamicLayer.add(ghost.sprite as any);
      }
      if (save.ghosts.length > 0) {
        window.dispatchEvent(new CustomEvent('phaser-ghosts-spawned' as any, { detail: { count: save.ghosts.length, total: this.ghosts.length } }));
      }
    } catch (e) {
      console.warn('[MainScene] Error al restaurar partida guardada', e);
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
      this.npcs.forEach(n => n.updateEntity());
      this.deadDragons.forEach(d => d.updateEntity());
      this.ghosts = this.ghosts.filter(g => g.estaVivo);
      this.ghosts.forEach(g => g.updateEntity(
        this.player as unknown as Phaser.Physics.Arcade.Sprite,
        this.npcs,
        delta
      ));
      this.chatSystem.update(this.player);
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
    if (this.terrainOcclusionSystem && this.player) {
      this.terrainOcclusionSystem.update(this.player);
    }
    if (this.cameraFollow && this.player) {
      updateCamera(this, this.player);
    }
  }
}
