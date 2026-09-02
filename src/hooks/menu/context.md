# src/hooks/menu/context.md — Hooks de Menú y Configuración

> Hooks para la barra de navegación, consola de desarrollador y configuración del juego.

## `useNavbar.ts`
- `leftButtons[]` + `rightButtons[]`: botones de la barra superior 32px
- `dispatchAction(action)`: emite `phaser-action-{action}` al bus de Phaser
- `zoom` (0–100): sincronizado con `phaser-zoom-sync`; input → `phaser-zoom-set`
- Abre: Settings, Inventory, Followers, Buildings/Construction, Map, Missions, Skills, Characters

## `useConsole.ts`
- Estado: `open`, `mode` (chat | console), `input`, `history[]`, `feedback`
- **Comandos disponibles**:
  - `createnpc [1-10]` → dispatch `phaser-create-npcs {count}`
  - Texto libre → dispatch `phaser-chat-bubble` sobre el jugador
- Bloquea input del juego cuando está abierta (`setConsoleOpen(true)`)
- Cierra con Escape, ejecuta con Enter

## `useSettingsPanel.ts`
- Estado: `activeTab` (Graphics / Save / Account)
- **Graphics tab**: FPS límite, calidad de renderizado, sombras, líquidos, partículas
- **Save tab**: 1 slot de guardado + botón Nueva Partida
- **Account tab**: desconexión de cuentas Google/Lords

## `useKeybindsEditor.ts`
- Edita los 16 bindings de `ui/input/KeyBindings`
- Estado: `pendingBindings`, `rebinding: GameAction | null`
- `handleReset()`: restaura defaults
- `handleSave()`: persiste en `localStorage`
- Mientras `rebinding !== null`, `isGameInputBlocked()` retorna `true`
