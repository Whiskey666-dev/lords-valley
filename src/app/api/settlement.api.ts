import { api } from './client';

export interface SettlementDto {
  id: string;
  name: string;
  tier: string;
  ownerId: string;
  lvyBalance: string;
  maxLvyStorage: string;
  gameTime: number;
  currentDay: number;
  currentMonth: number;
  currentYear: number;
  season: string;
  weather: string;
  survivors: any[];
  buildings: any[];
  inventory: any[];
  historyLog: any[];
}

export async function fetchSettlement(id: string): Promise<SettlementDto> {
  const { data } = await api.get<SettlementDto>(`/settlements/${id}`);
  return data;
}

export async function fetchSettlementsByOwner(ownerId: string): Promise<SettlementDto[]> {
  const { data } = await api.get<SettlementDto[]>(`/settlements/owner/${ownerId}`);
  return data;
}

export async function createSettlement(payload: { name: string; ownerId: string; tier?: string }) {
  const { data } = await api.post('/settlements', payload);
  return data;
}

export async function patchPriorities(id: string, priorities: { foodPriority: number; defensePriority: number; productionPriority: number }) {
  const { data } = await api.patch(`/settlements/${id}/priorities`, priorities);
  return data;
}

export async function fetchChunk(x: number, y: number, signal?: AbortSignal) {
  const { data } = await api.get(`/map/chunks`, { params: { x, y }, signal, timeout: 5000 });
  return data;
}

export async function fetchChunksBulk(chunks: { x: number; y: number }[]) {
  if (chunks.length === 0) return [];
  if (chunks.length === 1) return [await fetchChunk(chunks[0].x, chunks[0].y)];
  const { data } = await api.post(`/map/chunks/generate`, { chunks: chunks.map(c => ({ chunkX: c.x, chunkY: c.y })) }, { timeout: 12000 });
  return data;
}
