# game/scenes / Context — Escenas Phaser

## Propósito
Contiene las **Scenes** del ciclo `preload → create → update`. Punto de entrada visual y orquestación del mundo `6144×6144`.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `Preloader.ts:43` | 100 | `class Preloader extends Phaser.Scene ("Preloader")`. `preload()` carga **30 spritesheets 48×64** (`player_walk|idle|dash|death|jump` ×6 dirs físicas `down/up/right_down/right_up/left_down/left_up`) vía Vite imports. `create()` → `scene.start("MainScene")`. Texto "Cargando Lords Valley..." en `16,16`. |
| `MainScene.ts:16` | 308 | `class MainScene extends Phaser.Scene ("MainScene")`. Ver `game/context.md` y `game/systems/context.md` para detalle. Campos `player, npcs, chatSystem, chunkRenderer, cameraController, cameraFollow, lastViewportEmit`. Métodos `setupWorld`, `spawnPlayer`, `setupNpcListeners`, `setupRTSOverlay`, `verifyHumanAnimations`, `update`. |

## Lógica — Preloader
- Única scene que toca `assets/` — convierte URLs Vite a `Phaser.Textures` keys `player_walk_down` etc.
- `FRAME_W=48, FRAME_H=64` (`Preloader:50`), `load.spritesheet(key, url, {frameWidth,frameHeight})` para 30 keys.
- No hay assets muertos: Dust/Shadow aún no cargados (reservados en `assets/sprites/.../Dust`).

## Lógica — MainScene (resumen)
- **create(8 pasos):** `setupWorld` (bounds 6144, Graphics grid 64px) → `initAllCharacterAnimations` → `spawnPlayer` (center polar 200 + async fetch lastPos + interactive Player) → `ChatBubbleSystem` → `setupCamera 6144` → `setupRTSOverlay` (ChunkRenderer + CameraController + minimap goto) → listeners `phaser-create-npcs/focus-npc`.
- **update:** toggle cameraFollow Y, frustum culling `worldView.contains`, `ChunkRenderer.update` + socket `updateViewport` throttled, `CameraController.update`, bloqueo input, dispatch `phaser-action-*` (ESC/I/M/J/P), `player/npcs updateEntity`, export `__PLAYER_POS__/__NPCS_POS__`, `updateCamera` si follow.
- **verifyHumanAnimations:** 104+ keys chequeadas, warn listado si faltan.
- Mundo grid `Graphics stroke 64px #333333` depth -20, no `add.grid` (evita repintado lento).

## Dependencias
- `Phaser`, `assets/*`, `characters/Animations`, `characters/Player`, `characters/Survivor`, `ui/input/KeyBindings`, `game/systems/*`, `game/world/Terrain`, `app/api/player.api`, `app/store/useGameStore`, `app/socket`
- Provee a `game/main.ts` (registrado en `config.scene`), `characters/*` (scene para sprites)

## Para Repomix
Nuevas scenes (ej. `MenuScene`, `PauseScene`) van aquí y se registran en `game/main.ts:scene`. Mantener `MainScene` como gameplay — extraer lógica a `game/systems/` o `game/world/`. No añadir lógica de negocio aquí.
