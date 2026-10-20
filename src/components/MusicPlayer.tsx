"use client";

import { useRef, useState } from "react";

const VIDEO_ID = "rFZHOHl-L8A";

// Fica no layout, então a música continua tocando ao trocar de página.
export function MusicPlayer() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const func = playing ? "pauseVideo" : "playVideo";
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: "" }), "*");
    setPlaying(!playing);
  }

  return (
    <div className="fixed inset-x-0 bottom-[3.75rem] z-30 px-3 sm:bottom-3 sm:left-auto sm:right-3 sm:w-72 sm:px-0">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card/95 p-2 shadow backdrop-blur">
        <iframe
          ref={frame}
          title="Música de fundo"
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?enablejsapi=1&playsinline=1&loop=1&playlist=${VIDEO_ID}`}
          allow="autoplay; encrypted-media"
          className="aspect-video w-24 shrink-0 rounded-lg border-0"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-muted">🎵 Música de fundo</span>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar música" : "Tocar música"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
        >
          {playing ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
}
