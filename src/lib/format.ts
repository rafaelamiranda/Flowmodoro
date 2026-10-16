const pad = (n: number) => String(n).padStart(2, "0");

/** 00:00 ou 1:02:03 — relógio do timer. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** "1h 05min", "25min", "40s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  const mins = Math.round(total / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${pad(m)}min` : `${m}min`;
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function percent(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";
}
