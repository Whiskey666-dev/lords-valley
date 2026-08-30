# characters / Context — Modelo Humano, Stats y Animaciones

## Propósito
**Módulo más implementado (11/12 archivos, 1 stub).** Modela todo humano (`Player` y `Survivor`) con física `BaseHuman` y sistema centralizado de animaciones 8→6 dirs. Procedural data + sprites.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `BaseHuman.ts:3` | 112 | `abstract class BaseHuman extends Phaser.Physics.Arcade.Sprite`. Física `body 20×20 offset 14,36 collideWorldBounds origin 0.5,0.5`, `lastDirection:Direction8`, `animPrefix/texturePrefix`, helpers `playWalk/Idle/Jump/Dash/Death/Attack` con guard `currentAnim.key!==key`. `getDirectionFromInput(xDir,YDir)→Direction8`, `moveInDirection/idle/jump/dash/attack/die`. |
| `Animations.ts:1` | 251 | **Crítico.** `Direction8` 8 lógicas, `PhysicalDir` 6 texturas, `LOGICAL_TO_PHYSICAL:69` (`right→right_down` etc), `ALL_DIRECTIONS_8`, `resolveTexture(primary,fallback)`, `createAnim(key,texture,frameRate,repeat)`, generators `createWalk(10fps loop)/Idle(6)/Dash(14 once)/Death(8 once)/Jump(12 once)/Combat(16 once dash placeholder)`, `registerHumanAnimations(scene,animPrefix,texturePrefix)` con `cleanAnim/cleanTex`, `initAllCharacterAnimations(scene)` registra `""` (player walk_/idle_...), `npc_` fallback `player_*`, legacy `player_attack_*`/`npc_attack_*`. |
| `Player.ts:8` | 128 | `class Player extends BaseHuman`. `isJumping/isDashing`, `constructor(scene,x,y)` `super(..., "player_idle_down","","player_")` + `InputSystem.capture`. `executeJump` tween `scale 1.12 y -10 180ms yoyo 550ms reset, `executeDash` 500px/s ×225ms vect dir, `updateEntity:70` speed 160, bloqueo `isGameInputBlocked→velocity 0 idle`, `isJump/Dash/AttackJustPressed`→execute, air steering `jumpSpeed 184` durante `isJumping`, dash bloquea. |
| `Survivor.ts:20` | 177 | `class Survivor` data **+ inner `SurvivorSprite:20 extends BaseHuman`**. Data `id surv_5, nombre 16, edad 18-50, profesion 10 (Leñador..Cocinero)`, `stats/needs/loyalty/traits/personality/skills/gustos/inventory/equipment`. `getPaqueteUI:71` flatten `name/profession loyalty health + compat nombre/profesion + positionX/Y` para `NpcPanel`. `instanciarSprite(scene,x,y)` → `new SurvivorSprite` immovable depth10 interactive dispatch `phaser-npc-selected` con paqueteUI, `desinstanciarSprite`, `updateEntity:120` idle si no jumping/dashing/attacking, `moverEnDireccion/saltar/dash/atacar` API para IA futura. Nota: **duplicado** con `game/entities/SurvivorSprite.ts` (ese es interpolado con `targetX/Y 0.15`, este inner es directo idle). |
| `Stats.ts:1` | 14 | `class Stats { maxSalud 80..120, salud, energia 70..100, recibirDano(cant) }` |
| `Needs.ts:1` | 15 | `class Needs { hambre/sed/sueño 0..100 init 0..20, simularNecesidades() hambre+=0.1 sed+=0.2 cap 100 }` |
| `Traits.ts:1` | 27 | `TRAITS_POOL 20` Valiente..Irascible, `lista:Trait[] 1..3` sin reemplazo, `has(), toString()` |
| `Skills.ts:1` | 25 | `SkillName 8` combate/construccion/agricultura/mineria/carpinteria/medicina/liderazgo/supervivencia, `niveles:Record<SkillName,number>1..10`, `especialidad` max, `resumen` |
| `Personality.ts:1` | 31 | `PERSONALITY_ARCHETYPES 8` Líder..Rebelde, `PERSONALITY_TRAITS 6` Extrovertido..Idealista, `arquetipo, temperamento, sociabilidad,valentia,empatia 0..100`, `resumen` |
| `Loyalty.ts:1` | 13 | `nivel 0..100`, `estadoPolitico` `≥90 Fanático|≥60 Leal|≥35 Inconforme|else Potencial Rebelde` |
| `Gustos.ts:1` | 24 | `GUSTOS_COMIDA 5, ACTIVIDAD 6, CLIMA 4`, `comidaFavorita,actividadFavorita,climaFavorito,desagrado!=actividad`, `resumen` 2 campos |
| `Relationships.ts` | 0 | **STUB** vacío — grafo social affinity entre Survivors |

## Lógica Animaciones
- **Mapeo 8→6:** `LOGICAL_TO_PHYSICAL` solo 6 PNGs físicas por acción (down/up/4 diagonales).
- **Keys:** `"<prefix>walk_<physical>"` etc; `prefix=""` player (`walk_down`), `"npc_"` (`npc_walk_down`), fallback `player_*`.
- **Generadores:** walk 10fps loop, idle 6, dash 14 once, death 8 once, jump 12 once, combat 16 once (reusa dash).
- **Registro:** `initAllCharacterAnimations(scene)` crea `""`+`npc_`+ legacy, verificado `MainScene.verifyHumanAnimations` 104+ anims.

## Dependencias
- **Importa:** `Phaser`, `game/systems/InputSystem`, `combat/CombatSystem`, `items/Inventory/Equipment`
- **Provee a:** `game/scenes/MainScene` (spawn), `game/entities/SurvivorSprite` (hereda BaseHuman), `ui/character/NpcPanel` (datos), `ai/*` futuro

## Para Repomix
Nuevo humano (ej. `Mercader`) → extender `BaseHuman` con nuevo `animPrefix` + `registerHumanAnimations(scene,"merch_","merch_")` + Preloader sheets `merch_walk_*`. No duplicar helpers `play*`.
