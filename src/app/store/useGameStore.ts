import { create } from 'zustand';
import { getSocket, joinSettlement } from '../socket';
import { fetchSettlement, fetchChunk } from '../api/settlement.api';

interface GameState {
  settlement: any | null;
  survivors: any[];
  buildings: any[];
  inventory: any[];
  historyLog: any[];
  chunks: Map<string, any>;
  selectedId: string | null;
  selectedBuildingId: string | null;
  zoom: number;
  loading: boolean;
  error: string | null;
  lastReceivedSequenceNumber: number;

  fetchSettlement: (id: string) => Promise<void>;
  patchSurvivor: (id: string, patch: any) => void;
  selectSurvivor: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  clearSelection: () => void;
  setZoom: (z: number) => void;
  getChunk: (x: number, y: number) => Promise<any>;
  setChunk: (c: any) => void;
  getLvyDisplay: () => string;
  resetState: () => void;
}

const chunkKey = (x: number, y: number) => `${x}:${y}`;
const pendingChunks = new Map<string, Promise<any>>();
let lastJoinedId: string | null = null;

export const useGameStore = create<GameState>((set, get) => ({
  settlement: null,
  survivors: [],
  buildings: [],
  inventory: [],
  historyLog: [],
  chunks: new Map(),
  selectedId: null,
  selectedBuildingId: null,
  zoom: 50,
  loading: false,
  error: null,
  lastReceivedSequenceNumber: 0,

  fetchSettlement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await fetchSettlement(id);
      set({
        settlement: data,
        survivors: data.survivors ?? [],
        buildings: data.buildings ?? [],
        inventory: data.inventory ?? [],
        historyLog: data.historyLog ?? [],
        loading: false,
      });
      if (lastJoinedId !== id) {
        lastJoinedId = id;
        joinSettlement(id);
      }

      const socket = getSocket();
      socket.off('SURVIVOR_LOYALTY_CHANGED');
      socket.off('SETTLEMENT_TICK_COMPLETED');
      socket.off('RESOURCE_EXTRACTED');

      socket.on('SURVIVOR_LOYALTY_CHANGED', (payload: any) => {
        // Refinement D: Verificar secuencia antes de aplicar delta
        const expectedSeq = get().lastReceivedSequenceNumber + 1;
        if (payload?.sequenceNumber !== expectedSeq) {
          console.warn('[store] SURVIVOR_LOYALTY_CHANGED secuencia inesperada:', payload?.sequenceNumber, 'esperada:', expectedSeq);
          get().resetState();
          return;
        }
        // Actualizar último número de secuencia recibido
        set({ lastReceivedSequenceNumber: payload.sequenceNumber });
        get().patchSurvivor(payload.survivorId, { loyalty: payload.loyalty, isLoyalAbsolute: payload.isLoyalAbsolute });
      });
      socket.on('SETTLEMENT_TICK_COMPLETED', (payload: any) => {
        // Refinement D: Verificar secuencia antes de aplicar delta
        const expectedSeq = get().lastReceivedSequenceNumber + 1;
        if (payload?.sequenceNumber !== expectedSeq) {
          console.warn('[store] SETTLEMENT_TICK_COMPLETED secuencia inesperada:', payload?.sequenceNumber, 'esperada:', expectedSeq);
          get().resetState();
          return;
        }
        set({ lastReceivedSequenceNumber: payload.sequenceNumber });
        if (payload.settlementId !== id) return;
        // Optionally refetch or patch gameTime
        set((s) => s.settlement ? { settlement: { ...s.settlement, gameTime: payload.gameTime } } as any : {});
      });
      socket.on('RESOURCE_EXTRACTED', (payload: any) => {
        // Refinement D: Verificar secuencia antes de aplicar delta
        const expectedSeq = get().lastReceivedSequenceNumber + 1;
        if (payload?.sequenceNumber !== expectedSeq) {
          console.warn('[store] RESOURCE_EXTRACTED secuencia inesperada:', payload?.sequenceNumber, 'esperada:', expectedSeq);
          get().resetState();
          return;
        }
        set({ lastReceivedSequenceNumber: payload.sequenceNumber });
        // Could update inventory string quantity via BigInt math in selector
        console.log('[store] RESOURCE_EXTRACTED', payload);
      });
    } catch (e: any) {
      set({ error: e.message ?? 'fetch failed', loading: false });
    }
  },

  patchSurvivor: (id: string, patch: any) =>
    set((s) => ({
      survivors: s.survivors.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
      settlement: s.settlement ? { ...s.settlement, survivors: s.settlement.survivors.map((sv: any) => (sv.id === id ? { ...sv, ...patch } : sv)) } : null,
    })),

  selectSurvivor: (id: string | null) => set({ selectedId: id, selectedBuildingId: null }),
  selectBuilding: (id: string | null) => set({ selectedBuildingId: id, selectedId: null }),
  clearSelection: () => set({ selectedId: null, selectedBuildingId: null }),

  setZoom: (z: number) => set({ zoom: Math.max(0, Math.min(100, Math.round(z))) }),

  getChunk: async (x: number, y: number) => {
    const key = chunkKey(x, y);
    const existing = get().chunks.get(key);
    if (existing) return existing;
    const pending = pendingChunks.get(key);
    if (pending) return pending;
    const promise = fetchChunk(x, y).then((chunk) => {
      get().setChunk(chunk);
      pendingChunks.delete(key);
      return chunk;
    }).catch((e) => { pendingChunks.delete(key); throw e; });
    pendingChunks.set(key, promise);
    return promise;
  },

  setChunk: (c: any) =>
    set((s) => {
      const next = new Map(s.chunks);
      next.set(chunkKey(c.chunkX, c.chunkY), c);
      return { chunks: next };
    }),

  getLvyDisplay: () => {
    const s = get().settlement;
    if (!s) return '0';
    // Keep raw string, format with decimals trimming (18 decimals)
    const raw: string = s.lvyBalance ?? '0';
    try {
      const bi = BigInt(raw);
      const whole = bi / BigInt(1e18);
      return whole.toString(); // display whole coins, keep string intact in store
    } catch {
      return raw;
    }
  },

  // Refinement D: Acción para restablecer el estado completo del settlement
  resetState: () => set({ settlement: null, survivors: [], buildings: [], inventory: [], historyLog: [], chunks: new Map(), lastReceivedSequenceNumber: 0 }),
}));