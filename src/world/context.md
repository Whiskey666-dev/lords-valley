# world / Context — Simulación del Mundo (Tiempo, Clima, Mapa)

## Propósito
Módulo de **simulación ambiental**. Debe manejar tiempo, estaciones, clima, mapa/biomas, chunks y eventos aleatorios que afectan a colonia, producción y supervivencia.

## Estado Actual
> **STUB — 6 archivos vacíos (0 líneas).** Sin lógica activa. `game/scenes/MainScene.ts:24` crea manualmente `grid 2000x2000 64px` (`add.grid 64px #1a1a1a`) como mapa temporal. No hay ciclo día/noche ni clima.

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `Time.ts` | Reloj del mundo. `class Time { day:number, hour:number (0..24), minute, tick(dt) }` ciclo día/noche, emite `phaser-time-sync` para UI reloj, dispara `Needs.simularNecesidades` cada X segundos, `Production.tick` y `SaveSystem.autosave`. |
| `Seasons.ts` | Estaciones. `enum Season { primavera, verano, otoño, invierno }`, `current:Season`, transición cada N días, afecta `Weather` (temp), crop yield (`buildings/Production`), moral (`settlement/Management`). |
| `Weather.ts` | Clima. `type Weather { tipo:'soleado'|'lluvia'|'nieve'|'tormenta', temperatura:number, humedad:number }`, overlay visual Phaser (partículas lluvia/nieve), modifica movimiento/producción/salud. |
| `Map.ts` | Biomas y recursos. `class Map { biomes: Biome[], resourceNodes: ResourceNode[] }` define distribución de madera/piedra/agua, zonas fértiles, tilemap futuro (si se migra de `grid` a `Phaser.Tilemaps`). |
| `Chunks.ts` | Streaming del mundo `2000x2000`. `class Chunks { size:number, load(chunkId), unload, getChunk(x,y) }` lazy load/unload para performance + grilla para `ai/Pathfinding`. Hoy todo el mundo está siempre cargado. |
| `Events.ts` | Eventos aleatorios. `Event { type:'raid'|'sequia'|'festival'|'enfermedad'|'comerciante', chance, execute() }` hookea `settlement/Economy` + `characters/Loyalty` + `combat/*`. Probabilidad modulada por `Seasons`/`Weather`. |

## Lógica Prevista / Flujo
```
Time.tick(dt) cada frame (MainScene.update)
  -> hour += dt * timeScale; if hour>=24 -> day++, hour=0, check Seasons transition
  -> cada 5s: Needs.simularNecesidades() para todos Survivors
  -> cada 1s: Weather.update() (probabilidad cambio)
  -> cada 10s: Events.roll() (si random < chance -> Events.execute)
  -> emite phaser-time-sync {day, hour, season, weather} -> ui Navbar clock

Chunks.getChunk(player.x, player.y) -> load vecinos, unload lejanos
  -> Pathfinding consulta Chunks para A* grid (obstáculos Buildings)

Seasons.current == 'invierno' -> Weather más nieve, Production granja yield 0.5x, Needs sueno mas rapido
```

## Dependencias
- **Consume:** `Phaser.Scene` (para grid/tilemap/particles), `characters/Needs`, `characters/Survivor`, `buildings/Production`, `settlement/Economy`, `settlement/Management`
- **Provee a:** `ai/NeedsSystem` (trigger), `ai/Pathfinding` (grid), `buildings/Production` (modificadores), `settlement/Economy` (eventos), `save/SaveData` (serialización `day/season/weather`), `ui/menus/Navbar` (reloj/clima UI futuro)
- **No hay imports activos.**

## Diseño Sugerido
```ts
// world/Time.ts
class WorldTime { day=1; hour=8; tick(dt:number){ this.hour+=dt*0.1; if(this.hour>=24){this.day++; this.hour=0;}}; get isNight():boolean{return this.hour<6||this.hour>20} }

// world/Weather.ts
type WeatherType = 'soleado'|'lluvia'|'nieve'|'tormenta';
class WeatherSystem { current:WeatherType='soleado'; update(dt:number, season:Season):void; }

// world/Chunks.ts
class Chunks { chunkSize=512; getChunkId(x:number,y:number):string; load(id:string):void; }
```

## Para Repomix
Implementar `Time.ts` primero — es el reloj que todo lo demás necesita. Luego `Chunks.ts` si el mundo crece o performance baja. `Weather` puede empezar como data sin partículas, luego añadir `Phaser.GameObjects.Particles`. `Events.ts` es el último (necesita settlement/combat). Mantener `MainScene` grid actual como fallback hasta `Map.ts` tilemap.
