import { useMineralTooltip } from "../../hooks/hud/useMineralTooltip";

export function MineralTooltip() {
  const { data } = useMineralTooltip();

  if (!data) return null;

  const offsetX = 14;
  const offsetY = 18;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
  const tooltipW = 230;
  const tooltipH = 80;
  let left = data.screenX + offsetX;
  let top = data.screenY + offsetY;
  if (left + tooltipW > viewportW - 8) left = data.screenX - tooltipW - 8;
  if (top + tooltipH > viewportH - 8) top = data.screenY - tooltipH - 8;

  return (
    <div
      className="notranslate"
      translate="no"
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 60,
        pointerEvents: "none",
        background: "#0c1017f5",
        border: `1.5px solid ${data.css}`,
        borderLeft: `4px solid ${data.css}`,
        borderRadius: 8,
        padding: "8px 12px",
        minWidth: 190,
        maxWidth: 250,
        boxShadow: `0 8px 28px rgba(0,0,0,0.85), 0 0 12px ${data.css}44`,
        backdropFilter: "blur(8px)",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: data.css,
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: `0 0 8px ${data.css}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}>
          {data.label}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "#aaa",
            background: "#1a2330",
            padding: "1px 6px",
            borderRadius: 4,
            border: "1px solid #2a384c",
            marginLeft: "auto",
            fontWeight: 700,
          }}
        >
          {data.label.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.35, marginBottom: 6 }}>
        {data.desc}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10 }}>
        <span
          style={{
            color: "#ff6b6b",
            background: "#221111",
            border: "1px solid #442222",
            padding: "2px 6px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ⛔ No transitable
        </span>
        <span style={{ color: "#7a8e9e", fontFamily: "monospace", fontSize: 9 }}>
          Tile [{data.tileX}:{data.tileY}]
        </span>
      </div>
    </div>
  );
}

export default MineralTooltip;
