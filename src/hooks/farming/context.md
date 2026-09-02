# src/hooks/farming/context.md — Hook de Agricultura

> Lógica para el modal de siembra y cosecha de cultivos.

## `useCropPlantingModal.ts`

### Estado
```typescript
currentPlot: FarmPlotStatus | null  // parcela activa (sincronizada con farmPlotManager cada 1s)
selectedCategory: string            // "all" | "cereal" | "vegetal" | "fruta" | "industrial" | "especial"
search: string                      // búsqueda por nombre, categoría y descripción del cultivo
harvestNotice: string | null        // mensaje temporal tras cosechar ("¡Cosechaste X!"), 3s TTL
```

### Datos Derivados
- `filteredCrops`: 29 cultivos de `CROPS_CATALOG` filtrados por `selectedCategory` + `search` (memoizado)

### Efectos
1. **Sync de parcela**: escucha `phaser-farm-plots-changed` → actualiza `currentPlot` desde `farmPlotManager.getPlotStatus()`
2. **Temporizador de crecimiento**: `setInterval(1000)` si hay cultivo activo → actualiza `growth` del plot
3. **Escape**: cierra el modal

### Handlers
```typescript
handlePlant(cropId: string)     // farmPlotManager.plantCrop(tileX, tileY, cropId)
handleHarvest()                 // farmPlotManager.harvestCrop → setHarvestNotice
handleAdvanceTime(hours)        // farmPlotManager.advancePlotTime (dev tool)
handleClearCrop()               // farmPlotManager.plantCrop con cropId vacío (limpia sin cosechar)
handleRemovePlot()              // farmPlotManager.removePlot → onClose()
```

### Dependencias
- `game/farming/FarmPlotManager` → `farmPlotManager` (singleton)
- `game/farming/farmData` → `CROPS_CATALOG` (29 cultivos)
