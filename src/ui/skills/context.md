# src/ui/skills/context.md — Panel de Habilidades

> Árbol de habilidades del jugador visualizado como un pentagrama SVG interactivo.

## `SkillsPanel.tsx`
- Hook: `useSkills` (`hooks/skills/useSkills`)
- Pentagrama SVG interactivo con 5 vértices = 5 categorías
- Click en vértice/nodo → selecciona habilidad → abre `SkillDetailPanel`
- Nodos desbloqueados en color primario, bloqueados en gris

## `SkillDetailPanel.tsx`
- Panel lateral con detalle de la habilidad seleccionada
- Muestra descripción completa, bonuses aplicados, costo XP total, prerequisitos
- Botón "Desbloquear" activo solo si el tier anterior está desbloqueado y hay XP suficiente

## 5 Categorías de Habilidades
| Categoría | Icono | Bonuses Ejemplo |
|---|---|---|
| Combate | ⚔️ | +daño, +velocidad ataque, +crítico |
| Exploración | 🗺️ | +velocidad movimiento, +rango visión |
| Artesanía | 🔨 | +calidad items, -tiempo craft, +recetas |
| Diplomacia | 🤝 | +lealtad NPCs, +precios comercio |
| Magia | 🔮 | +poder hechizos, -coste energía |
