/**
 * consoleCommands.ts - Catálogo canónico de comandos de la consola del juego.
 * Convención: aliados con "create" (Npc), enemigos con "spawn" (Mobs).
 * Sin repeticiones por cantidad: cada comando con `qty` despliega en el panel
 * un selector con su rango permitido; la cantidad se concatena al comando base.
 * El panel del comando `menu` y el `help` se generan desde aquí.
 */

export type CommandCategory = "Npc" | "Mobs" | "Items" | "Dev";

export interface QtyRange {
  min: number;
  max: number;
}

export interface ConsoleCommandDef {
  /** Texto base; si hay `qty`, la cantidad elegida se concatena (ej: createNpc + 5). */
  command: string;
  description: string;
  category: CommandCategory;
  qty?: QtyRange;
}

export const COMMAND_CATALOG: ConsoleCommandDef[] = [
  { command: "createNpc", description: "Invoca NPC(s) aliado(s) (validado por servidor)", category: "Npc", qty: { min: 1, max: 10 } },
  { command: "createDeadDragon", description: "Invoca Dead Dragon aliado(s) (validado por servidor)", category: "Npc", qty: { min: 1, max: 5 } },
  { command: "spawnDeadDragon", description: "Invoca Dead Dragon enemigo(s) (validado por servidor)", category: "Mobs", qty: { min: 1, max: 5 } },
  { command: "spawnGhost", description: "Invoca Ghost enemigo(s) (validado por servidor)", category: "Mobs", qty: { min: 1, max: 3 } },
  { command: "addItem:Madera", description: "Añade Madera del catálogo (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pan", description: "Añade Pan del catálogo (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Piedra", description: "Añade Piedra del catálogo (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pergamino/Supervivencia", description: "Pergamino de Supervivencia (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pergamino/Produccion", description: "Pergamino de Producción (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pergamino/Politica", description: "Pergamino de Política (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pergamino/Milicia", description: "Pergamino de Milicia (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pergamino/Ciencias", description: "Pergamino de Ciencias (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "addItem:Pergamino/ArtesMisticas", description: "Pergamino de Artes Místicas (validado)", category: "Items", qty: { min: 1, max: 9 } },
  { command: "CreativeMode", description: "Los enemigos ignoran al jugador (servidor)", category: "Dev" },
  { command: "SurvivalMode", description: "Los enemigos detectan y atacan (servidor)", category: "Dev" },
  { command: "fog toggle", description: "Alterna la niebla de guerra (visual local)", category: "Dev" },
  { command: "fog on", description: "Activa la niebla (visual local)", category: "Dev" },
  { command: "fog off", description: "Desactiva la niebla (visual local)", category: "Dev" },
  { command: "fog clear", description: "Reinicia la niebla (visual local)", category: "Dev" },
  { command: "fog reveal", description: "Revela todo el mapa (visual local)", category: "Dev" },
  { command: "fog radius 300", description: "Radio de visión 32-2000px (visual local)", category: "Dev" },
  { command: "GodModeOn", description: "Inmune a daño/hambre/sed, todo al 100% (servidor)", category: "Dev" },
  { command: "GodModeOff", description: "Cancela el GodMode (servidor)", category: "Dev" },
  { command: "FullMode", description: "Nivel máximo en las 48 habilidades (servidor)", category: "Dev" },
  { command: "help", description: "Muestra el resumen de comandos", category: "Dev" },
];

export const COMMAND_CATEGORIES: CommandCategory[] = ["Npc", "Mobs", "Items", "Dev"];

export function commandsByCategory(category: CommandCategory): ConsoleCommandDef[] {
  return COMMAND_CATALOG.filter((c) => c.category === category);
}
