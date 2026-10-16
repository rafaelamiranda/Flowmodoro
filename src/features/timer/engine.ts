import { calcBreak } from "@/lib/calcBreak";
import { BREAK_EXTEND_MS } from "@/lib/constants";
import type { ActiveTimer, TimerSettings } from "@/lib/types";

export const IDLE_TIMER: ActiveTimer = {
  phase: "idle",
  taskId: null,
  sessionId: null,
  phaseStartedAt: null,
  breakEndsAt: null,
  focusMs: 0,
  breakMs: 0,
  focusStartedAt: null,
};

/** Tempo decorrido em ms, nunca negativo (relógio recuado = 0). */
export function elapsedSince(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt);
}

export function startFocus(taskId: string, sessionId: string, now: number): ActiveTimer {
  return { ...IDLE_TIMER, phase: "focus", taskId, sessionId, phaseStartedAt: now, focusStartedAt: now };
}

export type StopResult = {
  /** Próximo estado do timer (pausa ou idle). */
  timer: ActiveTimer;
  focusMs: number;
  breakMs: number;
};

/** Para o foco; entra em pausa se houver pausa calculada e autoBreak ligado. */
export function stopFocus(
  timer: ActiveTimer,
  settings: TimerSettings,
  now: number,
  autoBreak = true,
): StopResult {
  if (timer.phase !== "focus" || timer.phaseStartedAt === null) {
    return { timer, focusMs: 0, breakMs: 0 };
  }
  const focusMs = elapsedSince(timer.phaseStartedAt, now);
  const breakMs = calcBreak(focusMs, settings.factor, settings.minBreakMs, settings.maxBreakMs);
  if (breakMs === 0 || !autoBreak) {
    return { timer: IDLE_TIMER, focusMs, breakMs };
  }
  return {
    timer: { ...timer, phase: "break", phaseStartedAt: now, breakEndsAt: now + breakMs, focusMs, breakMs },
    focusMs,
    breakMs,
  };
}

export function extendBreak(timer: ActiveTimer, ms = BREAK_EXTEND_MS): ActiveTimer {
  if (timer.phase !== "break" || timer.breakEndsAt === null) return timer;
  return { ...timer, breakEndsAt: timer.breakEndsAt + ms, breakMs: timer.breakMs + ms };
}

export function breakRemainingMs(timer: ActiveTimer, now: number): number {
  if (timer.phase !== "break" || timer.breakEndsAt === null) return 0;
  return Math.max(0, timer.breakEndsAt - now);
}

export function isBreakOver(timer: ActiveTimer, now: number): boolean {
  return timer.phase === "break" && timer.breakEndsAt !== null && now >= timer.breakEndsAt;
}

/** Quanto da pausa foi realmente usado (limitado ao previsto, mais extensões). */
export function breakTakenMs(timer: ActiveTimer, now: number): number {
  if (timer.phase !== "break" || timer.phaseStartedAt === null || timer.breakEndsAt === null) return 0;
  const end = Math.min(now, timer.breakEndsAt);
  return Math.max(0, end - timer.phaseStartedAt);
}

/**
 * Normaliza um timer restaurado (refresh, aba reaberta, relógio alterado).
 * - foco com início no futuro (relógio recuado): reancora em `now`.
 * - pausa com início no futuro: reancora preservando a duração.
 */
export function normalize(timer: ActiveTimer, now: number): ActiveTimer {
  if (timer.phase === "focus" && timer.phaseStartedAt !== null && timer.phaseStartedAt > now) {
    return { ...timer, phaseStartedAt: now, focusStartedAt: now };
  }
  if (timer.phase === "break" && timer.phaseStartedAt !== null && timer.breakEndsAt !== null && timer.phaseStartedAt > now) {
    const len = timer.breakEndsAt - timer.phaseStartedAt;
    return { ...timer, phaseStartedAt: now, breakEndsAt: now + len };
  }
  return timer;
}

export type TimerView =
  | { phase: "idle" }
  | { phase: "focus"; elapsedMs: number }
  | { phase: "break"; remainingMs: number; focusMs: number; over: boolean };

export function viewOf(timer: ActiveTimer, now: number): TimerView {
  if (timer.phase === "focus" && timer.phaseStartedAt !== null) {
    return { phase: "focus", elapsedMs: elapsedSince(timer.phaseStartedAt, now) };
  }
  if (timer.phase === "break") {
    return { phase: "break", remainingMs: breakRemainingMs(timer, now), focusMs: timer.focusMs, over: isBreakOver(timer, now) };
  }
  return { phase: "idle" };
}
