const EQUIPPED_SLOTS = [
  { id: 'arma1', label: 'Arma 1', icon: '⚔️' },
  { id: 'arma2', label: 'Arma 2', icon: '🗡️' },
  { id: 'escudo', label: 'Escudo', icon: '🛡️' },
  { id: 'casco', label: 'Casco', icon: '⛑️' },
  { id: 'pecho', label: 'Pecho', icon: '🦺' },
  { id: 'botas', label: 'Botas', icon: '👢' },
  { id: 'collar', label: 'Collar', icon: '📿' },
  { id: 'anillo', label: 'Anillo', icon: '💍' },
  { id: 'consumible', label: 'Consum.', icon: '🧪' },
  { id: 'mochila', label: 'Mochila', icon: '🎒' },
];

export function EquippedSlotsGrid() {
  return (
    <div style={{ backgroundColor: '#1c1c1c', padding: 8, borderRadius: 8, border: '1px solid #2e2e2e', flexShrink: 0 }}>
      <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>Equipado</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, width: '100%' }}>
        {EQUIPPED_SLOTS.map(slot => (
          <div
            key={slot.id}
            title={slot.label}
            style={{
              aspectRatio: '1',
              background: '#252525',
              border: '1px solid #333',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              padding: 2,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 13, lineHeight: 1 }}>{slot.icon}</div>
            <div style={{ fontSize: 6, color: '#888', fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1 }}>{slot.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
