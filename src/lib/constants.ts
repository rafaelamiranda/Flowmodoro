export const MINUTE = 60_000;

/** Foco menor que isso não gera pausa. */
export const MIN_FOCUS_FOR_BREAK_MS = MINUTE;

/** Cancelar antes disso murcha a árvore; marcos de crescimento em ms. */
export const TREE_WITHER_THRESHOLD_MS = 5 * MINUTE;
export const TREE_STAGES_MS = [0, 5 * MINUTE, 15 * MINUTE, 30 * MINUTE, 45 * MINUTE] as const;

export const BREAK_EXTEND_MS = MINUTE;

export const DEFAULT_TIMER_SETTINGS = {
  factor: 5,
  minBreakMs: MINUTE,
  maxBreakMs: 30 * MINUTE,
};
