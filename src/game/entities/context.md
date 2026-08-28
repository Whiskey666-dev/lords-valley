# game/entities / Context — Entidades de Juego (Reservado)

## Propósito
Directorio **reservado vacío** para futuras entidades Phaser que no sean `characters/` (ej. `Drop`, `Projectile`, `ResourceNode`, `Decoration`). Previsto para objetos con `Phaser.Physics.Arcade.Sprite` + lógica de mundo pero sin IA humana.

## Estado Actual
> **Vacío.** No hay archivos. `characters/Player` y `characters/Survivor` viven en `characters/`, no aquí. `buildings/Building` previsto en `buildings/`.

## Rol Previsto
- `Drop.ts` — item en el suelo (sprite + `items/Item` + collider pickup).
- `Projectile.ts` — flecha/bala con `velocity` + `combat/Damage`.
- `ResourceNode.ts` — árbol/piedra con `hp` + `items/Resources` al talar.

## Dependencias Previstas
- `Phaser`, `items/*`, `combat/*`, `world/Chunks`

## Para Repomix
Al necesitar una entidad que no sea humana ni edificio, crear aquí. Si es humana, va en `characters/`; si es edificio, en `buildings/`.
