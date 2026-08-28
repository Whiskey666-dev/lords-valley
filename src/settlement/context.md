# settlement / Context — Gestión del Asentamiento

## Propósito
Módulo de **meta-gestión de colonia**. Es el cerebro económico y organizativo: población, trabajos, órdenes del jugador, recursos y administración. Equivalente al `Settlement` de RimWorld / `Town` de Banished.

## Estado Actual
> **STUB — 5 archivos vacíos (0 líneas).** Sin lógica activa. `ui/menus/Navbar.tsx:36-44` ya tiene placeholders `Seguidores/Edificios` + botón `Construcción` que dispara `phaser-action-construction` sin handler. `characters/Survivor.profesion` (10 tipos) anticipa matching con jobs.

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `Settlement.ts` | Entidad central. `class Settlement { id, nombre, poblacion: Survivor[], edificios: Building[], recursos: Map<ResourceType,number>, moral:number, reputacion:number }`. Agregador de todo lo demás. |
| `Jobs.ts` | Tablón de trabajos. `interface Job { id, type:'construir'|'cosechar'|'minar'|'cazar'|'cocinar', priority:number, location:Vector2, skillRequired: SkillName, assignedTo?:string, buildingId?:string }`. CRUD: `create/cancel/assign/complete`, sorting por prioridad. |
| `Orders.ts` | Órdenes del jugador (directivas). `Order { type:'talar'|'construir'|'patrullar'|'recolectar', area:Rect, priority }` creadas desde `ui/` (Navbar, mapa). Se convierten en `Jobs` vía `Management`. |
| `Economy.ts` | Flujo de recursos. Stockpiles, `canAfford(cost)`, `consume(cost)`, `produce(item)`, balance `income - upkeep`, trading. Conecta `items/Inventory`/`items/Resources` con `buildings/Production`. |
| `Management.ts` | Lógica de administración. Overview del asentamiento, prioridades de trabajo, asignación automática `Job -> Survivor` por `Skills` + `Traits` + `Loyalty`, reportes de moral, alertas (`hambre colectiva > 70`). |

## Lógica Prevista / Flujo
```
Jugador ordena "Construir Casa" (Navbar Orders) -> Orders.create({type:'construir', buildingType:'house', x,y})
  -> Management.toJobs(order) -> Jobs.create({type:'construir', priority:5, skillRequired:'construccion', buildingId})
  -> Jobs.assign() // elige Survivor con mejor Skills.construccion + disponibilidad (ai/TaskSystem)
  -> ai/TaskSystem asigna Task a Survivor -> ai/Pathfinding -> Survivor.moverEnDireccion -> buildings/Construction.tick
  -> Economy.consume({madera:10, piedra:5}) al inicio, Economy.produce al completar
  -> Settlement.recursos update -> UI refleja stock
```

## Dependencias
- **Consume:** `characters/Survivor`, `characters/Skills`, `characters/Traits`, `characters/Loyalty`, `items/Resources`, `items/Inventory`, `buildings/Building`, `buildings/Construction`, `ai/TaskSystem`, `world/Time` (tick)
- **Provee a:** `ai/TaskSystem` (fuente de Tasks), `buildings/*` (demanda de construcción), `ui/menus/Navbar` (stats asentamiento), `game/scenes/MainScene` (estado global), `save/SaveData` (serialización)
- **No hay imports activos.**

## Diseño Sugerido
```ts
// settlement/Settlement.ts
class Settlement { poblacion: Survivor[]; recursos: Map<string,number>; moral:number; getPoblacionActiva(): Survivor[]; }

// settlement/Jobs.ts
type JobType = 'construir'|'cosechar'|'minar'|'talar'|'cazar'|'cocinar'|'defender';
interface Job { id:string; type:JobType; priority:number; location:{x:number;y:number}; skillRequired:SkillName; assignedTo?:string; status:'pendiente'|'asignado'|'completo'; }

// settlement/Economy.ts
class Economy { stock: Map<string,number>; canAfford(cost:Record<string,number>):boolean; consume(cost):void; produce(item:string, qty:number):void; }
```

## Relación con Profesiones (`characters/Survivor.ts:51`)
10 profesiones (`Granjero`, `Carpintero`, `Herrero`, `Cazador`, `Médico`, `Constructor`, `Minero`, `Explorador`, `Cocinero`, `Líder`) deben mapear a `JobType` preferente para scoring de `Management.assign`.

## Para Repomix
Implementar `Settlement` + `Economy` primero (data simple), luego `Jobs` (tablón), luego `Orders` + `Management` (lógica de asignación). Mantener `Economy` como fuente de verdad de recursos — no duplicar stock en `Inventory` individual y `Settlement` global sin sync.
