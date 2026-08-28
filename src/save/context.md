# save / Context — Persistencia y Simulación Offline

## Propósito
Módulo de **guardado/carga y progresión offline**. Debe serializar todo el estado del mundo y simular el paso del tiempo cuando el juego está cerrado (colony idle).

## Estado Actual
> **STUB — 3 archivos vacíos (0 líneas).** Sin implementación. El único uso de persistencia hoy es `ui/input/KeyBindings.ts:52` que guarda bindings en `localStorage` (`lordsvalley_keybindings_v1`), fuera de este módulo.

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `SaveData.ts` | Esquema de serialización. `interface SaveData { version:string; timestamp:number; player:{x,y,stats:Stats}, npcs: SurvivorData[], world:{time, seasons, weather, chunks}, settlement: SettlementData, buildings: BuildingData[], economy: EconomyData }`. Debe ser JSON-serializable (sin referencias Phaser). |
| `SaveSystem.ts` | API de persistencia. `save(slot:number, data:SaveData):void` (`localStorage` / `IndexedDB`), `load(slot):SaveData|null`, `autosave()` cada `world/Time` tick, `hasSave(slot):boolean`, `deleteSave(slot)`. Maneja migración `version`. |
| `PersistenceSimulation.ts` | Simulación offline. `simulateOffline(elapsedMs: number, lastSave: SaveData): SaveData` — al cargar, calcula `delta = now - timestamp` y simula `Needs` (+= hambre/sed), `Production` (recetas), `Economy` (recursos), `Events` aleatorios, `Loyalty` drift. Retorna estado actualizado sin haber corrido Phaser. |

## Lógica Prevista / Flujo
```
// Guardado
world/Time tick cada 30s -> SaveSystem.autosave() -> JSON.stringify(SaveData) -> localStorage.setItem(`lordsvalley_save_${slot}`)

// Carga
App mount -> SaveSystem.load(slot) -> if found
  -> PersistenceSimulation.simulateOffline(Date.now() - save.timestamp, save)
  -> aplicar resultado: restaurar Player pos, npcs, buildings, settlement
  -> MainScene.create con estado restaurado
else
  -> new game (MainScene actual)

// Manual
ui/menus/Navbar "Guardar" -> SaveSystem.save(slot, currentSaveData)
```

## Dependencias
- **Consume (cuando exista):** `characters/Player`, `characters/Survivor` (+ todos sus sub-módulos), `world/Time`, `world/Seasons`, `world/Weather`, `world/Chunks`, `world/Map`, `settlement/Settlement`, `settlement/Economy`, `buildings/Building`, `items/Inventory`
- **Provee a:** `app/App.tsx` (carga inicial), `game/scenes/MainScene` (restauración), `ui/menus/Navbar` (slots UI futuro)
- **No depende de:** `Phaser.Scene` directamente — debe ser serialización pura.

## Diseño Sugerido
```ts
// save/SaveData.ts
interface SaveData { version: "0.1.0"; timestamp: number; player: { x:number; y:number; salud:number; }; npcs: Array<{id:string; nombre:string; x:number; y:number; stats:any; needs:any;}>; world: { day:number; season:string; weather:string; } }

// save/SaveSystem.ts
class SaveSystem { static save(slot:number, data:SaveData): void; static load(slot:number): SaveData|null; static autosave(data:SaveData): void; }

// save/PersistenceSimulation.ts
function simulateOffline(elapsedMs:number, data:SaveData): SaveData // aplica Needs.simularNecesidades * ticks, Production.tick, etc.
```

## Para Repomix
Prioridad baja-media (después de `world/` y `ai/`). Al implementar, evitar guardar referencias Phaser (`Sprite`, `Scene`, `Body`) — solo data pura. Considerar `IndexedDB` si `SaveData` supera límite `localStorage` 5MB (con muchos NPCs/buildings). `PersistenceSimulation` debe ser determinista y testeable sin Phaser.
