/**
 * SaveData.ts - Esquemas serializables para persistencia de partida.
 * No contiene referencias a Phaser (Sprite, Scene, Body), solo datos puros serializables a JSON.
 */

export interface SurvivorSaveData {
  id: string;
  nombre: string;
  edad: number;
  profesion: string;
  x: number;
  y: number;
  salud: number;
  maxSalud: number;
  energia: number;
  hambre?: number;
  sed?: number;
  sueno?: number;
  lealtad?: number;
}

export interface DeadDragonSaveData {
  id: string;
  nombre: string;
  isAlly: boolean;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  hogar: { x: number; y: number } | null;
  comportamiento: string;
  funcion: string;
  habilidadesActivas: string[];
  salud: number;
  maxSalud: number;
  energia: number;
  maxEnergia: number;
}

export interface GhostSaveData {
  id: string;
  nombre: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  salud: number;
  maxSalud: number;
  energia: number;
  maxEnergia: number;
}

export interface GameSaveData {
  version: number;
  timestamp: number;
  gameMode: "creative" | "survival";
  playerPos?: { x: number; y: number };
  npcs: SurvivorSaveData[];
  deadDragons: DeadDragonSaveData[];
  ghosts: GhostSaveData[];
}
