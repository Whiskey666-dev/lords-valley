# game/events / Context — Bus de Eventos Tipado (Reservado)

## Propósito
Directorio **reservado** para centralizar **definición tipada de `window.CustomEvent`** que hoy están como strings literales dispersos.

## Estado Real
> **Vacío (solo `context.md`).** No hay archivos TS. Eventos se disparan/escuchan ad-hoc en `hooks/app/useAppController`, `game/scenes/MainScene`, `characters/Survivor`, `ui/menus/Navbar` (vía `hooks/menu/useNavbar`), `game/systems/*`, `ui/hud/*`.

Pero existe `src/events/dto/game-event.dto.ts:1` (fuera de `game/events`, en `src/events/dto/`): `class GameEventDto { settlementId, survivorId, type, sequenceNumber ... }` relacionado con socket (no bus window). No confundir.

## Rol Previsto
- `GameEvents.ts` — `enum GameEvent { NpcSelected="phaser-npc-selected", ... }` + `interface GameEventPayload { "phaser-npc-selected": NpcPanelData; "phaser-create-npcs": {count:number}; ... }` + helpers `emit<K>(event,payload)` / `on<K>(event,handler)` tipados.

## Eventos Actuales (a tipar, dispersos)
| Evento | Emitido en | Escuchado en |
|---|---|---|
| `phaser-npc-selected` | `Survivor:109`, `MainScene:58` (focus), `Player click` | `useAppController:129` → `setSelectedNPC` |
| `phaser-npc-deselected` | `MainScene:281` (ESC), `InteractionSystem:56` | `useAppController:133` |
| `phaser-toggle-tutorial` | `InputSystem` TAB | `useAppController:144` |
| `phaser-zoom-sync` | `CameraSystem:50`, `CameraController:70` | `useAppController:134` → `setZoom` |
| `phaser-zoom-set` | `useAppController:191` | `CameraSystem:35`, `CameraController:48` |
| `phaser-create-npcs` | `Console:116` regex `createnpc1..10` | `MainScene:42` → `spawnNpcs` |
| `phaser-npcs-spawned` | `SpawnSystem:70` | `Console` history |
| `phaser-chat-bubble` | `Console:??` chat mode | `ChatBubbleSystem:16` |
| `phaser-focus-npc` | `FollowersPanel:??` via `useFollowers` | `MainScene:48` centerOn |
| `phaser-camera-follow` | `MainScene:221` | (debug `window.__CAMERA_FOLLOW__`) |
| `phaser-action-inventory/map/missions/stats` | `MainScene:282` (`I/M/J/P`) | `useAppController:146` toggles |
| `phaser-action-buildings/config` | `Navbar` via `useNavbar` | `useAppController:148` |
| `minimap-goto` / `minimap-goto-world` | `useMiniMap/handleMiniMapClick`, `useWorldMap` | `MainScene:174` centerOn |
| `wheel` ctrl | DOM | `MainScene:186`, `CameraController:40` prevent |

## Dependencias Previstas
- `ui/input/KeyBindings`, `characters/Survivor` (`getPaqueteUI`), `hooks/character/useNpcPanel` (`NpcPanelData`)

## Para Repomix
Crear `GameEvents.ts` aquí antes de que el bus crezca. Migrar `useAppController` y `MainScene` a helpers tipados para evitar typos. Mantener `src/events/dto/game-event.dto.ts` separado (es DTO socket, no window bus).
