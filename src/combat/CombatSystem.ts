import Phaser from "phaser";
import { ATTACK_DIRECTIONS_18, createCombatAnimations } from "../characters/Animations";

export class CombatSystem {
  public static attackingEntities: Set<Phaser.GameObjects.GameObject> = new Set();

  /** @deprecated Usa ATTACK_DIRECTIONS_18 de src/characters/Animations.ts */
  private static readonly ATTACK_DIRECTIONS = ATTACK_DIRECTIONS_18;

  public static initCombatAnimations(scene: Phaser.Scene, prefix: string = "player_") {
    // Delegado al sistema centralizado de animaciones
    createCombatAnimations(scene, prefix);
  }

  public static executeAttack(entity: Phaser.Physics.Arcade.Sprite, direction: string, prefix: string = "player_", durationMs: number = 400): boolean {
    if (CombatSystem.isAttacking(entity)) return false;

    CombatSystem.attackingEntities.add(entity);

    if (entity.body) {
      (entity.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    }

    const animKey = `${prefix}attack_${direction}`;
    
    // Usa Dash (64x64, 6 frames) como anim de ataque hasta tener sprites de ataque dedicados
    if (entity.scene.anims.exists(animKey)) {
      entity.play(animKey, true);
    } else {
      console.warn(`[CombatSystem] Anim no encontrada: ${animKey}`);
    }

    setTimeout(() => {
      CombatSystem.attackingEntities.delete(entity);
      if (entity.active && entity.scene) {
        // Player usa "idle_down", NPC usa "npc_idle_down"
        const idleKey = prefix === "player_" ? `idle_${direction}` : `${prefix}idle_${direction}`;
        if (entity.scene.anims.exists(idleKey)) entity.play(idleKey, true);
      }
    }, durationMs);

    return true;
  }

  public static isAttacking(entity: Phaser.Physics.Arcade.Sprite): boolean {
    return CombatSystem.attackingEntities.has(entity);
  }
}
