# src/events/context.md — DTOs de Eventos Socket.io

> Tipos TypeScript para los eventos del servidor de Lords Valley.

## Estructura
```
events/
  dto/       # Data Transfer Objects para cada evento Socket.io
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
- Los DTOs usan `sequenceNumber` para deduplicación de eventos fuera de orden
- `updateViewport` se emite solo si la cámara se movió > 512px (optimización de red)
- Los tipos están en `events/dto/*.ts`, importados por `app/socket.ts`
