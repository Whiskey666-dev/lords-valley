# game/input / Context — Re-export Deprecated

## Propósito
Módulo de **compatibilidad**. No contiene lógica propia.

## Archivo
- `KeyBindings.ts:1` — `export * from "../../ui/input/KeyBindings"` — re-exporta el singleton canónico de `ui/input/KeyBindings.ts`.

## Lógica
Ninguna. Existe para que código legacy que importe desde `game/input/KeyBindings` siga funcionando. Todo el código nuevo debe importar desde `ui/input/KeyBindings.ts` o `game/systems/InputSystem.ts`.

## Estado
Deprecated. No agregar lógica aquí.

## Para Repomix
Ignorar este módulo al buscar lógica de input — la fuente de verdad es `ui/input/KeyBindings.ts` (definición) y `game/systems/InputSystem.ts` (adaptador Phaser).
