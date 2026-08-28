import Phaser from "phaser";

// --- Walk (6 direcciones reales) ---
import walkDown from "../../assets/sprites/player/Walk/walk_Down.png";
import walkUp from "../../assets/sprites/player/Walk/walk_Up.png";
import walkRightDown from "../../assets/sprites/player/Walk/walk_Right_Down.png";
import walkRightUp from "../../assets/sprites/player/Walk/walk_Right_Up.png";
import walkLeftDown from "../../assets/sprites/player/Walk/walk_Left_Down.png";
import walkLeftUp from "../../assets/sprites/player/Walk/walk_Left_Up.png";

// --- Idle (6 direcciones reales) ---
import idleDown from "../../assets/sprites/player/Idle/Idle_Down.png";
import idleUp from "../../assets/sprites/player/Idle/Idle_Up.png";
import idleRightDown from "../../assets/sprites/player/Idle/Idle_Right_Down.png";
import idleRightUp from "../../assets/sprites/player/Idle/Idle_Right_Up.png";
import idleLeftDown from "../../assets/sprites/player/Idle/Idle_Left_Down.png";
import idleLeftUp from "../../assets/sprites/player/Idle/Idle_Left_Up.png";

// --- Dash (usado como ataque/dash, 6 direcciones) ---
import dashDown from "../../assets/sprites/player/Dash/Dash_Down.png";
import dashUp from "../../assets/sprites/player/Dash/Dash_Up.png";
import dashRightDown from "../../assets/sprites/player/Dash/Dash_Right_Down.png";
import dashRightUp from "../../assets/sprites/player/Dash/Dash_Right_Up.png";
import dashLeftDown from "../../assets/sprites/player/Dash/Dash_Left_Down.png";
import dashLeftUp from "../../assets/sprites/player/Dash/Dash_Left_Up.png";

// --- Death (6 direcciones) ---
import deathDown from "../../assets/sprites/player/Death/death_Down.png";
import deathUp from "../../assets/sprites/player/Death/death_Up.png";
import deathRightDown from "../../assets/sprites/player/Death/death_Right_Down.png";
import deathRightUp from "../../assets/sprites/player/Death/death_Right_Up.png";
import deathLeftDown from "../../assets/sprites/player/Death/death_Left_Down.png";
import deathLeftUp from "../../assets/sprites/player/Death/death_Left_Up.png";

// --- Jump (6 direcciones reales) ---
import jumpDown from "../../assets/sprites/player/Jump - NEW/Normal/Jump_Down.png";
import jumpUp from "../../assets/sprites/player/Jump - NEW/Normal/Jump_up.png";
import jumpRightDown from "../../assets/sprites/player/Jump - NEW/Normal/Jump_Right_Down.png";
import jumpRightUp from "../../assets/sprites/player/Jump - NEW/Normal/Jump_Right_Up.png";
import jumpLeftDown from "../../assets/sprites/player/Jump - NEW/Normal/Jump_Left_Down.png";
import jumpLeftUp from "../../assets/sprites/player/Jump - NEW/Normal/Jump_Left_Up.png";

export class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    // Documentación oficial: frame dimensions.png = 48 x 64 px (384x64 = 8 frames de 48x64 por tira)
    const FRAME_W = 48;
    const FRAME_H = 64;

    // Walk
    this.load.spritesheet("player_walk_down", walkDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_walk_up", walkUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_walk_right_down", walkRightDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_walk_right_up", walkRightUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_walk_left_down", walkLeftDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_walk_left_up", walkLeftUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // Idle
    this.load.spritesheet("player_idle_down", idleDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_idle_up", idleUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_idle_right_down", idleRightDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_idle_right_up", idleRightUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_idle_left_down", idleLeftDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_idle_left_up", idleLeftUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // Dash (para ataque / esquive)
    this.load.spritesheet("player_dash_down", dashDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_dash_up", dashUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_dash_right_down", dashRightDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_dash_right_up", dashRightUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_dash_left_down", dashLeftDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_dash_left_up", dashLeftUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // Death
    this.load.spritesheet("player_death_down", deathDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_death_up", deathUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_death_right_down", deathRightDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_death_right_up", deathRightUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_death_left_down", deathLeftDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_death_left_up", deathLeftUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // Jump (48x64, 8 frames)
    this.load.spritesheet("player_jump_down", jumpDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_jump_up", jumpUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_jump_right_down", jumpRightDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_jump_right_up", jumpRightUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_jump_left_down", jumpLeftDown, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet("player_jump_left_up", jumpLeftUp, { frameWidth: FRAME_W, frameHeight: FRAME_H });

    // Texto de carga
    this.add.text(16, 16, "Cargando Lords Valley...", { color: "#ffffff" });
  }

  create() {
    this.scene.start("MainScene");
  }
}
