# world / Context — Simulación del Mundo (Stubs — Real en `game/world`)

## Propósito
Módulo de **simulación ambiental** previsto: tiempo, estaciones, clima, mapa/biomas, chunks y eventos aleatorios. Diseñado como definición pura (sin Phaser.Scene), instanciado luego por `game/world/` y `game/scenes/MainScene`.

## Estado Real
> **STUB — 6 archivos 0 bytes, sin lógica activa.** Todo el mundo actual corre vía `game/world/Terrain.ts` (298 líneas, procedural 6144×6144) y `game/scenes/MainScene:78` grid manual `Graphics 64px`. `game/systems/ChunkRenderer` carga 3×3 chunks vía `useGameStore`. No hay ciclo día/noche ni clima.

| Archivo | Bytes | Estado |
|---|---|---|
| `Time.ts` | 0 | Vacío |
| `Seasons.ts` | 0 | Vacío |
| `Weather.ts` | 0 | Vacío |
| `Map.ts` | 0 | Vacío |
| `Chunks.ts` | 0 | Vacío |
| `Events.ts` | 0 | Vacío |

## Rol Previsto (cuando se implemente)
| Archivo | Rol |
|---|---|
| `Time.ts` | `class WorldTime { day, hour 0..24, tick(dt)}` ciclo día/noche, emite `phaser-time-sync`, dispara `Needs.simularNecesidades` cada X s, `Production.tick`, `SaveSystem.autosave`. |
| `Seasons.ts` | `enum Season {primavera,verano,otoño,invierno} current:Season` cada N días, afecta `Weather`, crop yield, moral. |
| `Weather.ts` | `type Weather {tipo:'soleado'|'lluvia'|'nieve'|'tormenta', temp, humedad}` overlay Particles, modifica movimiento/producción. |
| `Map.ts` | `class GameMap { biomes, resourceNodes }` distribución madera/piedra/agua, tilemap futuro. **Hoy reemplazado por `game/world/Terrain.ts`** (water 5-15 tiles contiguo, minerales 6 vetas, árboles 23-70%). |
| `Chunks.ts` | `class Chunks { size, load/unload, getChunk }` streaming lazy. Hoy `ChunkRenderer` hace `rendered Map + pending Set 3×3`. |
| `Events.ts` | `Event {type:'raid'|'sequia'|'festival', execute()}` hookea `Economy/Loyalty/combat`. |

## Dependencias Previstas
- **Consume:** `Phaser.Scene`, `characters/Needs`, `buildings/Production`, `settlement/Economy`
- **Provee a:** `ai/NeedsSystem`, `ai/Pathfinding` (grid), `ui/menus/Navbar` reloj futuro, `save/SaveData`
- **No hay imports activos.**

## Relación con `game/world/Terrain.ts`
`Terrain.ts` es la **implementación real actual** (noise, agua contigua, minerales, árboles). Cuando `src/world/Map.ts` se implemente, debe **consumir/migrar** `Terrain` (mantener `WORLD_*` consts, `noise`, `MINERAL_CONFIGS`, `isWaterTile`). No duplicar lógica.

## Para Repomix
Implementar `Time.ts` primero — es el reloj que todo lo demás necesita. Luego `Weather` como data sin partículas, luego `Events`. Mantener `MainScene` grid como fallback hasta `Map` tilemap. Respetar `6144` no `2000` antiguo.
