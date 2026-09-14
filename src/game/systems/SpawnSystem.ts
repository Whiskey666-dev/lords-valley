import Phaser from "phaser";
import { Survivor } from "../../characters/Survivor";
import { DeadDragon } from "../../characters/DeadDragon";
import { Ghost } from "../../characters/Ghost";
import { isBlockedTile, findNearestSafeWorldPos, findNearestSafeIsoPos, isBlockedIsoWorldXY, isoToTile, tileToIso, TILE, WORLD_SIZE, WORLD_TILES, ISO_TILE_H, ISO_WORLD_WIDTH, ISO_WORLD_HEIGHT } from "../world/Terrain";
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
 * Punto aleatorio SEGURO en cualquier parte del mapa iso (coords iso 0..12288 x 0..6144).
 * Se usa como base sugerida para el spawn de Ghosts: el servidor dispersa
 * alrededor y sigue siendo la autoridad de la posición final.
 */
export function getRandomMapSpawn(): { x: number; y: number } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const tx = 8 + Math.floor(Math.random() * (WORLD_TILES - 16));
    const ty = 8 + Math.floor(Math.random() * (WORLD_TILES - 16));
    const p = tileToIso(tx, ty);
    const y = p.y + ISO_TILE_H / 2;
    if (!isBlockedIsoWorldXY(p.x, y)) return { x: Math.round(p.x), y: Math.round(y) };
    const safe = findNearestSafeIsoPos(p.x, y, 12);
    if (safe) return { x: Math.round(safe.x), y: Math.round(safe.y) };
  }
  const c = tileToIso(96, 96);
  return { x: Math.round(c.x), y: Math.round(c.y + ISO_TILE_H / 2) };
}

/**
 * Acota un punto a los límites del mundo iso.
 */
export function clampToIsoWorld(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(ISO_WORLD_WIDTH, Math.round(x))),
    y: Math.max(0, Math.min(ISO_WORLD_HEIGHT, Math.round(y))),
  };
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

  // ESTRATEGIA PRINCIPAL: datos del servidor (IDs UUID reales, stats canónicos)
  if (settlementId) {
    try {
      // El endpoint acota a 5 por llamada: trocear + detectar por id (nunca slice(-N),
      // que duplicaría preexistentes si el settlement ya tenía survivors).
      const knownIds = new Set(npcs.map(n => n.id));
      let created = 0;
      for (let pending = clamped; pending > 0; pending -= 5) {
        const updatedSettlement = await apiSpawnSurvivors(settlementId, Math.min(pending, 5));
        const fresh = (updatedSettlement.survivors ?? []).filter(s => s?.id && !knownIds.has(s.id));
        for (const serverData of fresh) {
          knownIds.add(serverData.id);
          const surv = Survivor.fromServerData(serverData);
          const otherSprites = npcs.map(n => n.sprite).filter(Boolean) as (Phaser.GameObjects.GameObject & { x: number; y: number })[];
          // Render SIEMPRE en coords iso del cliente: la positionX del servidor vive
          // en espacio tile (3072±150) y pintarla directo caería en la zona oeste.
          // La última posición iso real persiste en el guardado local (SaveSystem).
          const spawnPos = findSafeSpawnPos(player, 80, 220, otherSprites, 50);
          surv.instanciarSprite(scene, spawnPos.x, spawnPos.y);
          npcs.push(surv);
          created++;
          console.log(`[SpawnSystem] NPC ${surv.nombre} (${surv.profesion}) [server-id: ${surv.id}] generado en ${spawnPos.x.toFixed(0)},${spawnPos.y.toFixed(0)}`);
        }
      }

      window.dispatchEvent(new CustomEvent("phaser-npcs-spawned", { detail: { count: created, total: npcs.length } }));
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
 *   1. Emite 'ghost:spawn_request' al servidor via /combat socket (UNO por ghost,
 *      cada uno con su propia base aleatoria en cualquier parte del mapa iso)
 *   2. El servidor genera ghosts con stats canónicos, dispersa alrededor de la
 *      base y emite 'ghost:spawned' (sigue siendo la autoridad de la posición)
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
    // Un request por ghost: cada uno aparece en un punto aleatorio DISTINTO
    // del mapa en lugar de agruparse alrededor de una única base.
    for (let i = 0; i < clamped; i++) {
      const base = getRandomMapSpawn();
      requestGhostSpawn(settlementId, 1, base);
    }
    console.log(`[SpawnSystem] ${clamped} ghost(s) solicitados al servidor (bases aleatorias) para settlement ${settlementId}`);
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
  _player: Phaser.GameObjects.GameObject & { x: number; y: number },
  ghosts: Ghost[],
  _existingNpcs: Survivor[] = []
): void {
  console.warn('[SpawnSystem] ⚠️ spawnGhosts() LOCAL — los datos no son autoritativos. Usar requestServerGhostSpawn() con settlementId.');
  const clamped = Phaser.Math.Clamp(count, 1, 3);
  for (let i = 0; i < clamped; i++) {
    // Igual que el servidor: punto aleatorio en cualquier parte del mapa (no junto al jugador)
    const spawn = getRandomMapSpawn();

    const ghost = new Ghost();
    ghost.instanciarSprite(scene, spawn.x, spawn.y);
    ghosts.push(ghost);
    console.log(`[SpawnSystem] Ghost ${ghost.id} generado LOCALMENTE en (${spawn.x.toFixed(0)}, ${spawn.y.toFixed(0)})`);
  }
  window.dispatchEvent(new CustomEvent("phaser-ghosts-spawned" as any, { detail: { count: clamped, total: ghosts.length } }));
}
