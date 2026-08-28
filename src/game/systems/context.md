# game/systems / Context — Sistemas de Juego (Input)

## Propósito
Capa de **sistemas desacoplados** que `MainScene` consume en `update()`. Hoy solo `InputSystem`, pero es el lugar para futuros `CombatSystem` tick, `TimeSystem`, etc.

## Archivos
| Archivo | Rol |
|---|---|
| `InputSystem.ts:1` | 80 líneas. Desacople entre `ui/input/KeyBindings` y `characters/Player`/`game/scenes/MainScene`. `getMovementVector(scene)`, `isJump/Dash/Attack/Tutorial/Close/Inventory/Map/Missions/StatsJustPressed(scene)`, `capture(scene)`. |

## Lógica — `InputSystem.ts`
- `getMovementVector(scene): {xDir,yDir,dir:Direction8}|null` -> si `isGameInputBlocked()` null, else `isActionDown(move_left/right/up/down)` prioridad left>right.
- Wrappers `is*JustPressed` -> `isActionJustDown` con check de bloqueo.
- `capture(scene)` -> `captureAllBindings(scene)` (registra `Phaser.KeyCodes` y re-captura al cambiar bindings).
- `getDirectionFromVector:14` vector -> `Direction8`.

## Dependencias
- Importa `ui/input/KeyBindings` (no `game/input` deprecated).
- Consumido por `characters/Player.ts:70` y `game/scenes/MainScene.ts:260`.

## Para Repomix
Nuevos sistemas (ej. `PhysicsSystem`, `AISystem` que llame `ai/*`) van aquí y se llaman desde `MainScene.update()`. Mantenerlos puros (reciben `scene`/`dt`/`entities`, no guardan estado global).
