# game/input / Context — Re-export Deprecated

## Propósito
Módulo de **compatibilidad**. No contiene lógica propia. Existe para que código legacy que importe desde `game/input/KeyBindings` siga funcionando.

## Archivo Real
| Archivo | Líneas | Rol |
|---|---|---|
| `KeyBindings.ts:1` | 5 | `export * from "../../ui/input/KeyBindings"` — re-export canónico. Comentario `@deprecated Importar desde src/ui/input/KeyBindings.ts`. |

## Estado
Deprecated. 0 lógica. Todo código nuevo debe importar desde `ui/input/KeyBindings.ts` (definición, 251 líneas, 16 acciones) o `game/systems/InputSystem.ts` (adaptador Phaser).

## Dependencias
- Re-exporta `ui/input/KeyBindings` (singleton `current`, `BINDING_INFOS`, `pressed/justPressed`, `isGameInputBlocked`, `captureAllBindings`).
- No consumo directo salvo legacy.

## Para Repomix
Ignorar este módulo al buscar lógica — fuente de verdad es `ui/input/KeyBindings.ts` y `game/systems/InputSystem.ts`.
