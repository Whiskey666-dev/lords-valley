import { useSettingsPanel } from "../../hooks/menu/useSettingsPanel";
import { KeybindsEditor } from "./KeybindsEditor";
import { GraphicsSettingsTab } from "./components/GraphicsSettingsTab";
import { SaveSettingsTab } from "./components/SaveSettingsTab";
import { AccountSettingsTab } from "./components/AccountSettingsTab";

interface Props {
  onClose: () => void;
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#1e1e1e',
  color: '#bbb',
  border: '1px solid #2a2a2a',
};

export function SettingsPanel({ onClose }: Props) {
  const {
    category,
    setCategory,
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
    categories,
    currentCategory,
  } = useSettingsPanel(onClose);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 640,
      maxWidth: '94vw',
      maxHeight: '82vh',
      backgroundColor: '#151515',
      border: '1px solid #333',
      borderRadius: 12,
      display: 'flex',
      zIndex: 200,
      boxShadow: '0 12px 40px #00000088',
      overflow: 'hidden',
    }}>
      {/* Sidebar de categorías */}
      <div style={{ width: 150, minWidth: 150, background: '#101010', borderRight: '1px solid #2a2a2a', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#fff' }}>Configuración</h3>
        {categories.map(c => (
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
            {currentCategory?.icon} {currentCategory?.label}
          </h3>
          <button onClick={onClose} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 16 }}>
          {category === "graficos" && (
            <GraphicsSettingsTab
              fps={fps}
              setFps={setFps}
              renderizado={renderizado}
              setRenderizado={setRenderizado}
              sombras={sombras}
              setSombras={setSombras}
              liquidos={liquidos}
              toggleLiquidos={toggleLiquidos}
              particulas={particulas}
              setParticulas={setParticulas}
            />
          )}

          {category === "teclado" && <KeybindsEditor />}

          {category === "guardado" && <SaveSettingsTab />}

          {category === "cuenta" && <AccountSettingsTab />}

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