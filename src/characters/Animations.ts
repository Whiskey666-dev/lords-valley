import Phaser from "phaser";

/**
 * Animations.ts - Sistema centralizado, modular y escalable para humanos.
 * Ubicación: src/characters/Animations.ts
 * 
 * Diseñado para que Player y cualquier NPC humano (Survivor, Villager, Guard...) reutilicen
 * el mismo set de animaciones sin duplicar código.
 * 
 * Texturas base: src/assets/sprites/player/{Walk,Idle,Dash,Death}/ (48x64, 8 frames = 384x64)
 * Documentado en frame dimensions.png => 48 x 64 px.
 * Cada dirección lógica (8 dirs) se mapea a 6 texturas físicas (down/up/4 diagonales).
 * 
 * Escalabilidad:
 *  - Para un nuevo humano (ej. "villager") solo añade en Preloader las texturas "villager_walk_*" y llama:
 *    registerHumanAnimations(scene, "villager_", "villager_")
 *  - Si el nuevo humano no tiene textura propia, hace fallback automático a "player_*".
 */

// ---------------------------------------------------------------------------
// Tipos y Configuración
// ---------------------------------------------------------------------------

export type Direction8 =
  | "right"
  | "up_right"
  | "up"
  | "up_left"
  | "left"
  | "down_left"
  | "down"
  | "down_right";

export type PhysicalDir = "down" | "up" | "right_down" | "right_up" | "left_down" | "left_up";

/**
 * Mapeo de 8 direcciones lógicas (usadas en Player.ts y por IA) a 6 texturas físicas reales.
 * right/left puros no existen como archivo, se hace fallback a la diagonal más cercana.
 */
export const LOGICAL_TO_PHYSICAL: Record<Direction8, PhysicalDir> = {
  down: "down",
  up: "up",
  down_right: "right_down",
  up_right: "right_up",
  down_left: "left_down",
  up_left: "left_up",
  right: "right_down", // este -> fallback a sureste
  left: "left_down",   // oeste -> fallback a suroeste (simétrico)
};

export const ALL_DIRECTIONS_8: Direction8[] = [
  "right",
  "up_right",
  "up",
  "up_left",
  "left",
  "down_left",
  "down",
  "down_right",
];

// ---------------------------------------------------------------------------
// Helpers internos - modulares
// ---------------------------------------------------------------------------

function resolveTexture(scene: Phaser.Scene, primary: string, fallback: string): string | null {
  if (scene.textures.exists(primary)) return primary;
  if (scene.textures.exists(fallback)) return fallback;
  return null;
}

function createAnim(
  scene: Phaser.Scene,
  animKey: string,
  textureKey: string,
  frameRate: number,
  repeat: number
) {
  if (scene.anims.exists(animKey)) return;
  if (!scene.textures.exists(textureKey)) {
    console.warn(`[Animations] Textura no encontrada: ${textureKey} para anim ${animKey}`);
    return;
  }
  scene.anims.create({
    key: animKey,
    frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 7 }),
    frameRate,
    repeat,
  });
}

// ---------------------------------------------------------------------------
// Creadores genéricos - reutilizables por cualquier humano
// ---------------------------------------------------------------------------

/**
 * Genérico: crea walk para cualquier prefijo. Ej: animPrefix="walk_", texturePrefix="player_walk_"
 * Animación 8 frames, 10fps, loop. Modular para Player y NPCs.
 */
export function createWalkAnimations(
  scene: Phaser.Scene,
  animPrefix: string,
  texturePrefix: string = "player_walk_",
  fallbackPrefix: string = "player_walk_"
) {
  ALL_DIRECTIONS_8.forEach((dir) => {
    const phys = LOGICAL_TO_PHYSICAL[dir];
    const primary = `${texturePrefix}${phys}`;
    const fallback = `${fallbackPrefix}${phys}`;
    const textureKey = resolveTexture(scene, primary, fallback);
    if (!textureKey) {
      console.warn(`[Animations] Walk texture faltante: ${primary} / fallback ${fallback}`);
      return;
    }
    createAnim(scene, `${animPrefix}${dir}`, textureKey, 10, -1);
  });
}

export function createIdleAnimations(
  scene: Phaser.Scene,
  animPrefix: string,
  texturePrefix: string = "player_idle_",
  fallbackPrefix: string = "player_idle_"
) {
  ALL_DIRECTIONS_8.forEach((dir) => {
    const phys = LOGICAL_TO_PHYSICAL[dir];
    const primary = `${texturePrefix}${phys}`;
    const fallback = `${fallbackPrefix}${phys}`;
    const textureKey = resolveTexture(scene, primary, fallback);
    if (!textureKey) return;
    createAnim(scene, `${animPrefix}${dir}`, textureKey, 6, -1);
  });
}

export function createDashAnimations(
  scene: Phaser.Scene,
  animPrefix: string,
  texturePrefix: string = "player_dash_",
  fallbackPrefix: string = "player_dash_"
) {
  ALL_DIRECTIONS_8.forEach((dir) => {
    const phys = LOGICAL_TO_PHYSICAL[dir];
    const primary = `${texturePrefix}${phys}`;
    const fallback = `${fallbackPrefix}${phys}`;
    const textureKey = resolveTexture(scene, primary, fallback);
    if (!textureKey) return;
    createAnim(scene, `${animPrefix}${dir}`, textureKey, 14, 0);
  });
}

export function createDeathAnimations(
  scene: Phaser.Scene,
  animPrefix: string,
  texturePrefix: string = "player_death_",
  fallbackPrefix: string = "player_death_"
) {
  ALL_DIRECTIONS_8.forEach((dir) => {
    const phys = LOGICAL_TO_PHYSICAL[dir];
    const primary = `${texturePrefix}${phys}`;
    const fallback = `${fallbackPrefix}${phys}`;
    const textureKey = resolveTexture(scene, primary, fallback);
    if (!textureKey) return;
    createAnim(scene, `${animPrefix}${dir}`, textureKey, 8, 0);
  });
}

export function createJumpAnimations(
  scene: Phaser.Scene,
  animPrefix: string,
  texturePrefix: string = "player_jump_",
  fallbackPrefix: string = "player_jump_"
) {
  ALL_DIRECTIONS_8.forEach((dir) => {
    const phys = LOGICAL_TO_PHYSICAL[dir];
    const primary = `${texturePrefix}${phys}`;
    const fallback = `${fallbackPrefix}${phys}`;
    const textureKey = resolveTexture(scene, primary, fallback);
    if (!textureKey) return;
    createAnim(scene, `${animPrefix}${dir}`, textureKey, 12, 0);
  });
}

/**
 * Combate usa Dash como base hasta tener sprites de ataque reales.
 * animPrefix: "player_attack_", "npc_attack_" etc.
 */
export function createCombatAnimations(
  scene: Phaser.Scene,
  animPrefix: string = "player_attack_",
  texturePrefix: string = "player_dash_",
  fallbackPrefix: string = "player_dash_"
) {
  ALL_DIRECTIONS_8.forEach((dir) => {
    const phys = LOGICAL_TO_PHYSICAL[dir];
    const primary = `${texturePrefix}${phys}`;
    const fallback = `${fallbackPrefix}${phys}`;
    const textureKey = resolveTexture(scene, primary, fallback);
    if (!textureKey) {
      console.warn(`[Animations] Combat texture faltante: ${primary}`);
      return;
    }
    const animKey = `${animPrefix}${dir}`;
    if (scene.anims.exists(animKey)) return;
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 7 }),
      frameRate: 16,
      repeat: 0,
    });
  });
}

// Sobrecarga compatible: si se pasa prefix sin "attack_" lo normaliza
export function createCombatAnimationsLegacy(scene: Phaser.Scene, prefix: string = "player_") {
  // prefix="player_" => animPrefix="player_attack_", texturePrefix="player_dash_"
  const animPrefix = prefix.endsWith("attack_") ? prefix : `${prefix}attack_`;
  createCombatAnimations(scene, animPrefix, "player_dash_", "player_dash_");
}

// ---------------------------------------------------------------------------
// API de alto nivel - registro escalable por humano
// ---------------------------------------------------------------------------

export interface HumanAnimationRegistration {
  /** Prefijo de animación: "walk_", "npc_walk_", "villager_walk_" etc. */
  animPrefix: string;
  /** Prefijo de textura: "player_walk_", "npc_walk_", "villager_walk_" */
  texturePrefix: string;
  fallbackPrefix?: string;
}

/**
 * Registra todas las categorías para un humano en una sola llamada.
 * Ejemplo: registerHumanAnimations(scene, "npc_", "npc_") crea npc_walk_*, npc_idle_*, npc_dash_*, npc_death_*, npc_attack_*
 * Si las texturas "npc_*" no existen, hace fallback a "player_*".
 */
export function registerHumanAnimations(
  scene: Phaser.Scene,
  animPrefix: string, // ej: "npc_", "villager_", "guard_", "" para player base
  texturePrefix: string = "player_" // ej: "npc_", "villager_", "player_"
) {
  const cleanAnim = animPrefix === "" ? "" : animPrefix.endsWith("_") ? animPrefix : `${animPrefix}_`;
  const cleanTex = texturePrefix === "" ? "" : texturePrefix.endsWith("_") ? texturePrefix : `${texturePrefix}_`;
  // Walk/Idle/Jump/Dash/Death/Attack con prefijos modulares - todas reutilizables por humanos
  createWalkAnimations(scene, `${cleanAnim}walk_`, `${cleanTex}walk_`, "player_walk_");
  createIdleAnimations(scene, `${cleanAnim}idle_`, `${cleanTex}idle_`, "player_idle_");
  createJumpAnimations(scene, `${cleanAnim}jump_`, `${cleanTex}jump_`, "player_jump_");
  createDashAnimations(scene, `${cleanAnim}dash_`, `${cleanTex}dash_`, "player_dash_");
  createDeathAnimations(scene, `${cleanAnim}death_`, `${cleanTex}death_`, "player_death_");
  createCombatAnimations(scene, `${cleanAnim}attack_`, `${cleanTex}dash_`, "player_dash_");
}

// ---------------------------------------------------------------------------
// Inicializador maestro - escalable, llamar una vez en MainScene.create()
// ---------------------------------------------------------------------------

export function initAllCharacterAnimations(scene: Phaser.Scene) {
  // Player (prefijo anim "walk_"/"idle_" y textura "player_*")
  registerHumanAnimations(scene, "", "player_"); // genera walk_*, idle_*, dash_*, death_*, attack_*
  // Compat: combate legacy esperaba "player_attack_*"
  createCombatAnimations(scene, "player_attack_", "player_dash_", "player_dash_");

  // NPC genérico / Survivor humano - reutiliza player si no hay npc_ textures
  registerHumanAnimations(scene, "npc_", "npc_");
  // Compat legacy para código que usa "npc_walk_" etc. ya cubierto arriba, extra para attack sin guión
  createCombatAnimations(scene, "npc_attack_", "npc_dash_", "player_dash_");

  // Ejemplo escalable: descomenta para añadir nuevo humano con sus propias texturas
  // Preloader: load "villager_walk_down" etc.
  // registerHumanAnimations(scene, "villager_", "villager_");
  // registerHumanAnimations(scene, "guard_", "guard_");
}

// Legacy exports para compatibilidad con código viejo (antes usaba rangos de frames en una sola tira)
export const WALK_DIRECTIONS_10 = ALL_DIRECTIONS_8.map((k) => ({ key: k, start: 0, end: 7 }));
export const ATTACK_DIRECTIONS_18 = ALL_DIRECTIONS_8.map((k) => ({ key: k, start: 0, end: 7 }));
