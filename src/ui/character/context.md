# ui/character / Context — Paneles de Personaje

## Propósito
UI de **inspección de humanos** — ficha detallada `Survivor`/`Player` + lista seguidores. Implementado completo con hooks y 4 tabs.

## Archivos Reales
| Archivo | Líneas | Rol |
|---|---|---|
| `NpcPanel.tsx:21` | 166 | `function NpcPanel({npc,onClose})` **4 tabs** `estado|atributos|profesiones|inventario` (ver abajo). Container `285px fixed right 0 top32 bottom 0 #151515 borderLeft 00ff88 z100 shadow -4px` header `🏰 displayName + ✕`, card `1c1c1c #6ab0ff` nombre edad gender, profesión `Lv` si core, loyalty/health bars (gold `ffd700` 100 else `4caf50`, health red `e53935`), grid necesidades `hambre/sed/fatiga/cordura` si `isCore`, tabs `flex 1 1 0 10px 700` border `4a90e2` active `1e2a3a`, contenido `1a1a1a #2a2a2a 140-42vh scroll`. Usa `hooks/character/useNpcPanel`. Abierto `app/App:104` `phaser-npc-selected` + Zustand `selectedId`, cerrado `phaser-npc-deselected/clearSelection` ESC. |
| `FollowersPanel.tsx:9` | 166 | `function FollowersPanel({onClose})` **left** `fixed left 0 top32 bottom 0 285px borderRight 00ff88 #151515 z100`. Hook `hooks/character/useFollowers` → `followersList,totalCount,searchTerm,setSearchTerm,selectAndFocusNpc`. Header `👥 Seguidores (n) + ✕`, buscador input `100%` si `total>4` `setConsoleOpen` focus + `stopPropagation`, lista `flex column gap8 overflowY` empty `🏕️ createNpc5`, card `1c1c1c border 2a2a2a radius8` `name profession pos health/loyalty bars Ver NPC→` (center `phaser-focus-npc`), hover border `00ff88`. |
| `components/NpcStatusTab.tsx:1` | 35 | Tab estado: `needs hunger/thirst/fatigue health/sanity` + `positionX/Y` + `lvyBalance` si core, fallback traits/gustos si mock. |
| `components/NpcAttributesTab.tsx:1` | 33 | Tab atributos: 6 ejes `strength,agility,endurance,intelligence,charisma,perception` barras si `isCore`, else placeholder. |
| `components/NpcProfessionsTab.tsx:1` | 37 | Tab profesiones: lista `professions[] {type,level,experience specializations}` level badge, sino `habilidad` string mock. |
| `components/NpcInventoryTab.tsx:1` | 38 | Tab inventario: `inventory [] {type,quantity string BigInt,weight}` `formatLvy` + `+N más ocultos` si `>4`, `maxHeight 140` scroll, sino `inventario` string mock `getResumen`. |

## Hooks
- `hooks/character/useNpcPanel:68` → `tab,setTab,isCore(displayName,displayProfession,displayLoyalty,displayHealth,maxHealth 100,hunger/thirst/fatigue,formattedLvy BigInt/1e18)`. `isCore = !!attributes||professions||needs` distingue core DTO vs mock `Survivor` local.
- `hooks/character/useFollowers:55` → `followersList` (filtra `searchTerm` sobre `name/profession` + sorts `window.__NPCS_POS__` o `useGameStore survivors`), `selectAndFocusNpc(npc)` `selectSurvivor(id)+phaser-focus-npc {id,x,y}`.

## Tipos
- `useNpcPanel:NpcPanelData:5` `id,name,profession,loyalty,health, edad|age, firstName/lastName/gender, attributes 6, professions[], needs {hunger,thirst,fatigue,health,sanity,safety}, inventory BigInt[], socialLinks, positionX/Y, traits/personalidad/temperamento/habilidad/gustos/inventario/equipamiento/habilidades/stats, isPlayer, username` (compat mock+core).

## Dependencias
- `hooks/character/useNpcPanel|useFollowers`, `app/store/useGameStore`, `ui/input/KeyBindings` (`setConsoleOpen`), `common/bigint`

## Para Repomix
Nuevo panel (ej. `PlayerPanel`) → reutilizar `TABS` pattern y `NpcPanelData`. No hardcodear `Survivor` strings — usar `getResumen()` o `useNpcPanel isCore` branching.
