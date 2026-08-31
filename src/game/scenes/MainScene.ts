import Phaser from "phaser";
import { Player } from "../../characters/Player";
import { Survivor } from "../../characters/Survivor";
import { initAllCharacterAnimations } from "../../characters/Animations";
import { isGameInputBlocked, isActionJustDown } from "../../ui/input/KeyBindings";
import * as InputSystem from "../systems/InputSystem";
import { setupCamera, updateCamera } from "../systems/CameraSystem";
import { getCenterSpawn, spawnNpcs } from "../systems/SpawnSystem";
import { ChatBubbleSystem } from "../systems/ChatBubbleSystem";
import { ChunkRenderer } from "../entities/ChunkRenderer";
import { CameraController } from "../systems/CameraController";
import { MineralPhysicsManager } from "../systems/MineralPhysics";
import { WaterPhysicsManager } from "../systems/WaterPhysics";
import { isBlockedWorldXY, findNearestSafeWorldPos } from "../world/Terrain";
import { fetchPlayer, savePlayerPos } from "../../app/api/player.api";
import { useGameStore } from "../../app/store/useGameStore";
import { getSocket } from "../../app/socket";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Survivor[] = [];
  private chatSystem!: ChatBubbleSystem;
  private chunkRenderer!: ChunkRenderer;
  private cameraController!: CameraController;
  private mineralPhysics!: MineralPhysicsManager;
  private waterPhysics!: WaterPhysicsManager;
  private cameraFollow = true;
  private lastViewportEmit = 0;
  private lastCameraX = 0;
  private lastCameraY = 0;

  constructor() { super("MainScene"); }

  create(): void {
    this.setupWorld();
    initAllCharacterAnimations(this);
    this.verifyHumanAnimations();
    this.spawnPlayer();
    this.setupNpcListeners();
    this.chatSystem = new ChatBubbleSystem(this);
    setupCamera(this, this.player, 6144, 6144);
    this.setupRTSOverlay();
    this.setupMineralPhysics();
    this.setupDebug();
  }

  private setupNpcListeners(): void {
    const onSpawnRequest = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      const count = detail?.count ?? 1;
      spawnNpcs(this, count, this.player, this.npcs);
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

  private setupWorld(): void {
    this.physics.world.setBounds(0, 0, 6144, 6144);
    this.cameras.main.setBackgroundColor("#1e1e1e");
    const g = this.add.graphics();
    g.setDepth(-20);
    g.lineStyle(1, 0x333333, 1);
    for (let x = 0; x <= 6144; x += 64) { g.moveTo(x, 0); g.lineTo(x, 6144); }
    for (let y = 0; y <= 6144; y += 64) { g.moveTo(0, y); g.lineTo(6144, y); }
    g.strokePath();
    g.lineStyle(2, 0x444444, 1);
    g.strokeRect(0, 0, 6144, 6144);
  }

  private lastSavePos = { x: 0, y: 0 };
  private spawnPlayer(): void {
    const spawn = getCenterSpawn(this);
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.setOrigin(0.5, 0.5);
    this.player.setDepth(10);
    // Seguridad: si spawn inicial cae en mineral (raro por retry), recolocar a tile seguro cercano
    try {
      if (isBlockedWorldXY(this.player.x, this.player.y)) {
        const safe = findNearestSafeWorldPos(this.player.x, this.player.y);
        if (safe) {
          this.player.setPosition(safe.x, safe.y);
          console.log('[MainScene] Spawn corregido a posición segura', safe);
        }
      }
    } catch {}
    // Spawn siempre exactamente al centro del mapa (3072,3072) - sin aleatoriedad ni restauración de lastPos
    // Se ignora lastPos guardado para cumplir requisito "siempre al centro"
    this.player.setInteractive({ useHandCursor: true });
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
    console.log("[MainScene] Player spawneado en", spawn.x.toFixed(0), spawn.y.toFixed(0));
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
    this.chunkRenderer = new ChunkRenderer(this);
    this.cameraController = new CameraController(this.cameras.main, 6144, 6144);
    this.cameraController.attach(this);
    this.cameraController.setFollowMode(this.cameraFollow);
    this.cameras.main.setLerp(0, 0);
    this.cameras.main.stopFollow();
    (window as any).__PHASER_CAMERA__ = this.cameras.main;
    window.addEventListener('minimap-goto', ((e: CustomEvent<{ chunkX: number; chunkY: number }>) => {
      const { chunkX, chunkY } = e.detail;
      if (this.cameraFollow) { this.cameraFollow = false; this.cameraController.setFollowMode(false); }
      this.cameras.main.centerOn(chunkX * 1024 + 512, chunkY * 1024 + 512);
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

  private setupMineralPhysics(): void {
    this.mineralPhysics = new MineralPhysicsManager(this);
    this.mineralPhysics.init();
    this.waterPhysics = new WaterPhysicsManager(this);
    this.waterPhysics.init();
    // Limpieza al cerrar escena
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.mineralPhysics?.destroy();
      this.waterPhysics?.destroy();
    });
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
    
    // Refinement C: Frustum Culling atómico usando cameraBounds nativo de Phaser
    const cameraBounds = this.cameras.main.worldView;
    if (this.player) {
      this.npcs.forEach(sprite => {
        if (!sprite.sprite) return;
        const isVisible = cameraBounds.contains(sprite.sprite.x, sprite.sprite.y);
        sprite.sprite.setVisible(isVisible);
        sprite.sprite.setActive(isVisible);
      });
    }
    
    if (this.mineralPhysics && this.cameras.main) {
      this.mineralPhysics.sync(this.cameras.main, this.player as unknown as Phaser.Physics.Arcade.Sprite, this.npcs.map(n => ({ sprite: n.sprite as unknown as Phaser.Physics.Arcade.Sprite | null, id: n.id })));
    }
    if (this.waterPhysics && this.cameras.main) {
      this.waterPhysics.sync(this.cameras.main, this.player as unknown as Phaser.Physics.Arcade.Sprite, this.npcs.map(n => ({ sprite: n.sprite as unknown as Phaser.Physics.Arcade.Sprite | null, id: n.id })));
    }

    if (this.chunkRenderer && this.cameras.main) {
      // Restaurado: renderizado de terreno (eliminado por error en d181697)
      this.chunkRenderer.update(this.cameras.main);
      // Refinement A: Usar camera.scrollX/scrollY en lugar de camera.x/camera.y
      const movedEnough = Math.abs(this.cameras.main.scrollX - this.lastCameraX) > 512 ||
                          Math.abs(this.cameras.main.scrollY - this.lastCameraY) > 512;
      const enoughTime = Date.now() - this.lastViewportEmit > 300;

      if (movedEnough || enoughTime) {
        // Capturar bounds actuales del viewport en chunks
        const minChunkX = Math.floor(this.cameras.main.scrollX / 1024);
        const minChunkY = Math.floor(this.cameras.main.scrollY / 1024);
        const maxChunkX = Math.floor((this.cameras.main.scrollX + this.cameras.main.width) / 1024);
        const maxChunkY = Math.floor((this.cameras.main.scrollY + this.cameras.main.height) / 1024);

        // Emitir al servidor solo si changed realmente
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
      this.chatSystem.update(this.player);
      return;
    }
    if (InputSystem.isCloseJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
    if (InputSystem.isInventoryJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-inventory"));
    if (InputSystem.isMapJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-map"));
    if (InputSystem.isMissionsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-missions"));
    if (InputSystem.isStatsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-stats"));

    if (this.player) {
      this.player.updateEntity();
      (window as any).__PLAYER_POS__ = { x: this.player.x, y: this.player.y };
    }

    // Actualizar NPCs y exportar sus posiciones con paquete UI completo
    this.npcs.forEach(n => n.updateEntity());
    const npcPositions = this.npcs
      .filter(n => n.sprite && n.sprite.active)
      .map(n => ({
        ...n.getPaqueteUI(),
        x: n.sprite!.x,
        y: n.sprite!.y,
      }));
    (window as any).__NPCS_POS__ = npcPositions;

    this.chatSystem.update(this.player);
    if (this.cameraFollow && this.player) {
      updateCamera(this, this.player);
    }
  }
}