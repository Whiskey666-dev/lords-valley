import Phaser from "phaser";
import { Player } from "../../characters/Player";
import { Survivor } from "../../characters/Survivor";
import { initAllCharacterAnimations } from "../../characters/Animations";
import { getBinding, displayKey, isGameInputBlocked } from "../../ui/input/KeyBindings";
import * as InputSystem from "../systems/InputSystem";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Survivor[] = [];
  private chatBubble: Phaser.GameObjects.Container | null = null;
  private chatBubbleTimer: Phaser.Time.TimerEvent | null = null;
  // Getter para compatibilidad con código que espera `this.npc` (primer NPC)
  get npc(): Survivor | undefined {
    return this.npcs[0];
  }

  constructor() {
    super("MainScene");
  }

  create() {
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.add.grid(1000, 1000, 2000, 2000, 64, 64, 0x222222, 1, 0x333333);

    // Animaciones centralizadas y reutilizables en src/characters/Animations.ts (Player y NPCs humanos)
    initAllCharacterAnimations(this);
    // Verificación: todas las animaciones humanas deben existir para Player y NPCs
    this.verifyHumanAnimations();

    // Player spawnea independiente en el centro (20% radio = 200) - sin NPCs al mismo tiempo
    const playerSpawn = this.getCenterSpawn();
    this.player = new Player(this, playerSpawn.x, playerSpawn.y);

    // NPCs 100% independientes: solo consola createNpc1..10, nunca auto-spawn con player
    window.addEventListener("phaser-create-npcs", ((e: CustomEvent<{ count: number }>) => {
      const count = e.detail?.count ?? 1;
      console.log("[MainScene] Evento phaser-create-npcs recibido", count);
      this.spawnNpcs(count);
    }) as EventListener);

    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(this.player, true);
    // 50% por defecto = zoom 1.0, 0% = 0.6 alejado, 100% = 1.6 acercado
    const percentToZoom = (p: number) => {
      const c = Phaser.Math.Clamp(p, 0, 100);
      return c <= 50 ? 0.6 + (c / 50) * 0.4 : 1.0 + ((c - 50) / 50) * 0.6;
    };
    const zoomToPercent = (z: number) => {
      const c = Phaser.Math.Clamp(z, 0.6, 1.6);
      return c <= 1.0 ? Math.round(((c - 0.6) / 0.4) * 50) : Math.round(50 + ((c - 1.0) / 0.6) * 50);
    };
    this.cameras.main.setZoom(percentToZoom(50));

    const applyZoomPercent = (p: number) => {
      this.cameras.main.setZoom(percentToZoom(p));
    };
    window.addEventListener("phaser-zoom-set", (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") applyZoomPercent(detail);
    });
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      if (dy !== 0) {
        // @ts-ignore
        const ev = window.event as WheelEvent | undefined;
        if (ev?.ctrlKey) {
          ev.preventDefault();
          const deltaPercent = dy > 0 ? -10 : 10;
          const currentPercent = zoomToPercent(this.cameras.main.zoom);
          const nzPercent = Phaser.Math.Clamp(currentPercent + deltaPercent, 0, 100);
          this.cameras.main.setZoom(percentToZoom(nzPercent));
          window.dispatchEvent(new CustomEvent("phaser-zoom-sync", { detail: nzPercent }));
        }
      }
    });

    // Burbuja de chat sobre el player (modo Chat)
    window.addEventListener("phaser-chat-bubble", ((e: CustomEvent<{ text: string }>) => {
      const text = e.detail?.text?.trim();
      if (!text) return;
      this.showChatBubble(text);
    }) as EventListener);

    const debugText = this.add.text(16, 16, `Lords Valley v0.1 • ${displayKey(getBinding("tutorial"))}:Tutorial • Click Izq:Interactuar`, {
      fontSize: "12px", color: "#ffffff", backgroundColor: "#00000066", padding: { left: 6, right: 6, top: 4, bottom: 4 }
    });
    debugText.setScrollFactor(0);
    // Actualiza hint con bindings actuales
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      debugText.setText(`Lords Valley v0.1 • ${displayKey(getBinding("tutorial"))}:Tutorial • Click Izq:Interactuar • ${displayKey(getBinding("move_up"))}${displayKey(getBinding("move_left"))}${displayKey(getBinding("move_down"))}${displayKey(getBinding("move_right"))}:Mover`);
    }});

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, localObjects: Phaser.GameObjects.GameObject[]) => {
      if (isGameInputBlocked()) {
        console.log("[MainScene] pointerdown bloqueado por consola/chat");
        return;
      }
      console.log("[MainScene] pointerdown", pointer.worldX.toFixed(0), pointer.worldY.toFixed(0), "localObjects", localObjects.length, "npcs", this.npcs.length);
      let hitNpc: Survivor | null = null;
      for (const npc of this.npcs) {
        if (npc.sprite && localObjects.includes(npc.sprite)) {
          hitNpc = npc;
          console.log("[MainScene] Hit por localObjects", npc.nombre);
          break;
        }
      }
      if (!hitNpc) {
        for (const npc of this.npcs) {
          if (npc.sprite && Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, npc.sprite.x, npc.sprite.y) < 40) {
            hitNpc = npc;
            console.log("[MainScene] Click por proximidad detectado", npc.nombre, "dist", Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, npc.sprite.x, npc.sprite.y).toFixed(1));
            break;
          }
        }
      }
      if (hitNpc) {
        console.log("[MainScene] Click en NPC detectado (fallback)", hitNpc.nombre, hitNpc.id, "localObjects:", localObjects.length);
        const fallbackDetail = {
          id: hitNpc.id,
          name: hitNpc.nombre,
          profession: hitNpc.profesion,
          loyalty: hitNpc.loyalty.nivel,
          health: hitNpc.stats.salud,
          edad: hitNpc.edad,
          traits: hitNpc.traits.lista,
          personalidad: hitNpc.personality.resumen,
          temperamento: hitNpc.personality.temperamento,
          habilidad: hitNpc.skills.resumen,
          gustos: hitNpc.gustos.resumen,
          inventario: hitNpc.inventory.getResumen(),
          equipamiento: hitNpc.equipment.getResumen(),
          habilidades: Object.entries(hitNpc.skills.niveles).map(([k, v]) => `${k}: Lv${v}`),
          stats: { salud: hitNpc.stats.salud, maxSalud: hitNpc.stats.maxSalud, energia: hitNpc.stats.energia },
          needs: { hambre: hitNpc.needs.hambre, sed: hitNpc.needs.sed, sueno: hitNpc.needs.sueno }
        };
        window.dispatchEvent(new CustomEvent('phaser-npc-selected', { detail: fallbackDetail }));
      } else if (localObjects.length === 0) {
        // Click en suelo vacío -> deseleccionar
        window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
      } else {
        console.log("[MainScene] Click en objeto no-NPC", localObjects.map(o => (o as Phaser.GameObjects.GameObject & { texture?: { key: string } }).texture?.key));
      }
    });

    if (this.input.keyboard) {
      this.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.TAB]);
    }

    // Mensaje inicial consola
    console.log("[MainScene] Player spawneado en", this.player.x.toFixed(0), this.player.y.toFixed(0), "- Usa ENTER para consola y createNpc1..10");
  }

  private getCenterSpawn(): { x: number; y: number } {
    const center = 1000;
    const radius = 200; // 20% de 1000
    const r = radius * Math.sqrt(Math.random());
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Phaser.Math.Clamp(center + r * Math.cos(angle), center - radius, center + radius),
      y: Phaser.Math.Clamp(center + r * Math.sin(angle), center - radius, center + radius),
    };
  }

  public spawnNpcs(count: number) {
    const clamped = Phaser.Math.Clamp(count, 1, 10);
    for (let i = 0; i < clamped; i++) {
      let spawn = this.getCenterSpawn();
      // Evitar solapamiento con player y otros NPCs
      let attempts = 0;
      while (
        (Phaser.Math.Distance.Between(spawn.x, spawn.y, this.player.x, this.player.y) < 60 ||
          this.npcs.some(n => n.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, n.sprite.x, n.sprite.y) < 60)) &&
        attempts < 15
      ) {
        spawn = this.getCenterSpawn();
        attempts++;
      }
      const surv = new Survivor(); // cada uno con habilidades/personalidad/rasgos/gustos/profesión aleatoria independiente
      surv.instanciarSprite(this, spawn.x, spawn.y);
      if (surv.sprite) {
        this.physics.add.collider(this.player, surv.sprite);
        // Colliders entre NPCs
        for (const other of this.npcs) {
          if (other.sprite && surv.sprite) this.physics.add.collider(other.sprite, surv.sprite);
        }
      }
      this.npcs.push(surv);
      console.log(`[MainScene] NPC ${surv.nombre} (${surv.profesion}) spawneado en ${spawn.x.toFixed(0)},${spawn.y.toFixed(0)} - Habilidades:${surv.skills.resumen} Rasgos:${surv.traits.toString()} Pers:${surv.personality.resumen}`);
    }
    window.dispatchEvent(new CustomEvent("phaser-npcs-spawned", { detail: { count: clamped, total: this.npcs.length } }));
  }

  public getNpcs(): Survivor[] {
    return this.npcs;
  }

  private showChatBubble(text: string) {
    // Limpia burbuja previa
    if (this.chatBubble) { this.chatBubble.destroy(true); this.chatBubble = null; }
    if (this.chatBubbleTimer) { this.chatBubbleTimer.remove(false); this.chatBubbleTimer = null; }
    const maxWidth = 220;
    const paddingX = 10, paddingY = 6;
    // Texto temporal para medir
    const txt = this.add.text(0, 0, text, {
      fontSize: "12px", color: "#ffffff", fontFamily: "monospace",
      wordWrap: { width: maxWidth }, align: "center"
    });
    txt.setOrigin(0.5, 0.5);
    const bw = Math.ceil(txt.width) + paddingX * 2;
    const bh = Math.ceil(txt.height) + paddingY * 2;
    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.92);
    bg.lineStyle(1, 0x4caf50, 0.9);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    // Triángulo abajo
    bg.fillStyle(0x111111, 0.92);
    bg.fillTriangle(0, bh / 2, -6, bh / 2 - 2, 6, bh / 2 - 2);
    bg.lineStyle(1, 0x4caf50, 0.9);
    bg.lineBetween(-6, bh / 2 - 2, 0, bh / 2);
    bg.lineBetween(0, bh / 2, 6, bh / 2 - 2);
    const container = this.add.container(this.player.x, this.player.y - 48, [bg, txt]);
    container.setDepth(200);
    container.setAlpha(0);
    this.chatBubble = container;
    this.tweens.add({ targets: container, alpha: 1, duration: 120, ease: "Quad.out" });
    // Pequeño pop
    container.setScale(0.92);
    this.tweens.add({ targets: container, scale: 1, duration: 140, ease: "Back.out" });
    this.chatBubbleTimer = this.time.delayedCall(3500, () => {
      if (!this.chatBubble) return;
      this.tweens.add({
        targets: this.chatBubble, alpha: 0, y: (this.chatBubble.y - 8), duration: 300, ease: "Quad.in",
        onComplete: () => { if (this.chatBubble) { this.chatBubble.destroy(true); this.chatBubble = null; } }
      });
    });
    console.log(`[MainScene] Chat burbuja: "${text}"`);
  }

  private verifyHumanAnimations() {
    const dirs = ["down", "up", "right", "left", "up_right", "up_left", "down_right", "down_left"] as const;
    // Player: walk_*, idle_*, jump_*, dash_*, death_* (prefijo ""), + player_attack_* (prefijo player_)
    // NPC: npc_walk_*, npc_idle_*, npc_jump_*, npc_dash_*, npc_death_*, npc_attack_*
    const checks: string[] = [];
    for (const dir of dirs) {
      checks.push(`walk_${dir}`, `idle_${dir}`, `jump_${dir}`, `dash_${dir}`, `death_${dir}`, `attack_${dir}`);
      checks.push(`player_attack_${dir}`);
      checks.push(`npc_walk_${dir}`, `npc_idle_${dir}`, `npc_jump_${dir}`, `npc_dash_${dir}`, `npc_death_${dir}`, `npc_attack_${dir}`);
    }
    let missing: string[] = [];
    let ok = 0;
    for (const key of checks) {
      if (this.anims.exists(key)) ok++;
      else missing.push(key);
    }
    if (missing.length) console.warn(`[MainScene] Animaciones faltantes (${missing.length}):`, missing);
    else console.log(`[MainScene] ✓ Todas las animaciones humanas verificadas (${ok} anims) para Player y NPCs - modular src/characters/Animations.ts`);
  }

  update() {
    // Sincroniza enabled del plugin de teclado con el bloqueo (evita que Phaser procese WASD mientras se escribe)
    if (this.input.keyboard) {
      const shouldBlock = isGameInputBlocked();
      if (this.input.keyboard.enabled === shouldBlock) {
        this.input.keyboard.enabled = !shouldBlock;
        if (shouldBlock) this.input.keyboard.resetKeys();
      }
    }
    // Si chat/consola o rebinding activo, anula todo input de juego para priorizar escritura
    if (isGameInputBlocked()) {
      if (this.player) {
        const b = this.player.body as Phaser.Physics.Arcade.Body | undefined;
        if (b) b.setVelocity(0);
        this.player.updateEntity();
      }
      // Burbuja sigue al player incluso bloqueado
      if (this.chatBubble && this.player) {
        this.chatBubble.x = this.player.x;
        this.chatBubble.y = this.player.y - 48;
      }
      return;
    }
    if (InputSystem.isCloseJustPressed(this)) {
      window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
    }
    if (InputSystem.isInventoryJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-inventory"));
    if (InputSystem.isMapJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-map"));
    if (InputSystem.isMissionsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-missions"));
    if (InputSystem.isStatsJustPressed(this)) window.dispatchEvent(new CustomEvent("phaser-action-stats"));

    // Debug NPCs: J/K/L afectan a todos los NPCs para verificar reuso (escalable a N) - bloqueado si consola abierta
    if (this.input.keyboard && !isGameInputBlocked()) {
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J))) {
        for (const n of this.npcs) n.saltar();
      }
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K))) {
        for (const n of this.npcs) n.dash();
      }
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L))) {
        for (const n of this.npcs) n.atacar();
      }
    }

    if (this.player) this.player.updateEntity();
    for (const n of this.npcs) n.updateEntity();
    // Burbuja sigue al player
    if (this.chatBubble && this.player) {
      this.chatBubble.x = this.player.x;
      this.chatBubble.y = this.player.y - 48;
    }
  }
}
