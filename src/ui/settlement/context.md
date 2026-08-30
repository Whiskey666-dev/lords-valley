# ui/settlement / Context — UI de Asentamiento (Implementado parcial)

## Propósito
UI de **gestión del asentamiento** — inventario central, árbol de profesiones, economía. Ya no reservado vacío; tiene 2 componentes activos que consumen `useGameStore`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `InventoryPanel.tsx:4` | 21 | `function InventoryPanel()` sin props. Lee `useGameStore(s=>s.inventory).map {type, quantity string BigInt, weight}`. Si vacío → texto gris 11px. Sino header `Inventario Central (n)` + lista `maxHeight 180` scroll `background #111` filas `type — quantity (formatLvy) weight kg/u`. Footer nota `BigInt 256 bits`. Colores `6ab0ff` header, `#ffd700` quantity. |
| `ProfessionTree.tsx:5` | 31 | `function ProfessionTree({selected,onSelect})` grid 21 profesiones `LENADOR..DIPLOMATA` (`PROFESSIONS const`). Render `repeat(3,1fr)` gap 6 `maxHeight 220` botones `6px 8px` border `4a90e2` si selected else `#333`, bg `1e2a3a` else `1e1e1e`. Click `onSelect(p)` → futuro `PATCH /settlements/:id` supervivencia profesión. |

## Estado
Parcial implementado (2 archivos), no vacío. `settlement/*` sigue stub (5 archivos 0 bytes), pero estos paneles ya consumen `useGameStore` data real (inventory string BigInt, professions).

## Rol Previsto (pendiente)
- `SettlementOverview.tsx` dashboard `Settlement` + `Economy.stock` + moral + `Survivor` warnings.
- `JobsBoard.tsx` tabla `Jobs` con prioridad.
- `PopulationPanel.tsx` lista clickeable → `phaser-npc-selected` (reusa `NpcPanel`).
- `EconomyPanel.tsx` gráfico stock.

## Dependencias
- **Importa:** `app/store/useGameStore`, `common/bigint` (`formatLvy`)
- **No importa:** `Phaser`
- **Provee a:** `app/App` (no montado directamente hoy — `BuildingsPanel` lo reemplaza parcialmente), futuro `ui/menus/Navbar` Seguidores → settlement overview.

## Para Repomix
Montar desde `app/App` con `showSettlement` state similar a `showFollowers/showBuildings` disparado por `phaser-action-*`. Reusar `NpcPanel` para detalle individual. No duplicar `hooks/buildings/buildingsData` lógica — settlements reales vienen de `fetchSettlement`.
