# src/ui/loading/context.md — Pantalla de Carga

> Pantalla de bienvenida y carga inicial del juego.

## Archivos

### `LoadingScreen.tsx` — Pantalla de Carga Medieval
- Hook: `useLoadingScreen` (`hooks/loading/useLoadingScreen`)
- **Siempre montado** mientras `isAuthed`; se desmonta definitivamente al completar (z-index 9999)
- Diseño: fondo `radial-gradient` oscuro, título dorado "LORDS VALLEY", subtítulo gótico, barra de progreso dorado/esmeralda con brillo frontal

**Barra de progreso**:
- Escucha `lords-loading-progress` emitido por `game/scenes/Preloader` con `{progress: number, step: string}`
- Fallback: timer que avanza +5% cada 200ms hasta 90% (asegura fluidez visual)
- Al llegar a 100%: `isLoaded=true` → opacidad 0 con transición 0.6s → `isVisible=false` (desmontaje)

**Info mostrada**:
- Superior: título + subtítulo
- Centro: barra de progreso + paso actual + porcentaje
- Inferior izquierda: ID del jugador (desde localStorage)
- Inferior derecha: versión `v0.1`

**Resolución de ID del jugador** (por prioridad):
1. `localStorage.playerId`
2. `localStorage.player` → `id` o `username`
3. Hash del `access_token` → `"USR-XXXXXXXX"`
4. `"Invitado"` si no hay token

## Eventos que consumes
| Evento | Emisor | Dato |
|---|---|---|
| `lords-loading-progress` | `game/scenes/Preloader` | `{progress: 0-100, step: string}` |

## Pasos de carga (emitidos por Preloader)
- Iniciando motor de juego...
- Cargando assets del jugador... (30 spritesheets 48×64)
- Cargando sprites de cultivos... (29 sprites 384×64)
- Cargando generación de terreno...
- Inicializando sistema de colisiones...
- ¡Listo!
