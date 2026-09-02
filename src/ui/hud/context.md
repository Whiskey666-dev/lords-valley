# src/ui/hud/context.md — Heads-Up Display

> Componentes de HUD (Heads-Up Display) que se superponen al canvas de Phaser sin interferir con el renderizado.

## Archivos

### `MiniMap.tsx` — Minimapa Circular
- Hook: `useMiniMap` (`hooks/hud/useMiniMap`)
- Renderiza canvas 2D circular con el mapa procedimental del mundo
- Click → dispara `minimap-goto {chunkX, chunkY}` para mover la cámara
- Oculto mediante CSS (`display: none`) cuando hay panel lateral o mapa mundial abierto (evita remontaje)

### `WorldMapPanel.tsx` — Mapa Mundial a Pantalla Completa
- Hook: `useWorldMap` (`hooks/hud/useWorldMap`)
- Vista completa del mundo con filtros de biomas, minerales y asentamiento
- Algoritmo procedimental en `worldMapProcedural.ts` para generar el mapa a resolución reducida

### `WorldInfoPanel.tsx` — Panel de Información del Mundo
- Ubicado en `hud/components/WorldInfoPanel.tsx`
- Hook: `useWorldInfo` (`hooks/hud/useWorldInfo`)
- Muestra tiempo, clima y estadísticas del asentamiento

### `MineralTooltip.tsx` — Tooltip de Minerales
- Hook: `useMineralTooltip` (`hooks/hud/useMineralTooltip`)
- **Trigger**: clic izquierdo en el canvas de Phaser
- **Detección**: coordenadas cliente → canvas → mundo Phaser (`__PHASER_CAMERA__.getWorldPoint`) → tile isométrico (`isoToTile`)
- **Fuentes de mineral** (por prioridad):
  1. `useGameStore.chunks` → GIDs del servidor (30=Cobre, 31=Estaño, 32=Hierro, 33=Plata, 34=Oro, 35=Carbón)
  2. `getMineralType(tx, ty)` → Terrain procedimental local
- **Auto-hide**: 5 segundos de timeout, o tecla Escape
- Posicionamiento adaptativo: se ajusta al borde de la ventana si se sale del viewport

### `FogOverlay.tsx` — Niebla de Guerra
- Componente React **vacío** (`return null`)
- La niebla de guerra la gestiona `FogOfWarSystem` de Phaser para mantener 60 FPS
- Este archivo existe como placeholder para posibles capas DOM adicionales en el futuro

## Visibilidad Condicional
```
hasSidePanel = showCharacter || selectedNPC || selectedDeadDragon || selectedFarmPlot || showPlayerInventory || showFollowers

MiniMap: oculto si hasSidePanel || showMap (CSS display:none, no desmonta)
FogOverlay: oculto si showMap (desmonta completamente)
MineralTooltip: siempre montado, solo visible si hay tooltip activo
```
