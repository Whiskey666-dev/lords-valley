# ui/menus / Context — Menús y Overlays Principales

## Propósito
Contiene los **menús persistentes** del overlay React: navegación, consola/chat y tutorial/rebinding.

## Archivos
| Archivo | Rol |
|---|---|
| `Navbar.tsx:16` | Barra 32px `#0f0f0f` con zoom (−/+), Seguidores/Edificios, Construcción (verde), Misiones/Inventario/Mapa/Config. `handle(action)` -> `phaser-action-*`. |
| `Console.tsx:14` | Consola dual `chat|console` (ENTER). `createnpc1..10` -> `phaser-create-npcs`, modo chat -> `phaser-chat-bubble`. Bloquea input via `setConsoleOpen`. History 8 líneas. |
| `TutorialPanel.tsx:15` | Panel `top:36 left:12 width:360` con lista de `BINDING_INFOS`, rebinding (`pending[editing]`), Save/Cancel/Reset. Sincroniza `setRebinding`. |

## Lógica Compartida
- Todos usan `ui/input/KeyBindings.ts` para `getBinding/displayKey/isRebindingActive`.
- `Navbar` emite eventos, `Console` emite y bloquea, `TutorialPanel` muta bindings.

## Para Repomix
Nuevos menús (ej. `PauseMenu`, `SettingsPanel`) van aquí siguiendo patrón: componente React controlado por `app/App` state o evento, sin imports Phaser directos, usando `KeyBindings` para input.
