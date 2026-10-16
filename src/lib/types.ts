export type Task = {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  archived: boolean;
  createdAt: number;
};

export type SessionStatus = "completed" | "cancelled";

export type Session = {
  id: string;
  taskId: string;
  startedAt: number;
  endedAt: number | null;
  focusMs: number;
  breakMs: number;
  breakTakenMs: number;
  status: SessionStatus;
  treeSpecies: string;
};

export type Phase = "idle" | "focus" | "break";

export type ActiveTimer = {
  phase: Phase;
  taskId: string | null;
  sessionId: string | null;
  phaseStartedAt: number | null;
  breakEndsAt: number | null;
  focusMs: number;
  breakMs: number;
  focusStartedAt: number | null;
};

export type TimerSettings = {
  factor: number;
  minBreakMs: number;
  maxBreakMs: number;
};
