# src/hooks/skills/context.md — Hook de Habilidades

> Estado de habilidades del jugador. La única fuente de verdad es el backend
> (`GET /player/me/skills`, `POST /player/me/skills/train`, JWT).

## `useSkills.ts`
- Carga del servidor (`loading`/`error`/`refresh` con reintento)
- `skillsByCat`: mezcla `SKILL_DEFS` (display) + estado remoto (level/xp/tier/unlocked)
- `trainSchool(cat)` / `trainSkill(cat, skillId)`: piden +10 XP al servidor (consume 1 pergamino allí) y actualizan caché de inventario con la respuesta
- Escucha `player-skills-changed`: recarga desde el servidor tras `FullMode` de la consola
- `selectedCategory`, `categoryProgress`, `globalProgress`
- 6 escuelas en pentagrama SVG: 5 vértices + núcleo de Artes Místicas
- Cierra con Escape

## `skillsData.ts`
- `SKILL_DEFS`: 6 escuelas × 8 habilidades (id, nombre, icono, descripción). Sin números.
- `SKILL_CATEGORIES`, `CATEGORY_ORDER`, `PENTAGRAM_ORDER`, `CENTER_CATEGORY`
- `getCategoryProgress`, `getGlobalProgress`

## `ui/skills/SkillsPanel.tsx`
- Pentagrama SVG interactivo; click en nodo → `SkillDetailPanel`
- Banner de carga y caja de error con Reintentar si el backend no responde

## `ui/skills/SkillDetailPanel.tsx`
- Detalle por escuela: `Entrenar (+10 XP)` y `+10 XP` por habilidad
- Ambos piden al servidor; el botón se deshabilita sin pergaminos o mientras hay petición en curso (`busy`)
