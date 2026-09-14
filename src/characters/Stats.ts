/**
 * Stats.ts - Stats canónicas de humanos (player y supervivientes).
 * Valores sincronizados con el servidor (`COMBAT_STATS` en CombatService):
 * 200 salud / 50 energía. Las barras UI muestran el porcentaje sobre estos máximos.
 */
export class Stats {
    public maxSalud: number;
    public salud: number;
    public maxEnergia: number;
    public energia: number;

    constructor() {
        this.maxSalud = 200;
        this.salud = this.maxSalud;
        this.maxEnergia = 50;
        this.energia = this.maxEnergia;
    }

    // El cálculo se ejecuta solo cuando recibe un golpe, no en cada frame
    recibirDano(cantidad: number) {
        this.salud = Math.max(0, this.salud - cantidad);
    }
}
