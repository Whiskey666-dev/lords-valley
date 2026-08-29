# game / Context — Orquestador Phaser (Core del Juego)

## Propósito
**Corazón del juego.** Configura Phaser, carga assets, crea la escena principal, spawnea entidades, maneja cámara/zoom, colisiones, input y debug. Es el único módulo con `Phaser.Scene`.

## Archivos
| Archivo | Rol |
|---|---|
| `main.ts:6` | `GameConfig` + `startLaunchGame(): Phaser.Game`. |
| `scenes/Preloader.ts:43` | `class Preloader extends Phaser.Scene` — carga spritesheets. |
| `scenes/MainScene.ts:12` | `class MainScene extends Phaser.Scene` — **~127 líneas, orquesta** delegando en `game/systems/*`. |
| `systems/InputSystem.ts:1` | Capa de desacople input. Lee `ui/input/KeyBindings`. |
| `systems/CameraSystem.ts:1` | `setupCamera`/`updateCamera` — bounds, zoom, centrado manual. |
| `systems/SpawnSystem.ts:1` | `getCenterSpawn`/`spawnNpcs` — posiciones aleatorias radio 200. |
| `systems/ChatBubbleSystem.ts:1` | clase `ChatBubbleSystem` — burbuja de chat. |
| `systems/InteractionSystem.ts:1` | `setupInteraction` — pointerdown NPC select/deselect. |
| `input/KeyBindings.ts:1` | Re-export deprecated `export * from "../../ui/input/KeyBindings"` — canónico en `ui/input`. |

## Lógica — `game/main.ts:6`
```ts
config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, width:800, height:600, parent:'game-container',
  physics: { default:'arcade', arcade:{ gravity:{x:0,y:0}, debug:true, debugShowVelocity:true, debugVelocityColor:0x00ff00 } },
  scene: [Preloader, MainScene]
}
startLaunchGame() => new Phaser.Game(config) // llamado desde app/App.tsx:16
```
- `gravity 0,0` top-down. `debug:true` muestra velocidades (verde).

## Lógica — `scenes/Preloader.ts:43`
- `preload():48` carga **24 spritesheets 48x64** via Vite imports:
  `player_walk_down/up/right_down/...`, `player_idle_*`, `player_dash_*`, `player_death_*`, `player_jump_*` (`Preloader.ts:54-91` `load.spritesheet({frameWidth:48, frameHeight:64})`)
- `create():97` -> `scene.start("MainScene")`

## Lógica — `scenes/MainScene.ts:12` (orquestador, delegado a sistemas)
**Campos:** `player: Player`, `npcs: Survivor[]`, `chatSystem: ChatBubbleSystem`, getter `npc`.

**`create():21`:**
1. `setupWorld()` — `physics.world.setBounds(0,0,2000,2000)` + grid via `Graphics` estático (eficiente, evita repintado lento de `add.grid`)
2. `initAllCharacterAnimations(this)` + `verifyHumanAnimations()`
3. `spawnPlayer()` — `getCenterSpawn()` + `new Player(...)` + `setOrigin(0.5,0.5)`
4. `chatSystem = new ChatBubbleSystem(this)` (escucha `phaser-chat-bubble`)
5. `setupCamera(this, player)` (sistema) + `setupInteraction(this, npcs)` (sistema)
6. `setupNpcListener()` — `phaser-create-npcs` -> `spawnNpcs`
7. `setupDebug()` — vacío

**`spawnNpcs(count)` / `getNpcs()`:** delegan a `SpawnSystem.spawnNpcs`.

**`update():91`:**
1. `input.keyboard.enabled = !isGameInputBlocked()` + `resetKeys`
2. bloqueo -> `player.updateEntity` + `chatSystem.update` + `updateCamera`
3. `isClose/Inventory/Map/Missions/StatsJustPressed` -> dispatch `phaser-action-*`
4. debug `J/K/L` -> todos NPCs jump/dash/attack
5. `player.updateEntity` + loop `npcs.updateEntity` + `chatSystem.update` + `updateCamera`

## Lógica — sistemas (`systems/*`)
- `CameraSystem`: `startFollow` no se usa con lerp; `centerOn(player.x,player.y)` cada frame garantiza centrado pixel-perfect (solo se desacopla en bordes por `setBounds`).
- `SpawnSystem.spawnNpcs`: clamp 1..10, evita overlap `Distance<60`, `new Survivor()` + colisiones player/NPC.
- `ChatBubbleSystem`: Container en `player.y-48`, GraphRoundedRect + triángulo, tweens fade/pop, `delayedCall 3500ms`.
- `InteractionSystem`: `pointerdown` hit-test `localObjects` + `Distance<40`, dispatch selección/deselección, `addCapture(ESC,TAB)`.

## Lógica — `systems/InputSystem.ts:1` (80 líneas)
- `getMovementVector(scene):26` -> si `isGameInputBlocked` null, else `isActionDown(move_left/right/up/down)` priority left>right, retorna `{xDir,yDir,dir:Direction8}`
- JustPressed wrappers `38-69`: `isJump/Dash/Attack/Tutorial/Close/Inventory/Map/Missions/StatsJustPressed` via `isActionJustDown`
- `capture(scene):71` -> `captureAllBindings` (de `ui/input/KeyBindings`)
- `getDirectionFromVector:14` vector a `Direction8`

## Eventos
- **Escucha:** `phaser-create-npcs`, `phaser-zoom-set`, `phaser-chat-bubble`, `wheel`
- **Emite:** `phaser-npc-selected/deselected`, `phaser-zoom-sync`, `phaser-npcs-spawned`, `phaser-action-*`

## Dependencias
- **Importa de:** `Phaser`, `assets/*` (via Preloader), `characters/Animations`, `characters/Player`, `characters/Survivor`, `ui/input/KeyBindings`, `game/systems/InputSystem`
- **Provee a:** `app/App.tsx` (game instance), `characters/*` (scene para sprites)

## Flujo
```
Preloader.preload (assets) -> Preloader.create -> MainScene.create (anim+player+camera+listeners)
  MainScene.update (60fps) -> InputSystem -> Player.updateEntity -> BaseHuman anim/physics
                         -> Survivors.updateEntity -> chatBubble follow
```

## Para Repomix
Añadir nuevas entidades: crear en `MainScene.spawn*` siguiendo patrón `Survivor` (collider + depth + interactive si seleccionable). Nuevos inputs: agregar `GameAction` en `ui/input/KeyBindings` + wrapper en `InputSystem` + check en `MainScene.update`. No poner lógica de negocio aquí — delegar a `ai/`/`settlement/`/`world/`.
