import type { Session } from "@/lib/types";

export type RangeId = "today" | "7d" | "30d" | "year" | "custom";
export type Range = { from: number; to: number };


export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Intervalo [from, to) em ms. `to` é exclusivo (início do dia seguinte ao último dia). */
export function rangeFor(id: Exclude<RangeId, "custom">, now: number): Range {
  const today = startOfDay(now);
  const next = (d: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + 1);
    return x.getTime();
  };
  const back = (days: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() - days);
    return x.getTime();
  };
  switch (id) {
    case "today": return { from: today, to: next(today) };
    case "7d": return { from: back(6), to: next(today) };
    case "30d": return { from: back(29), to: next(today) };
    case "year": return { from: new Date(new Date(now).getFullYear(), 0, 1).getTime(), to: next(today) };
  }
}

export function filterSessions(sessions: Session[], range: Range, taskId?: string | null): Session[] {
  return sessions.filter((s) => s.startedAt >= range.from && s.startedAt < range.to && (!taskId || s.taskId === taskId));
}

export type TaskRank = { taskId: string; focusMs: number; sessions: number; share: number };

/** Ranking por tempo focado (só sessões concluídas). */
export function rankByTask(sessions: Session[]): TaskRank[] {
  const map = new Map<string, { focusMs: number; sessions: number }>();
  let total = 0;
  for (const s of sessions) {
    if (s.status !== "completed") continue;
    const cur = map.get(s.taskId) ?? { focusMs: 0, sessions: 0 };
    cur.focusMs += s.focusMs;
    cur.sessions += 1;
    total += s.focusMs;
    map.set(s.taskId, cur);
  }
  return [...map.entries()]
    .map(([taskId, v]) => ({ taskId, ...v, share: total > 0 ? v.focusMs / total : 0 }))
    .sort((a, b) => b.focusMs - a.focusMs);
}

export type DayBucket = { dayStart: number; focusMs: number };

/** Um bucket por dia no intervalo (inclui dias zerados). */
export function focusPerDay(sessions: Session[], range: Range): DayBucket[] {
  const byDay = new Map<number, number>();
  for (const s of sessions) {
    if (s.status !== "completed") continue;
    const k = startOfDay(s.startedAt);
    byDay.set(k, (byDay.get(k) ?? 0) + s.focusMs);
  }
  const out: DayBucket[] = [];
  const d = new Date(range.from);
  d.setHours(0, 0, 0, 0);
  while (d.getTime() < range.to && out.length < 800) {
    out.push({ dayStart: d.getTime(), focusMs: byDay.get(d.getTime()) ?? 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export type Summary = {
  totalFocusMs: number;
  sessions: number;
  avgMs: number;
  maxMs: number;
  totalBreakMs: number;
  saved: number;
  lost: number;
};

export function summarize(sessions: Session[]): Summary {
  const done = sessions.filter((s) => s.status === "completed");
  const totalFocusMs = done.reduce((a, s) => a + s.focusMs, 0);
  return {
    totalFocusMs,
    sessions: done.length,
    avgMs: done.length ? totalFocusMs / done.length : 0,
    maxMs: done.reduce((a, s) => Math.max(a, s.focusMs), 0),
    totalBreakMs: done.reduce((a, s) => a + s.breakTakenMs, 0),
    saved: done.length,
    lost: sessions.length - done.length,
  };
}

/** Dias consecutivos com foco concluído, terminando hoje (ou ontem, se hoje ainda não teve). */
export function streak(sessions: Session[], now: number): number {
  const days = new Set(sessions.filter((s) => s.status === "completed").map((s) => startOfDay(s.startedAt)));
  const d = new Date(startOfDay(now));
  if (!days.has(d.getTime())) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(d.getTime())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

