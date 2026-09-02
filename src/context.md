# src/context.md — Lords Valley v0.1
> **Última actualización:** 2026-09-02 | Stack: **Phaser 4.2.1** + **React 19** + **Vite 8** + **TypeScript 6** + **Zustand 5** + **socket.io-client**
> Entrada: `main.tsx` → `app/App.tsx` → `hooks/app/useAppController` → `game/main.ts` (`startLaunchGame`)

## Propósito General de `src/`
Contiene toda la lógica de **Lords Valley**, survival/colony-sim top-down isométrico. Arquitectura en 3 capas:

- **Core Phaser** (`game/`) — corre en `#game-container`, mundo `6144×6144` (`WORLD_SIZE=6144`, `CHUNK_PX=1024`, 6×6 chunks, `TILE=32`, `WORLD_TILES=192`)
- **Overlay React** (`app/`, `ui/`) — paneles, modales, HUD, menús, inventario, NPC, construcción, agricultura
- **Simulación / Datos** (`ai/`, `buildings/`, `items/`, `settlement/`, `save/`, `world/`) — stubs preparados para la colony-sim completa

## Comunicación Phaser ↔ React
Sin imports directos. Bus `window.CustomEvent` + Zustand `useGameStore` + `socket.io`:

**Phaser → React:**
| Evento | Dato | Receptor |
|---|---|---|
| `phaser-npc-selected` | `NpcPanelData` | `useAppController` → `NpcPanel` |
| `phaser-npc-deselected` | — | `useAppController` → cierra paneles |
| `phaser-dead-dragon-selected` | `DeadDragonPanelData` | `useAppController` → `DeadDragonPanel` |
| `phaser-dead-dragon-deselected` | — | cierra `DeadDragonPanel` |
| `phaser-dead-dragon-updated` | `DeadDragonPanelData` | `DeadDragonPanel` reactivo |
| `phaser-crop-plot-selected` | `FarmPlotStatus` | `useAppController` → `CropPlantingModal` |
| `phaser-zoom-sync` | `number (0..100)` | Navbar / zoom |
| `phaser-farm-plots-changed` | `FarmPlotData[]` | `FarmPlacementSystem` |
| `lords-loading-progress` | `{progress, step}` | `useLoadingScreen` → `LoadingScreen` |

**React → Phaser:**
| Evento | Dato | Emisor |
|---|---|---|
| `phaser-zoom-set` | `number (0..100)` | `useAppController` |
| `phaser-start-placement` | `{buildingId}` | `useConstruction` → `ConstructionPanel` |
| `phaser-cancel-placement` | — | `FarmPlacementSystem` |
| `phaser-placement-mode-changed` | `{active, type?}` | `FarmPlacementSystem` |
| `phaser-plant-crop` | `{tileX, tileY, cropId}` | externo |
| `phaser-harvest-crop` | `{tileX, tileY}` | externo |
| `phaser-dead-dragon-set-comportamiento` | `{id, comportamiento}` | `useDeadDragonPanel` |
| `phaser-dead-dragon-set-funcion` | `{id, funcion}` | `useDeadDragonPanel` |
| `phaser-dead-dragon-set-hogar` | `{id}` | `useDeadDragonPanel` |
| `phaser-action-*` | — | `useAppController` → Phaser |
| `minimap-goto` | `{chunkX, chunkY}` | `useMiniMap` |
| `minimap-goto-world` | `{x, y}` | `useWorldMap` |

**Socket.io:** `joinSettlement`, `updateViewport` (throttled 512px/300ms), `SURVIVOR_LOYALTY_CHANGED`, `SETTLEMENT_TICK_COMPLETED`, `RESOURCE_EXTRACTED` con `sequenceNumber`.

## Estructura de Módulos (estado real 2026-09-02)
| Módulo | Estado | Rol | Archivos clave |
|---|---|---|---|
| `app/` | **Implementado** | Root React + auth + store + socket + APIs | `App.tsx`, `store/useGameStore.ts`, `socket.ts`, `api/*`, `auth/AuthScreen.tsx` |
| `hooks/` | **Implementado** | Lógica desacoplada por dominio | Ver `hooks/context.md` |
| `game/` | **Implementado** | Orquestador Phaser 4 | `main.ts`, `scenes/*`, `systems/*`×10, `world/Terrain.ts`, `entities/*`, `farming/*`, `layers/*` |
| `ui/` | **Implementado** | React overlay completo | `menus/*`, `character/*`, `inventory/*`, `hud/*`, `farming/*`, `construction/*`, `buildings/*`, `missions/*`, `skills/*`, `loading/*` |
| `characters/` | **Implementado (12/12)** | Humanos + animaciones 8 dirs | `BaseHuman`, `Animations` (6 dirs físicas), `Player`, `Survivor`, `DeadDragon`, `Stats/Needs/Traits/Skills/Personality/Loyalty/Gustos` |
| `combat/` | Parcial | `CombatSystem` funcional (400ms lock) | `CombatSystem.ts` |
| `items/` | Parcial | `Inventory`/`Equipment` + `Item.ts` 10 cat. | `Inventory`, `Equipment`, `Item`, `Resources/Weapons/Food` stub |
| `assets/` | **Implementado** | 30 sheets 48×64 + 29 sprites de cultivo 384×64 | `sprites/player/*`, `sprites/farm seeds/*` |
| `ai/` | **STUB vacío** | 4 archivos previstos | `TaskSystem`, `Pathfinding`, `NeedsSystem`, `DecisionSystem` |
| `buildings/` | **STUB vacío** | 3 archivos; datos en `hooks/buildings/buildingsData.ts` | `Building`, `Construction`, `Production` |
| `settlement/` | **STUB vacío** | 5 archivos | `Settlement`, `Jobs`, `Orders`, `Economy`, `Management` |
| `world/` | **STUB vacío** | 6 archivos (la implementación real está en `game/world/Terrain.ts`) | `Time`, `Seasons`, `Weather`, `Map`, `Chunks`, `Events` |
| `save/` | **STUB vacío** | 3 archivos | `SaveData`, `SaveSystem`, `PersistenceSimulation` |

## Flujo de Datos Actual (slice funcional)
```
assets/sprites --Vite import-->
  game/scenes/Preloader (30 sheets 48×64 + 29 sprites cultivo 384×64)
  --> characters/Animations (registerHumanAnimations 8 dirs → 6 físicas)
  --> characters/Player + Survivor + game/entities/SurvivorSprite
  --> game/scenes/MainScene (6144×6144, ChunkRenderer 3×3, sistemas)
       --> game/systems/FarmPlacementSystem (parcelas, ghost preview, cultivos)
       --> game/systems/FogOfWarSystem (niebla de guerra Phaser)
       --> game/systems/MineralPhysics + WaterPhysics
  <---> app/store/useGameStore (Zustand: settlement, survivors, buildings, chunks, selectedId)
  <---> app/socket.ts (joinSettlement, updateViewport throttled)
  <---> hooks/app/useAppController (event bus, toggles de paneles, Phaser lifecycle)
  --> ui/* (paneles React modales y laterales)
  --> hooks/hud/useMineralTooltip (detección de minerales on-click)
  --> hooks/farming/useCropPlantingModal (gestión modal siembra/cosecha)
  --> hooks/construction/useConstruction (56 edificios, ghost placement)
  --> hooks/loading/useLoadingScreen (barra de progreso en tiempo real)
```

## Convenciones
- **Dominio:** español (`hambre`, `sed`, `lealtad`, `profesión`) + APIs en inglés
- **Sprites personaje:** `48×64`, 8 frames, 6 dirs físicas mapeadas desde 8 lógicas vía `LOGICAL_TO_PHYSICAL`
- **Sprites cultivo:** `384×64` (6 frames de 64×64), frame 0=semilla, 1-3=crecimiento, 4=maduro, 5=cosechado
- **Mundo:** `6144×6144`, `CHUNK_PX=1024`, `TILE=32`, `CHUNK_TILES=32`, `WORLD_TILES=192`
- **Cámara:** `centerOn` manual + `CameraController` drag + zoom `0.6..1.6` ↔ `0..100%`
- **KeyBindings canónico:** `ui/input/KeyBindings.ts`; `game/input/KeyBindings.ts` es re-export deprecated
- **Hooks patrón:** cada panel/modal tiene su hook en `hooks/<dominio>/use<Nombre>.ts`
- **LVY BigInt:** string 18 decimales en `common/bigint.ts`
