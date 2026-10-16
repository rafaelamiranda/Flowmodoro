"use client";

import { useMemo, useState } from "react";
import { Button, Card, EmptyState, Modal } from "@/components/ui";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { Task } from "@/lib/types";
import { useSessions } from "@/features/stats/sessionsStore";
import { useTimer } from "@/features/timer/store";
import { TaskForm } from "./TaskForm";
import { useTasks } from "./store";
import { totalsByTask } from "./taskStats";

export function TasksScreen() {
  const { tasks, ready, add, update, setArchived, remove } = useTasks();
  const sessions = useSessions((s) => s.sessions);
  const activeTaskId = useTimer((s) => s.timer.taskId);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const totals = useMemo(() => totalsByTask(sessions), [sessions]);
  const visible = tasks.filter((t) => t.archived === showArchived);
  const archivedCount = tasks.filter((t) => t.archived).length;
  const deletingCount = deleting ? sessions.filter((s) => s.taskId === deleting.id).length : 0;

  async function onDelete(withSessions: boolean) {
    if (!deleting) return;
    await remove(deleting.id, withSessions);
    setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowArchived((v) => !v)} aria-pressed={showArchived}>
            {showArchived ? "Ver ativas" : `Arquivadas (${archivedCount})`}
          </Button>
          <Button variant="primary" onClick={() => setCreating(true)}>+ Nova tarefa</Button>
        </div>
      </header>

      {!ready ? null : visible.length === 0 ? (
        <EmptyState emoji={showArchived ? "📦" : "🌱"} title={showArchived ? "Nada arquivado" : "Nenhuma tarefa ainda"}>
          {showArchived ? "Tarefas arquivadas aparecem aqui e podem ser restauradas." : "Crie sua primeira tarefa para começar a plantar árvores."}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((t) => {
            const tot = totals.get(t.id);
            return (
              <li key={t.id}>
                <Card className="flex h-full flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl"
                      style={{ background: `${t.color}30`, border: `2px solid ${t.color}` }}
                      aria-hidden
                    >
                      {t.emoji || "🌲"}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{t.name}</h2>
                      <p className="text-xs text-muted">
                        {formatDuration(tot?.focusMs ?? 0)} · {tot?.sessions ?? 0} {(tot?.sessions ?? 0) === 1 ? "sessão" : "sessões"}
                      </p>
                      <p className="text-xs text-muted">
                        Última atividade: {tot?.lastAt ? formatDateTime(tot.lastAt) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button className="min-h-9" onClick={() => setEditing(t)}>Editar</Button>
                    <Button className="min-h-9" onClick={() => void setArchived(t.id, !t.archived)} disabled={!t.archived && activeTaskId === t.id}>
                      {t.archived ? "Restaurar" : "Arquivar"}
                    </Button>
                    <Button className="min-h-9" variant="ghost" onClick={() => setDeleting(t)} disabled={activeTaskId === t.id}>
                      Excluir
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={creating} title="Nova tarefa" onClose={() => setCreating(false)}>
        <TaskForm submitLabel="Criar" onCancel={() => setCreating(false)} onSubmit={async (v) => { await add(v); setCreating(false); }} />
      </Modal>
      <Modal open={!!editing} title="Editar tarefa" onClose={() => setEditing(null)}>
        {editing && (
          <TaskForm
            initial={editing}
            submitLabel="Salvar"
            onCancel={() => setEditing(null)}
            onSubmit={async (v) => { await update(editing.id, { ...v, emoji: v.emoji ?? "" }); setEditing(null); }}
          />
        )}
      </Modal>
      <Modal open={!!deleting} title="Excluir tarefa" onClose={() => setDeleting(null)}>
        {deleting && (
          <div className="flex flex-col gap-3 text-sm">
            {deletingCount > 0 ? (
              <>
                <p>
                  <strong>{deleting.name}</strong> tem {deletingCount} {deletingCount === 1 ? "sessão registrada" : "sessões registradas"}.
                  Arquivar mantém o histórico e as árvores (recomendado).
                </p>
                <Button variant="primary" onClick={() => { void setArchived(deleting.id, true); setDeleting(null); }}>Arquivar (recomendado)</Button>
                <Button variant="danger" onClick={() => void onDelete(true)}>Excluir tarefa e sessões</Button>
              </>
            ) : (
              <>
                <p>Excluir <strong>{deleting.name}</strong>? Esta ação não pode ser desfeita.</p>
                <Button variant="danger" onClick={() => void onDelete(false)}>Excluir</Button>
              </>
            )}
            <Button onClick={() => setDeleting(null)}>Cancelar</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
