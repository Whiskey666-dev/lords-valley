# ui/character / Context — Paneles de Personaje

## Propósito
UI de **inspección de humanos**. Muestra ficha detallada de `Survivor` seleccionado.

## Archivo
- `NpcPanel.tsx:33` — `function NpcPanel({npc,onClose})` con `NpcPanelData` (`id,name/profession` + compat `nombre/profesion`, `loyalty,health,edad,traits,personalidad,temperamento,habilidad,gustos,inventario,equipamiento,habilidades,stats,needs`).

## Lógica — `NpcPanel.tsx`
- Fixed `right:0 top:32 bottom:0 width:380` `#151515` borderLeft green, header + ✕, card con avatar/edad/profesion/personalidad/traits/gustos, loyalty bar (gold 100 else green), health bar red, tabs `inventario|equipamiento|habilidades` (flex 3 btns).
- **Inventario:** `VISIBLE_LIMIT=4`, `showAllInventory`, `+N más ocultos`, `maxHeight140` scroll.
- **Equipamiento:** lista slots + stats `salud/energia`.
- **Habilidades:** especialidad + 8 skills + needs `hambre/sed/sueño`.
- Abierto por `app/App.tsx:105` en `phaser-npc-selected`, cerrado por `phaser-npc-deselected`/ESC/click suelo.

## Dependencias
- `characters/Survivor` (tipo `NpcPanelData`), `items/Inventory`, `items/Equipment`, `characters/*` (stats display)

## Para Repomix
Nuevos paneles de personaje (ej. `PlayerPanel`, `EnemyPanel`) van aquí. Reusar tabs pattern y `NpcPanelData` como contrato. No hardcodear strings de `Survivor` — usar `getResumen()` de `Inventory/Equipment`.
