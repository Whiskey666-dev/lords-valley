# game/entities / Context — Entidades Phaser de Mundo

## Propósito
Entidades **Phaser vivas** que no son `characters/` humanos genéricos. Contiene render de terreno chunk y sprite interpolado con store.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `ChunkRenderer.ts:5` | 108 | **Render de terreno chunk.** `class ChunkRenderer(scene)` con `rendered Map<string,Container>`, `pending Set<string>`, `lastCenter`. `worldToChunk(worldX,Y)`→`{chunkX,Y,localX,Y}` via `CHUNK_PX/TILE`, `chunkKey`. `update(camera)` cada frame: centro `scroll+width/2`, throttle `dist<512` y `rendered.size>0` skip, calcula `neededChunks` 3×3 `[-1..1]²`, missing `!rendered && !pending` → `pending.add` → `Promise.all(getChunk(cx,cy) via useGameStore)` → `loadChunkData`, luego `destroy` chunks fuera de `needed`. `loadChunkData(key,_chunk)` crea `Container depth -10` + `Graphics` per tile `32px` color `isWater→WATER_DARK, mineral→getMineralColor, tree→TREE_BROWN, else BASE_GREEN` + borde chunk `strokeRect 0x1a2e1a 0.06`. Llamado `MainScene.update:237`. |
| `SurvivorSprite.ts:4` | 56 | **Sprite interpolado.** `class SurvivorSprite extends BaseHuman` (`survivorId`, `targetX/Y`). `constructor(scene,x,y,id)` `super(..., "player_idle_down","npc_","npc_")` depth 5 `npc_idle_down`. `setTarget(x,y)`, `updateInterpolation()` `Linear 0.15` hacia target, `dirFromDelta` atan2→8 dirs mapeo `['right','right_down','down',...]`, `moveInDirection` si `dist>2` else `idle`, `highlight(selected)` tint `0xffff99` scale 1.05 else clear. Diseñado para sync con `useGameStore` positions (no instanciado directamente en MainScene actual — MainScene usa `characters/Survivor.sprite`). |

## Estado
Ya no reservado vacío (old stub). `ChunkRenderer` es **crítico** para world 6144; `SurvivorSprite` es **activo pero secundario** (alternativa a `characters/Survivor:SurvivorSprite` inner class).

## Rol Previsto (futuro)
- `Drop.ts` item suelo (`items/Item` + collider pickup)
- `Projectile.ts` flecha/bala (`combat/Damage`)
- `ResourceNode.ts` árbol/piedra con hp (`items/Resources`)

## Dependencias
- `Phaser`, `game/world/Terrain` (`isWaterTile`, `isTreeTile`, `getMineralType/Color`), `app/store/useGameStore`, `characters/BaseHuman`
- Consumido por `game/scenes/MainScene` (ChunkRenderer)

## Para Repomix
Nuevas entidades no-humanas/no-edificio van aquí. Si es humana → `characters/`; edificio → `buildings/` (stub) o `hooks/buildings/`. Reactivo usar `ChunkRenderer` como ejemplo de `useGameStore.getChunk` + `Graphics` por tile.
