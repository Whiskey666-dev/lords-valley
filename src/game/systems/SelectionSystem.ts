import { useGameStore } from '../../app/store/useGameStore';
import { SurvivorSprite } from '../entities/SurvivorSprite';

export class SelectionSystem {
  private sprites = new Map<string, SurvivorSprite>();

  register(sprite: SurvivorSprite) {
    this.sprites.set(sprite.survivorId, sprite);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      // Prevent through click to MainScene
      useGameStore.getState().selectSurvivor(sprite.survivorId);
    });
  }

  unregister(id: string) {
    this.sprites.delete(id);
  }

  handleWorldClick(worldX: number, worldY: number, hitIds: Set<string>) {
    if (hitIds.size > 0) {
      const first = Array.from(hitIds)[0];
      useGameStore.getState().selectSurvivor(first);
      return;
    }
    // Check proximity fallback (same as MainScene 40px)
    for (const [id, sp] of this.sprites) {
      const dist = Math.hypot(sp.x - worldX, sp.y - worldY);
      if (dist < 40) {
        useGameStore.getState().selectSurvivor(id);
        return;
      }
    }
    // No hit: check building selection via store? else clear
    useGameStore.getState().clearSelection();
  }

  syncHighlight() {
    const selected = useGameStore.getState().selectedId;
    for (const [id, sp] of this.sprites) {
      sp.highlight(id === selected);
    }
  }

  syncPositions(survivors: any[]) {
    for (const sv of survivors) {
      const sp = this.sprites.get(sv.id);
      if (sp) sp.setTarget(sv.positionX ?? sp.x, sv.positionY ?? sp.y);
    }
  }
}
