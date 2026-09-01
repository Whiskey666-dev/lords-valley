import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";
import { DeadDragon } from "../../characters/DeadDragon";
import { isBlockedTile, findNearestSafeWorldPos, isBlockedIsoWorldXY, isoToTile, tileToIso, TILE, WORLD_SIZE, ISO_TILE_W, ISO_TILE_H } from "../world/Terrain";

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
    // En mundo isométrico usamos conversión iso->tile
    const { tileX, tileY } = isoToTile(x, y);
    if (!isBlockedTile(tileX, tileY)) return { x, y };
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
    let spawn = player ? getSpawnNearPlayer(player, 80, 220) : (()=>{ const p=tileToIso(96,96); return {x:p.x+ISO_TILE_W/2,y:p.y+ISO_TILE_H/2}; })();
    let attempts = 0;
    while (
      attempts < 15 &&
      ((player && Phaser.Math.Distance.Between(spawn.x, spawn.y, player.x, player.y) < 60) ||
        npcs.some(n => n.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, n.sprite.x, n.sprite.y) < 50) ||
        isBlockedIsoWorldXY(spawn.x, spawn.y))
    ) {
      spawn = player ? getSpawnNearPlayer(player, 80, 220) : (()=>{ const p=tileToIso(96,96); return {x:p.x+ISO_TILE_W/2,y:p.y+ISO_TILE_H/2}; })();
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

export function spawnDeadDragons(
  scene: Phaser.Scene,
  count: number,
  isAlly: boolean,
  player: Phaser.GameObjects.GameObject & { x: number; y: number },
  deadDragons: DeadDragon[],
  existingNpcs: Survivor[] = []
): void {
  const clamped = Phaser.Math.Clamp(count, 1, 5);
  for (let i = 0; i < clamped; i++) {
    let spawn = player ? getSpawnNearPlayer(player, 120, 320) : (()=>{ const p=tileToIso(96,96); return {x:p.x+ISO_TILE_W/2,y:p.y+ISO_TILE_H/2}; })();
    let attempts = 0;
    while (
      attempts < 15 &&
      ((player && Phaser.Math.Distance.Between(spawn.x, spawn.y, player.x, player.y) < 80) ||
        deadDragons.some(d => d.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, d.sprite.x, d.sprite.y) < 80) ||
        existingNpcs.some(n => n.sprite && Phaser.Math.Distance.Between(spawn.x, spawn.y, n.sprite.x, n.sprite.y) < 60) ||
        isBlockedIsoWorldXY(spawn.x, spawn.y))
    ) {
      spawn = player ? getSpawnNearPlayer(player, 120, 320) : (()=>{ const p=tileToIso(96,96); return {x:p.x+ISO_TILE_W/2,y:p.y+ISO_TILE_H/2}; })();
      attempts++;
    }
    const dragon = new DeadDragon(isAlly, spawn.x, spawn.y);
    dragon.instanciarSprite(scene, spawn.x, spawn.y);
    deadDragons.push(dragon);
    console.log(`[SpawnSystem] Dead Dragon ${isAlly ? "Aliado" : "Enemigo"} ${dragon.nombre} generado en ${spawn.x},${spawn.y}`);
  }
  window.dispatchEvent(new CustomEvent("phaser-dead-dragons-spawned" as any, { detail: { count: clamped, total: deadDragons.length, isAlly } }));
}
