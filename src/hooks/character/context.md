# src/hooks/character/context.md — Hooks de Personajes

> Hooks para el estado y acciones de paneles de personajes (NPCs, seguidores y Dead Dragons).

## Hooks

### `useNpcPanel.ts`
- Estado: `activeTab` (estado/atributos/profesiones/inventario)
- Cierra con Escape
- Datos derivados: `loyaltyPct`, `healthPct`, barras de necesidades
- No despacha eventos — solo consume `NpcPanelData` del prop

### `useFollowers.ts`
- Estado: `search` para filtrar seguidores
- `followersList`: filtra desde `useGameStore.survivors` donde `isFollower=true`
- `handleFocusFollower(id)`: dispatch `phaser-focus-npc {id}` → centra cámara en Phaser

### `useDeadDragonPanel.ts` ✅ (Implementado y completo)
Toda la lógica del `DeadDragonPanel`:

**Estado**: `dragon` (sincronizado con Phaser), `showHabilidadesMenu`

**Valores derivados** (calculados en el hook):
- `salud`, `maxSalud`, `energia`, `maxEnergia`, `saludPct`, `energiaPct`
- `disponibles`, `bloqueados`, `ocupados` (slots de inventario)
- `comportamiento`, `funcion`, `habilidadesActivas`, `habilidadesSeleccionadas`
- `hasHogar`, `hogarPos`, `items`

**Constantes del catálogo re-exportadas**:
- `COMPORTAMIENTOS`, `FUNCIONES`, `HABILIDAD_CATEGORIAS`, `HABILIDADES_DETALLE`, `HABILIDAD_LABELS`

**Handlers** (todos con `useCallback`):
- `handleComportamiento(c)` → dispatch `phaser-dead-dragon-set-comportamiento`
- `handleFuncion(f)` → dispatch `phaser-dead-dragon-set-funcion` (guarda sin hogar)
- `handleToggleHabilidadCat(cat)` → dispatch `phaser-dead-dragon-toggle-habilidad-cat`
- `handleToggleHabilidad(cat, hab)` → dispatch `phaser-dead-dragon-toggle-habilidad`
- `handleSetHogar()` → dispatch `phaser-dead-dragon-set-hogar` + actualización optimista
- `handleEquip(slot)` → dispatch `phaser-dead-dragon-equip/unequip` + actualización optimista de slots
- `handleDamage()` → dispatch `phaser-dead-dragon-damage {cantidad: 250}`
- `handleAddTestItem()` → dispatch `phaser-dead-dragon-add-item` + actualización local

**Efectos**:
- Escucha `phaser-dead-dragon-updated` y `phaser-dead-dragon-selected` para sync reactivo
- Cierra con Escape (`onClose()`)
- Cierra `showHabilidadesMenu` al clic fuera de `[data-dd-habilidades]`
