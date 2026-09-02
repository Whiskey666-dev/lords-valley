# src/hooks/hud/context.md — Hooks de HUD

> Hooks para el minimapa, mapa mundial y tooltip de minerales.

## Hooks

### `useMiniMap.ts`
- Canvas 2D circular: renderiza `Terrain` procedimental a resolución `MINI_W×MINI_H`
- Dot rojo = jugador (`window.__PLAYER_POS__`), dots verdes = NPCs (`window.__NPCS_POS__`)
- `miniZoom (1..4)` controla la escala de la vista
- Click en canvas → dispatch `minimap-goto {chunkX, chunkY}` → `MainScene` mueve cámara
- Oculto (CSS `display:none`) cuando hay panel lateral abierto o mapa mundial activo

### `useWorldMap.ts`
- Canvas fullscreen con el mundo completo procedimental (resolución reducida)
- Drag con mouse y zoom con rueda/botones
- Filtros: Recursos ⛏️, Anomalías ⚡, Territoriales 🏰
- Click → dispatch `minimap-goto-world {x, y}` → `MainScene`
- `worldMapProcedural.ts` (130 líneas): genera el mapa usando `seed` del asentamiento

### `useWorldInfo.ts`
- Fecha/hora/estación/clima simulados
- Se actualiza cada minuto de juego
- Lectura de `useGameStore.settlement.worldTime` si disponible

### `useMineralTooltip.ts`
- Escucha `click` en el canvas de Phaser (elemento `#game-container canvas`)
- **Pipeline de coordenadas**:
  1. `clientX/Y` → relativo al canvas (offset del elemento)
  2. → coordenadas mundo Phaser usando `window.__PHASER_CAMERA__.getWorldPoint(x, y)`
  3. → tile isométrico: `tx = Math.floor(worldX / TILE)`, `ty = Math.floor(worldY / TILE)`
- **Fuentes de mineral** (prioridad):
  1. `useGameStore.chunks` (GIDs servidor): 30=Cobre, 31=Estaño, 32=Hierro, 33=Plata, 34=Oro, 35=Carbón
  2. `getMineralType(tx, ty)` desde `game/world/Terrain` (procedimental local)
- Auto-oculta después de 5 segundos
- Cierra con tecla Escape
- Posicionamiento adaptativo: ajusta al borde de ventana si el tooltip se saliera del viewport
