import { useEffect, useState } from "react";
import { BINDING_INFOS, getAllBindings, setBinding, resetBindings, displayKey, subscribe, setRebinding, type GameAction } from "../input/KeyBindings";

/**
 * KeybindsEditor.tsx - UI/Menu - Editor de teclas reutilizable.
 * Extraído de TutorialPanel para usarlo tanto en el tutorial como en la categoría
 * "Teclado" del panel de Configuración. Contiene la lista de bindings y los botones
 * Guardar/Cancelar/Reset con el mismo comportamiento que antes.
 */
export function KeybindsEditor() {
  const [bindings, setBindings] = useState<Record<string, string>>(() => getAllBindings());
  const [pending, setPending] = useState<Record<string, string>>(() => getAllBindings());
  const [editing, setEditing] = useState<GameAction | null>(null);

  useEffect(() => {
    setRebinding(editing !== null);
    return () => setRebinding(false);
  }, [editing]);

  useEffect(() => {
    const unsub = subscribe(() => setBindings(getAllBindings()));
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!editing) return;
    const handleRebind = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const raw = e.key === " " ? "SPACE" : e.key;
      if (raw.toUpperCase() === "ESCAPE") { setEditing(null); return; }
      const upper = raw.toUpperCase().trim();
      let norm = raw;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {editing && <div style={{ fontSize: 11, color: '#ffd66b' }}>Presiona una tecla para <b>{BINDING_INFOS[editing].label}</b>... (ESC cancela)</div>}
      {!editing && hasChanges && <div style={{ fontSize: 11, color: '#6f6', background: '#1a2e1a', padding: '4px 8px', borderRadius: 6 }}>Cambios pendientes — presiona <b>Guardar</b> para aplicar</div>}
      <div style={{ maxHeight: 340, overflowY: 'auto', overflowX: 'hidden', paddingRight: 2 }}>
        {(Object.keys(BINDING_INFOS) as GameAction[]).map(action => {
          const info = BINDING_INFOS[action];
          const isEditing = editing === action;
          const isChanged = pending[action] !== bindings[action];
          return (
            <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderBottom: '1px solid #222', background: isEditing ? '#2a2a33' : isChanged ? '#1f2a1f' : 'transparent' }}>
              <span style={{ fontSize: 12, color: '#ccc' }}>{info.label} <span style={{ fontSize: 9, color: '#666' }}>({info.category})</span> {isChanged && <span style={{ color: '#6f6', fontSize: 10 }}>•</span>}</span>
              <button
                onClick={() => setEditing(isEditing ? null : action)}
                disabled={action === "interact"}
                style={{
                  minWidth: 86, padding: '3px 8px', borderRadius: 6,
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
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={!hasChanges} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #2e7d32', background: hasChanges ? '#2e7d32' : '#222', color: hasChanges ? '#fff' : '#666', fontWeight: 700, fontSize: 12, cursor: hasChanges ? 'pointer' : 'not-allowed', opacity: hasChanges ? 1 : 0.6 }}>Guardar</button>
        <button onClick={handleCancel} disabled={!hasChanges && !editing} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#ccc', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={handleReset} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #444', background: '#2a2a2a', color: '#ccc', fontSize: 11, cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
  );
}