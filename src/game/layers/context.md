# src/game/layers/context.md — Capas de Renderizado Isométrico

> Sistema de capas para el renderizado del mundo isométrico en Phaser. Separa terreno estático de entidades dinámicas.

## Archivos

### `StaticGroundLayer.ts` — Capa A: Suelo Estático
- **Responsabilidad única**: inicializar la `CollisionMatrix` desde el terreno procedimental
- `bake()`: llama a `collisionMatrix.buildFromTerrain(isWaterTileFast, getMineralTypeFast, isTreeTile)` exactamente una vez
- **Guarda `baked = true`** para evitar reconstrucciones innecesarias (O(WORLD_TILES²) → 192×192 = 36,864 tiles)
- Llamado desde `MainScene.create()` antes de instanciar `ChunkRenderer`

### `DynamicLayer.ts` — Capa B: Entidades Dinámicas
- **Único `Phaser.GameObjects.Group`** para jugador, NPCs, enemigos y edificios
- **Depth sorting O(1)**: cada entidad tiene `depth = y` (posición Y isométrica determina orden de profundidad)
- API:
  - `add(obj)` → agrega al grupo y aplica `setDepth(obj.y)`
  - `remove(obj, destroy?)` → saca del grupo
  - `sortByDepth(camera?)` → actualiza depth de todos los children activos
  - `addBuilding(sprite, tileX, tileY, w, h, matrix)` → agrega edificio + marca colisión en `CollisionMatrix`
  - `count()` → número de entidades activas
  - `destroy()` → limpieza total

## Jerarquía de Depth en la Escena
| Depth | Contenido |
|---|---|
| 0 | Terreno de fondo (generado por ChunkRenderer) |
| 1-5 | Agua (animaciones de olas) |
| 2 | Parcelas de cultivo (`FarmPlacementSystem.plotsContainer`) |
| 3+ | Parcelas individuales (depth + tileY * 0.001 para isosorteo) |
| Y_iso | Entidades dinámicas (jugador, NPCs, Dead Dragons) |
| 999 | Ghost preview de colocación (`FarmPlacementSystem.ghostGraphics`) |

## Notas de Integración
- `ChunkRenderer` también llama a `collisionMatrix.buildFromTerrain()` en su constructor como salvaguarda
- `StaticGroundLayer` garantiza que la matriz esté lista antes del primer frame
- El `DynamicLayer.group` NO usa físicas Arcade para el mapa; la colisión es `CollisionMatrix.isBodyBlockedAt()`
