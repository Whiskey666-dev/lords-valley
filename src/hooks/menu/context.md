# src/hooks/menu/context.md — Hooks de Menú y Configuración

> Hooks para la barra de navegación, consola de desarrollador y configuración del juego.

## `useNavbar.ts`
- `leftButtons[]` + `rightButtons[]`: botones de la barra superior 32px
- `dispatchAction(action)`: emite `phaser-action-{action}` al bus de Phaser
- `zoom` (0–100): sincronizado con `phaser-zoom-sync`; input → `phaser-zoom-set`
- Abre: Settings, Inventory, Followers, Buildings/Construction, Map, Missions, Skills, Characters

## `useConsole.ts`
- Estado: `open`, `mode` (chat | console), `input`, `history[]`, `feedback`
- **Comandos disponibles** (modo consola):
  - `addItem:<Item><1-9>` → `POST /player/me/inventory/add` (JWT; el servidor valida catálogo y cantidad)
  - `addItem:Pergamino/<Escuela><1-9>` → mismo endpoint con `escuela` (el servidor valida el alias)
  - `createnpc [1-10]` → dispatch `phaser-create-npcs {count}`
  - Niebla, fantasmas, modos creativo/supervivencia, `help`
  - Texto libre (modo chat) → dispatch `phaser-chat-bubble` sobre el jugador
- Solo la consola del juego muta estado, y siempre vía API validada. Editar `localStorage`/DOM desde la consola del navegador no tiene efecto.
- Bloquea input del juego cuando está abierta (`setConsoleOpen(true)`)
- Cierra con Escape, ejecuta con Enter

## `useSettingsPanel.ts`
- Estado: `activeTab` (Graphics / Save / Account)
- **Graphics tab**: FPS límite, calidad de renderizado, sombras, líquidos, partículas
- **Save tab**: 1 slot de guardado + botón Nueva Partida
- **Account tab**: desconexión de cuentas Google/Lords

## `useKeybindsEditor.ts`
- Edita los 15 bindings de `ui/input/KeyBindings`
- Estado: `pendingBindings`, `rebinding: GameAction | null`
- `handleReset()`: restaura defaults
- `handleSave()`: persiste en `localStorage`
- Mientras `rebinding !== null`, `isGameInputBlocked()` retorna `true`
