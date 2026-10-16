"use client";

import { useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { notifyDataChanged } from "@/lib/channel";
import { repository } from "@/lib/repository";
import { buildBackup, download, parseBackup, sessionsToCsv } from "@/features/stats/dataIO";
import { useSessions } from "@/features/stats/sessionsStore";
import { useTasks } from "@/features/tasks/store";
import { useSettings } from "./store";

export function DataSection() {
  const tasks = useTasks((s) => s.tasks);
  const sessions = useSessions((s) => s.sessions);
  const settings = useSettings((s) => s.settings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const stamp = () => new Date().toISOString().slice(0, 10);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const res = parseBackup(await file.text());
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    if (mode === "replace" && !window.confirm("Substituir TODOS os dados atuais pelo backup?")) return;
    const data = { tasks: res.backup.tasks, sessions: res.backup.sessions };
    await (mode === "replace" ? repository.replaceAll(data) : repository.mergeAll(data));
    if (res.backup.settings) useSettings.getState().replace(res.backup.settings);
    await Promise.all([useTasks.getState().load(), useSessions.getState().load()]);
    notifyDataChanged();
    setMsg({
      ok: true,
      text: `Importado: ${data.tasks.length} tarefas e ${data.sessions.length} sessões${res.skipped ? ` (${res.skipped} registros inválidos ignorados)` : ""}.`,
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Dados</h2>
      <p className="text-sm text-muted">Tudo fica salvo só neste navegador. Exporte backups de vez em quando.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => download(`flowmodoro-${stamp()}.json`, JSON.stringify(buildBackup(tasks, sessions, settings), null, 2), "application/json")}>
          Exportar JSON
        </Button>
        <Button onClick={() => download(`flowmodoro-sessoes-${stamp()}.csv`, sessionsToCsv(sessions, tasks), "text/csv")}>
          Exportar CSV
        </Button>
      </div>
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1 font-medium">Importar backup (JSON)</legend>
        <label className="flex items-center gap-2"><input type="radio" name="mode" checked={mode === "merge"} onChange={() => setMode("merge")} /> Mesclar com os dados atuais</label>
        <label className="flex items-center gap-2"><input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} /> Substituir tudo</label>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => void onFile(e.target.files?.[0])} className="text-sm file:mr-3 file:min-h-11 file:rounded-2xl file:border-0 file:bg-soft file:px-4 file:font-semibold file:text-fg" aria-label="Arquivo de backup" />
      </fieldset>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-primary" : "text-danger"}`}>{msg.text}</p>}
    </Card>
  );
}
