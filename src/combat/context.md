# combat / Context — Sistema de Combate

## Propósito
Gestiona **ataques cuerpo a cuerpo y control de daño**. Actualmente solo orquesta animaciones de ataque con lock anti-spam; el cálculo de daño y armas está en stub.

## Archivos
| Archivo | Estado | Rol |
|---|---|---|
| `CombatSystem.ts:4` | Implementado (48 líneas) | Sistema estático de ataque. Ver abajo. |
| `Weapons.ts` | Stub vacío (0 líneas) | Definición de armas `Weapon { id, damage, range, speed, durability }` previsto. |
| `Damage.ts` | Stub vacío (0 líneas) | Cálculo `calculateDamage(attacker, weapon, defender)` con mods de armadura/skill. |

## Lógica Implementada — `CombatSystem.ts:4`
```ts
class CombatSystem {
  static attackingEntities: Set<GameObject> // lock
  static initCombatAnimations(scene, prefix) -> delega a characters/Animations.createCombatAnimations
  static executeAttack(entity: BaseHuman, direction: Direction8, prefix: string, durationMs=400): boolean
    // guard isAttacking -> false
    // setAdd, setVelocity(0,0), play(`${prefix}attack_${direction}`) warn si falta
    // setTimeout 400ms -> delete de set + play idle_${direction} (player vs npc ternario)
  static isAttacking(entity): boolean
}
```
- Usa sprites de **Dash como placeholder de ataque** (`CombatSystem.ts:26` comentario) hasta tener sheets `attack`.
- `durationMs=400` coincide con anim 16fps ~8 frames.
- Guard idéntico en `characters/Player.ts:96` y `characters/Survivor.ts:166` que llaman `CombatSystem.executeAttack(sprite, lastDirection, "player_"|"npc_")`.
- Dash/Jump bloquean ataque y viceversa (`isAttacking` check en `Player.executeDash/Jump`).

## Lógica Prevista (stubs)
- `Weapons.ts` → registro de armas (de `items/Weapons.ts` string pools actuales a objetos tipados con stats), link con `items/Equipment.weapon`.
- `Damage.ts` → `calculateDamage(attacker: Survivor|Player, weapon: Weapon, defender)` = `weapon.damage * skillMod(combate) * traitMod * armorReduction(defender.equipment)` -> `Stats.recibirDano(cantidad)` (`characters/Stats.ts:13` ya existe pero nunca es llamado desde CombatSystem — gap actual).

## Dependencias
- **Importa de:** `characters/Animations` (`createCombatAnimations`), `characters/BaseHuman` (tipado `Direction8`, `BaseHuman` entity)
- **Consumido por:** `characters/Player.ts`, `characters/Survivor.ts`, `characters/Animations.ts` (verificación en `MainScene.verifyHumanAnimations`)
- **Futuro:** `items/Weapons`, `items/Equipment`, `characters/Stats`, `characters/Skills`

## Flujo Actual
```
InputSystem.isAttackJustPressed() (F/Q) -> Player.updateEntity() -> CombatSystem.executeAttack(player, dir)
  -> play attack anim -> 400ms -> play idle
Survivor.atacar() -> CombatSystem.executeAttack(survivorSprite, dir) // futuro llamado por ai/DecisionSystem
// Damage NO aplicado aún - falta Weapons.ts + Damage.ts
```

## Para Repomix
Al implementar daño real: 1) tipar `items/Weapons.ts` 2) implementar `Damage.ts:calculateDamage` 3) en `CombatSystem.executeAttack` al frame de impacto (mitad de duración) hacer `target.stats.recibirDano(dmg)` y check `salud<=0 -> die()`. Mantener `attackingEntities` Set como lock.
