# src/ui/skills/context.md — Panel de Habilidades

> Habilidades del jugador: pentagrama SVG + detalle. Estado y mutaciones en el
> backend (`/player/me/skills`, JWT); el frontend solo muestra y pide.

## `SkillsPanel.tsx`
- Hook: `useSkills` (`hooks/skills/useSkills`)
- Pentagrama SVG interactivo: 5 vértices + núcleo de Artes Místicas
- Click en vértice/nodo → abre `SkillDetailPanel`
- Anillo de progreso = promedio de la escuela (dato del servidor)

## `SkillDetailPanel.tsx`
- Detalle de la escuela: lista de 8 habilidades con nivel/XP del servidor
- `⚡ Entrenar (+10 XP)`: entrena la escuela; el servidor exige 1 pergamino y lo consume
- `+10 XP 📜` por habilidad: igual, individual
- Muestra `📜 xN` pergaminos (caché de inventario) y el comando para conseguirlos
- Botones deshabilitados sin pergaminos o con petición en curso

## 6 Escuelas
| Escuela | Icono |
|---|---|
| Supervivencia | 🏕️ |
| Producción | ⚒️ |
| Política | 🏛️ |
| Milicia | ⚔️ |
| Ciencias | 🔬 |
| Artes Místicas | ✨ |
