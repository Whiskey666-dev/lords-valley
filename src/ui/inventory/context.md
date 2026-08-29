# ui/inventory / Context — UI de Inventario del Jugador

## Propósito
Contiene la **UI del inventario del jugador**, que se abre con la tecla de inventario (`I`) y muestra los espacios de almacenamiento en cuadrícula, el equipo y un filtro desplegable por tipo de item.

## Archivo
- `PlayerInventoryPanel.tsx:32` — `function PlayerInventoryPanel({onClose})`.

## Lógica — `PlayerInventoryPanel.tsx`
- **Apertura** vía evento `phaser-action-inventory` (disparado por `MainScene.update` al pulsar `I`/botón Inventario). Al montar llama `setInventoryOpen(true)` para bloquear input de juego, y `setInventoryOpen(false)` al desmontar.
- **Tamaño** fijo `right:0 top:32 bottom:0 width:285` idéntico a `NpcPanel`, borde `#4a90e2`.
- **Equipado** (parte superior): 10 cuadros `Arma 1/Arma 2/Escudo/Casco/Pecho/Botas/Collar/Anillo/Consumible/Mochila` en `grid 10×1`.
- **Filtro desplegable**: `<button>` que abre panel hacia abajo con `maxHeight:140` (5 opciones visibles + scroll vertical) de `Todos + 10 categorías` (`ALL_ITEM_CATEGORIES`). Cierra al seleccionar o click fuera (`data-inventory-filter`).
- **Grid de almacenamiento**: `gridTemplateColumns repeat(10,1fr)` con **20 disponibles** (2 filas ×10, mapeadas con `filtered`) + **30 bloqueados opacos** (3 filas ×10, `🔒` "requiere mochila"). = 50 máx.
- Items con `CATEGORY_ICON`, nombre recortado, `x{cantidad}`; scroll vertical `overflowY:auto`.

## Dependencias
- `items/Item` (`ALL_ITEM_CATEGORIES`, `createMockPlayerInventory`, `ItemCategory`, `PlayerInventoryItem`), `ui/input/KeyBindings` (`setInventoryOpen`).

## Para Repomix
Reusar `CATEGORY_ICON`/`ITEM_POOLS` de `items/Item`. No duplicar lógica de `Inventory` — el componente solo renderiza y despacha. Al implementar mochila real: desbloquear los 30 slots bloqueados según progresión.