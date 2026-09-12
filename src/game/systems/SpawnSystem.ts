import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";
import { DeadDragon } from "../../characters/DeadDragon";
import { Ghost } from "../../characters/Ghost";
import { isBlockedTile, findNearestSafeWorldPos, isBlockedIsoWorldXY, isoToTile, tileToIso, TILE, WORLD_SIZE, ISO_TILE_H } from "../world/Terrain";

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

/**
 * Encuentra una posición isométrica segura y no bloqueada cerca del jugador
 * evitando colisionar o solaparse con entidades existentes.
 */
export function findSafeSpawnPos(
  player: { x: number; y: number } | null | undefined,
  minRadius = 80,
  maxRadius = 220,
  otherSprites: (Phaser.GameObjects.GameObject & { x?: number; y?: number })[] = [],
  minDistFromOthers = 60
): { x: number; y: number } {
  const defaultSpawn = () => {
    const p = tileToIso(96, 96);
    return { x: p.x, y: p.y + ISO_TILE_H / 2 };
  };

  let spawn = player ? getSpawnNearPlayer(player, minRadius, maxRadius) : defaultSpawn();
  let attempts = 0;

  while (attempts < 15) {
    const tooCloseToPlayer = player && Phaser.Math.Distance.Between(spawn.x, spawn.y, player.x, player.y) < minDistFromOthers;
    const tooCloseToOther = otherSprites.some(
      s => s && typeof s.x === "number" && typeof s.y === "number" && Phaser.Math.Distance.Between(spawn.x, spawn.y, s.x, s.y) < minDistFromOthers
    );
    const isBlocked = isBlockedIsoWorldXY(spawn.x, spawn.y);

    if (!tooCloseToPlayer && !tooCloseToOther && !isBlocked) {
      return spawn;
    }
    spawn = player ? getSpawnNearPlayer(player, minRadius, maxRadius) : defaultSpawn();
    attempts++;
  }

  return spawn;
}

export function spawnNpcs(
  scene: Phaser.Scene,
  count: number,
  player: Phaser.GameObjects.GameObject & { x: number; y: number },
  npcs: Survivor[]
): void {
  const clamped = Phaser.Math.Clamp(count, 1, 10);
  for (let i = 0; i < clamped; i++) {
    const otherSprites = npcs.map(n => n.sprite).filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];
    const spawn = findSafeSpawnPos(player, 80, 220, otherSprites, 50);

    const surv = new Survivor();
    surv.instanciarSprite(scene, spawn.x, spawn.y);
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
    const otherSprites = [
      ...deadDragons.map(d => d.sprite),
      ...existingNpcs.map(n => n.sprite),
    ].filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];
    const spawn = findSafeSpawnPos(player, 120, 320, otherSprites, 70);

    const dragon = new DeadDragon(isAlly, spawn.x, spawn.y);
    dragon.instanciarSprite(scene, spawn.x, spawn.y);
    deadDragons.push(dragon);
    console.log(`[SpawnSystem] Dead Dragon ${isAlly ? "Aliado" : "Enemigo"} ${dragon.nombre} generado en ${spawn.x},${spawn.y}`);
  }
  window.dispatchEvent(new CustomEvent("phaser-dead-dragons-spawned" as any, { detail: { count: clamped, total: deadDragons.length, isAlly } }));
}

/**
 * Spawna 1-3 Ghosts enemigos cerca del jugador.
 * Máximo 3 por llamada de comando.
 */
export function spawnGhosts(
  scene: Phaser.Scene,
  count: number,
  player: Phaser.GameObjects.GameObject & { x: number; y: number },
  ghosts: Ghost[],
  existingNpcs: Survivor[] = []
): void {
  const clamped = Phaser.Math.Clamp(count, 1, 3);
  for (let i = 0; i < clamped; i++) {
    const otherSprites = [
      ...ghosts.map(g => g.sprite),
      ...existingNpcs.map(n => n.sprite),
    ].filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];
    const spawn = findSafeSpawnPos(player, 100, 260, otherSprites, 50);

    const ghost = new Ghost();
    ghost.instanciarSprite(scene, spawn.x, spawn.y);
    ghosts.push(ghost);
    console.log(`[SpawnSystem] Ghost ${ghost.id} generado en (${spawn.x.toFixed(0)}, ${spawn.y.toFixed(0)})`);
  }
  window.dispatchEvent(new CustomEvent("phaser-ghosts-spawned" as any, { detail: { count: clamped, total: ghosts.length } }));
}
