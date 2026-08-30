# assets / Context — Arte Estático y Sprites

## Propósito
Arte estático Vite. Sin lógica TS; consumido exclusivamente por `game/scenes/Preloader.ts` → `Phaser.Textures` → `characters/Animations.ts` → `BaseHuman`.

## Estructura Real
```
assets/
  vite.svg, react.svg               // boilerplate sin uso
  sprites/player/                   // 48×64 por frame, 8 frames por tira (384×64)
    Walk/ walk_Down,Up,Right_Down,Right_Up,Left_Down,Left_Up.png + walk.png
    Idle/  Idle_Down,Up,Right_Down,Right_Up,Left_Down,Left_Up.png + Idle.png
    Dash/  Dash_Down,Up,Right_Down,Right_Up,Left_Down,Left_Up.png + Dash.png
    Dash/Dust/ Dash_Dust*.png (7, no cargados)
    Death/ death_Down,Up,Right_Down,Right_Up,Left_Down,Left_Up.png + death.png
    Death_Shadow/ death_normal*.png (7, no cargados)
    Jump - NEW/Normal/ Jump_Down,Up/Right_Down/Right_Up/Left_Down/Left_Up.png + Jump.png
    Jump - NEW/Dust/ Jump_Dust*.png (7, no cargados)
    Jump - NEW/Jump_Shadow.png (no cargado)
    Shadow.png (no cargado)
    frame dimensions.png (doc 48×64)
```
~75 archivos; **30 spritesheets activos** (5 categorías ×6 dirs: Walk/Idle/Dash/Death/Jump) cargados como `player_walk_down` etc en `Preloader.ts:54-91`. Dust/Shadow/`Death_Shadow` importados en disco pero **no** registrados en Preloader (assets muertos, reservados para partículas/sombras futuras).

## Convenciones
- **Dims:** `frameWidth 48, frameHeight 64` (`Preloader:54-91` `load.spritesheet`)
- **Frames:** `0..7` 8 frames, `frameRate` walk 10 loop, idle 6 loop, dash 14 once, death 8 once, jump 12 once, combat 16 once (reusa dash) ver `Animations:100-183`
- **Dirs físicas:** 6 texturas (`down,up,right_down,right_up,left_down,left_up`) mapeadas desde 8 lógicas (`left→left_down`, `right→right_down`) vía `Animations:69 LOGICAL_TO_PHYSICAL`
- **Vite:** `vite-env.d.ts:3` declara `module '*.png'`

## Contrato
- Naming `player_<action>_<physicalDir>.png` → key `player_<action>_<physicalDir>` en `scene.textures`.
- `Animations:66 resolveTexture(primary,fallback)` permite `npc_*` fallback a `player_*` si falta.
- `initAllCharacterAnimations` registra `walk_/idle_/dash_/death_/jump_/attack_` para `""` y `npc_`.

## Dependencias
- **Consumido por:** `game/scenes/Preloader` único → `characters/Animations` → `characters/BaseHuman`
- **No depende de:** otros módulos

## Para Repomix
Nueva animación (ej. `attack`, `carry`) → mantener `player_<action>_<physicalDir>.png` 48×64 8 frames, registrar en `Preloader.ts` + `Animations.ts:create*Animations`. Dust sprites listos para `Phaser.GameObjects.Particles` futuro.
