import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flowmodoro",
    short_name: "Flowmodoro",
    description: "Foco livre, pausa proporcional e uma floresta que cresce com você.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0e4",
    theme_color: "#2d6a3e",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
