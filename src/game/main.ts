import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { Preloader } from './scenes/Preloader';


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // Vinculado al contenedor HTML que usaremos en React
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            // Modular: solo línea de velocidad (verde), sin cuadrado de cuerpo
            debugShowBody: false,
            debugShowStaticBody: false,
            debugShowVelocity: true,
            debugVelocityColor: 0x00ff00,
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [Preloader, MainScene]
};

export const startLaunchGame = () => {
    return new Phaser.Game(config);
};
