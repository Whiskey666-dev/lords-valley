# src/hooks/app/context.md — Hook de Control Maestro

> Hook central que orquesta toda la aplicación: ciclo de vida de Phaser, event bus, autenticación y toggles de paneles.

## `useAppController.ts`

### Responsabilidades
1. **Ciclo de vida Phaser**: llama `startLaunchGame()` una sola vez cuando el usuario está autenticado (`isAuthed`)
2. **Event bus bidireccional**: escucha todos los eventos `phaser-*` y despacha hacia Phaser
3. **Estado de paneles**: gestiona qué paneles están visibles (boolean + datos seleccionados)
4. **Atajos de teclado globales**: vincula acciones canónicas de `ui/input/KeyBindings`
5. **Auth cross-tab**: sincroniza estado de autenticación entre pestañas via `localStorage` events
6. **Hydratación de datos**: `fetchPlayer` + `fetchSettlementsByOwner` al autenticarse

### Estado que Gestiona
```typescript
// Paneles booleanos
showCharacter, showBuildings, showMap, showMissions,
showSkills, showConstruction, showFollowers,
showPlayerInventory, showSettings

// Datos de selección (null = cerrado)
selectedNPC: NpcPanelData | null
selectedDeadDragon: DeadDragonPanelData | null
selectedFarmPlot: FarmPlotStatus | null
```

### Event Bus (completo)
**Phaser → App:**
| Evento | Acción |
|---|---|
| `phaser-npc-selected` | `setSelectedNPC(detail)` |
| `phaser-npc-deselected` | `setSelectedNPC(null)` |
| `phaser-dead-dragon-selected` | `setSelectedDeadDragon(detail)` |
| `phaser-dead-dragon-deselected` | `setSelectedDeadDragon(null)` |
| `phaser-crop-plot-selected` | `setSelectedFarmPlot(detail)` |
| `phaser-zoom-sync` | pasa zoom% a `Navbar` |
| `phaser-action-*` | toggle panels via KeyBindings |

**App → Phaser:**
| Evento | Disparado desde |
|---|---|
| `phaser-zoom-set` | `Navbar` slider |
| `phaser-start-placement` | `useConstruction.handleStartPlacement` |
| `phaser-cancel-placement` | cierre de `ConstructionPanel` |

### Integración con Zustand
- Lee: `isAuthed`, `playerId`, `settlements`
- Escribe: `setIsAuthed`, `setPlayerId`, `setSettlements`, `setPlayerInfo`

### Retorno (interfaz pública)
Todo el estado + funciones de toggle que pasan a `App.tsx` → componentes UI.
