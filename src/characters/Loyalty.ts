export class Loyalty {
    public nivel: number;

    constructor() {
        this.nivel = Math.floor(Math.random() * 101); // 0..100
    }

    // Devuelve el string calculado solo cuando la interfaz de React lo solicita
    get estadoPolitico(): string {
        if (this.nivel >= 90) return "Fanático";
        if (this.nivel >= 60) return "Leal";
        if (this.nivel >= 35) return "Inconforme";
        return "Potencial Rebelde";
    }
}
