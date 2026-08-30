# ui/inventory / Context — UI de Inventario del Jugador

## Propósito
UI lateral derecha del **inventario del jugador** (`I` / botón Inventario). Misma caja `285px fixed right 0 top32 bottom 0 #151515 borderLeft 4a90e2` que `NpcPanel`, con equipo, filtro y grid almacén. Modularizado en 3 subcomponentes + hook.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `PlayerInventoryPanel.tsx:15` | 87 | **Contenedor.** `function PlayerInventoryPanel({onClose})` usa `hooks/inventory/usePlayerInventory(onClose)` → `items, filteredItems, filter, selectFilter, isDropdownOpen, toggleDropdown, availableSlotsCount, lockedSlotsCount, maxSlotsCount`. Render `fixed right0 top32 bottom0 285px #151515 z100 shadow -4px` header `🎒 Inventario + ✕`, `<EquippedSlotsGrid />`, `<InventoryCategoryFilter />`, `<InventorySlotsGrid />`, footer `Filtra por tipo • I o ESC cerrar`. Apertura vía `phaser-action-inventory` (MainScene `I`/Navbar), al montar `setInventoryOpen(true)` bloquea input, al desmontar `false`. |
| `components/EquippedSlotsGrid.tsx:15` | 44 | Grid 10 slots `Arma1/Arma2/Escudo/Casco/Pecho/Botas/Collar/Anillo/Consumible/Mochila` `repeat(10,1fr)` box `32px` border `#333`. |
| `components/InventoryCategoryFilter.tsx:1` | 102 | Filtro dropdown `<button>` abre panel `maxHeight140` (5 visibles + scroll) `Todos + 10 categorías` (`ALL_ITEM_CATEGORIES` de `items/Item`). Cierra `select` o click fuera `data-inventory-filter`. Estado `isDropdownOpen/filter`. |
| `components/InventorySlotsGrid.tsx:1` | 178 | Grid almacén `repeat(10,1fr)` **20 disponibles** (2 filas×10 `filtered`) + **30 bloqueados** (3 filas×10 `🔒 requiere mochila`). Total 50 máx (`availableSlots=20 locked=30 max=50`). Items `CATEGORY_ICON + nombre recortado x{cantidad}` `isStackable` badge `MAX_STACK 10`, `overflowY auto`, `onResetFilter`. |

## Hook
- `hooks/inventory/usePlayerInventory:79` → `items` (createMockPlayerInventory 10-14), `filtered = filter==="Todos"?items:items.filter(categoria===filter)`, `selectFilter`, `toggleDropdown`, `available/locked/maxSlotsCount`, listeners ESC/I `onClose`, `setInventoryOpen` block, click fuera filtro.

## Dependencias
- `items/Item` (`ALL_ITEM_CATEGORIES, CATEGORY_ICON, createMockPlayerInventory, ItemCategory, PlayerInventoryItem, MAX_STACK 10`), `ui/input/KeyBindings` (`setInventoryOpen`)

## Para Repomix
Reusar `ITEM_POOLS` de `items/Item`. No duplicar `Inventory` (NPC) — este componente es inventario **jugador** mock. Al implementar mochila real: desbloquear 30 slots según `PlayerInventory.maxSlots` progresión.
