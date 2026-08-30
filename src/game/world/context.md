# game/world / Context — Mundo Procedural en Runtime

## Propósito
**Estado runtime del mundo** dentro de `game/`. Contiene la **única implementación real de generación procedural** del proyecto (`Terrain.ts`), distinto de `src/world/` (stubs vacíos que definen interfaces futuras). Orquesta terreno, agua, árboles y minerales para `ChunkRenderer`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `Terrain.ts:1` | 298 | **Implementado completo.** Ver § Lógica. Único archivo del módulo (además de `context.md`). |

## Lógica — `Terrain.ts:1` (298 líneas)

**Constantes mundo:**
```ts
WORLD_CHUNKS=6, CHUNK_PX=1024, TILE=32, CHUNK_TILES=32, WORLD_SIZE=6144, WORLD_TILES=192
BASE_GREEN=0x3a7d44, TREE_BROWN=0x8b4513, WATER_DARK=0x023e8a, MINERAL_YELLOW=0xffd700
```

**Noise (`:12`):** `noise(cx,cy,x,y,seed) = sin(...) *10000 fract`, determinista, usado para `getTreeDensity`.

**Agua a nivel TILE 32px (`:19-127`):** `cachedWaterTiles:Set<string>`, `cachedWaterType:none|river|lake`
- Roll `random()`: `0.15 none`, `0.60 river`, `0.25 lake`.
- **Lake:** disco radio `5-15 tiles`, centro `30..W-60`, edgeNoise `±2`, contiguo.
- **River:** ancho inicial `5-15`, centerline meandro `50% este,25% norte/sur` (horizontal) o `50% sur,25% este/oeste` (vertical), variación ancho `±1 25%` por paso, expande perpendicular `h = w/2` + 20% borde irregular adyacente. Contiguo garantizado, cruza extremo a extremo.
- Helpers: `getWaterTiles():Set<string>`, `getWaterType()`, `getWaterChunks():Set<string>` (map tile→chunk), `isWaterTile(x,y)`, `isWaterChunk/isRiverChunk`.

**Árboles (`:167-178`):** `getTreeDensity(chunkX,Y) = 0.23 + noise*0.47` (23-70%), `isTreeTile(cx,cy,localX,Y)` = `!water && !mineral && noise < density` (determinista por chunk).

**Minerales vetas (`:181-270`):** `MINERAL_CONFIGS[6]` = CARBON `gid35 #1a1a1a 0.25 vein 8-15`, COBRE `30 #b87333 0.20 6-12`, ESTANO `31 #a8a9ad 0.18`, HIERRO `32 #5a5a5a 0.15`, PLATA `33 #c0c0c0 0.05 3-7`, ORO `34 #ffd700 0.02 2-5`. `cachedMineralTiles:Map<string,type>`, `generateMineralTiles()` escala `MINERAL_SCALE=0.18` (85% nominal→15% real jugable), targetTiles `= totalTiles * rarity * 0.18`, crecimiento veta contigua random dirs `±1` hasta `veinSize`, evita `occupied` (agua) y colisiones, `getMineralTiles/Type(x,y)`, `isMineralTile`, `getMineralColor/Css`, `isTreeTileFixed` alias.

**GID colors (`:276-298`):** `gidToColor/Css` para `102 WATER_DARK`, `2 TREE_BROWN`, `30-35` minerales, default `BASE_GREEN`.

**Compat:** `getWaterChunks`/`getRiverChunks` mantienen compatibilidad chunk-level aunque lógica es tile-level.

## Flujo
```
Terrain.generateWaterTiles() (lazy, una vez) ─┐
Terrain.generateMineralTiles() (evita agua)    ├→ ChunkRenderer.loadChunkData() per tile (32px) elige color
Terrain.isTreeTile(noise) (23-70% density)    ─┘  water > mineral > tree > green
                                                      │
MainScene.update → ChunkRenderer.update(camera) → 3×3 chunks Container Graphics depth -10
```

## Dependencias
- **No importa:** `Phaser` (puro data+math), `world/*` stubs.
- **Consumido por:** `game/entities/ChunkRenderer:3` (único consumidor), `hooks/hud/worldMapProcedural` (si existe, reusa lógica), `ui/hud/WorldMapPanel` (leyenda).
- **Provee a:** visual terrain; `ai/Pathfinding` futuro consultará `isWaterTile/isMineralTile` para A*.

## Para Repomix
No duplicar lógica de agua/minerales — usar `Terrain.isWaterTile/MineralTile` y `WORLD_*` consts. Al implementar `src/world/Map.ts` tilemap, migrar desde `Terrain` manteniendo `noise` y `MINERAL_CONFIGS`. Mundo fijo `6144`, no `2000` antiguo.
