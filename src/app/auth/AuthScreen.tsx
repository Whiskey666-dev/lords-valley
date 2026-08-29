import { useAuth } from "../../hooks/auth/useAuth";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const {
    mode,
    setMode,
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
  } = useAuth(onAuthenticated);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', padding: 16 }}>
      <div style={{ width: 380, background: '#151515', border: '1px solid #222', borderRadius: 12, padding: 24, boxShadow: '0 8px 32px #00000099' }}>
        <h1 style={{ margin: 0, fontSize: 20, color: '#ffd66b', textAlign: 'center' }}>🏰 Lords Valley</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 12, margin: '6px 0 16px' }}>Autenticación requerida antes de cargar el survival</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: mode === 'login' ? '1px solid #4a90e2' : '1px solid #333',
              background: mode === 'login' ? '#1e2a3a' : '#1a1a1a',
              color: mode === 'login' ? '#8ab4ff' : '#aaa',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: mode === 'register' ? '1px solid #4a90e2' : '1px solid #333',
              background: mode === 'register' ? '#1e2a3a' : '#1a1a1a',
              color: mode === 'register' ? '#8ab4ff' : '#aaa',
              cursor: 'pointer',
            }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: 8, border: '1px solid #333', background: '#0f0f0f', color: '#fff' }}
          />
          {mode === 'register' && (
            <input
              placeholder="Username (básico)"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ padding: '10px', borderRadius: 8, border: '1px solid #333', background: '#0f0f0f', color: '#fff' }}
            />
          )}
          <input
            placeholder="Password (mín 8)"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: 8, border: '1px solid #333', background: '#0f0f0f', color: '#fff' }}
          />
          {error && (
            <div style={{ background: '#2a1a1a', border: '1px solid #5a2a2a', color: '#ff8a80', padding: 8, borderRadius: 6, fontSize: 12 }}>
              {error}
            </div>
          )}
          <button
            disabled={loading}
            style={{
              padding: '10px',
              borderRadius: 8,
              border: '1px solid #2e7d32',
              background: loading ? '#333' : '#2e7d32',
              color: '#fff',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '...' : mode === 'register' ? 'Crear y entrar' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: 10, color: '#666', textAlign: 'center' }}>
          {mode === 'register'
            ? 'Se creará un survival inicial en el core (Settlement REFUGIO con 3 survivors)'
            : 'Usa el usuario del seed: test@lordsvalley.local / 12345678 si existe'}
          <br />
          Abre otra pestaña para crear usuario, al volver esta pestaña detectará el login vía localStorage.
        </div>
      </div>
    </div>
  );
}
