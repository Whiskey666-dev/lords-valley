# src/ui/farming/context.md — UI de Agricultura

> Componentes React para la interacción del jugador con las parcelas de cultivo.

## Archivos

### `CropPlantingModal.tsx` — Modal de Siembra y Cosecha
**Toda la lógica está en** `hooks/farming/useCropPlantingModal`. Este componente es puramente presentacional.

**Estado manejado por `useCropPlantingModal`**:
- `currentPlot: FarmPlotStatus|null` — parcela activa sincronizada con `farmPlotManager`
- `selectedCategory: string` — filtro de categoría (`"all"` | `"cereal"` | `"vegetal"` | `"fruta"` | `"industrial"` | `"especial"`)
- `search: string` — filtro de texto sobre nombre, categoría y descripción
- `harvestNotice: string|null` — notificación temporal de cosecha exitosa (3 segundos)
- `filteredCrops: CropDefinition[]` — 29 cultivos filtrados por categoría + búsqueda (memoizado)

**Dos modos visuales**:
1. **Sin cultivo** (`!crop || !growth`): Catálogo completo con filtros de categoría, búsqueda y grid de cards con botón "Sembrar"
2. **Con cultivo activo**: Monitor de estado con barra de progreso (24h), 5 etapas visuales con sprites reales, botón de cosecha (pulsante dorado), panel de simulación de tiempo (dev)

**Componente `CropSpriteFrame`**: renderiza un frame específico (1-4) del spritesheet 384×64 px usando `background-position` con `image-rendering: pixelated`

**Apertura**: `useAppController` recibe `phaser-crop-plot-selected` → `setSelectedFarmPlot(FarmPlotStatus)` → renderiza `<CropPlantingModal />`

**Cierre**: clic en overlay, botón ✕, tecla Escape, o `handleRemovePlot()` (desmantelar)

## Flujo de Interacción
```
[Jugador clic en parcela Phaser]
  → FarmPlacementSystem dispatch "phaser-crop-plot-selected"
  → useAppController setSelectedFarmPlot
  → CropPlantingModal visible
  → useCropPlantingModal (temporizador 1s actualiza growth)
  → [Sembrar] → handlePlant → farmPlotManager.plantCrop
  → [Cosechar] → handleHarvest → farmPlotManager.harvestCrop → harvestNotice
  → [Cerrar] → onClose → setSelectedFarmPlot(null)
```
