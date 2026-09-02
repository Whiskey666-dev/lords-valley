import { useEffect, useState } from "react";

export interface LoadingProgressDetail {
  progress: number;
  step: string;
}

export function useLoadingScreen() {
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
        if (token) {
          setPlayerId(
            "USR-" +
              Math.abs(
                token.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
              )
                .toString(16)
                .slice(0, 8)
                .toUpperCase()
          );
        } else {
          setPlayerId("Invitado");
        }
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

  return {
    progress,
    step,
    isLoaded,
    isVisible,
    playerId,
  };
}

export default useLoadingScreen;
