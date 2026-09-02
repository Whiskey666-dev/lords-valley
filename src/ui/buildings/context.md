# src/ui/buildings/context.md — Panel de Edificios

> Panel de gestión y administración de edificios existentes en el asentamiento.

## `BuildingsPanel.tsx`
- Hook: `useBuildings` (`hooks/buildings/useBuildings`)
- Modal `1060×670px` con lista izquierda `310px` + panel derecho de detalle
- 40+ edificios filtrados por categoría y estado
- **Dos modos de detalle**:
  - **Gestión**: bodega (inventario), recetas de producción activas
  - **Administración**: puestos de trabajo con jerarquía y roles asignados

## Diferencia con `ConstructionPanel`
| | `BuildingsPanel` | `ConstructionPanel` |
|---|---|---|
| Propósito | Gestionar edificios **ya construidos** | **Construir** nuevos edificios |
| Edificios mostrados | Solo `status = "existing"` | Todos (filtrable por estado) |
| Acción principal | Ver bodega / asignar trabajadores | Construir / iniciar colocación |
| Apertura | Navbar (icono 🏠) | Navbar (icono 🔨) |
