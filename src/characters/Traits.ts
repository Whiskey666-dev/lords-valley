/**
 * Traits.ts - Rasgos aleatorios para NPCs humanos.
 * Modular y escalable: cada NPC recibe 1-3 rasgos aleatorios.
 */

export const TRAITS_POOL = [
  "Valiente", "Cauteloso", "Trabajador", "Perezoso",
  "Amable", "Arrogante", "Curioso", "Reservado",
  "Leal", "Rebelde", "Optimista", "Pesimista",
  "Disciplinado", "Impulsivo", "Empático", "Frío",
  "Honesto", "Astuto", "Paciente", "Irascible"
] as const;

export type Trait = typeof TRAITS_POOL[number];

export class Traits {
  public lista: Trait[];

  constructor() {
    // 1-3 rasgos aleatorios sin repetir
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...TRAITS_POOL].sort(() => Math.random() - 0.5);
    this.lista = shuffled.slice(0, count);
  }

  has(trait: Trait): boolean {
    return this.lista.includes(trait);
  }

  toString(): string {
    return this.lista.join(", ");
  }
}
