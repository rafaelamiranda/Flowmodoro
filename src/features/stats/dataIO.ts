import type { Session, Task } from "@/lib/types";
import type { Settings } from "@/features/settings/store";

export type Backup = {
  app: "flowmodoro";
  version: 1;
  exportedAt: number;
  tasks: Task[];
  sessions: Session[];
  settings?: Partial<Settings>;
};

export function buildBackup(tasks: Task[], sessions: Session[], settings?: Settings): Backup {
  return { app: "flowmodoro", version: 1, exportedAt: Date.now(), tasks, sessions, settings };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function parseTask(v: unknown): Task | null {
  if (!isObj(v) || typeof v.id !== "string" || typeof v.name !== "string" || !v.name.trim()) return null;
  return {
    id: v.id,
    name: v.name,
    color: typeof v.color === "string" ? v.color : "#2f855a",
    emoji: typeof v.emoji === "string" && v.emoji ? v.emoji : undefined,
    archived: v.archived === true,
    createdAt: isNum(v.createdAt) ? v.createdAt : Date.now(),
  };
}

function parseSession(v: unknown): Session | null {
  if (!isObj(v) || typeof v.id !== "string" || typeof v.taskId !== "string" || !isNum(v.startedAt) || !isNum(v.focusMs)) {
    return null;
  }
  return {
    id: v.id,
    taskId: v.taskId,
    startedAt: v.startedAt,
    endedAt: isNum(v.endedAt) ? v.endedAt : null,
    focusMs: Math.max(0, v.focusMs),
    breakMs: isNum(v.breakMs) ? Math.max(0, v.breakMs) : 0,
    breakTakenMs: isNum(v.breakTakenMs) ? Math.max(0, v.breakTakenMs) : 0,
    status: v.status === "cancelled" ? "cancelled" : "completed",
    treeSpecies: typeof v.treeSpecies === "string" ? v.treeSpecies : "carvalho",
  };
}

export type ParseResult =
  | { ok: true; backup: { tasks: Task[]; sessions: Session[]; settings?: Partial<Settings> }; skipped: number }
  | { ok: false; error: string };

/** Valida o JSON de backup na fronteira; descarta registros inválidos e conta quantos. */
export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
  if (!isObj(data) || data.app !== "flowmodoro" || !Array.isArray(data.tasks) || !Array.isArray(data.sessions)) {
    return { ok: false, error: "Este arquivo não parece um backup do Flowmodoro." };
  }
  const tasks = data.tasks.map(parseTask);
  const sessions = data.sessions.map(parseSession);
  const okTasks = tasks.filter((t): t is Task => t !== null);
  const okSessions = sessions.filter((s): s is Session => s !== null);
  return {
    ok: true,
    backup: { tasks: okTasks, sessions: okSessions, settings: isObj(data.settings) ? (data.settings as Partial<Settings>) : undefined },
    skipped: tasks.length - okTasks.length + (sessions.length - okSessions.length),
  };
}

function csvCell(v: string | number): string {
  const s = String(v);
  // Evita injeção de fórmulas em planilhas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function sessionsToCsv(sessions: Session[], tasks: Task[]): string {
  const name = new Map(tasks.map((t) => [t.id, t.name]));
  const head = ["id", "tarefa", "inicio", "fim", "foco_min", "pausa_min", "pausa_usada_min", "status", "especie"];
  const min = (ms: number) => (ms / 60_000).toFixed(2);
  const rows = sessions.map((s) => [
    s.id,
    name.get(s.taskId) ?? "(removida)",
    new Date(s.startedAt).toISOString(),
    s.endedAt ? new Date(s.endedAt).toISOString() : "",
    min(s.focusMs),
    min(s.breakMs),
    min(s.breakTakenMs),
    s.status === "completed" ? "concluida" : "cancelada",
    s.treeSpecies,
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function download(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob(["﻿".slice(mime.includes("csv") ? 0 : 1) + content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
