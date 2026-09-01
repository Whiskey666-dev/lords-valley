import { useEffect, useState } from "react";

interface LoadingProgressDetail {
  progress: number;
  step: string;
}

export function LoadingScreen() {
  const [progress, setProgress] = useState<number>(10);
  const [step, setStep] = useState<string>("Iniciando motor de juego...");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [playerId, setPlayerId] = useState<string>("Desconocido");

  useEffect(() => {
    // Obtener ID del jugador
    try {
      const storedId = localStorage.getItem("playerId");
      const storedPlayer = localStorage.getItem("player");
      if (storedId) {
        setPlayerId(storedId);
      } else if (storedPlayer) {
        const parsed = JSON.parse(storedPlayer);
        setPlayerId(parsed.id || parsed.username || "Jugador");
      } else {
        const token = localStorage.getItem("access_token");
        if (token) setPlayerId("USR-" + Math.abs(token.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(16).slice(0, 8).toUpperCase());
        else setPlayerId("Invitado");
      }
    } catch {
      setPlayerId("Jugador");
    }

    const onProgress = (e: Event) => {
      const detail = (e as CustomEvent<LoadingProgressDetail>).detail;
      if (detail && typeof detail.progress === "number") {
        setProgress((prev) => Math.max(prev, Math.min(100, Math.round(detail.progress))));
        if (detail.step) setStep(detail.step);
      }
    };

    window.addEventListener("lords-loading-progress" as any, onProgress as EventListener);

    // Timeout de seguridad: asegura que la barra progrese fluidamente incluso en conexiones rápidas o lentas
    const fallbackTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 200);

    return () => {
      window.removeEventListener("lords-loading-progress" as any, onProgress as EventListener);
      clearInterval(fallbackTimer);
    };
  }, []);

  // Transición suave al completar el 100%
  useEffect(() => {
    if (progress >= 100) {
      setIsLoaded(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "radial-gradient(ellipse at center, #182333 0%, #0a0f16 65%, #040609 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "36px 48px",
        userSelect: "none",
        color: "#ffffff",
        fontFamily: "'Cinzel', 'Trajan Pro', 'Georgia', serif",
        opacity: isLoaded ? 0 : 1,
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: isLoaded ? "none" : "all",
      }}
    >
      {/* ── Decoración Esquinas / Vértices Medievales ── */}
      <div style={{ position: "absolute", top: 24, left: 24, width: 32, height: 32, borderTop: "2px solid #c59b27", borderLeft: "2px solid #c59b27", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 24, right: 24, width: 32, height: 32, borderTop: "2px solid #c59b27", borderRight: "2px solid #c59b27", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 24, left: 24, width: 32, height: 32, borderBottom: "2px solid #c59b27", borderLeft: "2px solid #c59b27", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 24, right: 24, width: 32, height: 32, borderBottom: "2px solid #c59b27", borderRight: "2px solid #c59b27", pointerEvents: "none" }} />

      {/* Espaciador superior */}
      <div style={{ height: 20 }} />

      {/* ── CENTRO: Título de Lords Valley y Barra de Carga en Tiempo Real ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 620,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Emblema o Icono Rúnico */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "radial-gradient(circle, #3d2c10 0%, #161005 100%)",
            border: "1.5px solid #d4af37",
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(212, 175, 55, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: "#ffd700",
            marginBottom: 16,
            textShadow: "0 0 8px #ffd700",
          }}
        >
          ⚔️
        </div>

        {/* Título Principal LORDS VALLEY */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 900,
            letterSpacing: "8px",
            margin: "0 0 8px 0",
            background: "linear-gradient(180deg, #fff2b2 0%, #ffd700 45%, #b38728 75%, #fbf5b7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 4px 16px rgba(212, 175, 55, 0.5))",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Lords Valley
        </h1>

        {/* Subtítulo / Lore */}
        <div
          style={{
            fontSize: 13,
            letterSpacing: 4,
            color: "#a4b8cc",
            textTransform: "uppercase",
            marginBottom: 36,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
            opacity: 0.85,
          }}
        >
          Supervivencia &middot; Estrategia &middot; Mundo Isométrico
        </div>

        {/* Contenedor Barra de Carga */}
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Barra de progreso */}
          <div
            style={{
              width: "100%",
              height: 14,
              background: "rgba(8, 12, 18, 0.95)",
              border: "1.5px solid #c59b27",
              borderRadius: 8,
              padding: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.8), 0 0 10px rgba(197,155,39,0.35) inset",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Relleno con gradiente dorado/esmeralda animado */}
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #2e7d32 0%, #43a047 40%, #ffd700 100%)",
                borderRadius: 5,
                boxShadow: "0 0 14px rgba(255, 215, 0, 0.7)",
                transition: "width 0.25s ease-out",
                position: "relative",
              }}
            >
              {/* Brillo resplandor frontal */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 8,
                  background: "#ffffff",
                  boxShadow: "0 0 12px #ffffff",
                  borderRadius: 2,
                  opacity: 0.9,
                }}
              />
            </div>
          </div>

          {/* Fila Informativa: Estado de carga + Porcentaje */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
              color: "#c8d8e8",
              fontWeight: 500,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ffd700",
                  boxShadow: "0 0 6px #ffd700",
                  animation: "pulse 1.2s infinite",
                }}
              />
              {step}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 800,
                color: "#ffd700",
                fontSize: 13,
                letterSpacing: 1,
              }}
            >
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* ── INFERIOR: ID del Jugador (Izquierda) y Versión del Juego (Derecha) ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#7e93a8",
          fontFamily: "system-ui, monospace",
          letterSpacing: 0.5,
          borderTop: "1px solid rgba(197, 155, 39, 0.25)",
          paddingTop: 16,
        }}
      >
        {/* Inferior Izquierda: ID del Jugador */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#a88b32", fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>
            ID Jugador:
          </span>
          <span
            style={{
              background: "rgba(10, 16, 26, 0.85)",
              border: "1px solid rgba(197, 155, 39, 0.35)",
              color: "#e0ebf5",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "monospace",
            }}
          >
            {playerId}
          </span>
        </div>

        {/* Inferior Derecha: Versión del Juego */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#a88b32", fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: 1 }}>
            Versión:
          </span>
          <span
            style={{
              background: "rgba(197, 155, 39, 0.15)",
              border: "1px solid rgba(197, 155, 39, 0.45)",
              color: "#ffd700",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "monospace",
            }}
          >
            v0.1
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
