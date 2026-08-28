import { useEffect, useState } from "react";
import { BINDING_INFOS, getAllBindings, getBinding, setBinding, resetBindings, displayKey, subscribe, setRebinding, type GameAction } from "../input/KeyBindings";

interface Props {
  show: boolean;
  onClose: () => void;
}

/**
 * TutorialPanel.tsx - UI/Menu - Panel de tutorial y configuración de teclas.
 * Ubicado en src/ui/menus/ porque es interfaz pura, no lógica de juego.
 * Usa src/ui/input/KeyBindings.ts para configuración, desacoplado de characters/*.
 * Todas las animaciones (walk/idle/jump/dash/attack/death) se documentan aquí como solo teclas.
 */
export function TutorialPanel({ show, onClose }: Props) {
  const [bindings, setBindings] = useState<Record<string, string>>(() => getAllBindings());
  const [pending, setPending] = useState<Record<string, string>>(() => getAllBindings());
  const [editing, setEditing] = useState<GameAction | null>(null);

  useEffect(() => {
    setRebinding(editing !== null);
  }, [editing]);

  useEffect(() => {
    if (show) {
      setPending({ ...getAllBindings() });
      setEditing(null);
    }
  }, [show]);

  useEffect(() => {
    const unsub = subscribe(() => setBindings(getAllBindings()));
    return unsub;
  }, []);

  useEffect(() => {
    if (!editing) return;
    const handleRebind = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const raw = e.key === " " ? "SPACE" : e.key;
      if (raw.toUpperCase() === "ESCAPE") { setEditing(null); return; }
      let norm = raw;
      const upper = norm.toUpperCase().trim();
      if (upper === " " || upper === "SPACE" || upper === "SPACEBAR") norm = "SPACE";
      else if (upper === "SHIFT" || upper === "SHIFTRIGHT" || upper === "SHIFTLEFT") norm = "SHIFT";
      else if (upper === "TAB") norm = "TAB";
      else if (upper === "ESC" || upper === "ESCAPE") norm = "ESC";
      else if (upper.length === 1) norm = upper;
      else norm = upper;
      setPending(prev => ({ ...prev, [editing]: norm }));
      setEditing(null);
    };
    window.addEventListener("keydown", handleRebind);
    return () => window.removeEventListener("keydown", handleRebind);
  }, [editing]);

  if (!show) return null;

  const hasChanges = (Object.keys(pending) as GameAction[]).some(k => pending[k] !== bindings[k]);

  const handleSave = () => {
    let changed = 0;
    for (const k of Object.keys(pending) as GameAction[]) {
      if (pending[k] !== bindings[k]) {
        setBinding(k, pending[k]);
        changed++;
      }
    }
    if (changed > 0) {
      setTimeout(() => setPending({ ...getAllBindings() }), 0);
    }
  };

  const handleCancel = () => {
    setPending({ ...bindings });
    setEditing(null);
  };

  const handleReset = () => {
    resetBindings();
    setPending({ ...getAllBindings() });
    setEditing(null);
  };

  return (
    <div style={{ position: 'absolute', top: 36, left: 12, zIndex: 30, width: 360, backgroundColor: '#151515f2', border: '1px solid #333', borderRadius: 10, padding: 14, boxShadow: '0 8px 24px #00000066' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Tutorial — Teclas</h3>
        <button onClick={onClose} style={{ background: '#2a2a2a', color: '#aaa', border: '1px solid #444', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ fontSize: 11, color: '#8cf', background: '#1e2a33', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
        👆 <b>Click izquierdo</b> permite interactuar con el entorno y NPCs
      </div>
      {editing && <div style={{ fontSize: 11, color: '#ffd66b', marginBottom: 6 }}>Presiona una tecla para <b>{BINDING_INFOS[editing].label}</b>... (ESC cancela)</div>}
      {!editing && hasChanges && <div style={{ fontSize: 11, color: '#6f6', background: '#1a2e1a', padding: '4px 8px', borderRadius: 6, marginBottom: 6 }}>Cambios pendientes — presiona <b>Guardar</b> para aplicar</div>}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {(Object.keys(BINDING_INFOS) as GameAction[]).map(action => {
          const info = BINDING_INFOS[action];
          const isEditing = editing === action;
          const isChanged = pending[action] !== bindings[action];
          return (
            <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderBottom: '1px solid #222', background: isEditing ? '#2a2a33' : isChanged ? '#1f2a1f' : 'transparent' }}>
              <span style={{ fontSize: 12 }}>{info.label} {isChanged && <span style={{ color: '#6f6', fontSize: 10 }}>•</span>}</span>
              <button
                onClick={() => setEditing(isEditing ? null : action)}
                disabled={action === "interact"}
                style={{
                  minWidth: 86, padding: '2px 8px', borderRadius: 6,
                  border: isEditing ? '1px solid #ffd66b' : isChanged ? '1px solid #6f6' : '1px solid #3a3a3a',
                  background: isEditing ? '#332a00' : isChanged ? '#1e3322' : '#222',
                  color: isEditing ? '#ffd66b' : isChanged ? '#6f6' : '#fff',
                  fontSize: 11, fontWeight: 600, cursor: action === "interact" ? 'default' : 'pointer',
                  opacity: action === "interact" ? 0.7 : 1
                }}
              >
                {isEditing ? '...' : displayKey(pending[action])}
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={handleSave} disabled={!hasChanges} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #2e7d32', background: hasChanges ? '#2e7d32' : '#222', color: hasChanges ? '#fff' : '#666', fontWeight: 700, fontSize: 12, cursor: hasChanges ? 'pointer' : 'not-allowed', opacity: hasChanges ? 1 : 0.6 }}>Guardar</button>
        <button onClick={handleCancel} disabled={!hasChanges && !editing} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#ccc', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={handleReset} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #444', background: '#2a2a2a', color: '#ccc', fontSize: 11, cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
  );
}
