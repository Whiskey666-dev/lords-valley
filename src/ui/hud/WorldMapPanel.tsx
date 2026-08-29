import { useWorldMap } from '../../hooks/hud/useWorldMap';
import { WORLD_W, WORLD_H } from '../../hooks/hud/worldMapProcedural';

interface Props {
  onClose: () => void;
}

export function WorldMapPanel({ onClose }: Props) {
  const {
    canvasRef,
    playerPos,
    npcs,
    filters,
    showFilters,
    seed,
    zoomPct,
    activeFilterCount,
    toggleFilter,
    toggleShowFilters,
    closeFilters,
    zoomIn,
    zoomOut,
    resetCenter,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useWorldMap({ onClose });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        background: '#030c1a',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={showFilters ? closeFilters : undefined}
    >
      {/* ── Barra superior ── */}
      <div
        style={{
          height: 42,
          minHeight: 42,
          background: '#060f1c',
          borderBottom: '1px solid #101c2e',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 12,
          flexShrink: 0,
          boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#c8b870',
            letterSpacing: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          🗺️ Mapa del Mundo
        </span>
        <div style={{ width: 1, height: 18, background: '#162030' }} />

        {/* Filtros */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={toggleShowFilters}
            style={{
              background: showFilters || activeFilterCount > 0 ? '#111e2a' : '#0c1520',
              color: activeFilterCount > 0 ? '#7ac4f0' : '#5a8a9a',
              border: `1px solid ${
                showFilters
                  ? '#1e4060'
                  : activeFilterCount > 0
                  ? '#1a3850'
                  : '#162030'
              }`,
              borderRadius: 5,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            🔍 Filtros
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: '#1a5070',
                  color: '#7acfff',
                  borderRadius: 10,
                  fontSize: 9,
                  padding: '0 5px',
                  fontWeight: 700,
                }}
              >
                {activeFilterCount}
              </span>
            )}
            <span style={{ fontSize: 9, opacity: 0.5 }}>{showFilters ? '▲' : '▼'}</span>
          </button>

          {showFilters && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                background: '#0a1828',
                border: '1px solid #162a40',
                borderRadius: 8,
                padding: '8px 0',
                zIndex: 400,
                minWidth: 235,
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              }}
            >
              <div
                style={{
                  padding: '4px 12px 8px',
                  fontSize: 9,
                  color: '#2a5a78',
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                CAPAS DEL MAPA
              </div>
              {[
                {
                  key: 'resources' as const,
                  icon: '⛏️',
                  label: 'Recursos',
                  desc: 'Yacimientos y materias primas',
                },
                {
                  key: 'anomalies' as const,
                  icon: '⚡',
                  label: 'Anomalías',
                  desc: 'Eventos y zonas especiales',
                },
                {
                  key: 'territorial' as const,
                  icon: '🏰',
                  label: 'Límites Territoriales',
                  desc: 'Ciudades, pueblos, asentamientos',
                },
              ].map((f) => (
                <div
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    background: filters[f.key]
                      ? 'rgba(30,80,120,.22)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = filters[f.key]
                      ? 'rgba(30,80,120,.22)'
                      : 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      flexShrink: 0,
                      border: `2px solid ${
                        filters[f.key] ? '#3a80c0' : '#1e3a54'
                      }`,
                      background: filters[f.key] ? '#1e5888' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {filters[f.key] && (
                      <span style={{ fontSize: 9, color: '#fff', lineHeight: 1 }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: filters[f.key] ? '#8acfff' : '#b0c0cc',
                        fontWeight: 600,
                      }}
                    >
                      {f.icon} {f.label}
                    </div>
                    <div style={{ fontSize: 9, color: '#3a5a6a', marginTop: 1 }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zoom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            borderLeft: '1px solid #162030',
            paddingLeft: 12,
          }}
        >
          <ZBtn onClick={zoomOut}>−</ZBtn>
          <span
            style={{
              fontSize: 10,
              color: '#3a6070',
              minWidth: 46,
              textAlign: 'center',
              fontFamily: 'monospace',
            }}
          >
            {zoomPct}%
          </span>
          <ZBtn onClick={zoomIn}>+</ZBtn>
        </div>

        {/* Centrar */}
        <button
          onClick={resetCenter}
          style={{
            background: '#0c1520',
            color: '#4a7a8a',
            border: '1px solid #162030',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: 10,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ⊙ Centrar
        </button>

        <div style={{ flex: 1 }} />

        {playerPos && (
          <span
            style={{
              fontSize: 10,
              color: '#2a4a5a',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            📍 {Math.round(playerPos.x)}, {Math.round(playerPos.y)}
          </span>
        )}
        {npcs.length > 0 && (
          <span style={{ fontSize: 10, color: '#005533', whiteSpace: 'nowrap' }}>
            👥 {npcs.length} NPC{npcs.length !== 1 ? 's' : ''}
          </span>
        )}

        <div style={{ width: 1, height: 18, background: '#162030' }} />

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#6a3a3a',
            border: '1px solid #2a1010',
            borderRadius: 5,
            padding: '3px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#160808';
            e.currentTarget.style.color = '#ff5555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6a3a3a';
          }}
        >
          ✕ Cerrar <span style={{ fontSize: 9, opacity: 0.4 }}>[ESC]</span>
        </button>
      </div>

      {/* ── Canvas del mapa ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'crosshair',
            userSelect: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            fontSize: 9,
            color: 'rgba(255,255,255,0.14)',
            pointerEvents: 'none',
            fontFamily: 'monospace',
          }}
        >
          Rueda: zoom · Arrastrar: mover
        </div>
      </div>

      {/* ── Leyenda ── */}
      <div
        style={{
          height: 28,
          background: '#060e1a',
          borderTop: '1px solid #0e1e2c',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <LegendDot color="#ff3b28" glow label="Tu posición" />
        {npcs.length > 0 && <LegendDot color="#00ff88" label={`NPCs (${npcs.length})`} />}
        {filters.resources && <LegendDot color="#ffd700" label="Recursos" />}
        {filters.anomalies && <LegendDot color="#b044ff" label="Anomalías" />}
        {filters.territorial && <LegendDot color="#4a90e2" label="Territorios" />}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: '#0e1e2c', letterSpacing: 0.7 }}>
          ALDORIA · Semilla {Math.round(seed)} · {WORLD_W}×{WORLD_H} sectores
        </span>
      </div>
    </div>
  );
}

function ZBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#0c1520',
        color: '#5a8a9a',
        border: '1px solid #162030',
        borderRadius: 4,
        width: 22,
        height: 22,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10,
        color: '#3a5a6a',
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: glow ? `0 0 5px ${color}` : 'none',
        }}
      />
      {label}
    </div>
  );
}

export default WorldMapPanel;
