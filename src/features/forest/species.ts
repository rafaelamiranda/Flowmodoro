export type Species = "carvalho" | "pinheiro" | "cerejeira" | "bétula" | "palmeira";

export const SPECIES: Species[] = ["carvalho", "pinheiro", "cerejeira", "bétula", "palmeira"];

export const SPECIES_LABEL: Record<Species, string> = {
  carvalho: "Carvalho",
  pinheiro: "Pinheiro",
  cerejeira: "Cerejeira",
  bétula: "Bétula",
  palmeira: "Palmeira",
};

/** Espécie estável a partir do id da tarefa. */
export function speciesForTask(taskId: string): Species {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) h = (h * 31 + taskId.charCodeAt(i)) >>> 0;
  return SPECIES[h % SPECIES.length];
}

export function isSpecies(v: string): v is Species {
  return (SPECIES as string[]).includes(v);
}
