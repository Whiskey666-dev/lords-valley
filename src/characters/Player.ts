import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { BaseHuman, BASE_HUMAN_ORIGIN_Y } from "./BaseHuman";
import { Needs } from "./Needs";
import type { Direction8 } from "./Animations";
import * as InputSystem from "../game/systems/InputSystem";
import { isGameInputBlocked } from "../ui/input/KeyBindings";
import { collisionMatrix } from "../game/world/CollisionMatrix";
import { isoToTile } from "../game/world/Terrain";
import { getHeightFast, HEIGHT_STEP_PX } from "../game/world/TerrainHeight";
import { canStepHeight } from "../game/world/IsoWalls";

/** HP canónico del jugador, sincronizado con el servidor (COMBAT_STATS.player). */
export const PLAYER_MAX_SALUD = 200;

export class Player extends BaseHuman {
  public salud: number = PLAYER_MAX_SALUD;
  public maxSalud: number = PLAYER_MAX_SALUD;
  /** Hambre/sed funcionales (0 = saciado, 100 = hambriento). Autoridad: backend /player/me/needs. */
  public needs: Needs = new Needs({ hambre: 0, sed: 0, sueno: 0 });
  private isDead = false;
  private isJumping = false;
  private isDashing = false;
  /** Píxeles que sube la textura sobre el plano físico (sigue el relieve). */
  private visualRise = 0;
  /** Elevación adicional por arco de salto. */
  private jumpLift = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle_down", "", "player_");
    console.log("[player] velocidad /2, paso +1 caminando, salto hasta +3 clicks");
    this.play("idle_down", true);
    InputSystem.capture(scene);
  }

  private executeJump() {
    if (this.isJumping || this.isDashing || CombatSystem.isAttacking(this)) return;
    this.isJumping = true;
    this.playJump(this.lastDirection);

    const jumpDuration = 420;
    const jumpPeak = 14;
    const startTime = this.scene.time.now;

    const timer = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const elapsed = this.scene.time.now - startTime;
        const progress = Math.min(1, elapsed / jumpDuration);
        this.jumpLift = Math.sin(progress * Math.PI) * jumpPeak;
        if (progress >= 1) {
          timer.destroy();
          this.jumpLift = 0;
          this.isJumping = false;
          if (this.active) this.playIdle();
        }
      }
    });
  }

  private executeDash() {
    if (this.isDashing || this.isJumping || CombatSystem.isAttacking(this)) return;
    const dashSpeed = 260; // Velocidad a la mitad (era 520)
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
      if (dir === "right") vx = 1;
    }
    
    // Ajuste isométrico 2:1
    vy = vy * 0.5;
    const len = Math.hypot(vx, vy);
    if (len > 0) {
      vx /= len;
      vy /= len;
    }

    const dashDist = dashSpeed * (dashDuration / 1000);
    const steps = Math.max(1, Math.ceil(dashDist / 16));
    for (let i = 1; i <= steps; i++) {
      const px = this.x + (vx * dashDist * i) / steps;
      const py = this.y + (vy * dashDist * i) / steps;
      if (this.isBodyBlockedAt(px, py) || !this.canStepTo(px, py)) return;
    }
    this.isDashing = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx * dashSpeed, vy * dashSpeed); // fix: faltaba setVelocity para que el dash mueva al player
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
   * Filtrado de movimiento por terreno:
   * 1. Verifica camino directo.
   * 2. Si es diagonal y choca, intenta deslizar por el eje libre.
   */
  private filterMovementByTerrain(xDir: number, yDir: number): { xDir: number; yDir: number } {
    if (xDir === 0 && yDir === 0) return { xDir, yDir };

    const testDist = 3; // 3px de lookahead para contacto suave sin vibración
    const nextX = this.x + xDir * testDist;
    const nextY = this.y + yDir * testDist;

    // 1. Camino directo
    if (!this.isBodyBlockedAt(nextX, nextY) && this.canStepTo(nextX, nextY)) {
      return { xDir, yDir };
    }

    // 2. Si el movimiento es diagonal, permitir deslizar por componente libre
    if (xDir !== 0 && yDir !== 0) {
      const testX = this.x + xDir * testDist;
      if (!this.isBodyBlockedAt(testX, this.y) && this.canStepTo(testX, this.y)) {
        return { xDir, yDir: 0 };
      }
      const testY = this.y + yDir * testDist;
      if (!this.isBodyBlockedAt(this.x, testY) && this.canStepTo(this.x, testY)) {
        return { xDir: 0, yDir };
      }
    }

    return { xDir: 0, yDir: 0 };
  }

  /** Altura del tile bajo un punto del plano físico exacto. */
  public groundHeightAt(px: number, py: number): number {
    const { tileX, tileY } = isoToTile(px, py);
    return getHeightFast(tileX, tileY);
  }

  /**
   * Se puede pisar el destino:
   * - Terreno nivelado (misma altura): permitido.
   * - Subir 1 click (+1): permitido caminando (rampa/escalón).
   * - Subir 2 o 3 clicks (+2..+3): solo saltando. A pie bloqueado (muro sólido).
   * - Subir más de 3 clicks (+4..+8): bloqueado siempre.
   * - Bajar 1 click (-1): permitido caminando (escalón).
   * - Bajar 2 o más clicks (-2..-8): foso/excavación con muro en la base.
   *   Caminando está bloqueado para no caer al precipicio; saltando permite descender hasta 3 clicks.
   */
  private canStepTo(toX: number, toY: number): boolean {
    const fromH = this.groundHeightAt(this.x, this.y);

    // Muestreo simétrico en 2:1 sobre la elipse de contacto de los pies
    const checkPoints = [
      { x: toX, y: toY },
      { x: toX - 6, y: toY },
      { x: toX + 6, y: toY },
      { x: toX, y: toY - 3 },
      { x: toX, y: toY + 3 },
    ];

    for (const pt of checkPoints) {
      const toH = this.groundHeightAt(pt.x, pt.y);
      if (!canStepHeight(fromH, toH, this.isJumping)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Sigue la superficie del terreno moviendo la textura (vía origin):
   * el cuerpo físico queda en el plano y las colisiones no derivan.
   */
  private updateTerrainHeight(): void {
    const h = this.groundHeightAt(this.x, this.y);
    const target = h * HEIGHT_STEP_PX;
    const d = target - this.visualRise;
    if (Math.abs(d) < 0.5) {
      this.visualRise = target;
    } else {
      const dt = Math.min(0.05, this.scene.game.loop.delta / 1000);
      const rate = target < this.visualRise ? 300 : 200;
      this.visualRise += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
    }
    const dispH = this.displayHeight > 0 ? this.displayHeight : 64;
    this.setOrigin(0.5, BASE_HUMAN_ORIGIN_Y + (this.visualRise + this.jumpLift) / dispH);
  }

  updateEntity() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Necesidades funcionales (predicción local 20%/h = 100% en 5h; GodMode las congela).
    try {
      const god = (window as any).__GOD_MODE__ === true;
      if (!god && !this.isDead) {
        const dt = Math.max(0, Math.min(5, this.scene.game.loop.delta / 1000));
        this.needs.simularNecesidades(dt > 0 ? dt : 1 / 60);
      } else if (god && (this.needs.hambre !== 0 || this.needs.sed !== 0)) {
        this.needs.syncFromServer(0, 0);
      }
    } catch {
      // nunca romper el frame por necesidades
    }
    // Muerto: quieto hasta el respawn (MainScene lo reaparece)
    if (this.isDead) {
      body.setVelocity(0);
      return;
    }
    this.updateTerrainHeight();
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
      const jumpSpeed = 110; // Reducido a la mitad (era 220)
      let { xDir, yDir } = InputSystem.getMovementVector(this.scene);
      ({ xDir, yDir } = this.filterMovementByTerrain(xDir, yDir));
      
      if (xDir !== 0 || yDir !== 0) {
        let vx = xDir;
        let vy = yDir * 0.5; // Ajuste isométrico 2:1
        const length = Math.hypot(vx, vy);
        body.setVelocityX((vx / length) * jumpSpeed);
        body.setVelocityY((vy / length) * jumpSpeed);
      }
      
      const dir = (xDir !== 0 || yDir !== 0) ? (InputSystem.getDirection(this.scene) as Direction8 | "") : "";
      if (dir !== "") this.lastDirection = dir as Direction8;
      return;
    }

    body.setVelocity(0);

    let { xDir, yDir, dir } = InputSystem.getMovementVector(this.scene);
    ({ xDir, yDir } = this.filterMovementByTerrain(xDir, yDir));

    // Velocidad normal reducida a la mitad (100 px/s, era 200)
    // Al subir +1 nivel, velocidad a la mitad (50 px/s)
    let speed = 100;
    if (xDir !== 0 || yDir !== 0) {
      const fromH = this.groundHeightAt(this.x, this.y);
      const toH = this.groundHeightAt(this.x + xDir * 8, this.y + yDir * 8);
      if (toH - fromH >= 1) speed = 50;
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

    if (xDir !== 0 || yDir !== 0) {
      let vx = xDir;
      let vy = yDir * 0.5; // Ajuste isométrico 2:1
      const length = Math.hypot(vx, vy);
      body.setVelocityX((vx / length) * speed);
      body.setVelocityY((vy / length) * speed);
    } else {
      body.setVelocity(0);
    }

    if (dir !== "") {
      this.playWalk(dir as Direction8);
    } else {
      this.playIdle();
    }
  }

  get estaVivo(): boolean {
    return !this.isDead && this.salud > 0;
  }

  /** Sincroniza hambre/sed autoritativas del servidor (GET /player/me/needs o POST use). */
  syncNeedsFromServer(hunger: number, thirst: number) {
    try {
      this.needs.syncFromServer(hunger, thirst);
    } catch {
      // ignora payload corrupto
    }
  }

  /**
   * Daño confirmado por el servidor (MainScene sincroniza el HP autoritativo
   * con applyServerDamage; este método es el fallback local). Retorna true si muere.
   */
  recibirDano(cantidad: number): boolean {
    if (this.isDead) return true;
    this.salud = Math.max(0, this.salud - cantidad);
    this.setTint(0xff6666);
    this.scene.time.delayedCall(150, () => {
      if (this.active && !this.isDead) this.clearTint();
    });
    if (this.salud <= 0) {
      this.morir();
      return true;
    }
    return false;
  }

  /** Sincroniza el HP autoritativo del servidor. */
  applyServerDamage(hp: number, maxHp: number) {
    if (this.isDead) return;
    this.maxSalud = Math.max(1, maxHp);
    this.salud = Math.max(0, Math.min(this.maxSalud, hp));
    this.setTint(0xff6666);
    this.scene.time.delayedCall(150, () => {
      if (this.active && !this.isDead) this.clearTint();
    });
    if (this.salud <= 0) this.morir();
  }

  /** Muerte real con la animación de muerte del sprite compartido. */
  morir() {
    if (this.isDead) return;
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    body?.setVelocity(0);
    console.log("[player] ha muerto — respawn en el punto inicial...");
    this.die();
  }

  /** Reaparece en el punto inicial con la vida llena. */
  respawn(x: number, y: number) {
    this.isDead = false;
    this.salud = this.maxSalud;
    this.setPosition(x, y);
    this.clearTint();
    this.setAlpha(1);
    this.playIdle();
    console.log(`[player] respawn en ${x.toFixed(0)},${y.toFixed(0)} con ${this.salud}/${this.maxSalud}`);
  }
}

