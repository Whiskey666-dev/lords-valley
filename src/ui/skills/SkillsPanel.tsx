import { useEffect, useState } from "react";
import { useSkills } from "../../hooks/skills/useSkills";
import { PENTAGRAM_ORDER, CENTER_CATEGORY } from "../../hooks/skills/skillsData";
import { SkillDetailPanel } from "./SkillDetailPanel";

interface Props {
  onClose: () => void;
}

// ---------- Circular node with progress ring ----------
function SkillNode({
  icon,
  label,
  color,
  bg,
  border,
  glow,
  progress,
  size = 74,
  isCenter = false,
  subtitle,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  progress: number; // 0-100
  size?: number;
  isCenter?: boolean;
  subtitle?: string;
  onClick: () => void;
}) {
  const stroke = 3.5;
  const radius = (size + 12) / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progress)) / 100);
  const wrapSize = size + 14; // svg size

  return (
    <button
      onClick={onClick}
      title={`${label} — ${progress}%`}
      aria-label={label}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: isCenter
          ? `radial-gradient(120% 120% at 30% 20%, #2a2206 0%, #1a1604 45%, #0e0c04 100%)`
          : bg,
        border: `1.8px solid ${isCenter ? "#c9a227" : border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        cursor: "pointer",
        boxShadow: isCenter
          ? `0 0 18px ${glow}, 0 0 32px rgba(255,213,79,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 4px 14px rgba(0,0,0,0.55), 0 0 10px ${glow}`,
        transition: "transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease",
        flexShrink: 0,
        padding: 0,
        overflow: "visible",
        isolation: "isolate",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.07)";
        e.currentTarget.style.boxShadow = isCenter
          ? `0 0 22px ${glow}, 0 0 38px rgba(255,213,79,0.28), inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 6px 18px rgba(0,0,0,0.65), 0 0 16px ${glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = isCenter
          ? `0 0 18px ${glow}, 0 0 32px rgba(255,213,79,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 4px 14px rgba(0,0,0,0.55), 0 0 10px ${glow}`;
      }}
    >
      {/* SVG progress ring */}
      <svg
        width={wrapSize}
        height={wrapSize}
        style={{
          position: "absolute",
          top: -7,
          left: -7,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        {/* track */}
        <circle
          cx={wrapSize / 2}
          cy={wrapSize / 2}
          r={radius}
          fill="none"
          stroke="#0f1e2c"
          strokeWidth={stroke}
          opacity={0.95}
        />
        <circle
          cx={wrapSize / 2}
          cy={wrapSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          opacity={1}
        />
        {/* progress */}
        <circle
          cx={wrapSize / 2}
          cy={wrapSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${wrapSize / 2} ${wrapSize / 2})`}
          style={{
            filter: `drop-shadow(0 0 4px ${glow})`,
            transition: "stroke-dashoffset 0.6s ease",
          }}
        />
        {/* glow dot at end */}
        {progress > 2 && progress < 100 && (
          <circle
            cx={wrapSize / 2}
            cy={wrapSize / 2 - radius}
            r={2.2}
            fill={color}
            opacity={0.95}
            transform={`rotate(${(progress / 100) * 360} ${wrapSize / 2} ${wrapSize / 2})`}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        )}
      </svg>

      {/* inner content */}
      <span
        style={{
          fontSize: isCenter ? 16 : 12,
          lineHeight: 1,
          filter: isCenter ? "drop-shadow(0 0 6px rgba(255,213,79,0.55))" : `drop-shadow(0 0 4px ${glow})`,
          marginTop: isCenter ? -1 : 0,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: isCenter ? 6 : 5.5,
          fontWeight: 800,
          color: isCenter ? "#ffd54f" : "#e8e0cc",
          letterSpacing: 0.25,
          lineHeight: 1,
          textAlign: "center",
          maxWidth: size - 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textShadow: "0 1px 2px rgba(0,0,0,0.85)",
        }}
      >
        {label}
      </span>
      {subtitle && isCenter && (
        <span style={{ fontSize: 5, color: "#c9a227", fontWeight: 700, letterSpacing: 0.3, lineHeight: 1, marginTop: -1 }}>MÍSTICAS</span>
      )}
      <span
        style={{
          fontSize: 6.5,
          fontWeight: 900,
          color: isCenter ? "#ffd54f" : color,
          background: isCenter ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.42)",
          padding: "0px 2px",
          borderRadius: 3,
          border: `1px solid ${isCenter ? "rgba(255,213,79,0.22)" : "rgba(255,255,255,0.08)"}`,
          lineHeight: 1.1,
          marginTop: 1,
          minWidth: 22,
          textAlign: "center",
        }}
      >
        {progress}%
      </span>
    </button>
  );
}

export function SkillsPanel({ onClose }: Props) {
  const {
    categories,
    categoryProgress,
    globalProgress,
    selectedCategory,
    setSelectedCategory,
    selectedCategoryInfo,
    selectedSkills,
    addXp,
    addCategoryXp,
  } = useSkills();

  const [viewportW, setViewportW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 800));
  const [viewportH, setViewportH] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 700));
  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedCategory) setSelectedCategory(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selectedCategory, setSelectedCategory]);

  // Geometría responsiva compacta: se ajusta a ancho Y alto para no desbordar hacia abajo
  const isMobile = viewportW < 520;
  const isTablet = viewportW < 760;
  const widthBase = isMobile ? Math.min(300, viewportW - 16) : isTablet ? 340 : 360;
  // reserva para header(36)+subheader(26)+footer(26)+overlay padding(16)+hint(18) ≈ 122; + margen 30 = 152
  const availableH = Math.max(260, viewportH - 152);
  // el pentagrama no debe superar el alto disponible; también limitamos por ancho
  const baseUnclamped = Math.min(widthBase, availableH);
  const base = Math.max(260, Math.min(widthBase, baseUnclamped));
  const W = base;
  const H = base;
  const cx = W / 2;
  const cy = H / 2;
  const R = isMobile ? base * 0.29 : isTablet ? base * 0.30 : base * 0.32;
  const outerNodeSize = isMobile ? 48 : isTablet ? 54 : 58;
  const centerNodeSize = isMobile ? 56 : isTablet ? 64 : 70;

  const vertices = PENTAGRAM_ORDER.map((catId, i) => {
    const angleDeg = -90 + i * 72;
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + R * Math.cos(rad);
    const y = cy + R * Math.sin(rad);
    return { catId, x, y, angleDeg };
  });

  // star path order: 0-2-4-1-3-0
  const starOrder = [0, 2, 4, 1, 3, 0];
  const starPoints = starOrder.map((idx) => `${vertices[idx].x},${vertices[idx].y}`).join(" ");
  const perimeterPoints = vertices.map((v) => `${v.x},${v.y}`).join(" ");

  const centerProgress = categoryProgress[CENTER_CATEGORY]?.avg ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 230,
        backgroundColor: "rgba(0,0,0,0.84)",
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 6px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflowY: "auto",
        overflowX: "hidden",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .sk-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .sk-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .sk-scroll::-webkit-scrollbar-thumb { background: #22374e; border-radius: 3px; }
        .sk-scroll::-webkit-scrollbar-thumb:hover { background: #33557a; }
        .sk-panel {
          width: 640px;
          max-width: 96vw;
          height: auto;
          max-height: 92vh;
          max-height: 92dvh;
          background: #080e18;
          border: 1px solid #1a2f44;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 18px 44px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .sk-header {
          height: 32px;
          min-height: 32px;
          background: linear-gradient(180deg, #0b1624 0%, #070c14 100%);
          border-bottom: 1px solid #162838;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          gap: 6;
          flex-shrink: 0;
        }
        .sk-subheader {
          min-height: 22px;
          background: #09111c;
          border-bottom: 1px solid #142232;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 8px;
          gap: 6;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .sk-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
          background: radial-gradient(700px 420px at 50% 42%, #0f1e2e 0%, #0a121c 58%, #080e18 100%);
          position: relative;
          padding: 4px 6px 6px;
        }
        .sk-body::-webkit-scrollbar { width: 5px; height: 5px; }
        .sk-body::-webkit-scrollbar-track { background: rgba(0,0,0,0.15); }
        .sk-body::-webkit-scrollbar-thumb { background: #1f344b; border-radius: 3px; }
        .sk-footer {
          min-height: 26px;
          background: #070c14;
          border-top: 1px solid #162232;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 8px;
          gap: 6;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        @media (max-width: 720px) {
          .sk-panel { max-height: 96vh; max-height: 96dvh; }
          .sk-header-desc { display: none !important; }
        }
        @media (max-height: 620px) {
          .sk-panel { max-height: 96vh; max-height: 96dvh; }
          .sk-header { height: 30px; min-height: 30px; }
          .sk-subheader { min-height: 20px; padding: 2px 6px; }
          .sk-footer { min-height: 22px; }
        }
      `}</style>

      <div className="sk-panel">
        {/* Header */}
        <div className="sk-header">
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: "1 1 auto" }}>
            <span style={{ fontSize: 12, filter: "drop-shadow(0 0 6px rgba(255,213,79,0.45))", flexShrink: 0 }}>✨</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#f0e6c8", letterSpacing: 0.3, whiteSpace: "nowrap" }}>Habilidades del Valle</span>
                <span style={{ fontSize: 6, fontWeight: 700, padding: "1px 3px", borderRadius: 3, background: "#1a2a12", color: "#7bc67b", border: "1px solid #2a4a1e", whiteSpace: "nowrap" }}>
                  6 categorías
                </span>
                <span className="sk-header-desc" style={{ fontSize: 7, color: "#5a7a94", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
                  Pentagrama de maestría — entrena y domina el valle
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, minWidth: 100 }}>
              <div style={{ display: "flex", gap: 3, alignItems: "center", fontSize: 7, color: "#7a9ab8", fontWeight: 600, whiteSpace: "nowrap" }}>
                <span>Dominio global</span>
                <span style={{ color: "#ffd54f", fontWeight: 800 }}>{globalProgress.percent}%</span>
                <span style={{ color: "#5a7a94" }}>{globalProgress.total}/{globalProgress.max}</span>
              </div>
              <div style={{ width: 100, height: 3, background: "#0a1420", borderRadius: 2, overflow: "hidden", border: "1px solid #142232" }}>
                <div style={{ width: `${globalProgress.percent}%`, height: "100%", background: "linear-gradient(90deg, #c9a227, #ffd54f)", borderRadius: 2, transition: "width 0.3s" }} />
              </div>
            </div>
            <div style={{ width: 1, height: 16, background: "#162030", flexShrink: 0 }} />
            <button
              onClick={onClose}
              style={{
                background: "#1a0f0f",
                color: "#ff7a7a",
                border: "1px solid #3a1a1a",
                borderRadius: 5,
                padding: "2px 7px",
                fontSize: 8.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              ✕ <span style={{ fontSize: 6.5, opacity: 0.6 }}>[ESC]</span>
            </button>
          </div>
        </div>

        {/* Subheader */}
        <div className="sk-subheader">
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", fontSize: 7, color: "#7a9ab8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ffd54f", boxShadow: "0 0 6px rgba(255,213,79,0.6)", display: "inline-block" }} />
              Pentagrama: 5 vértices + núcleo místico
            </span>
            <span style={{ color: "#223248" }}>•</span>
            <span>Click en un círculo para ver estadísticas y entrenar</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 6.5, color: "#5a7a94", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#8ab4cc" }}>{globalProgress.count} habilidades</span>
            <span>· anillo = progreso</span>
          </div>
        </div>

        {/* Body Pentagrama */}
        <div className="sk-body">
          {/* subtle vignette grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(1px 1px at 20% 30%, rgba(255,213,79,0.06) 0, transparent 60%), radial-gradient(1px 1px at 70% 60%, rgba(38,198,218,0.05) 0, transparent 60%), radial-gradient(1px 1px at 40% 80%, rgba(239,83,80,0.05) 0, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Pentagrama container */}
          <div
            style={{
              position: "relative",
              width: W,
              height: H,
              flexShrink: 0,
              marginTop: 1,
              filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.55))",
            }}
          >
            {/* SVG líneas */}
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
              <defs>
                <radialGradient id="sk-center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,213,79,0.18)" />
                  <stop offset="55%" stopColor="rgba(255,213,79,0.06)" />
                  <stop offset="100%" stopColor="rgba(255,213,79,0)" />
                </radialGradient>
                <linearGradient id="sk-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd54f" stopOpacity={0.85} />
                  <stop offset="50%" stopColor="#c9a227" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#ab47bc" stopOpacity={0.45} />
                </linearGradient>
                <filter id="sk-glow">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* glow central */}
              <circle cx={cx} cy={cy} r={64} fill="url(#sk-center-glow)" opacity={0.9} />

              {/* perímetro fino */}
              <polygon points={perimeterPoints} fill="none" stroke="#1a2a3c" strokeWidth={1.2} opacity={0.9} strokeLinejoin="round" />
              <polygon points={perimeterPoints} fill="rgba(14,22,36,0.28)" stroke="none" />

              {/* estrella pentagrama */}
              <polygon
                points={starPoints}
                fill="none"
                stroke="url(#sk-star-grad)"
                strokeWidth={1.6}
                opacity={0.92}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 4px rgba(255,213,79,0.25))" }}
              />
              {/* estrella interior sutil doble */}
              <polygon points={starPoints} fill="none" stroke="#ffd54f" strokeWidth={0.35} opacity={0.18} strokeDasharray="3 5" />

              {/* líneas al centro */}
              {vertices.map((v) => (
                <line key={`rad-${v.catId}`} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="#1e2f44" strokeWidth={0.9} opacity={0.55} strokeDasharray="4 4" />
              ))}

              {/* círculos concéntricos decorativos */}
              <circle cx={cx} cy={cy} r={R * 0.52} fill="none" stroke="#162838" strokeWidth={0.7} opacity={0.45} strokeDasharray="2 6" />
              <circle cx={cx} cy={cy} r={R * 0.78} fill="none" stroke="#162838" strokeWidth={0.6} opacity={0.32} />

              {/* puntos en intersecciones estrella (pequeños) */}
              {(() => {
                // calcular intersecciones aproximadas no necesario, solo vértices
                return vertices.map((v) => <circle key={`dot-${v.catId}`} cx={v.x} cy={v.y} r={2} fill="#0a1420" stroke="#2a3a52" strokeWidth={1} opacity={0.9} />);
              })()}
              <circle cx={cx} cy={cy} r={2.5} fill="#ffd54f" opacity={0.9} stroke="#1a1200" strokeWidth={0.8} />
            </svg>

            {/* Nodes outer */}
            {vertices.map((v) => {
              const cat = categories[v.catId];
              const prog = categoryProgress[v.catId]?.avg ?? 0;
              return (
                <div
                  key={v.catId}
                  style={{
                    position: "absolute",
                    left: v.x,
                    top: v.y,
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    pointerEvents: "auto",
                  }}
                >
                  <SkillNode
                    icon={cat.icon}
                    label={cat.label}
                    color={cat.color}
                    bg={cat.bg}
                    border={cat.border}
                    glow={cat.glow}
                    progress={prog}
                    size={outerNodeSize}
                    onClick={() => setSelectedCategory(v.catId)}
                  />
                  {/* mini label leyenda bajo nodo para claridad */}
                  <span
                    style={{
                      fontSize: 5.5,
                      fontWeight: 700,
                      color: "#5a7a94",
                      letterSpacing: 0.25,
                      background: "rgba(0,0,0,0.32)",
                      padding: "1px 2px",
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.06)",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {prog}% dominio
                  </span>
                </div>
              );
            })}

            {/* Center node */}
            <div
              style={{
                position: "absolute",
                left: cx,
                top: cy,
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                pointerEvents: "auto",
                zIndex: 2,
              }}
            >
              <SkillNode
                icon={categories[CENTER_CATEGORY].icon}
                label="Artes"
                color={categories[CENTER_CATEGORY].color}
                bg={categories[CENTER_CATEGORY].bg}
                border="#c9a227"
                glow={categories[CENTER_CATEGORY].glow}
                progress={centerProgress}
                size={centerNodeSize}
                isCenter
                subtitle="Místicas"
                onClick={() => setSelectedCategory(CENTER_CATEGORY)}
              />
              <span
                style={{
                  fontSize: 5.5,
                  fontWeight: 800,
                  color: "#c9a227",
                  letterSpacing: 0.35,
                  background: "rgba(20,14,0,0.42)",
                  padding: "1px 3px",
                  borderRadius: 3,
                  border: "1px solid rgba(255,213,79,0.18)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                NÚCLEO · {centerProgress}%
              </span>
            </div>

            {/* runa decorativa entre nodos (opcional) */}
            <div
              style={{
                position: "absolute",
                left: cx,
                top: cy + R + 22,
                transform: "translateX(-50%)",
                fontSize: 5.5,
                color: "#3a4a5e",
                letterSpacing: 0.9,
                fontWeight: 700,
                opacity: 0.65,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              ✦ DOMINIO DEL VALLE ✦
            </div>
          </div>

          {/* hint */}
          <div style={{ marginTop: 2, fontSize: 6.5, color: "#445566", textAlign: "center", maxWidth: 500, lineHeight: 1.25, padding: "0 4px" }}>
            El dominio global es el promedio de tus 6 escuelas. El pentagrama conecta las cinco artes terrenales; en su corazón arden las Artes Místicas.
          </div>
        </div>

        {/* Footer leyenda */}
        <div className="sk-footer">
          <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap", fontSize: 6.5, color: "#7a9ab8" }}>
            {[...PENTAGRAM_ORDER, CENTER_CATEGORY].map((catId) => {
              const c = categories[catId];
              const p = categoryProgress[catId]?.avg ?? 0;
              return (
                <span
                  key={catId}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    background: "#0a1420",
                    border: `1px solid ${c.border}`,
                    borderRadius: 10,
                    padding: "1px 4px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    fontSize: 6.5,
                  }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.color, display: "inline-block", boxShadow: `0 0 4px ${c.glow}`, flexShrink: 0 }} />
                  <span style={{ color: "#c8d8ea", fontWeight: 700 }}>{c.label}</span>
                  <span style={{ color: c.color, fontWeight: 800 }}>{p}%</span>
                </span>
              );
            })}
          </div>
          <div style={{ fontSize: 6, color: "#3a5a78", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            <span>
              <b style={{ color: "#7a9ab8" }}>Click</b> abre detalle
            </span>
            <span style={{ width: 1, height: 7, background: "#162232" }} />
            <span style={{ color: "#5a7a94" }}>Anillo = % en cada escuela</span>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedCategory && selectedCategoryInfo && selectedSkills && (
        <SkillDetailPanel
          category={selectedCategoryInfo}
          skills={selectedSkills}
          progress={categoryProgress[selectedCategory]}
          onClose={() => setSelectedCategory(null)}
          onAddXp={(skillId, amt) => addXp(selectedCategory, skillId, amt)}
          onAddCategoryXp={(amt) => addCategoryXp(selectedCategory, amt)}
        />
      )}
    </div>
  );
}

export default SkillsPanel;
