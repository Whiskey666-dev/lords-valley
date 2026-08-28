/**
 * Skills.ts - Habilidades aleatorias para NPCs humanos.
 * Cada NPC recibe niveles 1-10 en varias habilidades, escalable para sistema de trabajos.
 */

export type SkillName = "combate" | "construccion" | "agricultura" | "mineria" | "carpinteria" | "medicina" | "liderazgo" | "supervivencia";

export const SKILL_NAMES: SkillName[] = ["combate", "construccion", "agricultura", "mineria", "carpinteria", "medicina", "liderazgo", "supervivencia"];

export class Skills {
  public niveles: Record<SkillName, number>;
  public especialidad: SkillName;

  constructor() {
    this.niveles = {} as Record<SkillName, number>;
    for (const skill of SKILL_NAMES) {
      // Nivel 1-10, distribución con media 4-6
      this.niveles[skill] = Math.max(1, Math.min(10, Math.floor(Math.random() * 6) + Math.floor(Math.random() * 5) + 1));
    }
    // Especialidad = habilidad más alta
    this.especialidad = [...SKILL_NAMES].sort((a, b) => this.niveles[b] - this.niveles[a])[0];
  }

  get(skill: SkillName): number {
    return this.niveles[skill];
  }

  get resumen(): string {
    return `${this.especialidad} Lv${this.niveles[this.especialidad]}`;
  }
}
