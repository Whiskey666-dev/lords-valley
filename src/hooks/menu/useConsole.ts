import { useEffect, useRef, useState } from "react";
import { isRebindingActive, setConsoleOpen } from "../../ui/input/KeyBindings";
import { addItemRemote } from "../inventory/playerInventoryStore";
import {
  apiMessage,
  fetchMyDev,
  grantMyFullMode,
  requestSpawnAllow,
  setMyGodMode,
} from "../../app/api/player.api";

export function useConsole() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "console">("chat");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [godMode, setGodMode] = useState<boolean | null>(null);
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
          // Si el menú de comandos está abierto, Escape lo cierra primero
          if (menuOpen) {
            setMenuOpen(false);
            return;
          }
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
  }, [open, menuOpen]);

  // Escucha feedback de spawn de NPCs para mostrar en consola
  useEffect(() => {
    const onSpawned = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number; total: number }>).detail;
      if (detail) {
        setHistory(h => [...h.slice(-8), `→ ${detail.count} NPCs en centro (total ${detail.total})`]);
      }
    };
    const onDragonSpawned = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number; total: number; isAlly: boolean }>).detail;
      if (detail) {
        const fac = detail.isAlly ? "aliados" : "enemigos";
        setHistory(h => [...h.slice(-8), `→ ${detail.count} Dead Dragon ${fac} (total ${detail.total})`]);
      }
    };
    const onGhostSpawned = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number; total: number }>).detail;
      if (detail) {
        setHistory(h => [...h.slice(-8), `→ ${detail.count} Ghost(s) (total ${detail.total})`]);
      }
    };
    window.addEventListener("phaser-npcs-spawned", onSpawned as EventListener);
    window.addEventListener("phaser-dead-dragons-spawned" as any, onDragonSpawned as EventListener);
    window.addEventListener("phaser-ghosts-spawned" as any, onGhostSpawned as EventListener);
    return () => {
      window.removeEventListener("phaser-npcs-spawned", onSpawned as EventListener);
      window.removeEventListener("phaser-dead-dragons-spawned" as any, onDragonSpawned as EventListener);
      window.removeEventListener("phaser-ghosts-spawned" as any, onGhostSpawned as EventListener);
    };
  }, []);

  const closeConsole = () => {
    setConsoleOpen(false);
    setOpen(false);
    setMenuOpen(false);
    setInput("");
  };

  const closeMenu = () => setMenuOpen(false);

  const openMenu = () => {
    setMenuOpen(true);
    setInput("");
    // Estado GodMode autoritativo para mostrarlo en el panel
    void fetchMyDev().then(
      (dev) => setGodMode(dev.godMode),
      () => setGodMode(null),
    );
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
      const l = trimmed.toLowerCase();
      if (
        l.startsWith("createnpc") ||
        l.startsWith("createdeaddragon") ||
        l.startsWith("spawndeaddragon") ||
        l.startsWith("createghost") ||
        l.startsWith("spawnghost") ||
        l.startsWith("godmode") ||
        l.startsWith("fullmode") ||
        l.startsWith("menu") ||
        l.startsWith("creative") ||
        l.startsWith("survival")
      ) {
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

    // Modo Consola — convención: aliados con "create", enemigos con "spawn".
    // Todo create/spawn se valida en el servidor (POST /player/me/dev/spawn-allow, JWT)
    // antes de emitir el evento a Phaser.
    const lower = trimmed.toLowerCase();

    const runGatedSpawn = (
      kind: string,
      count: number,
      event: string,
      detail: Record<string, unknown>,
      label: string,
    ) => {
      setFeedback("⏳ Validando en el servidor…");
      void requestSpawnAllow(kind, count).then(
        () => {
          window.dispatchEvent(new CustomEvent(event as any, { detail }));
          setFeedback(label);
          setHistory(h => [...h.slice(-8), `✓ ${label}`]);
          setInput("");
          setTimeout(() => setFeedback(null), 2500);
        },
        (e) => {
          setFeedback(apiMessage(e));
          setTimeout(() => setFeedback(null), 3500);
        },
      );
    };

    const match = lower.match(/^createnpc\s*([1-9]|10)$/);
    if (match) {
      const count = parseInt(match[1], 10);
      runGatedSpawn("npc", count, "phaser-create-npcs", { count }, `Creando ${count} NPC(s) aliado(s)...`);
      return;
    }
    // — Dead Dragon aliado: createDeadDragon1..5 (sin tipo A/E) —
    const ddAllyMatch = lower.match(/^createdeaddragon\s*([1-5])$/);
    if (ddAllyMatch) {
      const count = parseInt(ddAllyMatch[1], 10);
      runGatedSpawn("dead-dragon-ally", count, "phaser-create-dead-dragons", { count, isAlly: true }, `Creando ${count} Dead Dragon aliado(s)...`);
      return;
    }
    // — Dead Dragon enemigo: spawnDeadDragon1..5 —
    const ddEnemyMatch = lower.match(/^spawndeaddragon\s*([1-5])$/);
    if (ddEnemyMatch) {
      const count = parseInt(ddEnemyMatch[1], 10);
      runGatedSpawn("dead-dragon-enemy", count, "phaser-create-dead-dragons", { count, isAlly: false }, `Invocando ${count} Dead Dragon enemigo(s)...`);
      return;
    }
    // Formato antiguo con A/E: ya no existe, redirigir al nuevo
    if (/^createdeaddragon\s*[ae]\s*[1-5]$/.test(lower)) {
      setFeedback("createDeadDragon<A/E> ya no existe: usa createDeadDragon<N> (aliado) o spawnDeadDragon<N> (enemigo). Ej: createDeadDragon3");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    // — Ghost enemigo: spawnGhost1..3 / spawnGhost 1..3 / spawnGhost —
    const ghostMatch = lower.match(/^spawnghost\s*([1-3])?$/);
    if (ghostMatch) {
      const count = ghostMatch[1] ? parseInt(ghostMatch[1], 10) : 1;
      runGatedSpawn("ghost", count, "phaser-create-ghosts", { count }, `Invocando ${count} Ghost(s) enemigo(s)...`);
      return;
    }
    // Formato antiguo createGhost: redirigir al nuevo
    if (/^createghost(\s*[1-3])?$/.test(lower)) {
      setFeedback("createGhost ya no existe: los enemigos se invocan con spawn. Usa spawnGhost1..3");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    // — Modo Creativo / Modo Supervivencia —
    if (lower === "creativemode" || lower === "creative mode" || lower === "creative") {
      (window as any).__CREATIVE_MODE__ = true;
      (window as any).__GAME_MODE__ = "creative";
      window.dispatchEvent(new CustomEvent("phaser-game-mode" as any, { detail: { mode: "creative" } }));
      setFeedback("🎨 Modo Creativo activado: los enemigos ignoran al jugador.");
      setHistory(h => [...h.slice(-8), "✓ CreativeMode activado"]);
      setInput("");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (lower === "survivalmode" || lower === "survival mode" || lower === "survival") {
      (window as any).__CREATIVE_MODE__ = false;
      (window as any).__GAME_MODE__ = "survival";
      window.dispatchEvent(new CustomEvent("phaser-game-mode" as any, { detail: { mode: "survival" } }));
      setFeedback("⚔️ Modo Supervivencia activado: los enemigos detectan y atacan al jugador.");
      setHistory(h => [...h.slice(-8), "✓ SurvivalMode activado"]);
      setInput("");
      setTimeout(() => setFeedback(null), 3000);
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
    if (lower === "menu") {
      openMenu();
      setFeedback("📜 Panel de comandos abierto (Npc · Mobs · Items · Dev)");
      setHistory(h => [...h.slice(-8), "✓ menu abierto"]);
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    // — Dev: GodModeOn / GodModeOff (validados por el servidor) —
    if (lower === "godmodeon") {
      setFeedback("⏳ Validando en el servidor…");
      void setMyGodMode(true).then(
        (dev) => {
          setGodMode(dev.godMode);
          window.dispatchEvent(new CustomEvent("phaser-godmode" as any, { detail: { on: true } }));
          setFeedback("🛡️ GodMode activado: inmune al daño, hambre y sed (100%).");
          setHistory(h => [...h.slice(-8), "✓ GodMode ON"]);
          setInput("");
          setTimeout(() => setFeedback(null), 3000);
        },
        (e) => {
          setFeedback(apiMessage(e));
          setTimeout(() => setFeedback(null), 3500);
        },
      );
      return;
    }
    if (lower === "godmodeoff") {
      setFeedback("⏳ Validando en el servidor…");
      void setMyGodMode(false).then(
        (dev) => {
          setGodMode(dev.godMode);
          window.dispatchEvent(new CustomEvent("phaser-godmode" as any, { detail: { on: false } }));
          setFeedback("GodMode desactivado.");
          setHistory(h => [...h.slice(-8), "✓ GodMode OFF"]);
          setInput("");
          setTimeout(() => setFeedback(null), 3000);
        },
        (e) => {
          setFeedback(apiMessage(e));
          setTimeout(() => setFeedback(null), 3500);
        },
      );
      return;
    }
    // — Dev: FullMode (nivel máximo en las 48 habilidades, servidor) —
    if (lower === "fullmode") {
      setFeedback("⏳ Validando en el servidor…");
      void grantMyFullMode().then(
        () => {
          window.dispatchEvent(new CustomEvent("player-skills-changed" as any));
          setFeedback("⭐ FullMode: las 48 habilidades al nivel máximo.");
          setHistory(h => [...h.slice(-8), "✓ FullMode aplicado"]);
          setInput("");
          setTimeout(() => setFeedback(null), 3000);
        },
        (e) => {
          setFeedback(apiMessage(e));
          setTimeout(() => setFeedback(null), 3500);
        },
      );
      return;
    }
    if (lower === "help" || lower === "ayuda") {
      setFeedback("Comandos: createNpc1..10 | createDeadDragon1..5 (aliado) | spawnDeadDragon1..5 | spawnGhost1..3 | menu | addItem:<Item><1-9> (ej: addItem:Madera5) | addItem:Comida/Pan<1-9> | addItem:Bebida/OdreAgua<1-9> | addItem:Bebida/OdreVacio<1-9> | addItem:Pergamino/<Escuela><1-9> (ej: addItem:Pergamino/Survival5) | GodModeOn/Off | FullMode | CreativeMode | SurvivalMode | fog toggle/on/off | help");
      return;
    }
    // — Añadir items al inventario (validado por el backend con JWT) —
    // addItem:Pergamino/<Escuela><1-9> (ej: addItem:Pergamino/Survival5)
    // addItem:Comida/<Item><1-9> (ej: addItem:Comida/Pan5)
    // addItem:Bebida/<Item><1-9> (ej: addItem:Bebida/OdreAgua3, addItem:Bebida/OdreVacio2)
    // addItem:<Item del catálogo><1-9> (ej: addItem:Madera5, addItem:Comida/Pan3)
    if (lower.startsWith("additem")) {
      const restMatch = trimmed.match(/^additem\s*:\s*(.+?)\s*$/i);
      if (!restMatch) {
        setFeedback("Uso: addItem:<Item><1-9> · Ej: addItem:Madera5 · Comida: addItem:Comida/Pan5 · Bebida: addItem:Bebida/OdreAgua3 · Pergaminos: addItem:Pergamino/Survival5");
        setTimeout(() => setFeedback(null), 3000);
        return;
      }
      const rest = restMatch[1].trim();
      if (rest.includes("/")) {
        const parts = rest.split("/");
        if (parts.length !== 2) {
          setFeedback("Uso: addItem:Pergamino/<Escuela><1-9> · addItem:Comida/Pan<1-9> · addItem:Bebida/OdreAgua<1-9> · Ej: addItem:Comida/Pan5");
          setTimeout(() => setFeedback(null), 3000);
          return;
        }
        const itemPart = parts[0].trim().toLowerCase();
        const secondPart = parts[1].trim();
        const isPergamino = itemPart === "pergamino" || itemPart === "pergaminos" || itemPart === "scroll";
        if (isPergamino) {
          const qtyMatch = secondPart.match(/^(.+?)\s*([1-9])$/);
          if (!qtyMatch) {
            setFeedback("La cantidad debe ser un número del 1 al 9 al final. Ej: addItem:Pergamino/Survival5");
            setTimeout(() => setFeedback(null), 3000);
            return;
          }
          const payload = { escuela: qtyMatch[1].trim(), cantidad: parseInt(qtyMatch[2], 10) };
          setFeedback("⏳ Validando en el servidor…");
          void addItemRemote(payload).then((res) => {
            if (res.ok) {
              setFeedback(`📜 +${payload.cantidad} pergamino de ${payload.escuela} añadido (validado). Abre Habilidades para Entrenar.`);
              setHistory(h => [...h.slice(-8), `✓ ${payload.cantidad}x pergamino ${payload.escuela}`]);
              setInput("");
            } else {
              setFeedback(res.message);
            }
            setTimeout(() => setFeedback(null), 3500);
          });
          return;
        }
        // Comida / Bebida: el backend resuelve el nombre (alias OdreAgua -> Odre con Agua).
        // Acepta: comida, comida y bebida, food | bebida, bebidas, drink
        const isComida = itemPart === "comida" || itemPart === "comidas" || itemPart === "comidaybebida" || itemPart === "comida y bebida" || itemPart === "food";
        const isBebida = itemPart === "bebida" || itemPart === "bebidas" || itemPart === "drink" || itemPart === "drinks";
        if (isComida || isBebida) {
          const qtyMatch = secondPart.match(/^(.+?)\s*([1-9])?$/);
          const rawName = (qtyMatch?.[1] ?? secondPart).trim();
          const qty = qtyMatch?.[2] ? parseInt(qtyMatch[2], 10) : 1;
          if (!rawName) {
            setFeedback(isComida ? "Uso: addItem:Comida/Pan<1-9> · Ej: addItem:Comida/Pan5" : "Uso: addItem:Bebida/OdreAgua<1-9> · Ej: addItem:Bebida/OdreAgua3");
            setTimeout(() => setFeedback(null), 3000);
            return;
          }
          const label = isComida ? "🍞" : "💧";
          setFeedback("⏳ Validando en el servidor…");
          void addItemRemote({ nombre: rawName, cantidad: qty }).then((res) => {
            if (res.ok) {
              setFeedback(`${label} +${qty} ${rawName} añadido (validado). Úsalo desde el Inventario (I): Pan +20% hambre, Odre con Agua +20% sed.`);
              setHistory(h => [...h.slice(-8), `✓ ${qty}x ${rawName}`]);
              setInput("");
            } else {
              setFeedback(res.message);
            }
            setTimeout(() => setFeedback(null), 3500);
          });
          return;
        }
        setFeedback(`Item "${parts[0].trim()}" no soportado con /. Usa: addItem:Pergamino/<Escuela><1-9> · addItem:Comida/Pan<1-9> · addItem:Bebida/OdreAgua<1-9> · o addItem:<Item><1-9> (ej: addItem:Madera5)`);
        setTimeout(() => setFeedback(null), 3500);
        return;
      }
      const qtyMatch = rest.match(/^(.+?)\s*([1-9])?$/);
      const rawName = (qtyMatch?.[1] ?? rest).trim();
      const qty = qtyMatch?.[2] ? parseInt(qtyMatch[2], 10) : 1;
      const normalized = rawName.toLowerCase();
      if (normalized === "pergamino" || normalized === "pergaminos" || normalized === "scroll") {
        setFeedback("El pergamino necesita escuela: addItem:Pergamino/<Escuela><1-9> · Ej: addItem:Pergamino/Survival5");
        setTimeout(() => setFeedback(null), 3500);
        return;
      }
      setFeedback("⏳ Validando en el servidor…");
      void addItemRemote({ nombre: rawName, cantidad: qty }).then((res) => {
        if (res.ok) {
          setFeedback(`🎒 +${qty} ${rawName} añadido (validado). Abre el Inventario (I) para verlo.`);
          setHistory(h => [...h.slice(-8), `✓ ${qty}x ${rawName}`]);
          setInput("");
        } else {
          setFeedback(res.message);
        }
        setTimeout(() => setFeedback(null), 3500);
      });
      return;
    }
    if (
      !lower.startsWith("createnpc") &&
      !lower.startsWith("createdeaddragon") &&
      !lower.startsWith("spawndeaddragon") &&
      !lower.startsWith("createghost") &&
      !lower.startsWith("spawnghost") &&
      !lower.startsWith("godmode") &&
      !lower.startsWith("fullmode") &&
      !lower.startsWith("menu") &&
      !lower.startsWith("creative") &&
      !lower.startsWith("survival") &&
      !lower.startsWith("fog") &&
      !lower.startsWith("niebla") &&
      !lower.startsWith("additem")
    ) {
      setFeedback("💬 Para chatear cambia a modo Chat");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    setFeedback(`Comando no reconocido: ${trimmed} (usa menu | spawnGhost1..3 | CreativeMode | SurvivalMode | help)`);
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
    menuOpen,
    openMenu,
    closeMenu,
    godMode,
  };
}

export default useConsole;
