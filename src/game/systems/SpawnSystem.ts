import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";
import { DeadDragon } from "../../characters/DeadDragon";
import { Ghost } from "../../characters/Ghost";
import { isBlockedTile, findNearestSafeWorldPos, isBlockedIsoWorldXY, isoToTile, tileToIso, TILE, WORLD_SIZE, ISO_TILE_H } from "../world/Terrain";
import { spawnSurvivors as apiSpawnSurvivors } from "../../app/api/settlement.api";
import { requestGhostSpawn, joinCombatRoom } from "../../app/socket";

/**
 * SpawnSystem.ts - Sistema de spawn modular.
 * Centraliza la lógica de posiciones y coordina con el servidor para datos autoritativos.
 *
 * ARQUITECTURA DE SEGURIDAD:
 * - NPCs (Survivors): datos vienen del servidor via POST /settlements/:id/survivors/spawn
 * - Ghosts: IDs y stats vienen del servidor via WebSocket 'ghost:spawned'
 * - Dead Dragons: generados localmente (entidades del jugador, no críticas para seguridad en v0.1)
 * - El cliente NUNCA genera IDs de entidades de red con Math.random() para persistirlos
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

/**
 * Spawna NPCs con datos autoritativos del servidor.
 * El backend genera IDs UUID reales, stats y needs — no Math.random() en el cliente.
 *
 * Flujo:
 *   1. Llama POST /settlements/:id/survivors/spawn
 *   2. El servidor retorna los survivors con datos canónicos
 *   3. Se crean sprites Phaser localmente con esos datos
 *   4. Si el backend no está disponible, fallback temporal a generación local (con advertencia)
 */
export async function spawnNpcs(
  scene: Phaser.Scene,
  count: number,
  player: Phaser.GameObjects.GameObject & { x: number; y: number },
  npcs: Survivor[],
  settlementId?: string
): Promise<void> {
  const clamped = Phaser.Math.Clamp(count, 1, 10);

  // ESTRATEGIA PRINCIPAL: datos del servidor
  if (settlementId) {
    try {
      const updatedSettlement = await apiSpawnSurvivors(settlementId, clamped);
      const newSurvivors = updatedSettlement.survivors.slice(-clamped); // los últimos N son los recién creados

      for (const serverData of newSurvivors) {
        const surv = Survivor.fromServerData(serverData);
        const otherSprites = npcs.map(n => n.sprite).filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];

        // Usar posición del servidor si existe y es válida, si no, calcular posición segura
        let spawnPos: { x: number; y: number };
        if (typeof serverData.positionX === 'number' && serverData.positionX !== 0) {
          spawnPos = { x: serverData.positionX, y: serverData.positionY ?? serverData.positionX };
        } else {
          spawnPos = findSafeSpawnPos(player, 80, 220, otherSprites, 50);
        }

        surv.instanciarSprite(scene, spawnPos.x, spawnPos.y);
        npcs.push(surv);
        console.log(`[SpawnSystem] NPC ${surv.nombre} (${surv.profesion}) [server-id: ${surv.id}] generado en ${spawnPos.x.toFixed(0)},${spawnPos.y.toFixed(0)}`);
      }

      window.dispatchEvent(new CustomEvent("phaser-npcs-spawned", { detail: { count: newSurvivors.length, total: npcs.length } }));
      return;
    } catch (err) {
      console.warn('[SpawnSystem] Servidor no disponible para spawn de NPCs, usando fallback local temporal:', err);
    }
  }

  // FALLBACK: generación local (solo si no hay settlementId o el servidor falla)
  // ADVERTENCIA: Este modo no es seguro para producción multiplayer.
  console.warn('[SpawnSystem] ⚠️ FALLBACK LOCAL: NPCs generados sin datos del servidor. Solo para desarrollo.');
  for (let i = 0; i < clamped; i++) {
    const otherSprites = npcs.map(n => n.sprite).filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];
    const spawn = findSafeSpawnPos(player, 80, 220, otherSprites, 50);

    const surv = new Survivor();
    surv.instanciarSprite(scene, spawn.x, spawn.y);
    npcs.push(surv);
    console.log(`[SpawnSystem] NPC ${surv.nombre} (${surv.profesion}) [LOCAL-FALLBACK] generado en ${spawn.x},${spawn.y}`);
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
 * Solicita spawn de Ghosts al servidor via WebSocket.
 * El servidor genera IDs UUID reales y los broadcast al settlement room.
 *
 * Flujo:
 *   1. Emite 'ghost:spawn_request' al servidor via /combat socket
 *   2. El servidor genera ghosts con stats canónicos y emite 'ghost:spawned'
 *   3. El listener de 'ghost:spawned' en MainScene crea los sprites Phaser
 *
 * Si no hay settlementId, fallback a generación local (con advertencia).
 */
export function requestServerGhostSpawn(
  count: number,
  settlementId?: string
): void {
  const clamped = Phaser.Math.Clamp(count, 1, 3);

  if (settlementId) {
    requestGhostSpawn(settlementId, clamped);
    console.log(`[SpawnSystem] Ghost spawn solicitado al servidor: ${clamped} ghosts para settlement ${settlementId}`);
  } else {
    // Fallback sin settlementId — genera localmente con advertencia
    console.warn('[SpawnSystem] ⚠️ requestServerGhostSpawn sin settlementId — los ghosts no estarán registrados en el servidor');
    window.dispatchEvent(new CustomEvent("phaser-create-ghosts-local" as any, { detail: { count: clamped } }));
  }
}

/**
 * Inicia el listener de combate para el settlement.
 * Llama esto al cargar el juego para suscribirse a eventos de ghost spawning/death del servidor.
 */
export function initCombatSocket(settlementId: string): void {
  joinCombatRoom(settlementId);
  console.log(`[SpawnSystem] Combat socket inicializado para settlement ${settlementId}`);
}

/**
 * @deprecated Usar requestServerGhostSpawn() en su lugar.
 * Genera Ghosts localmente sin datos del servidor. Solo para compatibilidad con código existente.
 */
export function spawnGhosts(
  scene: Phaser.Scene,
  count: number,
  player: Phaser.GameObjects.GameObject & { x: number; y: number },
  ghosts: Ghost[],
  existingNpcs: Survivor[] = []
): void {
  console.warn('[SpawnSystem] ⚠️ spawnGhosts() LOCAL — los datos no son autoritativos. Usar requestServerGhostSpawn() con settlementId.');
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
    console.log(`[SpawnSystem] Ghost ${ghost.id} generado LOCALMENTE en (${spawn.x.toFixed(0)}, ${spawn.y.toFixed(0)})`);
  }
  window.dispatchEvent(new CustomEvent("phaser-ghosts-spawned" as any, { detail: { count: clamped, total: ghosts.length } }));
}
