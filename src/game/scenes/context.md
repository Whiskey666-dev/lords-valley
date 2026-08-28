# game/scenes / Context — Escenas Phaser

## Propósito
Contiene las **Scenes de Phaser** — el ciclo de vida `preload -> create -> update`. Son el punto de entrada visual y orquestación del mundo.

## Archivos
| Archivo | Rol |
|---|---|
| `Preloader.ts:43` | `class Preloader extends Phaser.Scene` (`key: "Preloader"`). `preload()` carga 24 spritesheets 48x64 (Walk/Idle/Dash/Death/Jump x6 dirs) vía Vite imports. `create()` hace `scene.start("MainScene")`. |
| `MainScene.ts:8` | `class MainScene extends Phaser.Scene` (`key: "MainScene"`). **312 líneas, corazón del juego.** Ver `game/context.md` para detalle completo: grid 2000x2000, `initAllCharacterAnimations`, spawn Player `getCenterSpawn()`, `spawnNpcs()`, cámara `startFollow` + zoom 0.6..1.6, listeners `phaser-*`/`wheel`, `showChatBubble`, `update()` (input blocking + `Player`/`Survivor` ticks + bubble follow). |

## Lógica
- `Preloader` es la única scene que toca `assets/` — convierte URLs Vite a `Phaser.Textures`.
- `MainScene` es donde todo converge: crea `characters/Player`, `characters/Survivor`, colisiones `arcade`, y puentea a `app/App` vía `window.CustomEvent`.
- Verificación `verifyHumanAnimations` chequea 104 animaciones (walk/idle/jump/dash/death/attack x8 dirs x prefijos).

## Dependencias
- `Phaser`, `assets/*`, `characters/Animations`, `characters/Player`, `characters/Survivor`, `ui/input/KeyBindings`
- Provee a `game/main.ts` (registro en `config.scene`)

## Para Repomix
Nuevas scenes (ej. `MenuScene`, `PauseScene`) van aquí. Registrar en `game/main.ts:config.scene`. Mantener `MainScene` como scene de gameplay — extraer lógica pesada a `game/systems/` o `game/world/`.
