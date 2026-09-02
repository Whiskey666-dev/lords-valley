# src/hooks/context.md — Custom Hooks de Lords Valley

> **Patrón:** Toda lógica de estado y efectos secundarios de componentes UI vive en `src/hooks/<dominio>/`. Los componentes React solo consumen el hook y renderizan. Sin lógica duplicada entre Phaser y React.

## Organización por Dominio

| Directorio | Hook(s) | Propósito |
|---|---|---|
| `app/` | `useAppController` | Controlador maestro: ciclo de vida Phaser, event bus, toggles de todos los paneles, auth, zoom |
| `auth/` | `useAuth` | Autenticación con backend, token JWT |
| `buildings/` | `useBuildings`, `buildingsData` | Estado de 40+ edificios mock, filtros, búsqueda |
| `character/` | `useNpcPanel`, `useFollowers`, `useDeadDragonPanel` | Estado reactivo de NPCs, seguidores y Dead Dragon |
| `construction/` | `useConstruction` | Catálogo de 56 edificios, filtros por categoría/estado, mejoras por capítulo, ghost placement |
| `farming/` | `useCropPlantingModal` | Estado de parcelas, filtros por categoría, temporizador de crecimiento, siembra/cosecha |
| `hud/` | `useMiniMap`, `useWorldMap`, `useWorldInfo`, `useMineralTooltip` | Minimapa circular, mapa mundial, tooltip de minerales |
| `inventory/` | `usePlayerInventory` | Inventario del jugador con categorías y slots equipados |
| `loading/` | `useLoadingScreen` | Barra de carga en tiempo real vía `lords-loading-progress`, fallback timer, ID jugador |
| `menu/` | `useNavbar`, `useConsole`, `useSettingsPanel`, `useKeybindsEditor` | Menús y configuración |
| `missions/` | `useMissions`, `missionsData` | 120 misiones, 6 capítulos, progreso, desbloqueo secuencial |
| `skills/` | `useSkills`, `skillsData` | 5 categorías de habilidades, progresión XP, desbloqueo por tier |

## Convención de Hooks

```typescript
// Patrón estándar de un hook de panel
export function useNombrePanel(props, onClose) {
  // 1. Estado local (useState)
  // 2. Sincronización con fuentes externas (useEffect + farmPlotManager / window events)
  // 3. Temporizadores y actualizaciones periódicas (useEffect + setInterval)
  // 4. Atajo de teclado ESC (useEffect)
  // 5. Datos derivados memoizados (useMemo)
  // 6. Manejadores de acciones (useCallback)
  // 7. Return con toda la interfaz del hook
}
```

## Hook de Control Maestro: `useAppController`

Coordina:
- **Phaser lifecycle**: `startLaunchGame()` una sola vez cuando `isAuthed`, cleanup en desmontaje
- **Event bus bidireccional**: `phaser-npc-selected/deselected`, `phaser-dead-dragon-*`, `phaser-crop-plot-selected`, `phaser-zoom-sync`, `phaser-action-*`
- **Atajos de teclado globales**: `inventory` (E), `missions` (J), `stats` (C) desde `ui/input/KeyBindings`
- **Sincronización auth cross-tab**: `localStorage` events + `auth-changed`
- **Hydratación de datos**: `fetchPlayer`, `fetchSettlementsByOwner` al autenticarse
- **Estado de todos los paneles**: `showCharacter`, `showBuildings`, `showMap`, `showMissions`, `showSkills`, `showConstruction`, `showFollowers`, `showPlayerInventory`, `showSettings`, `selectedNPC`, `selectedDeadDragon`, `selectedFarmPlot`

## Hooks de Farming (`hooks/farming/`)

### `useCropPlantingModal`
- **Estado**: `currentPlot` (FarmPlotStatus sincronizado), `selectedCategory`, `search`, `harvestNotice`
- **Temporizador**: actualiza `currentPlot` cada 1s si hay cultivo plantado (para progreso de crecimiento)
- **Acciones**: `handlePlant(cropId)`, `handleHarvest()`, `handleAdvanceTime(hours)`, `handleClearCrop()`, `handleRemovePlot()`
- **Datos**: `filteredCrops` memoizado (29 cultivos filtrados por categoría + búsqueda texto)
- **ESC**: cierra el modal automáticamente

## Hooks de HUD (`hooks/hud/`)

### `useMineralTooltip`
- Detecta clic izquierdo en canvas de Phaser
- Convierte coordenadas cliente → canvas → mundo → tile isométrico vía `__PHASER_CAMERA__`
- Consulta mineral: primero en `useGameStore.chunks` (GIDs del servidor), luego en `getMineralType` (Terrain procedimental)
- Auto-oculta después de 5 segundos
- Cierra con `Escape`

## Hooks de Loading (`hooks/loading/`)

### `useLoadingScreen`
- Escucha `lords-loading-progress` con `{progress, step}` emitido por `game/scenes/Preloader`
- Fallback timer: avanza +5% cada 200ms hasta 90% si no hay eventos
- Resuelve `playerId` desde `localStorage` (playerId → player.id → token hash → "Invitado")
- Transición de desvanecimiento: `isLoaded = true` → `isVisible = false` con 600ms delay
