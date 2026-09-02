# src/ui/construction/context.md — Taller de Construcción

> Panel de construcción de edificios con sistema de mejoras por capítulos de misión y modo de colocación isométrica con ghost preview.

## Archivos

### `ConstructionPanel.tsx` — Panel de Construcción
- Hook: `useConstruction` (`hooks/construction/useConstruction`)
- **56 edificios** organizados en 7 categorías (de `hooks/buildings/buildingsData.ts`)
- **Sistema de mejoras**: cada edificio tiene mejoras por capítulo de misión (supervivencia → asentamiento → señorío → ducado → conquista → imperio)
- Filtros: por categoría (select), por estado (construido/bloqueado), búsqueda de texto
- Expand/collapse por edificio para mostrar mejoras disponibles
- Botón especial para `b_cropplot` → dispara `phaser-start-placement` y cierra el panel

**Flujo de colocación de parcela**:
```
[Clic "🌱 Colocar Parcela con Mouse"]
  → useConstruction.handleStartPlacement("b_cropplot")
  → dispatch "phaser-start-placement" {buildingId: "b_cropplot"}
  → onClose() → cierra ConstructionPanel
  → FarmPlacementSystem.startPlacement() → modo ghost activo
  → [Clic en tile válido] → farmPlotManager.placePlot()
```

## Hook `useConstruction` (`hooks/construction/useConstruction.ts`)
- Estado: `filterCategory`, `filterStatus`, `search`, `expandedId`, `buildings`
- `handleStartPlacement(id)`: dispara evento Phaser + cierra panel
- `handleConstruct(id)`: para edificios normales, actualiza estado a `existing`
- `getUpgradesForBuilding(b)`: genera mejoras basadas en tier del edificio y capítulos requeridos
- `ALL_CATEGORIES`: lista ordenada de categorías de edificios
- `stats`: total/existing/locked calculados desde `buildings`

## Mejoras por Tier y Capítulo
| Tier del Edificio | Mejoras Generadas | Capítulos Requeridos |
|---|---|---|
| T1 | 3 mejoras | asentamiento → señorío → imperio |
| T2 | 3 mejoras | ducado → conquista → imperio |
| T3 | 2 mejoras | conquista → imperio |

## Relación con Otros Módulos
- **`buildingsData.ts`**: datos de 56 edificios con `icon`, `name`, `description`, `category`, `tier`, `unlockCost`, `inventory`, `workers`
- **`missionsData.ts`**: `MISSION_CATEGORIES` para colores y etiquetas de capítulos
- **`FarmPlacementSystem.ts`**: receptor del evento de colocación
