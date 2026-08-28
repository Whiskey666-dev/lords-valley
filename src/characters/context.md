# characters / Context — Modelo Humano, Stats y Animaciones

## Propósito
**Módulo más implementado del proyecto (11/12 archivos).** Modela a todo humano del juego — `Player` y `Survivor` (NPC) comparten física, animaciones y datos — y centraliza el sistema de animaciones 8 direcciones usado por ambos.

## Archivos Clave
| Archivo | Líneas | Rol |
|---|---|---|
| `BaseHuman.ts:25` | ~130 | `abstract class BaseHuman extends Phaser.Physics.Arcade.Sprite`. Centraliza física (`body 20x20 offset 14,36`, `collideWorldBounds`, `origin 0.5,0.5`), `lastDirection: Direction8`, `animPrefix/texturePrefix`, helpers `playWalk/Idle/Jump/Dash/Death/Attack` con guard `currentAnim.key !== key`. |
| `Animations.ts:1` | 276 | **Crítico.** Define `Direction8` (8 lógicas) + `PhysicalDir` (6 texturas), `LOGICAL_TO_PHYSICAL:40`, `ALL_DIRECTIONS_8:51`, resolvers `resolveTexture/createAnim`, generadores `createWalk/Idle/Dash/Death/Jump/CombatAnimations`, `registerHumanAnimations:237`, `initAllCharacterAnimations:257` (llamado en `MainScene.ts:27`). |
| `Player.ts:8` | ~130 | `class Player extends BaseHuman`. `isJumping/isDashing`, `executeJump` (tween scale 1.12 + y-10 180ms yoyo, 550ms reset), `executeDash` (500px/s *225ms), `updateEntity:70` (tick principal: lee `game/systems/InputSystem`, maneja bloqueo, air steering 184px/s, normal 160px/s). |
| `Survivor.ts:28` | 180 | `class Survivor` + `SurvivorSprite:20 extends BaseHuman`. Data procedural: `id`, `nombre` (16), `edad 18..50`, `profesion` (10), `stats/needs/loyalty/traits/personality/skills/gustos/inventory/equipment`. `instanciarSprite:71` (interactive, depth 10, dispatch `phaser-npc-selected`), `updateEntity:114` idle, `moverEnDireccion/saltar/dash/atacar` API para IA. |
| `Stats.ts:1` | ~20 | `class Stats { maxSalud 80..120, salud, energia 70..100, recibirDano(cantidad) }` |
| `Needs.ts:1` | ~20 | `class Needs { hambre/sed/sueño 0..100, init 0..20, simularNecesidades() hambre+=0.1 sed+=0.2 cap 100 }` — tick lento previsto vía `world/Time` |
| `Traits.ts:1` | ~35 | `TRAITS_POOL 20` (Valiente..Irascible), `lista:Trait[] 1..3` random sin reemplazo, `has()`, `toString()` |
| `Skills.ts:1` | ~40 | `SkillName 8` (combate, construccion, agricultura, mineria, carpinteria, medicina, liderazgo, supervivencia), `niveles:Record<SkillName,number> 1..10`, `especialidad` (max), `resumen` |
| `Personality.ts:1` | ~40 | `PERSONALITY_ARCHETYPES 8` (Líder..Rebelde), `PERSONALITY_TRAITS 6` (Extrovertido..Idealista), `arquetipo, temperamento, sociabilidad, valentia, empatia 0..100` |
| `Loyalty.ts:1` | ~25 | `nivel 0..100`, `estadoPolitico:9` `≥90 Fanático|≥60 Leal|≥35 Inconforme|else Potencial Rebelde` |
| `Gustos.ts:1` | ~35 | Pools `GUSTOS_COMIDA, ACTIVIDAD, CLIMA`, `comidaFavorita, actividadFavorita, climaFavorito, desagrado`, `resumen` |
| `Relationships.ts` | 0 | **STUB** — grafo social `affinity` entre Survivors, eventos que afectan lealtad. |
| `BaseHuman.ts` + `Animations.ts` | — | `getDirectionFromInput(xDir,yDir):Direction8`, `resolveTexture`, `createAnim(key,texture,frameRate,repeat)` |

## Lógica Central — Animaciones (`Animations.ts`)
- **Mapeo 8->6:** `LOGICAL_TO_PHYSICAL = { right:'right_down', left:'left_down', ... }` — solo 6 texturas físicas por acción.
- **Keys:** `"<prefix>walk_<physicalDir>"`, `"<prefix>idle_<...>"`, etc. `prefix=""` para player (`walk_down`), `"npc_"` para NPCs (`npc_walk_down`), fallback automático a `player_*` si `npc_*` no existe.
- **Generadores:** walk 10fps loop -1, idle 6fps loop, dash 14fps once 0, death 8fps once, jump 12fps once, combat 16fps once (reusa dash hasta tener attack sheets).
- **Registro:** `initAllCharacterAnimations(scene)` crea `""` + `"npc_"` + legacy `player_attack_*`/`npc_attack_*`, verifica 104 anims en `MainScene.verifyHumanAnimations:240`.

## Lógica — Player vs Survivor
- **Player:** Input activo. `MainScene.ts:304` llama `player.updateEntity()` cada frame. Lee `InputSystem.getMovementVector` + `isJump/Dash/AttackJustPressed`. Dash mantiene velocidad, jump permite air steering.
- **Survivor:** Pasivo. `MainScene.ts:164` `spawnNpcs` crea `new Survivor()` + `instanciarSprite` + `physics.add.collider(player,sprite)` y NPC<->NPC. Click en sprite dispara `CustomEvent phaser-npc-selected` con `paqueteUI` (flatten `name/nombre`, `profession/profesion`, traits, personalidad, etc.) consumido por `ui/character/NpcPanel`. `updateEntity` solo idle; movimiento futuro vía `ai/*`.

## Dependencias
- **Importa de:** `Phaser`, `game/systems/InputSystem`, `combat/CombatSystem`, `ui/input/KeyBindings` (indirecto), `items/Inventory`, `items/Equipment`
- **Provee a:** `game/scenes/MainScene` (instanciación), `ui/character/NpcPanel` (datos), `ai/*` futuro (API de movimiento)

## Flujo de Datos
```
new Survivor() // rand Stats/Needs/Traits/Skills/Personality/Loyalty/Gustos/Inventory/Equipment
  -> MainScene.spawnNpcs() -> SurvivorSprite (BaseHuman) -> arcade physics + interactive
  -> pointerdown -> window.phaser-npc-selected(detail: NpcPanelData) -> app/App -> NpcPanel
Player: InputSystem -> Player.updateEntity() -> BaseHuman.playWalk/Idle/Jump/Dash -> CombatSystem.executeAttack
Survivor futuro: ai/DecisionSystem -> Survivor.moverEnDireccion(dir) -> BaseHuman.moveInDirection
```

## Para Repomix
Módulo estable y extendible. Para agregar nuevo humano (ej. `Mercader`), extender `BaseHuman` con nuevo `animPrefix`. Para agregar nueva stat, tocar `Stats.ts` + `Survivor.ts` constructor + `NpcPanel.tsx`. No duplicar lógica de animación — usar `BaseHuman` helpers.
