/**
 * playerInventoryStore.ts - Caché local del inventario (solo lectura).
 * La única fuente de verdad es el backend (GET/POST /player/me/inventory/* con JWT).
 * Editar localStorage o el DOM desde la consola del navegador no tiene efecto:
 * todo cambio se valida y aplica en el servidor.
 */
import { apiMessage, fetchMyInventory, type InventoryStackDto } from "../../app/api/player.api";
import { addMyItem, removeMyStack, applyItemUse } from "../../app/api/player.api";
import type { PlayerInventoryItem } from "../../items/Item";
import { getTrainingScrollName } from "../../items/TrainingScrolls";
import type { SkillCategoryId } from "../skills/skillsData";

export const PLAYER_INVENTORY_EVENT = "player-inventory-changed";

let cache: PlayerInventoryItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function toItem(s: InventoryStackDto): PlayerInventoryItem {
  return {
    id: s.id,
    nombre: s.nombre,
    categoria: s.categoria as PlayerInventoryItem["categoria"],
    cantidad: s.cantidad,
    maxStack: s.maxStack,
    stackable: s.stackable,
    ...(s.icono ? { icono: s.icono } : {}),
    ...(s.descripcion ? { descripcion: s.descripcion } : {}),
  };
}

function notify() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignora listener roto
    }
  }
  window.dispatchEvent(new CustomEvent(PLAYER_INVENTORY_EVENT));
}

function replace(stacks: InventoryStackDto[]) {
  cache = stacks.map(toItem);
  loaded = true;
  notify();
}

export function getPlayerInventory(): PlayerInventoryItem[] {
  return cache.map((it) => ({ ...it }));
}

export function isInventoryLoaded(): boolean {
  return loaded;
}

export function subscribePlayerInventory(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Caché para respuestas que ya traen inventario (train/use). */
export function setInventoryCache(stacks: InventoryStackDto[]) {
  replace(stacks);
}

export async function refreshPlayerInventory(): Promise<string | null> {
  try {
    replace(await fetchMyInventory());
    return null;
  } catch (e) {
    return apiMessage(e);
  }
}

export interface RemoteResult {
  ok: boolean;
  message: string;
}

export async function addItemRemote(input: {
  nombre?: string;
  escuela?: string;
  cantidad: number;
}): Promise<RemoteResult> {
  try {
    replace(await addMyItem(input));
    return { ok: true, message: "Añadido al inventario." };
  } catch (e) {
    return { ok: false, message: apiMessage(e) };
  }
}

export async function activateItemRemote(
  id: string,
): Promise<RemoteResult & { xp?: number; escuela?: string | null }> {
  try {
    const res = await applyItemUse(id);
    replace(res.inventory);
    if (res.escuela) {
      return { ok: true, message: `📜 +${res.xp} XP en esa escuela.`, xp: res.xp, escuela: res.escuela };
    }
    return { ok: true, message: "Usaste 1 unidad." };
  } catch (e) {
    return { ok: false, message: apiMessage(e) };
  }
}

export async function removeItemRemote(id: string): Promise<RemoteResult> {
  try {
    replace(await removeMyStack(id));
    return { ok: true, message: "Eliminado del inventario." };
  } catch (e) {
    return { ok: false, message: apiMessage(e) };
  }
}

export function countPlayerItemByName(nombre: string): number {
  return cache.reduce((acc, it) => (it.nombre === nombre ? acc + it.cantidad : acc), 0);
}

export function countTrainingScrolls(school: SkillCategoryId): number {
  return countPlayerItemByName(getTrainingScrollName(school));
}
