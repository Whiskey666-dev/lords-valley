import { useState } from "react";
import { COMMAND_CATEGORIES, commandsByCategory } from "../../hooks/menu/consoleCommands";

/**
 * CommandMenuPanel.tsx - UI/Menu - Panel del comando `menu`.
 * Componente puro: lista todos los comandos por categoría (Npc/Mobs/Items/Dev).
 * Click en un comando sin cantidad lo escribe en la consola (ENTER para ejecutar).
 * Click en un comando con cantidad despliega su selector (rango permitido);
 * elegir el número escribe el comando completo en la consola.
 */

interface Props {
  godMode: boolean | null;
  onSelect: (command: string) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Npc: "#6f6",
  Mobs: "#ff8a8a",
  Items: "#ffd76f",
  Dev: "#8ab4ff",
};

export function CommandMenuPanel({ godMode, onSelect, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: "92vw",
          maxHeight: "82vh",
          overflowY: "auto",
          background: "#101010f5",
          border: "1px solid #444",
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>📜 Menú de comandos</span>
          {godMode !== null && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                background: godMode ? "#1e3322" : "#2a2a2a",
                color: godMode ? "#6f6" : "#888",
                border: `1px solid ${godMode ? "#2e7d32" : "#444"}`,
              }}
            >
              {godMode ? "🛡️ GodMode ON" : "GodMode OFF"}
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
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
        <div style={{ color: "#666", fontSize: 10, fontFamily: "monospace", marginBottom: 10 }}>
          Click escribe el comando en la consola · con ▸ elige cantidad · ENTER ejecuta · ESC cierra
        </div>
        {COMMAND_CATEGORIES.map(cat => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div
              style={{
                color: CATEGORY_COLORS[cat],
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 6,
                borderBottom: `1px solid ${CATEGORY_COLORS[cat]}44`,
                paddingBottom: 3,
              }}
            >
              {cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {commandsByCategory(cat).map(c => {
                const isOpen = expanded === c.command;
                return (
                  <div key={c.command}>
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        if (c.qty) {
                          setExpanded(isOpen ? null : c.command);
                        } else {
                          onSelect(c.command);
                        }
                      }}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "baseline",
                        textAlign: "left",
                        width: "100%",
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: CATEGORY_COLORS[cat], fontWeight: 700, whiteSpace: "nowrap" }}>
                        {c.qty ? `${isOpen ? "▾" : "▸"} ${c.command}` : c.command}
                      </span>
                      <span style={{ color: "#888" }}>{c.description}</span>
                      {c.qty && (
                        <span style={{ marginLeft: "auto", color: "#666", whiteSpace: "nowrap" }}>
                          {c.qty.min}-{c.qty.max}
                        </span>
                      )}
                    </button>
                    {isOpen && c.qty && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 4px 2px 16px" }}>
                        {Array.from({ length: c.qty.max - c.qty.min + 1 }, (_, i) => c.qty!.min + i).map(n => (
                          <button
                            key={n}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => onSelect(`${c.command}${n}`)}
                            style={{
                              minWidth: 30,
                              background: "#242424",
                              color: CATEGORY_COLORS[cat],
                              border: `1px solid ${CATEGORY_COLORS[cat]}66`,
                              borderRadius: 6,
                              padding: "3px 6px",
                              fontFamily: "monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
