import { describe, expect, it } from "vitest";
import { calcBreak } from "./calcBreak";

const MIN = 60_000;

describe("calcBreak", () => {
  it("50 min com fator 5 → 10 min", () => expect(calcBreak(50 * MIN, 5, MIN, 30 * MIN)).toBe(10 * MIN));
  it("25 min com fator 5 → 5 min", () => expect(calcBreak(25 * MIN, 5, MIN, 30 * MIN)).toBe(5 * MIN));
  it("alterar o fator muda o resultado", () => expect(calcBreak(50 * MIN, 4, MIN, 30 * MIN)).toBe(12.5 * MIN));
  it("aceita fator decimal", () => expect(calcBreak(30 * MIN, 2.5, MIN, 30 * MIN)).toBe(12 * MIN));
  it("foco < 1 min não gera pausa", () => expect(calcBreak(59_999, 5, MIN, 30 * MIN)).toBe(0));
  it("foco de exatamente 1 min respeita a pausa mínima", () => expect(calcBreak(MIN, 5, MIN, 30 * MIN)).toBe(MIN));
  it("aplica o mínimo", () => expect(calcBreak(2 * MIN, 5, 3 * MIN, 30 * MIN)).toBe(3 * MIN));
  it("aplica o máximo", () => expect(calcBreak(300 * MIN, 5, MIN, 30 * MIN)).toBe(30 * MIN));
  it("fator < 1 é tratado como 1", () => expect(calcBreak(10 * MIN, 0.2, MIN, 30 * MIN)).toBe(10 * MIN));
  it("fator NaN é tratado como 1", () => expect(calcBreak(10 * MIN, NaN, MIN, 30 * MIN)).toBe(10 * MIN));
  it("max < min usa o min", () => expect(calcBreak(100 * MIN, 5, 10 * MIN, 5 * MIN)).toBe(10 * MIN));
});
