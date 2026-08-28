/**
 * Personality.ts - Personalidad aleatoria para NPCs humanos.
 * Basado en ejes simples, escalable para IA y diálogos.
 */

export const PERSONALITY_ARCHETYPES = [
  "Líder", "Seguidor", "Explorador", "Guardián",
  "Artesano", "Erudito", "Mediador", "Rebelde"
] as const;

export type Archetype = typeof PERSONALITY_ARCHETYPES[number];

export const PERSONALITY_TRAITS = [
  "Extrovertido", "Introvertido",
  "Analítico", "Intuitivo",
  "Pragmático", "Idealista"
] as const;

export class Personality {
  public arquetipo: Archetype;
  public temperamento: string;
  public sociabilidad: number; // 0-100
  public valentia: number; // 0-100
  public empatia: number; // 0-100

  constructor() {
    this.arquetipo = PERSONALITY_ARCHETYPES[Math.floor(Math.random() * PERSONALITY_ARCHETYPES.length)];
    this.temperamento = PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)];
    this.sociabilidad = Math.floor(Math.random() * 101);
    this.valentia = Math.floor(Math.random() * 101);
    this.empatia = Math.floor(Math.random() * 101);
  }

  get resumen(): string {
    return `${this.arquetipo} - ${this.temperamento}`;
  }
}
