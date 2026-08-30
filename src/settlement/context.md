# settlement / Context — Gestión del Asentamiento (Stubs — Real en `hooks/buildings`)

## Propósito
Meta-gestión colonia: población, trabajos, órdenes, recursos, administración. Equivalente `Settlement` RimWorld.

## Estado Real
> **STUB — 5 archivos 0 bytes, sin lógica activa.** `Navbar` placeholders `Seguidores/Edificios` ahora tienen handlers reales (`FollowersPanel`, `BuildingsPanel` vía `useAppController`), pero `settlement/*` sigue vacío. Lo funcional está en `hooks/buildings/buildingsData.ts` (40+ edificios mold) y `app/store/useGameStore` (settlement survivors/buildings inventory fetch API).

| Archivo | Bytes | Estado |
|---|---|---|
| `Settlement.ts` | 0 | Vacío |
| `Jobs.ts` | 0 | Vacío |
| `Orders.ts` | 0 | Vacío |
| `Economy.ts` | 0 | Vacío |
| `Management.ts` | 0 | Vacío |

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `Settlement.ts` | `class Settlement {id,nombre,poblacion:Survivor[],edificios:Building[],recursos:Map<ResourceType,number>,moral,reputacion}` agregador. |
| `Jobs.ts` | Tablón `Job {id,type:'construir'|'cosechar'|'minar'|'cazar'|'cocinar',priority,location:Vector2,skillRequired,assignedTo?,buildingId?}` CRUD `create/cancel/assign/complete` sort prioridad. |
| `Orders.ts` | Directivas `Order {type:'talar'|'construir'|'patrullar'|'recolectar',area:Rect,priority}` → `Jobs` via `Management`. |
| `Economy.ts` | `stock Map`, `canAfford(cost),consume,produce, income-upkeep`, trading. Conecta `items/Inventory` con `buildings/Production`. |
| `Management.ts` | Overview, prioridades, `Job→Survivor` por `Skills+Traits+Loyalty`, reportes moral, alertas `hambre colectiva>70`. |

## Lógica Prevista
```
Orders.create({type:'construir',buildingType:'house',x,y}) → Management.toJobs → Jobs.create({type:'construir',priority:5,skill:'construccion'})
  → Management.assign() // elige mejor Skills
  → ai/TaskSystem → Pathfinding → Survivor.moverEnDireccion → Construction.tick
  → Economy.consume({madera:10,piedra:5}) → Settlement.recursos update
```

## Dependencias Previstas
- **Consume:** `characters/Survivor,Skills,Traits,Loyalty`, `items/Resources`, `buildings/Building`, `ai/TaskSystem`, `world/Time`
- **Provee a:** `ai/TaskSystem` (fuente Tasks), `buildings/*`, `ui/menus/Navbar`, `save/SaveData`
- **Hoy real:** `hooks/buildings/buildingsData` + `useGameStore:settlement` + `ui/settlement/InventoryPanel|ProfessionTree` ya exponen inventario central BigInt y árbol 21 profesiones vía API core.

## Relación Profesiones
10 profesiones `Survivor.PROFESIONES` vs 21 `ProfessionTree.PROFESSIONS` (LENADOR..DIPLOMATA) → mapear a `JobType` para scoring `Management.assign`.

## Para Repomix
Implementar `Settlement`+`Economy` primero (data simple `Map<string,number>`), luego `Jobs`, luego `Orders`+`Management`. No duplicar stock `Inventory` individual vs `Settlement` global sin sync — usar `useGameStore` como fuente verdad hoy.
