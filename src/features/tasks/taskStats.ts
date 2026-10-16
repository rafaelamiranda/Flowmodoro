import type { Session } from "@/lib/types";

export type TaskTotals = { focusMs: number; sessions: number; lastAt: number | null };

/** Totais por tarefa; só sessões concluídas contam como tempo focado. */
export function totalsByTask(sessions: Session[]): Map<string, TaskTotals> {
  const map = new Map<string, TaskTotals>();
  for (const s of sessions) {
    const cur = map.get(s.taskId) ?? { focusMs: 0, sessions: 0, lastAt: null };
    if (s.status === "completed") {
      cur.focusMs += s.focusMs;
      cur.sessions += 1;
    }
    const at = s.endedAt ?? s.startedAt;
    cur.lastAt = cur.lastAt === null ? at : Math.max(cur.lastAt, at);
    map.set(s.taskId, cur);
  }
  return map;
}
