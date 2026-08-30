# game/systems / Context — Sistemas de Juego

## Propósito
Capa de **sistemas desacoplados** que `MainScene` consume en `create()`/`update()`. Cada sistema recibe `scene`/`entities` y no guarda estado global salvo `ChatBubbleSystem`/`CameraController`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `InputSystem.ts:1` | 80 | Adaptador `ui/input/KeyBindings` → Phaser. `getMovementVector(scene)` (priority `left>right`, `up/down`, bloqueo `isGameInputBlocked→0`), `is*JustPressed` (`jump/dash/attack/tutorial/close/inventory/map/missions/stats`) vía `isActionJustDown`, `captureInput(scene)`→`captureAllBindings`, `getDirection`. Consumido por `Player.updateEntity` y `MainScene.update`. |
| `CameraSystem.ts:10` | 59 | `setupCamera(scene,target,6144,6144)` bounds, helpers `percentToZoom 0..100→0.6..1.6` y `zoomToPercent` inverso guardados en `(scene as any)._percentToZoom`, `setZoom(50)`, `centerOn(target)`, listeners `phaser-zoom-set` y `wheel ctrl` (delta ±10% + `phaser-zoom-sync`). `updateCamera(scene,target)` = `centerOn` manual cada frame (sin lerp). |
| `CameraController.ts:3` | 73 | **Nuevo** `class CameraController(camera,6144,6144)`. State `velocity Vector2, isDragging, dragStart, camStart, followMode`. `attach(scene)` pointerdown `middle/right`→drag, pointermove `scrollX/Y Clamp`, pointerup, wheel ctrl `±0.08 zoom` + `emitZoomSync`, `phaser-zoom-set` listener. `update(dt)` inercia `velocity*0.88`. `setFollowMode`, `get isFollowing/dragging`. Usado en `MainScene.setupRTSOverlay` + `update`. |
| `SpawnSystem.ts:9` | 71 | `getCenterSpawn(scene)` polar `r=200√rand` centro `worldW/2`, `getSpawnNearPlayer(player,80,200)`, `spawnNpcs(scene,count,player,npcs)` clamp 1..10, evita `Distance<60 player / <50 npc` 15 intentos, `new Survivor()+instanciarSprite+colliders player↔npc`, log nombre/profesión, dispatch `phaser-npcs-spawned`. |
| `ChatBubbleSystem.ts:9` | 76 | `class ChatBubbleSystem(scene)` escucha `phaser-chat-bubble {text}`, `show(text,player)` Container `bg Graphics roundedRect 8 + triangle + txt wordWrap 220` depth 200 alpha 0→1 tween 120ms + scale pop Back.out, `delayedCall 3500` fade out 300ms, `update(player)` follow `x, y-48`, `destroy`. |
| `InteractionSystem.ts:10` | 65 | `setupInteraction(scene,npcs)` pointerdown hit-test `localObjects includes sprite` o `Distance<40`, dispatch `phaser-npc-selected` con fallbackDetail (`id,name,profession,loyalty,health,edad,traits,personalidad,temperamento,habilidad,gustos,inventario,equipamiento,habilidades,stats,needs`) o `phaser-npc-deselected` si `localObjects.length===0`. Bloquea si `isGameInputBlocked`. Captura ESC/TAB. **Hoy no usado directamente** — MainScene delega a `Survivor.sprite pointerdown` + `useGameStore` selección. |
| `SelectionSystem.ts:4` | 51 | **Nuevo** `class SelectionSystem(sprites Map<string,SurvivorSprite>)`. `register(sprite)` interactive + `selectSurvivor(id)` via Zustand, `unregister`, `handleWorldClick(worldX,Y,hitIds)` prox 40, `syncHighlight` `highlight(id===selected)`, `syncPositions(survivors)` `setTarget`. Usa `useGameStore`. Reservado — no instanciado en MainScene actual. |

## Dependencias
- Todos importan `Phaser` + `ui/input/KeyBindings` (o `characters/*` para Spawn/Interaction).
- Consumidos por `game/scenes/MainScene` salvo `SelectionSystem` (futuro).
- `InputSystem` y `CameraSystem/Controller` son críticos para gameplay; resto son modulares.

## Para Repomix
Nuevos sistemas (ej. `PhysicsSystem`, `AISystem` que llame `ai/*`) van aquí y se invocan desde `MainScene`. Mantenerlos puros (reciben `scene`/`entities`) y sin imports React salvo `SelectionSystem` que usa Zustand a propósito.
