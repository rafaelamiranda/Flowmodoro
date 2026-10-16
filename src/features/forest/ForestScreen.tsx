"use client";

import { useMemo, useState } from "react";
import { Button, Card, EmptyState, Modal } from "@/components/ui";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { Session } from "@/lib/types";
import { useSessions } from "@/features/stats/sessionsStore";
import { useTasks } from "@/features/tasks/store";
import { STAGE_LABELS, stageForFocus } from "./growth";
import { isSpecies, SPECIES_LABEL, speciesForTask } from "./species";
import { TreeSvg } from "./TreeSvg";

type Period = "day" | "week" | "month";
const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Hoje" },
  { id: "week", label: "7 dias" },
  { id: "month", label: "30 dias" },
];

function periodStart(p: Period): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === "week") d.setDate(d.getDate() - 6);
  if (p === "month") d.setDate(d.getDate() - 29);
  return d.getTime();
}

export function ForestScreen() {
  const sessions = useSessions((s) => s.sessions);
  const ready = useSessions((s) => s.ready);
  const tasks = useTasks((s) => s.tasks);
  const [period, setPeriod] = useState<Period>("week");
  const [selected, setSelected] = useState<Session | null>(null);

  const list = useMemo(() => {
    if (!ready) return [];
    const from = periodStart(period);
    return sessions.filter((s) => s.startedAt >= from).sort((a, b) => b.startedAt - a.startedAt);
  }, [sessions, period, ready]);

  const saved = list.filter((s) => s.status === "completed").length;
  const lost = list.length - saved;
  const taskOf = (s: Session) => tasks.find((t) => t.id === s.taskId);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Minha Floresta</h1>
          <p className="text-sm text-muted" aria-live="polite">
            🌳 {saved} {saved === 1 ? "árvore salva" : "árvores salvas"} · 🥀 {lost} {lost === 1 ? "perdida" : "perdidas"}
          </p>
        </div>
        <div role="group" aria-label="Período" className="flex gap-1 rounded-2xl bg-soft p-1">
          {PERIODS.map((p) => (
            <Button
              key={p.id}
              variant={period === p.id ? "primary" : "ghost"}
              aria-pressed={period === p.id}
              className="min-h-9 px-3"
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </header>

      {!ready ? null : list.length === 0 ? (
        <EmptyState emoji="🌱" title="Sua floresta está vazia">
          Complete um foco para plantar a primeira árvore neste período.
        </EmptyState>
      ) : (
        <Card className="bg-sky">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {list.map((s) => {
              const lostTree = s.status === "cancelled";
              const sp = isSpecies(s.treeSpecies) ? s.treeSpecies : speciesForTask(s.taskId);
              const t = taskOf(s);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(s)}
                    aria-label={`${lostTree ? "Árvore perdida" : SPECIES_LABEL[sp]} de ${t?.name ?? "tarefa removida"}, ${formatDuration(s.focusMs)}`}
                    className="group flex w-full flex-col items-center rounded-2xl p-1 transition hover:bg-card/60"
                  >
                    <TreeSvg species={sp} stage={stageForFocus(s.focusMs)} withered={lostTree} className="h-24 w-full" />
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: t?.color ?? "#999" }} />
                      {lostTree && <span aria-hidden>🥀</span>}
                      {formatDuration(s.focusMs)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal open={!!selected} title="Detalhes da árvore" onClose={() => setSelected(null)}>
        {selected && (() => {
          const t = taskOf(selected);
          const sp = isSpecies(selected.treeSpecies) ? selected.treeSpecies : speciesForTask(selected.taskId);
          const lostTree = selected.status === "cancelled";
          const stage = stageForFocus(selected.focusMs);
          return (
            <div className="flex flex-col items-center gap-3 text-center">
              <TreeSvg species={sp} stage={stage} withered={lostTree} sway className="h-44" title={SPECIES_LABEL[sp]} />
              <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-sm">
                <dt className="text-muted">Tarefa</dt>
                <dd>{t ? `${t.emoji ?? ""} ${t.name}` : "Tarefa removida"}</dd>
                <dt className="text-muted">Duração</dt>
                <dd>{formatDuration(selected.focusMs)}</dd>
                <dt className="text-muted">Quando</dt>
                <dd>{formatDateTime(selected.startedAt)}</dd>
                <dt className="text-muted">Espécie</dt>
                <dd>{SPECIES_LABEL[sp]} · {STAGE_LABELS[stage]}</dd>
                <dt className="text-muted">Status</dt>
                <dd>{lostTree ? "🥀 Perdida (cancelada)" : "🌳 Salva na floresta"}</dd>
              </dl>
              <Button variant="primary" onClick={() => setSelected(null)}>Fechar</Button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
