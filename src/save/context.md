# save / Context — Persistencia y Simulación Offline (Stubs)

## Propósito
Guardado/carga y progresión offline: serializar mundo y simular paso de tiempo con juego cerrado (colony idle).

## Estado Real
> **STUB — 3 archivos 0 bytes, sin implementación.** Única persistencia hoy: `ui/input/KeyBindings:54 STORAGE_KEY lordsvalley_keybindings_v1` (reset a WASD a propósito, `setBinding` persiste pero constructor ignora), `app/store/useGameStore` fetch vía API core, y `game/scenes/MainScene:150 savePlayerPos` cada 5s + `beforeunload` vía `app/api/player.api`.

| Archivo | Bytes | Estado |
|---|---|---|
| `SaveData.ts` | 0 | Vacío |
| `SaveSystem.ts` | 0 | Vacío |
| `PersistenceSimulation.ts` | 0 | Vacío |

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `SaveData.ts` | Schema JSON-serializable `interface SaveData {version,timestamp, player:{x,y,stats}, npcs:SurvivorData[], world:{time,seasons,weather,chunks}, settlement, buildings, economy}` sin refs Phaser. |
| `SaveSystem.ts` | API `save(slot,data)` (`localStorage`/`IndexedDB`), `load(slot):SaveData|null`, `autosave()` cada `world/Time` tick, `hasSave`, `deleteSave`, migración `version`. |
| `PersistenceSimulation.ts` | `simulateOffline(elapsedMs,lastSave):SaveData` al cargar: `delta=now-timestamp` → `Needs` (+=hambre/sed), `Production` (recetas), `Economy`, `Events` aleatorios, `Loyalty` drift, determinista testeable sin Phaser. |

## Flujo Previsto
```
// Guardado
world/Time tick 30s → SaveSystem.autosave() → JSON.stringify → localStorage `lordsvalley_save_${slot}`

// Carga
App mount → SaveSystem.load(slot) → if found
  → PersistenceSimulation.simulateOffline(Date.now()-save.timestamp, save) → restaurar Player/npcs/buildings
else → new game (MainScene actual)

// Manual
Navbar Guardar → SaveSystem.save(slot,current)
```
Hoy: `fetchSettlement` + `fetchPlayer lastPos` + `savePlayerPos 5s` reemplazan este flujo vía backend core.

## Dependencias Previstas
- **Consume:** `characters/*`, `world/*`, `settlement/*`, `buildings/*`, `items/*`
- **Provee a:** `app/App` (carga), `game/scenes/MainScene` (restauración), `ui/menus/Navbar` slots futuro
- **No hay imports activos.**

## Para Repomix
Prioridad baja-media (después `world/`+`ai/`). No guardar refs Phaser (`Sprite,Scene,Body`) — solo data pura. Considerar `IndexedDB` si `SaveData` >5MB (muchos NPCs). Hoy el backend core en `app/api/settlement.api` y `app/store/useGameStore` ya persiste settlement/survivors; integrar `SaveSystem` con esa API en lugar de duplicar localStorage.
