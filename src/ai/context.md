# ai / Context — Inteligencia Artificial de NPCs

## Propósito
Módulo de **autonomía de NPCs** para Lords Valley. Cuando un `Survivor` no recibe orden directa del jugador, este módulo decide qué hacer. Es el cerebro del colony-sim (equivalente a la IA de RimWorld).

## Estado Actual
> **STUB — 4 archivos vacíos (0 líneas).** No hay lógica activa. `characters/Survivor.ts:114` `updateEntity()` solo hace `idle()` y expone stubs `moverEnDireccion/saltar/dash/atacar()` esperando a que este módulo los llame. Ningún import desde `ai/` existe aún.

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `TaskSystem.ts` | Cola de tareas priorizadas. `Task { id, type, priority, target: Vector2, buildingId?, itemId? }`. Asigna `Job` de `settlement/Jobs` a `Survivor` libre. |
| `Pathfinding.ts` | Pathfinding A* sobre grilla de `world/Chunks` / `world/Map`. `findPath(start, end): Direction8[]`. Debe evitar colisiones y edificios. |
| `NeedsSystem.ts` | Tick periódico de necesidades. Llama `characters/Needs.simularNecesidades()` (`hambre+=0.1, sed+=0.2` c/ tick lento) y dispara urgencia si `hambre/sed/sueño > 80`. |
| `DecisionSystem.ts` | Scoring de utilidades. `evaluate(survivor): TaskType`. Formula: `utility = needs*weights + personality + traits + skills + loyalty`. Ej: `hambre alta + comida disponible => Task COMER`. |

## Lógica Prevista / Flujo
```
world/Time tick (cada X seg)
  -> NeedsSystem.update(dt)  // incrementa hambre/sed, check umbrales
  -> DecisionSystem.evaluate(survivor) // scoring por survivor
  -> TaskSystem.assign(survivor, bestTask) // encola segun prioridad
  -> Pathfinding.findPath(survivor.pos, target.pos)
  -> Survivor.moverEnDireccion(dir) / Survivor.atacar() / etc.
  loop hasta completar task -> liberar y re-evaluar
```

## Dependencias
- **Consume:** `characters/Survivor`, `characters/Needs`, `characters/Personality`, `characters/Traits`, `characters/Skills`, `characters/Loyalty`, `settlement/Jobs`, `settlement/Orders`, `world/Chunks`, `world/Map`, `world/Time`
- **Provee a:** `characters/Survivor` (llamando sus métodos de movimiento/acción), `game/scenes/MainScene` (podría llamarse desde `MainScene.update`)
- **No depende de:** `ui/`, `combat/` directamente (aunque `Task` de combate delega a `combat/CombatSystem`)

## Diseño Sugerido para Implementación
```ts
// ai/TaskSystem.ts
interface Task { id: string; type: 'comer'|'beber'|'dormir'|'trabajar'|'construir'|'patrullar'; priority: number; target: Phaser.Math.Vector2; buildingId?: string; itemId?: string; assignedTo?: string; }
class TaskSystem { queue: Task[]; assign(s: Survivor): Task | null; complete(id: string): void; }

// ai/DecisionSystem.ts
function scoreTask(survivor: Survivor, task: Task): number // + intra-traits
// ai/NeedsSystem.ts
function updateNeeds(survivors: Survivor[], dt: number)
// ai/Pathfinding.ts
function findPath(start: Vector2, end: Vector2, chunks: Chunks): Direction8[]
```

## Interacción con Otros Módulos (cuando se implemente)
- `world/Time` es el reloj que dispara el tick.
- `settlement/Jobs` es la fuente de trabajo (construir, cosechar).
- `buildings/Construction` provee targets de construcción.
- `combat/CombatSystem` para tareas de defensa/huida.

## Para Repomix
Este módulo es el **mayor gap** hacia la visión colony-sim. Prioridad alta. Al implementar, mantener desacoplado de Phaser `Scene` — recibir `Scene` solo en `Pathfinding` para acceso a colisiones.
