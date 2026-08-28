# ui/settlement / Context — UI de Asentamiento (Reservado)

## Propósito
Directorio **reservado vacío** para la **UI de gestión del asentamiento** — overview de población, recursos, moral, trabajos.

## Estado Actual
> **Vacío.** `settlement/*` 5 archivos stub, `ui/menus/Navbar` `Seguidores/Edificios` sin handler.

## Rol Previsto
- `SettlementOverview.tsx` — dashboard `Settlement` con población, `Economy.stock`, `moral`, lista `Survivor` con `Loyalty` + `Needs` warnings.
- `JobsBoard.tsx` — tabla `Jobs` con `type, priority, assignedTo, location`, reordenar prioridad, asignar manual.
- `PopulationPanel.tsx` — lista `Survivor` clickeable -> `phaser-npc-selected` (reusa `NpcPanel`).
- `EconomyPanel.tsx` — gráfico stock, `income - upkeep`, trading.

## Dependencias Previstas
- `settlement/Settlement`, `settlement/Jobs`, `settlement/Economy`, `settlement/Management`, `characters/Survivor`

## Para Repomix
Montar desde `app/App` (estado `showSettlement`) disparado por `phaser-action-*` o `Navbar` Seguidores. Reusar `NpcPanel` para detalle individual.
