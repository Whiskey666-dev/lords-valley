import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const url = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:3000/game';
  socket = io(url, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    randomizationFactor: 0.5,
    timeout: 8000,
  });

  socket.on('connect', () => console.log('[socket] connected', socket!.id));
  socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason));
  let lastWarn = 0;
  socket.on('connect_error', (err) => {
    const now = Date.now();
    if (now - lastWarn > 5000) {
      console.warn('[socket] connect_error', err.message);
      lastWarn = now;
    }
  });

  return socket;
}

export function joinSettlement(settlementId: string) {
  const s = getSocket();
  s.emit('joinSettlement', { settlementId });
  console.log('[socket] joinSettlement', settlementId);
}

export function leaveSettlement(settlementId: string) {
  const s = getSocket();
  s.emit('leaveSettlement', { settlementId });
}

// ─── Combat Socket (namespace /combat) ──────────────────────────────────────
// El servidor es la autoridad: daño, spawn de ghosts y modo de juego pasan por aquí.

let combatSocket: Socket | null = null;

export function getCombatSocket(): Socket {
  if (combatSocket) return combatSocket;
  const baseUrl = ((import.meta.env.VITE_WS_URL as string) || 'http://localhost:3000/game')
    .replace('/game', '')
    .replace(/\/$/, '');
  const url = `${baseUrl}/combat`;
  combatSocket = io(url, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 8000,
  });

  combatSocket.on('connect', () => console.log('[combat-socket] connected', combatSocket!.id));
  combatSocket.on('disconnect', (reason) => console.log('[combat-socket] disconnected', reason));
  combatSocket.on('combat:error', (err: any) => console.warn('[combat-socket] error', err));

  return combatSocket;
}

/** Une el socket al room del settlement para recibir eventos de combate */
export function joinCombatRoom(settlementId: string): void {
  const s = getCombatSocket();
  s.emit('combat:join', { settlementId });
  console.log('[combat-socket] joinCombatRoom', settlementId);
}

/**
 * Solicita al servidor spawnear ghosts.
 * El servidor genera IDs UUID reales y hace broadcast a todos en el room.
 * El cliente NO crea ghosts hasta recibir el evento 'ghost:spawned'.
 * `base` es solo una sugerencia (punto aleatorio del mapa iso): el servidor
 * dispersa alrededor y sigue siendo la autoridad de la posición final.
 */
export function requestGhostSpawn(settlementId: string, count = 1, base?: { x: number; y: number }): void {
  const s = getCombatSocket();
  s.emit('ghost:spawn_request', {
    settlementId,
    count,
    ...(typeof base?.x === 'number' && typeof base?.y === 'number'
      ? { baseX: Math.round(base.x), baseY: Math.round(base.y) }
      : {}),
  });
}

/**
 * Reporta que el jugador hizo daño a un ghost.
 * El servidor valida (distancia, cooldown) y emite 'ghost:damage_result'.
 * El cliente NO aplica daño localmente hasta recibir la confirmación.
 */export function reportGhostDamage(params: {
  ghostId: string;
  amount: number;
  attackerId: string;
  attackerX: number;
  attackerY: number;
}): void {
  const s = getCombatSocket();
  s.emit('ghost:damage', params);
}

/**
 * Reporta que un ghost intentó atacar al jugador.
 * El servidor valida (modo creativo, distancia, cooldown) y decide si aplicar el daño.
 * El cliente aplica daño SOLO cuando recibe 'player:damage_result' con applied=true.
 */
export function reportPlayerAttacked(params: {
  ghostId: string;
  targetId: string;
  ghostX: number;
  ghostY: number;
  targetX: number;
  targetY: number;
  settlementId: string;
}): void {
  const s = getCombatSocket();
  s.emit('player:attacked', params);
}

/** Actualiza la posición del ghost en el servidor para validaciones de distancia */
export function updateGhostPosition(ghostId: string, x: number, y: number): void {
  const s = getCombatSocket();
  s.emit('ghost:position_update', { ghostId, x, y });
}

/** ID de entidad del jugador para reportes de combate (un jugador por settlement en v0.1).
 * Debe ser idéntico en todas las rutas (ghost y combat:hit comparten el HP del servidor). */
export function playerEntityId(): string {
  try {
    return (window as any).__PLAYER_ID__ ?? 'player';
  } catch {
    return 'player';
  }
}

/** Settlement actual para reportes de combate */
export function currentSettlementId(): string {
  try {
    return (window as any).__SETTLEMENT_ID__ ?? localStorage.getItem('settlementId') ?? '';
  } catch {
    return '';
  }
}

export type CombatKind = 'player' | 'survivor' | 'dead-dragon' | 'ghost';

/**
 * Reporta un golpe genérico. El servidor valida (kinds, distancia, cooldown)
 * y decreta daño y muerte; el cliente aplica solo al recibir 'combat:hit_result'.
 */
export function reportCombatHit(params: {
  attackerId: string;
  attackerKind: CombatKind;
  targetId: string;
  targetKind: CombatKind;
  attackerX: number;
  attackerY: number;
  targetX: number;
  targetY: number;
  amount?: number;
}): void {
  const s = getCombatSocket();
  s.emit('combat:hit', { ...params, settlementId: currentSettlementId() });
}

/** Avisa al servidor que una entidad reapareció (restaura su HP a lleno) */
export function reportRespawn(entityId: string, kind: CombatKind): void {
  const s = getCombatSocket();
  s.emit('player:respawn', { entityId, kind, settlementId: currentSettlementId() });
}
