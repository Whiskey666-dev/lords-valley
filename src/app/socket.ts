import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const url = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:3000/game';
  socket = io(url, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('[socket] connected', socket!.id));
  socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason));
  socket.on('connect_error', (err) => console.warn('[socket] connect_error', err.message));

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
