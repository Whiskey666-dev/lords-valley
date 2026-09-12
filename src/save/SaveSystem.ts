import type { GameSaveData, SurvivorSaveData, DeadDragonSaveData, GhostSaveData } from "./SaveData";
import type { Survivor } from "../characters/Survivor";
import type { DeadDragon } from "../characters/DeadDragon";
import type { Ghost } from "../characters/Ghost";

const SAVE_VERSION = 1;

/**
 * Obtiene la clave de almacenamiento adecuada para el settlement o jugador activo.
 */
function getStorageKey(): string {
  try {
    const settlementId = localStorage.getItem("settlementId");
    if (settlementId) return `lordsvalley_save_${settlementId}`;
    const playerId = localStorage.getItem("playerId");
    if (playerId) return `lordsvalley_save_${playerId}`;
  } catch {}
  return "lordsvalley_save_default";
}

export class SaveSystem {
  /**
   * Guarda los datos de la partida en localStorage de forma segura.
   */
  public static save(data: GameSaveData): boolean {
    try {
      const key = getStorageKey();
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.warn("[SaveSystem] Error al guardar partida en localStorage", e);
      return false;
    }
  }

  /**
   * Carga la partida guardada desde localStorage.
   */
  public static load(): GameSaveData | null {
    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as GameSaveData;
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (e) {
      console.warn("[SaveSystem] Error al cargar partida desde localStorage", e);
      return null;
    }
  }

  /**
   * Elimina la partida guardada.
   */
  public static clear(): void {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
    } catch {}
  }

  /**
   * Serializa un Survivor a datos puros.
   */
  public static serializeSurvivor(n: Survivor): SurvivorSaveData | null {
    if (!n) return null;
    const x = n.sprite?.x ?? 0;
    const y = n.sprite?.y ?? 0;
    return {
      id: n.id,
      nombre: n.nombre,
      edad: n.edad,
      profesion: n.profesion,
      x: Math.round(x),
      y: Math.round(y),
      salud: n.stats.salud,
      maxSalud: n.stats.maxSalud,
      energia: n.stats.energia,
      hambre: n.needs.hambre,
      sed: n.needs.sed,
      sueno: n.needs.sueno,
      lealtad: n.loyalty.nivel,
    };
  }

  /**
   * Serializa un DeadDragon a datos puros.
   */
  public static serializeDeadDragon(d: DeadDragon): DeadDragonSaveData | null {
    if (!d) return null;
    const ui = d.getPaqueteUI();
    const x = d.sprite?.x ?? ui.x ?? 0;
    const y = d.sprite?.y ?? ui.y ?? 0;
    return {
      id: d.id,
      nombre: d.nombre,
      isAlly: d.isAlly,
      x: Math.round(x),
      y: Math.round(y),
      homeX: Math.round(ui.hogarPos?.x ?? x),
      homeY: Math.round(ui.hogarPos?.y ?? y),
      hogar: ui.hogar ? { x: Math.round(ui.hogar.x), y: Math.round(ui.hogar.y) } : null,
      comportamiento: ui.comportamiento,
      funcion: ui.funcion,
      habilidadesActivas: ui.habilidadesActivas,
      salud: d.stats.salud,
      maxSalud: d.stats.maxSalud,
      energia: d.stats.energia,
      maxEnergia: d.stats.maxEnergia,
    };
  }

  /**
   * Serializa un Ghost a datos puros.
   */
  public static serializeGhost(g: Ghost): GhostSaveData | null {
    if (!g || !g.estaVivo) return null;
    const x = g.sprite?.x ?? g.homeX ?? 0;
    const y = g.sprite?.y ?? g.homeY ?? 0;
    return {
      id: g.id,
      nombre: g.nombre,
      x: Math.round(x),
      y: Math.round(y),
      homeX: Math.round(g.homeX || x),
      homeY: Math.round(g.homeY || y),
      salud: g.salud,
      maxSalud: g.maxSalud,
      energia: g.energia,
      maxEnergia: g.maxEnergia,
    };
  }

  /**
   * Guarda de forma completa el estado actual de la partida.
   */
  public static saveGameState(
    playerPos: { x: number; y: number } | undefined,
    npcs: Survivor[],
    deadDragons: DeadDragon[],
    ghosts: Ghost[],
    gameMode: "creative" | "survival" = "survival"
  ): boolean {
    const saveObj: GameSaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      gameMode,
      playerPos: playerPos ? { x: Math.round(playerPos.x), y: Math.round(playerPos.y) } : undefined,
      npcs: npcs.map(n => SaveSystem.serializeSurvivor(n)).filter(Boolean) as SurvivorSaveData[],
      deadDragons: deadDragons.map(d => SaveSystem.serializeDeadDragon(d)).filter(Boolean) as DeadDragonSaveData[],
      ghosts: ghosts.filter(g => g.estaVivo).map(g => SaveSystem.serializeGhost(g)).filter(Boolean) as GhostSaveData[],
    };

    return SaveSystem.save(saveObj);
  }
}
