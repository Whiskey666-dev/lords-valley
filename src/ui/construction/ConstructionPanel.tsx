import { useState, useMemo, useEffect } from "react";
import {
  INITIAL_BUILDINGS,
  CATEGORY_INFO,
  type BuildingData,
  type BuildingCategory,
} from "../../hooks/buildings/buildingsData";
import {
  MISSION_CATEGORIES,
  type MissionCategoryId,
} from "../../hooks/missions/missionsData";

interface Props {
  onClose: () => void;
}

// Mejoras por edificio basadas en capítulos de misión
interface UpgradeInfo {
  id: string;
  name: string;
  description: string;
  chapterId: MissionCategoryId;
  tier: number;
  cost: { name: string; amount: number; icon: string }[];
}

function getUpgradesForBuilding(b: BuildingData): UpgradeInfo[] {
  // Coste base para mejoras: usa unlockCost o fallback genérico por tier/categoría
  const baseCost = b.unlockCost && b.unlockCost.length > 0
    ? b.unlockCost
    : b.tier === 1
      ? [{ name: "Madera", amount: 40, icon: "🪵" }, { name: "Piedra", amount: 30, icon: "🪨" }]
      : b.tier === 2
        ? [{ name: "Piedra Labrada", amount: 70, icon: "🧱" }, { name: "Tablas", amount: 50, icon: "🪵" }]
        : [{ name: "Piedra Labrada", amount: 150, icon: "🧱" }, { name: "Oro", amount: 50, icon: "💰" }];

  const scaleCost = (factor: number): { name: string; amount: number; icon: string }[] =>
    baseCost.map(c => ({ ...c, amount: Math.round(c.amount * factor) }));

  if (b.tier === 1) {
    return [
      {
        id: `${b.id}_up2`,
        name: "Ampliación a Nivel 2",
        description: "+2 puestos de trabajo y +35% capacidad de bodega. Desbloquea gestión intermedia.",
        chapterId: "asentamiento",
        tier: 2,
        cost: scaleCost(1.2),
      },
      {
        id: `${b.id}_up3`,
        name: "Mejora Señorial",
        description: "+50% eficiencia, permite supervisores y previene desperdicios. Requiere administración feudal.",
        chapterId: "senorio",
        tier: 3,
        cost: scaleCost(1.8),
      },
      {
        id: `${b.id}_up4`,
        name: "Maestría Imperial",
        description: "Automatización parcial y +100% producción. Tecnología de imperio sostenible.",
        chapterId: "imperio",
        tier: 4,
        cost: scaleCost(2.6),
      },
    ];
  }
  if (b.tier === 2) {
    return [
      {
        id: `${b.id}_up3`,
        name: "Refuerzo Ducal",
        description: "+40% durabilidad, almacén reforzado y +1 puesto especializado.",
        chapterId: "ducado",
        tier: 3,
        cost: scaleCost(1.4),
      },
      {
        id: `${b.id}_up4`,
        name: "Fortificación de Conquista",
        description: "Defensa +30% y habilita producción militar. Requiere doctrina de guerra.",
        chapterId: "conquista",
        tier: 4,
        cost: scaleCost(2.0),
      },
      {
        id: `${b.id}_up5`,
        name: "Obra Imperial Perfeccionada",
        description: "Máxima tecnología imperial: producción autónoma y bonificación global.",
        chapterId: "imperio",
        tier: 5,
        cost: scaleCost(2.8),
      },
    ];
  }
  // tier 3
  return [
    {
      id: `${b.id}_up4`,
      name: "Legado de Conquista",
      description: "+50% prestigio y +25% eficiencia en crisis. Requiere dominio militar.",
      chapterId: "conquista",
      tier: 4,
      cost: scaleCost(1.6),
    },
    {
      id: `${b.id}_up5`,
      name: "Obra Imperial Definitiva",
      description: "Monumento imperial: +100% capacidad y legitimidad divina. Pináculo tecnológico.",
      chapterId: "imperio",
      tier: 5,
      cost: scaleCost(2.4),
    },
  ];
}

const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as BuildingCategory[];

export function ConstructionPanel({ onClose }: Props) {
  const [filterCategory, setFilterCategory] = useState<BuildingCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "existing" | "locked">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingData[]>(INITIAL_BUILDINGS);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleConstruct = (id: string) => {
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, status: "existing" as const, level: 1, efficiency: 75 } : b));
  };

  const filtered = useMemo(() => {
    return buildings.filter(b => {
      if (filterCategory !== "all" && b.category !== filterCategory) return false;
      if (filterStatus === "existing" && b.status !== "existing") return false;
      if (filterStatus === "locked" && b.status !== "locked") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.categoryLabel.toLowerCase().includes(q);
      }
      return true;
    });
  }, [buildings, filterCategory, filterStatus, search]);

  const stats = useMemo(() => {
    return {
      total: buildings.length,
      existing: buildings.filter(b => b.status === "existing").length,
      locked: buildings.filter(b => b.status === "locked").length,
    };
  }, [buildings]);

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
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        .c-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .c-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .c-scroll::-webkit-scrollbar-thumb { background: #22374e; border-radius: 3px; }
        .c-scroll::-webkit-scrollbar-thumb:hover { background: #33557a; }
        .c-card { transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease; }
        .c-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.45); }
      `}</style>

      <div
        style={{
          width: 1080,
          maxWidth: "97vw",
          height: 680,
          maxHeight: "92vh",
          background: "#0c141f",
          border: "1px solid #1e3a2e",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header - Taller de Construcción */}
        <div
          style={{
            minHeight: 48,
            background: "linear-gradient(180deg, #0b1e16 0%, #07120e 100%)",
            borderBottom: "1px solid #1a3a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            gap: 10,
            flexShrink: 0,
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, overflow: "hidden" }}>
            <span style={{ fontSize: 18, filter: "drop-shadow(0 0 6px rgba(46,125,50,0.5))", flexShrink: 0 }}>🔨</span>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#e8f5e9", letterSpacing: 0.3, whiteSpace: "nowrap", lineHeight: 1 }}>Taller de Construcción</span>
                <span style={{ fontSize: 7.5, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#1a2f1e", color: "#66bb6a", border: "1px solid #2e7d32", whiteSpace: "nowrap" }}>
                  {stats.total} edificios · {ALL_CATEGORIES.length} categorías
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#6a9a7a", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520 }}>
                56 edificios de 7 escuelas constructivas + mejoras por capítulos de misión
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0a1a12", border: "1px solid #1e3a2a", borderRadius: 6, padding: "2px 6px", flexShrink: 0 }}>
              <span style={{ fontSize: 8, color: "#6a9a7a", fontWeight: 700 }}>PROGRESO</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#66bb6a" }}>{stats.existing}/{stats.total}</span>
              <div style={{ width: 70, height: 4, background: "#07120e", borderRadius: 2, overflow: "hidden", border: "1px solid #1a3a2a" }}>
                <div style={{ width: `${Math.round((stats.existing / Math.max(1, stats.total)) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#2e7d32,#66bb6a)", borderRadius: 2 }} />
              </div>
            </div>
            <input
              type="text"
              placeholder="Buscar edificio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") { (e.target as HTMLInputElement).blur(); return; }
                e.stopPropagation();
              }}
              onKeyUp={e => e.stopPropagation()}
              onKeyPress={e => e.stopPropagation()}
              autoComplete="off"
              spellCheck={false}
              style={{
                background: "#0a1a12",
                border: "1px solid #1e3a2a",
                borderRadius: 5,
                padding: "4px 8px",
                fontSize: 10.5,
                color: "#e0f0e0",
                outline: "none",
                width: 150,
              }}
            />
            <button
              onClick={onClose}
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
                flexShrink: 0,
              }}
            >
              ✕ <span style={{ fontSize: 8, opacity: 0.6 }}>[ESC]</span>
            </button>
          </div>
        </div>

        {/* Filtros - categorías en menú desplegable para ahorrar espacio */}
        <div
          style={{
            minHeight: 36,
            background: "#09120e",
            borderBottom: "1px solid #142a1c",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 10px",
            gap: 10,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", background: "#060a0e", padding: 2, borderRadius: 5, border: "1px solid #142a1c", flexShrink: 0 }}>
              <FilterChip label="Todos" count={stats.total} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
              <FilterChip label="Construidos" count={stats.existing} active={filterStatus === "existing"} onClick={() => setFilterStatus("existing")} />
              <FilterChip label="Bloqueados" count={stats.locked} active={filterStatus === "locked"} onClick={() => setFilterStatus("locked")} />
            </div>
            <div style={{ width: 1, height: 18, background: "#142a1c", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: "#66806a", fontWeight: 600, whiteSpace: "nowrap" }}>Categoría:</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as BuildingCategory | "all")}
                onKeyDown={e => e.stopPropagation()}
                onKeyUp={e => e.stopPropagation()}
                style={{
                  background: "#0f1f14",
                  color: "#8ab4a0",
                  border: "1px solid #1e3a2a",
                  borderRadius: 5,
                  padding: "4px 8px",
                  fontSize: 10,
                  outline: "none",
                  cursor: "pointer",
                  minWidth: 190,
                  maxWidth: 220,
                }}
              >
                <option value="all">🌐 Todas las categorías ({stats.total})</option>
                {ALL_CATEGORIES.map(cat => {
                  const info = CATEGORY_INFO[cat];
                  const count = buildings.filter(b => b.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {info.icon} {info.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 7.5, color: "#5a7a6a", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#66bb6a", display: "inline-block", boxShadow: "0 0 5px rgba(102,187,106,0.6)" }} />
            Mostrando {filtered.length} / {stats.total}
          </div>
        </div>

        {/* Leyenda capítulos */}
        <div
          style={{
            minHeight: 26,
            background: "#0a1410",
            borderBottom: "1px solid #142a1c",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 7.5, fontWeight: 800, color: "#6a9a7a", letterSpacing: 0.5 }}>MEJORAS POR CAPÍTULO:</span>
          {Object.values(MISSION_CATEGORIES).map(cat => (
            <span
              key={cat.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 7,
                fontWeight: 700,
                background: cat.bg,
                color: cat.color,
                border: `1px solid ${cat.border}`,
                padding: "1px 5px",
                borderRadius: 10,
                whiteSpace: "nowrap",
              }}
              title={`${cat.label} — ${cat.subtitle}`}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: cat.color, display: "inline-block" }} />
              {cat.shortLabel} {cat.icon}
            </span>
          ))}
          <span style={{ fontSize: 7, color: "#4a6a5a", marginLeft: 4 }}>· color = capítulo requerido para desbloquear</span>
        </div>

        {/* Grid de edificios */}
        <div className="c-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "#080e14", padding: 10, minHeight: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#5a7a7a", fontSize: 11 }}>No se encontraron edificios con esos filtros.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, alignItems: "start" }}>
              {filtered.map(b => {
                const catInfo = CATEGORY_INFO[b.category];
                const isLocked = b.status === "locked";
                const isExpanded = expandedId === b.id;
                const upgrades = getUpgradesForBuilding(b);
                return (
                  <div
                    key={b.id}
                    className="c-card"
                    style={{
                      background: isLocked ? "#0b1016" : "#0e1a22",
                      border: `1px solid ${isExpanded ? "#2e7d32" : isLocked ? "#1a2632" : "#1e3a2e"}`,
                      borderRadius: 7,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: isLocked ? "#0a1410" : "#0c1a14", borderBottom: `1px solid ${isLocked ? "#142a1c" : "#1a3326"}` }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          background: isLocked ? "#121a12" : catInfo.color + "18",
                          border: `1px solid ${isLocked ? "#1e2a1e" : catInfo.color + "55"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                          boxShadow: isLocked ? "none" : `0 0 8px ${catInfo.color}22`,
                        }}
                      >
                        {b.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: isLocked ? "#b0c4b0" : "#e8f5e9", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                          <span style={{ fontSize: 7, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: isLocked ? "#1a1200" : "#0a2a14", color: isLocked ? "#c9a86a" : "#66bb6a", border: `1px solid ${isLocked ? "#3a2a0a" : "#2e7d32"}`, whiteSpace: "nowrap" }}>
                            T{b.tier}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                          <span style={{ fontSize: 7, fontWeight: 700, background: catInfo.color + "14", color: catInfo.color, border: `1px solid ${catInfo.color}33`, padding: "0 4px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <span>{catInfo.icon}</span> {catInfo.label}
                          </span>
                          <span style={{ fontSize: 7, color: isLocked ? "#6a7a6a" : "#5a9a6a" }}>{isLocked ? "Bloqueado" : `Nv.${b.level} · ${b.efficiency}%`}</span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 7.5,
                          fontWeight: 800,
                          padding: "2px 5px",
                          borderRadius: 3,
                          background: isLocked ? "#281212" : "#0c2818",
                          color: isLocked ? "#ff7a7a" : "#4ade80",
                          border: `1px solid ${isLocked ? "#4a1a1a" : "#1a4a24"}`,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {isLocked ? "🔒 Bloqueado" : "✓ Construido"}
                      </span>
                    </div>

                    {/* Descripción */}
                    <div style={{ padding: "6px 9px 0", fontSize: 9, color: "#8ab4a0", lineHeight: 1.3, minHeight: 26 }}>
                      {b.description}
                    </div>

                    {/* Recursos necesarios */}
                    <div style={{ padding: "6px 9px", display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 7.5, fontWeight: 800, color: "#6a9a7a", letterSpacing: 0.4 }}>RECURSOS PARA CONSTRUIR</span>
                        {isLocked && b.unlockCost ? (
                          <span style={{ fontSize: 7, color: "#6a7a6a" }}>{b.unlockCost.length} tipos</span>
                        ) : null}
                      </div>
                      {isLocked && b.unlockCost && b.unlockCost.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {b.unlockCost.map((c, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 9,
                                fontWeight: 600,
                                background: "#0f1a12",
                                color: "#c8e6c9",
                                border: "1px solid #1e3a2a",
                                padding: "2px 6px",
                                borderRadius: 4,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span>{c.icon}</span> {c.amount} {c.name}
                            </span>
                          ))}
                        </div>
                      ) : isLocked ? (
                        <div style={{ fontSize: 8, color: "#5a7a6a", background: "#0a1410", border: "1px solid #142a1c", padding: "3px 6px", borderRadius: 4, textAlign: "center" }}>
                          Sin requisitos — desbloqueo por progreso
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {b.inventory.slice(0, 2).map(it => (
                            <span key={it.id} style={{ fontSize: 8, color: "#5a7a6a", background: "#0a1410", border: "1px solid #142a1c", padding: "1px 5px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 3 }}>
                              {it.icon} {it.name} <span style={{ color: "#3a6a4a" }}>({it.quantity}/{it.maxCapacity})</span>
                            </span>
                          ))}
                          <span style={{ fontSize: 7, color: "#4a6a5a", padding: "1px 4px" }}>· Ya construido</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div style={{ padding: "0 9px 7px", display: "flex", gap: 5 }}>
                      {isLocked ? (
                        <button
                          onClick={() => handleConstruct(b.id)}
                          style={{
                            flex: 1,
                            background: "linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%)",
                            color: "#fff",
                            border: "1px solid #388e3c",
                            borderRadius: 5,
                            padding: "5px 8px",
                            fontSize: 9.5,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            boxShadow: "0 2px 6px rgba(46,125,50,0.3)",
                          }}
                        >
                          🔨 Construir
                        </button>
                      ) : (
                        <div style={{ flex: 1, background: "#0a1a12", color: "#4a7a6a", border: "1px solid #142a1c", borderRadius: 5, padding: "4px 8px", fontSize: 9, fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          ✓ Operativo · 👥 {b.workers.filter(w => !!w.npcName).length}/{b.maxWorkers}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                        style={{
                          background: isExpanded ? "#122a16" : "#0f1a12",
                          color: isExpanded ? "#66bb6a" : "#6a9a7a",
                          border: `1px solid ${isExpanded ? "#2e7d32" : "#1e3a2a"}`,
                          borderRadius: 5,
                          padding: "4px 8px",
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isExpanded ? "▲ Mejoras" : "▼ Mejoras"} <span style={{ fontSize: 7, background: "#1a3320", color: "#66bb6a", padding: "1px 4px", borderRadius: 3, border: "1px solid #2e7d32" }}>{upgrades.length}</span>
                      </button>
                    </div>

                    {/* Dropdown mejoras */}
                    {isExpanded && (
                      <div style={{ background: "#070c10", borderTop: "1px solid #142a1c", padding: "7px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 7.5, fontWeight: 800, color: "#6a9a7a", letterSpacing: 0.4 }}>MEJORAS DISPONIBLES — CAPÍTULO REQUERIDO</span>
                          <span style={{ fontSize: 7, color: "#4a6a5a" }}>color = capítulo</span>
                        </div>
                        {upgrades.map(up => {
                          const chap = MISSION_CATEGORIES[up.chapterId];
                          return (
                            <div
                              key={up.id}
                              style={{
                                background: "#0a1410",
                                border: `1px solid ${chap.border}`,
                                borderLeft: `3px solid ${chap.color}`,
                                borderRadius: 5,
                                padding: "6px 7px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              <div style={{ position: "absolute", top: 0, right: 0, width: 40, height: 40, background: `radial-gradient(40px at 100% 0%, ${chap.color}18 0%, transparent 70%)`, pointerEvents: "none" }} />
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 7,
                                    fontWeight: 800,
                                    background: chap.bg,
                                    color: chap.color,
                                    border: `1px solid ${chap.border}`,
                                    padding: "1px 5px",
                                    borderRadius: 10,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: chap.color, display: "inline-block" }} />
                                  {chap.shortLabel} · {chap.label}
                                </span>
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: "#e8f5e9" }}>{up.name}</span>
                                <span style={{ fontSize: 7, fontWeight: 700, background: "#1a2a12", color: "#8ab4a0", border: "1px solid #1e3a2a", padding: "1px 4px", borderRadius: 3 }}>T{up.tier}</span>
                              </div>
                              <div style={{ fontSize: 8.5, color: "#8ab4a0", lineHeight: 1.3 }}>{up.description}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 7, fontWeight: 700, color: "#6a9a7a" }}>Coste mejora:</span>
                                {up.cost.map((c, i) => (
                                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 8, fontWeight: 600, background: "#0f1a12", color: "#c8e6c9", border: "1px solid #1e3a2a", padding: "1px 5px", borderRadius: 3 }}>
                                    {c.icon} {c.amount} {c.name}
                                  </span>
                                ))}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                                <span style={{ fontSize: 7, color: chap.color, background: chap.bg, border: `1px solid ${chap.border}`, padding: "1px 5px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  {chap.icon} Requiere {chap.label} — Cap {chap.chapter}
                                </span>
                                <span style={{ fontSize: 7, color: "#4a6a5a" }}>{chap.subtitle}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ background: "#0a1410", border: "1px dashed #1e3a2a", borderRadius: 4, padding: "4px 6px", display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 10 }}>💡</span>
                          <span style={{ fontSize: 7.5, color: "#6a9a7a", lineHeight: 1.3 }}>
                            Cada mejora exige desbloquear el capítulo indicado. El color identifica el capítulo: verde supervivencia, azul asentamiento, morado señorío, naranja ducado, rojo conquista, dorado imperio.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ minHeight: 28, background: "#070c10", borderTop: "1px solid #142a1c", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 7, color: "#5a7a6a" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} /> Construido
            </span>
            <span style={{ width: 1, height: 8, background: "#142a1c" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: 2, background: "#281212", border: "1px solid #4a1a1a", display: "inline-block" }} /> Bloqueado
            </span>
            <span style={{ width: 1, height: 8, background: "#142a1c" }} />
            <span>🔨 Construir · ▼ Mejoras por capítulo</span>
          </div>
          <div style={{ fontSize: 7, color: "#3a5a4a" }}>Cap color = tecnología requerida</div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#1a3320" : "transparent",
        color: active ? "#66bb6a" : "#6a9a7a",
        border: active ? "1px solid #2e7d32" : "1px solid transparent",
        borderRadius: 4,
        padding: "2px 6px",
        fontSize: 9,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {label} <span style={{ fontSize: 7, background: active ? "#2e7d32" : "#142a1c", color: active ? "#fff" : "#6a9a7a", padding: "0 3px", borderRadius: 3 }}>{count}</span>
    </button>
  );
}

export default ConstructionPanel;
