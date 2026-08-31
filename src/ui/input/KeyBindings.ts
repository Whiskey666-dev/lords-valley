import Phaser from "phaser";

/**
 * KeyBindings.ts - UI/Input - Sistema centralizado, modular y escalable para configurar teclas.
 * Ubicado en src/ui/input/ porque es configuración de interfaz, no lógica de juego.
 * Todas las funciones/animaciones y acciones del juego pasan por aquí vía InputSystem.
 * Persistencia: siempre vuelve a WASD por defecto al recargar (requisito).
 */

export type GameAction =
  | "move_up"
  | "move_down"
  | "move_left"
  | "move_right"
  | "jump"
  | "dash"
  | "attack"
  | "attackAlt"
  | "inventory"
  | "map"
  | "missions"
  | "stats"
  | "interact"
  | "close"
  | "cameraFollow";

export interface BindingInfo {
  label: string;
  category: "Movimiento" | "Acción" | "Combate" | "Sistema";
  defaultKey: string;
  description: string;
}

export const BINDING_INFOS: Record<GameAction, BindingInfo> = {
  move_up:    { label: "Mover Arriba",      category: "Movimiento", defaultKey: "W",     description: "Caminar arriba" },
  move_down:  { label: "Mover Abajo",       category: "Movimiento", defaultKey: "S",     description: "Caminar abajo" },
  move_left:  { label: "Mover Izquierda",   category: "Movimiento", defaultKey: "A",     description: "Caminar izquierda" },
  move_right: { label: "Mover Derecha",     category: "Movimiento", defaultKey: "D",     description: "Caminar derecha" },
  jump:       { label: "Saltar",            category: "Acción",     defaultKey: "SPACE", description: "jump_*" },
  dash:       { label: "Dash / Esquiva",    category: "Acción",     defaultKey: "SHIFT", description: "dash_*" },
  attack:    { label: "Ataque",            category: "Combate",    defaultKey: "F",     description: "player_attack_*" },
  attackAlt: { label: "Ataque Alt",        category: "Combate",    defaultKey: "Q",     description: "player_attack_* alt" },
  inventory: { label: "Inventario",        category: "Sistema",    defaultKey: "I",     description: "Abrir inventario (placeholder)" },
  map:       { label: "Mapa",              category: "Sistema",    defaultKey: "M",     description: "Abrir mapa (placeholder)" },
  missions: { label: "Misiones",          category: "Sistema",    defaultKey: "J",     description: "Abrir misiones (placeholder)" },
  stats:     { label: "Estadísticas",      category: "Sistema",    defaultKey: "P",     description: "Abrir stats (placeholder)" },
  interact: { label: "Interactuar",       category: "Acción",     defaultKey: "LEFT_CLICK", description: "Click izq entorno/NPC" },
  close:     { label: "Cerrar / Deseleccionar", category: "Sistema", defaultKey: "ESC", description: "Cerrar paneles" },
  cameraFollow: { label: "Cámara Seguir",  category: "Sistema",    defaultKey: "Y",     description: "Alternar seguir personaje / libre mouse" },
};

const STORAGE_KEY = "lordsvalley_keybindings_v1";

// loadStored eliminado: siempre se vuelve a WASD por defecto (requisito), no se persiste
let current: Record<GameAction, string> = (() => {
  // Requisito: siempre volver a WASD por defecto al recargar
  const def: Record<GameAction, string> = {} as Record<GameAction, string>;
  for (const k of Object.keys(BINDING_INFOS) as GameAction[]) def[k] = BINDING_INFOS[k].defaultKey;
  return def;
})();

const listeners = new Set<() => void>();

export function getBinding(action: GameAction): string {
  return current[action] ?? BINDING_INFOS[action].defaultKey;
}

export function getAllBindings(): Record<GameAction, string> {
  return { ...current };
}

export function setBinding(action: GameAction, key: string) {
  const normalized = normalizeKey(key);
  current[action] = normalized;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
  listeners.forEach(fn => fn());
}

export function resetBindings() {
  for (const k of Object.keys(BINDING_INFOS) as GameAction[]) current[k] = BINDING_INFOS[k].defaultKey;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function normalizeKey(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (upper === " " || upper === "SPACE" || upper === "SPACEBAR") return "SPACE";
  if (upper === "SHIFT" || upper === "SHIFTRIGHT" || upper === "SHIFTLEFT") return "SHIFT";
  if (upper === "CONTROL" || upper === "CTRL") return "CTRL";
  if (upper === "TAB") return "TAB";
  if (upper === "ESC" || upper === "ESCAPE") return "ESC";
  if (upper === "LEFT_CLICK" || upper === "MOUSELEFT") return "LEFT_CLICK";
  if (upper.length === 1) return upper;
  return upper;
}

export function displayKey(key: string): string {
  if (key === "SPACE") return "SPACE";
  if (key === "LEFT_CLICK") return "Click Izq";
  return key;
}

const pressedKeys = new Set<string>();
const justPressedKeys = new Set<string>();
let isRebinding = false;
let isConsoleOpen = false;
let isInventoryOpen = false;

export function setInventoryOpen(value: boolean) {
  isInventoryOpen = value;
  if (value) {
    pressedKeys.clear();
    justPressedKeys.clear();
  }
}

export function isInventoryOpenActive(): boolean {
  return isInventoryOpen;
}

export function setRebinding(value: boolean) {
  isRebinding = value;
  if (value) justPressedKeys.clear();
}

export function isRebindingActive(): boolean {
  return isRebinding;
}

export function setConsoleOpen(value: boolean) {
  isConsoleOpen = value;
  if (typeof window !== "undefined") {
    (window as unknown as { __lordsConsoleOpen?: boolean }).__lordsConsoleOpen = value;
  }
  if (value) {
    pressedKeys.clear();
    justPressedKeys.clear();
  }
}

export function isConsoleOpenActive(): boolean {
  if (isConsoleOpen) return true;
  if (typeof window !== "undefined" && (window as unknown as { __lordsConsoleOpen?: boolean }).__lordsConsoleOpen) return true;
  if (typeof document !== "undefined") {
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return true;
  }
  return false;
}

export function isGameInputBlocked(): boolean {
  if (isRebinding || isConsoleOpen || isInventoryOpen) return true;
  // Fallback robusto: si un input/textarea está enfocado, bloquear juego para priorizar escritura
  // Esto cubre casos donde el flag aún no se sincronizó o hay duplicación de módulo
  if (typeof document !== "undefined") {
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return true;
  }
  // Backup global por si hay instancia duplicada del módulo (HMR/Vite)
  if (typeof window !== "undefined" && (window as unknown as { __lordsConsoleOpen?: boolean }).__lordsConsoleOpen) return true;
  return false;
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (isGameInputBlocked()) return;
    const norm = normalizeKey(e.key === " " ? "SPACE" : e.key);
    if (!pressedKeys.has(norm)) {
      justPressedKeys.add(norm);
      queueMicrotask(() => {
        setTimeout(() => justPressedKeys.delete(norm), 0);
      });
    }
    pressedKeys.add(norm);
  });
  window.addEventListener("keyup", (e) => {
    const norm = normalizeKey(e.key === " " ? "SPACE" : e.key);
    pressedKeys.delete(norm);
    justPressedKeys.delete(norm);
  });
  window.addEventListener("blur", () => {
    pressedKeys.clear();
    justPressedKeys.clear();
  });
}

function phaserKeyCode(key: string): number | null {
  if (key === "LEFT_CLICK") return null;
  const upper = key.toUpperCase();
  const map: Record<string, number> = {
    "SPACE": Phaser.Input.Keyboard.KeyCodes.SPACE,
    "SHIFT": Phaser.Input.Keyboard.KeyCodes.SHIFT,
    "CTRL": Phaser.Input.Keyboard.KeyCodes.CTRL,
    "ALT": Phaser.Input.Keyboard.KeyCodes.ALT,
    "TAB": Phaser.Input.Keyboard.KeyCodes.TAB,
    "ESC": Phaser.Input.Keyboard.KeyCodes.ESC,
    "ENTER": Phaser.Input.Keyboard.KeyCodes.ENTER,
    "BACKSPACE": Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
  };
  if (map[upper] !== undefined) return map[upper];
  if (upper.length === 1 && upper >= "A" && upper <= "Z") {
    return Phaser.Input.Keyboard.KeyCodes[upper as keyof typeof Phaser.Input.Keyboard.KeyCodes];
  }
  if (upper.length === 1 && upper >= "0" && upper <= "9") {
    return Phaser.Input.Keyboard.KeyCodes[upper as keyof typeof Phaser.Input.Keyboard.KeyCodes];
  }
  const kc = (Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>)[upper];
  return kc ?? null;
}

export function isActionDown(_scene: Phaser.Scene, action: GameAction): boolean {
  if (isGameInputBlocked()) return false;
  const key = getBinding(action);
  if (key === "LEFT_CLICK") return !!_scene?.input?.activePointer?.isDown;
  return pressedKeys.has(key);
}

export function isActionJustDown(_scene: Phaser.Scene, action: GameAction): boolean {
  if (isGameInputBlocked()) return false;
  const key = getBinding(action);
  if (key === "LEFT_CLICK") return false;
  if (justPressedKeys.has(key)) {
    queueMicrotask(() => justPressedKeys.delete(key));
    return true;
  }
  return false;
}

export function captureAllBindings(scene: Phaser.Scene) {
  const codes: number[] = [];
  for (const action of Object.keys(current) as GameAction[]) {
    const code = phaserKeyCode(current[action]);
    if (code !== null) codes.push(code);
  }
  scene.input.keyboard?.addCapture(codes);
  subscribe(() => {
    const newCodes: number[] = [];
    for (const a of Object.keys(current) as GameAction[]) {
      const c = phaserKeyCode(current[a]);
      if (c !== null) newCodes.push(c);
    }
    scene.input.keyboard?.addCapture(newCodes);
  });
}
