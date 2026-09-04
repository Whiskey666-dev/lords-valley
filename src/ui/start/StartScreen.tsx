import { useEffect, useState } from "react";
import { fetchSettlementsByOwner, createSettlement, renameSettlement, deleteSettlement, fetchSettlement } from "../../app/api/settlement.api";
import { api } from "../../app/api/client";
import { SettingsPanel } from "../menus/SettingsPanel";

interface Props {
  onEnterGame: (settlementId: string) => void;
  onLogout?: () => void;
}

type View = "main" | "new" | "continue" | "saves" | "config";

export function StartScreen({ onEnterGame, onLogout }: Props) {
  const [view, setView] = useState<View>("main");
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [infoSettlement, setInfoSettlement] = useState<any | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const playerRaw = localStorage.getItem("player");
  const parsedPlayer = playerRaw ? JSON.parse(playerRaw) : null;
  const playerId = localStorage.getItem("playerId") || parsedPlayer?.id;
  const username = parsedPlayer?.username || "Señor Feudal";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // check backend
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await api.get("/settlements/owner/__health__", { timeout: 4000 });
        if (!cancelled) setBackendStatus("online");
      } catch (e: any) {
        // si 404 es que backend está online (ruta no existe pero responde)
        if (e?.response) {
          if (!cancelled) setBackendStatus("online");
        } else {
          // intentar ping a /api/docs
          try {
            await api.get("/api/docs", { timeout: 4000 });
            if (!cancelled) setBackendStatus("online");
          } catch {
            if (!cancelled) setBackendStatus("offline");
          }
          // fallback: si error es network, marcar offline
          if (e?.code === "ERR_NETWORK" || e?.message?.includes("Network")) {
            if (!cancelled) setBackendStatus("offline");
          }
        }
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const loadSettlements = async () => {
    if (!playerId) { setError("No hay playerId. Vuelve a iniciar sesión."); return; }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSettlementsByOwner(playerId);
      setSettlements(list);
      setBackendStatus("online");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Error cargando partidas";
      if (!e?.response && (e?.code === "ERR_NETWORK" || msg.includes("Network") || msg.includes("timeout"))) {
        setBackendStatus("offline");
        setError(`No se pudo conectar con el backend (${apiUrl}). Verifica que D:\\Lords Valley\\lords-valley-core esté en ejecución: "npm run start:dev" en puerto 3000.`);
      } else if (status === 401) {
        setError("Sesión expirada (401). Vuelve a iniciar sesión.");
      } else {
        setError(Array.isArray(msg) ? msg.join(", ") : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, [playerId]);

  useEffect(() => {
    if (view === "continue" || view === "saves") loadSettlements();
  }, [view]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { setError("El nombre no puede estar vacío"); return; }
    if (trimmed.length < 2) { setError("Mínimo 2 caracteres"); return; }
    if (!playerId) { setError("Sin playerId"); return; }
    setCreating(true);
    setError(null);
    try {
      const data = await createSettlement({ name: trimmed, ownerId: playerId });
      localStorage.setItem("settlementId", data.id);
      onEnterGame(data.id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error creando partida";
      if (!e?.response && (e?.code === "ERR_NETWORK" || msg.includes("Network"))) {
        setBackendStatus("offline");
        setError(`Network error al crear partida. Backend ${apiUrl} no responde. Ejecuta el core: npm run start:dev`);
      } else {
        setError(Array.isArray(msg) ? msg.join(", ") : msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEnter = (id: string) => {
    localStorage.setItem("settlementId", id);
    onEnterGame(id);
  };

  const handleRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    if (trimmed.length < 2) { setError("Nombre muy corto"); return; }
    try {
      await renameSettlement(id, trimmed);
      setRenameId(null);
      setRenameValue("");
      await loadSettlements();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error renombrando";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Borrar la partida "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteSettlement(id);
      if (localStorage.getItem("settlementId") === id) localStorage.removeItem("settlementId");
      await loadSettlements();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error borrando";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const handleInfo = async (id: string) => {
    setInfoLoading(true);
    try {
      const data = await fetchSettlement(id);
      setInfoSettlement(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error cargando info";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleLogoutInner = () => {
    if (!confirm("¿Cerrar sesión y volver al login?")) return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("player");
    localStorage.removeItem("playerId");
    localStorage.removeItem("settlementId");
    window.dispatchEvent(new CustomEvent("auth-changed"));
    onLogout?.();
  };

  return (
    <div
      style={{
        height: "100dvh",
        minHeight: "100dvh",
        maxHeight: "100dvh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(1200px at 50% 0%, #1a2a1e 0%, #0a0f0e 45%, #050707 100%)",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "clamp(8px, 1.5vh, 16px)",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .start-scroll::-webkit-scrollbar { width: 4px; }
        .start-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .start-scroll::-webkit-scrollbar-thumb { background: #1e3a2a; border-radius: 3px; }
        .start-btn { transition: all 0.12s ease; }
        .start-btn:active { transform: scale(0.99); }
        @media (max-height: 700px) {
          .start-header { padding: 10px 14px 8px !important; }
          .start-logo { font-size: 18px !important; }
          .start-content { padding: 10px !important; gap: 8px !important; min-height: auto !important; }
          .start-main-btn { padding: 8px 10px !important; }
          .start-main-icon { width: 32px !important; height: 32px !important; font-size: 16px !important; }
        }
        @media (max-width: 520px) {
          .start-panel { width: 96vw !important; }
        }
      `}</style>

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(46,125,50,0.06) 0%, transparent 40%, rgba(0,0,0,0.45) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 900, height: 900, background: "radial-gradient(circle, rgba(102,187,106,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div
        className="start-panel"
        style={{
          width: "min(460px, 96vw)",
          maxWidth: "96vw",
          maxHeight: "min(92dvh, 760px)",
          height: "auto",
          background: "#0f1412",
          border: "1px solid #1e3a2a",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header - compacto y siempre visible */}
        <div
          className="start-header"
          style={{
            padding: "14px 16px 10px",
            background: "linear-gradient(180deg, #0b1e16 0%, #09140f 100%)",
            borderBottom: "1px solid #1a3322",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div className="start-logo" style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 900, color: "#ffd66b", letterSpacing: 0.5, textShadow: "0 1px 0 #000, 0 0 14px rgba(255,214,107,0.35)", lineHeight: 1 }}>🏰 Lords Valley</div>
          <div style={{ fontSize: "clamp(8px, 1.8vw, 10px)", color: "#6a9a7a", letterSpacing: 1, fontWeight: 700, marginTop: 2 }}>SURVIVAL · COLONY · ISOMÉTRICO</div>
          <div style={{ fontSize: 9, color: "#4a6a5a", marginTop: 4, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>Bienvenido, <span style={{ color: "#c8e6c9", fontWeight: 700 }}>{username}</span></span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: backendStatus === "online" ? "#2ecc71" : backendStatus === "offline" ? "#e74c3c" : "#f1c40f", boxShadow: `0 0 6px ${backendStatus === "online" ? "#2ecc71" : "#e74c3c"}`, display: "inline-block" }} title={backendStatus} />
            <span style={{ fontSize: 8, color: backendStatus === "offline" ? "#ff8a80" : "#5a7a6a" }}>{backendStatus === "offline" ? "Backend offline" : backendStatus === "online" ? "Backend online" : "Comprobando..."}</span>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="start-content start-scroll" style={{ padding: "clamp(10px, 2vw, 14px)", display: "flex", flexDirection: "column", gap: "clamp(8px, 1.2vh, 12px)", flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          {view === "main" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <MainButton icon="✨" label="Nueva Partida" desc="Crea un nuevo mundo por defecto" color="#2e7d32" onClick={() => { setView("new"); setNewName(`Valle de ${username}`); setError(null); }} />
                <MainButton icon="📂" label="Continuar Partida" desc={settlements.length ? `${settlements.length} partida(s)` : "Sin partidas — crea una nueva"} color="#1e3a5f" onClick={() => setView("continue")} />
                <MainButton icon="💾" label="Partidas Guardadas" desc="Renombrar · Información · Borrar" color="#3e2723" onClick={() => setView("saves")} />
                <MainButton icon="⚙️" label="Configuración" desc="Gráficos · Teclado · Cuenta" color="#2a2a33" onClick={() => setView("config")} />
              </div>

              <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, color: "#4a6a5a" }}>{settlements.length} mundo(s) · {playerId ? playerId.slice(-6) : ""} </span>
                <button onClick={handleLogoutInner} style={{ fontSize: 10, color: "#ff7a7a", background: "#1a0f0f", border: "1px solid #3a1a1a", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>⎋ Cerrar sesión</button>
              </div>

              {backendStatus === "offline" && (
                <div style={{ background: "#2a1300", border: "1px solid #8d4a00", color: "#ffcc80", padding: 8, borderRadius: 6, fontSize: 10, lineHeight: 1.4 }}>
                  <strong>Backend no disponible</strong> en <code style={{ background: "#1a0f00", padding: "1px 4px", borderRadius: 3 }}>{apiUrl}</code><br />
                  Ejecuta en terminal: <code style={{ background: "#1a0f00", padding: "1px 4px", borderRadius: 3 }}>cd lords-valley-core && npm run start:dev</code> y recarga. Si usas otro puerto, ajusta <code>.env</code> `VITE_API_URL`.
                  <button onClick={() => { setBackendStatus("checking"); loadSettlements(); }} style={{ marginTop: 6, background: "#3e2723", color: "#ffcc80", border: "1px solid #6d4c41", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 10 }}>↺ Reintentar</button>
                </div>
              )}

              {error && <div style={{ background: "#2a1a1a", border: "1px solid #5a2a2a", color: "#ff8a80", padding: 8, borderRadius: 6, fontSize: 11, wordBreak: "break-word" }}>{error}</div>}
            </>
          )}

          {view === "new" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setView("main")} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>← Volver</button>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#e8f5e9" }}>Nueva Partida</span>
              </div>
              <div style={{ background: "#0a1a12", border: "1px solid #1e3a2a", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 9, color: "#6a9a7a", fontWeight: 700, letterSpacing: 0.4 }}>NOMBRE DEL MUNDO</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Valle del Amanecer"
                  maxLength={40}
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid #2a4a3a",
                    borderRadius: 6,
                    padding: "9px 10px",
                    color: "#e8f5e9",
                    fontSize: 12,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 8, color: "#4a6a5a", lineHeight: 1.4 }}>Tier REFUGIO · 3 supervivientes · recursos iniciales. Podrás renombrar después.</div>
                {error && <div style={{ color: "#ff7a7a", fontSize: 10, background: "#1a0f0f", border: "1px solid #3a1a1a", padding: 6, borderRadius: 4, wordBreak: "break-word" }}>{error}</div>}
                <button
                  onClick={handleCreate}
                  disabled={creating || backendStatus === "offline"}
                  title={backendStatus === "offline" ? "Backend offline" : ""}
                  style={{
                    background: creating || backendStatus === "offline" ? "#333" : "linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%)",
                    color: "#fff",
                    border: "1px solid #3a9a3e",
                    borderRadius: 6,
                    padding: "9px",
                    fontWeight: 800,
                    cursor: creating || backendStatus === "offline" ? "not-allowed" : "pointer",
                    fontSize: 11,
                    opacity: backendStatus === "offline" ? 0.6 : 1,
                  }}
                >
                  {creating ? "Creando..." : "🌱 Crear y Entrar al Mundo"}
                </button>
                {backendStatus === "offline" && <div style={{ fontSize: 9, color: "#ff8a80", textAlign: "center" }}>Backend offline — no se puede crear partida</div>}
              </div>
            </div>
          )}

          {view === "continue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setView("main")} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>← Volver</button>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#e8f5e9", whiteSpace: "nowrap" }}>Continuar</span>
                <span style={{ marginLeft: "auto", fontSize: 9, color: "#6a9a7a", background: "#0a1a12", border: "1px solid #1e3a2a", padding: "2px 6px", borderRadius: 3, whiteSpace: "nowrap" }}>{settlements.length} guardadas</span>
              </div>
              {loading ? (
                <div style={{ color: "#6a9a7a", fontSize: 11, textAlign: "center", padding: 16 }}>Cargando mundos...</div>
              ) : settlements.length === 0 ? (
                <div style={{ background: "#0a1a12", border: "1px dashed #1e3a2a", borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8ab4a0" }}>No tienes partidas guardadas</div>
                  <div style={{ fontSize: 9, color: "#4a6a5a", marginTop: 4 }}>Crea tu primer mundo para comenzar</div>
                  <button onClick={() => setView("new")} style={{ marginTop: 10, background: "#2e7d32", color: "#fff", border: "1px solid #3a9a3e", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>＋ Crear Nueva Partida</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "min(38vh, 300px)", overflowY: "auto", paddingRight: 2, minHeight: 0 }} className="start-scroll">
                  {settlements.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleEnter(s.id)}
                      style={{
                        background: "#0e1a14",
                        border: "1px solid #1e3a2a",
                        borderRadius: 8,
                        padding: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: "#0a1a12", border: "1px solid #1e3a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🌲</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#e8f5e9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                        <div style={{ fontSize: 8, color: "#6a9a7a" }}>{s.tier} · {s.survivors?.length ?? 0} sup · Día {s.currentDay} Año {s.currentYear}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#66bb6a", background: "#0a1a12", border: "1px solid #2e7d32", padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>▶ Entrar</span>
                    </div>
                  ))}
                </div>
              )}
              {error && <div style={{ color: "#ff7a7a", fontSize: 10, wordBreak: "break-word" }}>{error}</div>}
              {backendStatus === "offline" && <div style={{ fontSize: 9, color: "#ff8a80", textAlign: "center" }}>Sin conexión al backend</div>}
            </div>
          )}

          {view === "saves" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setView("main")} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>← Volver</button>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#e8f5e9", whiteSpace: "nowrap" }}>Guardadas</span>
                <button onClick={loadSettlements} style={{ marginLeft: "auto", background: "#0a1a12", color: "#6a9a7a", border: "1px solid #1e3a2a", borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontSize: 9, whiteSpace: "nowrap" }}>↺ Recargar</button>
              </div>
              {loading ? (
                <div style={{ color: "#6a9a7a", fontSize: 11, textAlign: "center", padding: 16 }}>Cargando...</div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6a9a7a", fontSize: 11, padding: 12 }}>Sin partidas guardadas</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "min(40vh, 320px)", overflowY: "auto", paddingRight: 2, minHeight: 0 }} className="start-scroll">
                  {settlements.map(s => (
                    <div key={s.id} style={{ background: "#0e1a14", border: "1px solid #1e3a2a", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {renameId === s.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            maxLength={40}
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") handleRename(s.id); if (e.key === "Escape") { setRenameId(null); setRenameValue(""); } }}
                            style={{ flex: 1, minWidth: 0, background: "#0f0f0f", border: "1px solid #2a4a3a", borderRadius: 6, padding: "6px 7px", color: "#fff", fontSize: 11 }}
                            placeholder="Nuevo nombre"
                          />
                          <button onClick={() => handleRename(s.id)} style={{ background: "#2e7d32", color: "#fff", border: "1px solid #3a9a3e", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>Guardar</button>
                          <button onClick={() => { setRenameId(null); setRenameValue(""); }} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 11 }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#e8f5e9", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                          <span style={{ fontSize: 7, color: "#6a9a7a", background: "#0a1a12", border: "1px solid #1e3a2a", padding: "1px 4px", borderRadius: 3, flexShrink: 0 }}>{s.tier}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 8, color: "#6a9a7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ID {s.id.slice(-8)} · {s.survivors?.length ?? 0} sup · Día {s.currentDay} · {new Date(s.updatedAt).toLocaleDateString()}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { setRenameId(s.id); setRenameValue(s.name); }} style={{ flex: 1, background: "#0a1a12", color: "#8ab4a0", border: "1px solid #1e3a2a", borderRadius: 5, padding: "5px 2px", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>✏️ Renombrar</button>
                        <button onClick={() => handleInfo(s.id)} style={{ flex: 1, background: "#0a1a12", color: "#8ab4ff", border: "1px solid #1e3a5a", borderRadius: 5, padding: "5px 2px", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>ℹ️ Info</button>
                        <button onClick={() => handleDelete(s.id, s.name)} style={{ flex: 1, background: "#1a0f0f", color: "#ff7a7a", border: "1px solid #3a1a1a", borderRadius: 5, padding: "5px 2px", cursor: "pointer", fontSize: 9, fontWeight: 700 }}>🗑️ Borrar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && <div style={{ color: "#ff7a7a", fontSize: 10, wordBreak: "break-word" }}>{error}</div>}
            </div>
          )}

          {view === "config" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setView("main")} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>← Volver</button>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#e8f5e9" }}>Configuración</span>
              </div>
              <div style={{ flex: 1, minHeight: 0, maxHeight: "min(46vh, 420px)", overflowY: "auto", border: "1px solid #1e3a2a", borderRadius: 8, overflow: "hidden" }} className="start-scroll">
                <SettingsPanel onClose={() => setView("main")} hideInicio />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "6px 12px", background: "#070c0a", borderTop: "1px solid #142a1c", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 7, color: "#3a5a4a" }}>v0.1 · Lords Valley</span>
          <span style={{ fontSize: 7, color: "#3a5a4a", textAlign: "right" }}>Centro: 4 opciones</span>
        </div>
      </div>

      {infoSettlement && (
        <div onClick={e => { if (e.target === e.currentTarget) setInfoSettlement(null); }} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div style={{ width: "min(520px, 96vw)", maxWidth: "96vw", maxHeight: "88dvh", background: "#0f1412", border: "1px solid #2a4a3a", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e3a2a", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a1a12", flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#e8f5e9" }}>ℹ️ Información del Mundo</span>
              <button onClick={() => setInfoSettlement(null)} style={{ background: "#1a0f0f", color: "#ff7a7a", border: "1px solid #3a1a1a", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>✕</button>
            </div>
            <div style={{ padding: 12, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, fontSize: 11, color: "#c8e6c9", flex: 1 }} className="start-scroll">
              {infoLoading ? <div style={{ color: "#6a9a7a" }}>Cargando...</div> : (
                <>
                  <InfoRow label="Nombre" value={infoSettlement.name} />
                  <InfoRow label="ID" value={infoSettlement.id} mono small />
                  <InfoRow label="Tier" value={infoSettlement.tier} />
                  <InfoRow label="Dueño" value={infoSettlement.ownerId} mono small />
                  <InfoRow label="Día / Mes / Año" value={`${infoSettlement.currentDay} / ${infoSettlement.currentMonth} / ${infoSettlement.currentYear}`} />
                  <InfoRow label="Estación / Clima" value={`${infoSettlement.season} · ${infoSettlement.weather}`} />
                  <InfoRow label="GameTime" value={String(infoSettlement.gameTime)} />
                  <InfoRow label="Supervivientes" value={String(infoSettlement.survivors?.length ?? 0)} />
                  <InfoRow label="Edificios" value={String(infoSettlement.buildings?.length ?? 0)} />
                  <InfoRow label="Inventario" value={`${infoSettlement.inventory?.length ?? 0} tipos`} />
                  <InfoRow label="LVY" value={`${String(infoSettlement.lvyBalance).slice(0, 12)}...`} mono small />
                  <InfoRow label="Creado" value={new Date(infoSettlement.createdAt).toLocaleString()} />
                  <InfoRow label="Actualizado" value={new Date(infoSettlement.updatedAt).toLocaleString()} />
                </>
              )}
            </div>
            <div style={{ padding: 8, borderTop: "1px solid #1e3a2a", display: "flex", justifyContent: "flex-end", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setInfoSettlement(null)} style={{ background: "#1e3322", color: "#8cf", border: "1px solid #2e7d32", borderRadius: 5, padding: "6px 10px", cursor: "pointer", fontSize: 11 }}>Cerrar</button>
              <button onClick={() => { const id = infoSettlement.id; setInfoSettlement(null); handleEnter(id); }} style={{ background: "#2e7d32", color: "#fff", border: "1px solid #3a9a3e", borderRadius: 5, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>▶ Entrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MainButton({ icon, label, desc, color, onClick }: { icon: string; label: string; desc: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="start-main-btn start-btn"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "#0e1a14",
        border: "1px solid #1e3a2a",
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = "#0f1f14"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a2a"; e.currentTarget.style.background = "#0e1a14"; }}
    >
      <span className="start-main-icon" style={{ width: 34, height: 34, borderRadius: 7, background: `${color}22`, border: `1px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "clamp(11px, 2.8vw, 12px)", fontWeight: 800, color: "#e8f5e9", lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontSize: "clamp(8px, 2vw, 9px)", color: "#6a9a7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc}</div>
      </div>
      <span style={{ color: "#4a6a5a", fontSize: 14, flexShrink: 0 }}>›</span>
    </button>
  );
}

function InfoRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, borderBottom: "1px solid #142a1c", padding: "5px 0" }}>
      <span style={{ fontSize: 9, color: "#6a9a7a", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: small ? 8 : 10, color: "#e8f5e9", fontFamily: mono ? "monospace" : undefined, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

export default StartScreen;
