import { getBinding, displayKey } from "../../ui/input/KeyBindings";

export interface NavButton {
  id: string;
  label: string;
  active?: boolean;
}

export interface UseNavbarProps {
  onToggleCharacter?: () => void;
  onOpenSettings?: () => void;
  onToggleInventory?: () => void;
  onToggleFollowers?: () => void;
  onToggleBuildings?: () => void;
  onToggleMap?: () => void;
  onToggleMissions?: () => void;
  onToggleSkills?: () => void;
  onToggleConstruction?: () => void;
  isCharacterOpen?: boolean;
  isInventoryOpen?: boolean;
  isSettingsOpen?: boolean;
  isFollowersOpen?: boolean;
  isBuildingsOpen?: boolean;
  isMapOpen?: boolean;
  isMissionsOpen?: boolean;
  isSkillsOpen?: boolean;
  isConstructionOpen?: boolean;
}

export function useNavbar({
  onToggleCharacter,
  onOpenSettings,
  onToggleInventory,
  onToggleFollowers,
  onToggleBuildings,
  onToggleMap,
  onToggleMissions,
  onToggleSkills,
  onToggleConstruction,
  isCharacterOpen = false,
  isInventoryOpen = false,
  isSettingsOpen = false,
  isFollowersOpen = false,
  isBuildingsOpen = false,
  isMapOpen = false,
  isMissionsOpen = false,
  isConstructionOpen = false,
}: UseNavbarProps = {}) {
  const dispatchAction = (action: string) => {
    if (action === "character" && onToggleCharacter) { onToggleCharacter(); return; }
    if (action === "config" && onOpenSettings) { onOpenSettings(); return; }
    if (action === "inventory" && onToggleInventory) { onToggleInventory(); return; }
    if (action === "followers" && onToggleFollowers) { onToggleFollowers(); return; }
    if (action === "buildings" && onToggleBuildings) { onToggleBuildings(); return; }
    if (action === "map" && onToggleMap) { onToggleMap(); return; }
    if (action === "missions" && onToggleMissions) { onToggleMissions(); return; }
    if (action === "habilidades" && onToggleSkills) { onToggleSkills(); return; }
    if (action === "construction" && onToggleConstruction) { onToggleConstruction(); return; }
    // usa isConstructionOpen para evitar unused
    void isConstructionOpen;
    window.dispatchEvent(new CustomEvent(`phaser-action-${action}`));
  };

  const leftButtons: (NavButton & { active?: boolean })[] = [
    { id: "character", label: `Personaje [${displayKey(getBinding("stats"))}]`, active: isCharacterOpen },
    { id: "followers", label: "Seguidores", active: isFollowersOpen },
    { id: "buildings", label: "Edificios", active: isBuildingsOpen },
  ];

  const rightButtons: (NavButton & { active?: boolean })[] = [
    { id: "missions", label: `Misiones [${displayKey(getBinding("missions"))}]`, active: isMissionsOpen },
    { id: "inventory", label: `Inventario [${displayKey(getBinding("inventory"))}]`, active: isInventoryOpen },
    { id: "map", label: `Mapa [${displayKey(getBinding("map"))}]`, active: isMapOpen },
    { id: "config", label: "Configuración", active: isSettingsOpen },
  ];

  return { leftButtons, rightButtons, dispatchAction };
}

export default useNavbar;
