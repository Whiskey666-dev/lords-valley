# combat / Context — Sistema de Combate

## Propósito
Ataques cuerpo a cuerpo y daño **validado por el servidor**. El cliente reporta
intentos (`ghost:damage`, `player:attacked`, `combat:hit` en `/combat`) y solo
aplica HP al recibir la confirmación (`ghost:damage_result`, `player:damage_result`,
`combat:hit_result` + broadcast `combat:died`). El servidor decreta daño, HP y muerte
con stats canónicas (`COMBAT_STATS`: survivor 10/200/50, dead-dragon 500/1500/900,
ghost 50/600/100, player 200 HP; el player reporta monto acotado a 200).

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `CombatSystem.ts:4` | 47 | **Implementado.** Ver § Lógica. |

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
- Llamado por `Player.updateEntity` (F/Q) y `Survivor.atacar()` (`npc_`).
- Dash/Jump bloquean attack y viceversa.

## Pendiente
- Tipar armas (hoy strings en `items/Equipment`) para variar el daño del player
  (hoy fijo 50 reportado, acotado a 200 en servidor)

## Flujo Actual
```
InputSystem.isAttackJustPressed(F/Q) → Player.updateEntity → CombatSystem.executeAttack (anim 400ms)
  → MainScene flanco de subida → reportGhostDamage (fantasma) o reportCombatHit (dragón enemigo, 50)
  → servidor valida → ghost:damage_result / combat:hit_result → applyServerDamage + morir si HP 0
Ghost.updateEntity → tryAttack → player:attacked (jugador) o combat:hit (superviviente)
  → servidor valida (creativo/godmode, distancia, cooldown) → damage_result / hit_result
Survivor.updateEntity → tryDefend (enemigo ≤70px, cooldown 1500ms) → atacar() + combat:hit (10)
DeadDragon.updateEntity(ctx) → combatAI: enemigos persiguen todo; aliados solo Agresivo/Defensivo → combat:hit (500)
Muerte → morir() (anim muerte humano / fundido dragón/fantasma) → evento phaser-*-died → filtrado + cierre panel + save
Player muere → morir() (death_*) → respawn 1.6s en firstSpawnPos (punto inicial) + player:respawn (HP 200)
```

## Dependencias
- **Importa:** `characters/Animations` (`createCombatAnimations`), `Phaser`
- **Consumido por:** `characters/Player`, `characters/Survivor`, `MainScene` (flanco de ataque + `applyCombatHitResult`)
- **Servidor:** `CombatService` (`COMBAT_STATS`, registro HP, `combat:hit`/`player:attacked`/`player:respawn`)

## Para Repomix
Nuevo atacante → reportar `reportCombatHit`/`reportGhostDamage`/`reportPlayerAttacked` y aplicar
solo en `combat:hit_result`/`ghost:damage_result`/`player:damage_result`/`combat:died`.
Nunca calcular HP en el cliente. Mantener `attackingEntities` Set lock.
