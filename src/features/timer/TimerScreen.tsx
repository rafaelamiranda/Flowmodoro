"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Field, inputCls, Modal } from "@/components/ui";
import { TREE_WITHER_THRESHOLD_MS } from "@/lib/constants";
import { formatClock, formatDuration } from "@/lib/format";
import { requestNotificationPermission, useNotificationPermission } from "@/lib/notifications";
import { STAGE_LABELS, stageForFocus } from "@/features/forest/growth";
import { speciesForTask } from "@/features/forest/species";
import { TreeSvg } from "@/features/forest/TreeSvg";
import { useSettings } from "@/features/settings/store";
import { TaskForm } from "@/features/tasks/TaskForm";
import { useTasks } from "@/features/tasks/store";
import { elapsedSince, viewOf } from "./engine";
import { useTimer } from "./store";
import { useNow } from "./useNow";

const LABEL = { idle: "Ocioso", focus: "Foco", break: "Pausa" } as const;

export function TimerScreen() {
  const timer = useTimer((s) => s.timer);
  const ready = useTimer((s) => s.ready);
  const selected = useTimer((s) => s.selected);
  const { start, stop, cancel, skipBreak, extend, select: choose } = useTimer.getState();
  const tasks = useTasks((s) => s.tasks);
  const tasksReady = useTasks((s) => s.ready);
  const addTask = useTasks((s) => s.add);
  const notificationsOn = useSettings((s) => s.settings.notifications);

  const [creating, setCreating] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const perm = useNotificationPermission();

  const active = timer.phase !== "idle";
  const now = useNow(250, active);

  const activeTasks = tasks.filter((t) => !t.archived);
  const currentId = timer.taskId ?? selected;
  const currentTask = tasks.find((t) => t.id === currentId);
  const canStart = activeTasks.some((t) => t.id === selected);

  const handleStart = () => {
    if (canStart) start(selected);
  };

  // Atalhos: Espaço inicia/para, Esc pede para cancelar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const interactive = el?.closest("input, textarea, select, button, a, [role=dialog]");
      if (e.code === "Space" && !interactive && !e.repeat) {
        e.preventDefault();
        if (timer.phase === "focus") stop();
        else if (timer.phase === "idle") handleStart();
      } else if (e.key === "Escape" && timer.phase === "focus" && !confirmCancel) {
        setConfirmCancel(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.phase, canStart, selected, confirmCancel]);

  if (!ready || !tasksReady || (active && now === 0)) return <p className="py-20 text-center text-muted">Carregando…</p>;

  const view = viewOf(timer, now);
  const elapsed = view.phase === "focus" ? view.elapsedMs : 0;
  const species = currentTask ? speciesForTask(currentTask.id) : "carvalho";
  const stage = view.phase === "focus" ? stageForFocus(elapsed) : view.phase === "break" ? stageForFocus(view.focusMs) : 0;
  const over = view.phase === "break" && view.over;
  const clock = view.phase === "focus" ? formatClock(view.elapsedMs) : view.phase === "break" ? formatClock(view.remainingMs) : "00:00";
  const stateLabel = over ? "Pausa encerrada" : LABEL[view.phase];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 bg-sky text-center">
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            view.phase === "focus" ? "bg-primary text-primary-fg" : view.phase === "break" ? "bg-earth text-white" : "bg-soft text-muted"
          }`}
        >
          {stateLabel}
        </span>

        <TreeSvg
          species={species}
          stage={stage as 0 | 1 | 2 | 3 | 4}
          sway={view.phase === "focus"}
          className="h-52 w-52 sm:h-64 sm:w-64"
          title={`${STAGE_LABELS[stage]}`}
        />

        <div className="text-6xl font-bold tabular-nums tracking-tight sm:text-7xl" aria-hidden={active}>
          {clock}
        </div>
        <p className="sr-only" role="timer">{`${stateLabel} ${clock}`}</p>

        {currentTask && active && (
          <p className="text-sm text-muted">
            <span aria-hidden>{currentTask.emoji || "🌲"}</span> {currentTask.name}
            {view.phase === "focus" && <> · {STAGE_LABELS[stage]}</>}
          </p>
        )}
        {view.phase === "break" && (
          <p className="text-sm text-muted">
            {over ? "Descanso acabou. Pronto para outro foco?" : `Pausa gerada por ${formatDuration(view.focusMs)} de foco`}
          </p>
        )}
        {view.phase === "focus" && elapsedSince(timer.phaseStartedAt ?? now, now) < TREE_WITHER_THRESHOLD_MS && (
          <p className="text-xs text-muted">Cancelar antes de 5 min faz a árvore murchar.</p>
        )}
      </Card>

      {view.phase === "idle" && (
        <Card className="flex flex-col gap-3">
          {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <span className="text-4xl" aria-hidden>📝</span>
              <p className="font-semibold">Crie uma tarefa para começar</p>
              <p className="text-sm text-muted">Cada foco fica ligado a uma tarefa, assim você vê onde seu tempo vai.</p>
              <Button variant="primary" onClick={() => setCreating(true)}>+ Nova tarefa</Button>
            </div>
          ) : (
            <>
              <Field label="Em que você vai focar?">
                <div className="flex gap-2">
                  <select className={inputCls} value={canStart ? selected : ""} onChange={(e) => choose(e.target.value)}>
                    <option value="" disabled>Selecione uma tarefa…</option>
                    {activeTasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.emoji ? `${t.emoji} ` : ""}{t.name}</option>
                    ))}
                  </select>
                  <Button onClick={() => setCreating(true)} aria-label="Criar nova tarefa">+</Button>
                </div>
              </Field>
              <Button variant="primary" className="min-h-14 text-base" disabled={!canStart} onClick={handleStart}>
                🌱 Iniciar foco <kbd className="hidden rounded bg-black/15 px-1.5 text-xs sm:inline">Espaço</kbd>
              </Button>
              {!canStart && <p className="text-center text-xs text-muted">Selecione uma tarefa para iniciar.</p>}
            </>
          )}
        </Card>
      )}

      {view.phase === "focus" && (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button variant="primary" className="min-h-14 text-base" onClick={stop}>
            ⏹ Parar e descansar <kbd className="hidden rounded bg-black/15 px-1.5 text-xs sm:inline">Espaço</kbd>
          </Button>
          <Button className="min-h-14" onClick={() => setConfirmCancel(true)}>Cancelar</Button>
        </div>
      )}

      {view.phase === "break" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {over ? (
            <>
              <Button variant="primary" className="min-h-14" onClick={() => start(timer.taskId ?? selected)}>🌱 Iniciar novo foco</Button>
              <Button className="min-h-14" onClick={skipBreak}>Encerrar</Button>
            </>
          ) : (
            <>
              <Button className="min-h-14" onClick={extend}>+1 min de pausa</Button>
              <Button variant="primary" className="min-h-14" onClick={skipBreak}>Pular pausa</Button>
            </>
          )}
        </div>
      )}

      {view.phase === "idle" && notificationsOn && perm === "default" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>🔔 Quer um aviso quando a pausa terminar, mesmo com a aba em segundo plano?</span>
          <Button onClick={() => void requestNotificationPermission()}>Ativar avisos</Button>
        </Card>
      )}
      {view.phase === "idle" && perm === "denied" && notificationsOn && (
        <p className="text-center text-xs text-muted">Avisos do navegador bloqueados — o som continuará tocando. <Link className="underline" href="/configuracoes">Ajustes</Link></p>
      )}

      <Modal open={creating} title="Nova tarefa" onClose={() => setCreating(false)}>
        <TaskForm
          submitLabel="Criar e selecionar"
          onCancel={() => setCreating(false)}
          onSubmit={async (v) => {
            const t = await addTask(v);
            choose(t.id);
            setCreating(false);
          }}
        />
      </Modal>

      <Modal open={confirmCancel && timer.phase === "focus"} title="Cancelar sessão?" onClose={() => setConfirmCancel(false)}>
        <p className="mb-4 text-sm">
          {elapsed < TREE_WITHER_THRESHOLD_MS
            ? "Cancelando agora sua árvore vai murchar e ficará registrada como perdida."
            : "Cancelar descarta o foco e a árvore fica registrada como perdida. Para salvar a árvore, use “Parar e descansar”."}
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmCancel(false)}>Continuar focando</Button>
          <Button variant="danger" onClick={() => { cancel(); setConfirmCancel(false); }}>Cancelar sessão</Button>
        </div>
      </Modal>
    </div>
  );
}
