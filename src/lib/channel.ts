const NAME = "flowmodoro";

type Msg = { type: "data-changed" };

let channel: BroadcastChannel | null = null;
const get = () => {
  if (typeof BroadcastChannel === "undefined") return null;
  return (channel ??= new BroadcastChannel(NAME));
};

/** Avisa as outras abas que tarefas/sessões mudaram no IndexedDB. */
export function notifyDataChanged(): void {
  get()?.postMessage({ type: "data-changed" } satisfies Msg);
}

export function onDataChanged(cb: () => void): () => void {
  const ch = get();
  if (!ch) return () => {};
  const handler = (e: MessageEvent<Msg>) => e.data?.type === "data-changed" && cb();
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
