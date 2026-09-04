import { useState } from "react";
import { api } from "../../app/api/client";

export function useAuth(onAuthenticated: () => void) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register" ? { email, username, password } : { email, password };
      const { data } = await api.post(endpoint, payload);
      const token = data.access_token as string;
      const player = data.player as { id: string; email: string; username: string };

      localStorage.setItem("access_token", token);
      localStorage.setItem("player", JSON.stringify(player));
      localStorage.setItem("playerId", player.id);
      // No auto-crear settlement: el StartScreen gestionará Nueva/Continuar Partida
      // Limpiar settlementId previo si existía de otro usuario
      // (se mantendrá hasta que el jugador elija partida en StartScreen)

      window.dispatchEvent(new CustomEvent("auth-changed"));
      onAuthenticated();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
  };
}

export default useAuth;
