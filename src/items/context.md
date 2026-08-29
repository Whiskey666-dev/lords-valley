# items / Context — Inventario, Equipamiento y Objetos

## Propósito
Gestiona **posesiones de cada humano** y el catálogo de objetos del mundo. Inventario y equipamiento procedural con strings; `Item.ts` define las categorías y el modelo tipado del inventario del jugador.

## Archivos
| Archivo | Estado | Rol |
|---|---|---|
| `Inventory.ts:17` | Implementado | `class Inventory` con `capacidad=20`, generación procedural (NPCs). |
| `Equipment.ts:17` | Implementado | `class Equipment` con slots y generación procedural (NPCs). |
| `Item.ts:1` | **Implementado** | Categorías `ItemCategory` (10), `PlayerInventoryItem`, `MAX_STACK`, `STACKABLE_CATEGORIES`, `ITEM_POOLS`, `createMockPlayerInventory()`. |
| `Resources.ts` | Stub vacío | Registro recursos (madera, piedra, hierro) previsto. |
| `Weapons.ts` | Stub vacío | Armas tipadas `Weapon { damage, range, durability }` (hoy strings en Equipment). |
| `Food.ts` | Stub vacío | Comida consumible `Food { nutrition, decay, hambreRestore }` previsto. |

## Lógica Implementada — `Inventory.ts:17`
```ts
interface InventoryItem { id:string; nombre:string; cantidad:number; categoria:'recurso'|'comida'|'herramienta'|'arma' }
class Inventory {
  items: InventoryItem[]; capacidad=20
  constructor() // 2..5 items random
    pools: RECURSOS 5 / COMIDAS 5 / HERRAMIENTAS 4
    dedup merge cantidad 1..8
  getResumen(): string[] // ["Madera x3", ...] para NpcPanel
}
```

## Lógica Implementada — `Equipment.ts:17`
```ts
interface EquipmentSlot { arma?:string; armadura?:string; herramienta?:string; accesorio?:string }
class Equipment { slots: EquipmentSlot; constructor() // 0.7/0.6/0.8 chance arma/armadura/herramienta; getResumen(): string[] }
```

## Lógica Implementada — `Item.ts:1` (inventario del jugador)
- **`ItemCategory`** (10): `Armas, Equipo, Consumibles Magicos, Consumibles Comunes, Comida y Bebida, Recurso Refinado, Recursos en Bruto, Utiles, Crias, Documentos` en `ALL_ITEM_CATEGORIES`.
- **`PlayerInventoryItem`**: `{ id, nombre, categoria, cantidad, maxStack, stackable, peso?, descripcion?, icono? }`.
- **Stacking**: `MAX_STACK = 10`; `STACKABLE_CATEGORIES` = Consumibles (Magicos/Comunes), Comida y Bebida, Recursos (Refinado/Bruto), Documentos. `isStackable()` / `maxStackFor()` devuelven `10` para stackeables y `1` para el resto (Armas, Equipo, Utiles, Crias).
- **`ITEM_POOLS`**: nombres de items por categoría para mock.
- **`createMockPlayerInventory()`**: genera 10-14 items; `cantidad` 1..10 en stackeables, 1 en no stackeables.

## Lógica Prevista (stubs)
- `Resources.ts` → `enum ResourceType { madera, piedra, hierro }` + `Resource extends Item`
- `Weapons.ts` → `class Weapon extends Item { damage, range, speed, durability }` usado por `combat/Weapons.ts` + `combat/Damage.ts`
- `Food.ts` → `class Food extends Item { hungerRestore, thirstRestore, spoilage }` consumido por `characters/Needs`

## Dependencias
- **Consumido por:** `characters/Survivor.ts` (`inventory`, `equipment`), `ui/character/NpcPanel.tsx`, `ui/inventory/PlayerInventoryPanel.tsx` (`createMockPlayerInventory`, `ALL_ITEM_CATEGORIES`, `CATEGORY_ICON`...)
- **Futuro consumidores:** `buildings/Production`, `settlement/Economy`, `combat/Damage`, `world/Events`
- **No depende de:** otros módulos (puro data)

## Flujo
```
new Survivor() -> new Inventory() + new Equipment() // random (NPCs)
PlayerInventoryPanel -> createMockPlayerInventory() -> grid 20 disponibles + 30 bloqueados
Futuro: Inventory.add/remove, Food.consume, Weapon.equip -> combat/Damage
```

## Para Repomix
Para tipar el sistema: 1) migrar `InventoryItem` de `{nombre,cantidad}` a `Item` instancias 2) tipar `Equipment.slots` a `Weapon|Armor`. Mantener `getResumen()` para compat UI. `MAX_STACK=10` como techo de stackeables.