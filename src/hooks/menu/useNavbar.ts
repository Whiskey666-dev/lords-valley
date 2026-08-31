import { getBinding, displayKey } from "../../ui/input/KeyBindings";

export interface NavButton {
  id: string;
  label: string;
  active?: boolean;
}

export interface UseNavbarProps {
  onOpenSettings?: () => void;
  onToggleInventory?: () => void;
  onToggleFollowers?: () => void;
  onToggleBuildings?: () => void;
  onToggleMap?: () => void;
  onToggleMissions?: () => void;
  onToggleSkills?: () => void;
  isInventoryOpen?: boolean;
  isSettingsOpen?: boolean;
  isFollowersOpen?: boolean;
  isBuildingsOpen?: boolean;
  isMapOpen?: boolean;
  isMissionsOpen?: boolean;
  isSkillsOpen?: boolean;
}

export function useNavbar({
  onOpenSettings,
  onToggleInventory,
  onToggleFollowers,
  onToggleBuildings,
  onToggleMap,
  onToggleMissions,
  onToggleSkills,
  isInventoryOpen = false,
  isSettingsOpen = false,
  isFollowersOpen = false,
  isBuildingsOpen = false,
  isMapOpen = false,
  isMissionsOpen = false,
}: UseNavbarProps = {}) {
  const dispatchAction = (action: string) => {
    if (action === "config" && onOpenSettings) { onOpenSettings(); return; }
    if (action === "inventory" && onToggleInventory) { onToggleInventory(); return; }
    if (action === "followers" && onToggleFollowers) { onToggleFollowers(); return; }
    if (action === "buildings" && onToggleBuildings) { onToggleBuildings(); return; }
    if (action === "map" && onToggleMap) { onToggleMap(); return; }
    if (action === "missions" && onToggleMissions) { onToggleMissions(); return; }
    if (action === "habilidades" && onToggleSkills) { onToggleSkills(); return; }
    window.dispatchEvent(new CustomEvent(`phaser-action-${action}`));
  };

  const leftButtons: (NavButton & { active?: boolean })[] = [
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
