/**
 * Item.ts - Definición base de items y categorías para el inventario del jugador.
 * Categorías pedidas: Armas, Equipo, Consumibles Magicos, Consumibles Comunes,
 * Comida y Bebida, Recurso Refinado, Recursos en Bruto, Utiles, Crias, Documentos.
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

// Cantidad máxima acumulable para items stackeables
export const MAX_STACK = 10;

// Categorías acumulables (hasta MAX_STACK). El resto no acumula (cantidad 1).
export const STACKABLE_CATEGORIES: ItemCategory[] = [
  "Consumibles Magicos",
  "Consumibles Comunes",
  "Comida y Bebida",
  "Recurso Refinado",
  "Recursos en Bruto",
  "Documentos",
];

export function isStackable(categoria: ItemCategory): boolean {
  return STACKABLE_CATEGORIES.includes(categoria);
}

export function maxStackFor(categoria: ItemCategory): number {
  return isStackable(categoria) ? MAX_STACK : 1;
}

// Pools de ejemplo por categoría para mock del inventario inicial
export const ITEM_POOLS: Record<ItemCategory, string[]> = {
  "Armas": ["Espada Corta", "Arco de Caza", "Daga", "Lanza", "Maza", "Hacha de Guerra"],
  "Equipo": ["Túnica", "Cota de Malla", "Botas de Cuero", "Guantes", "Casco", "Capa"],
  "Consumibles Magicos": ["Poción de Vida", "Poción de Maná", "Elixir de Fuerza", "Pergamino de Fuego"],
  "Consumibles Comunes": ["Venda", "Antídoto", "Tónico", "Ungüento"],
  "Comida y Bebida": ["Pan", "Carne Seca", "Manzana", "Queso", "Pescado", "Cerveza", "Agua"],
  "Recurso Refinado": ["Lingote de Hierro", "Tablón de Madera", "Tela Fina", "Cuero Curtido"],
  "Recursos en Bruto": ["Madera", "Piedra", "Hierro", "Hierba", "Tela", "Cuero"],
  "Utiles": ["Hacha", "Pico", "Martillo", "Cuchillo", "Pala", "Sierra"],
  "Crias": ["Polluelo", "Cordero", "Ternero", "Cerdito", "Potrillo"],
  "Documentos": ["Mapa Antiguo", "Carta", "Contrato", "Diario", "Plano"],
};

export function createMockPlayerInventory(): PlayerInventoryItem[] {
  const items: PlayerInventoryItem[] = [];
  const makeCantidad = (categoria: ItemCategory) =>
    isStackable(categoria) ? Math.floor(Math.random() * MAX_STACK) + 1 : 1;
  for (const cat of ALL_ITEM_CATEGORIES) {
    const pool = ITEM_POOLS[cat];
    // 0-3 items por categoría para tener inventario variado sin saturar
    const count = Math.floor(Math.random() * 3); // 0-2
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      let nombre: string;
      let tries = 0;
      do {
        nombre = pool[Math.floor(Math.random() * pool.length)];
        tries++;
      } while (used.has(nombre) && tries < 10);
      used.add(nombre);
      items.push({
        id: `pl_${cat.slice(0, 3).toLowerCase()}_${Math.random().toString(36).slice(2, 6)}`,
        nombre,
        categoria: cat,
        cantidad: makeCantidad(cat),
        maxStack: maxStackFor(cat),
        stackable: isStackable(cat),
      });
    }
  }
  // Asegurar al menos 8-12 items totales para que el filtro se vea útil
  while (items.length < 10) {
    const cat = ALL_ITEM_CATEGORIES[Math.floor(Math.random() * ALL_ITEM_CATEGORIES.length)];
    const pool = ITEM_POOLS[cat];
    const nombre = pool[Math.floor(Math.random() * pool.length)];
    if (!items.some(it => it.nombre === nombre)) {
      items.push({
        id: `pl_${Math.random().toString(36).slice(2, 6)}`,
        nombre,
        categoria: cat,
        cantidad: makeCantidad(cat),
        maxStack: maxStackFor(cat),
        stackable: isStackable(cat),
      });
    }
  }
  return items;
}
