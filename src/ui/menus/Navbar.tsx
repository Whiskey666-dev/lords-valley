import { useState } from "react";
import { useNavbar } from "../../hooks/menu/useNavbar";

interface Props {
  onOpenSettings?: () => void;
  onToggleInventory?: () => void;
  onToggleFollowers?: () => void;
  onToggleBuildings?: () => void;
  onToggleMap?: () => void;
  isInventoryOpen?: boolean;
  isSettingsOpen?: boolean;
  isFollowersOpen?: boolean;
  isBuildingsOpen?: boolean;
  isMapOpen?: boolean;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const btnBase: React.CSSProperties = {
  background: "#1e1e1e",
  color: "#bbb",
  border: "1px solid #2e2e2e",
  borderRadius: 5,
  padding: "2px 7px",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

const symbolMap: Record<string, string> = {
  followers: "👥",
  buildings: "🏰",
  construction: "🔨",
  habilidades: "✨",
  missions: "📜",
  inventory: "🎒",
  map: "🗺️",
  config: "⚙️",
};

function HoverBtn({
  id,
  label,
  active,
  activeBg,
  activeColor,
  activeBorder,
  onClick,
}: {
  id: string;
  label: string;
  active?: boolean;
  activeBg?: string;
  activeColor?: string;
  activeBorder?: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const symbol = symbolMap[id] ?? "•";
  // Limpia sufijo [J] para mostrar solo nombre en hover, mantiene tooltip completo
  const cleanLabel = label.replace(/\s*\[.*\]$/, "");
  const isActive = !!active;
  return (
    <button
      key={id}
      onClick={(e) => {
        (e.currentTarget as HTMLButtonElement).blur();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      aria-label={label}
      style={{
        ...btnBase,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: hover ? 4 : 0,
        background: isActive ? (activeBg ?? "#1e3322") : btnBase.background,
        color: isActive ? (activeColor ?? "#00ff88") : btnBase.color,
        borderColor: isActive ? (activeBorder ?? "#2e7d32") : "#2e2e2e",
        minWidth: hover ? undefined : 28,
        padding: hover ? "2px 7px" : "2px 6px",
        transition: "all 0.15s ease",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 12, lineHeight: 1 }}>{symbol}</span>
      {hover && (
        <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{cleanLabel}</span>
      )}
    </button>
  );
}

/**
 * Navbar.tsx - UI/Menu - Barra superior delgada y modular.
 * Ubicada en src/ui/menus/ como componente puro de interfaz desacoplado con useNavbar.
 * Ahora los botones muestran solo símbolo y revelan texto al hover.
 */
export function Navbar({
  onOpenSettings,
  onToggleInventory,
  onToggleFollowers,
  onToggleBuildings,
  onToggleMap,
  isInventoryOpen = false,
  isSettingsOpen = false,
  isFollowersOpen = false,
  isBuildingsOpen = false,
  isMapOpen = false,
  zoom = 1,
  onZoomIn,
  onZoomOut,
}: Props) {
  const { leftButtons, rightButtons, dispatchAction } = useNavbar({
    onOpenSettings,
    onToggleInventory,
    onToggleFollowers,
    onToggleBuildings,
    onToggleMap,
    isInventoryOpen,
    isSettingsOpen,
    isFollowersOpen,
    isBuildingsOpen,
    isMapOpen,
  });

  return (
    <nav
      style={{
        height: 32,
        minHeight: 32,
        background: "#0f0f0f",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        gap: 8,
        flexShrink: 0,
        zIndex: 25,
        flexWrap: "nowrap",
        overflow: "hidden",
      }}
    >
      {/* Izquierda - Zoom + Seguidores/Edificios */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", flex: "0 1 auto", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 3, alignItems: "center", borderRight: "1px solid #222", paddingRight: 6, marginRight: 2 }}>
          <button
            onClick={onZoomOut}
            title="Alejar (0%)"
            aria-label="Alejar"
            style={{ ...btnBase, minWidth: 22, padding: "1px 4px", fontSize: 12, fontWeight: 800, lineHeight: 1 }}
          >
            −
          </button>
          <span style={{ fontSize: 9, color: "#888", minWidth: 28, textAlign: "center", fontWeight: 600 }}>{zoom}%</span>
          <button
            onClick={onZoomIn}
            title="Acercar (100%)"
            aria-label="Acercar"
            style={{ ...btnBase, minWidth: 22, padding: "1px 4px", fontSize: 12, fontWeight: 800, lineHeight: 1 }}
          >
            +
          </button>
        </div>
        {leftButtons.map(b => (
          <HoverBtn
            key={b.id}
            id={b.id}
            label={b.label}
            active={b.active}
            activeBg="#1e3322"
            activeColor="#00ff88"
            activeBorder="#2e7d32"
            onClick={() => dispatchAction(b.id)}
          />
        ))}
      </div>

      {/* Centro - Construcción y Habilidades (mismo tamaño que demás botones) */}
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto", gap: 5 }}>
        <HoverBtn
          id="construction"
          label="Construcción"
          active={true}
          activeBg="#2e7d32"
          activeColor="#fff"
          activeBorder="#3a9a3e"
          onClick={() => dispatchAction("construction")}
        />
        <HoverBtn
          id="habilidades"
          label="Habilidades"
          active={true}
          activeBg="#1e3a5f"
          activeColor="#8ec5ff"
          activeBorder="#2a5a8a"
          onClick={() => dispatchAction("habilidades")}
        />
      </div>

      {/* Derecha */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", flex: "0 1 auto", justifyContent: "flex-end", minWidth: 0 }}>
        {rightButtons.map(b => (
          <HoverBtn
            key={b.id}
            id={b.id}
            label={b.label}
            active={b.active}
            activeBg="#1e2a33"
            activeColor="#8cf"
            activeBorder="#2a4a66"
            onClick={() => dispatchAction(b.id)}
          />
        ))}
      </div>
    </nav>
  );
}
