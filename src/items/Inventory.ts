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
const COMIDAS = ["Pan", "Carne Seca", "Manzana", "Queso", "Pescado", "Odre con Agua", "Odre vacío"];
const HERRAMIENTAS = ["Hacha", "Pico", "Martillo", "Cuchillo"];

export class Inventory {
  public items: InventoryItem[] = [];
  public capacidad: number = 20;

  /** Dotación inicial de supervivencia: 10x Pan + 10x Odre con Agua. */
  public static readonly STARTER_PAN = 10;
  public static readonly STARTER_ODRE_AGUA = 10;

  constructor() {
    // 2-5 items aleatorios
    const count = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < count; i++) {
      const pool = Math.random() < 0.5 ? RECURSOS : Math.random() < 0.5 ? COMIDAS : HERRAMIENTAS;
      const nombre = pool[Math.floor(Math.random() * pool.length)];
      // La dotación de Pan/Odre se fija abajo en 10/10: no generarla aleatoria
      if (nombre === "Pan" || nombre === "Odre con Agua") continue;
      const categoria = RECURSOS.includes(nombre) ? "recurso" : COMIDAS.includes(nombre) ? "comida" : "herramienta";
      const cantidad = Math.floor(Math.random() * 8) + 1;
      // Evitar duplicados combinando
      const existing = this.items.find(it => it.nombre === nombre);
      if (existing) existing.cantidad += cantidad;
      else this.items.push({ id: `it_${Math.random().toString(36).slice(2, 6)}`, nombre, cantidad, categoria });
    }
    // Todo NPC spawnea siempre con 10 Panes y 10 Odres con Agua
    this.ensureStarterFood();
  }

  /** Garantiza la dotación mínima (10 Pan + 10 Odre con Agua), acumulando si ya hay. */
  ensureStarterFood(): void {
    this.setCount("Pan", "comida", Inventory.STARTER_PAN, true);
    this.setCount("Odre con Agua", "comida", Inventory.STARTER_ODRE_AGUA, true);
  }

  /**
   * Fija la cantidad de un item. Con minimum=true solo sube hasta el mínimo
   * (no baja si ya hay más, para no borrar consumo posterior).
   */
  setCount(nombre: string, categoria: InventoryItem["categoria"], cantidad: number, minimum = false): void {
    const existing = this.items.find(it => it.nombre === nombre);
    if (existing) {
      existing.cantidad = minimum ? Math.max(existing.cantidad, cantidad) : cantidad;
      return;
    }
    if (cantidad <= 0 || this.items.length >= this.capacidad) return;
    this.items.push({ id: `it_${Math.random().toString(36).slice(2, 6)}`, nombre, cantidad, categoria });
  }

  getResumen(): string[] {
    return this.items.map(it => `${it.nombre} x${it.cantidad}`);
  }

  /** Unidades totales de un item por nombre exacto (ej: "Pan"). */
  countByName(nombre: string): number {
    return this.items.reduce((acc, it) => (it.nombre === nombre ? acc + it.cantidad : acc), 0);
  }

  /** Consume 1 unidad por nombre exacto. Retorna true si había stock. */
  consumeOne(nombre: string): boolean {
    const it = this.items.find(i => i.nombre === nombre && i.cantidad > 0);
    if (!it) return false;
    it.cantidad -= 1;
    if (it.cantidad <= 0) {
      this.items = this.items.filter(i => i.cantidad > 0);
    }
    return true;
  }

  /** Añade 1 unidad (acumula si ya existe). */
  addOne(nombre: string, categoria: InventoryItem["categoria"] = "comida"): void {
    const existing = this.items.find(it => it.nombre === nombre);
    if (existing) {
      existing.cantidad += 1;
      return;
    }
    if (this.items.length >= this.capacidad) return;
    this.items.push({ id: `it_${Math.random().toString(36).slice(2, 6)}`, nombre, cantidad: 1, categoria });
  }
}
