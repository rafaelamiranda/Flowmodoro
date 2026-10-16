import { TREE_STAGES_MS } from "@/lib/constants";

export const STAGE_LABELS = ["Semente", "Broto", "Muda", "Árvore", "Árvore completa"] as const;

/** 0 semente · 1 broto · 2 muda · 3 árvore · 4 completa */
export function stageForFocus(focusMs: number): 0 | 1 | 2 | 3 | 4 {
  let stage = 0;
  TREE_STAGES_MS.forEach((t, i) => {
    if (focusMs >= t) stage = i;
  });
  return stage as 0 | 1 | 2 | 3 | 4;
}
