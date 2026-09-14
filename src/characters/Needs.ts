/**
 * Needs.ts - Necesidades de hambre/sed (0 = saciado, 100 = hambriento/sediento).
 * El BACKEND es la autoridad (player: /player/me/needs con decaimiento por
 * tiempo real; NPCs: SimulationEngine del core). Esta clase es predicción
 * local / interpolación visual para que las nubes flotantes y el auto-consumo
 * respondan cada frame sin esperar a la red.
 *
 * Saciedad: 20% dura 1h -> 100% dura 5h (0->100 en 5h = 20/hora).
 */
export const NEEDS_MAX = 100;
/** Puntos por segundo: 20/hora = 1 cada 180s. */
export const NEEDS_POINTS_PER_SECOND = 20 / 3600;
/** A partir de aquí se muestra la nube flotante (aviso visible). */
export const NEEDS_WARN_THRESHOLD = 60;
/** A partir de aquí los NPC comen/beben solos si tienen en su inventario. */
export const NEEDS_AUTO_EAT_THRESHOLD = 40;
/** Saciedad por defecto (los items reales la heredan de Consumables.ts). */
export const HUNGER_DEFAULT = 20;
export const THIRST_DEFAULT = 20;
export const HUNGER_PER_PAN = HUNGER_DEFAULT;
export const THIRST_PER_ODRE = THIRST_DEFAULT;

export class Needs {
    public hambre: number = 0;
    public sed: number = 0;
    public sueno: number = 0;

    constructor(initial?: { hambre?: number; sed?: number; sueno?: number }) {
        if (initial) {
            this.hambre = clampNeed(initial.hambre ?? 0);
            this.sed = clampNeed(initial.sed ?? 0);
            this.sueno = clampNeed(initial.sueno ?? 0);
        } else {
            // Fallback para testing local offline
            this.hambre = Math.floor(Math.random() * 20);
            this.sed = Math.floor(Math.random() * 20);
            this.sueno = Math.floor(Math.random() * 20);
        }
    }

    /**
     * Avance de necesidades por tiempo de juego (predicción local).
     * @param dtSeconds segundos transcurridos (default 1s). GodMode la congela (no llamar).
     */
    tick(dtSeconds = 1): void {
        if (!(dtSeconds > 0)) return;
        const inc = dtSeconds * NEEDS_POINTS_PER_SECOND;
        this.hambre = Math.min(NEEDS_MAX, this.hambre + inc);
        this.sed = Math.min(NEEDS_MAX, this.sed + inc);
    }

    /**
     * Simulación de necesidades en el cliente (client-side prediction / interpolación visual).
     * NOTA: El servidor de Lords Valley mantiene la autoridad de los stats del settlement y NPCs.
     * @param dtSeconds segundos a simular (default 1s para compatibilidad con llamadas sin args).
     */
    simularNecesidades(dtSeconds = 1): void {
        this.tick(dtSeconds);
    }

    /** Sacia hambre en N puntos (hereda el amount del efecto del item). */
    comerPan(cantidad = HUNGER_DEFAULT): void {
        this.hambre = Math.max(0, this.hambre - cantidad);
    }

    /** Sacia sed en N puntos (hereda el amount del efecto del item). */
    beberOdre(cantidad = THIRST_DEFAULT): void {
        this.sed = Math.max(0, this.sed - cantidad);
    }

    /** Sincroniza con los valores autoritativos del servidor (sin interpolar). */
    syncFromServer(hambre: number, sed: number, sueno?: number): void {
        if (typeof hambre === "number" && Number.isFinite(hambre)) this.hambre = clampNeed(hambre);
        if (typeof sed === "number" && Number.isFinite(sed)) this.sed = clampNeed(sed);
        if (typeof sueno === "number" && Number.isFinite(sueno)) this.sueno = clampNeed(sueno);
    }

    get tieneHambre(): boolean {
        return this.hambre >= NEEDS_WARN_THRESHOLD;
    }

    get tieneSed(): boolean {
        return this.sed >= NEEDS_WARN_THRESHOLD;
    }

    get necesitaComer(): boolean {
        return this.hambre >= NEEDS_AUTO_EAT_THRESHOLD;
    }

    get necesitaBeber(): boolean {
        return this.sed >= NEEDS_AUTO_EAT_THRESHOLD;
    }
}

function clampNeed(v: number): number {
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(NEEDS_MAX, v));
}
