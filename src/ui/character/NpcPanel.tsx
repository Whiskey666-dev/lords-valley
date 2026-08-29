import { useState } from "react";

export interface NpcPanelData {
  id: string;
  name: string;
  profession: string;
  loyalty: number;
  health: number;
  edad?: number;
  traits?: string[];
  personalidad?: string;
  temperamento?: string;
  habilidad?: string;
  gustos?: string;
  inventario?: string[];
  equipamiento?: string[];
  habilidades?: string[];
  stats?: { salud: number; maxSalud: number; energia: number };
  needs?: { hambre: number; sed: number; sueno: number };
}

interface Props {
  npc: NpcPanelData;
  onClose: () => void;
}

/**
 * NpcPanel.tsx - UI/Character - Panel lateral derecho para NPCs humanos.
 * Ubicado en src/ui/character/ porque es interfaz de personaje, no lógica de juego.
 * Cada NPC es interactivo (click izquierdo) y muestra info + botones Inventario/Equipamiento/Habilidades.
 * Modular: añadir pestaña = añadir entrada en TABS.
 */
export function NpcPanel({ npc, onClose }: Props) {
  console.log("[NpcPanel] render", npc?.id, npc?.name || (npc as unknown as { nombre?: string })?.nombre);
  const [tab, setTab] = useState<"inventario" | "equipamiento" | "habilidades">("inventario");

  const TABS = [
    { id: "inventario" as const, label: "Inventario" },
    { id: "equipamiento" as const, label: "Equipamiento" },
    { id: "habilidades" as const, label: "Habilidades" },
  ];

  // Compatibilidad: soporta tanto name/nombre, profession/profesion, etc.
  const displayName = npc.name || (npc as unknown as { nombre?: string }).nombre || "Desconocido";
  const displayProfession = npc.profession || (npc as unknown as { profesion?: string }).profesion || "—";
  const displayLoyalty = npc.loyalty ?? (npc as unknown as { lealtadNivel?: number }).lealtadNivel ?? 0;
  const displayHealth = npc.health ?? (npc as unknown as { salud?: number }).salud ?? 0;

  return (
    <div style={{ position: 'fixed', right: 0, top: 32, bottom: 0, width: '285px', minWidth: '240px', maxWidth: '90vw', borderLeft: '2px solid #00ff88', backgroundColor: '#151515', boxSizing: 'border-box', overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, zIndex: 100, boxShadow: '-4px 0 24px #000000aa', padding: '16px 16px 20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 8, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: '#ffd66b' }}>🏰 {displayName}</h2>
        <button onClick={onClose} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>

      <div style={{ backgroundColor: '#1c1c1c', padding: 12, borderRadius: 8, border: '1px solid #2e2e2e', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0 }}>
        <h3 style={{ color: '#6ab0ff', margin: '0 0 6px 0', fontSize: 13 }}>👤 {displayName} {npc.edad ? <span style={{ color: '#777', fontWeight: 400, fontSize: 11 }}>({npc.edad} años)</span> : null}</h3>
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          <div><strong>Profesión:</strong> {displayProfession}</div>
          <div><strong>Personalidad:</strong> {npc.personalidad} <span style={{ color: '#999' }}>({npc.temperamento})</span></div>
          <div><strong>Rasgos:</strong> {npc.traits?.join(", ")}</div>
          <div><strong>Gustos:</strong> {npc.gustos}</div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Lealtad</span><span style={{ color: displayLoyalty === 100 ? '#ffd700' : '#aaa' }}>{Math.min(100, displayLoyalty)}% {displayLoyalty === 100 ? '★' : ''}</span></div>
          <div style={{ width: '100%', background: '#2a2a2a', borderRadius: 4, height: 8, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, displayLoyalty)}%`, maxWidth: '100%', background: displayLoyalty === 100 ? '#ffd700' : '#4caf50', height: '100%', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6 }}><span>Salud</span><span>{displayHealth}/{npc.stats?.maxSalud ?? 100} ({Math.round((displayHealth / (npc.stats?.maxSalud || 100)) * 100)}%)</span></div>
          <div style={{ width: '100%', background: '#2a2a2a', borderRadius: 4, height: 8, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.round((displayHealth / (npc.stats?.maxSalud || 100)) * 100))}%`, maxWidth: '100%', background: '#e53935', height: '100%', borderRadius: 4 }} />
          </div>
        </div>
      </div>

      {/* Botones - altura y legibilidad calculadas, sin aplastar */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              padding: '8px 6px',
              borderRadius: 6,
              border: tab === t.id ? '1px solid #4a90e2' : '1px solid #333',
              background: tab === t.id ? '#1e2a3a' : '#1e1e1e',
              color: tab === t.id ? '#8ab4ff' : '#aaa',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestaña - altura calculada para dejar ver ficha y botones, solo scroll vertical */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 14, flex: '0 1 auto', minHeight: 160, maxHeight: '42vh', maxWidth: '100%', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tab === "inventario" && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', textAlign: 'center', gap: 4 }}>
            <div style={{ fontSize: 24, opacity: 0.3 }}>📦</div>
            <h4 style={{ margin: 0, fontSize: 11, color: '#666' }}>Inventario</h4>
            <p style={{ fontSize: 10, color: '#555', margin: 0, lineHeight: 1.4 }}>Sistema en desarrollo<br/><span style={{ fontSize: 9, color: '#444' }}>Disponible próximamente</span></p>
          </div>
        )}
        {tab === "equipamiento" && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', textAlign: 'center', gap: 4 }}>
            <div style={{ fontSize: 24, opacity: 0.3 }}>🛡️</div>
            <h4 style={{ margin: 0, fontSize: 11, color: '#666' }}>Equipamiento</h4>
            <p style={{ fontSize: 10, color: '#555', margin: 0, lineHeight: 1.4 }}>Sistema en desarrollo<br/><span style={{ fontSize: 9, color: '#444' }}>Disponible próximamente</span></p>
          </div>
        )}
        {tab === "habilidades" && (
          <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#ccc' }}>Habilidades</h4>
            {npc.habilidad && <div style={{ fontSize: 12, marginBottom: 6, color: '#8cf' }}><b>Especialidad:</b> {npc.habilidad}</div>}
            {npc.habilidades && (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.6, maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'anywhere' }}>
                {npc.habilidades.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
            {npc.needs && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#999', background: '#111', padding: 6, borderRadius: 6 }}>
                Hambre: {Math.round(npc.needs.hambre)} • Sed: {Math.round(npc.needs.sed)} • Sueño: {Math.round(npc.needs.sueno)}
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: '#555', textAlign: 'center', margin: 0, flexShrink: 0 }}>
        Click izquierdo en otro NPC para cambiar • ESC o suelo para cerrar
      </p>
    </div>
  );
}
