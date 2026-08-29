import Phaser from "phaser";

/**
 * ChatBubbleSystem.ts - Sistema de burbuja de chat.
 * Extraído de MainScene para mantener la escena delgada.
 * Gestiona creación, animación y seguimiento del contenedor sobre el player.
 */

export class ChatBubbleSystem {
  private bubble: Phaser.GameObjects.Container | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    window.addEventListener("phaser-chat-bubble", ((e: CustomEvent<{ text: string }>) => {
      const text = e.detail?.text?.trim();
      if (!text) return;
      this.show(text, (scene as unknown as { player: { x: number; y: number } }).player);
    }) as EventListener);
  }

  show(text: string, player: { x: number; y: number }): void {
    if (this.bubble) { this.bubble.destroy(true); this.bubble = null; }
    if (this.timer) { this.timer.remove(false); this.timer = null; }

    const maxWidth = 220;
    const paddingX = 10, paddingY = 6;
    const txt = this.scene.add.text(0, 0, text, {
      fontSize: "12px", color: "#ffffff", fontFamily: "monospace",
      wordWrap: { width: maxWidth }, align: "center"
    });
    txt.setOrigin(0.5, 0.5);
    const bw = Math.ceil(txt.width) + paddingX * 2;
    const bh = Math.ceil(txt.height) + paddingY * 2;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x111111, 0.92);
    bg.lineStyle(1, 0x4caf50, 0.9);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.fillStyle(0x111111, 0.92);
    bg.fillTriangle(0, bh / 2, -6, bh / 2 - 2, 6, bh / 2 - 2);
    bg.lineStyle(1, 0x4caf50, 0.9);
    bg.lineBetween(-6, bh / 2 - 2, 0, bh / 2);
    bg.lineBetween(0, bh / 2, 6, bh / 2 - 2);

    const container = this.scene.add.container(player.x, player.y - 48, [bg, txt]);
    container.setDepth(200);
    container.setAlpha(0);
    this.bubble = container;
    this.scene.tweens.add({ targets: container, alpha: 1, duration: 120, ease: "Quad.out" });
    container.setScale(0.92);
    this.scene.tweens.add({ targets: container, scale: 1, duration: 140, ease: "Back.out" });

    this.timer = this.scene.time.delayedCall(3500, () => {
      if (!this.bubble) return;
      this.scene.tweens.add({
        targets: this.bubble, alpha: 0, y: (this.bubble.y - 8), duration: 300, ease: "Quad.in",
        onComplete: () => { if (this.bubble) { this.bubble.destroy(true); this.bubble = null; } }
      });
    });
    console.log(`[ChatBubble] "${text}"`);
  }

  update(player: { x: number; y: number }): void {
    if (this.bubble && player) {
      this.bubble.x = player.x;
      this.bubble.y = player.y - 48;
    }
  }

  destroy(): void {
    if (this.bubble) this.bubble.destroy(true);
    if (this.timer) this.timer.remove(false);
  }
}
