# game/entities / Context — Entidades Phaser de Mundo

## Propósito
Entidades **Phaser vivas** que no son `characters/` humanos genéricos. Hoy solo render de terreno por chunks.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `ChunkRenderer.ts:5` | 108 | **Render de terreno chunk.** `class ChunkRenderer(scene)` con `rendered Map<string,Container>`, `pending Set<string>`, `lastCenter`. `worldToChunk(worldX,Y)`→`{chunkX,Y,localX,Y}` via `CHUNK_PX/TILE`, `chunkKey`. `update(camera)` cada frame: centro `scroll+width/2`, throttle `dist<512` y `rendered.size>0` skip, calcula `neededChunks` 3×3 `[-1..1]²`, missing `!rendered && !pending` → `pending.add` → `Promise.all(getChunk(cx,cy) via useGameStore)` → `loadChunkData`, luego `destroy` chunks fuera de `needed`. `loadChunkData(key,_chunk)` crea `Container depth -10` + `Graphics` per tile `32px` color `isWater→WATER_DARK, mineral→getMineralColor, tree→TREE_BROWN, else BASE_GREEN` + borde chunk `strokeRect 0x1a2e1a 0.06`. Llamado `MainScene.update:237`. |

## Estado
`ChunkRenderer` es **crítico** para world 6144.

## Rol Previsto (futuro)
- `Drop.ts` item suelo (`items/Item` + collider pickup)
- `Projectile.ts` flecha/bala

## Dependencias
- `Phaser`, `game/world/Terrain` (`isWaterTile`, `isTreeTile`, `getMineralType/Color`), `app/store/useGameStore`, `characters/BaseHuman`
- Consumido por `game/scenes/MainScene` (ChunkRenderer)

## Para Repomix
Nuevas entidades no-humanas/no-edificio van aquí. Si es humana → `characters/`; edificio → `hooks/buildings/`. Reactivo usar `ChunkRenderer` como ejemplo de `useGameStore.getChunk` + `Graphics` por tile.
