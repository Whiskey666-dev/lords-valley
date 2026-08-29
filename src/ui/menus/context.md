# ui/menus / Context — Menús y Overlays Principales

## Propósito
Contiene los **menús persistentes** del overlay React: navegación, consola/chat, tutorial/rebinding y el panel de configuración categorizado.

## Archivos
| Archivo | Rol |
|---|---|
| `Navbar.tsx:17` | Barra 32px `#0f0f0f` con zoom (−/+), Seguidores/Edificios, Construcción (verde), Misiones/Inventario/Mapa/Configuración. `handle(action)` -> `phaser-action-*`; **Configuración** -> `onOpenSettings()`. |
| `Console.tsx:12` | Consola dual `chat\|console` (ENTER). `createnpc1..10` -> `phaser-create-npcs`, modo chat -> `phaser-chat-bubble`. Bloquea input via `setConsoleOpen`. Cerrada -> `return null` (sin hint flotante). |
| `TutorialPanel.tsx:16` | Panel `top:36 left:12 width:360` con hint `Click izquierdo` + editor de teclas reutilizable `KeybindsEditor`. Se abre con TAB. |
| `KeybindsEditor.tsx:15` | **Editor de teclas reutilizable** (extraído de TutorialPanel). Lista `BINDING_INFOS`, rebinding (`pending[editing]`), Guardar/Cancelar/Reset, sincroniza `setRebinding`. Usado por `TutorialPanel` y la categoría **Teclado** de `SettingsPanel`. |
| `SettingsPanel.tsx:23` | **Panel de configuración categorizado** (centrado `width:640`). Sidebar con 6 categorías: **Gráficos** (FPS/Renderizado/Sombras/Líquidos/Partículas), **Teclado** (`KeybindsEditor`), **Guardado** (1 partida por defecto + Nueva Partida), **Cuenta** (Google / Lords Valley Account), **Inicio** (inactivo), **Cerrar** (inactivo). Cierra con ESC/✕. |

## Lógica Compartida
- Todos usan `ui/input/KeyBindings.ts` para `getBinding/displayKey/isRebindingActive`.
- `Navbar` emite eventos y abre configuración, `Console` emite y bloquea, `TutorialPanel`/`KeybindsEditor` mutan bindings, `SettingsPanel` agrupa.

## Para Repomix
Nuevos menús (ej. `PauseMenu`) van aquí siguiendo patrón: componente React controlado por `app/App` state o evento, sin imports Phaser directos, usando `KeyBindings` para input. Para una nueva categoría de configuración: añadir entrada en `CATEGORIES` de `SettingsPanel`.