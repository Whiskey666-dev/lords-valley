export type MissionCategoryId =
  | "supervivencia"
  | "asentamiento"
  | "senorio"
  | "ducado"
  | "conquista"
  | "imperio";

export type MissionStatus = "locked" | "available" | "active" | "completed";

export interface MissionObjective {
  id: string;
  text: string;
  done?: boolean;
}

export interface MissionReward {
  icon: string;
  name: string;
  amount?: string;
}

export interface MissionData {
  id: string; // e.g., sup_01
  categoryId: MissionCategoryId;
  index: number; // 1..20
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  objectives: MissionObjective[];
  rewards: MissionReward[];
  status: MissionStatus;
  difficulty: 1 | 2 | 3 | 4 | 5;
  xp: number;
}

export interface MissionCategoryInfo {
  id: MissionCategoryId;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  chapter: number;
  description: string;
  subtitle: string;
}

export const MISSION_CATEGORIES: Record<MissionCategoryId, MissionCategoryInfo> = {
  supervivencia: {
    id: "supervivencia",
    label: "Supervivencia",
    shortLabel: "Cap I",
    icon: "🏕️",
    color: "#4caf50",
    bg: "#0e1f14",
    border: "#1e4a2a",
    chapter: 1,
    description: "Misiones progresivas que enseñan al jugador a sobrevivir y a prepararse para luego construir un asentamiento.",
    subtitle: "Del bosque hostil al primer techo",
  },
  asentamiento: {
    id: "asentamiento",
    label: "Asentamiento",
    shortLabel: "Cap II",
    icon: "🏘️",
    color: "#42a5f5",
    bg: "#0c1a28",
    border: "#1a3a56",
    chapter: 2,
    description: "Misiones progresivas que enseñan al jugador a gestionar un pequeño grupo de seguidores, edificaciones, economía básica y autosuficiencia del grupo.",
    subtitle: "De refugiados a comunidad",
  },
  senorio: {
    id: "senorio",
    label: "Señorío",
    shortLabel: "Cap III",
    icon: "🏰",
    color: "#ab47bc",
    bg: "#1a1024",
    border: "#3a1e52",
    chapter: 3,
    description: "Misiones que enseñan al jugador a gestionar varios asentamientos simultáneos y centralizarlos, delegando responsabilidades administrativas básicas a sus seguidores.",
    subtitle: "Un señor, muchas aldeas",
  },
  ducado: {
    id: "ducado",
    label: "Ducado",
    shortLabel: "Cap IV",
    icon: "👑",
    color: "#ffa726",
    bg: "#201a0c",
    border: "#5a3d16",
    chapter: 4,
    description: "Misiones que enseñan al jugador a gestionar grandes extensiones de tierras conformadas por múltiples señoríos, delegando responsabilidades con mayor seriedad y diversidad de funciones a sus seguidores, construyendo una jerarquía más compleja hasta construir un reino.",
    subtitle: "De señor a duque, de duque a rey",
  },
  conquista: {
    id: "conquista",
    label: "Conquista",
    shortLabel: "Cap V",
    icon: "⚔️",
    color: "#ef5350",
    bg: "#1e0f10",
    border: "#4a1e1e",
    chapter: 5,
    description: "Misiones que enseñan al jugador a gestionar ejércitos que le permitan sostener conflictos con otros reinos y conquistarlos.",
    subtitle: "La guerra como instrumento de Estado",
  },
  imperio: {
    id: "imperio",
    label: "Imperio",
    shortLabel: "Cap VI",
    icon: "🌍",
    color: "#ffd54f",
    bg: "#1e1c0a",
    border: "#4a4216",
    chapter: 6,
    description: "Último capítulo de misiones, el cual le enseña al jugador cómo sostener un vasto imperio continental conformado por diversas culturas y dificultades sociales.",
    subtitle: "Sostener lo inconquistable",
  },
};

export const CATEGORY_ORDER: MissionCategoryId[] = [
  "supervivencia",
  "asentamiento",
  "senorio",
  "ducado",
  "conquista",
  "imperio",
];

// Helper to create objectives quickly
const obj = (id: string, text: string): MissionObjective => ({ id, text });

function mk(
  cat: MissionCategoryId,
  idx: number,
  title: string,
  icon: string,
  desc: string,
  longDesc: string,
  objectives: string[],
  rewards: MissionReward[],
  difficulty: 1 | 2 | 3 | 4 | 5 = 1,
): MissionData {
  return {
    id: `${cat}_${String(idx).padStart(2, "0")}`,
    categoryId: cat,
    index: idx,
    title,
    description: desc,
    longDescription: longDesc,
    icon,
    objectives: objectives.map((t, i) => obj(`${cat}_${idx}_o${i + 1}`, t)),
    rewards: rewards,
    status: "locked",
    difficulty,
    xp: 50 + idx * 10 + difficulty * 20,
  };
}

export const INITIAL_MISSIONS: MissionData[] = [
  // ════════════════════════════════════════════════════════════
  // CAP I — SUPERVIVENCIA (20)
  // ════════════════════════════════════════════════════════════
  mk("supervivencia", 1, "Primer Amanecer", "🌅", "Aprende a moverte y orientarte en el valle.", "Has despertado solo en el corazón del valle de Aldoria. Sin techo, sin fuego, sin nadie. Tu primera lección es la más básica: moverte, observar y entender que cada paso cuenta. Usa WASD para explorar los alrededores inmediatos.", ["Muévete 200 metros en cualquier dirección", "Abre el minimapa y localiza tu posición", "Observa el ciclo día/noche durante 1 minuto"], [{ icon: "🥾", name: "Botas Gastadas" }, { icon: "✨", name: "50 XP" }], 1),
  mk("supervivencia", 2, "Sed y Hambre", "🍖", "Comprende tus necesidades vitales antes de que te maten.", "Tu estómago ruge y tu garganta arde. Aprende a leer tus indicadores de hambre, sed, fatiga y cordura. Un superviviente que no se conoce a sí mismo está muerto.", ["Alcanza 60% de hambre o sed para ver el aviso", "Abre el panel de estado y revisa tus 4 necesidades", "Consume cualquier alimento silvestre"], [{ icon: "🍒", name: "Bayas Silvestres x5" }, { icon: "💧", name: "Agua Turbia x2" }], 1),
  mk("supervivencia", 3, "Manos Vacías", "🪨", "Recolecta tus primeros recursos con las manos.", "Antes de herramientas hubo manos. Recoge ramas caídas, piedras sueltas y fibras. Cada recurso es un futuro muro, un fuego, una arma.", ["Recolecta 15× Madera de Ramas", "Recolecta 10× Piedra Suelta", "Recolecta 8× Fibra Vegetal"], [{ icon: "🪵", name: "Troncos x10" }, { icon: "🧵", name: "Fibras x8" }], 1),
  mk("supervivencia", 4, "Fuego Primitivo", "🔥", "Enciende tu primera hoguera y no dejes que se apague.", "El fuego es vida, calor, luz y protección contra bestias. Aprende a encenderlo con pedernal y a alimentarlo. Sin fuego no hay asentamiento.", ["Fabrica un Kit de Pedernal", "Enciende una hoguera en tu refugio", "Mantén el fuego encendido 5 minutos"], [{ icon: "🔥", name: "Hoguera Permanente" }, { icon: "🪓", name: "Hacha de Piedra" }], 1),
  mk("supervivencia", 5, "Refugio Improvisado", "⛺", "Construye un techo que te salve de la lluvia.", "La intemperie mata más que las espadas. Levanta una choza de ramas y pieles. No será un palacio, pero te mantendrá vivo.", ["Construye Cabaña Improvisada (Tech Tier 0)", "Coloca una cama de paja en el interior", "Duerme una noche completa bajo techo"], [{ icon: "🛖", name: "Choza Desbloqueada" }, { icon: "🛏️", name: "Cama de Paja" }], 1),
  mk("supervivencia", 6, "Agua que Salva", "💧", "Encuentra agua limpia o aprende a purificarla.", "El río parece limpio pero puede matarte. Localiza una fuente, hierve agua en la hoguera y almacénala. La deshidratación es rápida.", ["Localiza un Río o Manantial en el mapa", "Hierve 5× Agua Turbia → Agua Potable", "Almacena 10 litros en odres"], [{ icon: "🚰", name: "Odre de Agua" }, { icon: "💧", name: "Agua Potable x10" }], 1),
  mk("supervivencia", 7, "Caza Menor", "🏹", "Caza tu primera presa y no desperdicies nada.", "Un conejo puede ser la diferencia entre vivir y morir. Sigue rastros, usa sigilo, fabrica un arco rudimentario y despieza con respeto.", ["Fabrica Arco Rudimentario", "Caza 2× Conejos o 1× Ciervo pequeño", "Despieza y obtén Carne + Piel"], [{ icon: "🏹", name: "Arco Corto" }, { icon: "🥩", name: "Carne Cruda x5" }], 2),
  mk("supervivencia", 8, "Cuchillo de Sílex", "🔪", "Fabrica tu primera herramienta duradera.", "Un buen filo vale más que diez manos. Talla sílex, ata el mango con tendón y crea un cuchillo que te acompañará semanas.", ["Reúne 3× Sílex + 2× Tendón", "Fabrica Cuchillo de Sílex en la hoguera", "Usa el cuchillo para desollar 3 pieles"], [{ icon: "🔪", name: "Cuchillo de Sílex" }, { icon: "🐺", name: "Pieles x3" }], 2),
  mk("supervivencia", 9, "Noche a la Intemperie", "🌙", "Sobrevive a tu primera noche completa sin ayuda.", "La noche trae frío, bestias y susurros. Gestiona fatiga, mantén el fuego, no duermas sin guardia. Si amaneces, eres superviviente.", ["Resiste de 22:00 a 05:00 sin morir", "Mantén cordura por encima de 40%", "No dejes que la hoguera se extinga de noche"], [{ icon: "🌙", name: "Resistencia Nocturna" }, { icon: "✨", name: "120 XP" }], 2),
  mk("supervivencia", 10, "Heridas del Bosque", "🩹", "Aprende a curarte cuando nadie más lo hará.", "Una astilla infectada mata. Recolecta hierbas medicinales, fabrica vendas y trata hemorragias. Tu salud es tu único capital.", ["Recolecta 6× Hierbas Medicinales", "Fabrica 4× Vendas de Fibra", "Cura una herida por debajo de 50% de salud"], [{ icon: "🌿", name: "Kit de Herbolario" }, { icon: "🧴", name: "Ungüento x3" }], 2),
  mk("supervivencia", 11, "Rastros en la Niebla", "🐾", "Domina el sigilo y la lectura del terreno.", "El valle está vivo y te observa. Aprende a leer huellas, a moverte agachado y a acercarte sin ser detectado.", ["Sigue un rastro animal durante 100m", "Acércate a 15m sin ser detectado", "Marca el territorio en el mapa"], [{ icon: "👣", name: "Percepción +1" }, { icon: "🗺️", name: "Mapa de Rastreo" }], 2),
  mk("supervivencia", 12, "Pesca de Supervivencia", "🎣", "El río también es despensa.", "Falla la caza, pero el río rara vez falla. Construye una lanza de pesca o una caña primitiva y asegura proteína constante.", ["Fabrica Lanza de Pesca", "Pesca 5× Pescado Fresco", "Cocina 3× Pescado a la Brasa"], [{ icon: "🐟", name: "Pescado Fresco x5" }, { icon: "🔱", name: "Lanza de Pesca" }], 2),
  mk("supervivencia", 13, "Conserva tu Cosecha", "🥓", "Evita que tu esfuerzo se pudra en días.", "La abundancia de hoy es hambre mañana si no conservas. Seca carne al sol, ahúma pescado y entiende la putrefacción.", ["Construye Secadero / Ahumadero", "Produce 8× Carne Seca o Pescado Ahumado", "Almacena comida para 3 días"], [{ icon: "🏚️", name: "Secadero" }, { icon: "🥩", name: "Reserva 3 días" }], 2),
  mk("supervivencia", 14, "Tormenta Inminente", "⛈️", "Refuerza tu refugio antes de que el cielo caiga.", "El clima en Aldoria no perdona. Una tormenta puede arrasar una choza mal hecha. Refuerza techo, cava drenaje, almacena leña seca.", ["Refuerza Choza a Nivel 1 (Madera + Paja)", "Almacena 30× Leña Seca", "Sobrevive a una tormenta sin perder el fuego"], [{ icon: "🪚", name: "Refuerzo Estructural" }, { icon: "🔥", name: "Leña Seca x30" }], 3),
  mk("supervivencia", 15, "Orientación", "🧭", "No te pierdas o morirás solo.", "El valle tiene 6144×6144 metros de bosques, ríos y montañas. Aprende a usar el minimapa, la brújula, los puntos cardinales y a marcar tu campamento.", ["Marca tu campamento en el World Map", "Viaja 800m y regresa sin perderte", "Desbloquea 3 puntos de interés en el mapa"], [{ icon: "🧭", name: "Brújula Rústica" }, { icon: "🗺️", name: "Cartografía Básica" }], 3),
  mk("supervivencia", 16, "Fuego que Perdura", "♨️", "Domina el fuego más allá de la chispa.", "Ya no enciendes fuego, lo posees. Crea carbón vegetal, mantén brasas nocturnas y aprende a transportar fuego en un recipiente.", ["Construye Carbonera Primitiva", "Produce 20× Carbón Vegetal", "Transporta brasas 300m sin apagarlas"], [{ icon: "⬛", name: "Carbón Vegetal x20" }, { icon: "🏺", name: "Recipiente de Brasas" }], 3),
  mk("supervivencia", 17, "Trampas Rudimentarias", "🪤", "Deja que el bosque cace por ti.", "Una trampa bien puesta trabaja mientras duermes. Construye lazos, fosos y cepos. Revisa, repara y no olvides dónde las pusiste.", ["Fabrica 3× Trampas de Lazo", "Coloca trampas en senderos animales", "Captura 2 presas con trampas"], [{ icon: "🪤", name: "Trampas x3" }, { icon: "🥚", name: "Huevos x4" }], 3),
  mk("supervivencia", 18, "Señales de Otros", "👣", "No estás solo. Encuentra ruinas o campamentos.", "Humo a lo lejos, piedras apiladas, una senda. Alguien estuvo aquí. Sigue las señales y decide si te acercas. Tu futuro asentamiento empieza con un encuentro.", ["Explora una Ruina o Campamento Abandonado", "Recupera un objeto de lore / diario", "Encuentra el primer rastro humano reciente"], [{ icon: "📜", name: "Diario del Ermitaño" }, { icon: "🏚️", name: "Ruina Marcada" }], 3),
  mk("supervivencia", 19, "Juramento de Superviviente", "🤝", "Gana a tu primer seguidor.", "Sobrevivir solo es posible; prosperar solo no. Convence a un errante herido o hambriento de unirse a ti. Cuídalo, aliméntalo y gana su lealtad por encima de 60%.", ["Encuentra un NPC errante (createNpc1)", "Aliméntalo y cúralo hasta 80% salud", "Alcanza 60% de lealtad con él"], [{ icon: "👤", name: "Primer Seguidor" }, { icon: "💚", name: "Lealtad 60%" }], 4),
  mk("supervivencia", 20, "Cimientos del Destino", "🏗️", "Prepara todo para fundar tu asentamiento.", "Has aprendido a no morir. Ahora aprende a vivir. Limpia terreno, reúne reservas críticas y elige el emplazamiento donde nacerá tu pueblo. Este es tu examen final de supervivencia.", ["Limpia y aplana 20×20 metros de terreno", "Reúne 200× Madera + 120× Piedra", "Almacena comida y agua para 7 días para 2 personas"], [{ icon: "🏘️", name: "Desbloquea: Asentamiento" }, { icon: "✨", name: "500 XP + Título Superviviente" }], 4),

  // ════════════════════════════════════════════════════════════
  // CAP II — ASENTAMIENTO (20)
  // ════════════════════════════════════════════════════════════
  mk("asentamiento", 1, "La Primera Choza Comunal", "🏠", "De refugio personal a hogar colectivo.", "Tu choza ya no basta para dos. Levanta la primera vivienda comunal donde tus seguidores puedan dormir bajo techo. Un techo compartido es la primera piedra del pueblo.", ["Construye Choza Comunal Tier 1 (cap. 4)", "Asigna camas a 2 seguidores", "Mantén a todos bajo techo una noche"], [{ icon: "🛖", name: "Choza Comunal" }, { icon: "🛏️", name: "Camas x4" }], 1),
  mk("asentamiento", 2, "Reparto de Roles", "👥", "Cada mano cuenta si sabe qué hacer.", "Un grupo sin roles es una multitud. Asigna profesiones: un leñador, un recolector, un acarreador. Observa cómo la eficiencia se dispara cuando cada uno hace lo suyo.", ["Asigna 1× Leñador y 1× Recolector", "Alcanza 70% eficiencia en Cabaña de Leñadores", "Completa un ciclo de trabajo de 1 día"], [{ icon: "🪓", name: "Rol Leñador" }, { icon: "🌿", name: "Rol Recolector" }], 1),
  mk("asentamiento", 3, "Fuego Comunal y Cocina", "🍲", "Un fuego que alimenta a todos.", "Cocinar para uno es supervivencia; cocinar para cinco es logística. Construye una cocina comunal y asegura una comida caliente diaria para cada colono.", ["Construye Cocina / Fogón Comunal", "Produce 10× Guiso o Pan", "Alimenta a 3 seguidores en un mismo día"], [{ icon: "🍲", name: "Cocina Comunal" }, { icon: "🥖", name: "Pan x10" }], 1),
  mk("asentamiento", 4, "Pozo y Acueducto Primario", "🚰", "Agua segura a pasos de casa.", "Cargar agua del río cada día consume vidas. Cava un pozo o noria y canaliza agua limpia al centro del asentamiento.", ["Construye Pozo / Noria", "Conecta con Acueducto Primario", "Suministra 50 litros/día al asentamiento"], [{ icon: "🚰", name: "Noria" }, { icon: "💧", name: "Agua Segura" }], 1),
  mk("asentamiento", 5, "Granero y Silo", "🌾", "Lo que no se almacena, se pierde.", "Construir es inútil si la cosecha se pudre. Levanta un granero ventilado y un silo para grano. Aprende capacidad, deterioro y rotación.", ["Construye Granero o Silo", "Almacena 200 kg de grano sin pérdidas", "Mantén deterioro por debajo de 5%"], [{ icon: "🌾", name: "Silo de Grano" }, { icon: "📦", name: "Almacén 500kg" }], 1),
  mk("asentamiento", 6, "Campos de Trigo", "🌱", "Siembra hoy, come en meses.", "La caza se agota, el trigo no. Ara, siembra, riega y espera. Gestiona estaciones y aprende que la agricultura es paciencia planificada.", ["Ara y siembra 2 parcelas de trigo", "Riega durante 5 días consecutivos", "Cosecha primera producción de 80 kg"], [{ icon: "🌾", name: "Campo de Trigo" }, { icon: "🌱", name: "Semillas x20" }], 2),
  mk("asentamiento", 7, "Molino Harinero", "💨", "Del grano al pan sin moler a mano.", "Moler a mano alimenta a uno; un molino alimenta a veinte. Construye un molino de viento o agua y transforma grano en harina eficientemente.", ["Construye Molino Harinero", "Procesa 50 kg de grano → harina", "Hornea 20× Pan en la cocina"], [{ icon: "💨", name: "Molino" }, { icon: "🥡", name: "Harina x50" }], 2),
  mk("asentamiento", 8, "Caza Organizada", "🏹", "De cazador solitario a partida de caza.", "Organiza batidas con 2-3 cazadores. Coordina, comparte presas y asegura proteína sin agotar la fauna local.", ["Asigna 2× Cazadores a Cabaña de Caza", "Obtén 30 kg de carne en una semana", "Mantén población animal estable"], [{ icon: "🏹", name: "Partida de Caza" }, { icon: "🥩", name: "Carne x30" }], 2),
  mk("asentamiento", 9, "Curtiduría Básica", "🧥", "La piel vale más curtida que cruda.", "No vendas pieles crudas. Cúrtelas y conviértelas en cuero para ropa, herramientas y comercio. Una curtiduría es tu primera industria.", ["Construye Curtiduría (Tier 1)", "Procesa 10× Piel cruda → Cuero", "Fabrica 3× Ropa de Cuero"], [{ icon: "🧥", name: "Curtiduría" }, { icon: "🟫", name: "Cuero x10" }], 2),
  mk("asentamiento", 10, "Taller de Carpintería", "🪚", "Madera bruta → progreso.", "Troncos no construyen casas, tablas sí. Levanta un aserradero y convierte madera en tablones, vigas y herramientas.", ["Construye Aserradero", "Produce 40× Tablas y 10× Vigas", "Fabrica 5× Herramientas de madera"], [{ icon: "🪚", name: "Aserradero" }, { icon: "🏗️", name: "Vigas x10" }], 2),
  mk("asentamiento", 11, "Trueque Interno", "⚖️", "Primera economía: intercambiar sin monedas.", "Aún no hay oro, pero hay valor. Establece trueque interno: pan por cuero, madera por grano. Aprende oferta, demanda y excedente.", ["Crea Plaza de Mercado Tier 1", "Realiza 15 trueques entre edificios", "Acumula excedente de 3 recursos distintos"], [{ icon: "⚖️", name: "Mercado Local" }, { icon: "🧺", name: "Excedentes x3" }], 2),
  mk("asentamiento", 12, "Camino y Transporte", "🛤️", "Acerca todo, acelera todo.", "Un asentamiento sin caminos es una trampa de barro. Traza sendas entre edificios clave y observa cómo el tiempo de transporte cae a la mitad.", ["Traza caminos entre 4 edificios principales", "Reduce tiempo de acarreo en 30%", "Asigna 1× Portador dedicado"], [{ icon: "🛤️", name: "Red de Sendas" }, { icon: "👣", name: "Portador" }], 3),
  mk("asentamiento", 13, "Enfermería", "🏥", "Una enfermedad puede borrar tu pueblo.", "Construye una enfermería, asigna un curandero y aprende a aislar, tratar y prevenir. La higiene salva más vidas que la espada.", ["Construye Casa de Baños / Enfermería", "Trata 3 enfermedades o heridas graves", "Mantén salud media del grupo >75% durante 5 días"], [{ icon: "🏥", name: "Enfermería" }, { icon: "🧼", name: "Higiene +20%" }], 3),
  mk("asentamiento", 14, "Guardia y Lealtad", "🛡️", "Sin orden no hay asentamiento.", "El hambre genera robos, el miedo genera deserción. Nombra un guardia, gestiona lealtad y resuelve la primera disputa interna sin sangre.", ["Asigna 1× Guardia / Alguacil", "Resuelve un evento de disputa (lealtad)", "Mantén lealtad media >65%"], [{ icon: "🛡️", name: "Guardia" }, { icon: "⚖️", name: "Justicia Local" }], 3),
  mk("asentamiento", 15, "Invierno Autosuficiente", "❄️", "Sobrevive al primer invierno sin ayuda externa.", "El invierno es tu auditor. Si no almacenaste, morirás. Acumula leña, comida, agua y ropa antes de que nieve. 30 días de autosuficiencia.", ["Almacena 300 kg comida + 200 litros agua + 100 leña", "Sobrevive 15 días de invierno sin comercio", "Cero muertes por frío o hambre"], [{ icon: "❄️", name: "Reserva Invernal" }, { icon: "🧣", name: "Ropa de Abrigo x5" }], 3),
  mk("asentamiento", 16, "Ampliación Residencial Tier 2", "🏡", "De chozas a casas de piedra.", "Tus colonos merecen más que paja. Construye casas de piedra Tier 2 y observa cómo suben felicidad, natalidad y productividad.", ["Construye 3× Casas de Piedra Tier 2", "Aloja a 8+ colonos en Tier 2", "Alcanza felicidad media >70%"], [{ icon: "🏡", name: "Casas de Piedra" }, { icon: "😊", name: "Felicidad +15%" }], 3),
  mk("asentamiento", 17, "Mercado Local Maduro", "🧺", "De trueque a mercado diario.", "Tu plaza ya no es trueque ocasional: es mercado diario con puestos, precios y excedentes. Aprende a gestionar flujo comercial básico.", ["Amplía Plaza a 4 puestos", "Genera 100 monedas equivalentes en trueque/semana", "Atrae a 1 comerciante itinerante"], [{ icon: "🧺", name: "Mercado Maduro" }, { icon: "💰", name: "Comerciante" }], 3),
  mk("asentamiento", 18, "Oficina del Intendente", "📋", "Tu primer administrador: delegar sin perder control.", "Ya no puedes hacerlo todo. Nombra un intendente que gestione bodega, turnos y balances. Aprende a delegar y a auditar.", ["Nombra Intendente (Administrador) en Almacén Central", "Delega 3 edificios bajo su gestión", "Revisa balance semanal sin descuadres >5%"], [{ icon: "📋", name: "Intendente" }, { icon: "📊", name: "Balance Semanal" }], 4),
  mk("asentamiento", 19, "Balance Contable", "📊", "Números que dicen si vives o mueres.", "Produce más de lo que consumes o tu asentamiento colapsará. Aprende a leer producción vs consumo, eficiencia y proyección a 30 días.", ["Mantén balance positivo 10 días seguidos", "Alcanza eficiencia media >75% en 5 edificios", "Genera informe sin déficit"], [{ icon: "📊", name: "Contabilidad Básica" }, { icon: "✨", name: "200 XP" }], 4),
  mk("asentamiento", 20, "Autosuficiencia Probada", "✅", "30 días sin ayuda externa: eres un asentamiento.", "Tu prueba final: 30 días sin importar nada, manteniendo a 10+ colonos vivos, alimentados, sanos y leales. Si lo logras, estás listo para ser señor de más tierras.", ["Sostén 10+ colonos 30 días autosuficiente", "Cero muertes y lealtad >70% al final", "Acumula reserva para fundar 2º asentamiento"], [{ icon: "🏘️", name: "Desbloquea: Señorío" }, { icon: "👑", name: "Título Fundador" }], 4),

  // ════════════════════════════════════════════════════════════
  // CAP III — SEÑORÍO (20)
  // ════════════════════════════════════════════════════════════
  mk("senorio", 1, "Eco de Frontera", "🗺️", "Funda tu segundo asentamiento.", "Un asentamiento es hogar; dos es señorío. Elige emplazamiento a 500-800m, envía colonos y recursos iniciales y funda la primera aldea vasalla.", ["Elige emplazamiento para 2º asentamiento", "Envía 3 colonos + 100 madera + 50 comida", "Establece 2º núcleo habitado"], [{ icon: "🗺️", name: "2º Asentamiento" }, { icon: "🏘️", name: "Aldea Vasalla" }], 2),
  mk("senorio", 2, "Carta del Señor", "📜", "Nombra tu primer alcalde y dale autoridad.", "No puedes estar en dos sitios. Redacta una carta señorial, nombra alcalde y define sus competencias básicas. La delegación empieza con tinta.", ["Redacta Carta Señorial (evento)", "Nombra Alcalde en 2º asentamiento", "Define 3 competencias delegadas"], [{ icon: "📜", name: "Carta Señorial" }, { icon: "👨‍💼", name: "Alcalde" }], 2),
  mk("senorio", 3, "Caminos Reales", "🛣️", "Une tus tierras con caminos transitables.", "Dos aldeas aisladas son dos debilidades. Construye camino real entre ambas, reduce tiempo de viaje y permite caravanas.", ["Construye Camino Real inter-asentamiento", "Reduce tiempo de traslado en 40%", "Establece 1 ruta de carretas"], [{ icon: "🛣️", name: "Camino Real" }, { icon: "🐎", name: "Carreta x1" }], 2),
  mk("senorio", 4, "Tributo y Diezmo", "💰", "Haz que tus aldeas te sostengan.", "Un señor sin tributo es un campesino con título. Establece diezmo en grano y tributo en madera. Equilibra sin asfixiar.", ["Fija tributo: 15% grano + 10% madera", "Recauda tributo 2 ciclos sin revuelta", "Mantén lealtad vasalla >60%"], [{ icon: "💰", name: "Tributo Regular" }, { icon: "🌾", name: "Granero Señorial" }], 2),
  mk("senorio", 5, "Oficina de Correos", "✉️", "Que tus órdenes lleguen antes que los problemas.", "Órdenes que tardan son órdenes inútiles. Crea posta de mensajeros a caballo entre asentamientos.", ["Construye Posta / Oficina de Correos", "Asigna 2× Jinetes Mensajeros", "Entrega 10 despachos sin retraso"], [{ icon: "✉️", name: "Red de Postas" }, { icon: "🐎", name: "Mensajeros x2" }], 2),
  mk("senorio", 6, "Centralización de Grano", "🚚", "Mueve excedentes donde hacen falta.", "Un asentamiento con hambre y otro con excedente es fracaso logístico. Centraliza grano en almacén señorial y redistribuye.", ["Centraliza 300 kg excedente en Almacén Señorial", "Redistribuye a asentamiento deficitario", "Cero hambrunas durante 10 días"], [{ icon: "🚚", name: "Logística Señorial" }, { icon: "📦", name: "Almacén Central" }], 2),
  mk("senorio", 7, "Rotación de Cosechas", "🔄", "Gestiona agricultura en múltiples climas.", "Cada aldea tiene suelo distinto. Implementa rotación trienal y diversifica cultivos entre asentamientos.", ["Implementa rotación en 2 asentamientos", "Cultiva 3 tipos distintos (trigo, cebada, lino)", "Aumenta rendimiento +20%"], [{ icon: "🔄", name: "Rotación Trienal" }, { icon: "🌾", name: "Rendimiento +20%" }], 3),
  mk("senorio", 8, "Milicia Señorial", "⚔️", "Tus aldeas deben defenderse solas un tiempo.", "Bandidos no esperan al señor. Crea milicia local en cada asentamiento con entrenamiento básico y turnos.", ["Recluta 4× Milicianos (2 por asentamiento)", "Construye Puesto de Guardia en cada aldea", "Repele 1 ataque bandido"], [{ icon: "⚔️", name: "Milicia" }, { icon: "🛡️", name: "Puesto Guardia x2" }], 3),
  mk("senorio", 9, "Corte de Justicia Local", "⚖️", "Imparte justicia sin estar presente.", "Disputas por tierras, robos, herencias. Establece corte local con alguacil y juez delegado. Tus decisiones deben llegar como ley.", ["Construye Corte de Justicia en capital señorial", "Resuelve 3 casos judiciales", "Mantén orden >70%"], [{ icon: "⚖️", name: "Corte Señorial" }, { icon: "📖", name: "Libro de Leyes" }], 3),
  mk("senorio", 10, "Capilla y Cohesión", "⛪", "La fe une donde la distancia separa.", "Dos aldeas pueden sentirse extrañas entre sí. Una capilla compartida, un sacerdote itinerante y fiestas comunes crean identidad señorial.", ["Construye Capilla Señorial", "Asigna Sacerdote Itinerante", "Celebra 2 fiestas patronales"], [{ icon: "⛪", name: "Capilla" }, { icon: "🕊️", name: "Cohesión +15%" }], 3),
  mk("senorio", 11, "Feria Señorial", "🎪", "Comercio entre aldeas, riqueza para el señor.", "Una feria mensual donde cada aldea vende su especialidad. Regula precios, cobra peaje y fomenta especialización.", ["Organiza Feria Señorial mensual", "Comercia 500 monedas equivalentes entre aldeas", "Especializa cada aldea en 1 producto"], [{ icon: "🎪", name: "Feria" }, { icon: "💰", name: "Peaje Feria" }], 3),
  mk("senorio", 12, "Inventario Centralizado", "🏛️", "Un solo almacén para gobernarlos a todos.", "Ya no son bodegas aisladas: es una red. Centraliza inventario, controla existencias y evita duplicar esfuerzos.", ["Unifica 3 bodegas en inventario central", "Audita existencias sin pérdidas >3%", "Implementa libro de almacén"], [{ icon: "🏛️", name: "Inventario Señorial" }, { icon: "📚", name: "Libro Almacén" }], 3),
  mk("senorio", 13, "Supervisores y Capataces", "👷", "Jerarquía básica: jefe y subordinados.", "Un alcalde no basta. Nombra supervisores por sector (campo, taller, almacén) y capataces por cuadrilla. Observa cómo la eficiencia sube con mando intermedio.", ["Nombra 3× Supervisores (1 por sector)", "Asigna 6× Capataces bajo ellos", "Alcanza eficiencia media >80%"], [{ icon: "👷", name: "Capataces x6" }, { icon: "📈", name: "Eficiencia +10%" }], 3),
  mk("senorio", 14, "Impuestos y Libro Mayor", "📚", "De tributo en especie a contabilidad.", "Tributo en grano es primitivo. Introduce impuesto mixto (especie + moneda) y lleva libro mayor señorial con ingresos, gastos y proyección.", ["Implementa impuesto mixto", "Lleva libro mayor 15 días sin descuadre", "Genera superávit de 10%"], [{ icon: "📚", name: "Libro Mayor" }, { icon: "💰", name: "Superávit" }], 4),
  mk("senorio", 15, "Defensa del Territorio", "🏹", "Murallas de madera, corazón de piedra.", "Tu señorío es codiciado. Levanta empalizadas, torres de vigilancia y organiza turnos de guardia conjuntos.", ["Construye Empalizada perimetral en capital", "Levanta 2× Torres de Vigilancia", "Organiza patrulla conjunta"], [{ icon: "🏹", name: "Empalizada" }, { icon: "🗼", name: "Torres x2" }], 4),
  mk("senorio", 16, "Sequía del Señorío", "🌵", "Crisis compartida: gestiona escasez entre aldeas.", "No llueve en un valle, el otro tiene agua. Gestiona sequía moviendo agua y grano, racionando y evitando revuelta. La crisis enseña a gobernar.", ["Sobrevive 10 días de sequía sin muertes", "Redistribuye agua entre asentamientos", "Mantén lealtad >55% durante crisis"], [{ icon: "💧", name: "Gestión de Crisis" }, { icon: "🤝", name: "Lealtad a prueba" }], 4),
  mk("senorio", 17, "Delegar sin Perder Control", "🎭", "Un alcalde ambicioso pone a prueba tu autoridad.", "Tu alcalde más competente pide más autonomía. Dale poder sin perder control: audita, rota cargos, exige juramento. La delegación tiene precio.", ["Resuelve evento Alcalde Ambicioso", "Audita sin perder eficiencia", "Mantén autoridad señorial >70%"], [{ icon: "🎭", name: "Intriga Señorial" }, { icon: "👁️", name: "Auditoría" }], 4),
  mk("senorio", 18, "Censo y Catastro", "📝", "Cuenta personas, mide tierras, gobierna mejor.", "No puedes gobernar lo que no mides. Realiza censo de población y catastro de tierras cultivables y bosques.", ["Completa censo de 2 asentamientos", "Mapea tierras cultivables y bosques", "Establece base imponible justa"], [{ icon: "📝", name: "Censo" }, { icon: "🗺️", name: "Catastro" }], 4),
  mk("senorio", 19, "Banquete del Señor", "🍷", "Muestra poder, gana lealtad, sella alianzas.", "Un banquete no es gula: es política. Invita a alcaldes, supervisores y notables. Reparte honores y escucha quejas.", ["Organiza Banquete Señorial", "Invita a 8 notables", "Gana +10 lealtad media tras banquete"], [{ icon: "🍷", name: "Banquete" }, { icon: "💚", name: "Lealtad +10" }], 4),
  mk("senorio", 20, "Juramento de Vasallaje", "🤝", "Tu señorío está listo para ser ducado.", "Has unificado gestión, logística y mando. Tus alcaldes te juran fidelidad formal. El camino al ducado está abierto. Prueba final: 20 días con 2+ asentamientos estables.", ["Sostén 2+ asentamientos estables 20 días", "Recibe juramento de 2 alcaldes", "Acumula 1000 madera + 800 piedra + 500 grano de reserva señorial"], [{ icon: "🏰", name: "Desbloquea: Ducado" }, { icon: "📜", name: "Juramento Vasallático" }], 4),

  // ════════════════════════════════════════════════════════════
  // CAP IV — DUCADO (20)
  // ════════════════════════════════════════════════════════════
  mk("ducado", 1, "Título Ducal", "👑", "De señor a duque: reclama tu título.", "Has unificado varios señoríos. Ahora el rey o la fuerza te reconoce como duque. Define tus fronteras ducales y proclama tu autoridad.", ["Reclama Título Ducal (evento/coronación)", "Define fronteras ducales en mapa", "Recibe reconocimiento de 3 señoríos"], [{ icon: "👑", name: "Título Duque" }, { icon: "🗺️", name: "Fronteras Ducales" }], 2),
  mk("ducado", 2, "Mapa del Ducado", "🗺️", "Cartografía a escala ducal.", "Gobernar a ciegas es perder. Levanta mapa ducal con caminos, recursos, villas y fortalezas. Un buen mapa vale un ejército.", ["Levanta Mapa Ducal completo", "Marca 5 recursos estratégicos", "Marca 3 pasos montañosos / ríos"], [{ icon: "🗺️", name: "Mapa Ducal" }, { icon: "🧭", name: "Cartógrafos" }], 2),
  mk("ducado", 3, "Vasallos Mayores y Menores", "🏰", "Jerarquía feudal real: no todos son iguales.", "Bajo el duque hay condes/señores mayores y caballeros/alcaldes menores. Define quién manda a quién y evita guerras internas por precedencia.", ["Nombra 2× Vasallos Mayores (señores)", "Nombra 4× Vasallos Menores (caballeros)", "Establece cadena de mando sin conflictos 10 días"], [{ icon: "🏰", name: "Vasallos x6" }, { icon: "🔗", name: "Cadena de Mando" }], 2),
  mk("ducado", 4, "Cancillería Ducal", "📜", "Tu administración central: la cancillería.", "Un ducado no se gobierna desde una choza. Crea cancillería con escribas, sellos y archivo. Toda orden sale de aquí.", ["Construye Cancillería Ducal", "Asigna Canciller + 2 Escribas", "Emite 5 decretos ducales"], [{ icon: "📜", name: "Cancillería" }, { icon: "✒️", name: "Canciller" }], 2),
  mk("ducado", 5, "Recaudación Ducal", "💰", "Tesorería ducal: de granero a banco.", "Tributo señorial ya no basta. Centraliza recaudación ducal en tesorería con arca, tesorero y contabilidad por señorío.", ["Construye Tesorería / Cámara Acorazada", "Nombra Tesorero Ducal", "Recauda de 3 señoríos sin déficit"], [{ icon: "💰", name: "Tesorería Ducal" }, { icon: "🏦", name: "Arca Ducal" }], 2),
  mk("ducado", 6, "Gremios y Maestros", "⚒️", "Diversifica funciones: gremios especializados.", "Un señorío tenía trabajadores; un ducado necesita maestros. Funda gremios de artesanos, herreros, carpinteros y maestros que entrenan aprendices.", ["Funda Gremio de Artesanos", "Asigna 2× Maestros + 4× Aprendices", "Desbloquea 2 recetas maestras"], [{ icon: "⚒️", name: "Gremio Artesanos" }, { icon: "🎓", name: "Maestros x2" }], 3),
  mk("ducado", 7, "Biblioteca Ducal", "📚", "El saber es poder ducal.", "Colecciona planos, manuscritos y patentes en biblioteca ducal. Cada libro es +eficiencia futura.", ["Construye Biblioteca Ducal", "Reúne 10× Manuscritos / Planos", "Desbloquea 1 tecnología ducal"], [{ icon: "📚", name: "Biblioteca" }, { icon: "💡", name: "Tecnología Ducal" }], 3),
  mk("ducado", 8, "Código de Leyes Ducales", "⚖️", "Unifica leyes de señoríos dispares.", "Cada señorío tenía su costumbre. Unifica en código ducal: justicia, herencia, comercio y castigos. Sin ley común no hay ducado.", ["Redacta Código Ducal (5 capítulos)", "Implementa en 3 señoríos", "Resuelve 2 conflictos por contradicción legal"], [{ icon: "⚖️", name: "Código Ducal" }, { icon: "📖", name: "Corpus Legal" }], 3),
  mk("ducado", 9, "Ruta Comercial Ducal", "⛵", "Conecta tu ducado al mundo.", "Caminos reales ya no bastan. Crea ruta comercial ducal con estación de carretas y/o puerto comercial. Atrae mercaderes extranjeros.", ["Construye Estación de Carretas o Puerto", "Establece ruta con 2 señoríos + exterior", "Comercia 1000 monedas/semana"], [{ icon: "⛵", name: "Puerto Ducal" }, { icon: "🐎", name: "Ruta Comercial" }], 3),
  mk("ducado", 10, "Fortalezas Fronterizas", "🏯", "Piedra y hierro en tus fronteras.", "Un ducado sin fortalezas es botín. Levanta 2 fortalezas fronterizas con guarnición y avituallamiento.", ["Construye 2× Fortalezas Fronterizas", "Asigna guarnición de 6 milicianos cada una", "Mantén avituallamiento 15 días"], [{ icon: "🏯", name: "Fortalezas x2" }, { icon: "🛡️", name: "Guarniciones" }], 3),
  mk("ducado", 11, "Hambruna Ducal", "🥀", "Crisis a escala ducal: gestiona hambruna sin colapso.", "Un señorío con hambre es drama; un ducado con hambre es guerra civil. Gestiona hambruna moviendo grano entre 3+ señoríos, racionando y manteniendo orden.", ["Sobrevive hambruna 15 días con 3 señoríos", "Cero revueltas pese a racionamiento", "Redistribuye 500 kg grano entre señoríos"], [{ icon: "🥀", name: "Gestión Hambruna" }, { icon: "🤝", name: "Cohesión Ducal" }], 3),
  mk("ducado", 12, "Corte Ducal", "🎭", "Intriga, honor y veneno en tu corte.", "Tu corte atrae ambiciosos. Gestiona facciones, otorga honores y resuelve intriga palaciega sin derramar sangre (o derramándola con juicio).", ["Organiza Corte Ducal semanal", "Resuelve evento Intriga Cortesana", "Mantén estabilidad cortesana >60%"], [{ icon: "🎭", name: "Corte Ducal" }, { icon: "🎖️", name: "Honores" }], 4),
  mk("ducado", 13, "Linaje y Herencia", "👨‍👩‍👧", "Asegura tu sucesión o tu ducado morirá contigo.", "Sin heredero claro tu ducado se fragmentará. Define leyes de herencia, educa a tu heredero y gana apoyo de vasallos mayores.", ["Designa Heredero Ducal", "Educa heredero con 2 tutores (maestros)", "Gana apoyo de 2/2 vasallos mayores"], [{ icon: "👨‍👩‍👧", name: "Heredero" }, { icon: "📜", name: "Ley Herencia" }], 4),
  mk("ducado", 14, "Catedral Ducal", "🕍", "Fe a escala ducal: gran templo.", "Una capilla no basta para un ducado. Levanta catedral que centralice fe, peregrinación y legitimidad divina de tu título.", ["Construye Gran Catedral / Templo", "Asigna Arzobispo + 3 Canónigos", "Atrae 50 peregrinos/mes"], [{ icon: "🕍", name: "Catedral Ducal" }, { icon: "✨", name: "Legitimidad +20%" }], 4),
  mk("ducado", 15, "Academia Ducal", "🎓", "Forma a tus futuros administradores y generales.", "Ya no basta con aprender haciendo. Funda academia militar y civil para formar supervisores, tesoreros y capitanes.", ["Construye Academia Militar + Gremio Inventores", "Gradúa 4× Oficiales / Administradores", "Alcanza 85% eficiencia en 2 señoríos"], [{ icon: "🎓", name: "Academia" }, { icon: "⚔️", name: "Oficiales x4" }], 4),
  mk("ducado", 16, "Reforma Agraria", "🌾", "Reorganiza tierras para alimentar un ducado.", "Reparcelar, drenar pantanos, introducir arado pesado. Reforma agraria que duplique rendimiento pero enfade a vasallos tradicionales.", ["Introduce Arado Pesado en 2 señoríos", "Drena 1 pantano / roza bosque", "Aumenta producción total +30% pese a resistencia"], [{ icon: "🌾", name: "Reforma Agraria" }, { icon: "📈", name: "Producción +30%" }], 4),
  mk("ducado", 17, "Moneda Ducal", "🪙", "De trueque a moneda propia.", "Acuña moneda ducal en tu tesorería. Unifica tipos de cambio entre señoríos y cobra señoreaje. La moneda es soberanía.", ["Acuña 500× Monedas Ducales", "Unifica precios en 3 señoríos", "Establece tipo de cambio con exterior"], [{ icon: "🪙", name: "Moneda Ducal" }, { icon: "💰", name: "Señoreaje" }], 4),
  mk("ducado", 18, "Asamblea de Señores", "🏛️", "Gobierna con tus vasallos, no solo sobre ellos.", "Convoca asamblea ducal periódica. Escucha agravios, vota subsidios y evita que tus vasallos conspiren a tus espaldas.", ["Convoca Asamblea Ducal", "Aprueba 2 leyes con apoyo mayoritario", "Mantén apoyo vasallos >65%"], [{ icon: "🏛️", name: "Asamblea" }, { icon: "🤝", name: "Apoyo Vasallos" }], 4),
  mk("ducado", 19, "Corona en el Horizonte", "👑", "De duque a rey: unifica o somete al último señorío díscolo.", "Queda un señorío que no reconoce tu autoridad ducal. Negocia, presiona o somete. Sin él no hay reino.", ["Somete / Integra último señorío díscolo", "Gana lealtad >60% en él en 10 días", "Proclama pre-reino"], [{ icon: "👑", name: "Pre-Reino" }, { icon: "⚔️", name: "Último Señorío" }], 4),
  mk("ducado", 20, "Proclamación del Reino", "🏰", "Tu ducado se convierte en reino.", "Has tejido jerarquía compleja: duque → vasallos mayores → menores → intendentes → capataces → pueblo. Ahora corona tu obra y proclama el reino. 30 días con 3+ señoríos estables bajo jerarquía ducal.", ["Sostén 3+ señoríos estables 30 días bajo jerarquía", "Mantén eficiencia media >75% y lealtad >65%", "Ceremonia de Proclamación del Reino"], [{ icon: "🏰", name: "Desbloquea: Conquista" }, { icon: "👑", name: "Corona Real" }], 5),

  // ════════════════════════════════════════════════════════════
  // CAP V — CONQUISTA (20)
  // ════════════════════════════════════════════════════════════
  mk("conquista", 1, "Leva de Campesinos", "🪖", "Convierte campesinos en soldados.", "Un reino sin ejército es invitación a invasión. Decreta leva, selecciona hombres, equípalos básico y forma tu primer contingente.", ["Decreta leva en 2 señoríos", "Recluta 12× Levas campesinas", "Equipa con lanza + escudo de madera"], [{ icon: "🪖", name: "Levas x12" }, { icon: "🛡️", name: "Escudos x12" }], 2),
  mk("conquista", 2, "Armería y Forja de Guerra", "🔨", "Armas que no se rompen en la primera batalla.", "Levas con palos mueren rápido. Construye armería ducal y forja de guerra para producir espadas, lanzas y cotas.", ["Construye Armería / Forja Industrial", "Produce 15× Espadas + 10× Cotas", "Equipa a 10 soldados con hierro"], [{ icon: "🔨", name: "Forja de Guerra" }, { icon: "⚔️", name: "Espadas x15" }], 2),
  mk("conquista", 3, "Entrenamiento Básico", "🏋️", "De multitud a unidad.", "Un grupo armado no es ejército. Construye barracones, asigna sargento y entrena disciplina, formación y obediencia.", ["Construye Barracones / Academia Militar", "Asigna Sargento + 2 Instructores", "Entrena 10 soldados a nivel veterano básico"], [{ icon: "🏋️", name: "Barracones" }, { icon: "📯", name: "Sargento" }], 2),
  mk("conquista", 4, "Cadena de Suministro Militar", "📦", "Un ejército marcha sobre su estómago.", "Armas sin comida son peso muerto. Establece cadena logística militar: grano, carne seca, agua, forraje para caballos. Un día sin suministro = deserción.", ["Crea Depósito Militar Central", "Asegura 14 días de raciones para 20 soldados", "Establece ruta suministro al frente"], [{ icon: "📦", name: "Logística Militar" }, { icon: "🍖", name: "Raciones 14d" }], 2),
  mk("conquista", 5, "Exploradores y Espías", "🕵️", "Ve sin ser visto, sabe sin preguntar.", "Manda exploradores a mapear defensas enemigas y espías a sembrar duda. Información vale más que 100 lanzas.", ["Recluta 3× Exploradores / Espías", "Mapea 1 reino vecino (defensas, recursos)", "Infiltra 1 espía en corte enemiga"], [{ icon: "🕵️", name: "Espías x3" }, { icon: "🗺️", name: "Mapa Enemigo" }], 2),
  mk("conquista", 6, "Primera Escaramuza", "⚔️", "Sangre tu ejército contra bandidos antes que contra reyes.", "Prueba tu ejército contra bandidos fortificados. Pequeña victoria, gran lección logística y moral.", ["Localiza Campamento Bandido", "Ataca con 12+ soldados", "Victoria con <20% bajas"], [{ icon: "⚔️", name: "Victoria Menor" }, { icon: "💰", name: "Botín Bandido" }], 3),
  mk("conquista", 7, "Asedio I: Bloqueo", "🚧", "Rodea y asfixia, no asaltes a lo loco.", "Un asalto frontal es carnicería. Aprende a bloquear castillo enemigo: corta suministros, levanta campamento de asedio y espera.", ["Levanta Campamento de Asedio", "Bloquea Castillo Menor 7 días", "Mantén moral de asedio >60%"], [{ icon: "🚧", name: "Bloqueo" }, { icon: "⛺", name: "Campamento Asedio" }], 3),
  mk("conquista", 8, "Máquinas de Asedio", "🏗️", "Arietes, torres y catapultas.", "Murallas no caen con gritos. Construye taller de asedio y fabrica ariete, torre de asalto y catapulta.", ["Construye Taller de Asedio", "Fabrica Ariete + Catapulta", "Derrumba 1 sección de muralla en prueba"], [{ icon: "🏗️", name: "Taller Asedio" }, { icon: "💣", name: "Catapulta" }], 3),
  mk("conquista", 9, "Caballería Ducal", "🐎", "El trueno de cascos decide batallas.", "Infantería gana terreno, caballería gana batallas. Crea caballerizas reales, cría caballos de guerra y forma 6 jinetes.", ["Construye Caballerizas Reales", "Cría 6× Caballos de Guerra", "Forma 6× Jinetes pesados"], [{ icon: "🐎", name: "Caballería x6" }, { icon: "🏇", name: "Jinetes" }], 3),
  mk("conquista", 10, "Flota de Guerra", "⛵", "Si tu reino tiene costa, necesitas barcos.", "Conquista sin flota es cojera. Construye puerto militar y 3 galeras para transportar tropas y bloquear puertos enemigos.", ["Construye Puerto Militar", "Botar 3× Galeras / Barcos", "Transporta 15 soldados por mar"], [{ icon: "⛵", name: "Flota x3" }, { icon: "⚓", name: "Puerto Militar" }], 3),
  mk("conquista", 11, "Campaña Invernal", "❄️", "La guerra no espera a primavera.", "Ataca en invierno: moral baja, suministros escasos, frío mata más que espadas. Sostén campaña invernal 10 días sin colapso moral.", ["Lanza campaña en invierno", "Sostén moral >50% y suministros 10 días", "Toma aldea enemiga en invierno"], [{ icon: "❄️", name: "Campaña Invernal" }, { icon: "🧥", name: "Equipo Invernal" }], 3),
  mk("conquista", 12, "Toma de Castillo Enemigo", "🏯", "Tu primer castillo conquistado.", "Todo lo aprendido culmina aquí: bloqueo + máquinas + infantería + caballería. Toma un castillo enemigo y decide qué hacer con sus defensores.", ["Asedia Castillo Enemigo Tier 2", "Toma castillo con <30% bajas", "Decide: guarnición / demolición / tributo"], [{ icon: "🏯", name: "Castillo Tomado" }, { icon: "🗝️", name: "Llaves del Castillo" }], 4),
  mk("conquista", 13, "Administración de Territorio Ocupado", "📋", "Conquistar es fácil; gobernar lo conquistado no.", "Un castillo tomado con población hostil es polvorín. Nombra gobernador militar, establece guarnición y pacifica en 15 días.", ["Nombra Gobernador Militar en territorio ocupado", "Mantén orden >60% durante 15 días", "Evita revuelta con lealtad >50%"], [{ icon: "📋", name: "Gobernador Militar" }, { icon: "🕊️", name: "Pacificación" }], 4),
  mk("conquista", 14, "Dilema del Saqueo vs Tributo", "⚖️", "Riqueza rápida o riqueza duradera.", "Tus soldados quieren saqueo; tu tesorero quiere tributo anual. Elige y afronta consecuencias: moral vs economía a largo plazo.", ["Decide: Saqueo (botín inmediato) o Tributo (ingreso anual)", "Gestiona consecuencia (moral o revuelta)", "Mantén estabilidad 10 días post-decisión"], [{ icon: "⚖️", name: "Decisión Estratégica" }, { icon: "💰", name: "+ Oro o + Tributo" }], 4),
  mk("conquista", 15, "Coalición Enemiga", "🤝", "Dos reinos se alían contra ti.", "Tus victorias asustan. Dos vecinos forman coalición. Sostén guerra en dos frentes o rompe la alianza con diplomacia/espionaje.", ["Sostén guerra en 2 frentes 15 días", "O rompe coalición vía diplomacia/espía", "Evita perder territorio propio"], [{ icon: "🤝", name: "Coalición Rota" }, { icon: "🕵️", name: "Espionaje Crítico" }], 4),
  mk("conquista", 16, "Diplomacia de Guerra", "📜", "La guerra también se gana con tinta.", "Firma pacto de no agresión con tercer reino, compra mercenarios o logra reconocimiento de tus conquistas. No todo es espada.", ["Firma Pacto No Agresión con 1 reino", "Contrata 6× Mercenarios veteranos", "Gana reconocimiento diplomático de conquista"], [{ icon: "📜", name: "Pacto" }, { icon: "🪙", name: "Mercenarios x6" }], 4),
  mk("conquista", 17, "Batalla Campal", "⚔️", "Dos ejércitos frente a frente. Sin murallas.", "Batalla campal: infantería al centro, caballería en alas, reservas. Gana con táctica, no solo números. Tu mayor prueba militar hasta ahora.", ["Enfrenta Ejército Enemigo Real (20+ vs 20+)", "Usa caballería para flanqueo", "Victoria con táctica (no solo superioridad numérica)"], [{ icon: "⚔️", name: "Victoria Campal" }, { icon: "🏆", name: "Estandarte Enemigo" }], 4),
  mk("conquista", 18, "Cerco de la Capital Enemiga", "🏰", "Rodea la capital del reino vecino.", "Has quebrado sus ejércitos. Ahora rodea su capital, resiste salidas y mantén asedio 20 días contra hambre y enfermedades en tu campamento.", ["Cerca Capital Enemiga", "Sostén asedio 20 días sin levantar", "Mantén suministros y moral >55%"], [{ icon: "🏰", name: "Asedio Capital" }, { icon: "⛺", name: "Campamento Real" }], 5),
  mk("conquista", 19, "Anexión del Reino Vecino", "🗺️", "El reino vecino deja de existir. Ahora es tuyo.", "Capitulación firmada. Anexiona territorio, integra nobleza enemiga (o exíliala) y establece administración de transición.", ["Firma Capitulación / Anexión formal", "Integra o exilia nobleza enemiga", "Establece administración transición 15 días sin revuelta"], [{ icon: "🗺️", name: "Reino Anexado" }, { icon: "📜", name: "Tratado Anexión" }], 5),
  mk("conquista", 20, "Pax Ducalia", "☮️", "Consolida tu conquista o la perderás.", "Conquistar es un día; consolidar son años. Mantén 2 reinos (propio + anexado) estables 30 días con guarniciones, tributo justo y lealtad. Si lo logras, estás listo para el Imperio.", ["Sostén 2 reinos estables 30 días", "Mantén lealtad >60% en ambos", "Guarniciones + tributo sin revueltas mayores"], [{ icon: "🌍", name: "Desbloquea: Imperio" }, { icon: "☮️", name: "Pax Ducalia" }], 5),

  // ════════════════════════════════════════════════════════════
  // CAP VI — IMPERIO (20)
  // ════════════════════════════════════════════════════════════
  mk("imperio", 1, "Coronación Imperial", "👑", "De rey a emperador: corona continental.", "Has conquistado reinos. Ahora reclama corona imperial. Convoca a reyes vasallos, logra reconocimiento papal/imperial y corónate.", ["Convoca Dieta Imperial con reyes vasallos", "Obtén coronación (legitimidad)", "Proclama Imperio Continental"], [{ icon: "👑", name: "Corona Imperial" }, { icon: "🦅", name: "Águila Imperial" }], 3),
  mk("imperio", 2, "Provincias Imperiales", "🗺️", "Divide el imperio para gobernarlo.", "Un imperio no se gobierna como reino. Divide en 4-6 provincias con límites claros, capitales y recursos asignados.", ["Delinea 5 Provincias Imperiales", "Asigna capital y recursos a cada una", "Implementa administración provincial"], [{ icon: "🗺️", name: "Provincias x5" }, { icon: "🏛️", name: "Capitales" }], 3),
  mk("imperio", 3, "Gobernadores Imperiales", "👨‍💼", "Tus virreyes: poder y peligro.", "Nombra gobernadores imperiales con imperium. Dales legiones y tesoro, pero controla su ambición. Un gobernador desleal es un emperador rival.", ["Nombra 5× Gobernadores Imperiales", "Asigna legión y arca a cada uno", "Audita lealtad trimestral"], [{ icon: "👨‍💼", name: "Gobernadores x5" }, { icon: "⚖️", name: "Imperium" }], 3),
  mk("imperio", 4, "Diversidad Cultural I: Lenguas", "🗣️", "Un imperio, muchas lenguas.", "Tu imperio habla 5 lenguas. Impone lengua franca administrativa sin aplastar lenguas locales. Traductores, escuelas, decretos bilingües.", ["Establece Lengua Franca Imperial", "Funda 3× Escuelas de Traductores", "Emite decretos bilingües 10 días sin revuelta lingüística"], [{ icon: "🗣️", name: "Lengua Franca" }, { icon: "📚", name: "Escuelas Traductores" }], 3),
  mk("imperio", 5, "Diversidad Cultural II: Religiones", "☪️", "Un imperio, muchos dioses.", "Católicos, ortodoxos, paganos, minorías. Tolera sin perder cohesión imperial. Gestiona fiesta religiosa que enfrenta a dos cultos.", ["Establece Edicto de Tolerancia", "Resuelve conflicto inter-religioso sin masacre", "Mantén fervor religioso <80% (evita fanatismo)"], [{ icon: "☪️", name: "Tolerancia" }, { icon: "⛪", name: "Edicto Imperial" }], 3),
  mk("imperio", 6, "Derecho Imperial", "⚖️", "Una ley para todos los pueblos.", "Códigos ducales ya no bastan. Promulga Corpus Iuris Imperialis que unifique derecho civil, penal y comercial en todo el continente.", ["Promulga Corpus Iuris Imperialis", "Implementa en 5 provincias", "Forma 10× Jueces Imperiales"], [{ icon: "⚖️", name: "Corpus Imperial" }, { icon: "👨‍⚖️", name: "Jueces x10" }], 4),
  mk("imperio", 7, "Legiones Imperiales", "🦅", "Ejército permanente, leal al emperador.", "Milicias y levas no sostienen imperio. Crea legiones permanentes, acuarteladas, pagadas y leales solo a ti, no a gobernadores.", ["Crea 3× Legiones Permanentes (20 c/u)", "Construye Cuarteles Legionarios", "Establece paga regular sin motines 20 días"], [{ icon: "🦅", name: "Legiones x3" }, { icon: "🏟️", name: "Cuarteles" }], 4),
  mk("imperio", 8, "Red Imperial de Caminos y Puertos", "🛣️", "Que una orden llegue del mar al monte en días.", "Vías imperiales pavimentadas, puentes, puertos profundos y postas cada 20 km. Sin logística no hay imperio, solo mapa pintado.", ["Pavimenta 3 Vías Imperiales principales", "Conecta 2 puertos continentales", "Establece postas cada 20 km (10 postas)"], [{ icon: "🛣️", name: "Vías Imperiales" }, { icon: "⛵", name: "Puertos Profundos" }], 4),
  mk("imperio", 9, "Censo Imperial", "📝", "Cuenta millones para gobernar millones.", "Censo a escala continental: población por cultura, lengua, religión, oficio y tierra. Sin datos no hay tributo justo.", ["Realiza Censo Imperial en 5 provincias", "Clasifica por cultura/lengua/religión", "Establece base tributaria imperial"], [{ icon: "📝", name: "Censo Imperial" }, { icon: "📊", name: "Base Tributaria" }], 4),
  mk("imperio", 10, "Crisis de Sucesión", "⚔️", "El emperador es mortal; el imperio no debe serlo.", "Tu heredero es cuestionado por un gobernador ambicioso. Gestiona crisis sucesoria sin guerra civil: negocia, legitima o aplasta.", ["Resuelve Crisis Sucesoria (evento)", "Evita guerra civil abierta", "Asegura lealtad de 3/5 gobernadores"], [{ icon: "⚔️", name: "Sucesión Asegurada" }, { icon: "👑", name: "Legitimidad" }], 4),
  mk("imperio", 11, "Revuelta Cultural", "🔥", "Una provincia se levanta por su identidad.", "Provincia con cultura oprimida se rebela. ¿Represión, autonomía o asimilación? Cada opción tiene coste imperial. Decide y pacifica en 20 días.", ["Pacifica Revuelta Cultural en 20 días", "Elige: autonomía / represión / asimilación", "Mantén resto del imperio estable"], [{ icon: "🔥", name: "Revuelta Pacíficada" }, { icon: "☮️", name: "Pax Cultural" }], 4),
  mk("imperio", 12, "Reforma Tributaria Imperial", "💰", "Tributo justo para imperio diverso.", "Provincias ricas pagan más, pobres menos; culturas nómadas tributan en ganado, marítimas en pescado. Reforma tributaria que no rompa el imperio.", ["Implementa Tributo Diferenciado por provincia", "Mantén recaudación +15% sin revueltas 15 días", "Centraliza en Tesoro Imperial"], [{ icon: "💰", name: "Reforma Tributaria" }, { icon: "🏦", name: "Tesoro Imperial" }], 4),
  mk("imperio", 13, "Gran Catedral Imperial", "🕍", "Monumento que diga: el imperio es eterno.", "Construye obra monumental que trascienda reinados: catedral, palacio imperial o anfiteatro continental. Legitimidad en piedra.", ["Construye Monumento Imperial (catedral/palacio)", "Emplea 20 trabajadores 30 días", "Inaugura con delegaciones de 5 provincias"], [{ icon: "🕍", name: "Monumento Imperial" }, { icon: "✨", name: "Legitimidad +30%" }], 4),
  mk("imperio", 14, "Universidad Imperial", "🎓", "El imperio que no aprende, cae.", "Funda universidad imperial con facultades de derecho, medicina, ingeniería y lenguas. Forma élite administrativa leal al imperio, no a su provincia.", ["Funda Universidad Imperial", "Crea 4 facultades", "Gradúa 10× Funcionarios Imperiales"], [{ icon: "🎓", name: "Universidad" }, { icon: "📚", name: "Funcionarios x10" }], 5),
  mk("imperio", 15, "Plaga y Resiliencia", "🦠", "Peste continental: tu mayor test como emperador.", "Peste recorre provincias por rutas comerciales. Cuarentenas, hospitales, piras y fe. Salva al imperio sin perder legitimidad por inacción o por crueldad.", ["Sobrevive Peste Imperial 20 días", "Mantén mortalidad <15% y orden >55%", "Distribuye médicos entre provincias"], [{ icon: "🦠", name: "Peste Superada" }, { icon: "🏥", name: "Hospitales Imperiales" }], 5),
  mk("imperio", 16, "Comercio Continental", "🌐", "De imperio cerrado a mercado continental.", "Abre comercio exterior controlado: seda, especias, metales. Equilibra proteccionismo vs apertura sin vaciar tu tesoro.", ["Establece 3 Rutas Comerciales Exteriores", "Genera 2000 monedas/semana de comercio", "Mantén balanza comercial positiva 15 días"], [{ icon: "🌐", name: "Comercio Continental" }, { icon: "💰", name: "2000/sem" }], 5),
  mk("imperio", 17, "Equilibrio de Vasallos", "⚖️", "Que ningún gobernador sea más fuerte que tú.", "Tres gobernadores conspiran. Rota mandos, divide legiones, otorga honores y enfrenta ambiciones sin guerra civil.", ["Desarticula Conspiración de Gobernadores", "Rota 2 gobernadores sin revuelta", "Mantén poder imperial >70%"], [{ icon: "⚖️", name: "Equilibrio" }, { icon: "👁️", name: "Contrainteligencia" }], 5),
  mk("imperio", 18, "Testamento del Emperador", "📜", "Deja instrucciones para cuando no estés.", "Redacta testamento imperial: sucesión, tutela, reparto de legiones y tesoro. Un imperio sin testamento muere con su fundador.", ["Redacta Testamento Imperial (5 cláusulas)", "Gana ratificación de 4/5 gobernadores", "Asegura transición sin crisis inmediata"], [{ icon: "📜", name: "Testamento" }, { icon: "⚖️", name: "Ratificación" }], 5),
  mk("imperio", 19, "Siglo de Oro", "✨", "10 años de paz y prosperidad continental.", "Tu prueba de fuego: 10 años (simulados 30 días) con prosperidad creciente, sin hambrunas, sin revueltas mayores, con 4+ culturas por encima de 65% felicidad.", ["Sostén 30 días con prosperidad creciente", "4+ culturas >65% felicidad", "Cero hambrunas y cero guerras civiles"], [{ icon: "✨", name: "Siglo de Oro" }, { icon: "🕊️", name: "Pax Imperialis" }], 5),
  mk("imperio", 20, "Eternidad del Imperio", "🌟", "Misión final: sostén el imperio 50 años.", "Has llegado al final del camino que empezó con una hoguera. Ahora sostén un imperio continental multi-cultural 50 años (simulados 40 días) con legiones, derecho, tributo y tolerancia. Si lo logras, tu nombre será eterno.", ["Sostén Imperio Continental 40 días estables", "5 provincias >70% lealtad y >60% felicidad", "Transmite corona a heredero sin fragmentación"], [{ icon: "🌟", name: "Título: Emperador Eterno" }, { icon: "🏛️", name: "Imperio Inmortal" }], 5),
];

// Apply initial unlock: first mission of first category available, rest locked
export const getInitialMissionsWithProgress = (): MissionData[] => {
  return INITIAL_MISSIONS.map((m, idx) => {
    if (idx === 0) return { ...m, status: "available" as MissionStatus };
    return { ...m, status: "locked" as MissionStatus };
  });
};

export const getCategoryProgress = (missions: MissionData[], catId: MissionCategoryId) => {
  const catMissions = missions.filter(m => m.categoryId === catId);
  const completed = catMissions.filter(m => m.status === "completed").length;
  const total = catMissions.length;
  const active = catMissions.find(m => m.status === "active" || m.status === "available");
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0, nextMission: active };
};

export const getGlobalProgress = (missions: MissionData[]) => {
  const completed = missions.filter(m => m.status === "completed").length;
  const total = missions.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
};
