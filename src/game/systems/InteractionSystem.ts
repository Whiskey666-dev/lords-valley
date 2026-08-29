import Phaser from "phaser";
import { isGameInputBlocked } from "../../ui/input/KeyBindings";
import type { Survivor } from "../../characters/Survivor";

/**
 * InteractionSystem.ts - Maneja clicks en NPCs y deselección.
 * Extraído de MainScene para reducir tamaño y mejorar legibilidad.
 */

export function setupInteraction(scene: Phaser.Scene, npcs: Survivor[]): void {
  scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer, localObjects: Phaser.GameObjects.GameObject[]) => {
    if (isGameInputBlocked()) {
      console.log("[Interaction] pointerdown bloqueado por consola/chat");
      return;
    }
    console.log("[Interaction] pointerdown", pointer.worldX.toFixed(0), pointer.worldY.toFixed(0), "objs", localObjects.length, "npcs", npcs.length);

    let hitNpc: Survivor | null = null;
    for (const npc of npcs) {
      if (npc.sprite && localObjects.includes(npc.sprite)) {
        hitNpc = npc;
        console.log("[Interaction] Hit localObjects", npc.nombre);
        break;
      }
    }
    if (!hitNpc) {
      for (const npc of npcs) {
        if (npc.sprite && Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, npc.sprite.x, npc.sprite.y) < 40) {
          hitNpc = npc;
          console.log("[Interaction] Click proximidad", npc.nombre);
          break;
        }
      }
    }
    if (hitNpc) {
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
      window.dispatchEvent(new CustomEvent("phaser-npc-deselected"));
    } else {
      console.log("[Interaction] Click objeto no-NPC", localObjects.map(o => (o as Phaser.GameObjects.GameObject & { texture?: { key: string } }).texture?.key));
    }
  });

  if (scene.input.keyboard) {
    scene.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.TAB]);
  }
}
