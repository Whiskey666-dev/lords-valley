# src/ui/context.md — Interfaz React (Overlay sobre Phaser)

> **Capa React completa** sobre canvas Phaser. Sin lógica de juego — solo presentación + consumo de hooks + bus de eventos.

## Principio Fundamental
- **Los componentes UI son puramente presentacionales**
- **Toda lógica de estado está en `src/hooks/<dominio>/`**
- Sin imports de Phaser en `ui/` (excepto tipos)

## Estructura de Directorios
```
ui/
  input/KeyBindings.ts          # CANÓNICO: 16 acciones remapables (ver ui/input/context.md)
  menus/Navbar.tsx              # Barra superior 32px con acciones y zoom
  menus/Console.tsx             # Consola dual chat/dev
  menus/KeybindsEditor.tsx      # Editor de atajos de teclado
  menus/SettingsPanel.tsx       # Modal configuración por tabs
  menus/components/             # GraphicsSettingsTab, SaveSettingsTab, AccountSettingsTab
  character/NpcPanel.tsx        # Panel lateral NPC/Jugador (285px)
  character/FollowersPanel.tsx  # Panel de seguidores (izquierda fijo)
  character/DeadDragonPanel.tsx # Panel del Dead Dragon (285px)
  character/components/         # NpcStatusTab, NpcAttributesTab, NpcProfessionsTab, NpcInventoryTab
  inventory/PlayerInventoryPanel.tsx  # Inventario del jugador (285px)
  inventory/components/         # EquippedSlotsGrid, InventoryCategoryFilter, InventorySlotsGrid
  hud/MiniMap.tsx               # Minimapa circular expandible
  hud/WorldMapPanel.tsx         # Mapa mundial fullscreen con filtros
  hud/MineralTooltip.tsx        # Tooltip on-click de minerales
  hud/FogOverlay.tsx            # Placeholder (niebla en Phaser)
  hud/components/WorldInfoPanel.tsx  # Fecha/hora/clima
  farming/CropPlantingModal.tsx # Modal siembra/cosecha (29 cultivos, ciclo 24h)
  construction/ConstructionPanel.tsx # Panel 56 edificios + mejoras por capítulo
  buildings/BuildingsPanel.tsx  # Gestión y administración de edificios construidos
  missions/MissionsPanel.tsx    # 120 misiones en 6 capítulos
  skills/SkillsPanel.tsx        # Pentagrama de habilidades SVG interactivo
  skills/SkillDetailPanel.tsx   # Detalle de habilidad seleccionada
  settlement/InventoryPanel.tsx # Inventario central del asentamiento
  settlement/ProfessionTree.tsx # Árbol de 21 profesiones
  loading/LoadingScreen.tsx     # Pantalla de carga medieval (z-index 9999)
  orders/                       # (vacío) Panel de órdenes de producción previsto
```

## Paneles y sus Hooks
| Componente | Hook | Apertura |
|---|---|---|
| `Navbar` | `useNavbar` | Siempre visible |
| `Console` | `useConsole` | Tecla \` o botón |
| `SettingsPanel` | `useSettingsPanel` | Navbar / tecla |
| `KeybindsEditor` | `useKeybindsEditor` | Desde Settings |
| `NpcPanel` | `useNpcPanel` | `phaser-npc-selected` |
| `FollowersPanel` | `useFollowers` | Navbar |
| `DeadDragonPanel` | `useDeadDragonPanel` | `phaser-dead-dragon-selected` |
| `PlayerInventoryPanel` | `usePlayerInventory` | Navbar / tecla I |
| `BuildingsPanel` | `useBuildings` | Navbar |
| `ConstructionPanel` | `useConstruction` | Navbar |
| `MissionsPanel` | `useMissions` | Navbar / tecla J |
| `SkillsPanel` | `useSkills` | Navbar |
| `CropPlantingModal` | `useCropPlantingModal` | `phaser-crop-plot-selected` |
| `MiniMap` | `useMiniMap` | Siempre (CSS toggle) |
| `WorldMapPanel` | `useWorldMap` | Navbar / tecla M |
| `MineralTooltip` | `useMineralTooltip` | On-click canvas |
| `LoadingScreen` | `useLoadingScreen` | Siempre hasta load |

## Flujo Global
```
game/MainScene
  --window event--> hooks/app/useAppController
  --Zustand / state--> ui/* render
ui/* action
  --window event--> MainScene / socket
ui/input/KeyBindings.isGameInputBlocked()
  --> MainScene.update + Player.updateEntity
```

## Convenciones de Nuevos Paneles
- **Panel fijo**: `285px` ancho, `fixed` izquierda o derecha, `borderLeft/Right` con color de dominio
- **Modal**: `fixed inset 0`, overlay oscuro, contenedor centrado `640|960|1080px`
- Siempre `onClose` vinculado a Escape
- Hook separado `use<NombrePanel>` en `hooks/<dominio>/`
- Nueva acción de teclado → `GameAction` en `KeyBindings.ts` + `InputSystem.ts`
