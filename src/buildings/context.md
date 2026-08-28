# buildings / Context — Sistema de Construcción y Producción

## Propósito
Módulo de **colonia city-builder**. Gestiona colocación, construcción progresiva y producción de edificios (casas, talleres, granjas, almacenes). Es el output tangible de la economía del asentamiento.

## Estado Actual
> **STUB — 3 archivos vacíos (0 líneas).** Sin lógica activa. `ui/menus/Navbar.tsx:93` botón "Construcción" ya dispara `phaser-action-construction` pero no hay listener. Ningún `Building` se instancia en `game/scenes/MainScene`.

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `Building.ts` | Entidad base. `class Building { id, type, x,y, hp, state:'blueprint'\|'construction'\|'built', requiredResources: Map<string,number>, workersAssigned: string[], sprite?: Phaser.GameObjects.Sprite }` + colisión Arcade. Tipos: `house`, `workshop`, `farm`, `storage`, `wall`. |
| `Construction.ts` | Lógica de obra. Ghost preview al colocar, validación de recursos vía `items/Inventory` / `settlement/Economy`, progreso `progress 0..100` tick dependiente de `characters/Skills.construccion` y `settlement/Jobs` asignados, consumo de recursos al completar. |
| `Production.ts` | Recetas y producción continua. `Recipe { inputs: Resource[], outputs: Item[], time: number }`. Consume `items/Resources`, produce `items/Food`/`items/Equipment`. Tick en `world/Time`, requiere trabajador asignado y edificio en estado `built`. |

## Lógica Prevista / Flujo
```
Jugador click "Construcción" (Navbar) -> phaser-action-construction
  -> Construction.showGhost(type, x,y) // valida settlement/Economy.canAfford
  -> Building.create(blueprint) // sprite fantasma + requiredResources
  -> Jobs.create({type:'construir', buildingId, priority}) // settlement/Jobs
  -> ai/TaskSystem asigna Survivor con skill construccion
  -> Construction.tick(dt) // progress += skill*dt, consume stamina
  -> Building.state='built' -> Production.enable(recipes)
  -> Production.tick(dt) // input->output cada Time tick
```

## Dependencias
- **Consume:** `items/Inventory`, `items/Resources`, `items/Item`, `characters/Skills`, `characters/Survivor`, `settlement/Jobs`, `settlement/Economy`, `settlement/Settlement`, `world/Time`, `ai/TaskSystem`, `ai/Pathfinding`
- **Provee a:** `settlement/Settlement` (lista de edificios), `game/scenes/MainScene` (sprites/colisiones), `ui/menus/Navbar` (ghost UI futuro)
- **No hay imports activos aún.**

## Diseño Sugerido
```ts
// buildings/Building.ts
type BuildingState = 'blueprint' | 'construction' | 'built';
type BuildingType = 'house'|'workshop'|'farm'|'storage'|'wall';
class Building { constructor(type:BuildingType, x:number,y:number) /* ... */ }

// buildings/Construction.ts
function canPlace(type: BuildingType, x:number,y:number, economy: Economy): boolean
function tickConstruction(buildings: Building[], dt:number, workers: Survivor[]): void
```

## Para Repomix
Prioridad media-alta. Implementar `Building` primero como data + sprite estático, luego `Construction` con `Jobs` integration. Mantener `Production` desacoplado (puede ser sistema separado que itera `buildings` cada `Time` tick).
