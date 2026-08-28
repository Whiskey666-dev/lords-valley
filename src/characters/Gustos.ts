/**
 * Gustos.ts - Gustos y preferencias aleatorias para NPCs humanos.
 * Usado para simulación social y diálogos futuros.
 */

export const GUSTOS_COMIDA = ["Carne", "Pan", "Frutas", "Pescado", "Guiso"];
export const GUSTOS_ACTIVIDAD = ["Cazar", "Pescar", "Construir", "Explorar", "Descansar", "Socializar"];
export const GUSTOS_CLIMA = ["Soleado", "Lluvioso", "Nevado", "Templado"];

export class Gustos {
  public comidaFavorita: string;
  public actividadFavorita: string;
  public climaFavorito: string;
  public desagrado: string;

  constructor() {
    this.comidaFavorita = GUSTOS_COMIDA[Math.floor(Math.random() * GUSTOS_COMIDA.length)];
    this.actividadFavorita = GUSTOS_ACTIVIDAD[Math.floor(Math.random() * GUSTOS_ACTIVIDAD.length)];
    this.climaFavorito = GUSTOS_CLIMA[Math.floor(Math.random() * GUSTOS_CLIMA.length)];
    // Desagrado aleatorio distinto a favorito
    const actividadesFiltradas = GUSTOS_ACTIVIDAD.filter(a => a !== this.actividadFavorita);
    this.desagrado = actividadesFiltradas[Math.floor(Math.random() * actividadesFiltradas.length)];
  }

  get resumen(): string {
    return `${this.comidaFavorita}, ${this.actividadFavorita}`;
  }
}
