export class Needs {
    public hambre: number = 0;
    public sed: number = 0;
    public sueno: number = 0;

    constructor(initial?: { hambre?: number; sed?: number; sueno?: number }) {
        if (initial) {
            this.hambre = initial.hambre ?? 0;
            this.sed = initial.sed ?? 0;
            this.sueno = initial.sueno ?? 0;
        } else {
            // Fallback para testing local offline
            this.hambre = Math.floor(Math.random() * 20);
            this.sed = Math.floor(Math.random() * 20);
            this.sueno = Math.floor(Math.random() * 20);
        }
    }

    /**
     * Simulación de necesidades en el cliente (client-side prediction / interpolación visual).
     * NOTA: El servidor de Lords Valley mantiene la autoridad de los stats del settlement y NPCs.
     */
    simularNecesidades() {
        this.hambre = Math.min(100, this.hambre + 0.1);
        this.sed = Math.min(100, this.sed + 0.2);
    }
}

