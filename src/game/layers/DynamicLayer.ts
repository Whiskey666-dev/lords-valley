import Phaser from "phaser";

/**
 * Capa B — Elementos Dinámicos
 * Único Group para jugador, enemigos y edificios.
 * Utiliza la posición Y isométrica directamente para el orden de profundidad (Depth sorting O(1)).
 */
export class DynamicLayer {
  public readonly group: Phaser.GameObjects.Group;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = this.scene.add.group();
  }

  add(obj: Phaser.GameObjects.GameObject): Phaser.GameObjects.GameObject {
    this.group.add(obj);
    const anyObj = obj as unknown as { y?: number; setDepth?: (d: number) => void };
    if (typeof anyObj.y === "number" && anyObj.setDepth) {
      anyObj.setDepth(anyObj.y);
    }
    return obj;
  }

  remove(obj: Phaser.GameObjects.GameObject, destroy = false) {
    this.group.remove(obj, destroy, destroy);
  }

  /**
   * Actualiza el depth de los elementos dinámicos basándose en su Y isométrica.
   */
  sortByDepth(_camera?: Phaser.Cameras.Scene2D.Camera) {
    const children = this.group.getChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as unknown as { active?: boolean; visible?: boolean; y?: number; setDepth?: (d: number) => void };
      if (child.active && child.visible && typeof child.y === "number" && child.setDepth) {
        child.setDepth(child.y);
      }
    }
  }

  addBuilding(sprite: Phaser.GameObjects.Sprite, tileX: number, tileY: number, w: number, h: number, matrix: { occupyRect: Function }) {
    this.add(sprite);
    matrix.occupyRect(tileX, tileY, w, h);
    const body = (sprite as any).body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      this.scene.physics.world.disableBody(body);
    }
  }

  count(): number {
    return this.group.getLength();
  }

  destroy() {
    this.group.clear(true, true);
    this.group.destroy(true);
  }
}
