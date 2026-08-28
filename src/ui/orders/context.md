# ui/orders / Context — UI de Órdenes (Reservado)

## Propósito
Directorio **reservado vacío** para la **UI de órdenes del jugador** — directivas que se convierten en `settlement/Jobs` y luego `ai/Tasks`.

## Estado Actual
> **Vacío.** `settlement/Orders.ts` stub, `ui/menus/Navbar` botón Construcción es la única orden hoy (sin UI).

## Rol Previsto
- `OrdersPanel.tsx` — lista de órdenes activas `Orders` con prioridad, área, estado, cancelar/repriorizar.
- `OrderTool.tsx` — al seleccionar "Talar" / "Minar" / "Patrullar", permite drag rectangular en canvas Phaser (área) -> `Orders.create({type, area, priority})`.
- Integración con `game/events` para pintar área en Phaser `Graphics` overlay.

## Dependencias Previstas
- `settlement/Orders`, `settlement/Jobs`, `settlement/Management`, `game/scenes/MainScene` (overlay gráfico)

## Para Repomix
Implementar junto a `settlement/Orders.ts`. Patrón similar a `ui/construction` — tool que captura input Phaser y crea entidad de dominio.
