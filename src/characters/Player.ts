import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { BaseHuman } from "./BaseHuman";
import type { Direction8 } from "./Animations";
import * as InputSystem from "../game/systems/InputSystem";
import { isGameInputBlocked } from "../ui/input/KeyBindings";
import { isBlockedWorldXY } from "../game/world/Terrain";

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
    // Evita dash hacia mineral/agua (si destino inmediato bloqueado)
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

  private isBodyBlockedAt(worldX: number, worldY: number): boolean {
    // Hitbox 20x20 offset 14,36 anchored 0.5,0.5 => left=x-10 right=x+10 top=y+4 bottom=y+24
    // Bloquea minerales y agua (isBlockedWorldXY = mineral || agua)
    const left = worldX - 10;
    const right = worldX + 10;
    const top = worldY + 4;
    const bottom = worldY + 24;
    const cx = worldX;
    const cy = (top + bottom) / 2;
    // 5 puntos: 4 esquinas + centro del cuerpo
    return (
      isBlockedWorldXY(left, top) ||
      isBlockedWorldXY(right, top) ||
      isBlockedWorldXY(left, bottom) ||
      isBlockedWorldXY(right, bottom) ||
      isBlockedWorldXY(cx, cy) ||
      isBlockedWorldXY(cx, top) ||
      isBlockedWorldXY(cx, bottom)
    );
  }

  private filterMovementByTerrain(xDir: number, yDir: number): { xDir: number; yDir: number } {
    if (xDir === 0 && yDir === 0) return { xDir, yDir };
    // Prueba desplazamiento en X e Y por separado para permitir deslizamiento
    const testDist = 10; // ~ mitad del hitbox, asegura que probamos el siguiente tile
    const nextX = this.x + xDir * testDist;
    const nextY = this.y + yDir * testDist;
    const blockedX = xDir !== 0 && this.isBodyBlockedAt(nextX, this.y);
    const blockedY = yDir !== 0 && this.isBodyBlockedAt(this.x, nextY);
    const blockedDiag = xDir !== 0 && yDir !== 0 && this.isBodyBlockedAt(nextX, nextY);
    let fx = xDir, fy = yDir;
    if (blockedDiag && !blockedX && !blockedY) {
      // diagonal bloqueada pero ejes libres -> mantener ejes (deslizamiento ya natural, no bloquear)
    }
    if (blockedX) fx = 0;
    if (blockedY) fy = 0;
    // Si ambos ejes bloqueados, queda (0,0)
    // Si diagonal bloqueada y ambos ejes bloqueados, ya es 0,0
    return { xDir: fx, yDir: fy };
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
    // Recalcula dir tras filtrar minerales/agua para animación correcta
    if (xDir === 0 && yDir === 0) {
      dir = "";
    } else if (dir !== "") {
      // Si el vector original fue bloqueado parcialmente, recalcular dirección física
      const recalculated = (() => {
        if (xDir === -1 && yDir === 0) return "left";
        if (xDir === 1 && yDir === 0) return "right";
        if (xDir === 0 && yDir === -1) return "up";
        if (xDir === 0 && yDir === 1) return "down";
        if (xDir === -1 && yDir === -1) return "up_left";
        if (xDir === 1 && yDir === -1) return "up_right";
        if (xDir === -1 && yDir === 1) return "down_left";
        if (xDir === 1 && yDir === 1) return "down_right";
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
