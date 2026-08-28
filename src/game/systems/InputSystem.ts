import Phaser from "phaser";
import { isActionDown, isActionJustDown, captureAllBindings, getBinding, isGameInputBlocked } from "../../ui/input/KeyBindings";
import type { Direction8 } from "../../characters/Animations";

/**
 * InputSystem.ts - Sistema de entrada modular y escalable (Game Layer).
 * Ubicado en src/game/systems/ porque es lógica de juego, no UI.
 * Lee la configuración de src/ui/input/KeyBindings.ts y expone API limpia para Player/MainScene
 * sin que `characters/` importe directamente desde `ui/`.
 * 
 * Player y cualquier humano solo usan InputSystem, desacoplado de la UI de configuración.
 */

function getDirectionFromVector(xDir: number, yDir: number): Direction8 | "" {
  if (xDir === -1 && yDir === 0) return "left";
  if (xDir === 1 && yDir === 0) return "right";
  if (xDir === 0 && yDir === -1) return "up";
  if (xDir === 0 && yDir === 1) return "down";
  if (xDir === -1 && yDir === -1) return "up_left";
  if (xDir === 1 && yDir === -1) return "up_right";
  if (xDir === -1 && yDir === 1) return "down_left";
  if (xDir === 1 && yDir === 1) return "down_right";
  return "";
}

export function getMovementVector(scene: Phaser.Scene): { xDir: number; yDir: number; dir: Direction8 | "" } {
  if (isGameInputBlocked()) return { xDir: 0, yDir: 0, dir: "" };
  let xDir = 0;
  let yDir = 0;
  if (isActionDown(scene, "move_left")) xDir = -1;
  else if (isActionDown(scene, "move_right")) xDir = 1;
  if (isActionDown(scene, "move_up")) yDir = -1;
  else if (isActionDown(scene, "move_down")) yDir = 1;
  const dir = getDirectionFromVector(xDir, yDir);
  return { xDir, yDir, dir };
}

export function isJumpJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "jump");
}

export function isDashJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "dash");
}

export function isAttackJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "attack") || isActionJustDown(scene, "attackAlt");
}

export function isTutorialJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "tutorial");
}

export function isCloseJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "close");
}

export function isInventoryJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "inventory");
}
export function isMapJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "map");
}
export function isMissionsJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "missions");
}
export function isStatsJustPressed(scene: Phaser.Scene): boolean {
  return isActionJustDown(scene, "stats");
}

export function captureInput(scene: Phaser.Scene) {
  captureAllBindings(scene);
}
export const capture = captureInput;

export function getDirection(scene: Phaser.Scene): Direction8 | "" {
  return getMovementVector(scene).dir;
}

export { getBinding };
