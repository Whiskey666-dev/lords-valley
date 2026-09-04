import { useTerrainTools } from "../../hooks/terrain/useTerrainTools";
import { terrainHeightManager } from "../../game/world/TerrainHeight";

interface Props {
  onClose: () => void;
}

export function TerrainPanel({ onClose }: Props) {
  const {
    mode,
    brushSize,
    sizeLabel,
    handleSelectMode,
    handleSetSize,
    handleClose,
    handleDeactivate,
  } = useTerrainTools(onClose);

  // Nota: Vista previa Phaser es visible solo cuando el panel está cerrado (panel es modal overlay sobre el canvas)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,
        backgroundColor: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <style>{`
        .t-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .t-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .t-scroll::-webkit-scrollbar-thumb { background: #2a4a3a; border-radius: 3px; }
        .t-scroll::-webkit-scrollbar-thumb:hover { background: #3a6a4a; }
      `}</style>

      <div
        style={{
          width: 560,
          maxWidth: "96vw",
          maxHeight: "92vh",
          background: "#0c1410",
          border: "1px solid #1e3a2a",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            minHeight: 46,
            background: "linear-gradient(180deg, #0b1e16 0%, #07120e 100%)",
            borderBottom: "1px solid #1a3a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, filter: "drop-shadow(0 0 6px rgba(46,125,50,0.5))" }}>⛰️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#e8f5e9", letterSpacing: 0.3, lineHeight: 1 }}>Terreno</div>
              <div style={{ fontSize: 9, color: "#6a9a7a", lineHeight: 1.2 }}>Excava y eleva el suelo isométrico · Tamaño de pincel 1→5</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "#1a0f0f",
              color: "#ff7a7a",
              border: "1px solid #3a1a1a",
              borderRadius: 5,
              padding: "4px 10px",
              fontSize: 10.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            ✕ <span style={{ fontSize: 8, opacity: 0.6 }}>[ESC]</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="t-scroll" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14, background: "#080e0c" }}>
          {/* Opciones 1 y 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Excavar */}
            <button
              onClick={() => handleSelectMode("excavar")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: mode === "excavar" ? "linear-gradient(180deg, #0e2a3a 0%, #0a1e2e 100%)" : "#0e1a14",
                border: `1px solid ${mode === "excavar" ? "#2a7a9a" : "#1e3a2a"}`,
                boxShadow: mode === "excavar" ? "0 0 14px rgba(79,195,247,0.28), inset 0 1px 0 rgba(79,195,247,0.2)" : "none",
                transition: "all 0.14s ease",
              }}
            >
              <span style={{ fontSize: 26, filter: mode === "excavar" ? "drop-shadow(0 0 8px rgba(79,195,247,0.6))" : "none" }}>⛏️</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: mode === "excavar" ? "#4fc3f7" : "#c8e6c9" }}>1. Excavar</span>
              <span style={{ fontSize: 8.5, color: mode === "excavar" ? "#8ecae6" : "#6a9a7a", textAlign: "center", lineHeight: 1.3 }}>
                Baja el nivel del terreno.<br />Desnivel hacia abajo (-1 por clic).
              </span>
              {mode === "excavar" && (
                <span style={{ fontSize: 7, fontWeight: 800, color: "#4fc3f7", background: "rgba(79,195,247,0.14)", border: "1px solid rgba(79,195,247,0.4)", padding: "2px 6px", borderRadius: 10, marginTop: 2 }}>
                  ● ACTIVO — cierra el panel (✕/ESC) y mueve el mouse sobre el terreno
                </span>
              )}
            </button>

            {/* Aumentar */}
            <button
              onClick={() => handleSelectMode("aumentar")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: mode === "aumentar" ? "linear-gradient(180deg, #0e2a14 0%, #0a1e12 100%)" : "#0e1a14",
                border: `1px solid ${mode === "aumentar" ? "#2e7d32" : "#1e3a2a"}`,
                boxShadow: mode === "aumentar" ? "0 0 14px rgba(102,187,106,0.28), inset 0 1px 0 rgba(102,187,106,0.2)" : "none",
                transition: "all 0.14s ease",
              }}
            >
              <span style={{ fontSize: 26, filter: mode === "aumentar" ? "drop-shadow(0 0 8px rgba(102,187,106,0.6))" : "none" }}>🏔️</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: mode === "aumentar" ? "#66bb6a" : "#c8e6c9" }}>2. Aumentar</span>
              <span style={{ fontSize: 8.5, color: mode === "aumentar" ? "#8ec99a" : "#6a9a7a", textAlign: "center", lineHeight: 1.3 }}>
                Eleva el nivel del terreno.<br />Desnivel hacia arriba (+1 por clic).
              </span>
              {mode === "aumentar" && (
                <span style={{ fontSize: 7, fontWeight: 800, color: "#66bb6a", background: "rgba(102,187,106,0.14)", border: "1px solid rgba(102,187,106,0.4)", padding: "2px 6px", borderRadius: 10, marginTop: 2 }}>
                  ● ACTIVO — cierra el panel (✕/ESC) y mueve el mouse sobre el terreno
                </span>
              )}
            </button>
          </div>

          {/* Indicador de pincel activo */}
          {mode && (
            <div style={{ background: mode === "excavar" ? "rgba(79,195,247,0.08)" : "rgba(102,187,106,0.08)", border: `1px solid ${mode === "excavar" ? "rgba(79,195,247,0.22)" : "rgba(102,187,106,0.22)"}`, borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: mode === "excavar" ? "#4fc3f7" : "#66bb6a" }}>{mode === "excavar" ? "⛏️" : "🏔️"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: mode === "excavar" ? "#4fc3f7" : "#66bb6a" }}>
                  Vista previa activa — {mode === "excavar" ? "Excavar" : "Aumentar"} · {sizeLabel}
                </div>
                <div style={{ fontSize: 7.5, color: "#6a9a7a" }}>Cierra este panel para ver la previsualización con el mouse sobre el terreno. Click izquierdo aplica, mantén para pintar, click derecho/ESC cancela.</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: mode === "excavar" ? "#4fc3f7" : "#66bb6a", boxShadow: `0 0 8px ${mode === "excavar" ? "#4fc3f7" : "#66bb6a"}`, animation: "pulse 1.2s infinite" }} />
            </div>
          )}

          {/* 3. Tamaño */}
          <div style={{ background: "#0e1a14", border: "1px solid #1e3a2a", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>📐</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#e8f5e9" }}>3. Tamaño</span>
                <span style={{ fontSize: 7, fontWeight: 700, background: "#1a2a1e", color: "#66bb6a", border: "1px solid #2e7d32", padding: "1px 5px", borderRadius: 3 }}>{sizeLabel}</span>
              </div>
              <span style={{ fontSize: 7, color: "#6a9a7a" }}>Rombos afectados por clic</span>
            </div>

            <div style={{ fontSize: 8, color: "#8ab4a0", lineHeight: 1.4, background: "#0a1a12", border: "1px solid #142a1c", padding: "6px 8px", borderRadius: 5 }}>
              Cambia la cantidad de rombos isométricos (tiles 32 px) que serán afectados por <b style={{ color: "#c8e6c9" }}>Excavar</b> y <b style={{ color: "#c8e6c9" }}>Aumentar</b>. Vista previa en tiempo real al mover el mouse.
            </div>

            {/* Botones 1..5 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {[1,2,3,4,5].map(n => {
                const isActive = brushSize === n;
                const tileCount = n === 1 ? 1 : (n*2-1)*(n*2-1);
                const labelDim = n === 1 ? "1" : `${n*2-1}×${n*2-1}`;
                return (
                  <button
                    key={n}
                    onClick={() => handleSetSize(n)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      padding: "8px 4px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: isActive ? "#1a3320" : "#0a1410",
                      border: `1px solid ${isActive ? "#2e7d32" : "#142a1c"}`,
                      boxShadow: isActive ? "0 0 8px rgba(46,125,50,0.25)" : "none",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? "#66bb6a" : "#8ab4a0" }}>{n}</span>
                    <span style={{ fontSize: 7, fontWeight: 700, color: isActive ? "#a5d6a7" : "#6a9a7a", textAlign: "center", lineHeight: 1.1 }}>{labelDim}<br />{tileCount === 1 ? "1 rombo" : `${tileCount} rombos`}</span>
                    {isActive && <span style={{ width: 14, height: 2, borderRadius: 1, background: "#66bb6a" }} />}
                  </button>
                );
              })}
            </div>

            {/* Slider alternativo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 8, color: "#6a9a7a", whiteSpace: "nowrap" }}>Ajuste fino:</span>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={brushSize}
                onChange={e => handleSetSize(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: "#2e7d32", height: 4 }}
              />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#66bb6a", minWidth: 14, textAlign: "center" }}>{brushSize}</span>
            </div>

            {/* Preview de rejilla rombos */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#070c0a", border: "1px dashed #1e3a2a", borderRadius: 6, padding: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: "#6a9a7a" }}>PREVIEW {brushSize}×{brushSize===1?1:brushSize*2-1}</span>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${brushSize===1?1:brushSize*2-1}, 14px)`,
                  gap: 1,
                  background: "#142a1c",
                  padding: 2,
                  borderRadius: 3,
                }}>
                  {Array.from({ length: brushSize===1 ? 1 : (brushSize*2-1)*(brushSize*2-1) }).map((_, i) => (
                    <div key={i} style={{
                      width: 14, height: 14,
                      background: mode === "excavar" ? "rgba(79,195,247,0.22)" : mode === "aumentar" ? "rgba(102,187,106,0.22)" : "rgba(58,92,70,0.35)",
                      border: `1px solid ${mode === "excavar" ? "rgba(79,195,247,0.6)" : mode === "aumentar" ? "rgba(102,187,106,0.6)" : "rgba(58,92,70,0.6)"}`,
                      transform: "rotate(0deg)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: mode ? "#fff" : "#6a9a7a"
                    }}>
                      {mode === "excavar" ? "▼" : mode === "aumentar" ? "▲" : "◆"}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 6.5, color: "#4a6a5a" }}>{brushSize===1 ? "1 rombo isométrico 64×32" : `${(brushSize*2-1)*(brushSize*2-1)} rombos en cuadrado ${(brushSize*2-1)}×${(brushSize*2-1)}`}</span>
              </div>
            </div>
          </div>

          {/* Tip ayuda */}
          <div style={{ background: "#0a1410", border: "1px solid #142a1c", borderRadius: 6, padding: "8px 9px", display: "flex", gap: 7, alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, flexShrink: 0 }}>💡</span>
            <div style={{ fontSize: 7.5, color: "#6a9a7a", lineHeight: 1.4 }}>
              Selecciona <b style={{ color: "#4fc3f7" }}>Excavar</b> o <b style={{ color: "#66bb6a" }}>Aumentar</b> y cierra el panel para ver la vista previa con el mouse. Verás los rombos afectados (color {mode === "excavar" ? "azul" : mode === "aumentar" ? "verde" : "verde/azul"}) con flechas ▲/▼. Usa <b>Tamaño</b> para cambiar el área (vista previa reactiva). Click izquierdo aplica el desnivel, mantén presionado para pintar continuo. Click derecho o ESC cancela.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ minHeight: 28, background: "#070c10", borderTop: "1px solid #142a1c", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", flexShrink: 0, gap: 6 }}>
          <div style={{ fontSize: 6.5, color: "#4a6a5a", flex: 1 }}>
            {mode ? `Modo ${mode} activo · Niveles -8 → +8 · Paso ${brushSize}` : "Sin herramienta activa — selecciona Excavar o Aumentar"}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {mode && (
              <button
                onClick={handleDeactivate}
                style={{ fontSize: 7, color: "#8ab4a0", background: "#0e1a14", border: "1px solid #1e3a2a", borderRadius: 3, padding: "2px 6px", cursor: "pointer" }}
              >
                ✕ Desactivar
              </button>
            )}
            <button
              onClick={handleClose}
              style={{ fontSize: 7, color: "#c8e6c9", background: "#1a3320", border: "1px solid #2e7d32", borderRadius: 3, padding: "2px 8px", cursor: "pointer", fontWeight: 700 }}
            >
              Cerrar y editar →
            </button>
            <button
              onClick={() => {
                if (confirm("¿Restablecer todo el terreno a nivel 0?")) {
                  terrainHeightManager.reset();
                }
              }}
              style={{ fontSize: 7, color: "#8a6a6a", background: "#1a0f0f", border: "1px solid #3a1a1a", borderRadius: 3, padding: "2px 6px", cursor: "pointer" }}
              title="Borra todo el relieve"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerrainPanel;
