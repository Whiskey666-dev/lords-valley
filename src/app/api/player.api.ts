import { api } from './client';

export interface PlayerDto {
  id: string;
  email: string;
  username: string;
  settings: unknown;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPlayer(id: string): Promise<PlayerDto> {
  const { data } = await api.get<PlayerDto>(`/auth/player/${id}`);
  return data;
}

export async function savePlayerPos(id: string, pos: { x: number; y: number }) {
  const { data } = await api.patch(`/auth/player/${id}/pos`, pos);
  return data;
}
