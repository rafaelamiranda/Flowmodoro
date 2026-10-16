import { create } from "zustand";
import { notifyDataChanged } from "@/lib/channel";
import { newId } from "@/lib/id";
import { repository } from "@/lib/repository";
import type { Task } from "@/lib/types";
import { useSessions } from "@/features/stats/sessionsStore";

export const TASK_COLORS = ["#2f855a", "#b7791f", "#c05621", "#2b6cb0", "#97266d", "#6b46c1", "#0f766e", "#7c6f5a"];

export type TaskInput = { name: string; color: string; emoji?: string };

type State = {
  tasks: Task[];
  ready: boolean;
  load: () => Promise<void>;
  add: (input: TaskInput) => Promise<Task>;
  update: (id: string, patch: Partial<TaskInput>) => Promise<void>;
  setArchived: (id: string, archived: boolean) => Promise<void>;
  /** Exclui a tarefa e, opcionalmente, suas sessões. */
  remove: (id: string, withSessions: boolean) => Promise<void>;
};

export const useTasks = create<State>((set, get) => ({
  tasks: [],
  ready: false,
  load: async () => {
    const tasks = await repository.listTasks();
    set({ tasks: tasks.sort((a, b) => a.createdAt - b.createdAt), ready: true });
  },
  add: async (input) => {
    const task: Task = {
      id: newId(),
      name: input.name.trim(),
      color: input.color,
      emoji: input.emoji?.trim() || undefined,
      archived: false,
      createdAt: Date.now(),
    };
    await repository.putTask(task);
    set({ tasks: [...get().tasks, task] });
    notifyDataChanged();
    return task;
  },
  update: async (id, patch) => {
    const cur = get().tasks.find((t) => t.id === id);
    if (!cur) return;
    const next: Task = {
      ...cur,
      ...patch,
      name: (patch.name ?? cur.name).trim(),
      emoji: patch.emoji !== undefined ? patch.emoji.trim() || undefined : cur.emoji,
    };
    await repository.putTask(next);
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
    notifyDataChanged();
  },
  setArchived: async (id, archived) => {
    const cur = get().tasks.find((t) => t.id === id);
    if (!cur) return;
    const next = { ...cur, archived };
    await repository.putTask(next);
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
    notifyDataChanged();
  },
  remove: async (id, withSessions) => {
    if (withSessions) {
      await repository.deleteSessionsByTask(id);
      await useSessions.getState().load();
    }
    await repository.deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
    notifyDataChanged();
  },
}));
