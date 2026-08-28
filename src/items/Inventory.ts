/**
 * Inventory.ts - Inventario modular para humanos.
 * Cada NPC/Player tiene inventario aleatorio, escalable para sistema de recursos.
 */

export interface InventoryItem {
  id: string;
  nombre: string;
  cantidad: number;
  categoria: "recurso" | "comida" | "herramienta" | "arma";
}

const RECURSOS = ["Madera", "Piedra", "Hierba", "Cuero", "Tela"];
const COMIDAS = ["Pan", "Carne Seca", "Manzana", "Queso", "Pescado"];
const HERRAMIENTAS = ["Hacha", "Pico", "Martillo", "Cuchillo"];

export class Inventory {
  public items: InventoryItem[] = [];
  public capacidad: number = 20;

  constructor() {
    // 2-5 items aleatorios
    const count = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < count; i++) {
      const pool = Math.random() < 0.5 ? RECURSOS : Math.random() < 0.5 ? COMIDAS : HERRAMIENTAS;
      const nombre = pool[Math.floor(Math.random() * pool.length)];
      const categoria = RECURSOS.includes(nombre) ? "recurso" : COMIDAS.includes(nombre) ? "comida" : "herramienta";
      const cantidad = Math.floor(Math.random() * 8) + 1;
      // Evitar duplicados combinando
      const existing = this.items.find(it => it.nombre === nombre);
      if (existing) existing.cantidad += cantidad;
      else this.items.push({ id: `it_${Math.random().toString(36).slice(2, 6)}`, nombre, cantidad, categoria });
    }
  }

  getResumen(): string[] {
    return this.items.map(it => `${it.nombre} x${it.cantidad}`);
  }
}
