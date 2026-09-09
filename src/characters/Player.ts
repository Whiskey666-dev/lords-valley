import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { BaseHuman } from "./BaseHuman";
import type { Direction8 } from "./Animations";
import * as InputSystem from "../game/systems/InputSystem";
import { isGameInputBlocked } from "../ui/input/KeyBindings";
import { collisionMatrix } from "../game/world/CollisionMatrix";
import { isoToTile } from "../game/world/Terrain";
import { getHeightFast, HEIGHT_STEP_PX } from "../game/world/TerrainHeight";
import { canStepHeight } from "../game/world/IsoWalls";

export class Player extends BaseHuman {
  private isJumping = false;
  private isDashing = false;
  /** Píxeles que sube la textura sobre el plano físico (sigue el relieve). */
  private visualRise = 0;
  /** Y del cuerpo al despegar (la regla de altura se evalúa en el plano). */
  private jumpBaseY: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle_down", "", "player_");
    // Huella en consola (F12): confirma que corre la física actual.
    console.log("[player] física ±1 sin deslizar, subida +1 a mitad de velocidad, salto en plano de despegue");
    this.play("idle_down", true);
    InputSystem.capture(scene);
  }

  private executeJump() {
    if (this.isJumping || this.isDashing || CombatSystem.isAttacking(this)) return;
    this.isJumping = true;
    // Congelar la base de la regla en el despegue: en el aire el cuerpo sube
    // y re-mapearía tiles altos; sin esto se trepan muros de +2 saltando.
    this.jumpBaseY = this.y;
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
      this.jumpBaseY = null;
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
    // Muestrear la trayectoria: ni cuerpos ni subidas de 2+ niveles en el camino.
    const steps = Math.max(1, Math.ceil(dashDist / 16));
    for (let i = 1; i <= steps; i++) {
      const px = this.x + (vx * dashDist * i) / steps;
      const py = this.y + (vy * dashDist * i) / steps;
      if (this.isBodyBlockedAt(px, py) || !this.canStepTo(px, py)) return;
    }
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
   * Sin deslizamiento: si el camino directo está bloqueado (cuerpos o
   * desnivel de +2), el personaje se detiene en seco. Cualquier vector
   * alternativo permitía bordear muros y trepar fuera del hueco.
   */
  private filterMovementByTerrain(xDir: number, yDir: number): { xDir: number; yDir: number } {
    if (xDir === 0 && yDir === 0) return { xDir, yDir };

    const testDist = 6;
    const nextX = this.x + xDir * testDist;
    const nextY = this.y + yDir * testDist;

    // Solo avanza si el punto 6px por delante está libre y no sube 2+ niveles.
    if (!this.isBodyBlockedAt(nextX, nextY) && this.canStepTo(nextX, nextY)) {
      return { xDir, yDir };
    }

    return { xDir: 0, yDir: 0 };
  }

  /** Altura del tile bajo un punto del plano físico (pies, sin offset visual). */
  private groundHeightAt(px: number, py: number): number {
    const { tileX, tileY } = isoToTile(px, py + 14);
    return getHeightFast(tileX, tileY);
  }

  /**
   * Se puede pisar el destino si no sube 2+ niveles desde el tile actual.
   * Bajar/caer siempre vale (incluso a pozos profundos).
   * En el aire se evalúa en el plano de despegue: el salto no da altura
   * para trepar (sirve para cruzar huecos, no para escalar muros).
   */
  private canStepTo(toX: number, toY: number): boolean {
    if (this.jumpBaseY !== null) {
      const lift = this.jumpBaseY - this.y;
      const fromH = this.groundHeightAt(this.x, this.y + lift);
      const toH = this.groundHeightAt(toX, toY + lift);
      return canStepHeight(fromH, toH);
    }
    const fromH = this.groundHeightAt(this.x, this.y);
    const toH = this.groundHeightAt(toX, toY);
    return canStepHeight(fromH, toH);
  }

  /**
   * Sigue la superficie del terreno moviendo solo la TEXTURA (vía origin):
   * el cuerpo físico queda en el plano y las colisiones no derivan.
   * Subir es suave; bajar es caída rápida con sensación de gravedad.
   */
  private updateTerrainHeight(): void {
    const h = this.groundHeightAt(this.x, this.y);
    const target = h * HEIGHT_STEP_PX;
    const d = target - this.visualRise;
    if (Math.abs(d) < 0.5) {
      this.visualRise = target;
    } else {
      const dt = Math.min(0.05, this.scene.game.loop.delta / 1000);
      const rate = target < this.visualRise ? 150 : 60;
      this.visualRise += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
    }
    const dispH = this.displayHeight > 0 ? this.displayHeight : 64;
    this.setOrigin(0.5, 0.5 + this.visualRise / dispH);
  }

  updateEntity() {
    this.updateTerrainHeight();
    const body = this.body as Phaser.Physics.Arcade.Body;
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

    // Subir un nivel (+1) cuesta el doble: velocidad a la mitad mientras se
    // asciende. En plano y bajando, velocidad normal. (Los muros limpios de
    // +2 ya son imposibles por canStepHeight; las terrazas +1 se pueden
    // subir por regla, pero despacio.)
    let speed = 200;
    if (xDir !== 0 || yDir !== 0) {
      const fromH = this.groundHeightAt(this.x, this.y);
      const toH = this.groundHeightAt(this.x + xDir * 6, this.y + yDir * 6);
      if (toH - fromH >= 1) speed = 100;
    }

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
