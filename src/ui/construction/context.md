# ui/construction / Context — UI de Construcción (Reservado)

## Propósito
Directorio **reservado vacío** para la **UI de construcción** (ghost preview, menú de edificios, costos). `ui/menus/Navbar` ya tiene botón "Construcción" que dispara `phaser-action-construction` sin handler — esta UI lo consumirá.

## Estado Actual
> **Vacío.** No hay componentes. `buildings/*` también en stub.

## Rol Previsto
- `ConstructionMenu.tsx` — grid de `BuildingType` con iconos + costos `Economy.canAfford` + `onSelect(type)`.
- `GhostPreview.tsx` — sprite fantasma que sigue cursor, verde/rojo según `Construction.canPlace`, confirma con click.
- `BuildingInfoPanel.tsx` — al seleccionar edificio construido, muestra `progress`, `workersAssigned`, `Production` recetas.

## Dependencias Previstas
- `buildings/Building`, `buildings/Construction`, `settlement/Economy`, `ui/input/KeyBindings`, `Phaser.Scene` (para ghost sprite)

## Para Repomix
Implementar cuando `buildings/Building.ts` exista. Montar `ConstructionMenu` desde `app/App` (estado `showConstruction`) similar a `TutorialPanel`.
