# ai / Context — Inteligencia Artificial de NPCs (Stubs)

## Propósito
Autonomía de NPCs. Cuando `Survivor` no recibe orden directa, este módulo decide qué hacer. Cerebro colony-sim (RimWorld-like).

## Estado Real
> **STUB — 4 archivos 0 bytes, sin lógica activa.** `characters/Survivor:120 updateEntity` solo `idle()` + `setVelocity 0` y expone API `moverEnDireccion/saltar/dash/atacar()` esperando a `ai/*`. Ningún import desde `ai/` existe.

| Archivo | Bytes | Estado |
|---|---|---|
| `TaskSystem.ts` | 0 | Vacío |
| `Pathfinding.ts` | 0 | Vacío |
| `NeedsSystem.ts` | 0 | Vacío |
| `DecisionSystem.ts` | 0 | Vacío |

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `TaskSystem.ts` | Cola priorizada `Task {id,type,priority,target:Vector2,buildingId?,itemId?}`. Asigna `Job` de `settlement/Jobs` a `Survivor` libre. |
| `Pathfinding.ts` | A* sobre grilla `game/world/Terrain` (`isWaterTile`, `CHUNK_TILES`) / `world/Chunks`. `findPath(start,end):Direction8[]` evita colisiones edificios. |
| `NeedsSystem.ts` | Tick `Needs.simularNecesidades()` (`hambre+=0.1, sed+=0.2`) cada X s via `world/Time`, dispara urgencia si `>80`. |
| `DecisionSystem.ts` | Utility scoring `evaluate(survivor):TaskType` `utility = needs*weights + personality + traits + skills + loyalty`. Ej. `hambre alta + comida disponible → COMER`. |

## Lógica Prevista / Flujo
```
game/world/Terrain + world/Time tick (cada X s)
  → NeedsSystem.update(dt) // hambre/sed check umbrales
  → DecisionSystem.evaluate(survivor) // scoring por survivor
  → TaskSystem.assign(survivor,bestTask) // encola prioridad
  → Pathfinding.findPath(pos,target) // A* sobre Terrain
  → Survivor.moverEnDireccion(dir) / atacar() / etc.
  loop hasta completar → liberar y re-evaluar
```

## Dependencias Previstas
- **Consume:** `characters/Survivor/Needs/Personality/Traits/Skills/Loyalty`, `settlement/Jobs/Orders`, `game/world/Terrain`, `world/Time`
- **Provee a:** `characters/Survivor` (llamando `moverEnDireccion`), `game/scenes/MainScene` (tick `update`)
- **No depende de:** `ui/` directo (aunque `Task` combate delega a `combat/CombatSystem`)

## Diseño Sugerido
```ts
interface Task { id:string; type:'comer'|'beber'|'dormir'|'trabajar'|'construir'|'patrullar'; priority:number; target:Phaser.Math.Vector2; buildingId?:string; itemId?:string; assignedTo?:string; }
class TaskSystem { queue:Task[]; assign(s:Survivor):Task|null; complete(id:string):void; }
function scoreTask(s:Survivor, t:Task):number
function updateNeeds(survivors:Survivor[], dt:number)
function findPath(start:Vector2,end:Vector2, terrain:Terrain):Direction8[]
```

## Para Repomix
Mayor gap colony-sim, prioridad alta. Al implementar mantener desacoplado de `Scene` — recibir `Scene` solo en `Pathfinding` para colisiones. Usar `game/world/Terrain:WORLD_*` para grid, no `world/Chunks` stub. `SurvivorSprite` interpolado (`game/entities`) puede ser target de Pathfinding.
