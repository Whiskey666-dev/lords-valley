# app / Context — Root React + Store + Socket + Auth

## Propósito
`app/` es el **root React** y capa de integración. Monta Phaser, hidrata settlement vía API, gestiona estado global Zustand, socket `game` namespace y orquesta overlays. Es el único lugar donde `Phaser.Game` se instancia/destruye, pero ahora delega gran parte a `hooks/app/useAppController.ts`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `App.tsx:1` | 119 | Layout root. Usa `useAppController()` y renderiza `Navbar`, `MiniMap`, `TutorialPanel`, `Console`, `SettingsPanel`, `BuildingsPanel`, `WorldMapPanel`, `FollowersPanel`, `NpcPanel`, `PlayerInventoryPanel` + `AuthScreen`. Sin lógica directa, solo composición. |
| `store/useGameStore.ts:1` | 163 | **Zustand** store global. State `settlement, survivors, buildings, inventory, historyLog, chunks Map, selectedId, selectedBuildingId, zoom, loading, error, lastReceivedSequenceNumber`. Actions `fetchSettlement`, `patchSurvivor`, `selectSurvivor/Building`, `clearSelection`, `getChunk` (dedup `pendingChunks` + `fetchChunk`), `getLvyDisplay` (BigInt/1e18), `resetState` (sequence check). Listeners socket `SURVIVOR_LOYALTY_CHANGED/SETTLEMENT_TICK_COMPLETED/RESOURCE_EXTRACTED` con verificación `sequenceNumber` + `resetState` si mismatch. |
| `socket.ts:1` | 32 | Singleton `socket.io-client`. `getSocket()` lazy `io(VITE_WS_URL||localhost:3000/game, websocket, autoConnect, reconnection Infinity)`, handlers `connect/disconnect/connect_error`. `joinSettlement(settlementId)` emit + log, `leaveSettlement`. |
| `api/client.ts` | 10 | Cliente HTTP base (fetch con auth header). |
| `api/player.api.ts` | 17 | `fetchPlayer(playerId):Promise<PlayerDTO>` y `savePlayerPos(playerId, {x,y})` usado por `MainScene.savePlayerPos` (5s interval + `beforeunload`). |
| `api/settlement.api.ts` | 39 | `fetchSettlement(id)`, `fetchChunk(x,y)`, `fetchSettlementsByOwner(playerId)` usados por `useAppController` y `ChunkRenderer`. |
| `auth/AuthScreen.tsx:1` | 113 | Pantalla auth centrada `380px #151515`. Toggle `login|register` (2 botones), form `email/password (+username en register)`, error box rojo, submit `handleSubmit` vía `hooks/auth/useAuth`. Nota: usuario seed `test@lordsvalley.local / 12345678`. |

## Lógica — `hooks/app/useAppController.ts:1` (239 líneas) — **real controller**
- **State local:** `gameRef`, `selectedNPC`, `showTutorial`, `showPlayerInventory`, `showSettings`, `showFollowers`, `showBuildings`, `showMap`, `zoom:50`, `isAuthed` (localStorage `access_token`).
- **Zustand sync:** `survivors`, `selectedId` → mapea `survivor -> NpcPanelData` (`firstName+lastName`, `professions[0].type`, `needs.health`) en `useEffect:93`.
- **Cross-tab auth:** listeners `storage` (`access_token|player|settlementId`) y `auth-changed` custom event.
- **Hidratación:** `useEffect isAuthed` busca `settlementId` en localStorage, o `fetchSettlementsByOwner(playerId)` (de `playerId` o `player` JSON), guarda en localStorage, luego `fetchSettlement(sid)`.
- **Ciclo Phaser:** `useEffect isAuthed` lazy `startLaunchGame()` + fix canvas centering `translate(-50%,-50%) 200ms`, listeners `phaser-npc-selected/deselected`, `phaser-toggle-tutorial`, `phaser-zoom-sync`, `phaser-action-inventory/config/buildings/map`, `wheel` ctrl prevent. Cleanup `game.destroy` + removeListeners + `npcs desinstanciar`.
- **Atajos:** `keydown` TAB (`tutorial`) e `I` (`inventory`) con `getBinding` remapable, respeta `isRebindingActive/isConsoleOpenActive`.
- **Zoom:** `handleZoomIn/Out` step 10 `phaser-zoom-set`.
- **CloseNPC:** `clearSelection()` vía Zustand.

## Render — `App.tsx:44`
```
isAuthed? AuthScreen : <flex column 100vh>
  Navbar (zoom, is*Open flags)
  MiniMap (oculto si hasSidePanel || showMap)
  TutorialPanel + Console + SettingsPanel + BuildingsPanel + WorldMapPanel
  <flex row>
    FollowersPanel (fixed left 285px si showFollowers)
    #game-container flex 1 (Phaser parent)
    NpcPanel (right 320px scroll si selectedNPC) + PlayerInventoryPanel (fixed right 285px si showPlayerInventory)
```

## Dependencias
- **Importa de:** `game/main`, `ui/*` (todos paneles), `hooks/app/useAppController`, `app/store/useGameStore`, `app/socket`, `app/api/*`, `ui/input/KeyBindings`
- **No importa:** `characters/*`, `combat/*` directo — desacoplado vía `useGameStore` + eventos.
- **Provee a:** `main.tsx` (root `App`).

## Para Repomix
Cualquier nuevo panel global va en `useAppController` (nuevo `show*` + `handleToggle*` + listener `phaser-action-*`) y en `App.tsx` render condicional. No poner lógica Phaser aquí — usar `game/systems/` o `game/world/`.
