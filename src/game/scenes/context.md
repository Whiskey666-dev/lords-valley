# src/game/scenes/context.md — Escenas Phaser

> Ciclo `preload → create → update` de Phaser. Punto de entrada visual y orquestación del mundo `6144×6144`.

## Archivos

| Archivo | Líneas | Rol |
|---|---|---|
| `Preloader.ts` | ~100 | Carga de assets + dispara progreso a React |
| `MainScene.ts` | ~310 | Escena principal del juego, orquesta todos los sistemas |

## `Preloader.ts`
- `class Preloader extends Phaser.Scene("Preloader")`
- **`preload()`**: carga todos los assets con emisión de progreso vía `lords-loading-progress`
  - **30 spritesheets de personaje** (`48×64`, `FRAME_W=48, FRAME_H=64`): `player_walk|idle|dash|death|jump` × 6 dirs físicas (`down/up/right_down/right_up/left_down/left_up`)
  - **29 sprites de cultivo** (`384×64`): uno por cultivo con key `crop_${cropId}` y `frameWidth=64, frameHeight=64` → 6 frames automáticos
  - Emite `lords-loading-progress {progress: 10..100, step: "..."}` en cada etapa
- **`create()`**: → `scene.start("MainScene")`

## `MainScene.ts`
- `class MainScene extends Phaser.Scene("MainScene")`
- **Campos**: `player`, `npcs[]`, `chatSystem`, `chunkRenderer`, `cameraController`, `cameraFollow`, `lastViewportEmit`, `farmPlacementSystem`

**`create()` — 9 pasos**:
1. `setupWorld`: bounds `6144×6144`, grid Graphics `64px #333333` depth -20
2. `StaticGroundLayer.bake()`: construye CollisionMatrix
3. `initAllCharacterAnimations`: registra 104+ animaciones (8 dirs → 6 físicas)
4. `spawnPlayer`: centro + async `fetchLastPlayerPos` + player interactivo + `firstSpawnPos` (respawn)
   + `resolveSettlementId()` (store/localStorage → `__SETTLEMENT_ID__`; sin esto los ghosts caen a
   fallback local y el servidor rechaza su combate)
   + guardado al salir (`beforeunload/pagehide/visibilitychange` con guard `sceneAlive`, removidos en `SHUTDOWN`)
5. `new ChatBubbleSystem(scene)`
6. `setupCamera`: bounds + CameraSystem + CameraController
7. `setupRTSOverlay`: ChunkRenderer 3×3 + listeners `minimap-goto/world`
8. `new FarmPlacementSystem(scene)`
9. `restoreSavedGame`: sin save → partida nueva con auto-spawn de 1-3 ghosts (flag `__GHOSTS_AUTOSPAWNED__`
   anti-doble-montaje); con save → restaura TODOS los NPCs (servidor + solo-locales) en su última
   posición iso guardada (la `positionX` del servidor vive en espacio tile y nunca se pinta directo)

**`update()` — cada frame**:
- Toggle `cameraFollow` con tecla Y
- Frustum culling `worldView.contains`
- `chunkRenderer.update(camera)` + socket `updateViewport` throttled 512px/300ms
- `cameraController.update(delta)`
- Bloqueo de input (`isGameInputBlocked()`)
- Dispatch `phaser-action-*` para ESC/I/M/J/P/C
- `player.updateEntity()` (+ flanco de subida de ataque → `playerMeleeStrike`) + `npcs[i].updateEntity(ghosts, deadDragons)` + `deadDragons[i].updateEntity(ctx)` + `ghosts[i].updateEntity(player, npcs)`
- Filtra muertos (`estaVivo`) cada frame; muertes → eventos `phaser-*-died` → cierre de panel + save
- Player muerto → `playerDeathSeq` (anim `death_*`, respawn 1.6s en `firstSpawnPos` + `player:respawn`)
- Export `window.__PLAYER_POS__`, `window.__NPCS_POS__`, `window.__PHASER_CAMERA__`
- `CameraSystem.updateCamera()` si `cameraFollow`

## Dependencias
- `Phaser`, `characters/Animations+Player+Survivor`, `ui/input/KeyBindings`
- `game/systems/*` (10 sistemas), `game/world/Terrain+CollisionMatrix`
- `game/farming/FarmPlotManager`, `game/layers/StaticGroundLayer+DynamicLayer`
- `app/api/player.api`, `app/store/useGameStore`, `app/socket`

## Convenciones
- Nuevas escenas → aquí + registrar en `game/main.ts:config.scene`
- Mantener `MainScene` como orquestador — lógica específica va en `game/systems/`
- NO importar módulos React en escenas Phaser
