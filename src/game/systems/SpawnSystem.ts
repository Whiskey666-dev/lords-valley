import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";

/**
 * SpawnSystem.ts - Sistema de spawn modular.
 * Centraliza la lógica de posiciones aleatorias para Player y NPCs.
 */

export function getCenterSpawn(_scene: Phaser.Scene): { x: number; y: number } {
  const bounds = (_scene as any)?.physics?.world?.bounds;
  const worldW = bounds?.width ?? 6144;
  const center = worldW / 2;
  const radius = 200;
  const r = radius * Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Phaser.Math.Clamp(center + r * Math.cos(angle), center - radius, center + radius),
    y: Phaser.Math.Clamp(center + r * Math.sin(angle), center - radius, center + radius),
  };
}

export function getSpawnNearPlayer(
  player: { x: number; y: number },
  minRadius = 80,
  maxRadius = 200
): { x: number; y: number } {
  const r = minRadius + (maxRadius - minRadius) * Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.round(player.x + r * Math.cos(angle)),
    y: Math.round(player.y + r * Math.sin(angle)),
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
    let spawn = player ? getSpawnNearPlayer(player, 80, 220) : getCenterSpawn(scene);
    let attempts = 0;
    while (
      attempts < 15 &&
      ((player && Phaser.Math.Distance.Between(spawn.x, spawn.y, player.x, player.y) < 60) ||
        npcs.some(n => n.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, n.sprite.x, n.sprite.y) < 50))
    ) {
      spawn = player ? getSpawnNearPlayer(player, 80, 220) : getCenterSpawn(scene);
      attempts++;
    }

    const surv = new Survivor();
    surv.instanciarSprite(scene, spawn.x, spawn.y);
    if (surv.sprite) {
      if (player) {
        scene.physics.add.collider(player as unknown as Phaser.Physics.Arcade.Sprite, surv.sprite);
      }
      for (const other of npcs) {
        if (other.sprite && surv.sprite) {
          scene.physics.add.collider(other.sprite, surv.sprite);
        }
      }
    }
    npcs.push(surv);
    console.log(`[SpawnSystem] NPC ${surv.nombre} (${surv.profesion}) generado en ${spawn.x},${spawn.y}`);
  }

  window.dispatchEvent(new CustomEvent("phaser-npcs-spawned", { detail: { count: clamped, total: npcs.length } }));
}
