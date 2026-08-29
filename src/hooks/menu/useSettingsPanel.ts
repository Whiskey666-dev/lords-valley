import { useEffect, useState } from "react";

export type SettingsCategory = "graficos" | "teclado" | "guardado" | "cuenta" | "inicio" | "cerrar";

export interface CategoryInfo {
  id: SettingsCategory;
  label: string;
  icon: string;
}

export const SETTINGS_CATEGORIES: CategoryInfo[] = [
  { id: "graficos", label: "Gráficos", icon: "🖥️" },
  { id: "teclado", label: "Teclado", icon: "⌨️" },
  { id: "guardado", label: "Guardado", icon: "💾" },
  { id: "cuenta", label: "Cuenta", icon: "👤" },
  { id: "inicio", label: "Inicio", icon: "🏠" },
  { id: "cerrar", label: "Cerrar", icon: "⏻" },
];

export function useSettingsPanel(onClose: () => void) {
  const [category, setCategory] = useState<SettingsCategory>("graficos");

  // Ajustes de gráficos (mock local)
  const [fps, setFps] = useState("60");
  const [renderizado, setRenderizado] = useState("Media");
  const [sombras, setSombras] = useState("Media");
  const [liquidos, setLiquidos] = useState(true);
  const [particulas, setParticulas] = useState("Media");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleLiquidos = () => setLiquidos(v => !v);

  return {
    category,
    setCategory,
    fps,
    setFps,
    renderizado,
    setRenderizado,
    sombras,
    setSombras,
    liquidos,
    toggleLiquidos,
    particulas,
    setParticulas,
    categories: SETTINGS_CATEGORIES,
    currentCategory: SETTINGS_CATEGORIES.find(c => c.id === category),
  };
}

export default useSettingsPanel;
