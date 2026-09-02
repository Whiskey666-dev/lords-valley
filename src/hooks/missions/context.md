# src/hooks/missions/context.md — Hook de Misiones

> Lógica para el panel de progresión de misiones del juego.

## `useMissions.ts`
- Estado: `activeChapter` (capítulo activo), `selectedMission` (misión expandida)
- `missions`: desde `missionsData.ts` con estado local de `completado/desbloqueado`
- Desbloqueo secuencial: completar última misión del capítulo N desbloquea el capítulo N+1
- Cierra con Escape

## `missionsData.ts`
- **120 misiones** en 6 capítulos:
  | Capítulo | Nombre | Color | Misiones |
  |---|---|---|---|
  | 0 | Supervivencia | `#ef4444` | 20 |
  | 1 | Asentamiento | `#f97316` | 20 |
  | 2 | Señorío | `#eab308` | 20 |
  | 3 | Ducado | `#22c55e` | 20 |
  | 4 | Conquista | `#3b82f6` | 20 |
  | 5 | Imperio | `#a855f7` | 20 |
- `MISSION_CATEGORIES`: array con `{id, label, color, icon}` por capítulo
- Cada misión tiene: `id`, `title`, `description`, `chapter`, `reward`, `completado`, `desbloqueado`

## Relación con Construcción
`useConstruction.getUpgradesForBuilding()` referencia `MISSION_CATEGORIES` para colorear y etiquetar los capítulos requeridos en el panel de mejoras de edificios.
