import { create } from "zustand";
import { playSound, unlockAudio } from "@/lib/audio";
import { newId } from "@/lib/id";
import { notify } from "@/lib/notifications";
import { readJSON, readString, writeJSON, writeString } from "@/lib/storage";
import type { ActiveTimer } from "@/lib/types";
import { speciesForTask } from "@/features/forest/species";
import { useSettings, timerSettingsOf } from "@/features/settings/store";
import { useSessions } from "@/features/stats/sessionsStore";
import { useTasks } from "@/features/tasks/store";
import {
  IDLE_TIMER, breakTakenMs, elapsedSince, extendBreak, isBreakOver, normalize, startFocus, stopFocus,
} from "./engine";

export const TIMER_KEY = "flowmodoro:timer";
const LAST_TASK_KEY = "flowmodoro:last-task";
const NOTIFIED_KEY = "flowmodoro:break-notified";

type State = {
  timer: ActiveTimer;
  ready: boolean;
  /** Tarefa escolhida no seletor (lembrada entre sessões). */
  selected: string;
  select: (id: string) => void;
  /** Mensagem para a região aria-live. */
  announcement: string;
  load: () => void;
  /** Relê o timer do storage (outra aba mudou). */
  syncFromStorage: () => void;
  start: (taskId: string) => void;
  stop: () => void;
  cancel: () => void;
  skipBreak: () => void;
  extend: () => void;
  /** Dispara som/notificação uma única vez quando a pausa zera. */
  checkBreakOver: () => void;
};

const readTimer = (): ActiveTimer => {
  const t = readJSON<ActiveTimer>(TIMER_KEY);
  return t && ["idle", "focus", "break"].includes(t.phase) ? normalize({ ...IDLE_TIMER, ...t }, Date.now()) : IDLE_TIMER;
};

export const useTimer = create<State>((set, get) => {
  const setTimer = (timer: ActiveTimer) => {
    writeJSON(TIMER_KEY, timer);
    set({ timer });
  };

  /** Fecha a pausa em andamento registrando o tempo realmente usado. */
  const finalizeBreak = () => {
    const { timer } = get();
    if (timer.phase !== "break" || !timer.sessionId) return;
    void useSessions.getState().patch(timer.sessionId, { breakTakenMs: breakTakenMs(timer, Date.now()) });
  };

  return {
    timer: IDLE_TIMER,
    ready: false,
    selected: "",
    select: (id) => {
      writeString(LAST_TASK_KEY, id);
      set({ selected: id });
    },
    announcement: "",

    load: () => {
      set({ timer: readTimer(), ready: true, selected: readString(LAST_TASK_KEY) ?? "" });
    },

    syncFromStorage: () => set({ timer: readTimer() }),

    start: (taskId) => {
      unlockAudio();
      const { timer } = get();
      if (timer.phase === "focus") return;
      if (!useTasks.getState().tasks.some((t) => t.id === taskId)) return;
      finalizeBreak();
      set({ announcement: "" });
      setTimer(startFocus(taskId, newId(), Date.now()));
    },

    stop: () => {
      const { timer } = get();
      if (timer.phase !== "focus" || !timer.taskId || !timer.sessionId || timer.focusStartedAt === null) return;
      const now = Date.now();
      const settings = useSettings.getState().settings;
      const res = stopFocus(timer, timerSettingsOf(settings), now, settings.autoBreak);
      void useSessions.getState().save({
        id: timer.sessionId,
        taskId: timer.taskId,
        startedAt: timer.focusStartedAt,
        endedAt: now,
        focusMs: res.focusMs,
        breakMs: res.breakMs,
        breakTakenMs: 0,
        status: "completed",
        treeSpecies: speciesForTask(timer.taskId),
      });
      setTimer(res.timer);
      if (res.timer.phase === "break" && settings.breakStartSound) playSound(settings.sound, settings.volume);
    },

    cancel: () => {
      const { timer } = get();
      if (timer.phase !== "focus" || !timer.taskId || !timer.sessionId || timer.focusStartedAt === null) return;
      const now = Date.now();
      void useSessions.getState().save({
        id: timer.sessionId,
        taskId: timer.taskId,
        startedAt: timer.focusStartedAt,
        endedAt: now,
        focusMs: elapsedSince(timer.focusStartedAt, now),
        breakMs: 0,
        breakTakenMs: 0,
        status: "cancelled",
        treeSpecies: speciesForTask(timer.taskId),
      });
      setTimer(IDLE_TIMER);
    },

    skipBreak: () => {
      finalizeBreak();
      set({ announcement: "" });
      setTimer(IDLE_TIMER);
    },

    extend: () => {
      const { timer } = get();
      if (timer.phase !== "break" || isBreakOver(timer, Date.now())) return;
      setTimer(extendBreak(timer));
    },

    checkBreakOver: () => {
      const { timer } = get();
      if (!isBreakOver(timer, Date.now()) || timer.breakEndsAt === null) return;
      const key = String(timer.breakEndsAt);
      const run = () => {
        if (readString(NOTIFIED_KEY) === key) return;
        writeString(NOTIFIED_KEY, key);
        const settings = useSettings.getState().settings;
        const msg = "A pausa acabou. Hora de um novo foco!";
        set({ announcement: msg });
        playSound(settings.sound, settings.volume);
        if (settings.notifications) notify("Pausa encerrada 🌱", msg);
        if (settings.autoNextFocus && timer.taskId) get().start(timer.taskId);
      };
      // Web Lock evita disparo duplicado entre abas.
      if (typeof navigator !== "undefined" && navigator.locks) {
        void navigator.locks.request("flowmodoro-break-over", run);
      } else {
        run();
      }
    },
  };
});

