import { api } from './client';
import axios from 'axios';

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

export type SchoolId =
  | 'supervivencia'
  | 'produccion'
  | 'politica'
  | 'milicia'
  | 'ciencias'
  | 'artes_misticas';

export interface InventoryStackDto {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  maxStack: number;
  stackable: boolean;
  icono?: string;
  descripcion?: string;
}

export interface SkillStateDto {
  id: string;
  level: number;
  xp: number;
  tier: 1 | 2 | 3;
  unlocked: boolean;
}

export type SkillsStateDto = Record<SchoolId, SkillStateDto[]>;

export interface TrainResponseDto {
  inventory: InventoryStackDto[];
  skills: SkillsStateDto;
  xp: number;
  needs?: PlayerNeedsDto;
  escuela?: SchoolId | null;
  effect?: string;
}

export interface PlayerNeedsDto {
  hunger: number;
  thirst: number;
  updatedAt: number;
}

export function apiMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.length > 0) return msg;
    if (!err.response) return 'Backend no disponible. Revisa tu conexión.';
    return `Error ${err.response.status}`;
  }
  return err instanceof Error ? err.message : 'Error desconocido';
}

export async function fetchMyInventory(): Promise<InventoryStackDto[]> {
  const { data } = await api.get<InventoryStackDto[]>('/player/me/inventory');
  return data;
}

export async function addMyItem(input: {
  nombre?: string;
  escuela?: string;
  cantidad: number;
}): Promise<InventoryStackDto[]> {
  const { data } = await api.post<InventoryStackDto[]>('/player/me/inventory/add', input);
  return data;
}

export async function applyItemUse(stackId: string): Promise<TrainResponseDto & { escuela: SchoolId | null }> {
  const { data } = await api.post('/player/me/inventory/use', { stackId });
  return data;
}

export async function fetchMyNeeds(): Promise<PlayerNeedsDto> {
  const { data } = await api.get<PlayerNeedsDto>('/player/me/needs');
  return data;
}

export async function removeMyStack(stackId: string): Promise<InventoryStackDto[]> {
  const { data } = await api.post<InventoryStackDto[]>('/player/me/inventory/remove', { stackId });
  return data;
}

export async function fetchMySkills(): Promise<SkillsStateDto> {
  const { data } = await api.get<SkillsStateDto>('/player/me/skills');
  return data;
}

export async function trainMySkills(input: {
  escuela: string;
  skillId?: string;
}): Promise<TrainResponseDto> {
  const { data } = await api.post<TrainResponseDto>('/player/me/skills/train', input);
  return data;
}

export interface DevStateDto {
  godMode: boolean;
}

export interface SpawnAllowDto {
  ok: boolean;
  kind: string;
  count: number;
}

export async function fetchMyDev(): Promise<DevStateDto> {
  const { data } = await api.get<DevStateDto>('/player/me/dev');
  return data;
}

export async function setMyGodMode(on: boolean): Promise<DevStateDto> {
  const { data } = await api.post<DevStateDto>('/player/me/dev/godmode', { on });
  return data;
}

export async function grantMyFullMode(): Promise<SkillsStateDto> {
  const { data } = await api.post<SkillsStateDto>('/player/me/dev/fullmode', {});
  return data;
}

/**
 * Puerta del servidor para comandos create/spawn de la consola.
 * Todo comando debe validarse aquí (JWT) antes de emitir el evento a Phaser.
 */
export async function requestSpawnAllow(kind: string, count: number): Promise<SpawnAllowDto> {
  const { data } = await api.post<SpawnAllowDto>('/player/me/dev/spawn-allow', { kind, count });
  return data;
}
