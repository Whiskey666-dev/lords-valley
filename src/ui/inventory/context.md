# ui/inventory / Context — UI de Inventario del Jugador

## Propósito
UI lateral derecha del **inventario del jugador** (`I` / botón Inventario). Misma caja `285px fixed right 0 top32 bottom 0 #151515 borderLeft 4a90e2` que `NpcPanel`, con equipo, filtro y grid almacén. Modularizado en 3 subcomponentes + hook.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `PlayerInventoryPanel.tsx:15` | 87 | **Contenedor.** `function PlayerInventoryPanel({onClose})` usa `hooks/inventory/usePlayerInventory(onClose)` → `items, filteredItems, filter, selectFilter, isDropdownOpen, toggleDropdown, availableSlotsCount, lockedSlotsCount, maxSlotsCount, loading, error, refresh`. Estado del servidor (`GET /player/me/inventory`, JWT) con banner de carga y error con Reintentar. Render `fixed right0 top32 bottom0 285px #151515 z100 shadow -4px` header `🎒 Inventario + ✕`, `<EquippedSlotsGrid />`, `<InventoryCategoryFilter />`, `<InventorySlotsGrid />`, footer `Filtra por tipo • I o ESC cerrar`. Apertura vía `phaser-action-inventory` (MainScene `I`/Navbar), al montar `setInventoryOpen(true)` bloquea input, al desmontar `false`. |
| `components/EquippedSlotsGrid.tsx:15` | 44 | Grid 10 slots `Arma1/Arma2/Escudo/Casco/Pecho/Botas/Collar/Anillo/Consumible/Mochila` `repeat(10,1fr)` box `32px` border `#333`. |
| `components/InventoryCategoryFilter.tsx:1` | 102 | Filtro dropdown `<button>` abre panel `maxHeight140` (5 visibles + scroll) `Todos + 10 categorías` (`ALL_ITEM_CATEGORIES` de `items/Item`). Cierra `select` o click fuera `data-inventory-filter`. Estado `isDropdownOpen/filter`. |
| `components/InventorySlotsGrid.tsx:1` | 178 | Grid almacén `repeat(10,1fr)` **20 disponibles** (2 filas×10 `filtered`) + **30 bloqueados** (3 filas×10 `🔒 requiere mochila`). Total 50 máx (`availableSlots=20 locked=30 max=50`). Items `CATEGORY_ICON + nombre recortado + badge x{cantidad}` (stacks del servidor), click abre menú Usar/Info/Eliminar (mutaciones vía API), `overflowY auto`, `onResetFilter`. |

## Hook
- `hooks/inventory/usePlayerInventory:79` → `items` (store persistente `playerInventoryStore`, empieza vacío; solo `addItem` añade), `filtered = filter==="Todos"?items:items.filter(categoria===filter)`, `selectFilter`, `toggleDropdown`, `available/locked/maxSlotsCount`, listeners ESC/I `onClose`, `setInventoryOpen` block, click fuera filtro. Acciones por item en `hooks/inventory/itemActions` (Usar/Eliminar) + menú contextual en `InventorySlotsGrid` (Usar/Info/Eliminar).

## Dependencias
- `items/Item` (`ALL_ITEM_CATEGORIES`, `ItemCategory`, `PlayerInventoryItem`), `ui/input/KeyBindings` (`setInventoryOpen`), `hooks/inventory/playerInventoryStore` (caché del servidor + `Usar/Eliminar` vía API)

## Para Repomix
Click en un slot abre el menú contextual (Usar/Info/Eliminar) con mutaciones validadas en el servidor. Al implementar mochila real: desbloquear 30 slots según progresión.
