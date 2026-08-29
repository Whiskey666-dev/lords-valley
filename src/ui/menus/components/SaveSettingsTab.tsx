export function SaveSettingsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 1 espacio por defecto de partida guardada */}
      <div style={{
        background: '#1c1c1c',
        border: '1px solid #2e7d32',
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Partida 1</span>
          <span style={{ fontSize: 10, color: '#6f6', background: '#1e3322', border: '1px solid #2e7d32', borderRadius: 4, padding: '2px 6px' }}>Guardada</span>
        </div>
        <span style={{ fontSize: 11, color: '#888' }}>Último guardado: automático</span>
        <button style={{
          alignSelf: 'flex-start',
          marginTop: 4,
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          background: '#2e7d32',
          color: '#fff',
          border: '1px solid #3a9a3e',
        }}>
          Continuar
        </button>
      </div>

      {/* Espacio para crear nueva partida */}
      <button style={{
        width: '100%',
        padding: 14,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        background: '#1e1e1e',
        color: '#bbb',
        border: '1px dashed #3a3a3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        ＋ Nueva Partida
      </button>
    </div>
  );
}
