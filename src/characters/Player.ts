import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { BaseHuman } from "./BaseHuman";
import type { Direction8 } from "./Animations";
import * as InputSystem from "../game/systems/InputSystem";
import { isGameInputBlocked } from "../ui/input/KeyBindings";
import { collisionMatrix } from "../game/world/CollisionMatrix";

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
    this.playJump(this.lastDirection);
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
    const dashSpeed = 520;
    const dashDuration = 200;
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
      if (dir === "right") vy = 1;
    }
    const dashDist = dashSpeed * (dashDuration / 1000);
    const targetX = this.x + vx * dashDist;
    const targetY = this.y + vy * dashDist;
    if (this.isBodyBlockedAt(targetX, targetY)) return;
    this.isDashing = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.playDash(this.lastDirection);
    this.scene.time.delayedCall(dashDuration, () => {
      this.isDashing = false;
      body.setVelocity(0);
      if (this.active) this.playIdle();
    });
  }

  private isBodyBlockedAt(isoX: number, isoY: number): boolean {
    return collisionMatrix.isBodyBlockedAt(isoX, isoY);
  }

  /**
   * Sistema de deslizamiento fluido para superficies isométricas 2:1.
   * Si choca contra cualquier cara diagonal (SE, SO, NE, NO) o recta,
   * proyecta el movimiento suavemente a lo largo de la tangente del obstáculo.
   */
  private filterMovementByTerrain(xDir: number, yDir: number): { xDir: number; yDir: number } {
    if (xDir === 0 && yDir === 0) return { xDir, yDir };

    const testDist = 6;
    const nextX = this.x + xDir * testDist;
    const nextY = this.y + yDir * testDist;

    // Si el camino directo está libre, avanzar normalmente
    if (!this.isBodyBlockedAt(nextX, nextY)) {
      return { xDir, yDir };
    }

    // Candidatos de deslizamiento: tangentes isométricas 2:1 y componentes por eje
    const candidates: Array<{ x: number; y: number; dot: number }> = [];

    // Componentes de eje directo
    if (xDir !== 0) candidates.push({ x: xDir, y: 0, dot: 1 });
    if (yDir !== 0) candidates.push({ x: 0, y: yDir, dot: 1 });

    // Tangentes diagonales isométricas (aristas del rombo)
    const isoTangents = [
      { x: 1, y: -0.5 },
      { x: -1, y: -0.5 },
      { x: 1, y: 0.5 },
      { x: -1, y: 0.5 },
      { x: 0.8, y: -0.8 },
      { x: -0.8, y: -0.8 },
      { x: 0.8, y: 0.8 },
      { x: -0.8, y: 0.8 },
    ];

    for (const t of isoTangents) {
      const dot = t.x * xDir + t.y * yDir;
      if (dot > 0.01) {
        candidates.push({ x: t.x, y: t.y, dot });
      }
    }

    // Ordenar de mayor a menor afinidad con la dirección de avance deseada
    candidates.sort((a, b) => b.dot - a.dot);

    // Probar el primer vector de deslizamiento libre
    for (const cand of candidates) {
      const candX = this.x + cand.x * testDist;
      const candY = this.y + cand.y * testDist;
      if (!this.isBodyBlockedAt(candX, candY)) {
        return { xDir: cand.x, yDir: cand.y };
      }
    }

    return { xDir: 0, yDir: 0 };
  }

  updateEntity() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = 200;

    if (isGameInputBlocked()) {
      body.setVelocity(0);
      if (!this.isDashing && !CombatSystem.isAttacking(this) && !this.isJumping) {
        this.playIdle();
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
      const jumpSpeed = 220;
      let { xDir, yDir } = InputSystem.getMovementVector(this.scene);
      ({ xDir, yDir } = this.filterMovementByTerrain(xDir, yDir));
      if (xDir !== 0) body.setVelocityX(xDir * jumpSpeed);
      if (yDir !== 0) body.setVelocityY(yDir * jumpSpeed);
      if (body.velocity.x !== 0 && body.velocity.y !== 0) body.velocity.normalize().scale(jumpSpeed);
      const dir = (xDir !== 0 || yDir !== 0) ? (InputSystem.getDirection(this.scene) as Direction8 | "") : "";
      if (dir !== "") this.lastDirection = dir as Direction8;
      return;
    }

    body.setVelocity(0);

    let { xDir, yDir, dir } = InputSystem.getMovementVector(this.scene);
    ({ xDir, yDir } = this.filterMovementByTerrain(xDir, yDir));

    if (xDir === 0 && yDir === 0) {
      dir = "";
    } else if (dir !== "") {
      const recalculated = (() => {
        if (xDir < -0.1 && Math.abs(yDir) < 0.2) return "left";
        if (xDir > 0.1 && Math.abs(yDir) < 0.2) return "right";
        if (Math.abs(xDir) < 0.2 && yDir < -0.1) return "up";
        if (Math.abs(xDir) < 0.2 && yDir > 0.1) return "down";
        if (xDir < -0.1 && yDir < -0.1) return "up_left";
        if (xDir > 0.1 && yDir < -0.1) return "up_right";
        if (xDir < -0.1 && yDir > 0.1) return "down_left";
        if (xDir > 0.1 && yDir > 0.1) return "down_right";
        return dir;
      })();
      dir = recalculated as typeof dir;
    }

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
