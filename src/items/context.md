# items / Context — Inventario, Equipamiento y Objetos

## Propósito
Gestiona **posesiones de cada humano** y el catálogo de objetos del mundo. Actualmente implementa inventario y equipamiento procedural con strings; los tipos base `Item`/`Resources`/`Weapons`/`Food` están en stub para evolucionar a objetos tipados.

## Archivos
| Archivo | Estado | Rol |
|---|---|---|
| `Inventory.ts:17` | Implementado | `class Inventory` con `capacidad=20`, generación procedural. |
| `Equipment.ts:17` | Implementado | `class Equipment` con slots y generación procedural. |
| `Item.ts` | Stub vacío | Base `Item { id, nombre, peso, stackable, categoria }` previsto. |
| `Resources.ts` | Stub vacío | Registro recursos (madera, piedra, hierro) previsto. |
| `Weapons.ts` | Stub vacío | Armas tipadas `Weapon { damage, range, durability }` (hoy strings en Equipment). |
| `Food.ts` | Stub vacío | Comida consumible `Food { nutrition, decay, hambreRestore }` previsto. |

## Lógica Implementada — `Inventory.ts:17`
```ts
interface InventoryItem { id:string; nombre:string; cantidad:number; categoria:'recurso'|'comida'|'herramienta'|'arma' }
class Inventory {
  items: InventoryItem[]; capacidad=20
  constructor() // 2..5 items random
    pools: RECURSOS 5 ["Madera","Piedra","Hierro","Cuero","Tela"]
           COMIDAS 5 ["Pan","Carne Seca","Manzana","Queso","Pescado"]
           HERRAMIENTAS 4 ["Hacha","Pico","Martillo","Cuchillo"]
    dedup merge cantidad 1..8
  getResumen(): string[] // ["Madera x3", ...] para NpcPanel
}
```

## Lógica Implementada — `Equipment.ts:17`
```ts
interface EquipmentSlot { arma?:string; armadura?:string; herramienta?:string; accesorio?:string }
class Equipment {
  slots: EquipmentSlot
  pools: ARMAS 5 ["Espada Corta","Daga","Arco","Lanza","Maza"]
         ARMADURAS 4 ["Túnica","Cuero","Cota de Malla","Placas"]
         HERRAMIENTAS 4 [...]
  constructor() // 0.7 chance arma, 0.6 armadura, 0.8 herramienta
  getResumen(): string[] // ["Arma: Daga", ...] o ["Sin equipamiento"]
}
```
- Ambos usan strings hoy, no instancias `Item`. Suficiente para UI pero no para `combat/Damage` o `buildings/Production` que necesitarán stats numéricos.

## Lógica Prevista (stubs)
- `Item.ts` → clase base con `id, nombre, weight, stackable, maxStack, icon`
- `Resources.ts` → `enum ResourceType { madera, piedra, hierro }` + `Resource extends Item`
- `Weapons.ts` → `class Weapon extends Item { damage, range, speed, durability }` usado por `combat/Weapons.ts` + `combat/Damage.ts`
- `Food.ts` → `class Food extends Item { hungerRestore, thirstRestore, spoilage }` consumido por `characters/Needs`

## Dependencias
- **Consumido por:** `characters/Survivor.ts:42-43` (`inventory: Inventory`, `equipment: Equipment`), `ui/character/NpcPanel.tsx:108-163` (tabs inventario/equipamiento)
- **Futuro consumidores:** `buildings/Production` (input/output), `settlement/Economy` (stockpiles), `combat/Damage` (weapon stats), `world/Events` (loot)
- **No depende de:** otros módulos (puro data)

## Flujo
```
new Survivor() -> new Inventory() + new Equipment() // random
  -> NpcPanel tab "Inventario" (VISIBLE_LIMIT 4, +N ocultos) / "Equipamiento"
Futuro: Inventory.add/remove -> Economy.canAfford -> Construction.consume
        Food.consume -> Needs.hambre -= restore
        Weapon.equip -> CombatSystem damage calc
```

## Para Repomix
Para tipar el sistema: 1) implementar `Item.ts` base 2) migrar `InventoryItem` de `{nombre,cantidad}` a `Item` instancias 3) tipar `Equipment.slots` de `string` a `Weapon|Armor`. Mantener `getResumen()` para compat UI. `capacidad=20` es límite blando (no enforceado en `add` aún).
