# src/ui/missions/context.md — Panel de Misiones

> Panel de progresión de misiones con 120 misiones en 6 capítulos de la historia.

## `MissionsPanel.tsx`
- Hook: `useMissions` (`hooks/missions/useMissions`)
- Panel lateral derecho o modal fullscreen (según breakpoint)
- **6 capítulos** con colores distintivos y pestañas de navegación
- Cada misión: título, descripción, recompensa, estado (bloqueada/disponible/completada)
- Desbloqueo secuencial: completar todas las misiones de un capítulo desbloquea el siguiente

## Capítulos
| # | Nombre | Color | Icono |
|---|---|---|---|
| 0 | Supervivencia | `#ef4444` | 🔥 |
| 1 | Asentamiento | `#f97316` | 🏕️ |
| 2 | Señorío | `#eab308` | ⚜️ |
| 3 | Ducado | `#22c55e` | 🏰 |
| 4 | Conquista | `#3b82f6` | ⚔️ |
| 5 | Imperio | `#a855f7` | 👑 |

## Relación con Construcción
Los **capítulos** de misiones determinan qué edificios y mejoras están disponibles en `ConstructionPanel`. Esto crea la progresión del juego: avanzar en misiones desbloquea nuevas capacidades de construcción.
