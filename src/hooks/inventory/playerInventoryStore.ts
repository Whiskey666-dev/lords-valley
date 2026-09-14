/**
 * playerInventoryStore.ts - Caché local del inventario (solo lectura).
 * La única fuente de verdad es el backend (GET/POST /player/me/inventory/* con JWT).
 * Editar localStorage o el DOM desde la consola del navegador no tiene efecto:
 * todo cambio se valida y aplica en el servidor.
 */
import { apiMessage, fetchMyInventory, fetchMyNeeds, type InventoryStackDto } from "../../app/api/player.api";
import { addMyItem, removeMyStack, applyItemUse } from "../../app/api/player.api";
import type { PlayerInventoryItem } from "../../items/Item";
import { getTrainingScrollName } from "../../items/TrainingScrolls";
import type { SkillCategoryId } from "../skills/skillsData";

export const PLAYER_INVENTORY_EVENT = "player-inventory-changed";
export const PLAYER_NEEDS_EVENT = "player-needs-changed";

export interface PlayerNeeds {
  hunger: number;
  thirst: number;
}

let needsCache: PlayerNeeds | null = null;
const needsListeners = new Set<(needs: PlayerNeeds) => void>();

function clampPct(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
  return Math.max(0, Math.min(100, n));
}

/** Fuente única local de hambre/sed del player (el servidor es la autoridad). */
export function getPlayerNeedsCache(): PlayerNeeds | null {
  return needsCache ? { ...needsCache } : null;
}

export function subscribePlayerNeeds(fn: (needs: PlayerNeeds) => void): () => void {
  needsListeners.add(fn);
  return () => {
    needsListeners.delete(fn);
  };
}

/** Fija el caché y avisa a Phaser (MainScene) y React (panel del player). */
export function setPlayerNeedsCache(hunger: number, thirst: number): PlayerNeeds {
  needsCache = { hunger: clampPct(hunger), thirst: clampPct(thirst) };
  for (const fn of needsListeners) {
    try {
      fn({ ...needsCache });
    } catch {
      // ignora listener roto
    }
  }
  window.dispatchEvent(new CustomEvent(PLAYER_NEEDS_EVENT, { detail: { ...needsCache } }));
  return { ...needsCache };
}

/**
 * Relee la verdad autoritativa del servidor (GET /player/me/needs) y la
 * publica. Se llama tras cada mutación del inventario para que el panel
 * converja aunque la respuesta del use traiga otro formato.
 */
export async function refreshPlayerNeeds(): Promise<boolean> {
  try {
    const n = await fetchMyNeeds();
    if (typeof n?.hunger === "number" && typeof n?.thirst === "number") {
      setPlayerNeedsCache(n.hunger, n.thirst);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

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
    // El reloj de decaimiento avanzó: relee la verdad del servidor.
    void refreshPlayerNeeds();
    return { ok: true, message: "Añadido al inventario." };
  } catch (e) {
    return { ok: false, message: apiMessage(e) };
  }
}

export async function activateItemRemote(
  id: string,
): Promise<RemoteResult & { xp?: number; escuela?: string | null; needs?: PlayerNeeds }> {
  try {
    const res = await applyItemUse(id);
    replace(res.inventory);
    // 1) Reflejo inmediato con lo que devuelve el use (ya trae needs aplicados).
    const needs = (res as { needs?: { hunger?: number; thirst?: number } }).needs;
    let shown: PlayerNeeds | null = null;
    if (needs && typeof needs.hunger === "number" && typeof needs.thirst === "number") {
      shown = setPlayerNeedsCache(needs.hunger, needs.thirst);
    }
    // 2) Convergencia con la verdad autoritativa (republica y corrige paneles).
    void refreshPlayerNeeds();
    const effect = (res as { effect?: string }).effect;
    // Prueba visible en el mismo menú: saciedad resultante (100 - hambre/sed).
    const needsLine = shown ? `🍖 Saciedad ${100 - shown.hunger}% · 💧 Hidratación ${100 - shown.thirst}%` : null;
    const suffix = [effect ? `(${effect})` : null, needsLine].filter(Boolean).join(" · ");
    if (res.escuela) {
      return {
        ok: true,
        message: `📜 +${res.xp} XP en esa escuela.${suffix ? ` ${suffix}` : ""}`,
        xp: res.xp,
        escuela: res.escuela,
        ...(shown ? { needs: shown } : {}),
      };
    }
    return {
      ok: true,
      message: suffix ? `Usaste 1 unidad ${suffix}.` : "Usaste 1 unidad.",
      ...(shown ? { needs: shown } : {}),
    };
  } catch (e) {
    return { ok: false, message: apiMessage(e) };
  }
}

export async function removeItemRemote(id: string): Promise<RemoteResult> {
  try {
    replace(await removeMyStack(id));
    void refreshPlayerNeeds();
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
