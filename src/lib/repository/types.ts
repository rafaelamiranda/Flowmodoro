import type { Session, Task } from "../types";

export type BackupData = { tasks: Task[]; sessions: Session[] };

/** Contrato da camada de dados. Troque a implementação para usar API/banco. */
export interface Repository {
  listTasks(): Promise<Task[]>;
  putTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  listSessions(): Promise<Session[]>;
  putSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
  deleteSessionsByTask(taskId: string): Promise<void>;
  /** Substitui tudo (restaurar backup). */
  replaceAll(data: BackupData): Promise<void>;
  /** Mescla por id (importar sem apagar). */
  mergeAll(data: BackupData): Promise<void>;
}
