# src/hooks/menu/context.md — Hooks de Menú y Configuración

> Hooks para la barra de navegación, consola de desarrollador y configuración del juego.

## `useNavbar.ts`
- `leftButtons[]` + `rightButtons[]`: botones de la barra superior 32px
- `dispatchAction(action)`: emite `phaser-action-{action}` al bus de Phaser
- `zoom` (0–100): sincronizado con `phaser-zoom-sync`; input → `phaser-zoom-set`
- Abre: Settings, Inventory, Followers, Buildings/Construction, Map, Missions, Skills, Characters

## `useConsole.ts`
- Estado: `open`, `mode` (chat | console), `input`, `history[]`, `feedback`, `menuOpen`, `godMode`
- **Convención**: aliados con `create` (Npc), enemigos con `spawn` (Mobs)
- **Comandos disponibles** (modo consola, todos los mutantes validados por el servidor con JWT):
  - `createNpc1..10` → `POST /player/me/dev/spawn-allow` + dispatch `phaser-create-npcs {count}`
  - `createDeadDragon1..5` (aliado, sin A/E) / `spawnDeadDragon1..5` (enemigo) → spawn-allow + `phaser-create-dead-dragons {count, isAlly}`
  - `spawnGhost1..3` / `spawnGhost` → spawn-allow + `phaser-create-ghosts {count}` (servidor genera vía WS)
  - `menu` → abre `CommandMenuPanel` (Npc/Mobs/Items/Dev desde `consoleCommands.ts`)
  - `GodModeOn` / `GodModeOff` → `POST /player/me/dev/godmode` + `phaser-godmode` (el servidor rechaza daño con `god_mode`)
  - `FullMode` → `POST /player/me/dev/fullmode` + evento `player-skills-changed` (las 48 al nivel 100)
  - `addItem:<Item><1-9>` → `POST /player/me/inventory/add` (JWT; el servidor valida catálogo y cantidad)
  - `addItem:Pergamino/<Escuela><1-9>` → mismo endpoint con `escuela` (el servidor valida el alias)
  - Niebla, modos creativo/supervivencia, `help`
  - Texto libre (modo chat) → dispatch `phaser-chat-bubble` sobre el jugador
- Formatos antiguos (`createGhost*`, `createDeadDragonA/E*`) responden con redirección al nuevo comando, sin spawnear
- Solo la consola del juego muta estado, y siempre vía API validada. Editar `localStorage`/DOM desde la consola del navegador no tiene efecto.
- Bloquea input del juego cuando está abierta (`setConsoleOpen(true)`)
- Cierra con Escape (si `menuOpen`, Escape cierra primero el panel), ejecuta con Enter

## `consoleCommands.ts`
- `COMMAND_CATALOG` canónico + `commandsByCategory()` para el panel `menu` y `help`
- Sin repeticiones por cantidad: cada entrada con `qty {min,max}` despliega selector en el panel (Npc 1-10/1-5, Mobs 1-5/1-3, Items 1-9); Items trae 3 ejemplos del catálogo + los 6 pergaminos de escuela

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
