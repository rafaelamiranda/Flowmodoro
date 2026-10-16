"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Timer", icon: "⏱️" },
  { href: "/floresta", label: "Floresta", icon: "🌳" },
  { href: "/tarefas", label: "Tarefas", icon: "📝" },
  { href: "/estatisticas", label: "Estatísticas", icon: "📊" },
  { href: "/configuracoes", label: "Ajustes", icon: "⚙️" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur sm:static sm:border-t-0 sm:border-b"
    >
      <ul className="mx-auto flex max-w-5xl items-center justify-around gap-1 px-2 py-1 sm:justify-start sm:gap-2 sm:px-4 sm:py-2">
        <li className="mr-4 hidden text-lg font-bold text-primary sm:block">🌲 Flowmodoro</li>
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1 sm:flex-none">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-xs font-semibold sm:flex-row sm:gap-2 sm:text-sm ${
                  active ? "bg-soft text-primary" : "text-muted hover:bg-soft"
                }`}
              >
                <span aria-hidden>{it.icon}</span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
