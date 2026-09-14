/**
 * Consumables.ts - Registro de efectos de saciedad (ESPEJO del backend).
 * La AUTORIDAD es el backend (item-catalog.ts -> CONSUMABLE_EFFECTS):
 * este archivo solo se usa para predicción local (auto-consumo NPC),
 * textos de UI y validación blanda. Nunca decide el estado real.
 *
 * Cómo crear un consumible nuevo que altere hambre/sed (herencia):
 *   1. Backend: añádelo a ITEM_POOLS + CONSUMABLE_EFFECTS (ver item-catalog.ts).
 *   2. Aquí: añade UNA línea con el mismo nombre canónico y efecto.
 * Sin más cambios, lo heredan: el auto-consumo de NPCs (Survivor),
 * el texto de efecto del inventario y las nubes de saciedad.
 * Escala 0 = saciado, 100 = hambriento/sediento. 20% = 1h, 100% = 5h.
 */

export interface ConsumableEffect {
  /** Puntos que reduce el hambre. */
  hunger?: number;
  /** Puntos que reduce la sed. */
  thirst?: number;
  /** Item que aparece al consumirlo (ej: Odre con Agua -> Odre vacío). */
  emptiesTo?: string;
  /** Si true, no se puede consumir directamente (ej: envase vacío). */
  notUsable?: boolean;
  /** Icono para la UI. */
  icon?: string;
}

export const CONSUMABLE_EFFECTS: Record<string, ConsumableEffect> = {
  "Pan": { hunger: 20, icon: "🍞" },
  "Odre con Agua": { thirst: 20, emptiesTo: "Odre vacío", icon: "💧" },
  "Odre vacío": { notUsable: true, icon: "🏺" },
};

/** Alias de consola/formas cortas -> nombre canónico (igual que el backend). */
const CONSUMABLE_ALIASES: Record<string, string> = {
  "odreagua": "Odre con Agua",
  "odredeagua": "Odre con Agua",
  "odreconagua": "Odre con Agua",
  "odre": "Odre vacío",
  "odrevacio": "Odre vacío",
  "pan": "Pan",
};

export function normalizeConsumable(raw: string): string {
  return (raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}

/**
 * Efecto heredable de un item por nombre (alias incluidos).
 * Retorna null si el item no altera saciedad.
 */
export function getConsumableEffect(
  nombre: string,
): { nombre: string; effect: ConsumableEffect } | null {
  const n = normalizeConsumable(nombre);
  if (!n) return null;
  const alias = CONSUMABLE_ALIASES[n];
  const direct = Object.keys(CONSUMABLE_EFFECTS).find(
    (key) => normalizeConsumable(key) === n,
  );
  const canonical = alias ?? direct;
  if (!canonical) return null;
  const effect = CONSUMABLE_EFFECTS[canonical];
  if (!effect) return null;
  return { nombre: canonical, effect };
}

/** Texto del efecto para la UI, derivado del registro. */
export function describeConsumableEffect(nombre: string): string | null {
  const found = getConsumableEffect(nombre);
  if (!found || found.effect.notUsable) return null;
  const parts: string[] = [];
  if (found.effect.hunger) parts.push(`+${found.effect.hunger}% saciedad de hambre`);
  if (found.effect.thirst) parts.push(`+${found.effect.thirst}% saciedad de sed`);
  let msg = parts.join(", ");
  if (found.effect.emptiesTo) msg += ` (deja ${found.effect.emptiesTo})`;
  return msg || null;
}
