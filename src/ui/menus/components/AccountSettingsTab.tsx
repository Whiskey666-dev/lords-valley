export function AccountSettingsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>
        Guarda tu progreso en la nube y sincroniza entre dispositivos iniciando sesión.
      </p>
      <button style={{
        width: '100%',
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        background: '#fff',
        color: '#111',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span>🔵</span> Iniciar sesión con Google
      </button>
      <button style={{
        width: '100%',
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        background: '#1e2a3a',
        color: '#8ab4ff',
        border: '1px solid #4a90e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span>🏰</span> Iniciar sesión con Lords Valley Account
      </button>
    </div>
  );
}
