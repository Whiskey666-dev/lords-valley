/**
 * Item.ts - Tipos base del inventario del jugador.
 * El catálogo y las reglas de validación viven en el backend
 * (módulo player): el servidor es la única fuente de verdad.
 */

export type ItemCategory =
  | "Armas"
  | "Equipo"
  | "Consumibles Magicos"
  | "Consumibles Comunes"
  | "Comida y Bebida"
  | "Recurso Refinado"
  | "Recursos en Bruto"
  | "Utiles"
  | "Crias"
  | "Documentos";

export const ALL_ITEM_CATEGORIES: ItemCategory[] = [
  "Armas",
  "Equipo",
  "Consumibles Magicos",
  "Consumibles Comunes",
  "Comida y Bebida",
  "Recurso Refinado",
  "Recursos en Bruto",
  "Utiles",
  "Crias",
  "Documentos",
];

export interface PlayerInventoryItem {
  id: string;
  nombre: string;
  categoria: ItemCategory;
  cantidad: number;
  maxStack: number;
  stackable: boolean;
  peso?: number;
  descripcion?: string;
  icono?: string;
}
