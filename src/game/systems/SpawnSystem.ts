import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";

/**
 * SpawnSystem.ts - Sistema de spawn modular.
 * Centraliza la lógica de posiciones aleatorias en radio 200 (20% alrededor de 1000,1000)
 * usada tanto por Player como por NPCs. Evita duplicar getCenterSpawn.
 */

export function getCenterSpawn(_scene: Phaser.Scene): { x: number; y: number } {
  const center = 1000;
  const radius = 200;
  const r = radius * Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Phaser.Math.Clamp(center + r * Math.cos(angle), center - radius, center + radius),
    y: Phaser.Math.Clamp(center + r * Math.sin(angle), center - radius, center + radius),
  };
}

export function spawnNpcs(
  scene: Phaser.Scene,
  count: number,
  player: Phaser.GameObjects.GameObject & { x: number; y: number },
  npcs: Survivor[]
): void {
  const clamped = Phaser.Math.Clamp(count, 1, 10);
  for (let i = 0; i < clamped; i++) {
    let spawn = getCenterSpawn(scene);
    let attempts = 0;
    while (
      (Phaser.Math.Distance.Between(spawn.x, spawn.y, player.x, player.y) < 60 ||
        npcs.some(n => n.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, n.sprite.x, n.sprite.y) < 60)) &&
      attempts < 15
    ) {
      spawn = getCenterSpawn(scene);
      attempts++;
    }
    const surv = new Survivor();
    surv.instanciarSprite(scene, spawn.x, spawn.y);
    if (surv.sprite) {
      scene.physics.add.collider(player as unknown as Phaser.Physics.Arcade.Sprite, surv.sprite);
      for (const other of npcs) {
        if (other.sprite && surv.sprite) scene.physics.add.collider(other.sprite, surv.sprite);
      }
    }
    npcs.push(surv);
    console.log(`[SpawnSystem] NPC ${surv.nombre} (${surv.profesion}) en ${spawn.x.toFixed(0)},${spawn.y.toFixed(0)}`);
  }
  window.dispatchEvent(new CustomEvent("phaser-npcs-spawned", { detail: { count: clamped, total: npcs.length } }));
}
