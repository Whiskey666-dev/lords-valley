# src / Context — Lords Valley v0.1

> Stack: **Phaser 4.2.1** (Arcade Physics, Scenes, Tweens) + **React 19** + **Vite 8** + **TypeScript 6**. Punto de entrada `main.tsx` -> `app/App.tsx` -> `game/main.ts`.

## Propósito General de `src/`
`src/` contiene toda la lógica del juego **Lords Valley**, un survival / colony-sim / city-builder top-down. La arquitectura separa:
- **Core de juego (Phaser)** en `game/`, `characters/`, `combat/`, `world/` — corre dentro del canvas `#game-container`.
- **Overlay UI (React)** en `app/` y `ui/` — navbar, paneles, consola, tutorial, keybindings.
- **Simulación / Datos** en `ai/`, `buildings/`, `items/`, `settlement/`, `save/` — la mayoría aún en stub, scaffolding para la visión completa de colonia.
- **Assets** en `assets/` — sprites 48x64, 8 frames por tira (384x64).

## Comunicación Phaser <-> React
No hay imports directos entre capas. Se usa **bus de eventos `window.CustomEvent`**:
- `Phaser -> React`: `phaser-npc-selected`, `phaser-npc-deselected`, `phaser-zoom-sync`, `phaser-npcs-spawned`, `phaser-chat-bubble`
- `React -> Phaser`: `phaser-zoom-set`, `phaser-create-npcs`, `phaser-action-*`, `phaser-toggle-tutorial`
- Singleton global de input `ui/input/KeyBindings.ts` expone `isGameInputBlocked()` que `game/scenes/MainScene` y `characters/Player` consultan cada frame.

## Estructura de Módulos
| Módulo | Estado | Rol |
|---|---|---|
| `app/` | Implementado | Root React + puente Phaser-React |
| `game/` | Implementado | Orquestador Phaser: config, Preloader, MainScene, InputSystem |
| `characters/` | Implementado (11/12) | Modelo humano + animaciones centralizadas + Player/Survivor |
| `combat/` | Parcial | `CombatSystem` funcional (anim attack), `Weapons/Damage` stub |
| `ui/` | Implementado | React UI: Navbar, Console, TutorialPanel, NpcPanel, KeyBindings |
| `items/` | Parcial | `Inventory/Equipment` implementados, `Item/Resources/Weapons/Food` stub |
| `assets/` | Implementado | Sprites Walk/Idle/Dash/Death/Jump 6 dirs físicas |
| `ai/` | Stub vacío | TaskSystem, Pathfinding, NeedsSystem, DecisionSystem (previstos) |
| `buildings/` | Stub vacío | Building, Construction, Production (previstos) |
| `settlement/` | Stub vacío | Settlement, Jobs, Orders, Economy, Management (previstos) |
| `world/` | Stub vacío | Time, Seasons, Weather, Map, Chunks, Events (previstos) |
| `save/` | Stub vacío | SaveSystem, SaveData, PersistenceSimulation (previstos) |

## Flujo de Datos Actual (vertical slice funcional)
```
assets/sprites --Vite import--> game/scenes/Preloader (carga 24 spritesheets)
        --> characters/Animations (registerHumanAnimations)
        --> characters/BaseHuman (playWalk/Idle/Jump/Dash/Death/Attack)
        --> characters/Player + characters/Survivor(SurvivorSprite)
        --> game/scenes/MainScene (spawn, physics, camera, colliders)
        <---> app/App (event bus) <---> ui/* (render + input)
        --> ui/input/KeyBindings (singleton, localStorage, bloqueo de input)
```

## Flujo Futuro Planificado (colony-sim completo)
```
world/Time tick --> ai/NeedsSystem (simularNecesidades) --> ai/DecisionSystem (utility scoring)
  --> ai/TaskSystem (cola de Tasks/Jobs de settlement/Jobs) --> ai/Pathfinding (A* sobre world/Chunks)
  --> characters/Survivor.moverEnDireccion() --> buildings/Construction/Production
  --> settlement/Economy (recursos) --> save/PersistenceSimulation (offline) --> save/SaveSystem
```

## Convenciones
- Idioma de dominio en español (`hambre`, `sed`, `lealtad`, `gustos`, `profesion`) mezclado con APIs en inglés.
- Sprites: 48x64 por frame, 8 frames por animación, 6 direcciones físicas (`down`, `up`, `right_down`, `right_up`, `left_down`, `left_up`) mapeadas desde 8 lógicas via `LOGICAL_TO_PHYSICAL`.
- Mundo: `2000x2000`, grid 64px, cámara sigue a `Player`, zoom `0.6..1.6` mapeado a `0..100%`.

## Para Repomix
Cada subdirectorio contiene su propio `context.md` con detalle de archivos, clases, eventos y dependencias. Este archivo es el índice; los `context.md` hijos son la fuente de verdad por módulo.
