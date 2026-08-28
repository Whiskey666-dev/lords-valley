import Phaser from "phaser";
import type { Direction8 } from "./Animations";

/**
 * BaseHuman.ts - Clase base modular y escalable para cualquier humano (Player, NPC, Enemigo humano).
 * Centraliza física, hitbox, origen y animaciones direccionales.
 * Todos los humanos reutilizan las mismas animaciones via Animations.ts (registerHumanAnimations).
 * Para añadir un nuevo humano: extiende BaseHuman y pasa animPrefix/texturePrefix.
 */

export type HumanBodyConfig = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_HUMAN_BODY: HumanBodyConfig = {
  width: 20,
  height: 20,
  offsetX: 14,
  offsetY: 36,
};

export abstract class BaseHuman extends Phaser.Physics.Arcade.Sprite {
  protected lastDirection: Direction8 = "down";
  protected animPrefix: string; // ej: "" para player ("walk_"/"idle_"), "npc_" para NPC
  protected texturePrefix: string; // ej: "player_", "npc_" (fallback automático)

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    initialTexture: string,
    animPrefix: string = "",
    texturePrefix: string = "player_",
    bodyConfig: HumanBodyConfig = DEFAULT_HUMAN_BODY
  ) {
    super(scene, x, y, initialTexture);
    this.animPrefix = animPrefix;
    this.texturePrefix = texturePrefix;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(bodyConfig.width, bodyConfig.height);
    body.setOffset(bodyConfig.offsetX, bodyConfig.offsetY);
    this.setOrigin(0.5, 0.5);
  }

  /** Traduce xDir/yDir (-1..1) a Direction8 estándar, reutilizable por Player, IA, etc. */
  protected getDirectionFromInput(xDir: number, yDir: number): Direction8 | "" {
    if (xDir === -1 && yDir === 0) return "left";
    if (xDir === 1 && yDir === 0) return "right";
    if (xDir === 0 && yDir === -1) return "up";
    if (xDir === 0 && yDir === 1) return "down";
    if (xDir === -1 && yDir === -1) return "up_left";
    if (xDir === 1 && yDir === -1) return "up_right";
    if (xDir === -1 && yDir === 1) return "down_left";
    if (xDir === 1 && yDir === 1) return "down_right";
    return "";
  }

  /** Helpers modulares para reproducir anims sin reiniciar si ya está activa (evita flicker en reposo) */
  protected playWalk(dir: Direction8) {
    const key = `${this.animPrefix}walk_${dir}`;
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
    this.lastDirection = dir;
  }

  protected playIdle(dir: Direction8 = this.lastDirection) {
    const key = `${this.animPrefix}idle_${dir}`;
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
  }

  protected playJump(dir: Direction8 = this.lastDirection) {
    const key = `${this.animPrefix}jump_${dir}`;
    if (this.anims.currentAnim?.key !== key) {
      if (this.scene.anims.exists(key)) this.play(key, true);
    }
  }

  protected playDash(dir: Direction8 = this.lastDirection) {
    const key = `${this.animPrefix}dash_${dir}`;
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
  }

  protected playDeath(dir: Direction8 = this.lastDirection) {
    const key = `${this.animPrefix}death_${dir}`;
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
  }

  protected playAttack(dir: Direction8 = this.lastDirection) {
    const key = `${this.animPrefix}attack_${dir}`;
    if (this.anims.currentAnim?.key !== key) {
      if (this.scene.anims.exists(key)) this.play(key, true);
    }
  }

  public getLastDirection(): Direction8 {
    return this.lastDirection;
  }

  public setDirection(dir: Direction8) {
    this.lastDirection = dir;
  }

  /** Para NPCs controlados por IA: mover con animación walk/idle/jump/attack */
  public moveInDirection(dir: Direction8) {
    this.playWalk(dir);
  }

  public idle() {
    this.playIdle();
  }

  public jump() {
    this.playJump();
  }

  public dash() {
    this.playDash();
  }

  public attack() {
    this.playAttack();
  }

  public die() {
    this.playDeath();
  }
}
