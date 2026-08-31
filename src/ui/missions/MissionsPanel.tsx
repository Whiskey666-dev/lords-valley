import { useEffect } from "react";
import { useMissions } from "../../hooks/missions/useMissions";
import { type MissionData } from "../../hooks/missions/missionsData";

interface Props {
  onClose: () => void;
}

export function MissionsPanel({ onClose }: Props) {
  const {
    filteredMissions,
    selectedCategory,
    setSelectedCategory,
    selectedMission,
    setSelectedMissionId,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    categoryProgress,
    globalProgress,
    isCategoryUnlocked,
    startMission,
    completeMission,
    categories,
    categoryOrder,
    nextUnlockHint,
  } = useMissions();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const currentCat = categories[selectedCategory];
  const progress = categoryProgress[selectedCategory];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 240,
        backgroundColor: "rgba(0, 0, 0, 0.84)",
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .m-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .m-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.22); }
        .m-scroll::-webkit-scrollbar-thumb { background: #1a3244; border-radius: 3px; }
        .m-scroll::-webkit-scrollbar-thumb:hover { background: #244a66; }
        .m-card-hover:hover { border-color: #23465e !important; background: #0e1e2e !important; }
        .m-cat-hover:hover { background: #0f1e2c !important; border-color: #1c3448 !important; }

        .m-panel {
          width: 980px;
          max-width: 98vw;
          height: 600px;
          max-height: 90vh;
          background: #080e18;
          border: 1px solid #1a2f44;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 18px 44px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
          box-sizing: border-box;
        }
        .m-header {
          height: 38px;
          min-height: 38px;
          background: linear-gradient(180deg, #0b1624 0%, #070c14 100%);
          border-bottom: 1px solid #162838;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          gap: 8;
          flex-shrink: 0;
        }
        .m-subheader {
          height: 30px;
          min-height: 30px;
          background: #09111c;
          border-bottom: 1px solid #142232;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          gap: 8;
          flex-shrink: 0;
        }
        .m-body { display:flex; flex:1; overflow:hidden; min-height:0; }
        .m-col-cats {
          width: 188px; min-width: 188px;
          border-right: 1px solid #162232;
          background: #070d16;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 6px;
          display:flex; flex-direction:column; gap:5;
          flex-shrink:0;
        }
        .m-col-list {
          width: 272px; min-width: 272px;
          border-right: 1px solid #162232;
          background: #080d14;
          overflow-y: auto;
          padding: 6px;
          display:flex; flex-direction:column; gap:4;
          flex-shrink:0;
        }
        .m-col-detail {
          flex:1; display:flex; flex-direction:column; overflow:hidden; background:#0a121e; min-width:0;
        }

        /* Compact tweaks for mid screens */
        @media (max-width: 1024px) {
          .m-panel { width: 96vw; height: 84vh; }
          .m-col-cats { width: 176px; min-width: 176px; }
          .m-col-list { width: 250px; min-width: 250px; }
        }
        @media (max-width: 900px) {
          .m-panel { height: 88vh; }
          .m-header { height: auto; min-height: 34px; flex-wrap: wrap; padding: 6px 8px; }
          .m-header-desc { display: none !important; }
          .m-col-cats { width: 100%; min-width:0; max-width:none; height: 86px; min-height:86px; flex-direction: row; overflow-x: auto; overflow-y: hidden; border-right:none; border-bottom:1px solid #162232; padding-bottom:4px; }
          .m-col-cats .m-cat-card { min-width: 148px; max-width: 148px; min-height: 68px; }
          .m-body { flex-direction: column; }
          .m-col-list { width: 100%; min-width:0; max-height: 34%; border-right:none; border-bottom:1px solid #162232; }
          .m-col-detail { flex:1; min-height:0; }
        }
        @media (max-width: 640px) {
          .m-panel { width: 98vw; height: 94vh; max-height: 94vh; border-radius:6px; }
          .m-header { gap:6px; }
          .m-header-progress { display:none !important; }
          .m-subheader { flex-wrap: wrap; height:auto; min-height:28px; padding:4px 6px; }
          .m-col-cats { height: 74px; min-height:74px; }
          .m-col-cats .m-cat-card { min-width: 132px; max-width: 132px; }
          .m-col-list { max-height: 30%; }
        }
        @media (max-height: 680px) {
          .m-panel { height: 92vh; }
          .m-header { height:32px; min-height:32px; }
          .m-subheader { height:26px; min-height:26px; }
        }
      `}</style>

      {/* ── Container ── */}
      <div className="m-panel">
        {/* ── Header ── */}
        <div className="m-header">
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: "1 1 auto" }}>
            <span style={{ fontSize: 15, filter: "drop-shadow(0 0 5px rgba(255,213,79,0.45))", flexShrink: 0 }}>📜</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#f0e6c8", letterSpacing: 0.3, whiteSpace: "nowrap" }}>Misiones del Valle</span>
                <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#1a2a12", color: "#7bc67b", border: "1px solid #2a4a1e", whiteSpace: "nowrap" }}>
                  Cap. {currentCat.chapter} · {currentCat.label}
                </span>
                <span className="m-header-desc" style={{ fontSize: 9, color: "#5a7a94", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>
                  {currentCat.subtitle}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <div className="m-header-progress" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, minWidth: 120 }}>
              <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 8.5, color: "#7a9ab8", fontWeight: 600, whiteSpace: "nowrap" }}>
                <span>Progreso</span>
                <span style={{ color: "#ffd54f", fontWeight: 800 }}>{globalProgress.completed}/{globalProgress.total}</span>
                <span style={{ color: "#5a7a94" }}>{globalProgress.percent}%</span>
              </div>
              <div style={{ width: 120, height: 3, background: "#0a1420", borderRadius: 2, overflow: "hidden", border: "1px solid #142232" }}>
                <div style={{ width: `${globalProgress.percent}%`, height: "100%", background: "linear-gradient(90deg, #c9a227, #ffd54f)", borderRadius: 2, transition: "width 0.3s" }} />
              </div>
            </div>

            <div className="m-header-progress" style={{ width: 1, height: 20, background: "#162030", flexShrink: 0 }} />

            <input
              type="text"
              placeholder="Buscar…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "#0f1b2a",
                border: "1px solid #1e3448",
                borderRadius: 4,
                padding: "3px 6px",
                fontSize: 10,
                color: "#cfe6ff",
                outline: "none",
                width: 96,
              }}
            />
            <button
              onClick={onClose}
              style={{
                background: "#1a0f0f",
                color: "#ff7a7a",
                border: "1px solid #3a1a1a",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              ✕ <span style={{ fontSize: 8, opacity: 0.55 }}>[ESC]</span>
            </button>
          </div>
        </div>

        {/* ── Subheader filtros ── */}
        <div className="m-subheader">
          <div style={{ display: "flex", background: "#060d16", padding: 1.5, borderRadius: 4, border: "1px solid #122232", flexShrink: 0 }}>
            <SegBtn label="Todas" count={progress.total} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
            <SegBtn label="Disponibles" count={filteredMissions.filter(m => m.status === "available" || m.status === "active").length} active={filterStatus === "available"} onClick={() => setFilterStatus("available")} />
            <SegBtn label="Hechas" count={progress.completed} active={filterStatus === "completed"} onClick={() => setFilterStatus("completed")} />
            <SegBtn label="Bloqueadas" count={progress.total - progress.completed - filteredMissions.filter(m=>m.status==="available"||m.status==="active").length} active={filterStatus === "locked"} onClick={() => setFilterStatus("locked")} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "#5a7f9a", flexShrink: 0 }}>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{progress.completed}/{progress.total}</span>
            <div style={{ width: 70, height: 3, background: "#0a1420", borderRadius: 2, overflow: "hidden", border: "1px solid #142232" }}>
              <div style={{ width: `${progress.percent}%`, height: "100%", background: currentCat.color, transition: "width 0.3s" }} />
            </div>
            <span style={{ color: currentCat.color, fontWeight: 700 }}>{progress.percent}%</span>
          </div>
        </div>

        {/* ── Body 3 columns ── */}
        <div className="m-body">
          {/* ── Col Izq: Categorías ── */}
          <div className="m-scroll m-col-cats">
            <div style={{ fontSize: 7.5, fontWeight: 800, color: "#3a5a78", letterSpacing: 0.7, padding: "1px 2px 3px", flexShrink: 0, whiteSpace:"nowrap" }}>
              CAPÍTULOS · 6
            </div>
            {categoryOrder.map((catId) => {
              const info = categories[catId];
              const prog = categoryProgress[catId];
              const isSelected = catId === selectedCategory;
              const unlocked = isCategoryUnlocked(catId);
              const idx = categoryOrder.indexOf(catId) + 1;

              return (
                <div
                  key={catId}
                  onClick={() => setSelectedCategory(catId)}
                  className="m-cat-hover m-cat-card"
                  style={{
                    minHeight: 54,
                    padding: "5px 6px",
                    borderRadius: 5,
                    background: isSelected ? info.bg : "#0a1420",
                    border: `1px solid ${isSelected ? info.color : "#132232"}`,
                    cursor: "pointer",
                    opacity: unlocked ? 1 : 0.72,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    boxShadow: isSelected ? `0 0 0 1px ${info.color}22` : "none",
                    transition: "all 0.14s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: isSelected ? info.color : "#0f1e2c",
                        color: isSelected ? "#0a0a0a" : info.color,
                        border: `1px solid ${isSelected ? info.color : "#1a2e44"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        flexShrink: 0,
                        fontWeight: 800,
                      }}
                    >
                      {unlocked ? info.icon : "🔒"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow:"hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: isSelected ? info.color : "#5a7a94", letterSpacing: 0.4 }}>C{idx}</span>
                        {prog.percent === 100 && <span style={{ fontSize: 7 }}>✅</span>}
                        {!unlocked && <span style={{ fontSize: 7, color: "#8a5a2a" }}>●</span>}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: isSelected ? "#f0e6c8" : "#c8d8ea", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 8, color: "#5a7a94", whiteSpace: "nowrap" }}>
                        {prog.completed}/{prog.total} · {prog.percent}%
                      </div>
                    </div>
                  </div>
                  <div style={{ width: "100%", height: 2.5, background: "#0a1420", borderRadius: 2, overflow: "hidden", border: "1px solid #0f1e2c" }}>
                    <div style={{ width: `${prog.percent}%`, height: "100%", background: info.color, borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 4, padding: "6px 7px", background: "#0a1420", border: "1px solid #132232", borderRadius: 5, flexShrink: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#6a8aaa", marginBottom: 3 }}>💡 Avance</div>
              <div style={{ fontSize: 9, color: "#8ab4cc", lineHeight: 1.35 }}>{nextUnlockHint}</div>
            </div>
          </div>

          {/* ── Col Centro: Lista misiones ── */}
          <div className="m-scroll m-col-list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1px 1px 4px", flexShrink:0 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#7a9ab8", letterSpacing: 0.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {currentCat.icon} {currentCat.label} — {filteredMissions.length}
              </span>
              <span style={{ fontSize: 8, color: "#3a5a78", flexShrink:0 }}>C{currentCat.chapter}</span>
            </div>

            {filteredMissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "22px 10px", color: "#3a5a78", fontSize: 10 }}>
                Sin misiones en este filtro.
              </div>
            ) : (
              filteredMissions.map((m) => {
                const isSelected = selectedMission?.id === m.id;
                const statusCfg = getStatusConfig(m.status);
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMissionId(m.id)}
                    className="m-card-hover"
                    style={{
                      minHeight: 44,
                      padding: "5px 6px",
                      borderRadius: 5,
                      background: isSelected ? "#0f1e2e" : "#0a1420",
                      border: `1px solid ${isSelected ? "#234a68" : "#132232"}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                      opacity: m.status === "locked" ? 0.6 : 1,
                      boxShadow: isSelected ? "0 0 0 1px #234a6833" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 4,
                        background: m.status === "locked" ? "#0f1418" : isSelected ? currentCat.color : "#0f1e2c",
                        color: m.status === "locked" ? "#3a4a5a" : isSelected ? "#0a0a0a" : currentCat.color,
                        border: `1px solid ${m.status === "locked" ? "#1a2632" : isSelected ? currentCat.color : "#1a3448"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {m.status === "locked" ? "🔒" : m.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, overflow:"hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap:"nowrap" }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: isSelected ? currentCat.color : "#5a7a94", flexShrink:0 }}>
                          {String(m.index).padStart(2, "0")}/20
                        </span>
                        <span style={{ fontSize: 7, padding: "0px 3px", borderRadius: 2, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, fontWeight: 700, whiteSpace:"nowrap", flexShrink:0 }}>
                          {statusCfg.label}
                        </span>
                        <span style={{ fontSize: 7, color: "#3a5a78", flexShrink:0 }}>{m.xp}XP</span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isSelected ? "#e8e0c8" : m.status === "locked" ? "#6a7a8a" : "#c8d8ea",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: 1,
                          lineHeight: 1.1,
                        }}
                      >
                        {m.title}
                      </div>
                      <div style={{ fontSize: 8, color: "#5a7a94", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight:1.2 }}>
                        {m.description}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0, width: 18 }}>
                      <span style={{ fontSize: 8, lineHeight:1 }}>{statusCfg.icon}</span>
                      <div style={{ display: "flex", gap: 0.5 }}>
                        {Array.from({ length: m.difficulty }).map((_, i) => (
                          <span key={i} style={{ fontSize: 5, color: m.status === "locked" ? "#2a3a4a" : "#c9a227", lineHeight:1 }}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Col Derecha: Detalle ── */}
          {selectedMission ? (
            <div className="m-col-detail">
              {/* Header detalle */}
              <div
                style={{
                  minHeight: 52,
                  background: `linear-gradient(135deg, ${currentCat.bg} 0%, #070d14 100%)`,
                  borderBottom: `1px solid ${currentCat.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: selectedMission.status === "locked" ? "#0f1418" : currentCat.color,
                    color: selectedMission.status === "locked" ? "#3a4a5a" : "#0a0a0a",
                    border: `1px solid ${selectedMission.status === "locked" ? "#1a2632" : currentCat.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                    boxShadow: selectedMission.status !== "locked" ? `0 0 8px ${currentCat.color}44` : "none",
                  }}
                >
                  {selectedMission.status === "locked" ? "🔒" : selectedMission.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0, overflow:"hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#f0e6c8", lineHeight:1.1 }}>{selectedMission.title}</span>
                    <StatusBadge status={selectedMission.status} />
                    <span style={{ fontSize: 7.5, color: "#7a9ab8", background: "#0a1420", padding: "0px 4px", borderRadius: 2, border: "1px solid #142232", whiteSpace:"nowrap" }}>
                      {selectedMission.id.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: "#8ab4cc", marginTop: 1, lineHeight: 1.25, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{selectedMission.description}</div>
                  <div style={{ fontSize: 7.5, color: "#5a7a94", marginTop: 1, whiteSpace:"nowrap" }}>
                    Cap. {currentCat.chapter} · {selectedMission.index}/20 · {selectedMission.xp} XP · {"★".repeat(selectedMission.difficulty)}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, alignItems: "flex-end" }}>
                  {selectedMission.status === "available" && (
                    <button onClick={() => startMission(selectedMission.id)} style={primaryBtnStyle}>
                      ▶ Iniciar
                    </button>
                  )}
                  {selectedMission.status === "active" && (
                    <button onClick={() => completeMission(selectedMission.id)} style={{ ...primaryBtnStyle, background: "#164a24", borderColor: "#246a34", color: "#a0ffb0", padding:"4px 8px", fontSize:9 }}>
                      ✓ Completar
                    </button>
                  )}
                  {selectedMission.status === "completed" && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#4caf50", background: "#0a1e0a", padding: "3px 7px", borderRadius: 4, border: "1px solid #1e4a2a", whiteSpace:"nowrap" }}>
                      ✔ Hecha
                    </span>
                  )}
                  {selectedMission.status === "locked" && (
                    <span style={{ fontSize: 7.5, color: "#8a6a2a", background: "#1e1508", padding: "3px 6px", borderRadius: 4, border: "1px solid #3a2a0a", textAlign: "center", maxWidth: 110, lineHeight:1.2 }}>
                      🔒 Anterior requerida
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido scrolleable */}
              <div className="m-scroll" style={{ flex: 1, overflowY: "auto", overflowX:"hidden", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8, minHeight:0 }}>
                {/* Descripción larga */}
                <div style={{ background: "#0c1624", border: "1px solid #142232", borderRadius: 5, padding: "7px 8px" }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#c9a227", letterSpacing: 0.5, marginBottom: 4 }}>📖 HISTORIA</div>
                  <div style={{ fontSize: 10, color: "#c8d8ea", lineHeight: 1.45 }}>{selectedMission.longDescription}</div>
                </div>

                {/* Objetivos */}
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#7ab8ff", letterSpacing: 0.5, marginBottom: 4 }}>
                    🎯 OBJETIVOS ({selectedMission.objectives.filter(o => o.done).length}/{selectedMission.objectives.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {selectedMission.objectives.map((obj, i) => {
                      const done = obj.done || selectedMission.status === "completed";
                      return (
                        <div
                          key={obj.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: done ? "#0a1e12" : "#0c1624",
                            border: `1px solid ${done ? "#1e4a2a" : "#142232"}`,
                          }}
                        >
                          <div
                            style={{
                              width: 15,
                              height: 15,
                              borderRadius: 3,
                              background: done ? "#1e4a2a" : "#0a1420",
                              border: `1px solid ${done ? "#2a6a32" : "#1a3448"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 8,
                              color: done ? "#4caf50" : "#3a5a78",
                              flexShrink: 0,
                            }}
                          >
                            {done ? "✓" : i + 1}
                          </div>
                          <span style={{ fontSize: 9.5, color: done ? "#7bc67b" : "#c8d8ea", textDecoration: done ? "line-through" : "none", opacity: done ? 0.85 : 1, lineHeight:1.25 }}>
                            {obj.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recompensas */}
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#ffd54f", letterSpacing: 0.5, marginBottom: 4 }}>🎁 RECOMPENSAS</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {selectedMission.rewards.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 7px",
                          background: "#0c1624",
                          border: "1px solid #1e3448",
                          borderRadius: 5,
                          minWidth: 106,
                        }}
                      >
                        <span style={{ fontSize: 14, flexShrink:0 }}>{r.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#f0e6c8", lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</div>
                          {r.amount && <div style={{ fontSize: 7.5, color: "#7a9ab8" }}>{r.amount}</div>}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 7px", background: "#0a1a0a", border: "1px solid #1e3a1e", borderRadius: 5 }}>
                      <span style={{ fontSize: 12 }}>✨</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#7bc67b" }}>{selectedMission.xp} XP</span>
                    </div>
                  </div>
                </div>

                {/* Consejo */}
                <div style={{ background: "#0a1420", border: "1px solid #132232", borderRadius: 5, padding: "6px 8px", display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, flexShrink: 0, marginTop:1 }}>💡</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: "#8ab4cc", marginBottom: 1 }}>Consejo</div>
                    <div style={{ fontSize: 9, color: "#7a9ab8", lineHeight: 1.35 }}>
                      {selectedMission.status === "locked"
                        ? "Bloqueada: completa la anterior en orden."
                        : selectedMission.status === "available"
                        ? "¡Disponible! Iníciala para activarla."
                        : selectedMission.status === "active"
                        ? "En curso: cumple los objetivos en el mundo."
                        : "¡Completada! Siguiente desbloqueada."}{" "}
                      <span style={{ color: currentCat.color, fontWeight: 700 }}>★{selectedMission.difficulty} · Cap {currentCat.chapter}</span>
                    </div>
                  </div>
                </div>

                {/* Progreso */}
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, background: "#0a1420", border: "1px solid #132232", borderRadius: 5, padding: "6px 7px", minWidth:0 }}>
                    <div style={{ fontSize: 7.5, color: "#5a7a94", fontWeight: 700, letterSpacing: 0.4 }}>PROGRESO CAP</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 4, background: "#0a1420", borderRadius: 2, overflow: "hidden", border: "1px solid #0f1e2c" }}>
                        <div style={{ width: `${progress.percent}%`, height: "100%", background: currentCat.color }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: currentCat.color, flexShrink:0 }}>{progress.percent}%</span>
                    </div>
                    <div style={{ fontSize: 7.5, color: "#5a7a94", marginTop: 3 }}>{progress.completed}/{progress.total} · {20 - progress.completed} rest.</div>
                  </div>
                  <div style={{ flex: 1, background: "#0a1420", border: "1px solid #132232", borderRadius: 5, padding: "6px 7px", minWidth:0 }}>
                    <div style={{ fontSize: 7.5, color: "#5a7a94", fontWeight: 700, letterSpacing: 0.4 }}>DESBLOQUEO</div>
                    <div style={{ fontSize: 8.5, color: "#8ab4cc", marginTop: 4, lineHeight: 1.3, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{nextUnlockHint}</div>
                  </div>
                </div>
              </div>

              {/* Footer detalle */}
              <div style={{ height: 24, minHeight: 24, background: "#070c14", borderTop: "1px solid #162232", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", flexShrink: 0 }}>
                <span style={{ fontSize: 7.5, color: "#3a5a78", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  <b style={{ color: "#7a9ab8" }}>J</b> abrir/cerrar
                </span>
                <span style={{ fontSize: 7.5, color: "#3a5a78", flexShrink:0 }}>{selectedMission.id}</span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#3a5a78", fontSize: 10 }}>
              Selecciona misión
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#132a3a" : "transparent",
        color: active ? "#8acfff" : "#5a7a94",
        border: "none",
        borderRadius: 3,
        padding: "2px 6px",
        fontSize: 8.5,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label} ({count})
    </button>
  );
}

function StatusBadge({ status }: { status: MissionData["status"] }) {
  const cfg = getStatusConfig(status);
  return (
    <span style={{ fontSize: 7.5, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function getStatusConfig(status: MissionData["status"]) {
  switch (status) {
    case "completed":
      return { label: "Hecha", icon: "✔", color: "#4caf50", bg: "#0a1e0a", border: "#1e4a2a" };
    case "active":
      return { label: "En Curso", icon: "▶", color: "#ffcc33", bg: "#1e1808", border: "#4a3a0a" };
    case "available":
      return { label: "Disponible", icon: "●", color: "#42a5f5", bg: "#0a1824", border: "#1e3a4a" };
    case "locked":
    default:
      return { label: "Bloqueada", icon: "🔒", color: "#6a7a8a", bg: "#0f1418", border: "#1e2a32" };
  }
}

const primaryBtnStyle: React.CSSProperties = {
  background: "#1a3a5a",
  color: "#8acfff",
  border: "1px solid #2a5a8a",
  borderRadius: 4,
  padding: "4px 9px",
  fontSize: 9,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
};

export default MissionsPanel;
