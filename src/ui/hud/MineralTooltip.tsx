import { useMineralTooltip } from "../../hooks/hud/useMineralTooltip";

export function MineralTooltip() {
  const { data } = useMineralTooltip();

  if (!data) return null;

  const offsetX = 14;
  const offsetY = 18;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
  const tooltipW = 240;
  const tooltipH = 120;
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
        border: `1.5px solid ${data.isSpecial ? "#f59e0b" : data.css}`,
        borderLeft: `4px solid ${data.isSpecial ? "#f59e0b" : data.css}`,
        borderRadius: 8,
        padding: "8px 12px",
        minWidth: 210,
        maxWidth: 270,
        boxShadow: data.isSpecial
          ? "0 8px 28px rgba(0,0,0,0.85), 0 0 16px rgba(245,158,11,0.5)"
          : `0 8px 28px rgba(0,0,0,0.85), 0 0 12px ${data.css}44`,
        backdropFilter: "blur(8px)",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      {data.isSpecial && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(245,158,11,0.2), rgba(234,179,8,0.35), rgba(245,158,11,0.2))",
            border: "1px solid #f59e0b",
            borderRadius: 4,
            padding: "2px 6px",
            color: "#fef08a",
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.5,
            textAlign: "center",
            marginBottom: 6,
            textShadow: "0 0 8px rgba(245,158,11,0.6)",
          }}
        >
          ✨ VETA LEGENDARIA ÚNICA ✨
        </div>
      )}

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

      <div style={{ fontSize: 11, color: "#bbb", lineHeight: 1.35, marginBottom: 6 }}>
        {data.desc}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 10 }}>
        <div
          style={{
            flex: 1,
            background: "#141c27",
            border: "1px solid #26384f",
            borderRadius: 4,
            padding: "3px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#8cb4ff" }}>Altura:</span>
          <strong style={{ color: "#fff" }}>{data.height} clicks</strong>
        </div>
        <div
          style={{
            flex: 1,
            background: data.isSpecial ? "#291b05" : "#122319",
            border: `1px solid ${data.isSpecial ? "#b45309" : "#1f4a2b"}`,
            borderRadius: 4,
            padding: "3px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: data.isSpecial ? "#fbbf24" : "#6ee7b7" }}>Cargas:</span>
          <strong style={{ color: data.isSpecial ? "#fef08a" : "#a7f3d0" }}>
            {data.charges} cargas
          </strong>
        </div>
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
