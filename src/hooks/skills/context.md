# src/hooks/skills/context.md — Hook de Habilidades

> Lógica para el panel de árbol de habilidades del jugador.

## `useSkills.ts`
- Estado: `selectedSkill` (habilidad seleccionada para ver detalle), `xpAllocated` por categoría
- 5 categorías en pentagrama SVG: Combate, Exploración, Artesanía, Diplomacia, Magia
- Cada categoría: 5 niveles con costo XP creciente
- Cierra con Escape

## `skillsData.ts`
- Estructura de 5 árboles de habilidades
- Cada nodo: `id`, `name`, `description`, `icon`, `tier`, `xpCost`, `bonuses[]`
- Unlocking: tier 1 libre, tiers 2-5 requieren tier anterior desbloqueado

## `ui/skills/SkillsPanel.tsx`
- Visualización como pentagrama SVG interactivo
- Los 5 vértices son las 5 categorías
- Habilidades se distribuyen radialmente desde el centro

## `ui/skills/SkillDetailPanel.tsx`
- Panel lateral con detalle de la habilidad seleccionada
- Muestra: descripción completa, bonuses, costo XP, botón de desbloquear
