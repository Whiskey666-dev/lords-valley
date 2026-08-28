# assets / Context — Arte Estático y Sprites

## Propósito
Contiene **arte estático importado por Vite**. No tiene lógica TS; es consumido exclusivamente por `game/scenes/Preloader.ts` que carga los PNGs como `Phaser.Textures`. Define la identidad visual top-down del juego.

## Estructura
```
assets/
  vite.svg, react.svg                 // boilerplate sin uso
  sprites/player/                     // 48x64 por frame, 8 frames por tira (384x64)
    Walk/walk_{Down,Up,Right_Down,Right_Up,Left_Down,Left_Up}.png + walk.png
    Idle/Idle_{Down,Up,Right_Down,Right_Up,Left_Down,Left_Up}.png + Idle.png
    Dash/Dash_{...}.png + Dash.png + Dash/Dust/* (efectos polvo, no cargados)
    Death/death_{...}.png + death.png
    Jump - NEW/Normal/Jump_{...}.png + Jump.png + Dust/* + Jump_Shadow.png
    Shadow.png                        // sombra base
```
~75 archivos; **24 spritesheets activos** (6 dirs x 4 categorías: Walk/Idle/Dash/Death/Jump) cargados como `player_walk_*`, `player_idle_*`, etc. (`game/scenes/Preloader.ts:8-41`). Dust/Shadow están importados pero no registrados en `Preloader` (assets muertos, reservados para futuro).

## Convenciones de Sprites
- **Dimensiones:** `frameWidth:48, frameHeight:64` (`Preloader.ts:54-91` `scene.load.spritesheet`)
- **Frames:** `0..7` (8 frames), `frameRate` walk 10fps loop, idle 6fps loop, dash 14fps once, death 8fps once, jump 12fps once, combat 16fps once (ver `characters/Animations.ts:100-183`)
- **Direcciones físicas:** 6 texturas reales (`down`, `up`, `right_down`, `right_up`, `left_down`, `left_up`) mapeadas desde 8 lógicas (`left`->`left_down`, `right`->`right_down`) vía `characters/Animations.ts:40` `LOGICAL_TO_PHYSICAL`
- **Vite:** `src/vite-env.d.ts:3` declara `module '*.png'` para imports tipados.

## Lógica (no hay, pero contrato)
- Nombres de archivo determinan keys de textura: `player_walk_down`, `npc_walk_down`, etc.
- `characters/Animations.ts:66` `resolveTexture(primary, fallback)` permite que `npc_*` caiga a `player_*` si falta la textura NPC (fallback).

## Dependencias
- **Consumido por:** `game/scenes/Preloader.ts` (único consumidor) -> `characters/Animations.ts` (crea `scene.anims`) -> `characters/BaseHuman` (reproduce anims)
- **No depende de:** ningún otro módulo.

## Flujo
```
Vite bundle URL (import *.png) -> Phaser.Loader.spritesheet (Preloader.preload)
  -> scene.textures cache -> scene.anims.create (Animations.ts) -> BaseHuman.playWalk/Idle/etc.
```

## Para Repomix
Al agregar nuevas animaciones (ej. `attack`, `carry`), mantener naming `player_<action>_<physicalDir>.png` y registrar en `Preloader.ts` + `characters/Animations.ts:create*Animations`. Respetar 48x64 8 frames. Dust sprites están listos para efectos de partículas futuros.
