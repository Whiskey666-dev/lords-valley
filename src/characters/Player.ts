import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { BaseHuman } from "./BaseHuman";
import type { Direction8 } from "./Animations";
import * as InputSystem from "../game/systems/InputSystem";
import { isGameInputBlocked } from "../ui/input/KeyBindings";

export class Player extends BaseHuman {
  private isJumping = false;
  private isDashing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle_down", "", "player_");
    this.play("idle_down", true);
    InputSystem.capture(scene);
  }

  private executeJump() {
    if (this.isJumping || this.isDashing || CombatSystem.isAttacking(this)) return;
    this.isJumping = true;
    // No bloquea velocidad: permite desplazarse mientras salta
    this.playJump(this.lastDirection);
    // Efecto visual top-down aumentado para salto más visible
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.12,
      scaleY: 1.12,
      y: this.y - 10,
      duration: 180,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setScale(1);
      }
    });
    this.scene.time.delayedCall(550, () => {
      this.isJumping = false;
      if (this.active) this.playIdle();
    });
  }

  private executeDash() {
    if (this.isDashing || this.isJumping || CombatSystem.isAttacking(this)) return;
    this.isDashing = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.playDash(this.lastDirection);
    // Dash +50% distancia vs ajuste anterior: 500 * 0.225 = 112.5 (antes 75)
    const dashSpeed = 500;
    const dashDuration = 225; // 150ms *1.5 = 225ms
    const dir = this.lastDirection;
    let vx = 0, vy = 0;
    if (dir.includes("up")) vy = -1;
    if (dir.includes("down")) vy = 1;
    if (dir.includes("left")) vx = -1;
    if (dir.includes("right")) vx = 1;
    if (vx === 0 && vy === 0) {
      if (dir === "up") vy = -1;
      if (dir === "down") vy = 1;
      if (dir === "left") vx = -1;
      if (dir === "right") vx = 1;
    }
    body.setVelocity(vx * dashSpeed, vy * dashSpeed);
    this.scene.time.delayedCall(dashDuration, () => {
      this.isDashing = false;
      body.setVelocity(0);
      if (this.active) this.playIdle();
    });
  }

  updateEntity() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = 160;

    // Si chat/consola abierto o rebinding, anula movimiento y animaciones para priorizar escritura
    if (isGameInputBlocked()) {
      body.setVelocity(0);
      if (!this.isDashing && !CombatSystem.isAttacking(this) && !this.isJumping) {
        this.playIdle();
      } else if (this.isJumping) {
        // Durante salto, congela desplazamiento mientras consola abierta
        body.setVelocity(0);
      }
      return;
    }

    if (InputSystem.isJumpJustPressed(this.scene)) {
      this.executeJump();
    }
    if (InputSystem.isDashJustPressed(this.scene)) {
      this.executeDash();
    }
    if (InputSystem.isAttackJustPressed(this.scene)) {
      CombatSystem.executeAttack(this, this.lastDirection, "player_");
    }

    if (this.isDashing || CombatSystem.isAttacking(this)) {
      if (!this.isDashing) body.setVelocity(0);
      return;
    }

    if (this.isJumping) {
      body.setVelocity(0);
      const jumpSpeed = 184;
      const { xDir, yDir } = InputSystem.getMovementVector(this.scene);
      if (xDir !== 0) body.setVelocityX(xDir * jumpSpeed);
      if (yDir !== 0) body.setVelocityY(yDir * jumpSpeed);
      if (body.velocity.x !== 0 && body.velocity.y !== 0) body.velocity.normalize().scale(jumpSpeed);
      const dir = InputSystem.getDirection(this.scene);
      if (dir !== "") this.lastDirection = dir as Direction8;
      return;
    }

    body.setVelocity(0);

    const { xDir, yDir, dir } = InputSystem.getMovementVector(this.scene);
    if (xDir !== 0) body.setVelocityX(xDir * speed);
    if (yDir !== 0) body.setVelocityY(yDir * speed);
    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(speed);
    }

    if (dir !== "") {
      this.playWalk(dir as Direction8);
    } else {
      this.playIdle();
    }
  }
}
