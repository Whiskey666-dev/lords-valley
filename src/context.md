# src / Context — Lords Valley v0.1

> Stack: **Phaser 4.2.1** (Arcade Physics) + **React 19** + **Vite 8** + **TypeScript 6** + **Zustand 5** + **socket.io-client**. Entrada `main.tsx` -> `app/App.tsx` -> `game/main.ts` (`startLaunchGame`).

## Propósito General de `src/`
`src/` contiene toda la lógica de **Lords Valley**, survival / colony-sim top-down. Arquitectura en 3 capas:

- **Core Phaser** en `game/`, `characters/`, `combat/`, `game/world/` — corre en `#game-container`, mundo `6144×6144` (`WORLD_SIZE = 6144`, `CHUNK_PX=1024`, 6×6 chunks, `TILE=32`, `WORLD_TILES=192`).
- **Overlay React** en `app/` y `ui/` — `Navbar`, `Console`, `TutorialPanel`, `SettingsPanel`, `NpcPanel`, `FollowersPanel`, `PlayerInventoryPanel`, `BuildingsPanel`, `MiniMap`, `WorldMapPanel`.
- **Simulación / Datos** en `ai/`, `buildings/`, `items/`, `settlement/`, `save/`, `world/` — mayoría stub a excepción de `game/world/Terrain.ts` implementado y `hooks/buildings/buildingsData.ts` (mock 40+ edificios).
- **Assets** en `assets/` — sprites `48×64`, 8 frames por tira (`384×64`), 30 sheets activos (Walk/Idle/Dash/Death/Jump ×6 dirs físicas).

## Comunicación Phaser <-> React
Sin imports directos. Bus `window.CustomEvent` + Zustand `useGameStore` + `socket.io`:
- `Phaser -> React`: `phaser-npc-selected` (Survivor/Player click), `phaser-npc-deselected` (ESC/click suelo), `phaser-toggle-tutorial`, `phaser-zoom-sync`, `phaser-npcs-spawned`, `phaser-chat-bubble`, `phaser-focus-npc`, `phaser-camera-follow`
- `React -> Phaser`: `phaser-zoom-set` (0..100), `phaser-create-npcs`, `minimap-goto` (`chunkX/Y`), `minimap-goto-world` (`x/y`), `phaser-action-*` (`inventory|map|missions|stats|construction|buildings|config`)
- Socket: `joinSettlement`, `updateViewport` (viewport chunks), eventos `SURVIVOR_LOYALTY_CHANGED`, `SETTLEMENT_TICK_COMPLETED`, `RESOURCE_EXTRACTED` con verificación `sequenceNumber` en `useGameStore:71`
- Singleton `ui/input/KeyBindings.ts:isGameInputBlocked()` chequeado cada frame por `MainScene.update` y `Player.updateEntity`.

## Estructura de Módulos (estado real 2026-08-29)
| Módulo | Estado | Rol | Archivos |
|---|---|---|---|
| `app/` | **Implementado** | Root React + controller + store + socket + auth | `App.tsx` (usa `useAppController`), `store/useGameStore.ts`, `socket.ts`, `api/*`, `auth/AuthScreen.tsx` |
| `game/` | **Implementado** | Orquestador Phaser | `main.ts` (config RESIZE 6144×6144), `scenes/Preloader|MainScene`, `systems/*`×7, `world/Terrain.ts`, `entities/*`×2 |
| `characters/` | **Implementado (11/12)** | Humanos + animaciones 8 dirs | `BaseHuman`, `Animations` (251 líneas, 6 dirs físicas), `Player`, `Survivor` (inner `SurvivorSprite`), `Stats/Needs/Traits/Skills/Personality/Loyalty/Gustos` |
| `combat/` | Parcial | `CombatSystem` funcional (anim attack 400ms lock); `Weapons/Damage` stub vacío | `CombatSystem.ts:47` |
| `ui/` | **Implementado** | React overlay completo | `input/KeyBindings` (251 líneas, 16 acciones), `menus/*`×5, `character/*`×2 + 4 tabs, `inventory/*`, `hud/*`×2, `buildings/BuildingsPanel`, `settlement/*`×2 |
| `items/` | Parcial | `Inventory`/`Equipment` procedural + `Item.ts` 10 categorías stackables | `Inventory:39`, `Equipment:37`, `Item:123` ; `Resources/Weapons/Food` stub |
| `assets/` | Implementado | 30 sheets 48×64; Preloader carga 30 | `sprites/player/{Walk,Idle,Dash,Death,Jump}`×6 |
| `hooks/` | **Implementado** | Lógica desacoplada UI | `app/useAppController`, `buildings/useBuildings+buildingsData`, `character/useNpcPanel|useFollowers`, `hud/useMiniMap|useWorldMap|useWorldInfo`, `inventory/usePlayerInventory`, `menu/*` |
| `ai/` | **STUB vacío** | 4 archivos 0 bytes | `TaskSystem,Pathfinding,NeedsSystem,DecisionSystem` previstos |
| `buildings/` | **STUB vacío** | 3 archivos 0 bytes; pero `hooks/buildings/buildingsData.ts` tiene 40+ edificios mock | `Building,Construction,Production` vacíos |
| `settlement/` | **STUB vacío** | 5 archivos 0 bytes | `Settlement,Jobs,Orders,Economy,Management` previstos |
| `world/` | **STUB vacío** | 6 archivos 0 bytes (`src/world/*`) | `Time,Seasons,Weather,Map,Chunks,Events` vacíos; **real** en `game/world/Terrain.ts` |
| `save/` | **STUB vacío** | 3 archivos 0 bytes | `SaveData,SaveSystem,PersistenceSimulation` previstos |

## Flujo de Datos Actual (slice funcional)
```
assets/sprites --Vite import--> game/scenes/Preloader (30 sheets 48x64)
  --> characters/Animations (registerHumanAnimations 8 dirs -> 6 físicas)
  --> characters/BaseHuman (playWalk/Idle/Jump/Dash/Death/Attack)
  --> characters/Player + characters/Survivor + game/entities/SurvivorSprite (interpolación 0.15)
  --> game/scenes/MainScene (6144×6144 grid Graphics, init animations, spawnPlayer, ChunkRenderer 3x3, CameraController, savePlayerPos 5s + socket viewport)
  <---> app/store/useGameStore (Zustand: settlement, survivors, buildings, chunks Map, selectedId, sequenceNumber)
  <---> app/socket.ts (joinSettlement, updateViewport throttled 512px/300ms)
  <---> app/App.tsx + hooks/app/useAppController (event bus + tabs Followers/Buildings/Map/Inventory/Settings)
  --> ui/* (MiniMap circular, WorldMapPanel filtros, BuildingsPanel gestión 7 categorías)
  --> ui/input/KeyBindings (16 acciones, normalize/display, pressed/justPressed, block flags)
  --> game/systems/InputSystem adaptador (getMovementVector + is*JustPressed)
```

## Flujo Futuro Planificado (colony-sim)
```
game/world/Terrain (noise, agua contigua 5-15 tiles, minerales vetas 6 tipos 0.02-0.25 rarity)
  -> world/Time tick (cuando exista) -> ai/NeedsSystem -> ai/DecisionSystem (utility)
  -> settlement/Jobs -> ai/TaskSystem -> ai/Pathfinding (A* sobre Chunks)
  -> Survivor.moverEnDireccion -> buildings/Construction -> settlement/Economy -> save/SaveSystem
```

## Convenciones
- Dominio español (`hambre`, `sed`, `lealtad`, `profesión`) + APIs inglés.
- Sprites: `48×64`, 8 frames, 6 dirs físicas (`down/up/right_down/right_up/left_down/left_up`) mapeadas desde 8 lógicas vía `LOGICAL_TO_PHYSICAL` (`Animations.ts:69`).
- Mundo: `6144×6144`, `CHUNK_PX=1024`, `TILE=32`, `CHUNK_TILES=32`, `WORLD_TILES=192`, cámara `centerOn` manual + `CameraController` drag middle/right + zoom `0.6..1.6` ↔ `0..100%` (`CameraSystem:14`).
- Cámara follow toggle `Y` (`cameraFollow` en KeyBindings), frustum culling `worldView.contains` (`MainScene:224`), `ChunkRenderer` carga 3×3 chunks vía `useGameStore.getChunk`.
- LVY `BigInt` string 18 decimales (`common/bigint.ts`, `useGameStore:getLvyDisplay`).
