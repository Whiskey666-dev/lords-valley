# ui / Context — Interfaz React (Overlay sobre Phaser)

## Propósito
**Capa React completa** que renderiza sobre el canvas Phaser. Gestiona input remapable, navegación, consola/comandos, chat y paneles de inspección. No contiene lógica de juego — solo presentación y puente de eventos.

## Estructura
```
ui/
  input/KeyBindings.ts      // CANÓNICO singleton de bindings
  menus/Navbar.tsx          // barra superior 32px
  menus/Console.tsx         // consola + chat (ENTER)
  menus/TutorialPanel.tsx   // tutorial + editor de teclas
  menus/KeybindsEditor.tsx  // editor de teclas reutilizable
  menus/SettingsPanel.tsx   // panel de configuración categorizado
  character/NpcPanel.tsx    // ficha NPC
  inventory/PlayerInventoryPanel.tsx // inventario del jugador (grid + filtros)
```

## Lógica — `ui/input/KeyBindings.ts:1` (CANÓNICO, no `game/input`)
**`GameAction:10`** 15 acciones: `move_up/down/left/right, jump, dash, attack, attackAlt, inventory, map, missions, stats, tutorial, interact, close`

**`BINDING_INFOS:34`** por acción `{label, category, defaultKey, description}` defaults `WASD, SPACE, SHIFT, F/Q, I/M/J/P, TAB, LEFT_CLICK, ESC`

**Storage `STORAGE_KEY:52`** `lordsvalley_keybindings_v1` — `loadStored()` existe pero constructor `66` **ignora stored a propósito** (siempre resetea a WASD al recargar). `setBinding` sí persiste, `resetBindings` limpia.

**Estado:** `current:Record<GameAction,string>`, `listeners:Set`, `getBinding/getAllBindings/setBinding/resetBindings/subscribe`

**Helpers:** `normalizeKey:101` (toUpper), `displayKey:113` (SPACE->"Espacio", LEFT_CLICK->"Click Izq"), `phaserKeyCode:190` (mapea a `Phaser.Input.Keyboard.KeyCodes` para `captureAllBindings`)

**Input Buffers `119-188`:**
- `pressedKeys:Set<string>`, `justPressedKeys:Set<string>`, flags `isRebinding`, `isConsoleOpen`, `isInventoryOpen` (+ `window.__lordsConsoleOpen` global para HMR safety)
- `setRebinding/isRebindingActive/setConsoleOpen/isConsoleOpenActive/setInventoryOpen/isInventoryOpenActive/isGameInputBlocked`
- `isGameInputBlocked()` true si `rebinding || consoleOpen || inventoryOpen || document.activeElement is input/textarea/contentEditable || window.__lordsConsoleOpen`
- Listeners globales `keydown/keyup/blur` manejan sets, `justPressed` auto-clear `queueMicrotask+setTimeout0`
- `isActionDown/JustDown:214-230` check `LEFT_CLICK` via `scene.input.activePointer.isDown`
- `captureAllBindings:232` -> `scene.input.keyboard.addCapture(codes)` + subscribe para re-capturar al cambiar

**Consumido por:** `app/App.tsx`, `game/systems/InputSystem.ts`, `game/scenes/MainScene.ts`, `ui/menus/*`

## Lógica — `ui/menus/Navbar.tsx:16`
`function Navbar({onToggleTutorial,zoom,onZoomIn,onZoomOut})` — barra 32px `#0f0f0f` 3 secciones:
- Izq: zoom `−`/`+` + label `${zoom}%` (0..100 mapeado a camera 0.6..1.6) + `Seguidores/Edificios`
- Centro: **Construcción** verde `#2e7d32` (destacado)
- Der: `Misiones[I]/Inventario[I]/Mapa[M]/Configuración(blue)`
`handle(action):17` -> `dispatchEvent(new CustomEvent("phaser-action-${action}"))` + `onToggleTutorial` para config.

## Lógica — `ui/menus/Console.tsx:14`
`function Console()` — dual mode `chat|console`, estados `open, mode, input, history, feedback, inputRef:20`
- Effects: `setConsoleOpen(open)` + auto-focus double timeout, `focusin` listener, global `keydown:61` (ESC cierra si open, ENTER abre si closed, respeta `isRebindingActive`), `phaser-npcs-spawned` append history
- `execute(raw):89`: empty -> close; chat mode: `createnpc` warn switch, else `phaser-chat-bubble` + history `💬`; console mode: regex `^createnpc\s*([1-9]|10)$:116` -> `phaser-create-npcs {count}`, `help`, else hint
- Render `152-257`: closed hint `ENTER para Chat/Consola`, open barra `bottom:0` con toggles verde/blue, input con `stopPropagation`, placeholder hints, Execute/✕, feedback+history 8 líneas.
- **Bloquea input de juego** vía `KeyBindings.setConsoleOpen`.

## Lógica — `ui/menus/TutorialPanel.tsx:15`
`function TutorialPanel({show,onClose})` — `bindings, pending, editing:GameAction|null:16-18`
- Effects sync `setRebinding(editing!==null)`, reset `pending` on show, subscribe bindings
- `keydown:38` captura `SPACE/SHIFT/TAB/ESC` normalize, ESC cancela, else `pending[editing]=norm`
- `hasChanges`, `handleSave:62` loop `setBinding`, `handleCancel`, `handleReset`
- Render `86-129`: absoluto `top:36 left:12 width:360`, hint `Click izquierdo`, banners editing amarillo / changes verde, scroll `maxHeight280` rows `TutorialPanel.tsx:102` con label + botón `86px` `displayKey(pending[action])` border gold/green, disabled `interact`.

## Lógica — `ui/character/NpcPanel.tsx:33`
`function NpcPanel({npc,onClose})` — `NpcPanelData:3` `{id,name,profession,loyalty,health,edad,traits,personalidad,temperamento,habilidad,gustos,inventario,equipamiento,habilidades,stats,needs}` compat `nombre/profesion:50-53`
- State `tab inventario|equipamiento|habilidades`, `showAllInventory`
- Render fixed `right:0 top:32 bottom:0 width:380` `#151515` borderLeft green
  - Header nombre + ✕ `59`
  - Card `62` avatar, edad, profesion, personalidad, traits, gustos, loyalty bar `71-74` gold 100 else `#4caf50`, health bar `75-78` red `#e53935`
  - Tabs `84` 3 botones flex
  - **Inventario `107`:** `VISIBLE_LIMIT=4`, `needsExpansion`, `visibleItems`, `+N más ocultos`, btn `Abrir Inventario Completo (N más)`/`Mostrar menos`, overflow `maxHeight140`
  - **Equipamiento `150`:** list + stats `salud/energia`
  - **Habilidades `165`:** especialidad + 8 skills + needs `hambre/sed/sueño`
- Abierto por `app/App.tsx:105` en `phaser-npc-selected`, cerrado por `phaser-npc-deselected` / ESC / click suelo.

## Flujo Global UI
```
game/MainScene -> window event -> app/App state -> ui/* render
ui/* user action -> window event -> game/MainScene
ui/input/KeyBindings singleton --isGameInputBlocked--> game/MainScene.update + characters/Player.updateEntity
```

## Dependencias
- **Importa de:** `React`, `ui/input/KeyBindings`, `characters/*` (tipos `NpcPanelData` vía `Survivor`)
- **No importa:** `Phaser` directamente (excepto `KeyBindings.phaserKeyCode` tipado)
- **Provee a:** `app/App.tsx` (componentes), `game/systems/InputSystem` (bindings)

## Para Repomix
Nuevos paneles: seguir patrón `NpcPanel` (fixed overlay, `onClose` dispatch deselect). Nuevas acciones: agregar `GameAction` en `KeyBindings.ts` + `BINDING_INFOS` + wrapper `InputSystem`. Respetar `isGameInputBlocked` en todo input de juego. `Navbar` es el lugar para nuevos botones de acción global.
