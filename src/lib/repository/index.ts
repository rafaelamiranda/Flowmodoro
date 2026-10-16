import { dexieRepository } from "./dexie";
import type { Repository } from "./types";

/** Ponto único de troca da persistência. */
export const repository: Repository = dexieRepository;
export type { Repository, BackupData } from "./types";
