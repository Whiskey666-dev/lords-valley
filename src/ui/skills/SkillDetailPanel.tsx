import type { SkillCategoryInfo, SkillInfo } from "../../hooks/skills/skillsData";

interface Props {
  category: SkillCategoryInfo;
  skills: SkillInfo[];
  progress: { avg: number; total: number; unlocked: number; maxed: number };
  onClose: () => void;
  onAddXp: (skillId: string, amount?: number) => void;
  onAddCategoryXp: (amount?: number) => void;
}

export function SkillDetailPanel({ category, skills, progress, onClose, onAddXp, onAddCategoryXp }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 245,
        backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .skd-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .skd-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .skd-scroll::-webkit-scrollbar-thumb { background: #22374e; border-radius: 3px; }
        .skd-scroll::-webkit-scrollbar-thumb:hover { background: #33557a; }
      `}</style>

      <div
        style={{
          width: 640,
          maxWidth: "96vw",
          height: 560,
          maxHeight: "88vh",
          background: "#0c141f",
          border: `1px solid ${category.border}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 18px 40px rgba(0,0,0,0.85), 0 0 0 1px ${category.color}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            minHeight: 56,
            background: `linear-gradient(135deg, ${category.bg} 0%, #0a121c 100%)`,
            borderBottom: `1px solid ${category.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: category.color,
                color: category.id === "artes_misticas" ? "#1a1200" : "#0a0a0a",
                border: `1px solid ${category.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
                boxShadow: `0 0 12px ${category.glow}`,
              }}
            >
              {category.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#f0e6c8", lineHeight: 1 }}>{category.label}</span>
                <span style={{ fontSize: 7.5, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#0a1420", color: category.color, border: `1px solid ${category.border}`, whiteSpace: "nowrap" }}>
                  {category.subtitle}
                </span>
                <span style={{ fontSize: 8, color: "#5a7a94" }}>{progress.avg}% · Nv medio</span>
              </div>
              <div style={{ fontSize: 9.5, color: "#8ab4cc", marginTop: 2, lineHeight: 1.25, maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {category.description}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 8, color: "#5a7a94", fontWeight: 700 }}>PROGRESO</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: category.color }}>{progress.avg}%</span>
              </div>
              <div style={{ width: 90, height: 4, background: "#060d14", borderRadius: 3, overflow: "hidden", border: "1px solid #142232" }}>
                <div style={{ width: `${progress.avg}%`, height: "100%", background: category.color, transition: "width 0.3s", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 7.5, color: "#5a7a94" }}>{progress.unlocked}/{skills.length} desbloqueadas · {progress.maxed} maestras</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#1a0f0f",
                color: "#ff7a7a",
                border: "1px solid #3a1a1a",
                borderRadius: 6,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Cerrar [ESC]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Subheader acciones */}
        <div
          style={{
            minHeight: 34,
            background: "#091018",
            borderBottom: "1px solid #162434",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, color: "#88a2b8" }}>
            <span style={{ fontWeight: 700, color: "#b0c4d8" }}>{skills.length} habilidades</span>
            <span style={{ color: "#334455" }}>•</span>
            <span>Tier 1 básico · Tier 2 avanzado · Tier 3 maestro</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onAddCategoryXp(4)}
              style={{
                background: category.color,
                color: category.id === "artes_misticas" ? "#1a1200" : "#0a0a0a",
                border: `1px solid ${category.color}`,
                borderRadius: 5,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Entrena todas las habilidades desbloqueadas de esta categoría"
            >
              ⚡ Entrenar (+4 XP)
            </button>
          </div>
        </div>

        {/* Body grid */}
        <div className="skd-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 10, background: "#0a121c", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {skills.map((sk) => {
              const pct = sk.level; // 0-100
              const canTrain = sk.unlocked;
              const tierColor = sk.tier === 3 ? "#ffd54f" : sk.tier === 2 ? "#42a5f5" : "#5a7a94";
              const tierLabel = sk.tier === 3 ? "Maestro" : sk.tier === 2 ? "Avanzado" : "Básico";
              return (
                <div
                  key={sk.id}
                  style={{
                    background: canTrain ? "#0d1824" : "#0b1017",
                    border: `1px solid ${canTrain ? "#1a2c40" : "#141c26"}`,
                    borderRadius: 7,
                    padding: "8px 9px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    opacity: canTrain ? 1 : 0.72,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* brillo superior */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: canTrain ? category.color : "#1a2632", opacity: 0.9 }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: canTrain ? category.color : "#121a24",
                        color: canTrain ? (category.id === "artes_misticas" ? "#1a1200" : "#0a0a0a") : "#3a4a5a",
                        border: `1px solid ${canTrain ? category.color : "#1a2632"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        flexShrink: 0,
                        boxShadow: canTrain ? `0 0 8px ${category.glow}` : "none",
                      }}
                    >
                      {canTrain ? sk.icon : "🔒"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: canTrain ? "#e8e0cc" : "#8a9aab", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {sk.name}
                        </span>
                        <span style={{ fontSize: 7, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: "#0a1420", color: tierColor, border: `1px solid ${tierColor}44`, whiteSpace: "nowrap", flexShrink: 0 }}>
                          T{sk.tier} {tierLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 8.5, color: canTrain ? "#7a9ab8" : "#4a5a6a", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sk.description}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: canTrain ? category.color : "#3a4a5a", lineHeight: 1 }}>{sk.level}</span>
                      <span style={{ fontSize: 7, color: "#5a7a94", fontWeight: 700, letterSpacing: 0.3 }}>NIVEL</span>
                    </div>
                  </div>

                  {/* Barra nivel */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7.5, fontWeight: 700, color: "#5a7a94", letterSpacing: 0.3 }}>
                      <span>MAESTRÍA</span>
                      <span style={{ color: category.color }}>{pct}%</span>
                    </div>
                    <div style={{ width: "100%", height: 4, background: "#050a10", borderRadius: 3, overflow: "hidden", border: "1px solid #0f1e2c" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: canTrain ? category.color : "#233242", borderRadius: 3, transition: "width 0.3s" }} />
                    </div>
                  </div>

                  {/* XP hacia siguiente nivel */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 3, background: "#060d14", borderRadius: 2, overflow: "hidden", border: "1px solid #0f1e2c" }}>
                      <div style={{ width: `${sk.xp}%`, height: "100%", background: canTrain ? "#3ab4ff" : "#2a3a4a", opacity: canTrain ? 0.9 : 0.5 }} />
                    </div>
                    <span style={{ fontSize: 7.5, color: "#5a7a94", whiteSpace: "nowrap", flexShrink: 0 }}>{sk.xp}/100 XP</span>
                  </div>

                  {sk.bonus && (
                    <div style={{ fontSize: 7.5, color: "#8ab4cc", background: "#0a1420", border: "1px solid #142232", borderRadius: 3, padding: "2px 5px", lineHeight: 1.2 }}>
                      🎁 {sk.bonus}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 5, marginTop: 1 }}>
                    <button
                      disabled={!canTrain || sk.level >= 100}
                      onClick={() => onAddXp(sk.id, 12)}
                      style={{
                        flex: 1,
                        background: !canTrain || sk.level >= 100 ? "#0f1418" : "#122030",
                        color: !canTrain || sk.level >= 100 ? "#3a4a5a" : "#8acfff",
                        border: `1px solid ${!canTrain || sk.level >= 100 ? "#1a2632" : "#1e3550"}`,
                        borderRadius: 4,
                        padding: "4px 6px",
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: !canTrain || sk.level >= 100 ? "default" : "pointer",
                        opacity: !canTrain || sk.level >= 100 ? 0.6 : 1,
                      }}
                    >
                      {sk.level >= 100 ? "★ Maestría" : "+12 XP"}
                    </button>
                    <button
                      disabled={!canTrain}
                      onClick={() => onAddXp(sk.id, 35)}
                      style={{
                        background: !canTrain ? "#0f1418" : "#0a1e2e",
                        color: !canTrain ? "#3a4a5a" : category.color,
                        border: `1px solid ${!canTrain ? "#1a2632" : category.color + "66"}`,
                        borderRadius: 4,
                        padding: "4px 7px",
                        fontSize: 9,
                        fontWeight: 800,
                        cursor: !canTrain ? "default" : "pointer",
                        opacity: !canTrain ? 0.6 : 1,
                        whiteSpace: "nowrap",
                      }}
                      title="Entrenamiento intensivo"
                    >
                      ⚡+35
                    </button>
                  </div>

                  {!canTrain && (
                    <div style={{ fontSize: 7.5, color: "#8a6a2a", background: "#1e1508", border: "1px solid #3a2a0a", borderRadius: 3, padding: "2px 5px", textAlign: "center" }}>
                      🔒 Requiere {sk.tier === 2 ? "15%" : "35%"} promedio en {category.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer info */}
          <div
            style={{
              marginTop: 10,
              background: "#080e16",
              border: "1px solid #142232",
              borderRadius: 6,
              padding: "7px 10px",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>💡</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8.5, fontWeight: 800, color: "#8ab4cc" }}>Consejo de maestría</div>
              <div style={{ fontSize: 9, color: "#7a9ab8", lineHeight: 1.35 }}>
                {category.id === "artes_misticas"
                  ? "Las Artes Místicas avanzan lento: entrena con rituales nocturnos y busca ruinas. Desbloquea T3 al 35% promedio."
                  : category.id === "milicia"
                  ? "Milicia alta: mantén barracones activos y realiza escaramuzas. Cada victoria da +XP pasivo."
                  : "Sube todas las habilidades a la vez con “Entrenar” o enfócate en una para desbloquear maestrías. T2 a 15%, T3 a 35%."}{" "}
                <span style={{ color: category.color, fontWeight: 700 }}>· {progress.avg}% promedio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            minHeight: 30,
            background: "#070c14",
            borderTop: "1px solid #162232",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            flexShrink: 0,
            fontSize: 8,
            color: "#3a5a78",
          }}
        >
          <span>
            <b style={{ color: "#7a9ab8" }}>Click</b> +XP · <b style={{ color: "#7a9ab8" }}>ESC</b> cerrar
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: category.color, display: "inline-block", boxShadow: `0 0 6px ${category.glow}` }} />
            {category.label} · {skills.length} habilidades
          </span>
        </div>
      </div>
    </div>
  );
}

export default SkillDetailPanel;
