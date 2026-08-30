# ui / Context — Interfaz React (Overlay sobre Phaser)

## Propósito
**Capa React completa** sobre canvas Phaser. Input remapable, navegación, consola/chat, paneles inspección, inventario, edificios, minimapa/worldmap, settlement. Sin lógica de juego — solo presentación + bus eventos + Zustand.

## Estructura Real (archivos existentes)
```
ui/
  input/KeyBindings.ts      // CANÓNICO 251 líneas 16 acciones (ver ui/input/context.md)
  menus/Navbar.tsx          // 175 líneas barra 32px 3 secciones + useNavbar
  menus/Console.tsx         // 157 líneas dual chat/console + useConsole
  menus/TutorialPanel.tsx   // 43 líneas wrapper KeybindsEditor top36 left12 360px
  menus/KeybindsEditor.tsx  // 50 líneas lista BINDING_INFOS 340 scroll Guardar/Cancelar/Reset + useKeybindsEditor
  menus/SettingsPanel.tsx   // 140 líneas modal 640 categorizado + useSettingsPanel
  menus/components/GraphicsSettingsTab.tsx // FPS/Render/Sombras/Líquidos/Partículas
  menus/components/SaveSettingsTab.tsx     // 54 líneas 1 partida + Nueva
  menus/components/AccountSettingsTab.tsx  // 43 líneas Google/Lords
  character/NpcPanel.tsx    // 166 líneas 285px 4 tabs estado/atributos/profesiones/inventario + useNpcPanel
  character/FollowersPanel.tsx // 166 líneas fixed left 285px buscador + lista + useFollowers
  character/components/NpcStatusTab.tsx // 35 líneas necesidades + salud
  character/components/NpcAttributesTab.tsx // 33 líneas atributos 6 ejes
  character/components/NpcProfessionsTab.tsx // 37 líneas professions 21 + XP
  character/components/NpcInventoryTab.tsx // 38 líneas inventory string BigInt 256
  inventory/PlayerInventoryPanel.tsx // 87 líneas 285px + 3 subcomponents + usePlayerInventory
  inventory/components/EquippedSlotsGrid.tsx // 44 líneas 10 slots
  inventory/components/InventoryCategoryFilter.tsx // 102 líneas dropdown 10 categorías
  inventory/components/InventorySlotsGrid.tsx // 178 líneas grid 20+30 locked 50 máx
  hud/MiniMap.tsx           // 334 líneas circular canvas + 3 CircleBtn + WorldInfoPanel
  hud/WorldMapPanel.tsx     // 422 líneas fullscreen filtros Recurso/Anomalía/Territorio + canvas drag/zoom
  hud/components/WorldInfoPanel.tsx // 108 líneas fecha/hora/estación/clima
  buildings/BuildingsPanel.tsx // 908 líneas modal 1060×670 7 categorías 40+ edificios + useBuildings
  settlement/InventoryPanel.tsx // 21 líneas inventory central BigInt
  settlement/ProfessionTree.tsx // 31 líneas grid 21 profesiones
```

## Lógica — KeyBindings (resumen)
16 acciones `move_up/down/left/right, jump, dash, attack, attackAlt, inventory, map, missions, stats, tutorial, interact, close, cameraFollow (Y)`, `BINDING_INFOS` defaults `WASD SPACE SHIFT F/Q I/M/J/P TAB CLICK ESC Y`, `isGameInputBlocked()` `rebinding||consoleOpen||inventoryOpen||activeElement input||__lordsConsoleOpen`. Ver `ui/input/context.md`.

## Lógica — Navbar
`useNavbar` → `leftButtons/rightButtons/dispatchAction` emite `phaser-action-*` + toggles `onOpenSettings/onToggleInventory/Followers/Buildings/Map`. Zoom `−/+` `zoom%`, Construcción verde `#2e7d32`.

## Lógica — Console
`useConsole` → `open,mode(chat|console),input,history,feedback,execute` regex `^createnpc\s*([1-9]|10)$`→`phaser-create-npcs`, chat→`phaser-chat-bubble`, ESC cierra, ENTER ejecuta. Bloquea input.

## Lógica — NpcPanel / FollowersPanel
`NpcPanel` 285px borderLeft `00ff88`, header nombre edad gender, info `Profesión Lv`, loyalty bar gold/green, health bar red, grid necesidades `hambre/sed/fatiga/cordura` si `isCore` (attributes/professions/needs), tabs 4 `estado/atributos/profesiones/inventario` (cada tab 35-38 líneas). `FollowersPanel` left fixed 285px borderRight `00ff88`, buscador si `total>4` (`setConsoleOpen` focus), lista `followersList` card `name profession pos health/loyalty bars Ver NPC→` (center `phaser-focus-npc`), empty `🏕️ createNpc5`.

## Lógica — Inventory
Ver `ui/inventory/context.md`: 20 disponibles +30 locked 50 máx, filtro 10 categorías, `MAX_STACK 10`.

## Lógica — BuildingsPanel
Ver `buildings/context.md`: `hooks/buildings/buildingsData` mock, modal 1060×670, lista 310px, detalle gestión (bodega recipe) / administración (puestos hierarchy roles).

## Lógica — Hud
`MiniMap` circular `currentSize 120/180` expandable, canvas + borde, cross retícula, scale `miniZoom 1..4`, botones `Expand ⛶, Missions 🎯, Alerts ⚠️`, WorldInfo `📅` toggle `WorldInfoPanel`, zoom bar vertical +/−. `useMiniMap` hook (255 líneas) maneja canvas draw `Terrain` colors + player red dot + NPCs green + filters. `WorldMapPanel` fullscreen `#030c1a`, barra superior `Mapa del Mundo` + Filtros dropdown (Recursos ⛏️, Anomalías ⚡, Territoriales 🏰) + Zoom `%/+/-` + Centrar ⊙ + player pos + close ESC, canvas drag/zoom procedural `hooks/hud/worldMapProcedural 130 líneas seed`, leyenda `Tu posición red glow + NPCs + filtros`, `useWorldMap 454 líneas`.

## Flujo Global
```
game/MainScene --window event--> hooks/app/useAppController --Zustand--> ui/* render
ui/* action --window event|store--> MainScene / socket
ui/input/KeyBindings --isGameInputBlocked--> MainScene.update + Player.updateEntity
```

## Dependencias
- **Importa:** `React`, `ui/input/KeyBindings`, `app/store/useGameStore`, `hooks/*`, `items/Item`, `common/bigint`
- **No importa:** `Phaser` directo (excepto KeyBindings phaserKeyCode)
- **Provee a:** `app/App.tsx`

## Para Repomix
Nuevo panel → fijo `285px` o modal `640/1060`, `onClose` dispatch `phaser-npc-deselected` o `clearSelection`, hook `use*` separado. Nueva acción → `GameAction` + `BINDING_INFOS` + `InputSystem` wrapper.
