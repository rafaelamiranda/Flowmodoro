import { MIN_FOCUS_FOR_BREAK_MS } from "./constants";

/**
 * Pausa proporcional ao foco: focusMs / factor, limitada a [minMs, maxMs].
 * Foco menor que 1 min não gera pausa. Fator inválido (<1 ou NaN) vira 1.
 */
export function calcBreak(focusMs: number, factor: number, minMs: number, maxMs: number): number {
  if (!Number.isFinite(focusMs) || focusMs < MIN_FOCUS_FOR_BREAK_MS) return 0;
  const f = Number.isFinite(factor) && factor >= 1 ? factor : 1;
  const hi = Math.max(minMs, maxMs);
  const raw = focusMs / f;
  return Math.round(Math.min(hi, Math.max(minMs, raw)));
}
