import { useState, useEffect, useMemo } from "react";
import { useGameStore } from "../../app/store/useGameStore";

const SEASON_ICONS: Record<string, string> = {
  PRIMAVERA: "🌸",
  VERANO: "☀️",
  OTOÑO: "🍂",
  OTONO: "🍂",
  INVIERNO: "❄️",
};

const WEATHER_ICONS: Record<string, string> = {
  DESPEJADO: "☀️",
  SOLEADO: "☀️",
  NUBLADO: "☁️",
  LLUVIA: "🌧️",
  LLUVIOSO: "🌧️",
  TORMENTA: "⛈️",
  NIEVE: "❄️",
  NEVADO: "❄️",
  NIEBLA: "🌫️",
};

export function useWorldInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const settlement = useGameStore((s) => s.settlement);

  // Cerrar al hacer click fuera del panel de información
  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-world-info-panel]")) {
        setIsOpen(false);
      }
    };
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const worldData = useMemo(() => {
    if (!settlement) {
      return {
        hasData: false,
        settlementName: "Lords Valley",
        tier: "REFUGIO",
        date: "Día 1, Mes 1, Año 1000",
        day: 1,
        month: 1,
        year: 1000,
        time: "08:00",
        tick: 0,
        season: "VERANO",
        seasonIcon: "☀️",
        weather: "DESPEJADO",
        weatherIcon: "☀️",
      };
    }

    const gameTime = settlement.gameTime ?? 0;
    // 1 día = 1440 minutos / ticks de ciclo horario
    const minutesInDay = ((gameTime % 1440) + 1440) % 1440;
    const hours = Math.floor(minutesInDay / 60);
    const minutes = minutesInDay % 60;
    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const seasonUpper = (settlement.season ?? "VERANO").toUpperCase();
    const weatherUpper = (settlement.weather ?? "DESPEJADO").toUpperCase();

    return {
      hasData: true,
      settlementName: settlement.name || "Asentamiento",
      tier: settlement.tier || "REFUGIO",
      date: `Día ${settlement.currentDay ?? 1}, Mes ${settlement.currentMonth ?? 1}, Año ${settlement.currentYear ?? 1000}`,
      day: settlement.currentDay ?? 1,
      month: settlement.currentMonth ?? 1,
      year: settlement.currentYear ?? 1000,
      time: formattedTime,
      tick: gameTime,
      season: settlement.season ?? "Verano",
      seasonIcon: SEASON_ICONS[seasonUpper] ?? "🍂",
      weather: settlement.weather ?? "Despejado",
      weatherIcon: WEATHER_ICONS[weatherUpper] ?? "☀️",
    };
  }, [settlement]);

  return {
    isOpen,
    toggle,
    close,
    worldData,
  };
}

export default useWorldInfo;
