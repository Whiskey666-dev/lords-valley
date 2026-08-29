import React from "react";

interface Props {
  fps: string;
  setFps: (val: string) => void;
  renderizado: string;
  setRenderizado: (val: string) => void;
  sombras: string;
  setSombras: (val: string) => void;
  liquidos: boolean;
  toggleLiquidos: () => void;
  particulas: string;
  setParticulas: (val: string) => void;
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#1e1e1e',
  color: '#ddd',
  border: '1px solid #333',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 12,
  cursor: 'pointer',
  outline: 'none',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #2a2a2a',
};

export function GraphicsSettingsTab({
  fps,
  setFps,
  renderizado,
  setRenderizado,
  sombras,
  setSombras,
  liquidos,
  toggleLiquidos,
  particulas,
  setParticulas,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={rowStyle}>
        <span style={{ fontSize: 12, color: '#ccc' }}>Límite de FPS</span>
        <select value={fps} onChange={e => setFps(e.target.value)} style={selectStyle}>
          <option value="30">30</option>
          <option value="60">60</option>
          <option value="120">120</option>
          <option value="144">144</option>
          <option value="0">Ilimitado</option>
        </select>
      </div>
      <div style={rowStyle}>
        <span style={{ fontSize: 12, color: '#ccc' }}>Renderizado</span>
        <select value={renderizado} onChange={e => setRenderizado(e.target.value)} style={selectStyle}>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Ultra">Ultra</option>
        </select>
      </div>
      <div style={rowStyle}>
        <span style={{ fontSize: 12, color: '#ccc' }}>Calidad de sombras</span>
        <select value={sombras} onChange={e => setSombras(e.target.value)} style={selectStyle}>
          <option value="Desactivadas">Desactivadas</option>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
      </div>
      <div style={rowStyle}>
        <span style={{ fontSize: 12, color: '#ccc' }}>Líquidos</span>
        <button
          onClick={toggleLiquidos}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            background: liquidos ? '#1e3322' : '#2a2a2a',
            color: liquidos ? '#6f6' : '#999',
            border: liquidos ? '1px solid #2e7d32' : '1px solid #444',
          }}
        >
          {liquidos ? 'Activado' : 'Desactivado'}
        </button>
      </div>
      <div style={{ ...rowStyle, borderBottom: 'none' }}>
        <span style={{ fontSize: 12, color: '#ccc' }}>Partículas</span>
        <select value={particulas} onChange={e => setParticulas(e.target.value)} style={selectStyle}>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
      </div>
    </div>
  );
}
