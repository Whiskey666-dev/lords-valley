# src/hooks/construction/context.md — Hook de Construcción

> Lógica para el panel de construcción de edificios.

## `useConstruction.ts`

### Estado
```typescript
filterCategory: string         // "all" | "vivienda" | "producción" | ...
filterStatus: string           // "all" | "available" | "existing" | "locked"
search: string                 // filtro de texto por nombre/descripción
expandedId: string | null      // edificio con mejoras expandidas
buildings: BuildingItem[]      // 56 edificios con estado local
```

### Datos Derivados
- `ALL_CATEGORIES`: lista de categorías únicas ordenadas desde `buildingsData`
- `filteredBuildings`: memoizado, aplica filtros de categoría + estado + texto
- `stats`: `{ total, existing, locked }` calculados desde `buildings`

### Handlers
- `handleStartPlacement(id)`: dispatch `phaser-start-placement {buildingId: id}` → `onClose()`
- `handleConstruct(id)`: actualiza estado del edificio a `"existing"` localmente
- `toggleExpanded(id)`: expand/collapse mejoras de un edificio
- `getUpgradesForBuilding(b)`: genera 2-3 mejoras según el `tier` del edificio y los capítulos de misión

### Integración
- Datos base: `hooks/buildings/buildingsData.ts` → `BUILDINGS_DATA[]`
- Parcelas: botón especial para `b_cropplot` → no construye, lanza modo de colocación de Phaser
- Mejoras: referencia `hooks/missions/missionsData.ts` → `MISSION_CATEGORIES` para etiquetas de capítulo

### Sistema de Mejoras por Tier
| Tier | Mejoras | Capítulos |
|---|---|---|
| T1 | 3 | Asentamiento → Señorío → Imperio |
| T2 | 3 | Ducado → Conquista → Imperio |
| T3 | 2 | Conquista → Imperio |
