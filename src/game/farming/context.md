# src/game/farming/context.md — Sistema de Agricultura

> Módulo de datos y gestión de parcelas de cultivo. Conecta Phaser (renderizado isométrico) con React (modal de siembra/cosecha).

## Archivos

### `farmData.ts` — Catálogo de Cultivos y Lógica de Crecimiento
- **29 cultivos** en 5 categorías: `cereal` (3), `vegetal` (6), `fruta` (12), `industrial` (3), `especial` (5)
- **Interfaz `CropDefinition`**: `id`, `name`, `icon`, `category`, `categoryLabel`, `description`, `spriteSrc`, `baseYield`
- **Sprites**: `384×64 px` con 6 frames de 64×64 px importados individualmente como módulos Vite
  - Frame 0: Semilla bajo tierra (invisible)
  - Frame 1-3: Etapas de crecimiento (6h, 12h, 18h)
  - Frame 4: Cultivo maduro (24h+)
  - Frame 5: Cosechado/vacío
- **Ciclo de crecimiento `calculateGrowthStatus(plantedAt, offsetMs)`**:
  - `CYCLE_TOTAL_HOURS = 24` (86,400,000 ms)
  - `0h-6h`: Etapa 0, `isVisible=false` (brote bajo tierra)
  - `6h-12h`: Etapa 1, Frame 1 (brote emergente)
  - `12h-18h`: Etapa 2, Frame 2 (planta media)
  - `18h-24h`: Etapa 3, Frame 3 (maduración)
  - `24h+`: Etapa 4, Frame 4, `isReady=true` (¡Listo para cosechar!)
- **Retorna `CropGrowthStatus`**: `stage(0-4)`, `isVisible`, `frameNumber`, `hoursElapsed`, `percent`, `isReady`, `timeRemainingFormatted`, `stageName`

### `FarmPlotManager.ts` — Gestión de Parcelas (Singleton)
- **Singleton**: `export const farmPlotManager = new FarmPlotManagerClass()`
- **Persistencia**: `localStorage` con key `lords_valley_farm_plots_v1`
- **Interfaz `FarmPlotData`**: `id`, `tileX`, `tileY`, `cropId|null`, `plantedAt|null`, `timeOffsetMs?`, `createdAt`
- **Interfaz `FarmPlotStatus`**: extiende `FarmPlotData` + `crop: CropDefinition|null`, `growth: CropGrowthStatus|null`
- **API pública**:
  - `placePlot(tileX, tileY)` → coloca parcela vacía
  - `removePlot(tileX, tileY)` → elimina parcela
  - `plantCrop(tileX, tileY, cropId)` → siembra cultivo
  - `harvestCrop(tileX, tileY)` → cosecha y limpia parcela → `{crop, yieldAmount}`
  - `advancePlotTime(tileX, tileY, hours)` → aceleración de simulación (dev)
  - `getPlotStatus(plot)` → FarmPlotData → FarmPlotStatus completo
  - `subscribe(cb)` → suscripción reactiva + dispara `phaser-farm-plots-changed`
  - `getAllPlots()`, `getPlotAt(x,y)`, `hasPlotAt(x,y)`

## Flujo de Datos
```
ConstructionPanel (clic "Colocar Parcela")
  → CustomEvent "phaser-start-placement" {buildingId: "b_cropplot"}
  → FarmPlacementSystem.startPlacement()
  → [ghost preview isométrico en Phaser]
  → [clic izquierdo] → farmPlotManager.placePlot(x,y)
  → farmPlotManager.subscribe() notifica → FarmPlacementSystem.refreshAllPlots()
  → [clic en parcela en Phaser] → CustomEvent "phaser-crop-plot-selected" {FarmPlotStatus}
  → useAppController → setSelectedFarmPlot → CropPlantingModal
  → useCropPlantingModal → handlePlant/handleHarvest → farmPlotManager
```

## Integración con Phaser (FarmPlacementSystem)
- Escucha `phaser-start-placement`, `phaser-cancel-placement`, `phaser-plant-crop`, `phaser-harvest-crop`
- `FarmPlacementSystem.update()`: actualiza visuales de cultivos en cada tick del juego
- `FarmPlacementSystem.refreshAllPlots()`: re-dibuja todas las parcelas tras cambios
- Los sprites de cultivo se cargan en `Preloader` como texturas con key `crop_${cropId}` (6 frames)
