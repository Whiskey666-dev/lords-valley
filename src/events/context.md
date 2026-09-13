# src/events/context.md — Eventos Socket.io

> Formatos de los eventos del servidor de Lords Valley (tipos inline en `app/socket.ts`).

## Estructura
```
events/
  context.md   # este archivo (sin código)
```

## Eventos Principales
| Evento | Dirección | DTO |
|---|---|---|
| `joinSettlement` | Cliente → Servidor | `{ settlementId, playerId }` |
| `updateViewport` | Cliente → Servidor | `{ x, y, chunkX, chunkY, sequenceNumber }` (throttled 300ms / 512px) |
| `SURVIVOR_LOYALTY_CHANGED` | Servidor → Cliente | `{ survivorId, loyalty, delta }` |
| `SETTLEMENT_TICK_COMPLETED` | Servidor → Cliente | `{ tick, resources, survivors }` |
| `RESOURCE_EXTRACTED` | Servidor → Cliente | `{ type, amount, tileX, tileY, sequenceNumber }` |

## Notas
- Los eventos usan `sequenceNumber` para deduplicación de eventos fuera de orden
- `updateViewport` se emite solo si la cámara se movió > 512px (optimización de red)
