export type SoundId = "bell" | "drop" | "marimba";

export const SOUNDS: { id: SoundId; label: string }[] = [
  { id: "bell", label: "Sino" },
  { id: "drop", label: "Gota" },
  { id: "marimba", label: "Marimba" },
];

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Chame dentro de um gesto do usuário (clique/tecla) para liberar o autoplay. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

function tone(c: AudioContext, t: number, freq: number, dur: number, vol: number, type: OscillatorType = "sine") {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** volume: 0..1 */
export function playSound(id: SoundId, volume: number): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => {});
  const v = Math.min(1, Math.max(0, volume)) * 0.5;
  const t = c.currentTime + 0.02;
  switch (id) {
    case "bell":
      [880, 1320, 1760].forEach((f, i) => tone(c, t, f, 2.2 - i * 0.5, v / (i + 1)));
      tone(c, t + 0.9, 880, 1.8, v * 0.6);
      break;
    case "drop":
      [660, 990, 1320].forEach((f, i) => tone(c, t + i * 0.16, f, 0.5, v));
      break;
    case "marimba":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, t + i * 0.14, f, 0.7, v, "triangle"));
      break;
  }
}
