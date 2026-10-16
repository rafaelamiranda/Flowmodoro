import { create } from "zustand";
import { notifyDataChanged } from "@/lib/channel";
import { repository } from "@/lib/repository";
import type { Session } from "@/lib/types";

type State = {
  sessions: Session[];
  ready: boolean;
  load: () => Promise<void>;
  save: (s: Session) => Promise<void>;
  patch: (id: string, patch: Partial<Session>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useSessions = create<State>((set, get) => ({
  sessions: [],
  ready: false,
  load: async () => {
    const sessions = await repository.listSessions();
    set({ sessions, ready: true });
  },
  save: async (s) => {
    await repository.putSession(s);
    const rest = get().sessions.filter((x) => x.id !== s.id);
    set({ sessions: [...rest, s].sort((a, b) => a.startedAt - b.startedAt) });
    notifyDataChanged();
  },
  patch: async (id, patch) => {
    let cur = get().sessions.find((s) => s.id === id);
    if (!cur) {
      // A sessão pode ter sido gravada por outra aba.
      await get().load();
      cur = get().sessions.find((s) => s.id === id);
      if (!cur) return;
    }
    await get().save({ ...cur, ...patch });
  },
  remove: async (id) => {
    await repository.deleteSession(id);
    set({ sessions: get().sessions.filter((s) => s.id !== id) });
    notifyDataChanged();
  },
}));
