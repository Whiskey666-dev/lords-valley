# src/hooks/buildings/context.md — Hook de Edificios

> Lógica para el panel de gestión de edificios existentes.

## `useBuildings.ts`
- Estado: `filterCategory`, `filterStatus`, `search`, `selectedBuilding`, `activeManageTab`
- `buildings`: desde `buildingsData.ts`, solo los con estado `"existing"`
- `selectedBuilding`: edificio seleccionado para ver detalle/gestionar
- `activeManageTab`: pestaña activa (gestión | administración)

## `buildingsData.ts`
**Archivo de datos de 56 edificios** organizados en 7 categorías:
| Categoría | Ejemplos |
|---|---|
| `vivienda` | Cabaña, Casa de Madera, Residencia |
| `producción` | Taller del Herrero, Alfarería, Aserradero |
| `defensa` | Empalizada, Torre Vigía, Muralla |
| `almacenamiento` | Almacén, Silo, Bodega |
| `cultura` | Taberna, Biblioteca, Plaza Mayor |
| `agricultura` | Parcela de Cultivo, Granero, Invernadero |
| `especial` | Centro de Comercio, Academia, Castillo |

Cada edificio (`BuildingItem`):
```typescript
interface BuildingItem {
  id: string
  name: string
  icon: string
  description: string
  category: string
  tier: number           // 1, 2, 3
  status: "available" | "locked" | "existing"
  unlockCost: { recurso: string; cantidad: number }[]
  workers: number        // puestos de trabajo
  inventory?: { slots: number; tipo: string }
  // UI
  chapter?: number       // capítulo requerido para desbloquear
}
```

## Relación con ConstructionPanel
- `ConstructionPanel` / `useConstruction` usa los MISMOS datos de `buildingsData.ts`
- La diferencia: `BuildingsPanel` gestiona edificios YA construidos; `ConstructionPanel` construye nuevos
- No duplicar datos — ambos importan desde `hooks/buildings/buildingsData.ts`
