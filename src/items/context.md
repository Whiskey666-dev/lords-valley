# items / Context — Inventario, Equipamiento y Objetos

## Propósito
Posesiones de cada humano y tipos del inventario del jugador. NPCs usan `Inventory`/`Equipment` locale aleatorios. El inventario del **jugador** y sus **habilidades** viven en el backend (módulo `player`, JWT): el frontend solo muestra estado del servidor.

## Archivos Reales
| Archivo | Rol |
|---|---|
| `Inventory.ts` | `class Inventory {items:InventoryItem[], capacidad 20}` para NPCs. `getResumen():string[]` para `NpcPanel`. |
| `Equipment.ts` | `class Equipment {arma,armadura,herramienta}` para NPCs. `getResumen()` para `NpcPanel`. |
| `Item.ts` | Tipos jugador: `ItemCategory` (10), `ALL_ITEM_CATEGORIES`, `PlayerInventoryItem`. Sin catálogo (el servidor valida). |
| `TrainingScrolls.ts` | Display: `TRAINING_SCROLL_NAMES` por escuela, `TRAINING_XP = 10`, `getTrainingScrollName`. Sin lógica (el servidor valida escuela, consumo y XP). |

## Consumido por
- `characters/Survivor` (`inventory, equipment` en constructor)
- `ui/character/NpcPanel` (`getResumen()`)
- `hooks/inventory/playerInventoryStore` (caché de `GET /player/me/inventory`, mutaciones vía API)
- `hooks/skills/useSkills` (`GET /player/me/skills`, entrenar vía API)
- `ui/inventory/*` (grid interactivo Usar/Info/Eliminar vía API)
- `ui/skills/*` (entrenar vía API, consume pergamino en servidor)

## Flujo (autoridad servidor)
```
Consola addItem:Madera5 → POST /player/me/inventory/add (JWT, valida catálogo 1-9)
  → Player.settings.game.inventory → caché → InventorySlotsGrid
Click Usar/Eliminar → POST /use|/remove (valida stackId propio)
Entrenar → POST /player/me/skills/train (exige 1 pergamino, +10 XP en servidor)
Editar localStorage/DOM desde la consola del navegador → sin efecto (se relee del servidor)
```
