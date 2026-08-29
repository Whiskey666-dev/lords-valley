import { useRef } from "react";
import { useFollowers, type FollowerItem } from "../../hooks/character/useFollowers";
import { setConsoleOpen } from "../../ui/input/KeyBindings";

interface Props {
  onClose: () => void;
}

export function FollowersPanel({ onClose }: Props) {
  const { followersList, totalCount, searchTerm, setSearchTerm, selectAndFocusNpc } = useFollowers();
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 32,
        bottom: 0,
        width: '285px',
        minWidth: '240px',
        maxWidth: '90vw',
        borderRight: '2px solid #00ff88',
        backgroundColor: '#151515',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 100,
        boxShadow: '4px 0 24px #000000aa',
        padding: '16px 14px 20px 14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 8, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: '#00ff88', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>👥</span> Seguidores ({totalCount})
        </h2>
        <button
          onClick={onClose}
          style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
        >
          ✕
        </button>
      </div>

      {/* Buscador */}
      {totalCount > 4 && (
        <input
          ref={searchRef}
          placeholder="Buscar por nombre o profesión..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => {
            setConsoleOpen(true);
            searchRef.current?.focus();
          }}
          onFocus={() => setConsoleOpen(true)}
          onBlur={() => setConsoleOpen(false)}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            outline: 'none',
            flexShrink: 0,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* Lista de NPCs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: 2 }}>
        {followersList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 10px', textAlign: 'center', gap: 8 }}>
            <span style={{ fontSize: 32, opacity: 0.3 }}>🏕️</span>
            <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.4 }}>
              No hay NPCs en el mapa actualmente.
            </p>
            <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
              Abre la consola con <b>ENTER</b> y escribe <code>createNpc5</code> para generar seguidores.
            </p>
          </div>
        ) : (
          followersList.map((npc: FollowerItem) => {
            const posX = Math.round(npc.x ?? npc.positionX ?? 0);
            const posY = Math.round(npc.y ?? npc.positionY ?? 0);
            const health = npc.health ?? 100;
            const loyalty = npc.loyalty ?? 0;

            return (
              <div
                key={npc.id}
                onClick={() => selectAndFocusNpc(npc)}
                style={{
                  background: '#1c1c1c',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00ff88';
                  e.currentTarget.style.background = '#1e2822';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.background = '#1c1c1c';
                }}
              >
                {/* Fila superior: Nombre + Profesión */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 14 }}>👤</span>
                    <b style={{ fontSize: 12, color: '#ffd66b' }}>{npc.name}</b>
                  </div>
                  <span style={{ fontSize: 10, color: '#8cf', background: '#1e2a3a', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                    {npc.profession}
                  </span>
                </div>

                {/* Fila intermedia: Salud y Lealtad en miniatura */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 9, color: '#aaa' }}>
                  <div>
                    <span>Salud: {health}%</span>
                    <div style={{ width: '100%', height: 3, background: '#2a2a2a', borderRadius: 2, marginTop: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, health)}%`, height: '100%', background: health > 50 ? '#4caf50' : '#e53935' }} />
                    </div>
                  </div>
                  <div>
                    <span>Lealtad: {loyalty}%</span>
                    <div style={{ width: '100%', height: 3, background: '#2a2a2a', borderRadius: 2, marginTop: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, loyalty)}%`, height: '100%', background: loyalty === 100 ? '#ffd700' : '#00ff88' }} />
                    </div>
                  </div>
                </div>

                {/* Fila inferior: Posición + Botón Ver */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#666', marginTop: 2 }}>
                  <span>📍 {posX}, {posY}</span>
                  <span style={{ color: '#00ff88', fontSize: 10, fontWeight: 700 }}>
                    👁️ Ver NPC →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: 10, color: '#555', textAlign: 'center', flexShrink: 0 }}>
        Click en un NPC para centrar la cámara y ver sus detalles
      </div>
    </div>
  );
}
