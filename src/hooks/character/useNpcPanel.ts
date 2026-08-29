import { useState } from "react";

export type NpcTab = "inventario" | "atributos" | "profesiones" | "estado";

export interface NpcPanelData {
  id: string;
  name: string;
  profession: string;
  loyalty: number;
  health: number;
  edad?: number;
  // core fields
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: number;
  attributes?: {
    strength: number;
    agility: number;
    endurance: number;
    intelligence: number;
    charisma: number;
    perception: number;
  };
  professions?: {
    type: string;
    level: number;
    experience: string;
    specializations: string[];
  }[];
  needs?: {
    hunger: number;
    thirst: number;
    fatigue: number;
    health: number;
    sanity: number;
    safety: number;
  };
  isLoyalAbsolute?: boolean;
  lvyBalance?: string;
  inventory?: {
    id: string;
    type: string;
    quantity: string;
    weight: number;
  }[];
  socialLinks?: {
    targetSurvivorId: string;
    type: string;
    affinity: number;
  }[];
  positionX?: number;
  positionY?: number;
  // mock fallback
  traits?: string[];
  personalidad?: string;
  temperamento?: string;
  habilidad?: string;
  gustos?: string;
  inventario?: string[];
  equipamiento?: string[];
  habilidades?: string[];
  stats?: { salud: number; maxSalud: number; energia: number };
  isPlayer?: boolean;
  username?: string;
}

export function useNpcPanel(npc: NpcPanelData) {
  const [tab, setTab] = useState<NpcTab>("estado");

  const isCore = !!(npc.attributes || npc.professions || npc.needs);
  const displayName = npc.name || `${npc.firstName ?? ""} ${npc.lastName ?? ""}`.trim() || "Desconocido";
  const displayProfession = npc.profession || npc.professions?.[0]?.type || "—";
  const displayLoyalty = npc.loyalty ?? 0;
  const displayHealth = npc.health ?? npc.needs?.health ?? 0;
  const maxHealth = 100;

  const hunger = npc.needs?.hunger ?? (npc as any).needs?.hambre ?? 0;
  const thirst = npc.needs?.thirst ?? (npc as any).needs?.sed ?? 0;
  const fatigue = npc.needs?.fatigue ?? (npc as any).needs?.sueno ?? 0;

  const formattedLvy = npc.lvyBalance
    ? (BigInt(npc.lvyBalance) / BigInt(10) ** BigInt(18)).toString()
    : null;

  return {
    tab,
    setTab,
    isCore,
    displayName,
    displayProfession,
    displayLoyalty,
    displayHealth,
    maxHealth,
    hunger,
    thirst,
    fatigue,
    formattedLvy,
  };
}

export default useNpcPanel;
