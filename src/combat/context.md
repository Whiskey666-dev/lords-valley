# combat / Context — Sistema de Combate

## Propósito
Ataques cuerpo a cuerpo y control de daño. Solo orquesta animaciones con lock anti-spam; daño/armas aún stubs.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `CombatSystem.ts:4` | 47 | **Implementado.** Ver § Lógica. |
| `Weapons.ts` | 0 | STUB vacío — `Weapon {id,damage,range,speed,durability}` previsto |
| `Damage.ts` | 0 | STUB vacío — `calculateDamage(attacker,weapon,defender)` previsto |

## Lógica — `CombatSystem.ts:4` (47 líneas)
```ts
class CombatSystem {
  static attackingEntities:Set<GameObject> // lock
  static initCombatAnimations(scene,prefix) → delega createCombatAnimations
  static executeAttack(entity:BaseHuman, direction:string, prefix="player_", durationMs=400):boolean
    // guard isAttacking→false
    // add Set, setVelocity 0, play `${prefix}attack_${direction}` warn si falta
    // setTimeout 400 → delete Set + play idle_${direction} (player vs npc ternario `${prefix}idle_${direction}`)
  static isAttacking(entity):boolean
}
```
- Reusa **Dash como placeholder attack** (`26` comentario) hasta sheets `attack` dedicados.
- `durationMs 400` ≈ 16fps×8 frames.
- Llamado por `Player.updateEntity:93 CombatSystem.executeAttack(this,lastDirection,"player_")` (F/Q) y `Survivor.atacar:174 npc_`.
- Dash/Jump bloquean attack y viceversa (`Player.executeDash/Jump:19,43` `isAttacking` check, `Survivor` similar).

## Stubs previstos
- `Weapons.ts` → de `items/Weapons.ts` strings a objetos tipados `Weapon {damage,range,durability}` link `items/Equipment.weapon`
- `Damage.ts` → `calculateDamage(attacker:Survivor|Player, weapon:Weapon, defender) = weapon.damage * skillMod(combate) * traitMod * armorReduction(equipment)` → `Stats.recibirDano(cant)` (`characters/Stats:13` existe pero nunca llamado desde CombatSystem — gap)

## Dependencias
- **Importa:** `characters/Animations` (`createCombatAnimations`), `Phaser`
- **Consumido por:** `characters/Player`, `characters/Survivor`, `MainScene.verifyHumanAnimations` (chequea `attack_*`)
- **Futuro:** `items/Weapons`, `items/Equipment`, `characters/Stats/Skills`

## Flujo Actual
```
InputSystem.isAttackJustPressed(F/Q) → Player.updateEntity → CombatSystem.executeAttack → play attack 400ms → idle
Survivor.atacar() → CombatSystem.executeAttack(npc_) // futuro ai/DecisionSystem
// Damage NO aplicado — falta Weapons+Damage
```

## Para Repomix
Implementar daño: 1) tipar `items/Weapons.ts` 2) `Damage.ts:calculateDamage` 3) en `CombatSystem.executeAttack` al frame impacto (mitad) `target.stats.recibirDano(dmg)` check `salud<=0→die()`. Mantener `attackingEntities` Set lock.
