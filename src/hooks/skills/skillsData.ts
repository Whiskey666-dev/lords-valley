export type SkillCategoryId =
  | "supervivencia"
  | "produccion"
  | "politica"
  | "milicia"
  | "ciencias"
  | "artes_misticas";

export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface SkillInfo extends SkillDef {
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

// Definiciones estáticas de display. Los números (level/xp/tier) viven en el
// backend: la única fuente de verdad es GET /player/me/skills (JWT).
export const SKILL_DEFS: Record<SkillCategoryId, SkillDef[]> = {
  supervivencia: [
    { id: "sup_rastreo", name: "Rastreo", icon: "🐾", description: "Leer huellas, seguir rastros y no perderte en el bosque." },
    { id: "sup_caza", name: "Caza Menor", icon: "🏹", description: "Abatir presas pequeñas con arco y trampas." },
    { id: "sup_pesca", name: "Pesca", icon: "🎣", description: "Asegurar proteína del río con lanza o caña." },
    { id: "sup_herbolaria", name: "Herbolaria", icon: "🌿", description: "Identificar hierbas medicinales y venenosas." },
    { id: "sup_fogatas", name: "Fuego y Brasas", icon: "🔥", description: "Encender, mantener y transportar fuego." },
    { id: "sup_orientacion", name: "Orientación", icon: "🧭", description: "Cartografía, brújula y puntos cardinales." },
    { id: "sup_resistencia", name: "Resistencia", icon: "💪", description: "Soportar frío, hambre y fatiga prolongada." },
    { id: "sup_tramperia", name: "Trampería", icon: "🪤", description: "Colocar lazos, cepos y fosos eficaces." },
  ],
  produccion: [
    { id: "prod_agricultura", name: "Agricultura", icon: "🌾", description: "Arar, sembrar y rotar cosechas." },
    { id: "prod_carpinteria", name: "Carpintería", icon: "🪚", description: "Convertir troncos en tablas, vigas y muebles." },
    { id: "prod_herreria", name: "Herrería", icon: "🔨", description: "Forjar herramientas y armas de hierro." },
    { id: "prod_canteria", name: "Cantería", icon: "⛏️", description: "Extraer y labrar piedra para construcción." },
    { id: "prod_curtiduria", name: "Curtiduría", icon: "🧥", description: "Curtir pieles y producir cuero." },
    { id: "prod_alquimia", name: "Alquimia Práctica", icon: "⚗️", description: "Destilar aceites y preparar compuestos." },
    { id: "prod_textil", name: "Textil", icon: "🧵", description: "Hilar, tejer y confeccionar ropa." },
    { id: "prod_cocina", name: "Cocina", icon: "🍲", description: "Conservar y cocinar alimentos para muchos." },
  ],
  politica: [
    { id: "pol_liderazgo", name: "Liderazgo", icon: "👑", description: "Inspirar lealtad y sostener autoridad." },
    { id: "pol_diplomacia", name: "Diplomacia", icon: "🤝", description: "Negociar pactos y evitar guerras." },
    { id: "pol_administracion", name: "Administración", icon: "📋", description: "Gestionar bodegas, turnos y tributos." },
    { id: "pol_justicia", name: "Justicia", icon: "⚖️", description: "Impartir ley y resolver disputas." },
    { id: "pol_comercio", name: "Comercio", icon: "💰", description: "Trueque, precios y rutas comerciales." },
    { id: "pol_oratoria", name: "Oratoria", icon: "📜", description: "Arengar multitudes y redactar decretos." },
    { id: "pol_intriga", name: "Intriga", icon: "🎭", description: "Detectar conspiraciones y mover hilos." },
    { id: "pol_legitimidad", name: "Legitimidad", icon: "🕊️", description: "Sostener el derecho divino a gobernar." },
  ],
  milicia: [
    { id: "mil_combate", name: "Combate Cuerpo a Cuerpo", icon: "🗡️", description: "Espada, hacha y escudo en duelo." },
    { id: "mil_arqueria", name: "Arquería", icon: "🎯", description: "Precisión con arco y ballesta." },
    { id: "mil_defensa", name: "Defensa", icon: "🛡️", description: "Resistir golpes, formar muro de escudos." },
    { id: "mil_tactica", name: "Táctica", icon: "📯", description: "Maniobrar unidades y aprovechar terreno." },
    { id: "mil_caballeria", name: "Caballería", icon: "🐎", description: "Carga montada y persecución." },
    { id: "mil_asedio", name: "Asedio", icon: "🏗️", description: "Arietes, torres y catapultas." },
    { id: "mil_supervivencia_mil", name: "Supervivencia Militar", icon: "⛺", description: "Marchas forzadas y campamentos." },
    { id: "mil_logistica", name: "Logística Militar", icon: "📦", description: "Raciones, forraje y munición al frente." },
  ],
  ciencias: [
    { id: "cie_medicina", name: "Medicina", icon: "🏥", description: "Curar heridas, contener epidemias." },
    { id: "cie_ingenieria", name: "Ingeniería", icon: "📐", description: "Diseñar estructuras y mecanismos." },
    { id: "cie_astronomia", name: "Astronomía", icon: "🔭", description: "Navegación estelar y calendarios." },
    { id: "cie_alquimia_t", name: "Alquimia Teórica", icon: "🧪", description: "Principios químicos y transmutación." },
    { id: "cie_matematicas", name: "Matemáticas", icon: "🔢", description: "Cálculo, contabilidad y balística." },
    { id: "cie_historia", name: "Historia", icon: "📚", description: "Crónicas, linajes y precedentes legales." },
    { id: "cie_navegacion", name: "Navegación", icon: "⛵", description: "Rutas marítimas y fluviales." },
    { id: "cie_invencion", name: "Invención", icon: "💡", description: "Prototipos y patentes." },
  ],
  artes_misticas: [
    { id: "mis_ritualismo", name: "Ritualismo", icon: "🕯️", description: "Círculos, ofrendas y horas propicias." },
    { id: "mis_adivinacion", name: "Adivinación", icon: "🔮", description: "Leer augurios y presagios." },
    { id: "mis_encantamiento", name: "Encantamiento", icon: "✨", description: "Bendecir armas y amuletos." },
    { id: "mis_nigromancia", name: "Nigromancia", icon: "💀", description: "Tratar con los muertos (prohibida)." },
    { id: "mis_elementalismo", name: "Elementalismo", icon: "🌊", description: "Invocar fuego, agua, viento y tierra." },
    { id: "mis_ilusionismo", name: "Ilusionismo", icon: "🎭", description: "Velos y engaños sensoriales." },
    { id: "mis_sanacion", name: "Sanación Mística", icon: "🕊️", description: "Cerrar heridas con imposición." },
    { id: "mis_pacto", name: "Pacto Antiguo", icon: "📜", description: "Vincularse a entidad mayor." },
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
