# ui/input / Context — KeyBindings (Singleton Canónico)

## Propósito
**Fuente de verdad** del input remapable. Define 16 acciones, defaults, helpers, buffers y flags de bloqueo. Adaptado por `game/systems/InputSystem` para Phaser.

## Archivo Real
| Archivo | Líneas | Rol |
|---|---|---|
| `KeyBindings.ts:1` | 251 | Singleton. Ver § Lógica. |

## Lógica — `KeyBindings.ts:1` (251 líneas)

**`GameAction:10` 16 acciones:** `move_up/down/left/right, jump, dash, attack, attackAlt, inventory, map, missions, stats, tutorial, interact, close, cameraFollow (Y)`

**`BINDING_INFOS:35`:** por acción `{label, category Movimiento|Acción|Combate|Sistema, defaultKey, description}` defaults `WASD, SPACE, SHIFT, F/Q, I/M/J/P, TAB, LEFT_CLICK, ESC, Y`

**Storage `STORAGE_KEY:54` `lordsvalley_keybindings_v1`** — `loadStored` eliminado a propósito (requisito siempre vuelve a WASD). Constructor `57` ignora stored, genera defaults `BINDING_INFOS[k].defaultKey`. `setBinding` sí persiste `localStorage.setItem`, `resetBindings` limpia y notifica listeners.

**State:** `current:Record<GameAction,string>`, `listeners:Set<()=>void>`, `getBinding/getAllBindings/setBinding/resetBindings/subscribe`

**Helpers:** `normalizeKey:92` (SPACE/SHIFT/CTRL/TAB/ESC/LEFT_CLICK toUpper, 1-char), `displayKey:104` (`SPACE→SPACE, LEFT_CLICK→Click Izq else Upper`), `phaserKeyCode:194` mapeo string→`Phaser.Input.Keyboard.KeyCodes` (SPACE/SHIFT/CTRL/ALT/TAB/ESC/ENTER/BACKSPACE + A-Z/0-9 + fallback keycode map) para `captureAllBindings`.

**Input Buffers `110-169`:**
- `pressedKeys Set<string>`, `justPressedKeys Set<string>`, flags `isRebinding/isConsoleOpen/isInventoryOpen` + `window.__lordsConsoleOpen` global HMR
- `setInventoryOpen/isInventoryOpenActive` (PlayerInventoryPanel), `setRebinding/isRebindingActive` (KeybindsEditor), `setConsoleOpen/isConsoleOpenActive` (Console + `document.activeElement INPUT/TEXTAREA/contentEditable`), `isGameInputBlocked()` true si `rebinding||consoleOpen||inventoryOpen||activeElement input||window.__lordsConsoleOpen`
- Listeners globales `window keydown/keyup/blur`: `justPressed` auto-clear `queueMicrotask+setTimeout0`, `pressed` set/delete, blur clear.
- `isActionDown/JustDown:218-234` check `LEFT_CLICK via scene.input.activePointer.isDown` else `pressedKeys/justPressedKeys has getBinding(action)`; `JustDown` consume `justPressedKeys`.
- `captureAllBindings:236` → `scene.input.keyboard.addCapture(codes)` + `subscribe` re-capturar al cambiar bindings.

**Consumido por:** `hooks/app/useAppController` (TAB/I), `game/systems/InputSystem` (adapter), `game/scenes/MainScene` (`isGameInputBlocked`), `ui/menus/*` (displayKey/getBinding), `characters/Player`.

## Flags de Bloqueo
- `setConsoleOpen` console/chat ENTER
- `setInventoryOpen` `PlayerInventoryPanel`
- `setRebinding` `KeybindsEditor` editing
- `isGameInputBlocked()` → `MainScene.update:265 keyboard.enabled = !blocked + resetKeys`, `Player.updateEntity:75 velocity 0 idle`

## Re-exports
- `game/input/KeyBindings.ts:5` deprecated re-export
- `game/systems/InputSystem.ts` importa `isActionDown/JustDown`, `captureAllBindings`, `getBinding`, `isGameInputBlocked`

## Para Repomix
Nueva `GameAction` → añadir en `GameAction` union + `BINDING_INFOS` + wrapper `InputSystem.isXJustPressed`. Respetar `isGameInputBlocked()` en todo input gameplay. `STORAGE_KEY` existe pero constructor resetea — no intentar `loadStored`.
