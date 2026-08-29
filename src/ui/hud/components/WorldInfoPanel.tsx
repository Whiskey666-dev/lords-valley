interface WorldData {
  hasData: boolean;
  settlementName: string;
  tier: string;
  date: string;
  day: number;
  month: number;
  year: number;
  time: string;
  tick: number;
  season: string;
  seasonIcon: string;
  weather: string;
  weatherIcon: string;
}

interface Props {
  worldData: WorldData;
  onClose: () => void;
}

export function WorldInfoPanel({ worldData, onClose }: Props) {
  return (
    <div
      data-world-info-panel
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        right: 0,
        width: 220,
        backgroundColor: '#151515f2',
        border: '1px solid #333',
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow: '0 8px 24px #000000bb, 0 0 1px #ffffff22',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 40,
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2a2a', paddingBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13 }}>📅</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ffd66b' }}>
            Fecha & Entorno
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#222',
            color: '#888',
            border: '1px solid #333',
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
        {/* Fecha del juego */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1c', padding: '5px 8px', borderRadius: 6, border: '1px solid #282828' }}>
          <span style={{ color: '#888' }}>Fecha:</span>
          <b style={{ color: '#fff' }}>
            Día {worldData.day} · Mes {worldData.month} · {worldData.year}
          </b>
        </div>

        {/* Hora del juego */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1c', padding: '5px 8px', borderRadius: 6, border: '1px solid #282828' }}>
          <span style={{ color: '#888' }}>Hora:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>🕒</span>
            <b style={{ color: '#8cf', fontFamily: 'monospace', fontSize: 12 }}>{worldData.time}</b>
            <span style={{ color: '#555', fontSize: 9 }}>(t.{worldData.tick})</span>
          </div>
        </div>

        {/* Estación y Clima en 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#1c1c1c', padding: '5px 8px', borderRadius: 6, border: '1px solid #282828' }}>
            <span style={{ color: '#888', fontSize: 10 }}>Estación</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{worldData.seasonIcon}</span>
              <b style={{ color: '#ddd', fontSize: 11, textTransform: 'capitalize' }}>
                {worldData.season.toLowerCase()}
              </b>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#1c1c1c', padding: '5px 8px', borderRadius: 6, border: '1px solid #282828' }}>
            <span style={{ color: '#888', fontSize: 10 }}>Clima</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{worldData.weatherIcon}</span>
              <b style={{ color: '#ddd', fontSize: 11, textTransform: 'capitalize' }}>
                {worldData.weather.toLowerCase()}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
