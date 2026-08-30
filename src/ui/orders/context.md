# ui/orders / Context — UI de Órdenes (Reservado vacío)

## Propósito
Directorio **reservado vacío** para **órdenes del jugador** — directivas que se convierten en `settlement/Jobs` → `ai/Tasks`. Único botón hoy es "Construcción" verde `#2e7d32` en `Navbar` que dispara `phaser-action-construction` sin handler específico.

## Estado Real
> **Vacío — solo `context.md`.** Glob `src/ui/orders/*` lista únicamente este archivo. `settlement/Orders.ts` también 0 bytes. Sin componentes.

## Archivos (previstos)
| Archivo | Rol Previsto |
|---|---|
| `OrdersPanel.tsx` | Lista `Orders {type:'talar'|'construir'|'patrullar'|'recolectar', area:Rect, priority, status}` con cancelar/repriorizar. |
| `OrderTool.tsx` | Tool drag rectangular en canvas Phaser al seleccionar "Talar/Minar/Patrullar" → `Orders.create({type, area, priority})` + overlay `Graphics` en `MainScene`. |

## Dependencias Previstas
- `settlement/Orders`, `settlement/Jobs`, `settlement/Management`, `game/scenes/MainScene` (overlay gráfico)

## Para Repomix
Implementar junto a `settlement/Orders.ts`. Patrón similar a `ui/construction` — tool que captura input Phaser y crea entidad de dominio. No crear lógica aislada aquí sin `settlement/` base.
