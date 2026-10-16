"use client";

import { useMemo, useState } from "react";
import { Button, Card, EmptyState, inputCls } from "@/components/ui";
import { formatDuration, percent } from "@/lib/format";
import { useTasks } from "@/features/tasks/store";
import {
  filterSessions, focusPerDay, rangeFor, rankByTask, startOfDay, streak, summarize, type Range, type RangeId,
} from "./aggregate";
import { DayBars, DonutChart } from "./Charts";
import { SessionTable } from "./SessionTable";
import { useSessions } from "./sessionsStore";

const PERIODS: { id: RangeId; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "year", label: "Ano" },
  { id: "custom", label: "Personalizado" },
];

const toInput = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fromInput = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

export function StatsScreen() {
  const sessions = useSessions((s) => s.sessions);
  const ready = useSessions((s) => s.ready);
  const tasks = useTasks((s) => s.tasks);
  const [period, setPeriod] = useState<RangeId>("7d");
  const [taskId, setTaskId] = useState("");
  // null = padrão (últimos 7 dias); evita ler o relógio durante o prerender.
  const [fromRaw, setFrom] = useState<string | null>(null);
  const [toRaw, setTo] = useState<string | null>(null);
  const from = fromRaw ?? (ready ? toInput(Date.now() - 6 * 86_400_000) : "");
  const to = toRaw ?? (ready ? toInput(Date.now()) : "");

  const range: Range = useMemo(() => {
    if (!ready) return { from: 0, to: 0 };
    const now = Date.now();
    if (period !== "custom") return rangeFor(period, now);
    const f = startOfDay(fromInput(from));
    const t = new Date(fromInput(to));
    t.setDate(t.getDate() + 1);
    return { from: Math.min(f, t.getTime() - 86_400_000), to: Math.max(t.getTime(), f + 86_400_000) };
  }, [period, from, to, ready]);

  const filtered = useMemo(() => filterSessions(sessions, range, taskId || null), [sessions, range, taskId]);
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const ranking = useMemo(() => rankByTask(filtered), [filtered]);
  const perDay = useMemo(() => focusPerDay(filtered, range), [filtered, range]);
  const streakDays = useMemo(() => (ready ? streak(sessions, Date.now()) : 0), [sessions, ready]);
  const taskOf = (id: string) => tasks.find((t) => t.id === id);
  const slices = ranking.map((r) => ({ name: taskOf(r.taskId)?.name ?? "Removida", value: r.focusMs, color: taskOf(r.taskId)?.color ?? "#999" }));
  const top = ranking[0];

  const cards: { label: string; value: string }[] = [
    { label: "Tempo total de foco", value: formatDuration(summary.totalFocusMs) },
    { label: "Sessões", value: String(summary.sessions) },
    { label: "Sessão média", value: formatDuration(summary.avgMs) },
    { label: "Maior sessão", value: formatDuration(summary.maxMs) },
    { label: "Total de pausas", value: formatDuration(summary.totalBreakMs) },
    { label: "Árvores salvas / perdidas", value: `🌳 ${summary.saved} / 🥀 ${summary.lost}` },
    { label: "Sequência de dias", value: `🔥 ${streakDays} ${streakDays === 1 ? "dia" : "dias"}` },
  ];

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      <Card className="flex flex-col gap-3">
        <div role="group" aria-label="Período" className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <Button key={p.id} variant={period === p.id ? "primary" : "secondary"} aria-pressed={period === p.id} className="min-h-9 px-3" onClick={() => setPeriod(p.id)}>
              {p.label}
            </Button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label className="flex flex-col gap-1">De<input type="date" className={inputCls} value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
            <label className="flex flex-col gap-1">Até<input type="date" className={inputCls} value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
          Tarefa
          <select className={inputCls} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">Todas as tarefas</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.emoji ? `${t.emoji} ` : ""}{t.name}{t.archived ? " (arquivada)" : ""}</option>)}
          </select>
        </label>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState emoji="📊" title="Sem sessões neste período">
          Faça um foco, ou mude o período/filtro, para ver seus números aqui.
        </EmptyState>
      ) : (
        <>
          {top && !taskId && (
            <p className="rounded-2xl bg-soft px-4 py-3 text-sm">
              Você mais focou em <strong>{taskOf(top.taskId)?.emoji} {taskOf(top.taskId)?.name ?? "tarefa removida"}</strong>:{" "}
              {formatDuration(top.focusMs)} ({percent(top.focusMs, summary.totalFocusMs)} do total).
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label} className="p-3 sm:p-4">
                <dt className="text-xs text-muted">{c.label}</dt>
                <dd className="mt-1 text-lg font-bold sm:text-xl">{c.value}</dd>
              </Card>
            ))}
          </dl>

          <Card>
            <h2 className="mb-3 font-semibold">Ranking por tempo focado</h2>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted">Nenhum foco concluído no período.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {ranking.map((r, i) => {
                  const t = taskOf(r.taskId);
                  return (
                    <li key={r.taskId}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{i + 1}. {t?.emoji} {t?.name ?? "Tarefa removida"}</span>
                        <span className="shrink-0 text-muted">{formatDuration(r.focusMs)} · {percent(r.focusMs, summary.totalFocusMs)}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-soft" role="presentation">
                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, r.share * 100)}%`, background: t?.color ?? "#999" }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="mb-2 font-semibold">Distribuição por tarefa</h2>
              {slices.length ? (
                <>
                  <DonutChart data={slices} />
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {slices.map((s) => (
                      <li key={s.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: s.color }} />{s.name}</li>
                    ))}
                  </ul>
                </>
              ) : <p className="text-sm text-muted">Sem dados.</p>}
            </Card>
            <Card>
              <h2 className="mb-2 font-semibold">Foco por dia</h2>
              <DayBars data={perDay} />
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 font-semibold">Histórico</h2>
            <SessionTable sessions={filtered} tasks={tasks} />
          </Card>
        </>
      )}
    </div>
  );
}
