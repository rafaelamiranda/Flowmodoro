import { create } from "zustand";
import type { SoundId } from "@/lib/audio";
import { MINUTE } from "@/lib/constants";
import { readJSON, writeJSON } from "@/lib/storage";

export type Theme = "light" | "dark" | "system";

export type Settings = {
  factor: number;
  minBreakMin: number;
  maxBreakMin: number;
  sound: SoundId;
  volume: number; // 0..1
  breakStartSound: boolean;
  notifications: boolean;
  theme: Theme;
  autoBreak: boolean;
  autoNextFocus: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  factor: 5,
  minBreakMin: 1,
  maxBreakMin: 30,
  sound: "bell",
  volume: 0.7,
  breakStartSound: false,
  notifications: true,
  theme: "system",
  autoBreak: true,
  autoNextFocus: false,
};

export const SETTINGS_KEY = "flowmodoro:settings";

/** Valida e completa valores vindos do storage/backup. */
export function sanitizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  s.factor = Math.max(1, num(s.factor, 5));
  s.minBreakMin = Math.max(0, num(s.minBreakMin, 1));
  s.maxBreakMin = Math.max(s.minBreakMin, num(s.maxBreakMin, 30));
  s.volume = Math.min(1, Math.max(0, num(s.volume, 0.7)));
  if (!["bell", "drop", "marimba"].includes(s.sound)) s.sound = "bell";
  if (!["light", "dark", "system"].includes(s.theme)) s.theme = "system";
  return s;
}

export function timerSettingsOf(s: Settings) {
  return { factor: s.factor, minBreakMs: s.minBreakMin * MINUTE, maxBreakMs: s.maxBreakMin * MINUTE };
}

export function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

type State = {
  settings: Settings;
  load: () => void;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  replace: (s: Partial<Settings>) => void;
};

export const useSettings = create<State>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  load: () => set({ settings: sanitizeSettings(readJSON<Partial<Settings>>(SETTINGS_KEY)) }),
  update: (patch) => {
    const settings = sanitizeSettings({ ...get().settings, ...patch });
    writeJSON(SETTINGS_KEY, settings);
    set({ settings });
  },
  reset: () => get().replace(DEFAULT_SETTINGS),
  replace: (s) => {
    const settings = sanitizeSettings(s);
    writeJSON(SETTINGS_KEY, settings);
    set({ settings });
  },
}));
