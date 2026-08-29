import { useEffect, useState } from "react";
import { KeybindsEditor } from "./KeybindsEditor";

type SettingsCategory = "graficos" | "teclado" | "guardado" | "cuenta" | "inicio" | "cerrar";

interface Props {
  onClose: () => void;
}

const CATEGORIES: { id: SettingsCategory; label: string; icon: string }[] = [
  { id: "graficos", label: "Gráficos", icon: "🖥️" },
  { id: "teclado", label: "Teclado", icon: "⌨️" },
  { id: "guardado", label: "Guardado", icon: "💾" },
  { id: "cuenta", label: "Cuenta", icon: "👤" },
  { id: "inicio", label: "Inicio", icon: "🏠" },
  { id: "cerrar", label: "Cerrar", icon: "⏻" },
];

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
  background: '#1e1e1e', color: '#bbb', border: '1px solid #2a2a2a',
};

export function SettingsPanel({ onClose }: Props) {
  const [category, setCategory] = useState<SettingsCategory>("graficos");

  // Mock local - ajustes de gráficos (sin persistencia todavía)
  const [fps, setFps] = useState("60");
  const [renderizado, setRenderizado] = useState("Media");
  const [sombras, setSombras] = useState("Media");
  const [liquidos, setLiquidos] = useState(true);
  const [particulas, setParticulas] = useState("Media");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const selectStyle: React.CSSProperties = {
    width: '100%', background: '#1e1e1e', color: '#ddd', border: '1px solid #333',
    borderRadius: 6, padding: '8px 10px', fontSize: 12, cursor: 'pointer', outline: 'none',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 12, padding: '10px 0', borderBottom: '1px solid #2a2a2a',
  };

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: 640, maxWidth: '94vw', maxHeight: '82vh', backgroundColor: '#151515',
      border: '1px solid #333', borderRadius: 12, display: 'flex', zIndex: 200,
      boxShadow: '0 12px 40px #00000088', overflow: 'hidden'
    }}>
      {/* Sidebar de categorías */}
      <div style={{ width: 150, minWidth: 150, background: '#101010', borderRight: '1px solid #2a2a2a', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#fff' }}>Configuración</h3>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              ...btnStyle,
              background: category === c.id ? '#1e2a3a' : 'transparent',
              color: category === c.id ? '#8ab4ff' : '#aaa',
              border: category === c.id ? '1px solid #4a90e2' : '1px solid transparent',
              fontSize: 12,
              padding: '8px 10px',
            }}
          >
            <span style={{ fontSize: 14 }}>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#ddd' }}>
            {CATEGORIES.find(c => c.id === category)?.icon} {CATEGORIES.find(c => c.id === category)?.label}
          </h3>
          <button onClick={onClose} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 16 }}>

          {category === "graficos" && (
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
                <button onClick={() => setLiquidos(v => !v)} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: liquidos ? '#1e3322' : '#2a2a2a', color: liquidos ? '#6f6' : '#999',
                  border: liquidos ? '1px solid #2e7d32' : '1px solid #444'
                }}>
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
          )}

          {category === "teclado" && <KeybindsEditor />}

          {category === "guardado" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 1 espacio por defecto de partida guardada */}
              <div style={{ background: '#1c1c1c', border: '1px solid #2e7d32', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Partida 1</span>
                  <span style={{ fontSize: 10, color: '#6f6', background: '#1e3322', border: '1px solid #2e7d32', borderRadius: 4, padding: '2px 6px' }}>Guardada</span>
                </div>
                <span style={{ fontSize: 11, color: '#888' }}>Último guardado: automático</span>
                <button style={{ alignSelf: 'flex-start', marginTop: 4, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#2e7d32', color: '#fff', border: '1px solid #3a9a3e' }}>Continuar</button>
              </div>
              {/* Espacio para crear nueva partida */}
              <button style={{
                width: '100%', padding: 14, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: '#1e1e1e', color: '#bbb', border: '1px dashed #3a3a3a', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                ＋ Nueva Partida
              </button>
            </div>
          )}

          {category === "cuenta" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>
                Guarda tu progreso en la nube y sincroniza entre dispositivos iniciando sesión.
              </p>
              <button style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#fff', color: '#111', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span>🔵</span> Iniciar sesión con Google
              </button>
              <button style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#1e2a3a', color: '#8ab4ff', border: '1px solid #4a90e2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span>🏰</span> Iniciar sesión con Lords Valley Account
              </button>
            </div>
          )}

          {category === "inicio" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>
                Vuelve al menú principal del juego. (Disponible próximamente)
              </p>
              <button disabled style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#222', color: '#666', border: '1px solid #333', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                🏠 Ir al menú de inicio
              </button>
            </div>
          )}

          {category === "cerrar" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>
                Cierra el juego y vuelve al sistema. (Disponible próximamente)
              </p>
              <button disabled style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#2a1a1a', color: '#a66', border: '1px solid #5a3030', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                ⏻ Cerrar juego
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}