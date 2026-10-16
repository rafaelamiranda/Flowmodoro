import { describe, expect, it } from "vitest";
import type { Session } from "@/lib/types";
import { filterSessions, focusPerDay, rangeFor, rankByTask, streak, summarize } from "./aggregate";

const MIN = 60_000;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();
const day = (offset: number, h = 10) => new Date(2026, 5, 15 + offset, h).getTime();

let n = 0;
const mk = (taskId: string, startedAt: number, focusMin: number, status: Session["status"] = "completed"): Session => ({
  id: `s${n++}`, taskId, startedAt, endedAt: startedAt + focusMin * MIN, focusMs: focusMin * MIN,
  breakMs: (focusMin / 5) * MIN, breakTakenMs: (focusMin / 5) * MIN, status, treeSpecies: "carvalho",
});

describe("aggregate", () => {
  const sessions = [mk("a", day(0), 50), mk("b", day(0, 14), 25), mk("a", day(-1), 30), mk("b", day(-2), 20, "cancelled"), mk("a", day(-40), 60)];

  it("ranking por tarefa com porcentagem", () => {
    const r = rankByTask(sessions.filter((s) => s.startedAt > day(-10)));
    expect(r[0]).toMatchObject({ taskId: "a", focusMs: 80 * MIN, sessions: 2 });
    expect(r[1].taskId).toBe("b");
    expect(r[0].share + r[1].share).toBeCloseTo(1);
  });

  it("filtra por período e por tarefa", () => {
    expect(filterSessions(sessions, rangeFor("today", NOW))).toHaveLength(2);
    expect(filterSessions(sessions, rangeFor("7d", NOW))).toHaveLength(4);
    expect(filterSessions(sessions, rangeFor("30d", NOW), "a")).toHaveLength(2);
  });

  it("resumo ignora canceladas no tempo e conta perdidas", () => {
    const s = summarize(filterSessions(sessions, rangeFor("7d", NOW)));
    expect(s.totalFocusMs).toBe(105 * MIN);
    expect(s.sessions).toBe(3);
    expect(s.maxMs).toBe(50 * MIN);
    expect(s.avgMs).toBe(35 * MIN);
    expect(s.saved).toBe(3);
    expect(s.lost).toBe(1);
  });

  it("tempo por dia inclui dias zerados", () => {
    const range = rangeFor("7d", NOW);
    const d = focusPerDay(filterSessions(sessions, range), range);
    expect(d).toHaveLength(7);
    expect(d[6].focusMs).toBe(75 * MIN);
    expect(d[4].focusMs).toBe(0);
  });

  it("streak: dias consecutivos até hoje", () => {
    expect(streak(sessions, NOW)).toBe(2);
  });

  it("streak: hoje sem foco ainda conta a sequência de ontem", () => {
    expect(streak([mk("a", day(-1), 10), mk("a", day(-2), 10)], NOW)).toBe(2);
  });

  it("streak zero sem foco recente", () => {
    expect(streak([mk("a", day(-5), 10)], NOW)).toBe(0);
  });
});
