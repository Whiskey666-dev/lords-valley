export class Needs {
    public hambre: number = 0;
    public sed: number = 0;
    public sueno: number = 0;

    constructor() {
        this.hambre = Math.floor(Math.random() * 20);
        this.sed = Math.floor(Math.random() * 20);
        this.sueno = Math.floor(Math.random() * 20);
    }

    // Esta función se llamará mediante un temporizador lento (cada x segundos)
    simularNecesidades() {
        this.hambre = Math.min(100, this.hambre + 0.1);
        this.sed = Math.min(100, this.sed + 0.2);
    }
}
