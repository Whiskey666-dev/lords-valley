# game/events / Context — Bus de Eventos de Juego (Reservado)

## Propósito
Directorio **reservado vacío** para centralizar **definición tipada de eventos** `window.CustomEvent` que hoy están dispersos como strings literales (`phaser-npc-selected`, `phaser-zoom-set`, etc.).

## Estado Actual
> **Vacío.** Eventos se disparan/escuchan ad-hoc en `app/App.tsx`, `game/scenes/MainScene.ts`, `characters/Survivor.ts`, `ui/menus/Navbar`, `ui/menus/Console`.

## Rol Previsto
- `GameEvents.ts` — `enum GameEvent { NpcSelected="phaser-npc-selected", ... }` + `interface GameEventPayload { "phaser-npc-selected": NpcPanelData; "phaser-create-npcs": {count:number}; ... }` + helpers `emit<K>(event, payload)` / `on<K>(event, handler)` tipados.
- Evita typos, documenta contrato Phaser<->React.

## Eventos Actuales (a tipar)
`phaser-npc-selected`, `phaser-npc-deselected`, `phaser-toggle-tutorial`, `phaser-zoom-sync`, `phaser-zoom-set`, `phaser-create-npcs`, `phaser-npcs-spawned`, `phaser-chat-bubble`, `phaser-action-*`

## Para Repomix
Crear `GameEvents.ts` aquí antes de que el bus crezca. Migrar `app/App` y `MainScene` a usarlo.
