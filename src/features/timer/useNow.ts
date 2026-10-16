import { useEffect, useState } from "react";

/**
 * Retorna 0 até o primeiro tick no cliente (evita ler o relógio durante o prerender).
 * Re-renderiza a cada `intervalMs`. O intervalo serve só para atualizar a tela:
 * o tempo é sempre derivado de Date.now() e de timestamps persistidos.
 */
export function useNow(intervalMs = 250, enabled = true): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs, enabled]);
  return now;
}
