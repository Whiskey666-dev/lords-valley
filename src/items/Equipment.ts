/**
 * Equipment.ts - Equipamiento modular para humanos.
 * Slots simples, escalable para sistema de combate/producción.
 */

export interface EquipmentSlot {
  arma?: string;
  armadura?: string;
  herramienta?: string;
  accesorio?: string;
}

const ARMAS = ["Daga", "Espada Corta", "Arco", "Hacha de Mano", "Lanza"];
const ARMADURAS = ["Túnica", "Chaqueta de Cuero", "Cota de Malla", "Armadura Ligera"];
const HERRAMIENTAS = ["Hacha", "Pico", "Azada", "Sierra"];

export class Equipment {
  public arma: string | null;
  public armadura: string | null;
  public herramienta: string | null;

  constructor() {
    // 70% probabilidad de tener cada slot
    this.arma = Math.random() < 0.7 ? ARMAS[Math.floor(Math.random() * ARMAS.length)] : null;
    this.armadura = Math.random() < 0.6 ? ARMADURAS[Math.floor(Math.random() * ARMADURAS.length)] : null;
    this.herramienta = Math.random() < 0.8 ? HERRAMIENTAS[Math.floor(Math.random() * HERRAMIENTAS.length)] : null;
  }

  getResumen(): string[] {
    const res: string[] = [];
    if (this.arma) res.push(`Arma: ${this.arma}`);
    if (this.armadura) res.push(`Armadura: ${this.armadura}`);
    if (this.herramienta) res.push(`Herramienta: ${this.herramienta}`);
    if (res.length === 0) res.push("Sin equipamiento");
    return res;
  }
}
