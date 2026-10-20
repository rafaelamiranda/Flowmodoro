import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Nav } from "@/components/Nav";
import { RegisterSW } from "@/components/RegisterSW";
import { TimerRuntime } from "@/features/timer/TimerRuntime";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flowmodoro",
  description: "Foco livre, pausa proporcional e uma floresta que cresce com você.",
  applicationName: "Flowmodoro",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Flowmodoro" },
};

export const viewport: Viewport = {
  themeColor: "#2d6a3e",
  width: "device-width",
  initialScale: 1,
};

// Aplica o tema antes da hidratação para evitar flash.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('flowmodoro:settings')||'{}');var t=s.theme||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-xl focus:bg-card focus:p-2">
          Pular para o conteúdo
        </a>
        <Nav />
        <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-44 pt-5 sm:pb-24">
          {children}
        </main>
        <MusicPlayer />
        <TimerRuntime />
        <RegisterSW />
      </body>
    </html>
  );
}
