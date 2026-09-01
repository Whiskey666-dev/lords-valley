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
