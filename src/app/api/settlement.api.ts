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

export async function fetchChunk(x: number, y: number) {
  const { data } = await api.get(`/map/chunks`, { params: { x, y } });
  return data;
}
