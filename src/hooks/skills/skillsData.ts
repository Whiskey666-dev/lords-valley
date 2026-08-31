export type SkillCategoryId =
  | "supervivencia"
  | "produccion"
  | "politica"
  | "milicia"
  | "ciencias"
  | "artes_misticas";

export interface SkillInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  level: number; // 0..100
  xp: number; // 0..100 hacia siguiente nivel porcentual
  maxXp: number;
  tier: 1 | 2 | 3;
  unlocked: boolean;
  bonus?: string;
}

export interface SkillCategoryInfo {
  id: SkillCategoryId;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  subtitle: string;
  glow: string;
}

export const SKILL_CATEGORIES: Record<SkillCategoryId, SkillCategoryInfo> = {
  supervivencia: {
    id: "supervivencia",
    label: "Supervivencia",
    icon: "🏕️",
    color: "#4caf50",
    bg: "#0e1f14",
    border: "#1e4a2e",
    description: "Dominio del entorno hostil: rastreo, caza, refugio y resistencia en el valle.",
    subtitle: "Instinto y resistencia",
    glow: "rgba(76,175,80,0.45)",
  },
  produccion: {
    id: "produccion",
    label: "Producción",
    icon: "⚒️",
    color: "#ff9800",
    bg: "#201a0c",
    border: "#5a3d16",
    description: "Transformación de materia prima en riqueza: forja, talla y cosecha.",
    subtitle: "Manos que crean valor",
    glow: "rgba(255,152,0,0.45)",
  },
  politica: {
    id: "politica",
    label: "Política",
    icon: "🏛️",
    color: "#ab47bc",
    bg: "#1a1024",
    border: "#3a1e52",
    description: "Gobierno, diplomacia y administración de hombres y leyes.",
    subtitle: "El arte de gobernar",
    glow: "rgba(171,71,188,0.45)",
  },
  milicia: {
    id: "milicia",
    label: "Milicia",
    icon: "⚔️",
    color: "#ef5350",
    bg: "#1e0f10",
    border: "#4a1e1e",
    description: "Guerra, táctica y disciplina: del duelo a la batalla campal.",
    subtitle: "Acero y disciplina",
    glow: "rgba(239,83,80,0.45)",
  },
  ciencias: {
    id: "ciencias",
    label: "Ciencias",
    icon: "🔬",
    color: "#26c6da",
    bg: "#0c1e24",
    border: "#14505a",
    description: "Saber empírico y teoría: medicina, ingeniería y astronomía.",
    subtitle: "Conocimiento aplicado",
    glow: "rgba(38,198,218,0.45)",
  },
  artes_misticas: {
    id: "artes_misticas",
    label: "Artes Místicas",
    icon: "✨",
    color: "#ffd54f",
    bg: "#1e1c0a",
    border: "#5a4a16",
    description: "Lo velado y lo arcano: rituales, encantamientos y pactos antiguos.",
    subtitle: "El velo entre mundos",
    glow: "rgba(255,213,79,0.55)",
  },
};

export const CATEGORY_ORDER: SkillCategoryId[] = [
  "supervivencia",
  "produccion",
  "politica",
  "milicia",
  "ciencias",
  "artes_misticas",
];

// Posición del pentagrama: 5 vértices + centro
export const PENTAGRAM_ORDER: SkillCategoryId[] = [
  "supervivencia", // top
  "produccion",   // top-right
  "politica",     // bottom-right
  "milicia",      // bottom-left
  "ciencias",     // top-left
];

export const CENTER_CATEGORY: SkillCategoryId = "artes_misticas";

function mkSkill(
  id: string,
  name: string,
  icon: string,
  description: string,
  level: number,
  xp = Math.floor(Math.random() * 60) + 10,
  tier: 1 | 2 | 3 = 1,
): SkillInfo {
  return {
    id,
    name,
    icon,
    description,
    level: Math.max(0, Math.min(100, level)),
    xp,
    maxXp: 100,
    tier,
    unlocked: level > 0 || tier === 1,
  };
}

export const INITIAL_SKILLS: Record<SkillCategoryId, SkillInfo[]> = {
  supervivencia: [
    mkSkill("sup_rastreo", "Rastreo", "🐾", "Leer huellas, seguir rastros y no perderte en el bosque.", 75, 42, 1),
    mkSkill("sup_caza", "Caza Menor", "🏹", "Abatir presas pequeñas con arco y trampas.", 82, 68, 1),
    mkSkill("sup_pesca", "Pesca", "🎣", "Asegurar proteína del río con lanza o caña.", 60, 25, 1),
    mkSkill("sup_herbolaria", "Herbolaria", "🌿", "Identificar hierbas medicinales y venenosas.", 70, 55, 2),
    mkSkill("sup_fogatas", "Fuego y Brasas", "🔥", "Encender, mantener y transportar fuego.", 65, 80, 1),
    mkSkill("sup_orientacion", "Orientación", "🧭", "Cartografía, brújula y puntos cardinales.", 58, 33, 1),
    mkSkill("sup_resistencia", "Resistencia", "💪", "Soportar frío, hambre y fatiga prolongada.", 72, 47, 2),
    mkSkill("sup_tramperia", "Trampería", "🪤", "Colocar lazos, cepos y fosos eficaces.", 62, 18, 2),
  ],
  produccion: [
    mkSkill("prod_agricultura", "Agricultura", "🌾", "Arar, sembrar y rotar cosechas.", 50, 70, 1),
    mkSkill("prod_carpinteria", "Carpintería", "🪚", "Convertir troncos en tablas, vigas y muebles.", 60, 40, 1),
    mkSkill("prod_herreria", "Herrería", "🔨", "Forjar herramientas y armas de hierro.", 30, 22, 2),
    mkSkill("prod_canteria", "Cantería", "⛏️", "Extraer y labrar piedra para construcción.", 40, 55, 1),
    mkSkill("prod_curtiduria", "Curtiduría", "🧥", "Curtir pieles y producir cuero.", 55, 60, 2),
    mkSkill("prod_alquimia", "Alquimia Práctica", "⚗️", "Destilar aceites y preparar compuestos.", 35, 15, 3),
    mkSkill("prod_textil", "Textil", "🧵", "Hilar, tejer y confeccionar ropa.", 42, 35, 2),
    mkSkill("prod_cocina", "Cocina", "🍲", "Conservar y cocinar alimentos para muchos.", 48, 88, 1),
  ],
  politica: [
    mkSkill("pol_liderazgo", "Liderazgo", "👑", "Inspirar lealtad y sostener autoridad.", 30, 45, 1),
    mkSkill("pol_diplomacia", "Diplomacia", "🤝", "Negociar pactos y evitar guerras.", 25, 30, 2),
    mkSkill("pol_administracion", "Administración", "📋", "Gestionar bodegas, turnos y tributos.", 20, 12, 1),
    mkSkill("pol_justicia", "Justicia", "⚖️", "Impartir ley y resolver disputas.", 15, 5, 2),
    mkSkill("pol_comercio", "Comercio", "💰", "Trueque, precios y rutas comerciales.", 28, 60, 1),
    mkSkill("pol_oratoria", "Oratoria", "📜", "Arengar multitudes y redactar decretos.", 18, 28, 2),
    mkSkill("pol_intriga", "Intriga", "🎭", "Detectar conspiraciones y mover hilos.", 22, 18, 3),
    mkSkill("pol_legitimidad", "Legitimidad", "🕊️", "Sostener el derecho divino a gobernar.", 16, 40, 3),
  ],
  milicia: [
    mkSkill("mil_combate", "Combate Cuerpo a Cuerpo", "🗡️", "Espada, hacha y escudo en duelo.", 88, 75, 1),
    mkSkill("mil_arqueria", "Arquería", "🎯", "Precisión con arco y ballesta.", 75, 50, 1),
    mkSkill("mil_defensa", "Defensa", "🛡️", "Resistir golpes, formar muro de escudos.", 82, 62, 1),
    mkSkill("mil_tactica", "Táctica", "📯", "Maniobrar unidades y aprovechar terreno.", 78, 44, 2),
    mkSkill("mil_caballeria", "Caballería", "🐎", "Carga montada y persecución.", 70, 20, 2),
    mkSkill("mil_asedio", "Asedio", "🏗️", "Arietes, torres y catapultas.", 85, 90, 3),
    mkSkill("mil_supervivencia_mil", "Supervivencia Militar", "⛺", "Marchas forzadas y campamentos.", 80, 35, 2),
    mkSkill("mil_logistica", "Logística Militar", "📦", "Raciones, forraje y munición al frente.", 82, 55, 2),
  ],
  ciencias: [
    mkSkill("cie_medicina", "Medicina", "🏥", "Curar heridas, contener epidemias.", 40, 60, 1),
    mkSkill("cie_ingenieria", "Ingeniería", "📐", "Diseñar estructuras y mecanismos.", 30, 25, 2),
    mkSkill("cie_astronomia", "Astronomía", "🔭", "Navegación estelar y calendarios.", 25, 10, 3),
    mkSkill("cie_alquimia_t", "Alquimia Teórica", "🧪", "Principios químicos y transmutación.", 45, 70, 2),
    mkSkill("cie_matematicas", "Matemáticas", "🔢", "Cálculo, contabilidad y balística.", 38, 42, 2),
    mkSkill("cie_historia", "Historia", "📚", "Crónicas, linajes y precedentes legales.", 32, 18, 1),
    mkSkill("cie_navegacion", "Navegación", "⛵", "Rutas marítimas y fluviales.", 28, 33, 2),
    mkSkill("cie_invencion", "Invención", "💡", "Prototipos y patentes.", 42, 55, 3),
  ],
  artes_misticas: [
    mkSkill("mis_ritualismo", "Ritualismo", "🕯️", "Círculos, ofrendas y horas propicias.", 15, 80, 2),
    mkSkill("mis_adivinacion", "Adivinación", "🔮", "Leer augurios y presagios.", 10, 45, 3),
    mkSkill("mis_encantamiento", "Encantamiento", "✨", "Bendecir armas y amuletos.", 18, 60, 2),
    mkSkill("mis_nigromancia", "Nigromancia", "💀", "Tratar con los muertos (prohibida).", 5, 12, 3),
    mkSkill("mis_elementalismo", "Elementalismo", "🌊", "Invocar fuego, agua, viento y tierra.", 12, 30, 3),
    mkSkill("mis_ilusionismo", "Ilusionismo", "🎭", "Velos y engaños sensoriales.", 8, 22, 2),
    mkSkill("mis_sanacion", "Sanación Mística", "🕊️", "Cerrar heridas con imposición.", 20, 50, 2),
    mkSkill("mis_pacto", "Pacto Antiguo", "📜", "Vincularse a entidad mayor.", 10, 15, 3),
  ],
};

export function getCategoryProgress(skills: SkillInfo[]): { avg: number; total: number; unlocked: number; maxed: number } {
  if (skills.length === 0) return { avg: 0, total: 0, unlocked: 0, maxed: 0 };
  const total = skills.reduce((a, s) => a + s.level, 0);
  const avg = Math.round(total / skills.length);
  const unlocked = skills.filter(s => s.unlocked).length;
  const maxed = skills.filter(s => s.level >= 100).length;
  return { avg, total, unlocked, maxed };
}

export function getGlobalProgress(all: Record<SkillCategoryId, SkillInfo[]>) {
  const allSkills = Object.values(all).flat();
  const total = allSkills.reduce((a, s) => a + s.level, 0);
  const max = allSkills.length * 100;
  const percent = max === 0 ? 0 : Math.round((total / max) * 100);
  return { total, max, percent, count: allSkills.length };
}

export function getSkillTierColor(tier: number) {
  if (tier === 3) return "#ffd54f";
  if (tier === 2) return "#42a5f5";
  return "#7a9ab8";
}
