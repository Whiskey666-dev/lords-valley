# ui/input / Context — KeyBindings (Singleton Canónico)

## Propósito
**Fuente de verdad** del input remapable. Define todas las acciones del juego, defaults, persistencia y bloqueo. Ver `ui/context.md` para detalle completo — este archivo es el índice del submódulo.

## Archivo
- `KeyBindings.ts:1` — singleton con `GameAction` (15), `BINDING_INFOS`, `current`, `pressedKeys/justPressedKeys`, flags `isRebinding/isConsoleOpen/isInventoryOpen`, `isGameInputBlocked`, `normalizeKey/displayKey/phaserKeyCode`, `isActionDown/JustDown`, `captureAllBindings`.

## Flags de bloqueo
- `setConsoleOpen/isConsoleOpenActive` — consola/chat (ENTER).
- `setInventoryOpen/isInventoryOpenActive` — panel de inventario del jugador (`ui/inventory/PlayerInventoryPanel`).
- `isGameInputBlocked()` true si `isRebinding || isConsoleOpen || isInventoryOpen || document.activeElement is input/textarea/contentEditable || window.__lordsConsoleOpen`.

## Re-exports
- `game/input/KeyBindings.ts` y `game/systems/InputSystem.ts` re-exportan/consumen desde aquí.

## Para Repomix
Toda nueva `GameAction` se agrega aquí + `BINDING_INFOS`. Respetar `isGameInputBlocked()` en cualquier input de gameplay. `STORAGE_KEY:52` persiste pero constructor resetea a defaults a propósito.
