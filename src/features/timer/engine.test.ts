import { describe, expect, it } from "vitest";
import {
  IDLE_TIMER, breakRemainingMs, breakTakenMs, extendBreak, isBreakOver, normalize, startFocus, stopFocus, viewOf,
} from "./engine";

const MIN = 60_000;
const settings = { factor: 5, minBreakMs: MIN, maxBreakMs: 30 * MIN };
const T0 = 1_700_000_000_000;

describe("engine", () => {
  it("foco → pausa proporcional (50 min → 10 min)", () => {
    const f = startFocus("t1", "s1", T0);
    const r = stopFocus(f, settings, T0 + 50 * MIN);
    expect(r.focusMs).toBe(50 * MIN);
    expect(r.breakMs).toBe(10 * MIN);
    expect(r.timer.phase).toBe("break");
    expect(r.timer.breakEndsAt).toBe(T0 + 60 * MIN);
  });

  it("foco curto volta para idle", () => {
    const r = stopFocus(startFocus("t1", "s1", T0), settings, T0 + 30_000);
    expect(r.timer).toEqual(IDLE_TIMER);
    expect(r.breakMs).toBe(0);
  });

  it("autoBreak desligado volta para idle mas informa a pausa", () => {
    const r = stopFocus(startFocus("t1", "s1", T0), settings, T0 + 25 * MIN, false);
    expect(r.timer.phase).toBe("idle");
    expect(r.breakMs).toBe(5 * MIN);
  });

  it("refresh no meio do foco não distorce o tempo (depende só do timestamp)", () => {
    const f = startFocus("t1", "s1", T0);
    const restored = JSON.parse(JSON.stringify(f));
    expect(viewOf(normalize(restored, T0 + 12 * MIN), T0 + 12 * MIN)).toEqual({ phase: "focus", elapsedMs: 12 * MIN });
  });

  it("pausa que expirou com o app fechado é detectada", () => {
    const { timer } = stopFocus(startFocus("t1", "s1", T0), settings, T0 + 25 * MIN);
    const later = T0 + 25 * MIN + 5 * MIN + 1;
    expect(isBreakOver(timer, later)).toBe(true);
    expect(breakRemainingMs(timer, later)).toBe(0);
    expect(breakTakenMs(timer, later)).toBe(5 * MIN);
  });

  it("estender pausa soma 1 min", () => {
    const { timer } = stopFocus(startFocus("t1", "s1", T0), settings, T0 + 25 * MIN);
    const ext = extendBreak(timer);
    expect(ext.breakEndsAt).toBe(timer.breakEndsAt! + MIN);
    expect(ext.breakMs).toBe(6 * MIN);
  });

  it("pular pausa: tempo usado é parcial", () => {
    const { timer } = stopFocus(startFocus("t1", "s1", T0), settings, T0 + 25 * MIN);
    expect(breakTakenMs(timer, T0 + 25 * MIN + 2 * MIN)).toBe(2 * MIN);
  });

  it("relógio recuado: foco reancora e nunca fica negativo", () => {
    const f = startFocus("t1", "s1", T0 + 10 * MIN);
    const n = normalize(f, T0);
    expect(n.phaseStartedAt).toBe(T0);
    expect(viewOf(f, T0)).toEqual({ phase: "focus", elapsedMs: 0 });
  });

  it("relógio recuado: pausa reancora preservando a duração", () => {
    const { timer } = stopFocus(startFocus("t1", "s1", T0), settings, T0 + 25 * MIN);
    const n = normalize(timer, T0);
    expect(n.breakEndsAt! - n.phaseStartedAt!).toBe(5 * MIN);
  });

  it("extendBreak/stopFocus fora da fase correta são no-op", () => {
    expect(extendBreak(IDLE_TIMER)).toBe(IDLE_TIMER);
    expect(stopFocus(IDLE_TIMER, settings, T0).timer).toBe(IDLE_TIMER);
  });
});
