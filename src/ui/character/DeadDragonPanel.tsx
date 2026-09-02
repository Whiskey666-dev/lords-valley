import { useDeadDragonPanel } from "../../hooks/character/useDeadDragonPanel";

export interface DeadDragonPanelData {
  id: string;
  name: string;
  nombre?: string;
  isDeadDragon?: boolean;
  isAlly: boolean;
  health: number;
  maxHealth: number;
  salud?: number;
  maxSalud?: number;
  energia: number;
  maxEnergia: number;
  // legacy
  orden?: string;
  ordenesDisponibles?: string[];
  // nuevo sistema 3 categorías
  comportamiento?: string;
  funcion?: string;
  comportamientosDisponibles?: string[];
  funcionesDisponibles?: string[];
  habilidadesActivas?: string[];
  habilidadCategorias?: string[];
  habilidadesDetalle?: Record<string, string[]>;
  habilidadLabels?: Record<string, string>;
  habilidadesSeleccionadas?: Record<string, string[]>;
  hogar?: { x: number; y: number } | null;
  hasHogar?: boolean;
  hogarPos?: { x: number; y: number };
  inventoryItems?: { id: string; nombre: string; cantidad: number; categoria?: string }[];
  inventorySlots?: { total: number; disponibles: number; bloqueados: number; ocupados: number };
  equipment?: { montura: any | null; mochila: any | null; hasMochila: boolean };
  equipamiento?: string[];
  inventario?: string[];
  positionX?: number;
  positionY?: number;
  x?: number;
  y?: number;
  profession?: string;
}

interface Props {
  dragon: DeadDragonPanelData;
  onClose: () => void;
}

export function DeadDragonPanel({ dragon: initialDragon, onClose }: Props) {
  const {
    dragon, showHabilidadesMenu, setShowHabilidadesMenu,
    salud, maxSalud, energia, maxEnergia,
    saludPct, energiaPct,
    disponibles, bloqueados, ocupados, items,
    comportamiento, funcion,
    habilidadesActivas, habilidadesSeleccionadas,
    hasHogar, hogarPos,
    COMPORTAMIENTOS, FUNCIONES, HABILIDAD_CATEGORIAS, HABILIDADES_DETALLE, HABILIDAD_LABELS,
    handleComportamiento, handleFuncion,
    handleToggleHabilidadCat, handleToggleHabilidad,
    handleSetHogar, handleEquip, handleDamage, handleAddTestItem,
  } = useDeadDragonPanel(initialDragon, onClose);

  const isAlly = dragon.isAlly;

  return (
    <div
      style={{
        position: "fixed",
        right: 0, top: 32, bottom: 0,
        width: "320px", minWidth: "280px", maxWidth: "92vw",
        borderLeft: isAlly ? "2px solid #a855f7" : "2px solid #ef4444",
        backgroundColor: "#151515",
        boxSizing: "border-box",
        overflowX: "hidden", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 10,
        zIndex: 100,
        boxShadow: "-4px 0 24px #000000aa",
        padding: "14px 14px 18px 14px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: 8, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 13, color: isAlly ? "#c4b5fd" : "#fca5a5", display: "flex", alignItems: "center", gap: 6 }}>
          <span>{isAlly ? "🐉" : "💀🐉"}</span> {dragon.name}
          <span style={{ fontSize: 9, background: isAlly ? "#2a1f3d" : "#3d1f1f", color: isAlly ? "#a78bfa" : "#f87171", padding: "1px 5px", borderRadius: 4, border: `1px solid ${isAlly ? "#4c1d95" : "#7f1d1d"}` }}>
            {isAlly ? "Aliado" : "Enemigo"}
          </span>
        </h2>
        <button onClick={onClose} style={{ background: "#222", color: "#888", border: "1px solid #333", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>

      {/* Salud / Energía */}
      <div style={{ backgroundColor: "#1c1c1c", padding: 10, borderRadius: 8, border: "1px solid #2e2e2e", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#ccc" }}>
            <span>❤️ Salud</span>
            <span style={{ color: saludPct === 100 ? "#4ade80" : saludPct > 40 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>{salud}/{maxSalud} ({saludPct}%)</span>
          </div>
          <div style={{ width: "100%", background: "#2a2a2a", borderRadius: 4, height: 8, marginTop: 4, overflow: "hidden", border: "1px solid #333" }}>
            <div style={{ width: `${saludPct}%`, background: saludPct > 60 ? "#22c55e" : saludPct > 30 ? "#f59e0b" : "#ef4444", height: "100%", borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 8, color: "#666", marginTop: 2, textAlign: "right" }}>Barra sprite oculta hasta recibir daño</div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#ccc" }}>
            <span>⚡ Energía</span>
            <span style={{ color: "#60a5fa", fontWeight: 700 }}>{energia}/{maxEnergia} ({energiaPct}%)</span>
          </div>
          <div style={{ width: "100%", background: "#2a2a2a", borderRadius: 4, height: 8, marginTop: 4, overflow: "hidden", border: "1px solid #333" }}>
            <div style={{ width: `${energiaPct}%`, background: "#3b82f6", height: "100%", borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ fontSize: 9, color: "#666", display: "flex", justifyContent: "space-between", borderTop: "1px solid #2a2a2a", paddingTop: 6 }}>
          <span>📍 {Math.round(dragon.positionX ?? dragon.x ?? 0)}, {Math.round(dragon.positionY ?? dragon.y ?? 0)}</span>
          <span style={{ color: isAlly ? "#a78bfa" : "#f87171" }}>{dragon.profession ?? "Dead Dragon"}</span>
        </div>
        {hogarPos && hasHogar && (
          <div style={{ fontSize: 8, color: "#22c55e", background: "#0a1f12", border: "1px solid #14532d", borderRadius: 4, padding: "3px 6px", textAlign: "center" }}>
            🏠 Hogar: {Math.round(hogarPos.x)},{Math.round(hogarPos.y)}
          </div>
        )}
      </div>

      {!isAlly ? (
        <div style={{ background: "#2a1212", border: "1px solid #7f1d1d", borderRadius: 8, padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700 }}>⚠️ Enemigo Hostil</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>No controlable. Barra vida solo al recibir daño.</div>
          <button onClick={handleDamage} style={{ marginTop: 8, background: "#7f1d1d", color: "#fff", border: "1px solid #ef4444", borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>Probar daño (250)</button>
        </div>
      ) : (
        <>
          {/* Equipamiento */}
          <div style={{ backgroundColor: "#1c1c1c", padding: 10, borderRadius: 8, border: "1px solid #2e2e2e", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>🎒 Equipamiento (2)</span>
              <span style={{ fontSize: 8, color: "#666", fontWeight: 400 }}>Click para equipar</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div onClick={() => handleEquip("montura")} style={{ background: dragon.equipment?.montura ? "#2a1f3d" : "#1e1e1e", border: dragon.equipment?.montura ? "1px solid #7c3aed" : "1px dashed #333", borderRadius: 6, padding: "8px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <div style={{ fontSize: 18 }}>{dragon.equipment?.montura ? "🐎" : "🪶"}</div>
                <div style={{ fontSize: 8, color: dragon.equipment?.montura ? "#c4b5fd" : "#666", fontWeight: 600 }}>Montura</div>
                <div style={{ fontSize: 7, color: dragon.equipment?.montura ? "#fff" : "#555", textAlign: "center" }}>{dragon.equipment?.montura ? dragon.equipment.montura.nombre : "Vacío"}</div>
              </div>
              <div onClick={() => handleEquip("mochila")} style={{ background: dragon.equipment?.mochila ? "#1e3322" : "#1e1e1e", border: dragon.equipment?.mochila ? "1px solid #22c55e" : "1px dashed #333", borderRadius: 6, padding: "8px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <div style={{ fontSize: 18 }}>{dragon.equipment?.mochila ? "🎒" : "🔒"}</div>
                <div style={{ fontSize: 8, color: dragon.equipment?.mochila ? "#4ade80" : "#666", fontWeight: 600 }}>Mochila</div>
                <div style={{ fontSize: 7, color: dragon.equipment?.mochila ? "#fff" : "#555", textAlign: "center" }}>{dragon.equipment?.mochila ? `${dragon.equipment.mochila.nombre} (+15)` : "Vacío (+15)"}</div>
              </div>
            </div>
            {!dragon.equipment?.mochila && <div style={{ fontSize: 8, color: "#f59e0b", marginTop: 6, textAlign: "center", background: "#2a2415", padding: "3px 6px", borderRadius: 4, border: "1px solid #92400e" }}>Equipa Mochila para +15 slots</div>}
          </div>

          {/* CATEGORIA 1: Comportamiento */}
          <div style={{ backgroundColor: "#1c1c1c", padding: 10, borderRadius: 8, border: "1px solid #2e2e2e", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, marginBottom: 6, letterSpacing: 0.3, display: "flex", alignItems: "center", gap: 4 }}>
              <span>🔥 Categoria 1 — Comportamiento</span>
              <span style={{ fontSize: 8, color: "#666", fontWeight: 400, marginLeft: "auto" }}>excluyente</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
              {COMPORTAMIENTOS.map(c => {
                const active = comportamiento === c;
                const color = c === "Agresivo" ? "#ef4444" : c === "Defensivo" ? "#3b82f6" : "#6b7280";
                const desc = c === "Agresivo"
                  ? "Ataca a cualquier enemigo a 10 chunks del jugador"
                  : c === "Defensivo"
                    ? "Solo contraataca si el jugador es atacado primero"
                    : "No ataca (Pacifico)";
                return (
                  <button key={c} onClick={() => handleComportamiento(c as any)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, background: active ? "#2a1212" : "#1e1e1e", border: active ? `1px solid ${color}` : "1px solid #333", borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, border: active ? "2px solid #fff" : "1px solid #555", display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: active ? "#fff" : "#ccc", fontWeight: active ? 700 : 500 }}>{c}</span>
                      </div>
                      {active && <span style={{ fontSize: 10, color }}>●</span>}
                    </div>
                    <span style={{ fontSize: 8, color: "#777", lineHeight: 1.2 }}>{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORIA 2: Funciones */}
          <div style={{ backgroundColor: "#1c1c1c", padding: 10, borderRadius: 8, border: "1px solid #2e2e2e", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <span>🟢 Categoria 2 — Funciones</span>
              <span style={{ fontSize: 8, color: "#666", fontWeight: 400, marginLeft: "auto" }}>excluyente</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
              {FUNCIONES.map(f => {
                const active = funcion === f;
                const disabled = f === "Ve a casa" && !hasHogar;
                const desc = f === "Espera aqui"
                  ? "Se queda inmóvil en el lugar actual"
                  : f === "Sigueme"
                    ? "Sigue al jugador a donde vaya"
                    : hasHogar
                      ? `Va a hogar ${Math.round(hogarPos!.x)},${Math.round(hogarPos!.y)}`
                      : "Requiere hogar designado";
                return (
                  <button key={f} onClick={() => !disabled && handleFuncion(f as any)} disabled={disabled}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, background: active ? "#0a1f12" : "#1e1e1e", border: active ? "1px solid #22c55e" : disabled ? "1px dashed #333" : "1px solid #333", borderRadius: 6, padding: "6px 8px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: active ? "#4ade80" : disabled ? "#666" : "#ccc", fontWeight: active ? 700 : 500 }}>{f}</span>
                      {active && <span style={{ fontSize: 10, color: "#22c55e" }}>●</span>}
                      {disabled && <span style={{ fontSize: 8, color: "#f59e0b" }}>requiere hogar</span>}
                    </div>
                    <span style={{ fontSize: 8, color: "#777" }}>{desc}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={handleSetHogar}
              style={{ marginTop: 8, width: "100%", background: hasHogar ? "#14532d" : "#1e3a2a", color: hasHogar ? "#4ade80" : "#a7f3d0", border: `1px solid ${hasHogar ? "#22c55e" : "#2a5a3a"}`, borderRadius: 6, padding: "6px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              📍 {hasHogar ? "Actualizar Hogar aquí" : "Designar Hogar aquí"} {hasHogar ? `(${Math.round(hogarPos!.x)},${Math.round(hogarPos!.y)})` : ""}
            </button>
            {!hasHogar && <div style={{ fontSize: 8, color: "#f59e0b", marginTop: 4, textAlign: "center" }}>Designa un hogar para habilitar "Ve a casa"</div>}
          </div>

          {/* CATEGORIA 3: Habilidades (multiple) */}
          <div style={{ backgroundColor: "#1c1c1c", padding: 10, borderRadius: 8, border: "1px solid #2e2e2e", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <span>✨ Categoria 3 — Habilidades</span>
              <span style={{ fontSize: 8, color: "#666", fontWeight: 400, marginLeft: "auto" }}>múltiple</span>
            </div>
            <div style={{ fontSize: 8, color: "#777", marginBottom: 6 }}>Activa las categorías que usará en combate (ahorra energía). Se usan solo habilidades seleccionadas en el menú.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {HABILIDAD_CATEGORIAS.map(cat => {
                const active = habilidadesActivas.has(cat);
                const label = (HABILIDAD_LABELS as any)[cat] ?? cat;
                const icon = cat === "Ataques Fisicos" ? "⚔️" : cat === "Magia" ? "🔮" : cat === "Soporte" ? "💚" : "☠️";
                return (
                  <label key={cat} style={{ display: "flex", alignItems: "center", gap: 6, background: active ? "#1a1530" : "#1e1e1e", border: active ? "1px solid #7c3aed" : "1px solid #333", borderRadius: 6, padding: "6px 8px", cursor: "pointer" }}>
                    <input type="checkbox" checked={active} onChange={() => handleToggleHabilidadCat(cat)} style={{ accentColor: "#7c3aed" }} />
                    <span style={{ fontSize: 10 }}>{icon}</span>
                    <span style={{ fontSize: 9, color: active ? "#c4b5fd" : "#aaa", fontWeight: active ? 700 : 500 }}>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Menú de habilidades detallado */}
          <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 8, flexShrink: 0 }} data-dd-habilidades>
            <button onClick={() => setShowHabilidadesMenu(v => !v)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: showHabilidadesMenu ? "#1a1530" : "#252525", border: "1px solid #444", borderRadius: 6, padding: "7px 10px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <span>⚙️ Habilidades</span>
              <span style={{ fontSize: 10, color: "#a78bfa", transform: showHabilidadesMenu ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
            </button>
            <div style={{ fontSize: 8, color: "#666", marginTop: 4, textAlign: "center" }}>Selecciona qué habilidades usará por categoría</div>

            {showHabilidadesMenu && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                {HABILIDAD_CATEGORIAS.map(cat => {
                  const label = (HABILIDAD_LABELS as any)[cat] ?? cat;
                  const list = (HABILIDADES_DETALLE as any)[cat] as string[];
                  const selected = new Set(habilidadesSeleccionadas[cat] ?? []);
                  const catActive = habilidadesActivas.has(cat);
                  return (
                    <div key={cat} style={{ background: "#1e1e1e", border: `1px solid ${catActive ? "#7c3aed" : "#2a2a2a"}`, borderRadius: 6, padding: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: catActive ? "#c4b5fd" : "#888", fontWeight: 700 }}>{label}</span>
                        <span style={{ fontSize: 8, color: catActive ? "#4ade80" : "#666", background: catActive ? "#0a1f12" : "#1a1a1a", border: `1px solid ${catActive ? "#14532d" : "#333"}`, borderRadius: 4, padding: "1px 5px" }}>{catActive ? "Activa" : "Inactiva"}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {list.map(hab => {
                          const checked = selected.has(hab);
                          return (
                            <label key={hab} style={{ display: "flex", alignItems: "center", gap: 6, background: checked ? "#1a2530" : "#151515", border: checked ? "1px solid #3b82f6" : "1px solid #2a2a2a", borderRadius: 4, padding: "5px 6px", cursor: "pointer" }}>
                              <input type="checkbox" checked={checked} onChange={() => handleToggleHabilidad(cat, hab)} style={{ accentColor: "#3b82f6" }} />
                              <span style={{ fontSize: 9, color: checked ? "#93c5fd" : "#aaa", fontWeight: checked ? 600 : 400 }}>{hab}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 8, color: "#666", textAlign: "center", background: "#0f0f0f", padding: "4px 6px", borderRadius: 4, border: "1px dashed #333" }}>
                  Activa categorías en "Habilidades" y selecciona habilidades aquí. En combate usará solo las marcadas → ahorra energía.
                </div>
              </div>
            )}
          </div>

          {/* Inventario */}
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, flex: "0 1 auto", minHeight: 140, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 700 }}>📦 Inventario</span>
              <span style={{ fontSize: 8, color: "#666" }}>{ocupados}/{disponibles} · {bloqueados} bloqueados · {dragon.inventorySlots?.total ?? 20} máx</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {Array.from({ length: disponibles }).map((_, i) => {
                const it = items[i];
                if (it) return (
                  <div key={it.id} title={`${it.nombre} x${it.cantidad}`} style={{ aspectRatio: "1", minWidth: 0, background: "#252525", border: "1px solid #3a3a3a", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: 2 }}>
                    <div style={{ fontSize: 10 }}>📦</div>
                    <div style={{ fontSize: 6, color: "#fff", fontWeight: 700, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nombre.slice(0, 6)}</div>
                    <div style={{ position: "absolute", bottom: 1, right: 2, fontSize: 6, color: "#c4b5fd", background: "#2a1f3d", borderRadius: 2, padding: "0 2px" }}>x{it.cantidad}</div>
                  </div>
                );
                return <div key={`empty-${i}`} style={{ aspectRatio: "1", minWidth: 0, background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, color: "#444" }}>·</span></div>;
              })}
              {Array.from({ length: bloqueados }).map((_, i) => (
                <div key={`locked-${i}`} title="Bloqueado — requiere Mochila" style={{ aspectRatio: "1", minWidth: 0, background: "#0f0f0f", border: "1px dashed #333", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}><span style={{ fontSize: 9 }}>🔒</span></div>
              ))}
            </div>
            <div style={{ fontSize: 7, color: "#555", textAlign: "center", marginTop: 4 }}>{dragon.equipment?.hasMochila ? "Mochila equipada — 20 slots" : "5 libres + 15 bloqueados (equipa Mochila)"}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={handleDamage} style={{ flex: 1, background: "#2a1212", color: "#fca5a5", border: "1px solid #7f1d1d", borderRadius: 4, padding: "4px 6px", fontSize: 8, cursor: "pointer" }}>Probar daño 250</button>
              <button onClick={handleAddTestItem} style={{ flex: 1, background: "#1e1e1e", color: "#888", border: "1px solid #333", borderRadius: 4, padding: "4px 6px", fontSize: 8, cursor: "pointer" }}>+ Item test</button>
            </div>
          </div>

          <div style={{ fontSize: 8, color: "#555", textAlign: "center", padding: "2px 0" }}>Órdenes 3 categorías combinables • Habilidades ahorran energía • Barra vida oculta hasta daño</div>
        </>
      )}
    </div>
  );
}

export default DeadDragonPanel;
