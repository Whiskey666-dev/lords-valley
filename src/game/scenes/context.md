# game/scenes / Context — Escenas Phaser

## Propósito
Contiene las **Scenes de Phaser** — el ciclo de vida `preload -> create -> update`. Son el punto de entrada visual y orquestación del mundo.

## Archivos
| Archivo | Rol |
|---|---|
| `Preloader.ts:43` | `class Preloader extends Phaser.Scene` (`key: "Preloader"`). `preload()` carga 24 spritesheets 48x64 (Walk/Idle/Dash/Death/Jump x6 dirs) vía Vite imports. `create()` hace `scene.start("MainScene")`. |
| `MainScene.ts:12` | `class MainScene extends Phaser.Scene` (`key: "MainScene"`). **~127 líneas, orquesta** y delega en `game/systems/*`. Ver `game/context.md`. |

## Lógica
- `Preloader` es la única scene que toca `assets/` — convierte URLs Vite a `Phaser.Textures`.
- `MainScene` crea `Player`, `Survivor`, colisiones `arcade`, y delega cámara/spawn/chat/interacción a los sistemas de `game/systems/`.
- Verificación `verifyHumanAnimations` chequea 104 animaciones.
- Centrado de cámara manual por frame vía `CameraSystem.updateCamera` (sin lerp que causaba carga lenta del terreno).

## Dependencias
- `Phaser`, `assets/*`, `characters/Animations`, `characters/Player`, `characters/Survivor`, `ui/input/KeyBindings`, `game/systems/*`
- Provee a `game/main.ts` (registro en `config.scene`)

## Para Repomix
Nuevas scenes (ej. `MenuScene`, `PauseScene`) van aquí. Registrar en `game/main.ts:config.scene`. Mantener `MainScene` como scene de gameplay — extraer lógica pesada a `game/systems/` o `game/world/`.