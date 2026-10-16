import { describe, expect, it } from "vitest";
import type { Session, Task } from "@/lib/types";
import { buildBackup, parseBackup, sessionsToCsv } from "./dataIO";

const task: Task = { id: "t1", name: "=Estudar", color: "#111", archived: false, createdAt: 1 };
const session: Session = {
  id: "s1", taskId: "t1", startedAt: 1_700_000_000_000, endedAt: 1_700_000_600_000, focusMs: 600_000,
  breakMs: 120_000, breakTakenMs: 60_000, status: "completed", treeSpecies: "pinheiro",
};

describe("dataIO", () => {
  it("round-trip do backup JSON", () => {
    const r = parseBackup(JSON.stringify(buildBackup([task], [session])));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.backup.tasks).toEqual([task]);
      expect(r.backup.sessions).toEqual([session]);
      expect(r.skipped).toBe(0);
    }
  });

  it("rejeita JSON inválido e arquivos de outro app", () => {
    expect(parseBackup("{oops").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ tasks: [], sessions: [] })).ok).toBe(false);
  });

  it("descarta registros inválidos e conta", () => {
    const r = parseBackup(JSON.stringify({ app: "flowmodoro", version: 1, tasks: [task, { id: 1 }], sessions: [session, null] }));
    expect(r.ok && r.skipped).toBe(2);
  });

  it("CSV escapa fórmulas e usa nome da tarefa", () => {
    const csv = sessionsToCsv([session], [task]);
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain("'=Estudar");
    expect(csv).toContain("10.00");
  });
});
