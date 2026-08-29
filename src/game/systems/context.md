# game/systems / Context — Sistemas de Juego

## Propósito
Capa de **sistemas desacoplados** que `MainScene` consume en `create()`/`update()`.

## Archivos
| Archivo | Rol |
|---|---|
| `InputSystem.ts:1` | Desacople entre `ui/input/KeyBindings` y `characters/Player`/`game/scenes/MainScene`. `getMovementVector(scene)`, `is*JustPressed(scene)`, `capture(scene)`. |
| `CameraSystem.ts:1` | `setupCamera(scene,target)` + `updateCamera(scene,target)`. bounds `2000x2000`, zoom `percentToZoom 0..100 -> 0.6..1.6`, `centerOn` manual por frame (evita lerp/paneo lento del terreno). |
| `SpawnSystem.ts:1` | `getCenterSpawn(scene)` (polar `r=200*sqrt(rand)` centro `1000,1000`) + `spawnNpcs(scene,count,player,npcs)` con separación `Distance<60`. |
| `ChatBubbleSystem.ts:1` | `class ChatBubbleSystem` — escucha `phaser-chat-bubble`, `show(text,player)` (Container + Graphics + Text, tweens fade/pop, 3500ms), `update(player)` follow. |
| `InteractionSystem.ts:1` | `setupInteraction(scene,npcs)` — `pointerdown` hit-test (`localObjects` + `Distance<40`), dispatch `phaser-npc-selected/deselected`, `addCapture(ESC,TAB)`. |

## Dependencias
- `InputSystem`/`InteractionSystem`/`SpawnSystem` importan `ui/input/KeyBindings` y `characters/*`.
- Consumidos por `game/scenes/MainScene.ts`.

## Para Repomix
Nuevos sistemas (ej. `PhysicsSystem`, `AISystem` que llame `ai/*`) van aquí y se llaman desde `MainScene`. Mantenerlos puros (reciben `scene`/`entities`, no guardan estado global salvo `ChatBubbleSystem` que encapsula su propio estado).