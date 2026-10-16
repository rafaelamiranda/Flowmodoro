"use client";

import { useEffect } from "react";
import { onDataChanged } from "@/lib/channel";
import { formatClock } from "@/lib/format";
import { applyTheme, useSettings } from "@/features/settings/store";
import { useSessions } from "@/features/stats/sessionsStore";
import { useTasks } from "@/features/tasks/store";
import { breakRemainingMs, isBreakOver } from "./engine";
import { TIMER_KEY, useTimer } from "./store";
import { useNow } from "./useNow";

/** Montado uma vez no layout: carrega dados, mantém título, alerta de fim de pausa e sincroniza abas. */
export function TimerRuntime() {
  const timer = useTimer((s) => s.timer);
  const announcement = useTimer((s) => s.announcement);
  const theme = useSettings((s) => s.settings.theme);
  const active = timer.phase !== "idle";
  const now = useNow(1000, active);

  // Bootstrap
  useEffect(() => {
    useSettings.getState().load();
    useTimer.getState().load();
    void useTasks.getState().load();
    void useSessions.getState().load();
    useTimer.getState().checkBreakOver(); // pausa que expirou com o app fechado

    const reloadData = () => {
      void useTasks.getState().load();
      void useSessions.getState().load();
    };
    const offData = onDataChanged(reloadData);
    const onStorage = (e: StorageEvent) => {
      if (e.key === TIMER_KEY) useTimer.getState().syncFromStorage();
      if (e.key === "flowmodoro:settings") useSettings.getState().load();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      offData();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Tema
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => applyTheme("system");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [theme]);

  // Fim da pausa: timeout agendado pelo timestamp + checagem ao voltar à aba.
  useEffect(() => {
    const check = () => useTimer.getState().checkBreakOver();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    let t: ReturnType<typeof setTimeout> | undefined;
    if (timer.phase === "break" && timer.breakEndsAt !== null) {
      const wait = Math.min(2 ** 31 - 1, Math.max(0, timer.breakEndsAt - Date.now()) + 30);
      t = setTimeout(check, wait);
    }
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      if (t) clearTimeout(t);
    };
  }, [timer]);

  // Rede de segurança: o tick de 1 s também verifica.
  useEffect(() => {
    if (timer.phase === "break") useTimer.getState().checkBreakOver();
  }, [now, timer.phase]);

  // Título da aba
  useEffect(() => {
    if (timer.phase !== "idle" && now === 0) return;
    let title = "Flowmodoro";
    if (timer.phase === "focus" && timer.phaseStartedAt !== null) {
      title = `🌱 ${formatClock(Math.max(0, now - timer.phaseStartedAt))} · Foco`;
    } else if (timer.phase === "break") {
      title = isBreakOver(timer, now) ? "⏰ Pausa acabou · Flowmodoro" : `☕ ${formatClock(breakRemainingMs(timer, now))} · Pausa`;
    }
    document.title = title;
  }, [timer, now]);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement}
    </div>
  );
}
