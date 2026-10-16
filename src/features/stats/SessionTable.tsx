"use client";

import { useState } from "react";
import { Button, Modal, inputCls } from "@/components/ui";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { Session, Task } from "@/lib/types";
import { useSessions } from "./sessionsStore";

export function SessionTable({ sessions, tasks }: { sessions: Session[]; tasks: Task[] }) {
  const { patch, remove } = useSessions();
  const [editing, setEditing] = useState<Session | null>(null);
  const [taskId, setTaskId] = useState("");
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [limit, setLimit] = useState(30);
  const name = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    return t ? `${t.emoji ? t.emoji + " " : ""}${t.name}` : "Tarefa removida";
  };
  const rows = [...sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">Histórico de sessões</caption>
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="py-2 pr-3">Data</th>
              <th scope="col" className="pr-3">Tarefa</th>
              <th scope="col" className="pr-3">Foco</th>
              <th scope="col" className="pr-3">Pausa</th>
              <th scope="col" className="pr-3">Status</th>
              <th scope="col"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(s.startedAt)}</td>
                <td className="pr-3">{name(s.taskId)}</td>
                <td className="pr-3 whitespace-nowrap">{formatDuration(s.focusMs)}</td>
                <td className="pr-3 whitespace-nowrap">{s.breakMs ? formatDuration(s.breakMs) : "—"}</td>
                <td className="pr-3 whitespace-nowrap">{s.status === "completed" ? "🌳 Salva" : "🥀 Perdida"}</td>
                <td className="whitespace-nowrap text-right">
                  <Button variant="ghost" className="min-h-9 px-2" onClick={() => { setEditing(s); setTaskId(s.taskId); }}>Editar</Button>
                  <Button variant="ghost" className="min-h-9 px-2 text-danger" onClick={() => setDeleting(s)}>Excluir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sessions.length > limit && (
        <div className="mt-3 text-center"><Button onClick={() => setLimit((l) => l + 30)}>Mostrar mais</Button></div>
      )}

      <Modal open={!!editing} title="Editar sessão" onClose={() => setEditing(null)}>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Tarefa</span>
          <select className={inputCls} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.emoji ? `${t.emoji} ` : ""}{t.name}{t.archived ? " (arquivada)" : ""}</option>)}
          </select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="primary" onClick={async () => { if (editing) await patch(editing.id, { taskId }); setEditing(null); }}>Salvar</Button>
        </div>
      </Modal>
      <Modal open={!!deleting} title="Excluir sessão?" onClose={() => setDeleting(null)}>
        <p className="mb-4 text-sm">A sessão de {deleting ? formatDuration(deleting.focusMs) : ""} será removida do histórico e da floresta.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => { if (deleting) await remove(deleting.id); setDeleting(null); }}>Excluir</Button>
        </div>
      </Modal>
    </>
  );
}
