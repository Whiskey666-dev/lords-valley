import Phaser from 'phaser';
import { BaseHuman } from '../../characters/BaseHuman';

export class SurvivorSprite extends BaseHuman {
  public survivorId: string;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, survivorId: string) {
    super(scene, x, y, 'player_idle_down', 'npc_', 'npc_');
    this.survivorId = survivorId;
    this.targetX = x;
    this.targetY = y;
    this.setDepth(5);
    this.play('npc_idle_down', true);
  }

  setTarget(posX: number, posY: number) {
    this.targetX = posX;
    this.targetY = posY;
  }

  updateInterpolation() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    // Linear interpolation 0.15, sin teleport
    this.x = Phaser.Math.Linear(this.x, this.targetX, 0.15);
    this.y = Phaser.Math.Linear(this.y, this.targetY, 0.15);
    // Anim walk if moving
    if (dist > 2) {
      const dir = this.dirFromDelta(dx, dy);
      this.moveInDirection(dir as any);
    } else {
      this.idle();
    }
  }

  private dirFromDelta(dx: number, dy: number): string {
    const angle = Math.atan2(dy, dx);
    const oct = Math.round((angle / (Math.PI / 4) + 8) % 8);
    const map = ['right', 'right_down', 'down', 'left_down', 'left', 'left_up', 'up', 'right_up'];
    return map[oct];
  }

  highlight(selected: boolean) {
    if (selected) {
      this.setTint(0xffff99);
      this.setScale(1.05);
    } else {
      this.clearTint();
      this.setScale(1);
    }
  }
}
