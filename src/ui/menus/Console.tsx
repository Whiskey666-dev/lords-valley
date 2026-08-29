import { useConsole } from "../../hooks/menu/useConsole";

/**
 * Console.tsx - UI/Menu - Consola de comandos del juego.
 * Ubicada en src/ui/menus/ como componente puro de interfaz desacoplado mediante useConsole.
 */
export function Console() {
  const {
    open,
    mode,
    switchMode,
    input,
    setInput,
    history,
    feedback,
    inputRef,
    execute,
    closeConsole,
  } = useConsole();

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 35,
        background: "#0a0a0af2",
        borderTop: "1px solid #333",
        padding: "8px 12px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ display: "flex", gap: 6, maxWidth: 720, margin: "0 auto 8px auto" }}>
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => switchMode("chat")}
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            background: mode === "chat" ? "#1e3322" : "#1a1a1a",
            color: mode === "chat" ? "#6f6" : "#777",
            border: mode === "chat" ? "1px solid #2e7d32" : "1px solid #333",
          }}
        >
          Chat
        </button>
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => switchMode("console")}
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            background: mode === "console" ? "#1e2a3a" : "#1a1a1a",
            color: mode === "console" ? "#8ab4ff" : "#777",
            border: mode === "console" ? "1px solid #2a4a66" : "1px solid #333",
          }}
        >
          Consola
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 720, margin: "0 auto" }}>
        <span style={{ color: mode === "chat" ? "#6f6" : "#8ab4ff", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
          {mode === "chat" ? "💬" : ">"}
        </span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              execute(input);
            } else if (e.key === "Escape") {
              e.preventDefault();
              closeConsole();
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
        >
        </input>
        <button
          onClick={() => execute(input)}
          style={{
            background: mode === "chat" ? "#1e3322" : "#2a2a2a",
            color: mode === "chat" ? "#6f6" : "#ccc",
            border: `1px solid ${mode === "chat" ? "#2e7d32" : "#444"}`,
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          {mode === "chat" ? "Enviar" : "Ejecutar"}
        </button>
        <button
          onClick={closeConsole}
          style={{
            background: "#1a1a1a",
            color: "#777",
            border: "1px solid #333",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
          }}
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
          <div style={{ color: "#666" }}>
            {mode === "chat" ? "Chat: mensaje aparece en burbuja sobre el personaje" : "Ej: createNpc5 crea 5 NPCs aleatorios en el centro (20% radio)"}
          </div>
        </div>
      )}
    </div>
  );
}
