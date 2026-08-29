import Phaser from "phaser";
import { Player } from "../../characters/Player";
import type { Survivor } from "../../characters/Survivor";
import { initAllCharacterAnimations } from "../../characters/Animations";
import { isGameInputBlocked } from "../../ui/input/KeyBindings";
import * as InputSystem from "../systems/InputSystem";
import { setupCamera, updateCamera } from "../systems/CameraSystem";
import { getCenterSpawn, spawnNpcs as spawnNpcsSystem } from "../systems/SpawnSystem";
import { ChatBubbleSystem } from "../systems/ChatBubbleSystem";
import { setupInteraction } from "../systems/InteractionSystem";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Survivor[] = [];
  private chatSystem!: ChatBubbleSystem;

  get npc(): Survivor | undefined { return this.npcs[0]; }

  constructor() { super("MainScene"); }

  create(): void {
    this.setupWorld();
    initAllCharacterAnimations(this);
    this.verifyHumanAnimations();
    this.spawnPlayer();
    this.chatSystem = new ChatBubbleSystem(this);
    setupCamera(this, this.player);
    setupInteraction(this, this.npcs);
    this.setupNpcListener();
    this.setupDebug();
  }

  private setupWorld(): void {
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.cameras.main.setBackgroundColor("#1e1e1e");
    // Grid eficiente: fondo + líneas via graphics estático (evita repintado lento de add.grid)
    const g = this.add.graphics();
    g.lineStyle(1, 0x333333, 1);
    for (let x = 0; x <= 2000; x += 64) { g.moveTo(x, 0); g.lineTo(x, 2000); }
    for (let y = 0; y <= 2000; y += 64) { g.moveTo(0, y); g.lineTo(2000, y); }
    g.strokePath();
    // Borde del mundo
    g.lineStyle(2, 0x444444, 1);
    g.strokeRect(0, 0, 2000, 2000);
  }

  private spawnPlayer(): void {
    const spawn = getCenterSpawn(this);
    this.player = new Player(this, spawn.x, spawn.y);
    // Asegura origen visual exactamente en centro del frame 48x64
    this.player.setOrigin(0.5, 0.5);
    console.log("[MainScene] Player spawneado en", spawn.x.toFixed(0), spawn.y.toFixed(0), "- Usa ENTER para consola y createNpc1..10");
  }

  private setupNpcListener(): void {
    window.addEventListener("phaser-create-npcs", ((e: CustomEvent<{ count: number }>) => {
      const count = e.detail?.count ?? 1;
      console.log("[MainScene] Evento phaser-create-npcs recibido", count);
      this.spawnNpcs(count);
    }) as EventListener);
  }

  private setupDebug(): void {
    // Debug mínimo sin cruces ni logs que tapen al personaje
  }

  public spawnNpcs(count: number): void {
    spawnNpcsSystem(this, count, this.player, this.npcs);
  }

  public getNpcs(): Survivor[] { return this.npcs; }

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

  update(): void {
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
      if (this.player) updateCamera(this, this.player);
      return;
    }

    if (InputSystem.isCloseJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
    if (InputSystem.isInventoryJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-inventory"));
    if (InputSystem.isMapJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-map"));
    if (InputSystem.isMissionsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-missions"));
    if (InputSystem.isStatsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-stats"));

    if (this.input.keyboard && !isGameInputBlocked()) {
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J))) for (const n of this.npcs) n.saltar();
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K))) for (const n of this.npcs) n.dash();
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L))) for (const n of this.npcs) n.atacar();
    }

    if (this.player) this.player.updateEntity();
    for (const n of this.npcs) n.updateEntity();
    this.chatSystem.update(this.player);
    if (this.player) updateCamera(this, this.player);
  }
}
