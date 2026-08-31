import { useEffect, useRef, useState } from "react";
import { isRebindingActive, setConsoleOpen } from "../../ui/input/KeyBindings";

export function useConsole() {
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
      setTimeout(() => inputRef.current?.focus(), 0);
      setTimeout(() => inputRef.current?.focus(), 100);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    return () => { if (open) setConsoleOpen(false); };
  }, [open]);

  // Asegura limpieza al desmontar
  useEffect(() => () => setConsoleOpen(false), []);

  // Mantén flag activo mientras el input está enfocado
  useEffect(() => {
    const onFocusIn = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el && el.tagName === "INPUT") {
        if (inputRef.current && el === inputRef.current) setConsoleOpen(true);
      }
    };
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, []);

  // Escucha ENTER global para abrir/cerrar consola
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isRebindingActive()) return;
      if (open) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeConsole();
        }
        return;
      }
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isInput) return;
      if (e.key === "Enter") {
        e.preventDefault();
        setConsoleOpen(true);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Escucha feedback de spawn de NPCs para mostrar en consola
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

  const closeConsole = () => {
    setConsoleOpen(false);
    setOpen(false);
    setInput("");
  };

  const switchMode = (newMode: "chat" | "console") => {
    setMode(newMode);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const execute = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      closeConsole();
      return;
    }
    setHistory(h => [...h.slice(-8), `> ${trimmed}`]);

    if (mode === "chat") {
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

    // Modo Consola
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
    // — Comandos Niebla de Guerra —
    if (lower === "fog toggle" || lower === "niebla toggle") {
      window.dispatchEvent(new CustomEvent("phaser-fog-toggle" as any, { detail: {} }));
      setFeedback("🌫️ Niebla alternada");
      setHistory(h => [...h.slice(-8), "✓ Niebla toggle"]);
      setInput("");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (lower === "fog on" || lower === "niebla on") {
      window.dispatchEvent(new CustomEvent("phaser-fog-toggle" as any, { detail: { enabled: true } }));
      setFeedback("🌫️ Niebla activada (mapa oscurecido)");
      setHistory(h => [...h.slice(-8), "✓ Niebla ON"]);
      setInput("");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (lower === "fog off" || lower === "niebla off") {
      window.dispatchEvent(new CustomEvent("phaser-fog-toggle" as any, { detail: { enabled: false } }));
      setFeedback("☀️ Niebla desactivada (mapa visible)");
      setHistory(h => [...h.slice(-8), "✓ Niebla OFF"]);
      setInput("");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (lower === "fog clear" || lower === "niebla clear") {
      window.dispatchEvent(new CustomEvent("phaser-fog-clear" as any));
      setFeedback("🧹 Niebla reiniciada — mapa oscurecido de nuevo");
      setHistory(h => [...h.slice(-8), "✓ Niebla clear"]);
      setInput("");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (lower === "fog reveal" || lower === "niebla reveal" || lower === "fog revealall") {
      window.dispatchEvent(new CustomEvent("phaser-fog-reveal-all" as any));
      setFeedback("🔓 Mapa completamente revelado");
      setHistory(h => [...h.slice(-8), "✓ Mapa revelado"]);
      setInput("");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    const fogRadiusMatch = lower.match(/^fog\s+radius\s+(\d+)$/) || lower.match(/^niebla\s+radius\s+(\d+)$/);
    if (fogRadiusMatch) {
      const r = parseInt(fogRadiusMatch[1], 10);
      if (r >= 32 && r <= 2000) {
        window.dispatchEvent(new CustomEvent("phaser-fog-radius" as any, { detail: { radius: r } }));
        setFeedback(`🌫️ Radio de visión ajustado a ${r}px`);
        setHistory(h => [...h.slice(-8), `✓ Radio ${r}`]);
      } else {
        setFeedback("Radio debe estar entre 32 y 2000");
      }
      setInput("");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    if (lower === "help" || lower === "ayuda") {
      setFeedback("Comandos: createNpc1..10 | fog toggle/on/off/clear/reveal | fog radius <32-2000> | help");
      return;
    }
    if (!lower.startsWith("createnpc") && !lower.startsWith("fog") && !lower.startsWith("niebla")) {
      setFeedback("💬 Para chatear cambia a modo Chat");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    setFeedback(`Comando no reconocido: ${trimmed} (usa createNpc1..10 | fog help)`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return {
    open,
    setOpen,
    mode,
    setMode,
    switchMode,
    input,
    setInput,
    history,
    feedback,
    inputRef,
    execute,
    closeConsole,
  };
}

export default useConsole;
