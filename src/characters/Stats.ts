export class Stats {
    public maxSalud: number;
    public salud: number;
    public energia: number;

    constructor() {
        this.maxSalud = Math.floor(Math.random() * 41) + 80; // 80..120
        this.salud = this.maxSalud;
        this.energia = Math.floor(Math.random() * 31) + 70; // 70..100
    }

    // El cálculo se ejecuta solo cuando recibe un golpe, no en cada frame
    recibirDano(cantidad: number) {
        this.salud = Math.max(0, this.salud - cantidad);
    }
}
