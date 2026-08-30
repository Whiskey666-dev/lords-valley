# items / Context — Inventario, Equipamiento y Objetos

## Propósito
Posesiones de cada humano y catálogo de objetos del mundo. **Implementado** para NPCs (Inventory/Equipment procedural strings) y jugador (`Item.ts` 10 categorías stackables + mock). Stubs para recursos/armas/comida tipadas.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `Inventory.ts:17` | 39 | `class Inventory {items:InventoryItem[], capacidad 20}` `InventoryItem {id,nombre,cantidad,categoria:'recurso'|'comida'|'herramienta'|'arma'}`. `constructor` 2-5 items random `RECURSOS 5 / COMIDAS 5 / HERRAMIENTAS 4` dedup `cantidad 1..8`, `getResumen():string[]` `"Madera x3"` para `NpcPanel`. |
| `Equipment.ts:17` | 37 | `class Equipment {arma,armadura,herramienta:string|null, slots?}` `ARMAS 5 / ARMADURAS 4 / HERRAMIENTAS 4`, `constructor` 0.7/0.6/0.8 chance, `getResumen():string[]` `"Arma: Daga"` o `"Sin equipamiento"`. |
| `Item.ts:1` | 123 | **Implementado.** `ItemCategory 10` `Armas, Equipo, Consumibles Magicos, Consumibles Comunes, Comida y Bebida, Recurso Refinado, Recursos en Bruto, Utiles, Crias, Documentos` (`ALL_ITEM_CATEGORIES`), `PlayerInventoryItem {id,nombre,categoria,cantidad,maxStack,stackable,peso?,descripcion?,icono?}`, `MAX_STACK 10`, `STACKABLE_CATEGORIES 6` (Consumibles×2, Comida y Bebida, Recurso×2, Documentos), `isStackable/maxStackFor`, `ITEM_POOLS:Record<Category,string[]>` 4-7 nombres por cat, `createMockPlayerInventory():PlayerInventoryItem[]` 0-2 por cat random + while `<10` items (mock 10-14, stackables 1..10 cantidad, no-stack 1). |
| `Resources.ts` | 0 | STUB vacío — `enum ResourceType {madera,piedra,hierro}` previsto |
| `Weapons.ts` | 0 | STUB vacío — `Weapon {damage,range,durability}` previsto (hoy strings en Equipment) |
| `Food.ts` | 0 | STUB vacío — `Food {nutrition,decay,hambreRestore}` previsto |

## Lógica — Stackable
`STACKABLE_CATEGORIES` incluye Consumibles Magicos/Comunes, Comida y Bebida, Recursos Refinado/Bruto, Documentos → `maxStack 10`; resto (Armas, Equipo, Utiles, Crias) → `maxStack 1`, `cantidad 1`.

## Consumido por
- `characters/Survivor` (`inventory, equipment` random en constructor)
- `ui/character/NpcPanel` (`getResumen()` + `useNpcPanel` inventory core `type/quantity string BigInt`)
- `ui/inventory/*` (`createMockPlayerInventory`, `ALL_ITEM_CATEGORIES`, `isStackable`, `MAX_STACK`) — jugador mock
- `ui/settlement/InventoryPanel` (`useGameStore inventory` string BigInt `formatLvy`)
- Futuro `buildings/Production`, `settlement/Economy`, `combat/Damage`

## Flujo
```
new Survivor() → new Inventory()+new Equipment() random (NPC 2-5 items)
PlayerInventoryPanel → createMockPlayerInventory() 10-14 → grid 20+30 locked + filtro
useGameStore.inventory (core API) → InventoryPanel BigInt display
Futuro: Inventory.add/remove, Food.consume→Needs, Weapon.equip→combat/Damage
```

## Para Repomix
Tipar sistema: 1) migrar `InventoryItem {nombre,cantidad}` → `PlayerInventoryItem` instancias 2) tipar `Equipment.slots` → `Weapon|Armor` objetos 3) implementar `Resources/Weapons/Food` extendiendo `PlayerInventoryItem`. Mantener `getResumen()` compatibilidad UI. `MAX_STACK 10` techo stackables.
