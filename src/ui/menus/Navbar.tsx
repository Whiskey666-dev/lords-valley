import { getBinding, displayKey } from "../input/KeyBindings";

interface Props {
  onToggleTutorial?: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

/**
 * Navbar.tsx - UI/Menu - Barra superior delgada y modular.
 * Ubicada en src/ui/menus/ como componente puro de interfaz.
 * Izquierda: Seguidores, Edificios | Centro: Construcción | Derecha: Misiones, Inventario, Mapa, Configuración
 * Escalable: añadir botón = añadir entrada en el array correspondiente.
 */
export function Navbar({ onToggleTutorial, zoom = 1, onZoomIn, onZoomOut }: Props) {
  const handle = (action: string) => {
    const evt = `phaser-action-${action}`;
    window.dispatchEvent(new CustomEvent(evt));
  };

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

  const left = [
    { id: "followers", label: "Seguidores" },
    { id: "buildings", label: "Edificios" },
  ];
  const right = [
    { id: "missions", label: `Misiones [${displayKey(getBinding("missions"))}]` },
    { id: "inventory", label: `Inventario [${displayKey(getBinding("inventory"))}]` },
    { id: "map", label: `Mapa [${displayKey(getBinding("map"))}]` },
    { id: "config", label: "Configuración" },
  ];

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
        {left.map(b => (
          <button key={b.id} onClick={() => handle(b.id)} style={btnBase}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Centro - Construcción destacado */}
      <div style={{ display: "flex", justifyContent: "center", flex: "0 0 auto" }}>
        <button
          onClick={() => handle("construction")}
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
        {right.map(b => {
          const isConfig = b.id === "config";
          return (
            <button
              key={b.id}
              onClick={() => (isConfig && onToggleTutorial ? onToggleTutorial() : handle(b.id))}
              style={{
                ...btnBase,
                background: isConfig ? "#1e2a33" : btnBase.background,
                color: isConfig ? "#8cf" : btnBase.color,
                borderColor: isConfig ? "#2a4a66" : "#333",
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
