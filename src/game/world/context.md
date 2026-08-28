# game/world / Context — Estado de Mundo en Runtime (Reservado)

## Propósito
Directorio **reservado vacío** para el **estado runtime del mundo** dentro de `game/` (instancia viva de `world/Time`, `world/Weather`, etc. usada por `MainScene`). Distinto de `src/world/` que define los sistemas/simulación — este es el holder instanciado.

## Estado Actual
> **Vacío.** `game/scenes/MainScene.ts:24` crea el mundo manualmente (`grid`, `world bounds`) sin usar `src/world/*` (stubs).

## Rol Previsto
- `WorldState.ts` — `class WorldState { time: WorldTime; weather: WeatherSystem; chunks: Chunks; map: GameMap; }` instanciado en `MainScene.create()` y tickeado en `MainScene.update(dt)`.
- Puente entre `src/world/` (definición) y `game/scenes/MainScene` (runtime).

## Dependencias Previstas
- `src/world/Time`, `src/world/Weather`, `src/world/Chunks`, `src/world/Map`, `Phaser.Scene`

## Para Repomix
Cuando `src/world/Time.ts` se implemente, instanciar aquí y pasar a `MainScene`. No duplicar lógica de `src/world/` — este módulo solo orquesta instancias.
