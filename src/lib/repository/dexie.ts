import Dexie, { type EntityTable } from "dexie";
import type { Session, Task } from "../types";
import type { BackupData, Repository } from "./types";

class FlowDB extends Dexie {
  tasks!: EntityTable<Task, "id">;
  sessions!: EntityTable<Session, "id">;
  constructor() {
    super("flowmodoro");
    this.version(1).stores({ tasks: "id, archived", sessions: "id, taskId, startedAt" });
  }
}

let db: FlowDB | null = null;
const getDb = () => (db ??= new FlowDB());

export const dexieRepository: Repository = {
  listTasks: () => getDb().tasks.toArray(),
  async putTask(task) {
    await getDb().tasks.put(task);
  },
  async deleteTask(id) {
    await getDb().tasks.delete(id);
  },
  listSessions: () => getDb().sessions.orderBy("startedAt").toArray(),
  async putSession(session) {
    await getDb().sessions.put(session);
  },
  async deleteSession(id) {
    await getDb().sessions.delete(id);
  },
  async deleteSessionsByTask(taskId) {
    await getDb().sessions.where("taskId").equals(taskId).delete();
  },
  async replaceAll(data: BackupData) {
    const d = getDb();
    await d.transaction("rw", d.tasks, d.sessions, async () => {
      await d.tasks.clear();
      await d.sessions.clear();
      await d.tasks.bulkPut(data.tasks);
      await d.sessions.bulkPut(data.sessions);
    });
  },
  async mergeAll(data: BackupData) {
    const d = getDb();
    await d.transaction("rw", d.tasks, d.sessions, async () => {
      await d.tasks.bulkPut(data.tasks);
      await d.sessions.bulkPut(data.sessions);
    });
  },
};
