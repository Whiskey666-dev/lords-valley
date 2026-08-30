# ui/menus / Context — Menús y Overlays Principales

## Propósito
Menús persistentes React: navegación, consola/chat, tutorial/rebinding y configuración categorizada. Todos desacoplados vía `hooks/menu/*` y `ui/input/KeyBindings`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `Navbar.tsx:36` | 175 | Barra `32px #0f0f0f` 3 secciones + `hooks/menu/useNavbar`. Props `zoom/onZoomIn/Out, onOpenSettings/onToggleInventory/Followers/Buildings/Map, is*Open`. `btnBase #1e1e1e #bbb 10px 600`. Izq zoom `−/+` label `zoom%` + `leftButtons` (Seguidores/Edificios) active `1e3322 #00ff88`, centro Construcción verde `2e7d32` `dispatchAction("construction")→phaser-action-construction`, der `rightButtons` (Misiones/Inventario/Mapa/Config) active `1e2a33 #8cf`. `useNavbar` provee `leftButtons/rightButtons/dispatchAction`. |
| `Console.tsx:7` | 157 | Consola dual `chat|console` vía `hooks/menu/useConsole`. `open false→return null` (sin hint flotante). Si `open` render `absolute bottom:0 0a0af2 backdrop blur 4` toggle `Chat|Consola` (verde/blue active), input `mono 12px #1a1a1a` placeholder `createNpc1..10 | ENTER ejecutar` + burbuja chat, `execute`/`closeConsole` handlers, feedback+history `maxHeight 60` 8 líneas. **Bloquea** vía `setConsoleOpen` → `isGameInputBlocked`. |
| `TutorialPanel.tsx:12` | 43 | Panel `absolute top36 left12 width360 #151515f2 #333 radius10` con header Tutorial + `✕` + hint `Click izquierdo` + `KeybindsEditor`. `show false→null`, abre TAB. |
| `KeybindsEditor.tsx:10` | 50 | Editor reutilizable. `useKeybindsEditor()` → `bindings, pending, editing, setEditing, hasChanges, handleSave/Cancel/Reset`. Header editing amarillo `Presiona tecla...`, pending verde `Cambios pendientes Guardar`. Lista `BINDING_INFOS` scroll `340` rows `space-between` `5px 8px` active `2a2a33` changed `1f2a1f`, botón `86px` `displayKey(pending[action])` border gold/green, disabled `interact`. Footer `Guardar/Cancelar/Reset`. Usado por `TutorialPanel` y `SettingsPanel teclado`. |
| `SettingsPanel.tsx:27` | 140 | Panel modal `fixed center 640 94vw 82vh #151515` `z200` `12 radius`. Sidebar `150px #101010` categories via `hooks/menu/useSettingsPanel`: `graficos/teclado/guardado/cuenta/inicio/cerrar` (6). `btnStyle 100% 10px 12 700 #1e1e1e`. Contenido `category==="graficos"→GraphicsSettingsTab(fps,render,sombras,liquidos,particulas)`, `teclado→KeybindsEditor`, `guardado→SaveSettingsTab(1 partida default)`, `cuenta→AccountSettingsTab(Google/Lords)`, `inicio/cerrar` disabled placeholders. Header icon+label + `✕`. ESC/`onClose`. |
| `components/GraphicsSettingsTab.tsx` | 103 | Controles FPS/Render/Sombras/Líquidos/Partículas. |
| `components/SaveSettingsTab.tsx` | 54 | 1 partida default + Nueva Partida. |
| `components/AccountSettingsTab.tsx` | 43 | Google / Lords Valley Account. |

## Hooks asociados
- `hooks/menu/useNavbar:51` → `leftButtons,rightButtons,dispatchAction` (emite `phaser-action-*` + `onOpenSettings` etc)
- `hooks/menu/useConsole:137` → `open,mode,switchMode,input,setInput,history,feedback,inputRef,execute,closeConsole` (regex `createnpc1..10`→`phaser-create-npcs`, chat→`phaser-chat-bubble`, phaser-npcs-spawned history)
- `hooks/menu/useKeybindsEditor:72` → rebinding `pending[editing]=normalizeKey`, `setRebinding(editing!==null)`, save loop `setBinding`
- `hooks/menu/useSettingsPanel:49` → `category,setCategory,fps,setFps,renderizado,setRenderizado,sombras,setSombras,liquidos,toggleLiquidos,particulas,setParticulas,categories,currentCategory`

## Para Repomix
Nuevo menú (ej. `PauseMenu`) → componente React controlado por `useAppController` state o evento, sin imports Phaser, usando `KeyBindings`. Nueva categoría Settings → añadir entrada `CATEGORIES` en `useSettingsPanel`.
