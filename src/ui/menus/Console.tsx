import { useEffect, useRef, useState } from "react";
import { isRebindingActive, setConsoleOpen } from "../input/KeyBindings";

/**
 * Console.tsx - UI/Menu - Consola de comandos del juego.
 * Ubicada en src/ui/menus/ como componente puro de interfaz.
 * Se abre con ENTER, ejecuta comandos y se cierra con ESC o ENTER sin texto.
 * Primer comando: createNpc1 .. createNpc10 - crea N NPCs humanos con stats aleatorios en rango centro 20%.
 * Escalable: añadir comandos en COMMANDS.
 */

export function Console() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "console">("chat");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus al abrir y bloqueo de input de juego
  useEffect(() => {
    setConsoleOpen(open);
    if (open) {
      // Doble intento de foco para evitar robo por canvas de Phaser
      setTimeout(() => inputRef.current?.focus(), 0);
      setTimeout(() => inputRef.current?.focus(), 100);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      // Al cerrar, devolver foco al juego y limpiar buffers
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    return () => { if (open) setConsoleOpen(false); };
  }, [open]);

  // Asegura limpieza al desmontar
  useEffect(() => () => setConsoleOpen(false), []);

  // Mantén flag activo mientras el input está enfocado (fallback por si el estado open se desincroniza)
  useEffect(() => {
    const onFocusIn = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el && el.tagName === "INPUT") {
        // Si el input de la consola está enfocado, asegura bloqueo
        if (inputRef.current && el === inputRef.current) setConsoleOpen(true);
      }
    };
    const onFocusOut = () => {
      // No limpies aquí si open sigue true; el flag open lo controla
    };
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Escucha ENTER global para abrir/cerrar consola (cuando no se está editando teclas)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isRebindingActive()) return;
      // Si la consola está abierta, no togglear con Enter (se maneja en input)
      if (open) {
        if (e.key === "Escape") {
          e.preventDefault();
          setConsoleOpen(false);
          setOpen(false);
          setInput("");
        }
        return;
      }
      // Consola cerrada: ENTER la abre (evitar cuando se está escribiendo en input nativo)
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isInput) return;
      if (e.key === "Enter") {
        // Evitar que ENTER también dispare salto u otra acción si el juego lo usa (no lo usa)
        e.preventDefault();
        setConsoleOpen(true);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const execute = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setConsoleOpen(false);
      setOpen(false);
      return;
    }
    setHistory(h => [...h.slice(-8), `> ${trimmed}`]);

    if (mode === "chat") {
      // Modo Chat: no ejecuta comandos, muestra burbuja sobre el personaje
      // Si el texto parece comando, avisa que debe usar modo Consola
      if (trimmed.toLowerCase().startsWith("createnpc")) {
        setFeedback("⚠️ Estás en modo Chat. Cambia a Consola para usar comandos.");
        setTimeout(() => setFeedback(null), 2500);
        return;
      }
      window.dispatchEvent(new CustomEvent("phaser-chat-bubble", { detail: { text: trimmed } }));
      setHistory(h => [...h.slice(-8), `💬 ${trimmed}`]);
      setInput("");
      setFeedback("Mensaje enviado");
      setTimeout(() => setFeedback(null), 1500);
      return;
    }

    // Modo Consola: solo comandos, no chat
    const lower = trimmed.toLowerCase();
    const match = lower.match(/^createnpc\s*([1-9]|10)$/);
    if (match) {
      const count = parseInt(match[1], 10);
      window.dispatchEvent(new CustomEvent("phaser-create-npcs", { detail: { count } }));
      setFeedback(`Creando ${count} NPC(s) con habilidades/personalidad/rasgos/gustos aleatorios...`);
      setHistory(h => [...h.slice(-8), `✓ ${count} NPCs creados`]);
      setInput("");
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    if (lower === "help" || lower === "ayuda") {
      setFeedback("Comandos: createNpc1..10 | help");
      return;
    }
    // Si en consola escriben texto normal, avisa que use Chat
    if (!lower.startsWith("createnpc")) {
      setFeedback("💬 Para chatear cambia a modo Chat");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    setFeedback(`Comando no reconocido: ${trimmed} (usa createNpc1..10)`);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Escucha feedback de spawn para mostrar en consola
  useEffect(() => {
    const onSpawned = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number; total: number }>).detail;
      if (detail) {
        setHistory(h => [...h.slice(-8), `→ ${detail.count} NPCs en centro (total ${detail.total})`]);
      }
    };
    window.addEventListener("phaser-npcs-spawned", onSpawned as EventListener);
    return () => window.removeEventListener("phaser-npcs-spawned", onSpawned as EventListener);
  }, []);

  if (!open) return null;

  return (
    <div
      style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 35, background: "#0a0a0af2", borderTop: "1px solid #333", padding: "8px 12px", backdropFilter: "blur(4px)" }}
    >
      <div style={{ display: "flex", gap: 6, maxWidth: 720, margin: "0 auto 8px auto" }}>
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => { setMode("chat"); setTimeout(() => inputRef.current?.focus(), 0); }}
          style={{
            flex: 1, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
            background: mode === "chat" ? "#1e3322" : "#1a1a1a",
            color: mode === "chat" ? "#6f6" : "#777",
            border: mode === "chat" ? "1px solid #2e7d32" : "1px solid #333",
          }}
        >
          Chat
        </button>
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => { setMode("console"); setTimeout(() => inputRef.current?.focus(), 0); }}
          style={{
            flex: 1, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
            background: mode === "console" ? "#1e2a3a" : "#1a1a1a",
            color: mode === "console" ? "#8ab4ff" : "#777",
            border: mode === "console" ? "1px solid #2a4a66" : "1px solid #333",
          }}
        >
          Consola
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 720, margin: "0 auto" }}>
        <span style={{ color: mode === "chat" ? "#6f6" : "#8ab4ff", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{mode === "chat" ? "💬" : ">"}</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onFocus={() => setConsoleOpen(true)}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            // Prioridad total a escritura: evita que Phaser o el juego capture WASD, SPACE, SHIFT, etc.
            e.stopPropagation();
            // No dejar que el evento llegue a window ni a Phaser
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              execute(input);
            } else if (e.key === "Escape") {
              e.preventDefault();
              setConsoleOpen(false);
              setOpen(false);
              setInput("");
            }
          }}
          onKeyUp={e => {
            e.stopPropagation();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
          }}
          placeholder={mode === "chat" ? "Escribe un mensaje... ENTER para burbuja" : "createNpc1 .. createNpc10  |  ENTER ejecutar, ESC cerrar"}
          style={{
            flex: 1,
            background: "#1a1a1a",
            border: `1px solid ${mode === "chat" ? "#2e7d32" : "#333"}`,
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 6,
            fontFamily: "monospace",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={() => execute(input)}
          style={{ background: mode === "chat" ? "#1e3322" : "#2a2a2a", color: mode === "chat" ? "#6f6" : "#ccc", border: `1px solid ${mode === "chat" ? "#2e7d32" : "#444"}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
        >
          {mode === "chat" ? "Enviar" : "Ejecutar"}
        </button>
        <button
          onClick={() => { setConsoleOpen(false); setOpen(false); setInput(""); }}
          style={{ background: "#1a1a1a", color: "#777", border: "1px solid #333", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
      {(feedback || history.length > 0) && (
        <div style={{ maxWidth: 720, margin: "6px auto 0", fontFamily: "monospace", fontSize: 10, color: "#aaa", maxHeight: 60, overflowY: "auto" }}>
          {feedback && <div style={{ color: mode === "chat" ? "#8f8" : "#8ab4ff" }}>{feedback}</div>}
          {history.map((h, i) => (
            <div key={i} style={{ opacity: 0.7 }}>{h}</div>
          ))}
          <div style={{ color: "#666" }}>{mode === "chat" ? "Chat: mensaje aparece en burbuja sobre el personaje" : "Ej: createNpc5 crea 5 NPCs aleatorios en el centro (20% radio)"}</div>
        </div>
      )}
    </div>
  );
}
