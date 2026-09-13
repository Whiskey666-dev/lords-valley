/**
 * TrainingScrolls.ts - Nombres de display de los pergaminos de entrenamiento.
 * La validación (escuelas, alias, consumo, +XP) vive en el backend
 * (módulo player): el servidor es la única fuente de verdad.
 */
import type { SkillCategoryId } from "../hooks/skills/skillsData";

export const TRAINING_XP = 10;

/** Nombre canónico del pergamino por escuela (coincide con el servidor). */
export const TRAINING_SCROLL_NAMES: Record<SkillCategoryId, string> = {
  supervivencia: "Pergamino de Entrenamiento: Supervivencia",
  produccion: "Pergamino de Entrenamiento: Producción",
  politica: "Pergamino de Entrenamiento: Política",
  milicia: "Pergamino de Entrenamiento: Milicia",
  ciencias: "Pergamino de Entrenamiento: Ciencias",
  artes_misticas: "Pergamino de Entrenamiento: Artes Místicas",
};

export function getTrainingScrollName(school: SkillCategoryId): string {
  return TRAINING_SCROLL_NAMES[school];
}
