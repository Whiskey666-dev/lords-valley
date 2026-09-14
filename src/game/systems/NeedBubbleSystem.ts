import Phaser from "phaser";
import { NEEDS_WARN_THRESHOLD } from "../../characters/Needs";
import type { Player } from "../../characters/Player";
import type { Survivor } from "../../characters/Survivor";

/**
 * NeedBubbleSystem.ts - Nubes flotantes de hambre/sed sobre player y NPCs.
 * Muestra 🍖 si hambre >= 60, 💧 si sed >= 60 (ambos si los dos).
 * Estilo nube de texto: fondo blanco semitransparente con los iconos.
 *
 * El BACKEND es la autoridad de las necesidades (player: /player/me/needs,
 * NPCs: SimulationEngine 5h). Este sistema solo LEE los valores locales
 * (predicción cliente) y los dibuja; nunca los calcula como verdad final.
 */

type NeedTarget = {
  id: string;
  x: number;
  y: number;
  hambre: number;
  sed: number;
  alive: boolean;
};

function needIcon(hambre: number, sed: number): string | null {
  const h = hambre >= NEEDS_WARN_THRESHOLD;
  const s = sed >= NEEDS_WARN_THRESHOLD;
  if (h && s) return "🍖💧";
  if (h) return "🍖";
  if (s) return "💧";
  return null;
}

export class NeedBubbleSystem {
  private bubbles = new Map<string, Phaser.GameObjects.Text>();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(player: Player | null | undefined, npcs: Survivor[]): void {
    if (!this.scene?.sys?.isActive?.()) return;
    const now = this.scene.time.now;
    const seen = new Set<string>();

    const targets: NeedTarget[] = [];
    try {
      if (player && (player as unknown as { estaVivo?: boolean }).estaVivo !== false) {
        const p = player as unknown as { x: number; y: number; active?: boolean };
        const needs = (player as unknown as { needs?: { hambre: number; sed: number } }).needs;
        if (p && needs && p.active !== false) {
          targets.push({ id: "player", x: p.x, y: p.y - 74, hambre: needs.hambre, sed: needs.sed, alive: true });
        }
      }
    } catch {
      // ignora player corrupto
    }
    for (const n of npcs ?? []) {
      try {
        if (!n || !n.estaVivo || !n.sprite?.active) continue;
        targets.push({
          id: n.id,
          x: n.sprite.x,
          y: n.sprite.y - 80,
          hambre: n.needs?.hambre ?? 0,
          sed: n.needs?.sed ?? 0,
          alive: true,
        });
      } catch {
        // ignora npc corrupto
      }
    }

    for (const t of targets) {
      const icon = t.alive ? needIcon(t.hambre, t.sed) : null;
      if (!icon) {
        this.remove(t.id);
        continue;
      }
      seen.add(t.id);
      // Flote suave: bob senoidal desfasado por id para que no se muevan al unísono
      let phase = 0;
      for (let i = 0; i < t.id.length; i++) phase += t.id.charCodeAt(i);
      const bob = Math.sin(now / 450 + phase) * 3;
      let txt = this.bubbles.get(t.id);
      if (!txt || !txt.active) {
        txt = this.scene.add.text(t.x, t.y + bob, icon, {
          fontSize: "15px",
          backgroundColor: "#fffffff2",
          color: "#222222",
          padding: { x: 6, y: 4 },
        });
        txt.setOrigin(0.5, 0.5);
        txt.setDepth(9500);
        this.bubbles.set(t.id, txt);
      }
      if (txt.text !== icon) txt.setText(icon);
      txt.setPosition(t.x, t.y + bob);
    }

    // Limpia burbujas de entidades que ya no tienen aviso o desaparecieron
    for (const [id, txt] of this.bubbles) {
      if (!seen.has(id)) this.remove(id);
      else if (!txt?.active) this.bubbles.delete(id);
    }
  }

  private remove(id: string): void {
    const txt = this.bubbles.get(id);
    if (txt) {
      try {
        txt.destroy();
      } catch {
        // ignora
      }
      this.bubbles.delete(id);
    }
  }

  destroy(): void {
    for (const id of [...this.bubbles.keys()]) this.remove(id);
  }
}
