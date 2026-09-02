import React from "react";
import { type CropDefinition } from "../../game/farming/farmData";
import { type FarmPlotStatus } from "../../game/farming/FarmPlotManager";
import { useCropPlantingModal } from "../../hooks/farming/useCropPlantingModal";

interface Props {
  plotStatus: FarmPlotStatus | null;
  onClose: () => void;
}

/**
 * Componente que muestra con precisión el frame de un cultivo (6 frames de 64x64 px en horizontal)
 */
export const CropSpriteFrame: React.FC<{
  crop: CropDefinition;
  stage: 1 | 2 | 3 | 4;
  targetWidth?: number;
  targetHeight?: number;
}> = ({ crop, stage, targetWidth = 40, targetHeight = 40 }) => {
  // El spritesheet tiene 6 frames de 64x64px (384x64px en total).
  // stage (1..4) se ubica en el frame de índice stage.
  const bgW = targetWidth * 6;
  const bgH = targetHeight;
  const bgPosX = stage * targetWidth;

  return (
    <div
      style={{
        width: targetWidth,
        height: targetHeight,
        backgroundImage: `url(${crop.spriteSrc})`,
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `-${bgPosX}px 0px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
};

export const CropPlantingModal: React.FC<Props> = ({ plotStatus, onClose }) => {
  const {
    currentPlot,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    harvestNotice,
    filteredCrops,
    handlePlant,
    handleHarvest,
    handleAdvanceTime,
    handleClearCrop,
    handleRemovePlot,
  } = useCropPlantingModal(plotStatus, onClose);

  if (!currentPlot) return null;

  const crop = currentPlot.crop;
  const growth = currentPlot.growth;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .crop-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .crop-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
        }
        .crop-scroll::-webkit-scrollbar-thumb {
          background: #4a301a;
          border-radius: 3px;
        }
        .crop-scroll::-webkit-scrollbar-thumb:hover {
          background: #7a502c;
        }
        @keyframes pulseHarvest {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }
      `}</style>

      <div
        style={{
          width: "980px",
          maxWidth: "96vw",
          maxHeight: "88vh",
          backgroundColor: "#130f0b",
          border: "1px solid #4a301a",
          borderRadius: 10,
          boxShadow: "0 25px 60px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Barra Superior ── */}
        <div
          style={{
            height: 48,
            backgroundColor: "#1c140e",
            borderBottom: "1px solid #3d2614",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌱</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#f5d29a", letterSpacing: "0.5px" }}>
              Parcela de Cultivo
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                backgroundColor: "#2a1c12",
                color: "#c29363",
                border: "1px solid #442d1e",
              }}
            >
              Casilla [{currentPlot.tileX}, {currentPlot.tileY}]
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleRemovePlot}
              style={{
                background: "transparent",
                border: "1px solid #5c2828",
                color: "#e57373",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
              title="Elimina esta parcela de cultivo del terreno"
            >
              🗑️ Desmantelar
            </button>

            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#8c6b4e",
                fontSize: 20,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notificación de cosecha */}
        {harvestNotice && (
          <div
            style={{
              backgroundColor: "#2e7d32",
              color: "#ffffff",
              textAlign: "center",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {harvestNotice}
          </div>
        )}

        {/* ── Contenido Principal ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} className="crop-scroll">
          {/* SI NO HAY CULTIVO: Catálogo de Siembra */}
          {!crop || !growth ? (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  backgroundColor: "#1e150f",
                  padding: "14px 18px",
                  borderRadius: 8,
                  border: "1px solid #3d2614",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#f0dfcc" }}>Tierra Arada y Fértil</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9e7f63" }}>
                    Selecciona una semilla del catálogo para comenzar el ciclo de crecimiento de 24 horas.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Buscar cultivo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      backgroundColor: "#0d0a07",
                      border: "1px solid #3d2614",
                      color: "#f5e4d0",
                      padding: "6px 12px",
                      borderRadius: 4,
                      fontSize: 13,
                      outline: "none",
                      width: 180,
                    }}
                  />
                </div>
              </div>

              {/* Filtro de Categorías */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "Todos los Cultivos", icon: "🌾" },
                  { id: "cereal", label: "Cereales", icon: "🌽" },
                  { id: "vegetal", label: "Hortalizas", icon: "🥕" },
                  { id: "fruta", label: "Frutas", icon: "🍓" },
                  { id: "industrial", label: "Industriales", icon: "☁️" },
                  { id: "especial", label: "Especiales", icon: "☕" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: selectedCategory === cat.id ? "1px solid #f5d29a" : "1px solid #2e1e12",
                      backgroundColor: selectedCategory === cat.id ? "#3a2517" : "#19110b",
                      color: selectedCategory === cat.id ? "#ffffff" : "#a8876a",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid de Cultivos */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: 14,
                }}
              >
                {filteredCrops.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: "#18120c",
                      border: "1px solid #332012",
                      borderRadius: 8,
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      transition: "transform 0.15s, border-color 0.15s",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CropSpriteFrame crop={c} stage={4} targetWidth={32} targetHeight={26} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#f7e3cb" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#8a6646" }}>{c.categoryLabel}</div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            backgroundColor: "#26170d",
                            color: "#d4a373",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid #442918",
                          }}
                        >
                          24h
                        </span>
                      </div>

                      <p style={{ margin: "4px 0 10px 0", fontSize: 12, color: "#9c8167", lineHeight: 1.4 }}>
                        {c.description}
                      </p>

                      {/* Esquema de los 4 frames de crecimiento con sprites reales recortados */}
                      <div
                        style={{
                          backgroundColor: "#0d0906",
                          border: "1px solid #29180c",
                          borderRadius: 6,
                          padding: "8px 6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ textAlign: "center", fontSize: 9, color: "#66503c" }}>
                          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🟫</div>
                          <div style={{ marginTop: 2 }}>0-6h</div>
                        </div>
                        <div style={{ color: "#443020", fontSize: 10 }}>→</div>
                        <div style={{ textAlign: "center", fontSize: 9, color: "#8a7057" }}>
                          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CropSpriteFrame crop={c} stage={1} targetWidth={26} targetHeight={22} />
                          </div>
                          <div style={{ marginTop: 2 }}>6-12h</div>
                        </div>
                        <div style={{ color: "#443020", fontSize: 10 }}>→</div>
                        <div style={{ textAlign: "center", fontSize: 9, color: "#a88f74" }}>
                          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CropSpriteFrame crop={c} stage={2} targetWidth={28} targetHeight={24} />
                          </div>
                          <div style={{ marginTop: 2 }}>12-18h</div>
                        </div>
                        <div style={{ color: "#443020", fontSize: 10 }}>→</div>
                        <div style={{ textAlign: "center", fontSize: 9, color: "#d9ae7b" }}>
                          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CropSpriteFrame crop={c} stage={3} targetWidth={30} targetHeight={26} />
                          </div>
                          <div style={{ marginTop: 2 }}>18-24h</div>
                        </div>
                        <div style={{ color: "#443020", fontSize: 10 }}>→</div>
                        <div style={{ textAlign: "center", fontSize: 9, color: "#ffd700", fontWeight: 700 }}>
                          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CropSpriteFrame crop={c} stage={4} targetWidth={32} targetHeight={28} />
                          </div>
                          <div style={{ marginTop: 2 }}>24h+</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, fontSize: 12, color: "#c99a6b", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Rendimiento:</span>
                        <span style={{ fontWeight: 700, color: "#ffd700" }}>
                          +{c.baseYield.amount} {c.baseYield.unit} {c.baseYield.name}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlant(c.id)}
                      style={{
                        backgroundColor: "#54341b",
                        border: "1px solid #8c572c",
                        color: "#ffffff",
                        padding: "8px 14px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                      }}
                    >
                      <span>🌾</span>
                      <span>Sembrar {c.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SI YA HAY CULTIVO PLANTADO: Monitor de Estado y Cosecha */
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Encabezado del cultivo activo con sprite real */}
              <div
                style={{
                  backgroundColor: "#1a130c",
                  border: "1px solid #4a301a",
                  borderRadius: 8,
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      backgroundColor: "#2a1c12",
                      border: "2px solid #6b4323",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {growth.stage === 0 ? (
                      <span style={{ fontSize: 32 }}>🟫</span>
                    ) : (
                      <CropSpriteFrame crop={crop} stage={growth.stage as 1 | 2 | 3 | 4} targetWidth={48} targetHeight={40} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 20, color: "#fae1c3" }}>{crop.name}</h2>
                      <span
                        style={{
                          backgroundColor: growth.isReady ? "#2e7d32" : "#3e2716",
                          color: growth.isReady ? "#81c784" : "#e0b084",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          border: `1px solid ${growth.isReady ? "#4caf50" : "#663f22"}`,
                        }}
                      >
                        {growth.isReady ? "LISTO PARA COSECHAR" : "EN CRECIMIENTO"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9e7f63" }}>
                      {crop.description}
                    </p>
                  </div>
                </div>

                {/* Botón de Cosecha Principal */}
                {growth.isReady ? (
                  <button
                    onClick={handleHarvest}
                    style={{
                      backgroundColor: "#ffd700",
                      border: "2px solid #fff",
                      color: "#1c1208",
                      padding: "12px 24px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: "pointer",
                      animation: "pulseHarvest 2s infinite",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🌾</span>
                    <span>¡COSECHAR AHORA! (+{crop.baseYield.amount} {crop.baseYield.unit})</span>
                  </button>
                ) : (
                  <button
                    onClick={handleClearCrop}
                    style={{
                      background: "transparent",
                      border: "1px solid #5a3030",
                      color: "#d97777",
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar y Limpiar Terreno
                  </button>
                )}
              </div>

              {/* Barra de Progreso y Tiempo */}
              <div
                style={{
                  backgroundColor: "#160f0a",
                  border: "1px solid #332012",
                  borderRadius: 8,
                  padding: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#ebd2b7" }}>
                    Progreso del Ciclo de 24 Horas
                  </span>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#bf9870" }}>
                      Horas transcurridas: <strong style={{ color: "#ffd700" }}>{growth.hoursElapsed.toFixed(1)}h</strong> / 24h
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: growth.isReady ? "#4caf50" : "#ffb74d",
                      }}
                    >
                      {growth.timeRemainingFormatted}
                    </span>
                  </div>
                </div>

                {/* Barra porcentual */}
                <div
                  style={{
                    height: 14,
                    backgroundColor: "#0d0805",
                    borderRadius: 7,
                    overflow: "hidden",
                    border: "1px solid #2a1a0f",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${growth.percent}%`,
                      height: "100%",
                      backgroundColor: growth.isReady ? "#4caf50" : "#d97b29",
                      backgroundImage: "linear-gradient(90deg, #b86214, #ffb300)",
                      borderRadius: 7,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                {/* ── 4 Etapas Visuales de Crecimiento con sprites reales ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 8,
                    marginTop: 18,
                  }}
                >
                  {/* Etapa 0: 0h-6h */}
                  <div
                    style={{
                      backgroundColor: growth.stage >= 0 ? "#21160d" : "#110b07",
                      border: growth.stage === 0 ? "2px solid #ff9800" : "1px solid #2e1d11",
                      borderRadius: 6,
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🟫</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ebd2b7", marginTop: 4 }}>
                      0h - 6h
                    </div>
                    <div style={{ fontSize: 10, color: "#94765b" }}>Brote Oculto</div>
                    <div style={{ fontSize: 9, color: growth.stage === 0 ? "#ff9800" : "#553b28", marginTop: 4 }}>
                      {growth.stage === 0 ? "● En curso" : growth.stage > 0 ? "✓ Superado" : "Pendiente"}
                    </div>
                  </div>

                  {/* Etapa 1: 6h-12h */}
                  <div
                    style={{
                      backgroundColor: growth.stage >= 1 ? "#21160d" : "#110b07",
                      border: growth.stage === 1 ? "2px solid #ff9800" : "1px solid #2e1d11",
                      borderRadius: 6,
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CropSpriteFrame crop={crop} stage={1} targetWidth={36} targetHeight={30} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ebd2b7", marginTop: 4 }}>
                      Frame 1 (6h-12h)
                    </div>
                    <div style={{ fontSize: 10, color: "#94765b" }}>Brote Visible</div>
                    <div style={{ fontSize: 9, color: growth.stage === 1 ? "#ff9800" : growth.stage > 1 ? "#4caf50" : "#553b28", marginTop: 4 }}>
                      {growth.stage === 1 ? "● En curso" : growth.stage > 1 ? "✓ Superado" : "Pendiente"}
                    </div>
                  </div>

                  {/* Etapa 2: 12h-18h */}
                  <div
                    style={{
                      backgroundColor: growth.stage >= 2 ? "#21160d" : "#110b07",
                      border: growth.stage === 2 ? "2px solid #ff9800" : "1px solid #2e1d11",
                      borderRadius: 6,
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CropSpriteFrame crop={crop} stage={2} targetWidth={38} targetHeight={32} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ebd2b7", marginTop: 4 }}>
                      Frame 2 (12h-18h)
                    </div>
                    <div style={{ fontSize: 10, color: "#94765b" }}>Tallo Desarrollado</div>
                    <div style={{ fontSize: 9, color: growth.stage === 2 ? "#ff9800" : growth.stage > 2 ? "#4caf50" : "#553b28", marginTop: 4 }}>
                      {growth.stage === 2 ? "● En curso" : growth.stage > 2 ? "✓ Superado" : "Pendiente"}
                    </div>
                  </div>

                  {/* Etapa 3: 18h-24h */}
                  <div
                    style={{
                      backgroundColor: growth.stage >= 3 ? "#21160d" : "#110b07",
                      border: growth.stage === 3 ? "2px solid #ff9800" : "1px solid #2e1d11",
                      borderRadius: 6,
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CropSpriteFrame crop={crop} stage={3} targetWidth={42} targetHeight={34} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ebd2b7", marginTop: 4 }}>
                      Frame 3 (18h-24h)
                    </div>
                    <div style={{ fontSize: 10, color: "#94765b" }}>Planta con Frutos</div>
                    <div style={{ fontSize: 9, color: growth.stage === 3 ? "#ff9800" : growth.stage > 3 ? "#4caf50" : "#553b28", marginTop: 4 }}>
                      {growth.stage === 3 ? "● En curso" : growth.stage > 3 ? "✓ Superado" : "Pendiente"}
                    </div>
                  </div>

                  {/* Etapa 4: 24h+ */}
                  <div
                    style={{
                      backgroundColor: growth.stage >= 4 ? "#261a0d" : "#110b07",
                      border: growth.stage === 4 ? "2px solid #ffd700" : "1px solid #2e1d11",
                      borderRadius: 6,
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CropSpriteFrame crop={crop} stage={4} targetWidth={44} targetHeight={36} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ffd700", marginTop: 4 }}>
                      Frame 4 (24h+)
                    </div>
                    <div style={{ fontSize: 10, color: "#94765b" }}>¡Maduro y Listo!</div>
                    <div style={{ fontSize: 9, color: growth.isReady ? "#4caf50" : "#553b28", marginTop: 4, fontWeight: growth.isReady ? 700 : 400 }}>
                      {growth.isReady ? "★ ¡Listo!" : "Pendiente"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel de Controles de Aceleración para Pruebas / Simulación */}
              <div
                style={{
                  backgroundColor: "#120d08",
                  border: "1px dashed #3d2817",
                  borderRadius: 6,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <span style={{ fontSize: 12, color: "#c29d78", fontWeight: 600 }}>
                    Simulación Rápida de Tiempo (Prueba de Frames):
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleAdvanceTime(6)}
                    style={{
                      backgroundColor: "#332014",
                      border: "1px solid #5a3821",
                      color: "#f0d5bc",
                      borderRadius: 4,
                      padding: "5px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    +6 Horas (Siguiente Frame)
                  </button>
                  <button
                    onClick={() => handleAdvanceTime(12)}
                    style={{
                      backgroundColor: "#332014",
                      border: "1px solid #5a3821",
                      color: "#f0d5bc",
                      borderRadius: 4,
                      padding: "5px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    +12 Horas
                  </button>
                  <button
                    onClick={() => handleAdvanceTime(24)}
                    style={{
                      backgroundColor: "#5e3e1c",
                      border: "1px solid #a87232",
                      color: "#ffd700",
                      borderRadius: 4,
                      padding: "5px 14px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    +24 Horas (¡Cosecha Inmediata!)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropPlantingModal;
