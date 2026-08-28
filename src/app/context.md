# app / Context — Root React + Puente Phaser-React

## Propósito
`app/` es el **root de la aplicación React**. Monta el juego Phaser, posee todo el estado de overlay UI y traduce eventos DOM <-> Phaser mediante `window.CustomEvent`. Es el único lugar donde `Phaser.Game` se instancia y se destruye.

## Archivo Clave
- `App.tsx:9` `function App()` — 111 líneas, único componente del módulo.

## Estado que Posee (`App.tsx:10-13`)
```ts
gameRef: useRef<Phaser.Game | null>    // singleton Phaser
selectedNPC: NpcPanelData | null       // NPC seleccionado para NpcPanel
showTutorial: boolean                   // visibilidad TutorialPanel
zoom: number 0..100                    // 0% alejar - 50% default(zoom 1.0) - 100% acercar
```

## Lógica / Event Wiring (`App.tsx:15-53`)
### Montaje Phaser
```ts
useEffect(() => { if (!gameRef.current) gameRef.current = startLaunchGame(); ... destroy on unmount }, [])
```
`startLaunchGame()` viene de `game/main.ts:26`.

### Eventos Phaser -> React (`App.tsx:20-40`)
| Evento escuchado | Origen Phaser | Handler |
|---|---|---|
| `phaser-npc-selected` | `characters/Survivor.ts:103` + `game/scenes/MainScene.ts:136` | `setSelectedNPC(detail)` |
| `phaser-npc-deselected` | `game/scenes/MainScene.ts:139` (click suelo / ESC) | `setSelectedNPC(null)` |
| `phaser-toggle-tutorial` | `game/scenes/MainScene` (TAB) | `setShowTutorial(prev=>!prev)` |
| `phaser-zoom-sync` | `game/scenes/MainScene.ts:58` (rueda ctrl) | `setZoom(detail)` |
| `wheel` (ctrl) | DOM | `e.preventDefault()` para evitar zoom del navegador |

### Eventos React -> Phaser
- `phaser-zoom-set` con `detail: number 0..100` — disparado por `handleZoomIn/Out:71,78` (step 10) y consumido en `game/scenes/MainScene.ts:58`.

### TAB Global (`App.tsx:56-67`)
Handler `keydown` que respeta `isRebindingActive()` y `isConsoleOpenActive()` (de `ui/input/KeyBindings.ts`), usa `getBinding("tutorial")` remapable, togglea tutorial.

## Render (`App.tsx:86-107`)
```
<div flex column 100vw 100vh>
  <Navbar zoom onToggleTutorial onZoomIn onZoomOut />   // ui/menus/Navbar.tsx
  <div hint> Click Izq • {tutorialKey} • {closeKey}</div>
  <TutorialPanel show onClose />                         // ui/menus/TutorialPanel.tsx
  <Console />                                            // ui/menus/Console.tsx
  <div flex 1>
    <div id="game-container" flex 1 />   // parent de Phaser.Game (game/main.ts:10)
    {selectedNPC && <NpcPanel npc onClose />} // ui/character/NpcPanel.tsx
  </div>
</div>
```
- `Navbar` delgada 32px, `TutorialPanel` absoluto `top:36 left:12`, `NpcPanel` fixed `right:0 top:32 width:380`.

## Dependencias
- **Importa de:** `game/main` (`startLaunchGame`), `ui/input/KeyBindings` (`getBinding, displayKey, isRebindingActive, isConsoleOpenActive`), `ui/menus/TutorialPanel`, `ui/menus/Navbar`, `ui/menus/Console`, `ui/character/NpcPanel`
- **No importa:** `characters/*`, `combat/*`, `world/*` — desacoplado vía eventos.
- **Provee a:** `main.tsx` (es el `App` renderizado en `createRoot`)

## Flujo de Datos
```
Phaser (Survivor click / MainScene) --CustomEvent--> window --addEventListener--> App state (useState)
App state --render--> React UI (NpcPanel/Navbar)
React UI (zoom btn / TAB) --CustomEvent--> window --addEventListener--> MainScene (camera zoom)
```

## Para Repomix
Este módulo es el **contrato de integración**. Cualquier nuevo evento Phaser<->React debe agregarse aquí siguiendo el patrón existente. No agregar lógica de juego aquí — delegar a `game/` o `ui/`.
