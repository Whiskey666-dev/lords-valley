# game / Context — Orquestador Phaser (Core del Juego)

## Propósito
**Corazón del juego.** Configura Phaser, carga assets, crea la escena principal, spawnea entidades, maneja cámara/zoom, colisiones, input y debug. Es el único módulo con `Phaser.Scene`.

## Archivos
| Archivo | Rol |
|---|---|
| `main.ts:6` | `GameConfig` + `startLaunchGame(): Phaser.Game`. |
| `scenes/Preloader.ts:43` | `class Preloader extends Phaser.Scene` — carga spritesheets. |
| `scenes/MainScene.ts:8` | `class MainScene extends Phaser.Scene` — **312 líneas, corazón**. |
| `systems/InputSystem.ts:1` | Capa de desacople input (80 líneas). Lee `ui/input/KeyBindings`. |
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

## Lógica — `scenes/MainScene.ts:8` (detallado)
**Campos:** `player: Player`, `npcs: Survivor[]:10`, `chatBubble: Container`, `chatBubbleTimer`, getter `npc` (compat primer NPC)

**`create():22`:**
1. `physics.world.setBounds(0,0,2000,2000)` + `add.grid(1000,1000,2000,2000,64,64,0x1a1a1a)` (grid 64px)
2. `initAllCharacterAnimations(this):27` + `verifyHumanAnimations:29` (104 checks walk/idle/jump/dash/death/attack x8 dirs x prefijos, logea faltantes)
3. `player = new Player(this, spawn.x, spawn.y)` `getCenterSpawn():153` polar `r=200*sqrt(rand)` centro `1000,1000`
4. Listener `phaser-create-npcs` -> `spawnNpcs(count)`
5. `cameras.main.setBounds(0,0,2000,2000)` + `startFollow(player,true)`, zoom `percentToZoom 0..100 -> 0.6..1.6` (`45,49` default 1.0), listeners `phaser-zoom-set` + `wheel ctrl` con `zoomToPercent`
6. `phaser-chat-bubble` -> `showChatBubble(text):197` (rounded rect + triangle, depth 200, tween fade/pop, 3500ms auto-hide, sigue a player en `update`)
7. Debug text `84` hint bindings polled `time.addEvent 500ms`
8. `pointerdown:93` hit-test: `scene.children.list` locals incluyen sprite? luego `Phaser.Math.Distance <40` proximity, else deselect si vacío. Dispatch `phaser-npc-selected` duplicado de `Survivor` click (redundancia). Logea razones.
9. `capture ESC/TAB:145` `addKeys("ESC,TAB")`

**`spawnNpcs(count):164`:**
- Clamp 1..10, evita overlap `Distance<60` player/otros, 15 intentos random `±150` de centro, `new Survivor()` + `instanciarSprite` + `physics.add.collider(player,sprite)` y NPC<->NPC, push array, dispatch `phaser-npcs-spawned`

**`showChatBubble():197`:**
- `Container` en `player.y-48` con `Graphics` rounded rect `fillStyle 0x000000 0.8` + triangle + `Text` wordWrap 220, tweens `yoyo` + `alpha`

**`update():260`:**
1. `input.keyboard.enabled = !isGameInputBlocked()` `262` + `resetKeys` si bloqueado
2. Early return si bloqueado (zero vel + `player.updateEntity` + bubble follow)
3. `isCloseJustPressed` -> deselect, `isInventory/Map/Missions/Stats` -> dispatch `phaser-action-*`
4. Debug `J/K/L` -> todos NPCs jump/dash/attack `293`
5. `player.updateEntity()` + loop `npcs.updateEntity()`, bubble `y = player.y-48`

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
