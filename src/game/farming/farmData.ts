/**
 * Definición de cultivos y etapas de crecimiento con sprites individuales (384 x 64 px, 6 frames de 64x64 px).
 * Distribución de frames por cultivo:
 * - Frame 0 (0-63px): Semilla enterrada / brote oculto
 * - Frame 1 (64-127px): Etapa 1 (Brote emergente)
 * - Frame 2 (128-191px): Etapa 2 (Crecimiento medio / vegetativo)
 * - Frame 3 (192-255px): Etapa 3 (Maduración avanzada / floración)
 * - Frame 4 (256-319px): Etapa 4 (Cultivo maduro listo para cosechar)
 * - Frame 5 (320-383px): Cosechado / vacío
 */

import albahacaImg from "../../assets/sprites/farm seeds/albahaca.png";
import algodonImg from "../../assets/sprites/farm seeds/algodon.png";
import arrozImg from "../../assets/sprites/farm seeds/arroz.png";
import bananosImg from "../../assets/sprites/farm seeds/bananos.png";
import cacaoImg from "../../assets/sprites/farm seeds/cacao.png";
import cafeImg from "../../assets/sprites/farm seeds/cafe.png";
import cauchoImg from "../../assets/sprites/farm seeds/caucho.png";
import cañaDulceImg from "../../assets/sprites/farm seeds/cañadulce.png";
import cerezoImg from "../../assets/sprites/farm seeds/cerezo.png";
import chileImg from "../../assets/sprites/farm seeds/chile.png";
import ciruelaImg from "../../assets/sprites/farm seeds/ciruela.png";
import cocoVerdeImg from "../../assets/sprites/farm seeds/cocoVerde.png";
import coliflorImg from "../../assets/sprites/farm seeds/coliflor.png";
import fresasImg from "../../assets/sprites/farm seeds/fresas.png";
import hongosImg from "../../assets/sprites/farm seeds/hongos.png";
import jazminImg from "../../assets/sprites/farm seeds/jazmin.png";
import limonImg from "../../assets/sprites/farm seeds/limon.png";
import maizImg from "../../assets/sprites/farm seeds/maiz.png";
import melocotonImg from "../../assets/sprites/farm seeds/melocoton.png";
import melonAmarilloImg from "../../assets/sprites/farm seeds/melonAmarillo.png";
import patataImg from "../../assets/sprites/farm seeds/patata.png";
import piñaImg from "../../assets/sprites/farm seeds/piña.png";
import platanoImg from "../../assets/sprites/farm seeds/platano.png";
import rosasImg from "../../assets/sprites/farm seeds/rosas.png";
import sandiaImg from "../../assets/sprites/farm seeds/sandia.png";
import tomatesImg from "../../assets/sprites/farm seeds/tomates.png";
import trigoImg from "../../assets/sprites/farm seeds/trigo.png";
import uvasImg from "../../assets/sprites/farm seeds/uvas.png";
import zanahoriaImg from "../../assets/sprites/farm seeds/zanahoria.png";

export interface CropDefinition {
  id: string;
  name: string;
  icon: string;
  category: "cereal" | "vegetal" | "fruta" | "industrial" | "especial";
  categoryLabel: string;
  description: string;
  spriteSrc: string;
  baseYield: {
    name: string;
    icon: string;
    amount: number;
    unit: string;
  };
}

export const CROPS_CATALOG: CropDefinition[] = [
  // ── Cereales ──
  {
    id: "trigo",
    name: "Trigo Noble",
    icon: "🌾",
    category: "cereal",
    categoryLabel: "Cereal Básico",
    description: "La espina dorsal de la economía señorial. Base para moler harina y hornear pan en los hornos del reino.",
    spriteSrc: trigoImg,
    baseYield: { name: "Gavillas de Trigo", icon: "🌾", amount: 20, unit: "fardos" },
  },
  {
    id: "maiz",
    name: "Maíz Dorado",
    icon: "🌽",
    category: "cereal",
    categoryLabel: "Cereal Básico",
    description: "Grano nutritivo de alto rendimiento para alimentar a la población laboriosa y sostener al ganado.",
    spriteSrc: maizImg,
    baseYield: { name: "Mazorcas de Maíz", icon: "🌽", amount: 16, unit: "kg" },
  },
  {
    id: "arroz",
    name: "Arroz Imperial",
    icon: "🌾",
    category: "cereal",
    categoryLabel: "Cereal Húmedo",
    description: "Cereal prolífico que rinde abundantemente y constituye una reserva calórica esencial.",
    spriteSrc: arrozImg,
    baseYield: { name: "Costales de Arroz", icon: "🌾", amount: 30, unit: "kg" },
  },

  // ── Hortalizas y Vegetales ──
  {
    id: "tomates",
    name: "Tomate Rojo",
    icon: "🍅",
    category: "vegetal",
    categoryLabel: "Hortaliza de Huerta",
    description: "Tomates jugosos y carnosos que enriquecen los guisos comunales en tabernas y cuarteles.",
    spriteSrc: tomatesImg,
    baseYield: { name: "Cajón de Tomates", icon: "🍅", amount: 25, unit: "kg" },
  },
  {
    id: "zanahoria",
    name: "Zanahoria de Tierra",
    icon: "🥕",
    category: "vegetal",
    categoryLabel: "Hortaliza de Raíz",
    description: "Raíz dulce y resistente al frío, idónea para almacenar en bodegas y sótanos.",
    spriteSrc: zanahoriaImg,
    baseYield: { name: "Saco de Zanahorias", icon: "🥕", amount: 24, unit: "kg" },
  },
  {
    id: "patata",
    name: "Patata de Altura",
    icon: "🥔",
    category: "vegetal",
    categoryLabel: "Tubérculo",
    description: "Tubérculo de extraordinario rendimiento por metro cuadrado, sustento vital del pueblo llano.",
    spriteSrc: patataImg,
    baseYield: { name: "Sacos de Patatas", icon: "🥔", amount: 32, unit: "kg" },
  },
  {
    id: "coliflor",
    name: "Coliflor Blanca",
    icon: "🥦",
    category: "vegetal",
    categoryLabel: "Hortaliza de Huerto",
    description: "Hortaliza densa y rica en nutrientes para sopas calientes durante las estaciones frías.",
    spriteSrc: coliflorImg,
    baseYield: { name: "Cestas de Coliflor", icon: "🥦", amount: 18, unit: "kg" },
  },
  {
    id: "chile",
    name: "Chile Picante",
    icon: "🌶️",
    category: "vegetal",
    categoryLabel: "Especia Picante",
    description: "Pimientos picantes para sazonar raciones de los soldados y preservar embutidos y carnes.",
    spriteSrc: chileImg,
    baseYield: { name: "Sarta de Chiles", icon: "🌶️", amount: 14, unit: "kg" },
  },
  {
    id: "hongos",
    name: "Champiñones de Cueva",
    icon: "🍄",
    category: "vegetal",
    categoryLabel: "Hongos y Esporas",
    description: "Cultivo que prospera en suelo fértil y húmedo sin depender directamente de la luz solar.",
    spriteSrc: hongosImg,
    baseYield: { name: "Cesta de Champiñones", icon: "🍄", amount: 15, unit: "kg" },
  },

  // ── Frutas ──
  {
    id: "fresas",
    name: "Fresas Silvestres",
    icon: "🍓",
    category: "fruta",
    categoryLabel: "Fruta Selecta",
    description: "Fruto dulce de cosecha rápida que sube la felicidad y la moral del asentamiento.",
    spriteSrc: fresasImg,
    baseYield: { name: "Cestas de Fresas", icon: "🍓", amount: 12, unit: "cestas" },
  },
  {
    id: "uvas",
    name: "Uvas de Viñedo",
    icon: "🍇",
    category: "fruta",
    categoryLabel: "Viñedo Noble",
    description: "Racimos de uva noble para prensar vino añejo en las bodegas del castillo.",
    spriteSrc: uvasImg,
    baseYield: { name: "Canastos de Uva", icon: "🍇", amount: 28, unit: "kg" },
  },
  {
    id: "sandia",
    name: "Sandía Gigante",
    icon: "🍉",
    category: "fruta",
    categoryLabel: "Fruta de Verano",
    description: "Enorme fruta repleta de agua dulce que calma la sed de los jornaleros en las faenas agrícolas.",
    spriteSrc: sandiaImg,
    baseYield: { name: "Sandías Maduras", icon: "🍉", amount: 6, unit: "uds" },
  },
  {
    id: "melonAmarillo",
    name: "Melón Amarillo",
    icon: "🍈",
    category: "fruta",
    categoryLabel: "Fruta Refrescante",
    description: "Melón de piel dorada y pulpa fragante, codiciado en mercados de verano.",
    spriteSrc: melonAmarilloImg,
    baseYield: { name: "Melones Amarillos", icon: "🍈", amount: 8, unit: "uds" },
  },
  {
    id: "melocoton",
    name: "Melocotón Real",
    icon: "🍑",
    category: "fruta",
    categoryLabel: "Fruta Selecta",
    description: "Fruta aterciopelada y jugosa reservada para banquetes señoriales y repostería fina.",
    spriteSrc: melocotonImg,
    baseYield: { name: "Caja de Melocotones", icon: "🍑", amount: 14, unit: "cajas" },
  },
  {
    id: "cerezo",
    name: "Cerezo Rojo",
    icon: "🍒",
    category: "fruta",
    categoryLabel: "Fruta Silvestre",
    description: "Cerezas rojas de sabor intenso ideales para conservas, tartas reales y licores finos.",
    spriteSrc: cerezoImg,
    baseYield: { name: "Cestos de Cerezas", icon: "🍒", amount: 12, unit: "cestos" },
  },
  {
    id: "ciruela",
    name: "Ciruela Silvestre",
    icon: "🫐",
    category: "fruta",
    categoryLabel: "Fruta Selecta",
    description: "Fruta dulce y carnosa que se consume fresca o se deshidrata para raciones de invierno.",
    spriteSrc: ciruelaImg,
    baseYield: { name: "Cesto de Ciruelas", icon: "🫐", amount: 16, unit: "kg" },
  },
  {
    id: "limon",
    name: "Limonero Cítrico",
    icon: "🍋",
    category: "fruta",
    categoryLabel: "Cítricos",
    description: "Limones frescos ricos en vitamina para prevenir enfermedades en caravanas y tropas.",
    spriteSrc: limonImg,
    baseYield: { name: "Cestas de Limones", icon: "🍋", amount: 18, unit: "kg" },
  },
  {
    id: "piña",
    name: "Piña Imperial",
    icon: "🍍",
    category: "fruta",
    categoryLabel: "Exótico de Lujo",
    description: "Cultivo tropical exótico de altísimo valor comercial en rutas marítimas.",
    spriteSrc: piñaImg,
    baseYield: { name: "Piñas Maduras", icon: "🍍", amount: 8, unit: "uds" },
  },
  {
    id: "bananos",
    name: "Bananos Dulces",
    icon: "🍌",
    category: "fruta",
    categoryLabel: "Fruta Tropical",
    description: "Racimos dorados de fácil digestión que aportan energía inmediata a canteros y leñadores.",
    spriteSrc: bananosImg,
    baseYield: { name: "Racimos de Banano", icon: "🍌", amount: 14, unit: "racimos" },
  },
  {
    id: "platano",
    name: "Plátano Tropical",
    icon: "🍌",
    category: "fruta",
    categoryLabel: "Fruta Tropical",
    description: "Plátanos consistentes para cocinar, asar y alimentar contingentes de expedición.",
    spriteSrc: platanoImg,
    baseYield: { name: "Racimos de Plátano", icon: "🍌", amount: 14, unit: "racimos" },
  },
  {
    id: "cocoVerde",
    name: "Coco Verde",
    icon: "🥥",
    category: "fruta",
    categoryLabel: "Palmera Costera",
    description: "Palmera que provee agua refrescante, pulpa alimenticia y fibras resistentes para cabos.",
    spriteSrc: cocoVerdeImg,
    baseYield: { name: "Cocos Verdes", icon: "🥥", amount: 10, unit: "uds" },
  },

  // ── Industriales y Materias Primas ──
  {
    id: "algodon",
    name: "Algodón Suave",
    icon: "☁️",
    category: "industrial",
    categoryLabel: "Fibra Textil",
    description: "Capullos de fibra vegetal indispensables para telares, hilaturas y vestidos.",
    spriteSrc: algodonImg,
    baseYield: { name: "Balas de Algodón", icon: "☁️", amount: 22, unit: "fardos" },
  },
  {
    id: "cañadulce",
    name: "Caña Dulce",
    icon: "🎋",
    category: "industrial",
    categoryLabel: "Cultivo Industrial",
    description: "Tallos jugosos y sacarosos para refinar azúcar, melazas densas y aguardientes.",
    spriteSrc: cañaDulceImg,
    baseYield: { name: "Cañas Dulces", icon: "🎋", amount: 18, unit: "haces" },
  },
  {
    id: "caucho",
    name: "Árbol de Caucho",
    icon: "🥣",
    category: "industrial",
    categoryLabel: "Materia Prima",
    description: "Resina y látex elástico para sellar embarcaciones, aislar calzados y crear adhesivos.",
    spriteSrc: cauchoImg,
    baseYield: { name: "Cuencos de Caucho", icon: "🥣", amount: 12, unit: "cuencos" },
  },

  // ── Especiales, Boticario y Ornamentales ──
  {
    id: "cafe",
    name: "Café de Montaña",
    icon: "☕",
    category: "especial",
    categoryLabel: "Estimulante",
    description: "Granos aromáticos que triplican la productividad y el vigor de trabajadores y sabios.",
    spriteSrc: cafeImg,
    baseYield: { name: "Sacos de Granos de Café", icon: "☕", amount: 12, unit: "sacos" },
  },
  {
    id: "cacao",
    name: "Cacao del Valle",
    icon: "🍫",
    category: "especial",
    categoryLabel: "Mercancía de Lujo",
    description: "Mazorcas de cacao de aroma exquisito utilizadas como moneda señorial y chocolates finos.",
    spriteSrc: cacaoImg,
    baseYield: { name: "Mazorcas de Cacao", icon: "🍫", amount: 10, unit: "uds" },
  },
  {
    id: "albahaca",
    name: "Albahaca Fragante",
    icon: "🌿",
    category: "especial",
    categoryLabel: "Boticario y Aromática",
    description: "Hierba aromática requerida por médicos y boticarios para bálsamos calmantes e infusiones.",
    spriteSrc: albahacaImg,
    baseYield: { name: "Manojos de Albahaca", icon: "🌿", amount: 18, unit: "manojos" },
  },
  {
    id: "rosas",
    name: "Rosas de Damasco",
    icon: "🌹",
    category: "especial",
    categoryLabel: "Cultivo Ornamental",
    description: "Pétalos perfumados indispensables para esencias, diplomacia señorial y medicina.",
    spriteSrc: rosasImg,
    baseYield: { name: "Rosas Fragantes", icon: "🌹", amount: 10, unit: "ramos" },
  },
  {
    id: "jazmin",
    name: "Jazmín de Templo",
    icon: "💮",
    category: "especial",
    categoryLabel: "Flores Sagradas",
    description: "Flores blancas puras para ceremonias, té relajante y aromaterapia en la corte.",
    spriteSrc: jazminImg,
    baseYield: { name: "Flores de Jazmín", icon: "💮", amount: 14, unit: "manojos" },
  },
];

// Medidas exactas de cada frame en los sprites individuales (384x64 px -> 6 frames de 64x64 px)
export const CROP_FRAME_WIDTH = 64;
export const CROP_FRAME_HEIGHT = 64;
export const CROP_TOTAL_FRAMES = 6;

/**
 * Reglas de crecimiento de 24 horas:
 * - Total ciclo: 24 horas (86,400,000 ms)
 * - Horas 0 a 6 (0h a 5h 59m): Etapa 0 (Brote enterrado / oculto, solo se ve la tierra)
 * - Horas 6 a 12 (6h a 11h 59m): Etapa 1 (Frame 1 del cultivo)
 * - Horas 12 a 18 (12h a 17h 59m): Etapa 2 (Frame 2)
 * - Horas 18 a 24 (18h a 23h 59m): Etapa 3 (Frame 3)
 * - Hora 24+: Etapa 4 (Frame 4, ¡Listo para cosechar!)
 */
export interface CropGrowthStatus {
  stage: 0 | 1 | 2 | 3 | 4;
  isVisible: boolean; // false si stage === 0
  frameNumber: 0 | 1 | 2 | 3 | 4;
  hoursElapsed: number;
  minutesElapsed: number;
  percent: number; // 0 a 100
  isReady: boolean;
  hoursToNextStage: number;
  timeRemainingFormatted: string;
  stageName: string;
}

export const CYCLE_TOTAL_HOURS = 24;
export const CYCLE_TOTAL_MS = CYCLE_TOTAL_HOURS * 60 * 60 * 1000;

export function calculateGrowthStatus(plantedAt: number, simulatedOffsetMs = 0): CropGrowthStatus {
  const now = Date.now();
  const elapsedMs = Math.max(0, now - plantedAt + simulatedOffsetMs);
  const hoursElapsed = elapsedMs / (1000 * 60 * 60);
  const minutesElapsed = Math.floor(elapsedMs / (1000 * 60));
  const percent = Math.min(100, Math.round((hoursElapsed / CYCLE_TOTAL_HOURS) * 100));

  let stage: 0 | 1 | 2 | 3 | 4 = 0;
  let isVisible = false;
  let isReady = false;
  let hoursToNextStage = 0;
  let stageName = "Semilla Bajo Tierra (Brote Invisible)";

  if (hoursElapsed < 6) {
    stage = 0;
    isVisible = false;
    hoursToNextStage = Math.max(0, 6 - hoursElapsed);
    stageName = "Brote Bajo Tierra (0h - 6h)";
  } else if (hoursElapsed < 12) {
    stage = 1;
    isVisible = true;
    hoursToNextStage = Math.max(0, 12 - hoursElapsed);
    stageName = "Brote Emergente (Frame 1, 6h - 12h)";
  } else if (hoursElapsed < 18) {
    stage = 2;
    isVisible = true;
    hoursToNextStage = Math.max(0, 18 - hoursElapsed);
    stageName = "Crecimiento Medio (Frame 2, 12h - 18h)";
  } else if (hoursElapsed < 24) {
    stage = 3;
    isVisible = true;
    hoursToNextStage = Math.max(0, 24 - hoursElapsed);
    stageName = "Maduración Avanzada (Frame 3, 18h - 24h)";
  } else {
    stage = 4;
    isVisible = true;
    isReady = true;
    hoursToNextStage = 0;
    stageName = "¡Cultivo Maduro Listo para Cosechar! (Frame 4, 24h+)";
  }

  // Formato de tiempo restante para la cosecha total
  const remainingTotalHours = Math.max(0, CYCLE_TOTAL_HOURS - hoursElapsed);
  const remH = Math.floor(remainingTotalHours);
  const remM = Math.floor((remainingTotalHours - remH) * 60);
  const timeRemainingFormatted = isReady
    ? "¡Listo!"
    : `${remH}h ${remM.toString().padStart(2, "0")}m restantes`;

  return {
    stage,
    isVisible,
    frameNumber: stage,
    hoursElapsed,
    minutesElapsed,
    percent,
    isReady,
    hoursToNextStage,
    timeRemainingFormatted,
    stageName,
  };
}
