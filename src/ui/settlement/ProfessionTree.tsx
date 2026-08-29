const PROFESSIONS = [
  'LENADOR','MINERO','HERRERO','SOLDADO','GOBERNADOR','MAESTRO_PRODUCCION','MEDICO','AGRICULTOR','GANADERO','CARPINTERO','ALBANIL','COCINERO','SASIESTRO','ARQUERO','CABALLERO','ESPIA','COMERCIANTE','INGENIERO','ALQUIMISTA','SACERDOTE','DIPLOMATA'
] as const;

export function ProfessionTree({ selected, onSelect }: { selected?: string; onSelect?: (p: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h4 style={{ margin: 0, fontSize: 12, color: '#ccc' }}>Árbol de 21 Profesiones</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
        {PROFESSIONS.map((p) => (
          <button
            key={p}
            onClick={() => onSelect?.(p)}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: selected === p ? '1px solid #4a90e2' : '1px solid #333',
              background: selected === p ? '#1e2a3a' : '#1e1e1e',
              color: selected === p ? '#8ab4ff' : '#aaa',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <small style={{ color: '#666', fontSize: 10 }}>Click asigna profesión al superviviente seleccionado vía PATCH /settlements/:id</small>
    </div>
  );
}
