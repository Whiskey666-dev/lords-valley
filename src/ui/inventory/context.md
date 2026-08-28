# ui/inventory / Context — UI de Inventario (Reservado)

## Propósito
Directorio **reservado vacío** para **UI avanzada de inventario** (grid, drag&drop, equipar). Hoy `ui/character/NpcPanel` ya muestra inventario/equipamiento en tabs, pero no permite interacción.

## Estado Actual
> **Vacío.** `ui/character/NpcPanel.tsx:107` tab Inventario solo lista `Inventory.getResumen()` con `VISIBLE_LIMIT=4` + botón placeholder `Gestionar Inventario` dispatch.

## Rol Previsto
- `InventoryGrid.tsx` — grid `capacidad=20` con slots, drag&drop, tooltip `Item` peso/cantidad, `onDrop` -> `Inventory.add/remove`.
- `EquipmentSlots.tsx` — 4 slots visuales `arma/armadura/herramienta/accesorio` con equip/unequip -> `Equipment` + `combat/Damage`.
- `InventoryPanel.tsx` — panel full (similar a `NpcPanel` pero para `Player` global + `Settlement` stockpile).

## Dependencias Previstas
- `items/Inventory`, `items/Equipment`, `items/Item`, `characters/Survivor`, `settlement/Economy`

## Para Repomix
Reusar `NpcPanel` tabs como base. No duplicar lógica de `Inventory` — el componente solo renderiza y despacha `onMoveItem`. Considerar `phaser-action-inventory` ya emitido en `MainScene.update` como trigger para abrir este panel.
