import { useEffect, useState } from "react";
import { getAllBindings, setBinding, resetBindings, subscribe, setRebinding, type GameAction } from "../../ui/input/KeyBindings";

export function useKeybindsEditor() {
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
      if (raw.toUpperCase() === "ESCAPE") {
        setEditing(null);
        return;
      }
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

  return {
    bindings,
    pending,
    editing,
    setEditing,
    hasChanges,
    handleSave,
    handleCancel,
    handleReset,
  };
}

export default useKeybindsEditor;
