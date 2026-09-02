# src/game/systems/context.md — Sistemas de Juego (Phaser)

> Sistemas de bajo nivel de Phaser que operan en el game loop. Todos se instancian desde `MainScene.create()`.

## Sistemas Implementados

### `FarmPlacementSystem.ts` — Sistema de Colocación de Parcelas ✅
- **Ghost preview isométrico**: polígono de rombo café con bordes verde/rojo según validez del tile
- **Validación de tile** (`isTileFreeAndValid`): excluye agua, minerales, árboles, colisiones y parcelas existentes
- **Suscripción a cambios**: `farmPlotManager.subscribe()` → `refreshAllPlots()` en cada cambio
- **Renderizado de cultivos**: texturas con key `crop_${cropId}`, 6 frames; escala por etapa (0.55 → 0.90)
- **Animación de cosecha**: tween `scaleY` yoyo suave para cultivos listos
- **Indicador flotante**: texto "✨ ¡Listo! 🌾" para cultivos maduros
- **Interactividad**: `Phaser.Geom.Polygon` como hit area del rombo isométrico
- Eventos escuchados: `phaser-start-placement`, `phaser-cancel-placement`, `phaser-plant-crop`, `phaser-harvest-crop`
- Eventos emitidos: `phaser-crop-plot-selected`, `phaser-placement-mode-changed`, `phaser-farm-plots-changed`

### `FogOfWarSystem.ts` — Niebla de Guerra ✅
- Renderizado Phaser puro (sin DOM) para 60 FPS
- Máscara circular alrededor del jugador
- `FogOverlay.tsx` en React es `return null` — no interfiere

### `MineralPhysics.ts` — Física de Minerales ✅
- Partículas y animaciones al extraer minerales
- Integrado con `CollisionMatrix` para vetas sólidas

### `WaterPhysics.ts` — Física de Agua ✅
- Ondas animadas en tiles de agua
- Usa `isWaterTileFast` para identificar tiles

### `InputSystem.ts` — Adaptador de Input ✅
- Wrapper sobre `ui/input/KeyBindings` para Phaser
- `getMovementVector()`: vector de movimiento normalizado desde WASD/flechas
- `is*JustPressed()`: acciones one-shot (atacar, interactuar, etc.)
- Respeta `isGameInputBlocked()` para cuando el foco está en UI

### `InteractionSystem.ts` — Sistema de Interacción ✅
- Gestiona clics en NPCs, Dead Dragons y parcelas
- Dispara los eventos `phaser-npc-selected`, `phaser-dead-dragon-selected`, `phaser-crop-plot-selected`

### `SelectionSystem.ts` — Sistema de Selección ✅
- Manejo de selección visual de entidades en el mapa

### `SpawnSystem.ts` — Sistema de Spawn ✅
- Generación inicial de NPCs y entidades

### `ChatBubbleSystem.ts` — Burbujas de Chat ✅
- Globos de texto flotantes sobre personajes

### `CameraController.ts` + `CameraSystem.ts` — Cámara ✅
- `CameraController`: drag con botón central/derecho del mouse
- `CameraSystem`: zoom `0.6..1.6` (mapeado desde `0..100`) vía `phaser-zoom-set`
- Expone `__PHASER_CAMERA__` en `window` para acceso desde React (`useMineralTooltip`)

## Convenciones
- Todos los sistemas se crean en `MainScene.create()` y se destruyen en `SHUTDOWN`
- Los sistemas de Phaser se comunican con React solo via `window.CustomEvent`
- NO hay imports de React en `game/systems/`
