# src/ui/character/context.md — Paneles de Personaje

> Paneles React para inspección y control de personajes (NPCs, Dead Dragons, Seguidores).

## Archivos

### `NpcPanel.tsx` — Panel de NPC / Personaje
- Hook: `useNpcPanel` (`hooks/character/useNpcPanel`)
- Panel fijo derecho `285px`, `borderLeft: 2px solid #00ff88`
- **4 tabs**: Estado, Atributos, Profesiones, Inventario
- **Tab Estado** (`NpcStatusTab`): necesidades `hambre/sed/fatiga/cordura`, barra de salud
- **Tab Atributos** (`NpcAttributesTab`): 6 atributos (Fuerza, Agilidad, Inteligencia, Carisma, Resistencia, Suerte)
- **Tab Profesiones** (`NpcProfessionsTab`): 21 profesiones disponibles + XP
- **Tab Inventario** (`NpcInventoryTab`): hasta 256 items con BigInt

### `FollowersPanel.tsx` — Panel de Seguidores
- Hook: `useFollowers` (`hooks/character/useFollowers`)
- Panel fijo izquierdo `285px`, `borderRight: 2px solid #00ff88`
- Lista de seguidores con nombre, profesión, posición, barras de salud/lealtad
- Botón "Ver NPC" → centra cámara en Phaser vía `phaser-focus-npc`

### `DeadDragonPanel.tsx` — Panel del Dead Dragon
- Hook: `useDeadDragonPanel` (`hooks/character/useDeadDragonPanel`)
- Panel fijo derecho `320px`
  - **Aliado**: `borderLeft: 2px solid #a855f7` (morado)
  - **Enemigo**: `borderLeft: 2px solid #ef4444` (rojo)
- **Datos vitales**: barras de salud y energía con colores adaptativos
- **Equipamiento** (solo aliados): Montura + Mochila; Mochila desbloquea 15 slots extra
- **3 Sistemas de Órdenes**:
  - 🔥 Cat 1 Comportamiento (excluyente): Agresivo / Defensivo / Pacífico
  - 🟢 Cat 2 Funciones (excluyente): Espera aquí / Sígueme / Ve a casa
  - ✨ Cat 3 Habilidades (múltiple): Ataques Físicos / Magia / Soporte / Maldiciones
- **Hogar**: designar punto de retorno para "Ve a casa"
- **Inventario**: grid 5 columnas, slots bloqueados con 🔒

## Tipos

### `DeadDragonPanelData` (exportado desde `DeadDragonPanel.tsx`)
Interfaz principal que describe el estado de un Dead Dragon.  
Importado por `useDeadDragonPanel`, `useAppController`, y `InteractionSystem` de Phaser.

```typescript
interface DeadDragonPanelData {
  id, name, nombre?, isAlly, health, maxHealth, salud?, maxSalud?,
  energia, maxEnergia, comportamiento?, funcion?,
  habilidadesActivas?, habilidadesSeleccionadas?,
  hogar?, hasHogar?, hogarPos?,
  inventoryItems?, inventorySlots?, equipment?,
  positionX?, positionY?, x?, y?, profession?
}
```

## Apertura / Cierre
```
[Phaser InteractionSystem] → dispatch "phaser-dead-dragon-selected" {DeadDragonPanelData}
  → useAppController → setSelectedDeadDragon(data)
  → <DeadDragonPanel dragon={selectedDeadDragon} onClose={...} />

[Cierre] → Escape | botón ✕ | dispatch "phaser-dead-dragon-deselected"
  → useAppController → setSelectedDeadDragon(null)
```
