# ui/construction / Context — UI de Construcción (Reservado vacío)

## Propósito
UI de **construcción** — ghost preview, menú edificios, costos. `ui/menus/Navbar` botón **Construcción** verde `#2e7d32` dispara `phaser-action-construction` sin handler real — esta UI lo consumirá. `ui/buildings/BuildingsPanel` (modal 1060×670) ya cubre gestión de edificios existentes/bloqueados pero no ghost placement.

## Estado Real
> **Vacío — solo `context.md`.** Glob `src/ui/construction/*` únicamente este archivo. `buildings/*` 3 archivos 0 bytes, real en `hooks/buildings/buildingsData`.

## Rol Previsto
| Archivo | Rol Previsto |
|---|---|
| `ConstructionMenu.tsx` | Grid `BuildingType` con iconos + costos `Economy.canAfford` + `onSelect(type)` → ghost. |
| `GhostPreview.tsx` | Sprite fantasma sigue cursor, verde/rojo `Construction.canPlace`, confirma click → `Building.create(blueprint)` + `Jobs.create`. |
| `BuildingInfoPanel.tsx` | Al seleccionar edificio construido, muestra `progress, workersAssigned, Production` recetas. |

## Dependencias Previstas
- `buildings/Building`, `buildings/Construction`, `settlement/Economy`, `ui/input/KeyBindings`, `Phaser.Scene` (ghost sprite)

## Para Repomix
Implementar cuando `buildings/Building.ts` exista. Montar `ConstructionMenu` desde `app/App` `showConstruction` similar a `showBuildings` + `TutorialPanel`. Reusar `hooks/buildings/buildingsData:CATEGORY_INFO` y `BuildingData` como modelo. No duplicar `BuildingsPanel` lista — ese es gestión; este es colocación.
