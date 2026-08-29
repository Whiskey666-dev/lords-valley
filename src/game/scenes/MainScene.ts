import Phaser from "phaser";
import { Player } from "../../characters/Player";
import { initAllCharacterAnimations } from "../../characters/Animations";
import { getBinding, displayKey, isGameInputBlocked, isActionJustDown } from "../../ui/input/KeyBindings";
import * as InputSystem from "../systems/InputSystem";
import { setupCamera, updateCamera } from "../systems/CameraSystem";
import { getCenterSpawn } from "../systems/SpawnSystem";
import { ChatBubbleSystem } from "../systems/ChatBubbleSystem";
import { ChunkRenderer } from "../entities/ChunkRenderer";
import { CameraController } from "../systems/CameraController";
import { fetchPlayer, savePlayerPos } from "../../app/api/player.api";
import { useGameStore } from "../../app/store/useGameStore";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private chatSystem!: ChatBubbleSystem;
  private chunkRenderer!: ChunkRenderer;
  private cameraController!: CameraController;
  private cameraFollow = true;

  constructor() { super("MainScene"); }

  create(): void {
    this.setupWorld();
    initAllCharacterAnimations(this);
    this.verifyHumanAnimations();
    this.spawnPlayer();
    this.chatSystem = new ChatBubbleSystem(this);
    setupCamera(this, this.player, 6144, 6144);
    this.setupRTSOverlay();
    this.setupDebug();
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
    // Restaurar última posición guardada en core (Player.settings.lastPos) si existe
    (async () => {
      try {
        const settlement = (useGameStore as any).getState?.().settlement;
        const playerId = settlement?.ownerId || localStorage.getItem('playerId');
        if (playerId) {
          const dto: any = await fetchPlayer(playerId);
          const lastPos = dto?.settings?.lastPos;
          if (lastPos && typeof lastPos.x === 'number' && typeof lastPos.y === 'number') {
            this.player.setPosition(lastPos.x, lastPos.y);
            this.cameras.main.centerOn(lastPos.x, lastPos.y);
            console.log('[MainScene] Player restaurado en lastPos core', lastPos);
          }
        }
      } catch (e) { console.log('[MainScene] no lastPos, usa spawn', spawn); }
    })();
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
    // Guardar posición cada 5s para retomar donde quedó al reloguear
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

  private setupDebug(): void {
    const debugText = this.add.text(16, 16, `Lords Valley v0.1 • ${displayKey(getBinding("tutorial"))}:Tutorial • Click Izq:Interactuar`, {
      fontSize: "12px", color: "#ffffff", backgroundColor: "#00000066", padding: { left: 6, right: 6, top: 4, bottom: 4 }
    });
    debugText.setDepth(100);
    debugText.setScrollFactor(0);
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      const followKey = displayKey(getBinding("cameraFollow"));
      const mode = this.cameraFollow ? "SIGUIENDO" : "LIBRE mouse";
      debugText.setText(`Lords Valley v0.1 • ${displayKey(getBinding("tutorial"))}:Tutorial • ${followKey}:Cámara ${mode} • ${displayKey(getBinding("move_up"))}${displayKey(getBinding("move_left"))}${displayKey(getBinding("move_down"))}${displayKey(getBinding("move_right"))}:Mover`);
    }});
    if (this.input.keyboard) {
      this.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.TAB]);
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
    if (this.chunkRenderer && this.cameras.main) {
      this.chunkRenderer.update(this.cameras.main);
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
    this.chatSystem.update(this.player);
    if (this.cameraFollow && this.player) {
      updateCamera(this, this.player);
    }
  }
}
