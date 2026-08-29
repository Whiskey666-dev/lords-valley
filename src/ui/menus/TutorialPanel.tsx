import { KeybindsEditor } from "./KeybindsEditor";

interface Props {
  show: boolean;
  onClose: () => void;
}

/**
 * TutorialPanel.tsx - UI/Menu - Panel de tutorial y configuración de teclas.
 * Ubicado en src/ui/menus/ como interfaz pura, reutilizando KeybindsEditor.
 */
export function TutorialPanel({ show, onClose }: Props) {
  if (!show) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 36,
      left: 12,
      zIndex: 30,
      width: 360,
      backgroundColor: '#151515f2',
      border: '1px solid #333',
      borderRadius: 10,
      padding: 14,
      boxShadow: '0 8px 24px #00000066'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Tutorial — Teclas</h3>
        <button
          onClick={onClose}
          style={{ background: '#2a2a2a', color: '#aaa', border: '1px solid #444', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#8cf', background: '#1e2a33', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
        👆 <b>Click izquierdo</b> permite interactuar con el entorno y NPCs
      </div>
      <KeybindsEditor />
    </div>
  );
}
