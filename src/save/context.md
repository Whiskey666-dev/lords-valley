# save / Context — Persistencia de Partida

## Propósito
Guardado/carga de partida: serializar estado de escena para restaurar al reentrar.

## Estado Real
> Parcial: `SaveData.ts` (interfaces) + `SaveSystem.ts` (161 líneas, usado por `MainScene`) implementados. Resto de persistencia: `app/store/useGameStore` vía API core y `MainScene savePlayerPos` cada 5s + `beforeunload` vía `app/api/player.api`.

| Archivo | Estado |
|---|---|
| `SaveData.ts` | Interfaces `SurvivorSaveData`, `DeadDragonSaveData`, `GhostSaveData`, `GameSaveData` |
| `SaveSystem.ts` | Usado por `MainScene` (`clear`, `saveGameState`, `load`) |

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `SaveData.ts` | Schema JSON-serializable sin refs Phaser. |
| `SaveSystem.ts` | API usada por `MainScene` para guardar/cargar estado de escena. |

## Flujo Previsto
```
// Guardado
MainScene saveGameState → SaveSystem + savePlayerPos 5s → backend core

// Carga
App mount → SaveSystem.load + fetchSettlement + fetchPlayer lastPos
```
Hoy: `fetchSettlement` + `fetchPlayer lastPos` + `savePlayerPos 5s` persisten vía backend core.

## Dependencias
- **Consume:** `characters/*`, `items/*`
- **Provee a:** `app/App` (carga), `game/scenes/MainScene` (restauración)

## Para Repomix
No guardar refs Phaser (`Sprite,Scene,Body`) — solo data pura. El inventario y las habilidades del jugador persisten en el backend (módulo `player`), no aquí.
