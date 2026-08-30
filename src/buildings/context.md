# buildings / Context — Sistema de Construcción y Producción (Stubs)

## Propósito
Módulo **colony city-builder**: colocación, construcción progresiva y producción de edificios (casas, talleres, granjas, almacenes). Output tangible de la economía.

## Estado Real
> **STUB — 3 archivos 0 bytes, sin lógica activa.** `BuildingsPanel` y `hooks/buildings/buildingsData.ts` (1548 líneas, 40+ edificios mock) viven en `ui/buildings/` + `hooks/buildings/` y **no** usan este módulo. `Navbar` botón Construcción dispara `phaser-action-construction` sin listener real.

| Archivo | Bytes | Estado |
|---|---|---|
| `Building.ts` | 0 | Vacío |
| `Construction.ts` | 0 | Vacío |
| `Production.ts` | 0 | Vacío |

Real implementado:
- `hooks/buildings/buildingsData.ts:1` 1548 líneas: `BuildingCategory 7` (extraction/industry/logistics/residential/tech/culture/military), `BuildingStatus existing|locked`, `HierarchyRole trabajador/supervisor/administrador/maestro`, `StoredItem`, `WorkerSlot`, `BuildingRecipe`, `BuildingData {id,name,category,tier,icon,description,durability,efficiency,level,maxWorkers,workers[],inventory[],recipe,unlockCost}`, `CATEGORY_INFO`, `INITIAL_BUILDINGS[40+]` (Cabaña Leñadores, Cantera, Mina Carbón locked, Mina Hierro locked, Aserradero, Silo, Almacén Central, Campamento Chozas, Taberna, Plaza Mercado, Capilla, etc) con workers mocks y recetas.
- `hooks/buildings/useBuildings:201` CRUD `assignWorker/removeWorker/changeWorkerRole/modifyInventoryItem/constructBuilding`, filtros `filterMode all|existing|locked`, `selectedCategory`, `searchQuery`, `activeTab gestion|administracion`.
- `ui/buildings/BuildingsPanel:908` modal `1060×670 #0c141f` con lista 310px y detalle gestión (bodega `progress maxInventoryWeight`, recipe inputs→outputs) / administración (puestos `#1..` + RoleBadge).

## Archivos (previstos en este módulo, no en hooks)
| Archivo | Rol Previsto |
|---|---|
| `Building.ts` | Entidad base `class Building {id,type,x,y,hp,state:'blueprint'|'construction'|'built', requiredResources, workersAssigned, sprite?:Sprite}` tipos `house|workshop|farm|storage|wall`. |
| `Construction.ts` | Ghost preview, validación `Economy.canAfford`, progress `0..100` tick `Skills.construccion`, consumo recursos. |
| `Production.ts` | `Recipe {inputs,outputs,time}` tick `world/Time`, requiere `built` + worker. |

## Dependencias Previstas
- **Consume:** `items/Inventory/Resources`, `characters/Skills/Survivor`, `settlement/Jobs/Economy`, `ai/TaskSystem`, `world/Time`
- **Provee a:** `settlement/Settlement`, `game/scenes/MainScene` (sprites/colisiones), `ui/buildings/BuildingsPanel` (cuando migre de mock)

## Para Repomix
Prioridad media. Implementar `Building` primero como data+sprite estático `Phaser.GameObjects.Sprite` arcade, luego `Construction` con `Jobs` integration. Reusar `hooks/buildings/buildingsData` como schema referencia pero no duplicar — migrar su `BuildingData` a este módulo cuando se implemente persistencia core.
