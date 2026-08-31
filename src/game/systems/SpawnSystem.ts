import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";
import { isBlockedTile, findNearestSafeWorldPos, TILE, WORLD_SIZE } from "../world/Terrain";

/**
 * SpawnSystem.ts - Sistema de spawn modular.
 * Centraliza la lógica de posiciones aleatorias para Player y NPCs.
 */

export function getCenterSpawn(_scene: Phaser.Scene): { x: number; y: number } {
  const centerX = WORLD_SIZE / 2;
  const centerY = WORLD_SIZE / 2;
  const tx = Math.floor(centerX / TILE);
  const ty = Math.floor(centerY / TILE);
  if (!isBlockedTile(tx, ty)) return { x: centerX, y: centerY };
  // Si el centro exacto está bloqueado (agua/mineral), buscar el tile seguro más cercano
  const safe = findNearestSafeWorldPos(centerX, centerY, 30);
  if (safe) return safe;
  return { x: centerX, y: centerY };
}

export function getSpawnNearPlayer(
  player: { x: number; y: number },
  minRadius = 80,
  maxRadius = 200
): { x: number; y: number } {
  for (let attempt = 0; attempt < 15; attempt++) {
    const r = minRadius + (maxRadius - minRadius) * Math.sqrt(Math.random());
    const angle = Math.random() * Math.PI * 2;
    const x = Math.round(player.x + r * Math.cos(angle));
    const y = Math.round(player.y + r * Math.sin(angle));
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (!isBlockedTile(tx, ty)) return { x, y };
  }
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
        npcs.some(n => n.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, n.sprite.x, n.sprite.y) < 50) ||
        isBlockedTile(Math.floor(spawn.x / TILE), Math.floor(spawn.y / TILE)))
    ) {
      spawn = player ? getSpawnNearPlayer(player, 80, 220) : getCenterSpawn(scene);
      attempts++;
    }

    const surv = new Survivor();
    surv.instanciarSprite(scene, spawn.x, spawn.y);
    // Física entre personajes/NPCs eliminada: pueden atravesarse entre ellos. Sin colliders player↔npc ni npc↔npc.
    npcs.push(surv);
    console.log(`[SpawnSystem] NPC ${surv.nombre} (${surv.profesion}) generado en ${spawn.x},${spawn.y}`);
  }

  window.dispatchEvent(new CustomEvent("phaser-npcs-spawned", { detail: { count: clamped, total: npcs.length } }));
}
