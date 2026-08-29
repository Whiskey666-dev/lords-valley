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

/**
 * Navbar.tsx - UI/Menu - Barra superior delgada y modular.
 * Ubicada en src/ui/menus/ como componente puro de interfaz desacoplado con useNavbar.
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
        {leftButtons.map(b => {
          const isActive = b.active;
          return (
            <button
              key={b.id}
              onClick={(e) => {
                e.currentTarget.blur();
                dispatchAction(b.id);
              }}
              style={{
                ...btnBase,
                background: isActive ? "#1e3322" : btnBase.background,
                color: isActive ? "#00ff88" : btnBase.color,
                borderColor: isActive ? "#2e7d32" : btnBase.border ? (btnBase.border as string).split(" ")[2] : "#2e2e2e",
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Centro - Construcción destacado */}
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto" }}>
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            dispatchAction("construction");
          }}
          title="Construcción"
          style={{
            background: "#2e7d32",
            color: "#fff",
            border: "1px solid #3a9a3e",
            borderRadius: 6,
            padding: "3px 14px",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 1px 4px #00000066",
            letterSpacing: 0.2,
          }}
        >
          Construcción
        </button>
      </div>

      {/* Derecha */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", flex: "0 1 auto", justifyContent: "flex-end", minWidth: 0 }}>
        {rightButtons.map(b => {
          const isActive = b.active;
          return (
            <button
              key={b.id}
              onClick={(e) => {
                e.currentTarget.blur();
                dispatchAction(b.id);
              }}
              style={{
                ...btnBase,
                background: isActive ? "#1e2a33" : btnBase.background,
                color: isActive ? "#8cf" : btnBase.color,
                borderColor: isActive ? "#2a4a66" : "#333",
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
