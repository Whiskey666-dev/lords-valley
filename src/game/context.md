# game / Context — Orquestador Phaser (Core del Juego)

## Propósito
**Corazón del juego.** Configura Phaser (RESIZE 6144×6144, Arcade debug velocity verde), carga assets, orquesta escena principal, terrain chunks, cámara, selección, input y sync con backend. Único módulo con `Phaser.Scene`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `main.ts:6` | 34 | `GameConfig` RESIZE `innerWidth/Height`, parent `game-container`, physics `arcade debugShowBody:false debugShowVelocity:true 0x00ff00 gravity 0,0`, `scene:[Preloader,MainScene]`, `startLaunchGame():Phaser.Game` llamado desde `hooks/app/useAppController:114`. |
| `scenes/Preloader.ts:43` | 100 | `class Preloader extends Phaser.Scene ("Preloader")`. `preload()` carga **30 spritesheets 48×64** vía Vite imports: `player_walk|idle|dash|death|jump` ×6 dirs. `create()` → `scene.start("MainScene")`. |
| `scenes/MainScene.ts:16` | 308 | **Orquestador** Ver § MainScene abajo. |
| `world/Terrain.ts:1` | 298 | **Mundo procedural** 6144×6144. Const `WORLD_CHUNKS=6, CHUNK_PX=1024, TILE=32, CHUNK_TILES=32, WORLD_TILES=192`. Funciones `noise(seed)`, `generateWaterTiles` (15% none, 60% river serpenteante ancho 5-15 tiles, 25% lake radio 5-15), `getWaterTiles/Type`, `getMineralTiles` (6 config: CARBON 0.25, COBRE 0.20, ESTANO 0.18, HIERRO 0.15, PLATA 0.05, ORO 0.02, veins 2-15 tiles, escala 0.18), `isWater/Mineral/TreeTile`, `gidToColor/Css`. Cache lazy `cachedWaterTiles/cachedMineralTiles`. |
| `entities/ChunkRenderer.ts:5` | 108 | Render terrain 3×3 chunks alrededor cámara. `worldToChunk`, `chunkKey`, `update(camera)` throttled 512px dist, `pending Set`, `rendered Map Container depth -10`, `loadChunkData` per tile color `WATER_DARK/TREE_BROWN/MINERAL/BASE_GREEN` via `Terrain`. Llamado cada frame `MainScene.update:237`. |
| `entities/SurvivorSprite.ts:4` | 56 | `class SurvivorSprite extends BaseHuman` (`survivorId`, `targetX/Y`). `constructor(scene,x,y,id)` animPrefix `npc_`, depth 5, `setTarget`, `updateInterpolation` linear 0.15 + `dirFromDelta` 8 dirs, `highlight(selected)` tint `0xffff99` scale 1.05. |
| `systems/InputSystem.ts:1` | 80 | Adaptador `ui/input/KeyBindings`. `getMovementVector`, `is*JustPressed` (jump/dash/attack/tutorial/close/inventory/map/missions/stats), `captureInput`, `getDirection`. |
| `systems/CameraSystem.ts:10` | 59 | `setupCamera(scene,target,6144,6144)` bounds, `percentToZoom 0..100→0.6..1.6`, `zoomToPercent` inverso, `phaser-zoom-set` listener, wheel ctrl handler, `updateCamera` = `centerOn` manual. |
| `systems/CameraController.ts:3` | 73 | Clase `CameraController(camera,6144,6144)` drag middle/right, `velocity`, `followMode`, `attach(scene)` listeners pointerdown/move/up/wheel, `setFollowMode`, `update(dt)` inercia `velocity*0.88`, `emitZoomSync`. Usado en `MainScene:168`. |
| `systems/SpawnSystem.ts:9` | 71 | `getCenterSpawn(scene)` polar `r=200√rand` centro `worldW/2`, `getSpawnNearPlayer(player,80,200)`, `spawnNpcs(scene,count,player,npcs)` clamp 1..10, evita overlap `<50`, `new Survivor()+instanciarSprite+colliders`, dispatch `phaser-npcs-spawned`. |
| `systems/ChatBubbleSystem.ts:9` | 76 | `ChatBubbleSystem(scene)` escucha `phaser-chat-bubble`, `show(text,player)` Container Graphics rounded rect 8 + triangle + tweens fade/pop, 3500ms, `update(player)` follow `y-48`. |
| `systems/InteractionSystem.ts:10` | 65 | `setupInteraction(scene,npcs)` pointerdown `localObjects` + prox `Distance<40`, dispatch `phaser-npc-selected/deselected`. (Hoy no usado directamente — MainScene usa selección vía SurvivorSprite + store). |
| `systems/SelectionSystem.ts:4` | 51 | `SelectionSystem(sprites Map)`. `register/unregister`, `handleWorldClick`, `syncHighlight` (tint), `syncPositions`. Usa `useGameStore selectSurvivor/clearSelection`. No instanciado en MainScene actual (reservado). |
| `input/KeyBindings.ts:1` | 5 | `export * from "../../ui/input/KeyBindings"` deprecated re-export. |

## Lógica `scenes/MainScene.ts:16` (308 líneas)
**Campos:** `player:Player`, `npcs:Survivor[]`, `chatSystem:ChatBubbleSystem`, `chunkRenderer:ChunkRenderer`, `cameraController:CameraController`, `cameraFollow=true`, `lastViewportEmit`, `lastCameraX/Y`.

**`create():29`:** `setupWorld` (bounds 6144, bg #1e1e1e, grid Graphics 64px depth -20, strokeRect), `initAllCharacterAnimations`, `verifyHumanAnimations`, `spawnPlayer` (async `fetchPlayer(playerId).settings.lastPos` restore + interactive pointerdown dispatch Player DTO), `setupNpcListeners` (`phaser-create-npcs`→`spawnNpcs`, `phaser-focus-npc`→centerOn+select), `ChatBubbleSystem`, `setupCamera(6144,6144)`, `setupRTSOverlay` (ChunkRenderer + CameraController attach, lerp 0, follow false lerp, minimap-goto/world handlers, wheel prevent), `setupDebug` (ESC/TAB capture).

**`spawnPlayer:92`:** `getCenterSpawn` + `Player` depth 10 + `setInteractive`, `fetchPlayer` lastPos restore, `beforeunload` + `time.addEvent 5000 loop savePlayerPos` (throttle 10px, `savePlayerPos`).

**`savePlayerPos:154`:** `useGameStore settlement ownerId` o `localStorage playerId`, `savePlayerPos(playerId,{x,y})`.

**`update:213`:** 1) toggle `cameraFollow` (`isActionJustDown cameraFollow` Y) → `setFollowMode` + `centerOn` + `phaser-camera-follow`; 2) frustum culling `worldView.contains` → `sprite setVisible/Active`; 3) `chunkRenderer.update(camera)` + `updateViewport` emit throttled 512px/300ms `min/maxChunkX/Y` = `scroll/1024`; 4) `cameraController.update(dt)`; 5) `input.keyboard.enabled = !isGameInputBlocked` + reset; 6) si `isGameInputBlocked` → player/npcs idle + chat update return; 7) dispatch `phaser-npc-deselected/inventory/map/missions/stats`; 8) `player.updateEntity`, `npcs.updateEntity`, export `__PLAYER_POS__`, `__NPCS_POS__` (paqueteUI+x/y), `chatSystem.update`, `updateCamera` si follow.

**`verifyHumanAnimations:195`:** chequea 104+ keys `walk/idle/jump/dash/death/attack` + `player_attack` + `npc_*`; warn si missing.

**Eventos:** escucha `phaser-create-npcs`, `phaser-focus-npc`, `phaser-zoom-set`, `phaser-chat-bubble`, `wheel`, `minimap-goto/world`; emite `phaser-npc-selected/deselected`, `phaser-zoom-sync`, `phaser-npcs-spawned`, `phaser-camera-follow`, `phaser-action-*`, `updateViewport`.

## Dependencias
- **Importa:** `Phaser`, `assets/*` via Preloader, `characters/*`, `ui/input/KeyBindings`, `game/world/Terrain`, `app/api/player.api`, `app/store/useGameStore`, `app/socket`
- **Provee a:** `app/App` (Game instance), `characters/*` (scene)
